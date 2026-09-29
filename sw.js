self.addEventListener("install", function (e) { self.skipWaiting(); e.waitUntil(caches.open("chirombe-watch-308").then(function (c) { return c.addAll(["./", "./index.html"]); })); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function (e) {
  e.respondWith(fetch(e.request).then(function (res) {
    var copy = res.clone();
    caches.open("chirombe-watch-308").then(function (c) { c.put(e.request, copy); });
    return res;
  }).catch(function () { return caches.match(e.request); }));
});
