/* CHIROMBE MATRIX 3.0 Phase 2 bridge.
   Probes the archive Pages site. Does not eval the 729KB historical artifact. */
(function (g) {
  "use strict";
  var ARCHIVE = "https://tariromasawi.github.io/chirombe/";
  var MODULES = [
    "js/boot.js",
    "js/command-bus.js",
    "js/state-store.js",
    "js/audit-chain.js",
    "js/health.js",
    "js/watchdog.js",
    "js/zion-protection-core.js",
    "js/mwarindimwari-covenant.js",
    "js/zcca.js",
    "js/chirombe-core.js",
    "js/resonance-engine.js",
    "js/chirombe-autostart.js",
    "js/engine/policy.js",
    "js/engine/ledger.js",
    "js/engine/adapters.js",
    "js/engine/chirombe-engine.js",
    "js/engine/kernel-bridge.js",
    "data/family.json"
  ];
  g.CHIROMBE_PHASE2 = {
    archive: ARCHIVE,
    historicalKernel: "NOT_EXECUTED",
    probes: [],
    commands: function () { return g.ChirombeBus && g.ChirombeBus.listCommands ? g.ChirombeBus.listCommands() : []; }
  };
  MODULES.forEach(function (path) {
    fetch(ARCHIVE + path, { method: "GET", mode: "cors" }).then(function (r) {
      g.CHIROMBE_PHASE2.probes.push({ path: path, ok: r.ok, status: r.status });
    }).catch(function () {
      g.CHIROMBE_PHASE2.probes.push({ path: path, ok: false, status: 0 });
    });
  });
})(typeof window !== "undefined" ? window : globalThis);
