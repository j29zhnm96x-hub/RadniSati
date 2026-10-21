(function () {
  "use strict";

  var KEY = "radni-sati:v1";
  var SCHEMA = 1;
  var lastLoadFailed = false;

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function round2(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function round4(value) {
    return Math.round((value + Number.EPSILON) * 10000) / 10000;
  }

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "rate-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
  }

  function isValidTime(value) {
    return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  function snapQuarter(value) {
    return Math.round(value * 4) / 4;
  }

  function isValidDateKey(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var parts = value.split("-");
    var year = Number(parts[0]);
    var month = Number(parts[1]);
    var day = Number(parts[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    var date = new Date(year, month - 1, day, 12, 0, 0, 0);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }

  function defaults() {
    return {
      schema: SCHEMA,
      settings: {
        language: "hr",
        theme: "auto",
        allowanceEnabled: true,
        allowanceAmount: 5,
        workStart: "08:00",
        plannedHours: 8,
        workDays: [1, 2, 3, 4, 5],
        rates: []
      },
      plans: {},
      closed: {},
      holidays: {},
      vacations: [],
      days: {}
    };
  }

  function sanitizeRate(raw, seenIds) {
    if (!isPlainObject(raw)) return null;
    if (typeof raw.amount !== "number" || !isFinite(raw.amount) || raw.amount < 0) return null;
    if (!isValidDateKey(raw.validFrom)) return null;
    var id = typeof raw.id === "string" && raw.id ? raw.id : makeId();
    if (seenIds[id]) id = makeId();
    seenIds[id] = true;
    return {
      id: id,
      amount: round2(raw.amount),
      validFrom: raw.validFrom
    };
  }

  function sanitizeData(input) {
    if (!isPlainObject(input)) return null;
    if (input.schema !== undefined && input.schema !== SCHEMA) return null;

    var hasSettings = isPlainObject(input.settings);
    var hasDays = isPlainObject(input.days);
    if (!hasSettings && !hasDays) return null;

    var out = defaults();

    if (hasSettings) {
      var rawSettings = input.settings;
      if (rawSettings.language === "en" || rawSettings.language === "hr") {
        out.settings.language = rawSettings.language;
      }
      if (rawSettings.theme === "auto" || rawSettings.theme === "light" || rawSettings.theme === "dark") {
        out.settings.theme = rawSettings.theme;
      }
      if (typeof rawSettings.allowanceEnabled === "boolean") {
        out.settings.allowanceEnabled = rawSettings.allowanceEnabled;
      }
      if (typeof rawSettings.allowanceAmount === "number" && isFinite(rawSettings.allowanceAmount) && rawSettings.allowanceAmount >= 0) {
        out.settings.allowanceAmount = round2(rawSettings.allowanceAmount);
      }
      if (isValidTime(rawSettings.workStart)) {
        out.settings.workStart = rawSettings.workStart;
      }
      if (typeof rawSettings.plannedHours === "number" && isFinite(rawSettings.plannedHours) && rawSettings.plannedHours >= 0 && rawSettings.plannedHours <= 24) {
        out.settings.plannedHours = snapQuarter(rawSettings.plannedHours);
      }

      if (Array.isArray(rawSettings.workDays)) {
        var seenWorkDays = {};
        var workDays = [];
        for (var w = 0; w < rawSettings.workDays.length; w += 1) {
          var workDay = rawSettings.workDays[w];
          if (typeof workDay !== "number" || !isFinite(workDay) || workDay < 0 || workDay > 6) continue;
          if (Math.floor(workDay) !== workDay) continue;
          if (seenWorkDays[workDay]) continue;
          seenWorkDays[workDay] = true;
          workDays.push(workDay);
        }
        if (workDays.length) {
          workDays.sort(function (a, b) { return a - b; });
          out.settings.workDays = workDays;
        }
      }

      if (Array.isArray(rawSettings.rates)) {
        var seenIds = {};
        var byDate = {};
        for (var i = 0; i < rawSettings.rates.length; i += 1) {
          var rate = sanitizeRate(rawSettings.rates[i], seenIds);
          if (rate) byDate[rate.validFrom] = rate;
        }
        var dates = Object.keys(byDate).sort();
        for (var j = 0; j < dates.length; j += 1) {
          out.settings.rates.push(byDate[dates[j]]);
        }
      }
    }

    if (isPlainObject(input.plans)) {
      var rawPlans = input.plans;
      var planKeys = Object.keys(rawPlans);
      for (var p = 0; p < planKeys.length; p += 1) {
        var planDate = planKeys[p];
        var planHours = rawPlans[planDate];
        if (!isValidDateKey(planDate)) continue;
        if (typeof planHours !== "number" || !isFinite(planHours) || planHours < 0 || planHours > 24) continue;
        out.plans[planDate] = snapQuarter(planHours);
      }
    }

    if (isPlainObject(input.closed)) {
      var closedKeys = Object.keys(input.closed);
      for (var c = 0; c < closedKeys.length; c += 1) {
        var closedDate = closedKeys[c];
        if (!isValidDateKey(closedDate)) continue;
        if (input.closed[closedDate] !== true) continue;
        out.closed[closedDate] = true;
      }
    }

    if (isPlainObject(input.holidays)) {
      var holidayKeys = Object.keys(input.holidays);
      for (var h = 0; h < holidayKeys.length; h += 1) {
        var holidayDate = holidayKeys[h];
        if (!isValidDateKey(holidayDate)) continue;
        if (input.holidays[holidayDate] !== true) continue;
        out.holidays[holidayDate] = true;
      }
    }

    if (Array.isArray(input.vacations)) {
      var seenVacations = {};
      for (var v = 0; v < input.vacations.length; v += 1) {
        var vacation = input.vacations[v];
        if (!isPlainObject(vacation)) continue;
        if (!isValidDateKey(vacation.from) || !isValidDateKey(vacation.to)) continue;
        if (vacation.from > vacation.to) continue;
        var vacationId = typeof vacation.id === "string" && vacation.id ? vacation.id : makeId();
        if (seenVacations[vacationId]) vacationId = makeId();
        seenVacations[vacationId] = true;
        out.vacations.push({ id: vacationId, from: vacation.from, to: vacation.to });
      }
      out.vacations.sort(function (a, b) { return a.from.localeCompare(b.from); });
    }

    if (hasDays) {
      var rawDays = input.days;
      var keys = Object.keys(rawDays);
      for (var k = 0; k < keys.length; k += 1) {
        var dateKey = keys[k];
        var rawDay = rawDays[dateKey];
        if (!isValidDateKey(dateKey) || !isPlainObject(rawDay)) continue;
        if (!("hours" in rawDay) && !("travel" in rawDay) && !("other" in rawDay) && !("note" in rawDay)) continue;

        if ("hours" in rawDay && (typeof rawDay.hours !== "number" || !isFinite(rawDay.hours) || rawDay.hours < 0)) continue;
        if ("travel" in rawDay && (typeof rawDay.travel !== "number" || !isFinite(rawDay.travel) || rawDay.travel < 0)) continue;
        if ("other" in rawDay && (typeof rawDay.other !== "number" || !isFinite(rawDay.other) || rawDay.other < 0)) continue;

        var note = typeof rawDay.note === "string" ? rawDay.note.trim().slice(0, 500) : "";
        out.days[dateKey] = {
          hours: round4(typeof rawDay.hours === "number" ? rawDay.hours : 0),
          travel: round2(typeof rawDay.travel === "number" ? rawDay.travel : 0),
          other: round2(typeof rawDay.other === "number" ? rawDay.other : 0),
          note: note,
          auto: rawDay.auto === true
        };
      }
    }

    return out;
  }

  function load() {
    lastLoadFailed = false;
    try {
      var raw = localStorage.getItem(KEY);
      if (raw === null) return defaults();
      var parsed = JSON.parse(raw);
      var cleaned = sanitizeData(parsed);
      if (!cleaned) {
        lastLoadFailed = true;
        return defaults();
      }
      return cleaned;
    } catch (error) {
      lastLoadFailed = true;
      return defaults();
    }
  }

  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      return false;
    }
  }

  function parseBackup(payload) {
    if (!isPlainObject(payload)) return null;
    var candidate = payload;
    if (payload.app === "radni-sati" && payload.data !== undefined) candidate = payload.data;
    return sanitizeData(candidate);
  }

  window.RSStore = {
    key: KEY,
    schema: SCHEMA,
    defaults: defaults,
    load: load,
    save: save,
    sanitizeData: sanitizeData,
    parseBackup: parseBackup,
    isValidDateKey: isValidDateKey,
    isValidTime: isValidTime,
    makeId: makeId,
    round2: round2,
    didLastLoadFail: function () { return lastLoadFailed; }
  };
}());
