(function () {
  "use strict";

  var APP_VERSION = "0.1.0";
  var i18n = window.RSI18n;
  var store = window.RSStore;

  var data = null;
  var currentView = "today";
  var selectedMonth = { year: new Date().getFullYear(), month: new Date().getMonth() };
  var editingDate = null;
  var toastTimer = null;
  var confirmResolver = null;
  var formatters = {};
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  var elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function cacheElements() {
    [
      "todayWeekday", "todayDate", "todayForm", "todayHours", "todayHoursError",
      "todayTravel", "todayTravelError", "todayOther", "todayOtherError", "todayNote",
      "todayBaseDetail", "todayBase", "todayAllowanceRow", "todayAllowance",
      "todayTravelValue", "todayOtherValue", "todayPreviewTotal", "todayTotal",
      "todayHeroFormula", "todayDelete", "todaySave",
      "historyEmpty", "historyGroups",
      "monthPrev", "monthNext", "monthLabel", "monthTotal", "monthFormula", "monthDays",
      "monthHours", "monthBase", "monthAllowance", "monthTravel", "monthOther",
      "monthDayList", "monthEmpty",
      "firstRunHint", "currentRateValue", "currentRateUnit", "rateForm", "rateAmount",
      "rateAmountError", "rateDate", "rateDateError", "rateHistoryList", "rateHistoryEmpty",
      "allowanceToggle", "allowanceAmount", "allowanceError", "themeControl",
      "languageControl", "exportBtn", "importBtn", "importFile", "clearBtn", "appVersion",
      "dayDialog", "editorForm", "editorTitle", "editorRate", "editorClose", "editorHours",
      "editorHoursError", "editorTravel", "editorTravelError", "editorOther",
      "editorOtherError", "editorNote", "editorBaseDetail", "editorBase",
      "editorAllowanceRow", "editorAllowance", "editorTravelValue", "editorOtherValue",
      "editorTotal", "editorDelete", "editorSave",
      "confirmDialog", "confirmTitle", "confirmMessage", "confirmCancel", "confirmOk",
      "toast", "themeColorMeta"
    ].forEach(function (id) {
      elements[id] = byId(id);
    });
  }

  function pad2(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function isoFromDate(date) {
    return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
  }

  function todayISO() {
    return isoFromDate(new Date());
  }

  function dateFromISO(value) {
    if (!store.isValidDateKey(value)) return new Date();
    var parts = value.split("-");
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0, 0);
  }

  function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function round4(value) {
    return Math.round((value + Number.EPSILON) * 10000) / 10000;
  }

  function capitalizeFirst(value) {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function refreshFormatters() {
    var locale = data && data.settings.language === "en" ? "en-GB" : "hr-HR";
    formatters.currency = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    formatters.number = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2
    });
    formatters.inputNumber = new Intl.NumberFormat(locale, {
      useGrouping: false,
      maximumFractionDigits: 2
    });
    formatters.inputHours = new Intl.NumberFormat(locale, {
      useGrouping: false,
      maximumFractionDigits: 4
    });
    formatters.dateNumeric = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
    formatters.dateShort = new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit"
    });
    formatters.weekday = new Intl.DateTimeFormat(locale, {
      weekday: "long"
    });
    formatters.monthYear = new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric"
    });
    formatters.longDate = new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function formatCurrency(value) {
    var numeric = typeof value === "number" && isFinite(value) ? value : 0;
    return formatters.currency.format(numeric);
  }

  function formatNumber(value) {
    var numeric = typeof value === "number" && isFinite(value) ? value : 0;
    return formatters.number.format(numeric);
  }

  function formatInputNumber(value) {
    var numeric = typeof value === "number" && isFinite(value) ? value : 0;
    return formatters.inputNumber.format(numeric);
  }

  function formatInputHours(value) {
    var numeric = typeof value === "number" && isFinite(value) ? value : 0;
    return formatters.inputHours.format(numeric);
  }

  function formatDateNumeric(value) {
    return formatters.dateNumeric.format(dateFromISO(value));
  }

  function formatDateShort(value) {
    return formatters.dateShort.format(dateFromISO(value));
  }

  function formatWeekday(value) {
    return formatters.weekday.format(dateFromISO(value));
  }

  function formatMonthYear(year, month) {
    return formatters.monthYear.format(new Date(year, month, 1, 12));
  }

  function formatLongDate(value) {
    return capitalizeFirst(formatters.longDate.format(dateFromISO(value)));
  }

  function parseLocaleNumber(raw) {
    var value = String(raw == null ? "" : raw).trim();
    value = value.replace(/\s/g, "").replace(/\u00a0/g, "").replace(/\u202f/g, "").replace(/€/g, "");
    if (!value) return null;

    var comma = value.lastIndexOf(",");
    var dot = value.lastIndexOf(".");
    if (comma > -1 && dot > -1) {
      if (comma > dot) {
        value = value.replace(/\./g, "").replace(/,/g, ".");
      } else {
        value = value.replace(/,/g, "");
      }
    } else if (comma > -1) {
      value = value.replace(/,/g, ".");
    }

    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) return null;
    var parsed = Number(value);
    if (!isFinite(parsed) || parsed < 0) return null;
    return parsed;
  }

  function effectiveRate(dateISO) {
    var best = null;
    var rates = data.settings.rates;
    for (var i = 0; i < rates.length; i += 1) {
      if (rates[i].validFrom <= dateISO) {
        if (!best || rates[i].validFrom > best.validFrom) best = rates[i];
      }
    }
    return best ? best.amount : 0;
  }

  function getEntry(dateISO) {
    return data.days[dateISO] || null;
  }

  function breakdownFor(dateISO, entry) {
    var rate = effectiveRate(dateISO);
    var hours = entry && isFinite(entry.hours) ? entry.hours : 0;
    var base = round2(hours * rate);
    var allowance = data.settings.allowanceEnabled && hours > 0 ? round2(data.settings.allowanceAmount) : 0;
    var travel = round2(entry && isFinite(entry.travel) ? entry.travel : 0);
    var other = round2(entry && isFinite(entry.other) ? entry.other : 0);
    var total = round2(base + allowance + travel + other);
    return {
      rate: rate,
      base: base,
      allowance: allowance,
      travel: travel,
      other: other,
      total: total
    };
  }

  function persist() {
    if (store.save(data)) return true;
    toast(i18n.t("storageError"));
    return false;
  }

  function applyTheme() {
    var theme = data.settings.theme;
    if (theme === "auto") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
    var isDark = theme === "dark" || (theme === "auto" && darkQuery.matches);
    elements.themeColorMeta.setAttribute("content", isDark ? "#11140f" : "#f4f1e9");
  }

  function updateDocumentTitle() {
    var viewKeys = {
      today: "navToday",
      history: "navHistory",
      month: "navMonth",
      settings: "navSettings"
    };
    document.title = i18n.t("appName") + " — " + i18n.t(viewKeys[currentView] || "navToday");
  }

  function updateQuickChipLabels() {
    var chips = document.querySelectorAll("[data-quick]");
    for (var i = 0; i < chips.length; i += 1) {
      chips[i].setAttribute("aria-label", i18n.t("quickHoursAria", { hours: chips[i].getAttribute("data-hours") }));
    }
  }

  function applyLanguage() {
    i18n.setLanguage(data.settings.language);
    refreshFormatters();
    i18n.apply(document);
    updateQuickChipLabels();
    updateDocumentTitle();
  }

  function showView(name, options) {
    if (!data) return;
    currentView = name;
    var views = document.querySelectorAll(".view");
    for (var i = 0; i < views.length; i += 1) {
      views[i].hidden = views[i].getAttribute("data-view") !== name;
    }
    var tabs = document.querySelectorAll(".tab");
    for (var j = 0; j < tabs.length; j += 1) {
      var active = tabs[j].getAttribute("data-tab") === name;
      tabs[j].classList.toggle("is-active", active);
      if (active) {
        tabs[j].setAttribute("aria-current", "page");
      } else {
        tabs[j].removeAttribute("aria-current");
      }
    }
    updateDocumentTitle();
    if (!options || options.scroll !== false) {
      window.scrollTo(0, 0);
    }
  }

  function renderAll() {
    applyTheme();
    applyLanguage();
    renderToday(true);
    renderHistory();
    renderMonth();
    renderSettings();
    showView(currentView, { scroll: false });
  }

  function updateTodayDateLabels() {
    var iso = todayISO();
    elements.todayWeekday.textContent = formatWeekday(iso);
    elements.todayDate.textContent = formatDateNumeric(iso);
  }

  function updateTodayEntryControls() {
    var iso = todayISO();
    var hasEntry = Boolean(getEntry(iso));
    elements.todayDelete.hidden = !hasEntry;
    elements.todaySave.textContent = i18n.t(hasEntry ? "updateDay" : "saveDay");
  }

  function fillTodayForm() {
    var iso = todayISO();
    var entry = getEntry(iso);
    elements.todayHours.value = entry ? formatInputHours(entry.hours) : "";
    elements.todayTravel.value = entry ? formatInputNumber(entry.travel) : formatInputNumber(0);
    elements.todayOther.value = entry ? formatInputNumber(entry.other) : formatInputNumber(0);
    elements.todayNote.value = entry ? entry.note : "";
    elements.todayForm.dataset.entryDate = iso;
    clearFieldError(elements.todayHours, elements.todayHoursError);
    clearFieldError(elements.todayTravel, elements.todayTravelError);
    clearFieldError(elements.todayOther, elements.todayOtherError);
    updateTodayEntryControls();
    updateTodayPreview();
  }

  function readRawEntry(prefix) {
    var hoursInput = byId(prefix + "Hours");
    var travelInput = byId(prefix + "Travel");
    var otherInput = byId(prefix + "Other");
    var noteInput = byId(prefix + "Note");
    var hours = hoursInput.value.trim() === "" ? 0 : parseLocaleNumber(hoursInput.value);
    var travel = travelInput.value.trim() === "" ? 0 : parseLocaleNumber(travelInput.value);
    var other = otherInput.value.trim() === "" ? 0 : parseLocaleNumber(otherInput.value);
    return {
      hours: hours === null ? 0 : hours,
      travel: travel === null ? 0 : travel,
      other: other === null ? 0 : other,
      note: noteInput ? noteInput.value.trim() : ""
    };
  }

  function updatePreviewNumbers(prefix, values) {
    var iso = prefix === "editor" ? editingDate : todayISO();
    var breakdown = breakdownFor(iso, values);
    var hoursFormatted = formatNumber(values.hours);
    var detail = i18n.t("baseDetail", {
      hours: hoursFormatted,
      rate: formatCurrency(breakdown.rate)
    });

    byId(prefix + "BaseDetail").textContent = detail;
    byId(prefix + "Base").textContent = formatCurrency(breakdown.base);
    byId(prefix + "Allowance").textContent = formatCurrency(breakdown.allowance);
    byId(prefix + "TravelValue").textContent = formatCurrency(breakdown.travel);
    byId(prefix + "OtherValue").textContent = formatCurrency(breakdown.other);
    var totalText = formatCurrency(breakdown.total);
    if (prefix === "today") {
      elements.todayPreviewTotal.textContent = totalText;
    } else {
      byId(prefix + "Total").textContent = totalText;
    }
    byId(prefix + "AllowanceRow").hidden = !data.settings.allowanceEnabled;

    if (prefix === "today") {
      elements.todayTotal.textContent = totalText;
      elements.todayHeroFormula.textContent = i18n.t("heroFormula", {
        hours: hoursFormatted,
        rate: formatCurrency(breakdown.rate)
      });
    }

    var chips = document.querySelectorAll('[data-quick="' + prefix + '"]');
    for (var i = 0; i < chips.length; i += 1) {
      var chipHours = Number(chips[i].getAttribute("data-hours"));
      chips[i].classList.toggle("is-active", values.hours > 0 && chipHours === values.hours);
    }
  }

  function updateTodayPreview() {
    updatePreviewNumbers("today", readRawEntry("today"));
  }

  function updateEditorPreview() {
    if (!editingDate) return;
    updatePreviewNumbers("editor", readRawEntry("editor"));
  }

  function updatePreview(prefix) {
    if (prefix === "editor") {
      updateEditorPreview();
    } else {
      updateTodayPreview();
    }
  }

  function setFieldError(input, errorElement, key) {
    if (key) {
      input.setAttribute("aria-invalid", "true");
      errorElement.textContent = i18n.t(key);
      errorElement.hidden = false;
    } else {
      clearFieldError(input, errorElement);
    }
  }

  function clearFieldError(input, errorElement) {
    input.removeAttribute("aria-invalid");
    errorElement.textContent = "";
    errorElement.hidden = true;
  }

  function validateEntry(prefix) {
    var hoursInput = byId(prefix + "Hours");
    var travelInput = byId(prefix + "Travel");
    var otherInput = byId(prefix + "Other");
    var noteInput = byId(prefix + "Note");
    var hoursError = byId(prefix + "HoursError");
    var travelError = byId(prefix + "TravelError");
    var otherError = byId(prefix + "OtherError");
    var firstInvalid = null;
    var hoursRaw = hoursInput.value.trim();
    var travelRaw = travelInput.value.trim();
    var otherRaw = otherInput.value.trim();
    var hours = hoursRaw === "" ? 0 : parseLocaleNumber(hoursRaw);
    var travel = travelRaw === "" ? 0 : parseLocaleNumber(travelRaw);
    var other = otherRaw === "" ? 0 : parseLocaleNumber(otherRaw);

    if (hours === null) {
      setFieldError(hoursInput, hoursError, "hoursErrorNumber");
      firstInvalid = firstInvalid || hoursInput;
    } else if (Math.abs(hours * 4 - Math.round(hours * 4)) > 0.000001) {
      setFieldError(hoursInput, hoursError, "hoursErrorStep");
      firstInvalid = firstInvalid || hoursInput;
    } else {
      clearFieldError(hoursInput, hoursError);
    }

    if (travel === null) {
      setFieldError(travelInput, travelError, "travelError");
      firstInvalid = firstInvalid || travelInput;
    } else {
      clearFieldError(travelInput, travelError);
    }

    if (other === null) {
      setFieldError(otherInput, otherError, "otherError");
      firstInvalid = firstInvalid || otherInput;
    } else {
      clearFieldError(otherInput, otherError);
    }

    if (firstInvalid) {
      firstInvalid.focus();
      return null;
    }

    return {
      hours: round4(hours),
      travel: round2(travel),
      other: round2(other),
      note: noteInput.value.trim().slice(0, 500)
    };
  }

  function renderToday(forceFill) {
    updateTodayDateLabels();
    if (forceFill || elements.todayForm.dataset.entryDate !== todayISO()) {
      fillTodayForm();
    } else {
      updateTodayEntryControls();
      updateTodayPreview();
    }
  }

  function createHistoryChevron() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "history-chevron");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "m9 5 7 7-7 7");
    svg.appendChild(path);
    return svg;
  }

  function renderHistory() {
    var dates = Object.keys(data.days).sort().reverse();
    elements.historyGroups.innerHTML = "";
    elements.historyEmpty.hidden = dates.length > 0;
    if (!dates.length) return;

    var groups = {};
    var order = [];
    dates.forEach(function (dateISO) {
      var groupKey = dateISO.slice(0, 7);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
        order.push(groupKey);
      }
      groups[groupKey].push(dateISO);
    });

    order.forEach(function (groupKey) {
      var parts = groupKey.split("-");
      var group = document.createElement("section");
      group.className = "history-group";

      var title = document.createElement("h2");
      title.className = "group-title";
      title.textContent = formatMonthYear(Number(parts[0]), Number(parts[1]) - 1);
      group.appendChild(title);

      var card = document.createElement("div");
      card.className = "history-card";

      groups[groupKey].forEach(function (dateISO) {
        var entry = data.days[dateISO];
        var breakdown = breakdownFor(dateISO, entry);
        var row = document.createElement("button");
        row.type = "button";
        row.className = "history-row";
        row.setAttribute("data-date", dateISO);
        row.setAttribute("aria-label", i18n.t("editEntryAria", { date: formatLongDate(dateISO) }));

        var dateBlock = document.createElement("span");
        dateBlock.className = "history-date";
        var dateText = document.createElement("strong");
        dateText.textContent = formatDateShort(dateISO);
        var weekday = document.createElement("span");
        weekday.textContent = formatWeekday(dateISO);
        dateBlock.appendChild(dateText);
        dateBlock.appendChild(weekday);

        var hours = document.createElement("span");
        hours.className = "history-hours";
        hours.textContent = formatNumber(entry.hours) + " " + i18n.t("hourUnit");

        var total = document.createElement("span");
        total.className = "history-total";
        total.textContent = formatCurrency(breakdown.total);

        row.appendChild(dateBlock);
        row.appendChild(hours);
        row.appendChild(total);
        row.appendChild(createHistoryChevron());
        card.appendChild(row);
      });

      group.appendChild(card);
      elements.historyGroups.appendChild(group);
    });
  }

  function renderMonth() {
    elements.monthLabel.textContent = formatMonthYear(selectedMonth.year, selectedMonth.month);
    var prefix = selectedMonth.year + "-" + pad2(selectedMonth.month + 1);
    var dates = Object.keys(data.days).filter(function (dateISO) {
      return dateISO.indexOf(prefix) === 0;
    }).sort();

    var totals = {
      days: dates.length,
      hours: 0,
      base: 0,
      allowance: 0,
      travel: 0,
      other: 0,
      total: 0
    };

    elements.monthDayList.innerHTML = "";

    dates.forEach(function (dateISO) {
      var entry = data.days[dateISO];
      var breakdown = breakdownFor(dateISO, entry);
      totals.hours += entry.hours;
      totals.base += breakdown.base;
      totals.allowance += breakdown.allowance;
      totals.travel += breakdown.travel;
      totals.other += breakdown.other;
      totals.total += breakdown.total;

      var row = document.createElement("div");
      row.className = "mini-row";

      var dateBlock = document.createElement("span");
      dateBlock.className = "mini-date";
      dateBlock.textContent = dateFromISO(dateISO).getDate() + ".";
      var weekday = document.createElement("span");
      weekday.className = "mini-weekday";
      weekday.textContent = formatWeekday(dateISO);
      dateBlock.appendChild(weekday);

      var hours = document.createElement("span");
      hours.className = "mini-hours";
      hours.textContent = formatNumber(entry.hours) + " " + i18n.t("hourUnit");

      var total = document.createElement("span");
      total.className = "mini-total";
      total.textContent = formatCurrency(breakdown.total);

      row.appendChild(dateBlock);
      row.appendChild(hours);
      row.appendChild(total);
      elements.monthDayList.appendChild(row);
    });

    elements.monthDays.textContent = String(totals.days);
    elements.monthHours.textContent = formatNumber(totals.hours) + " " + i18n.t("hourUnit");
    elements.monthBase.textContent = formatCurrency(round2(totals.base));
    elements.monthAllowance.textContent = formatCurrency(round2(totals.allowance));
    elements.monthTravel.textContent = formatCurrency(round2(totals.travel));
    elements.monthOther.textContent = formatCurrency(round2(totals.other));
    elements.monthTotal.textContent = formatCurrency(round2(totals.total));
    elements.monthFormula.textContent = i18n.t("monthTotalHours", { hours: formatNumber(totals.hours) });
    elements.monthEmpty.hidden = dates.length > 0;
  }

  function createTrashIcon() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.7");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    ["M4 7h16", "M9 7V4h6v3", "M6.5 7l.8 13h9.4l.8-13", "M10 11v5M14 11v5"].forEach(function (d) {
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
    });
    return svg;
  }

  function renderSettings() {
    var rates = data.settings.rates;
    var current = effectiveRate(todayISO());
    elements.firstRunHint.hidden = rates.length > 0;

    if (!rates.length) {
      elements.currentRateValue.textContent = i18n.t("notSet");
      elements.currentRateUnit.hidden = true;
      elements.rateAmount.value = "";
    } else {
      elements.currentRateValue.textContent = formatCurrency(current);
      elements.currentRateUnit.hidden = false;
      elements.rateAmount.value = formatInputNumber(current);
    }

    if (!elements.rateDate.value || !rates.length) {
      elements.rateDate.value = todayISO();
    }

    elements.rateHistoryList.innerHTML = "";
    var sortedRates = rates.slice().sort(function (a, b) {
      return b.validFrom.localeCompare(a.validFrom);
    });

    sortedRates.forEach(function (rate) {
      var item = document.createElement("li");
      item.className = "rate-item";

      var main = document.createElement("div");
      main.className = "rate-item-main";

      var amount = document.createElement("span");
      amount.className = "rate-item-amount";
      amount.textContent = formatCurrency(rate.amount) + " / " + i18n.t("hourUnit");

      var date = document.createElement("span");
      date.className = "rate-item-date";
      date.textContent = i18n.t("rateFrom", { date: formatDateNumeric(rate.validFrom) });

      main.appendChild(amount);
      main.appendChild(date);

      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "rate-delete";
      remove.setAttribute("data-rate-id", rate.id);
      remove.setAttribute("aria-label", i18n.t("deleteRateAria", { date: formatDateNumeric(rate.validFrom) }));
      remove.appendChild(createTrashIcon());

      item.appendChild(main);
      item.appendChild(remove);
      elements.rateHistoryList.appendChild(item);
    });

    elements.rateHistoryEmpty.hidden = rates.length > 0;
    elements.allowanceToggle.checked = data.settings.allowanceEnabled;
    elements.allowanceAmount.value = formatInputNumber(data.settings.allowanceAmount);
    elements.allowanceError.hidden = true;
    elements.allowanceAmount.removeAttribute("aria-invalid");
    elements.rateAmountError.hidden = true;
    elements.rateAmount.removeAttribute("aria-invalid");
    elements.rateDateError.hidden = true;
    elements.rateDate.removeAttribute("aria-invalid");

    var themeRadios = elements.themeControl.querySelectorAll('input[name="theme"]');
    for (var i = 0; i < themeRadios.length; i += 1) {
      themeRadios[i].checked = themeRadios[i].value === data.settings.theme;
    }
    var languageRadios = elements.languageControl.querySelectorAll('input[name="language"]');
    for (var j = 0; j < languageRadios.length; j += 1) {
      languageRadios[j].checked = languageRadios[j].value === data.settings.language;
    }

    elements.appVersion.textContent = "v" + APP_VERSION;
  }

  function toast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      elements.toast.classList.remove("is-visible");
    }, 2500);
  }

  function syncModalState() {
    var open = elements.dayDialog.open || elements.confirmDialog.open;
    document.body.classList.toggle("modal-open", open);
  }

  function askConfirm(title, message, confirmLabel) {
    if (elements.confirmDialog.open) return Promise.resolve(false);
    elements.confirmTitle.textContent = title;
    elements.confirmMessage.textContent = message;
    elements.confirmOk.textContent = confirmLabel;
    return new Promise(function (resolve) {
      confirmResolver = resolve;
      elements.confirmDialog.showModal();
      syncModalState();
    });
  }

  function settleConfirm(result) {
    var resolver = confirmResolver;
    confirmResolver = null;
    if (elements.confirmDialog.open) elements.confirmDialog.close();
    syncModalState();
    if (resolver) resolver(result);
  }

  function fillEditorForm() {
    if (!editingDate) return;
    var entry = getEntry(editingDate);
    elements.editorTitle.textContent = formatLongDate(editingDate);
    elements.editorRate.textContent = i18n.t("rateForDate", {
      rate: formatCurrency(effectiveRate(editingDate))
    });
    elements.editorHours.value = entry ? formatInputHours(entry.hours) : "";
    elements.editorTravel.value = entry ? formatInputNumber(entry.travel) : formatInputNumber(0);
    elements.editorOther.value = entry ? formatInputNumber(entry.other) : formatInputNumber(0);
    elements.editorNote.value = entry ? entry.note : "";
    elements.editorDelete.hidden = !entry;
    elements.editorSave.textContent = i18n.t(entry ? "update" : "save");
    clearFieldError(elements.editorHours, elements.editorHoursError);
    clearFieldError(elements.editorTravel, elements.editorTravelError);
    clearFieldError(elements.editorOther, elements.editorOtherError);
    updateEditorPreview();
  }

  function openEditor(dateISO) {
    if (!store.isValidDateKey(dateISO)) return;
    editingDate = dateISO;
    fillEditorForm();
    elements.dayDialog.showModal();
    syncModalState();
  }

  function closeEditor() {
    if (elements.dayDialog.open) elements.dayDialog.close();
    syncModalState();
  }

  function saveToday(event) {
    event.preventDefault();
    var entry = validateEntry("today");
    if (!entry) return;
    var iso = todayISO();
    var existed = Boolean(getEntry(iso));
    data.days[iso] = entry;
    var saved = persist();
    fillTodayForm();
    renderHistory();
    renderMonth();
    if (saved) toast(i18n.t(existed ? "toastUpdated" : "toastSaved"));
  }

  function deleteToday() {
    var iso = todayISO();
    if (!getEntry(iso)) return;
    askConfirm(
      i18n.t("deleteDayTitle"),
      i18n.t("deleteDayMessage", { date: formatLongDate(iso) }),
      i18n.t("delete")
    ).then(function (confirmed) {
      if (!confirmed) return;
      delete data.days[iso];
      var saved = persist();
      fillTodayForm();
      renderHistory();
      renderMonth();
      if (saved) toast(i18n.t("toastDeleted"));
    });
  }

  function saveEditor(event) {
    event.preventDefault();
    if (!editingDate) return;
    var dateISO = editingDate;
    var entry = validateEntry("editor");
    if (!entry) return;
    data.days[dateISO] = entry;
    var saved = persist();
    closeEditor();
    editingDate = null;
    if (dateISO === todayISO()) {
      renderToday(true);
    } else {
      renderToday(false);
    }
    renderHistory();
    renderMonth();
    if (saved) toast(i18n.t("toastUpdated"));
  }

  function deleteEditorEntry() {
    if (!editingDate) return;
    var dateISO = editingDate;
    askConfirm(
      i18n.t("deleteDayTitle"),
      i18n.t("deleteDayMessage", { date: formatLongDate(dateISO) }),
      i18n.t("delete")
    ).then(function (confirmed) {
      if (!confirmed) return;
      delete data.days[dateISO];
      var saved = persist();
      closeEditor();
      editingDate = null;
      if (dateISO === todayISO()) {
        renderToday(true);
      } else {
        renderToday(false);
      }
      renderHistory();
      renderMonth();
      if (saved) toast(i18n.t("toastDeleted"));
    });
  }

  function deleteRate(rateId) {
    var rate = null;
    for (var i = 0; i < data.settings.rates.length; i += 1) {
      if (data.settings.rates[i].id === rateId) {
        rate = data.settings.rates[i];
        break;
      }
    }
    if (!rate) return;
    if (data.settings.rates.length <= 1) {
      toast(i18n.t("rateLastError"));
      return;
    }
    askConfirm(
      i18n.t("deleteRateTitle"),
      i18n.t("deleteRateMessage", { date: formatDateNumeric(rate.validFrom) }),
      i18n.t("delete")
    ).then(function (confirmed) {
      if (!confirmed) return;
      data.settings.rates = data.settings.rates.filter(function (item) {
        return item.id !== rateId;
      });
      var saved = persist();
      renderToday(false);
      renderHistory();
      renderMonth();
      renderSettings();
      if (saved) toast(i18n.t("rateDeleted"));
    });
  }

  function saveRate(event) {
    event.preventDefault();
    var rawAmount = elements.rateAmount.value.trim();
    var amount = rawAmount === "" ? null : parseLocaleNumber(rawAmount);
    var validFrom = elements.rateDate.value;
    var valid = true;

    if (amount === null) {
      setFieldError(elements.rateAmount, elements.rateAmountError, "rateInvalid");
      valid = false;
    } else if (round2(amount) <= 0) {
      setFieldError(elements.rateAmount, elements.rateAmountError, "ratePositive");
      valid = false;
    } else {
      clearFieldError(elements.rateAmount, elements.rateAmountError);
    }

    if (!store.isValidDateKey(validFrom)) {
      setFieldError(elements.rateDate, elements.rateDateError, "rateDateInvalid");
      valid = false;
    } else {
      clearFieldError(elements.rateDate, elements.rateDateError);
    }

    if (!valid) {
      if (elements.rateAmount.getAttribute("aria-invalid") === "true") {
        elements.rateAmount.focus();
      } else {
        elements.rateDate.focus();
      }
      return;
    }

    var rounded = round2(amount);
    var existing = null;
    data.settings.rates.forEach(function (rate) {
      if (rate.validFrom === validFrom) existing = rate;
    });

    if (existing) {
      existing.amount = rounded;
    } else {
      data.settings.rates.push({
        id: store.makeId(),
        amount: rounded,
        validFrom: validFrom
      });
    }
    data.settings.rates.sort(function (a, b) {
      return a.validFrom.localeCompare(b.validFrom);
    });

    var saved = persist();
    elements.rateDate.value = todayISO();
    renderToday(false);
    renderHistory();
    renderMonth();
    renderSettings();
    if (saved) toast(i18n.t("rateSaved"));
  }

  function saveAllowanceAmount() {
    var raw = elements.allowanceAmount.value.trim();
    var amount = raw === "" ? 0 : parseLocaleNumber(raw);
    if (amount === null) {
      setFieldError(elements.allowanceAmount, elements.allowanceError, "allowanceInvalid");
      return;
    }
    clearFieldError(elements.allowanceAmount, elements.allowanceError);
    data.settings.allowanceAmount = round2(amount);
    elements.allowanceAmount.value = formatInputNumber(data.settings.allowanceAmount);
    var saved = persist();
    updateTodayPreview();
    renderHistory();
    renderMonth();
    if (!saved) return;
  }

  function toggleAllowance() {
    data.settings.allowanceEnabled = elements.allowanceToggle.checked;
    var saved = persist();
    updateTodayPreview();
    renderHistory();
    renderMonth();
    if (!saved) return;
  }

  function exportData() {
    var payload = {
      app: "radni-sati",
      schemaVersion: store.schema,
      appVersion: APP_VERSION,
      exportedAt: new Date().toISOString(),
      data: data
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "radni-sati-" + todayISO() + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    toast(i18n.t("exportDone"));
  }

  function importDataFile(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast(i18n.t("importInvalid"));
      event.target.value = "";
      return;
    }

    file.text().then(function (text) {
      var parsed;
      try {
        parsed = JSON.parse(text);
      } catch (error) {
        toast(i18n.t("importInvalid"));
        return;
      }
      var imported = store.parseBackup(parsed);
      if (!imported) {
        toast(i18n.t("importInvalid"));
        return;
      }
      return askConfirm(
        i18n.t("importTitle"),
        i18n.t("importMessage"),
        i18n.t("importConfirm")
      ).then(function (confirmed) {
        if (!confirmed) return;
        data = imported;
        selectedMonth = { year: new Date().getFullYear(), month: new Date().getMonth() };
        currentView = "settings";
        var saved = store.save(data);
        applyLanguage();
        renderAll();
        showView("settings");
        toast(i18n.t(saved ? "importDone" : "storageError"));
      });
    }).catch(function () {
      toast(i18n.t("importInvalid"));
    }).then(function () {
      elements.importFile.value = "";
    });
  }

  function clearAllData() {
    askConfirm(
      i18n.t("clearTitle"),
      i18n.t("clearMessage"),
      i18n.t("clearConfirm")
    ).then(function (confirmed) {
      if (!confirmed) return;
      data = store.defaults();
      currentView = "settings";
      elements.rateDate.value = "";
      var saved = store.save(data);
      applyLanguage();
      renderAll();
      showView("settings");
      toast(i18n.t(saved ? "cleared" : "storageError"));
    });
  }

  function changeLanguage(language) {
    if (language !== "hr" && language !== "en") return;
    if (language === data.settings.language) return;
    data.settings.language = language;
    var saved = persist();
    applyLanguage();
    renderAll();
    showView(currentView, { scroll: false });
    if (!saved) return;
  }

  function changeTheme(theme) {
    if (theme !== "auto" && theme !== "light" && theme !== "dark") return;
    data.settings.theme = theme;
    applyTheme();
    persist();
  }

  function goToMonth(delta) {
    selectedMonth.month += delta;
    if (selectedMonth.month < 0) {
      selectedMonth.month = 11;
      selectedMonth.year -= 1;
    } else if (selectedMonth.month > 11) {
      selectedMonth.month = 0;
      selectedMonth.year += 1;
    }
    renderMonth();
  }

  function setQuickHours(prefix, hours) {
    var input = byId(prefix + "Hours");
    var error = byId(prefix + "HoursError");
    input.value = formatInputHours(hours);
    clearFieldError(input, error);
    updatePreview(prefix);
  }

  function wirePreviewInputs(prefix) {
    ["Hours", "Travel", "Other"].forEach(function (suffix) {
      var input = byId(prefix + suffix);
      var error = byId(prefix + suffix + "Error");
      input.addEventListener("input", function () {
        clearFieldError(input, error);
        updatePreview(prefix);
      });
    });
  }

  function bindEvents() {
    var tabs = document.querySelectorAll(".tab");
    for (var i = 0; i < tabs.length; i += 1) {
      tabs[i].addEventListener("click", function () {
        var target = this.getAttribute("data-tab");
        if (target === "today") {
          renderToday(false);
        }
        showView(target);
      });
    }

    elements.todayForm.addEventListener("submit", saveToday);
    elements.todayDelete.addEventListener("click", deleteToday);
    wirePreviewInputs("today");

    elements.historyGroups.addEventListener("click", function (event) {
      var row = event.target.closest("[data-date]");
      if (!row) return;
      openEditor(row.getAttribute("data-date"));
    });

    elements.monthPrev.addEventListener("click", function () { goToMonth(-1); });
    elements.monthNext.addEventListener("click", function () { goToMonth(1); });

    elements.rateForm.addEventListener("submit", saveRate);
    elements.rateAmount.addEventListener("input", function () {
      clearFieldError(elements.rateAmount, elements.rateAmountError);
    });
    elements.rateDate.addEventListener("change", function () {
      clearFieldError(elements.rateDate, elements.rateDateError);
    });
    elements.rateHistoryList.addEventListener("click", function (event) {
      var button = event.target.closest("[data-rate-id]");
      if (!button) return;
      deleteRate(button.getAttribute("data-rate-id"));
    });

    elements.allowanceToggle.addEventListener("change", toggleAllowance);
    elements.allowanceAmount.addEventListener("input", function () {
      clearFieldError(elements.allowanceAmount, elements.allowanceError);
    });
    elements.allowanceAmount.addEventListener("change", saveAllowanceAmount);

    elements.themeControl.addEventListener("change", function (event) {
      if (event.target && event.target.name === "theme") changeTheme(event.target.value);
    });
    elements.languageControl.addEventListener("change", function (event) {
      if (event.target && event.target.name === "language") changeLanguage(event.target.value);
    });

    elements.exportBtn.addEventListener("click", exportData);
    elements.importBtn.addEventListener("click", function () {
      elements.importFile.value = "";
      elements.importFile.click();
    });
    elements.importFile.addEventListener("change", importDataFile);
    elements.clearBtn.addEventListener("click", clearAllData);

    elements.editorForm.addEventListener("submit", saveEditor);
    elements.editorClose.addEventListener("click", closeEditor);
    elements.editorDelete.addEventListener("click", deleteEditorEntry);
    wirePreviewInputs("editor");

    elements.dayDialog.addEventListener("close", function () {
      editingDate = null;
      syncModalState();
    });
    elements.dayDialog.addEventListener("click", function (event) {
      if (event.target === elements.dayDialog) closeEditor();
    });

    elements.confirmCancel.addEventListener("click", function () { settleConfirm(false); });
    elements.confirmOk.addEventListener("click", function () { settleConfirm(true); });
    elements.confirmDialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      settleConfirm(false);
    });
    elements.confirmDialog.addEventListener("close", function () {
      if (confirmResolver) {
        var resolver = confirmResolver;
        confirmResolver = null;
        resolver(false);
      }
      syncModalState();
    });
    elements.confirmDialog.addEventListener("click", function (event) {
      if (event.target === elements.confirmDialog) settleConfirm(false);
    });

    var chips = document.querySelectorAll("[data-quick]");
    for (var j = 0; j < chips.length; j += 1) {
      chips[j].addEventListener("click", function () {
        setQuickHours(this.getAttribute("data-quick"), Number(this.getAttribute("data-hours")));
      });
    }

    var schemeListener = function () {
      if (data && data.settings.theme === "auto") applyTheme();
    };
    if (typeof darkQuery.addEventListener === "function") {
      darkQuery.addEventListener("change", schemeListener);
    } else if (typeof darkQuery.addListener === "function") {
      darkQuery.addListener(schemeListener);
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden || !data) return;
      if (currentView === "today") renderToday(false);
      updateTodayDateLabels();
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./sw.js?v=" + APP_VERSION).catch(function () {
        /* The app still works online if registration is unavailable. */
      });
    });
  }

  function init() {
    cacheElements();
    data = store.load();
    refreshFormatters();
    currentView = data.settings.rates.length ? "today" : "settings";
    bindEvents();
    applyTheme();
    applyLanguage();
    renderAll();
    showView(currentView);
    if (store.didLastLoadFail()) {
      window.setTimeout(function () {
        toast(i18n.t("loadError"));
      }, 350);
    }
    registerServiceWorker();
  }

  init();
}());
