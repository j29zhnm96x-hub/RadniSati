"use strict";

var CACHE_NAME = "radni-sati-v0.10.0";
var CACHE_PREFIX = "radni-sati-";
var INDEX_URL = new URL("./index.html", self.registration.scope).href;
var VERSION_PATH = new URL("./version.json", self.registration.scope).pathname;

var ASSETS = [
  "./",
  "./index.html",
  "./css/styles.css?v=0.10.0",
  "./js/i18n.js?v=0.10.0",
  "./js/store.js?v=0.10.0",
  "./js/app.js?v=0.10.0",
  "./manifest.webmanifest?v=0.10.0",
  "./icons/icon-192.png?v=0.10.0",
  "./icons/icon-512.png?v=0.10.0",
  "./icons/apple-touch-icon.png?v=0.10.0"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key.indexOf(CACHE_PREFIX) === 0 && key !== CACHE_NAME) {
          return caches.delete(key);
        }
        return Promise.resolve();
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;

  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === new URL("./sw.js", self.registration.scope).pathname) return;

  if (url.pathname === VERSION_PATH) {
    event.respondWith(fetch(request, { cache: "no-store" }));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(function (response) {
        if (response && response.ok) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(INDEX_URL, copy);
          });
        }
        return response;
      }).catch(function () {
        return caches.match(INDEX_URL).then(function (cached) {
          return cached || caches.match("./");
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request).then(function (response) {
        if (response && response.ok && response.type === "basic") {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return response;
      });
    })
  );
});
