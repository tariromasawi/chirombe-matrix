/* CHIROMBE MATRIX 3.0 kernel — public APIs. Never overwrites live original modules. Never executes the 729KB artifact. */
(function (g) {
  "use strict";
  var MATRIX = { a: 77, b: 99, c: 33, seal: "777-999-333" };
  var KEY_CORE = "CHIROMBE_MATRIX_CORE_V3";
  var KEY_AUDIT = "CHIROMBE_MATRIX_AUDIT_V3";
  var KEY_STATE = "CHIROMBE_MATRIX_STATE_V3";
  function now() { return new Date().toISOString(); }
  function load(k, fb) { try { return JSON.parse(localStorage.getItem(k) || "null") || fb; } catch (e) { return fb; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function hash(s) {
    var h = 2166136261 >>> 0, i; s = String(s);
    for (i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ("00000000" + (h >>> 0).toString(16)).slice(-8);
  }
  var FAMILY_SEED = [
    { name: "Chirombe", relation: "great-great-grandfather", role: "ANCESTOR", remembrance: true },
    { name: "Makwengura", relation: "great-grandfather", role: "ANCESTOR", remembrance: true },
    { name: "Masawi", relation: "grandfather", role: "ANCESTOR", remembrance: true },
    { name: "Masarura", relation: "grandmother", role: "ANCESTOR", remembrance: true },
    { name: "Sebastian Karumekangu Masawi", relation: "father", role: "PARENT" },
    { name: "Risto Kasirori Masawi", relation: "mother", role: "PARENT" },
    { name: "HRH Saint Tariro Masawi", relation: "self", role: "CORE" },
    { name: "HRH Tarry Kupakwashe Masawi", relation: "son", role: "CORE", alsoKnownAs: ["Tarry"] },
    { name: "Kenzi Masawi", relation: "adopted nephew/son", role: "HEIR" },
    { name: "Tenderayi", relation: "brother", role: "SIBLING" },
    { name: "Silent", relation: "brother", role: "SIBLING" },
    { name: "Trymore", relation: "brother", role: "SIBLING" },
    { name: "Charles", relation: "brother", role: "SIBLING" },
    { name: "Tatenda", relation: "brother", role: "SIBLING" },
    { name: "Rhoda", relation: "sister", role: "SIBLING", remembrance: true },
    { name: "Abigail", relation: "sister", role: "SIBLING", remembrance: true },
    { name: "Corinna", relation: "sister", role: "SIBLING", remembrance: true },
    { name: "House of Masawi", relation: "house", role: "HOUSE" },
    { name: "Descendants of the House", relation: "future", role: "DESCENDANT" }
  ];
  if (!g.ChirombeSystem) {
    g.ChirombeSystem = { version: "3.0.0", protocol: "CHIROMBE-3.0", schemaVersion: 3, bootId: "MX-" + Date.now().toString(36), startedAt: now(), status: "CORE ONLINE", matrix: MATRIX, components: { kernel: "READY", frontend: "LOADING" }, automation: { status: "BROWSER-SESSION", note: "No 24/7 guarantee while the tab is closed." }, capabilities: { bus: true, protection: true, audit: true, audio: true } };
  }
  if (!g.ChirombeState) {
    var st = load(KEY_STATE, { data: {}, savedAt: null });
    g.ChirombeState = { data: st.data || {}, load: function () { st = load(KEY_STATE, st); this.data = st.data || {}; return this.data; }, save: function () { st.data = this.data; st.savedAt = now(); save(KEY_STATE, st); return true; } };
  }
  if (!g.ChirombeCore) {
    var persisted = load(KEY_CORE, null);
    var family = (persisted && persisted.family && persisted.family.length) ? persisted.family : FAMILY_SEED.map(function (m) { return Object.assign({}, m); });
    var coreState = Object.assign({ generation: MATRIX.a, threat: 0.12, resilience: 0.77, coherence: 0.99, prayerIndex: 0, family: family, armed: false }, persisted || {});
    coreState.family = family;
    function persistCore() { save(KEY_CORE, { family: coreState.family, generation: coreState.generation, threat: coreState.threat, resilience: coreState.resilience, coherence: coreState.coherence, prayerIndex: coreState.prayerIndex, armed: coreState.armed }); }
    g.ChirombeCore = {
      state: coreState, family: coreState.family,
      pray: function () { var p = coreState.family[coreState.prayerIndex % coreState.family.length]; coreState.prayerIndex++; persistCore(); return { for: p && p.name, line: "Mwari ndi Mwari. Peace, wisdom and protection over this House." }; },
      evolve: function () { coreState.generation++; coreState.threat = clamp(coreState.threat * 0.92 + Math.random() * 0.08, 0.04, 0.7); coreState.resilience = clamp(0.77 + (0.5 - coreState.threat) * 0.4, 0.33, 0.99); coreState.coherence = clamp(0.99 - coreState.threat * 0.2, 0.33, 0.99); persistCore(); return { generation: coreState.generation, resilience: coreState.resilience }; },
      addNode: function (node) { coreState.family.push(node); persistCore(); return node; }
    };
    fetch("./data/family.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.members) return;
      d.members.forEach(function (m) { if (!coreState.family.some(function (x) { return x.name === m.name; })) coreState.family.push({ name: m.name, relation: m.generation || m.role, role: m.role, remembrance: !!m.remembrance }); });
      persistCore(); if (g.dispatchEvent) g.dispatchEvent(new Event("chirombe-family-ready"));
    }).catch(function () {});
  }
  if (!g.ChirombeAudit) {
    var chain = load(KEY_AUDIT, []);
    function append(type, payload) {
      var prev = chain.length ? chain[chain.length - 1].hash : "GENESIS-77-99-33";
      var rec = { i: chain.length, type: type, payload: payload, at: now(), prev: prev };
      rec.hash = hash(prev + rec.at + rec.type + JSON.stringify(payload)); chain.push(rec);
      if (chain.length > 400) chain = chain.slice(-400); save(KEY_AUDIT, chain); return rec;
    }
    if (!chain.length) append("BOOT", { system: "CHIROMBE-MATRIX", version: "3.0.0" });
    g.ChirombeAudit = {
      head: function () { return chain[chain.length - 1] || null; }, append: append, export: function () { return chain.slice(); },
      verify: function () { var i, prev = "GENESIS-77-99-33"; for (i = 0; i < chain.length; i++) { if (chain[i].prev !== prev) return false; var expect = hash(chain[i].prev + chain[i].at + chain[i].type + JSON.stringify(chain[i].payload)); if (chain[i].hash !== expect) return false; prev = chain[i].hash; } return true; }
    };
  }
  if (!g.ChirombeHealth) {
    g.ChirombeHealth = {
      snapshot: function () { var fam = (g.ChirombeCore && g.ChirombeCore.family) || []; return { status: "OK", core: (g.ChirombeSystem && g.ChirombeSystem.status) || "ONLINE", familyNodes: fam.length, auditValid: !!(g.ChirombeAudit && g.ChirombeAudit.verify()), speech: !!(g.speechSynthesis), audioContext: !!(g.AudioContext || g.webkitAudioContext), workers: !!g.Worker, serviceWorker: "serviceWorker" in navigator, session: "BROWSER", matrix: MATRIX, at: now() }; },
      capabilities: function () { return { workers: !!g.Worker, sw: "serviceWorker" in navigator, idb: !!g.indexedDB, bc: !!g.BroadcastChannel, speech: !!g.speechSynthesis, webAudio: !!(g.AudioContext || g.webkitAudioContext) }; }
    };
  }
  if (!g.ChirombeWatchdog) {
    g.ChirombeWatchdog = { last: now(), tick: function () { this.last = now(); if (g.ChirombeSystem) g.ChirombeSystem.health = g.ChirombeHealth.snapshot(); return g.ChirombeSystem && g.ChirombeSystem.health; } };
    setInterval(function () { g.ChirombeWatchdog.tick(); }, 15000);
  }
  if (!g.ZionProtect && !g.ZionProtectionCore) {
    var protectState = { armed: false, last: null, rings: ["TRUTH", "LOVE", "UNITY", "WISDOM", "PEACE"] };
    g.ZionProtect = { snapshot: function () { return { armed: protectState.armed, last: protectState.last, rings: protectState.rings, nodes: ((g.ChirombeCore && g.ChirombeCore.family) || []).length, kind: "computational-protection-model" }; } };
    g.ZionProtectionCore = g.ZionProtect;
    g.ZCCA = g.ZCCA || {
      protect: function () { protectState.armed = true; protectState.last = now(); if (g.ChirombeCore) g.ChirombeCore.state.armed = true; if (g.ChirombeAudit) g.ChirombeAudit.append("PROTECT", { nodes: (g.ChirombeCore.family || []).length }); return g.ZionProtect.snapshot(); },
      command: function (c) { c = String(c || "").toLowerCase(); if (c.indexOf("protect") >= 0 || c.indexOf("activate") >= 0) return this.protect(); if (c.indexOf("status") >= 0) return g.ChirombeSystem; if (c.indexOf("lineage") >= 0 || c.indexOf("family") >= 0) return (g.ChirombeCore && g.ChirombeCore.family) || []; return { ok: true, echoed: c }; },
      activate: function () { return this.protect(); }, getFamily: function () { return (g.ChirombeCore && g.ChirombeCore.family) || []; }, status: function () { return { status: protectState.armed ? "ARMED" : "READY", matrix: MATRIX }; }
    };
  }
  if (!g.MwarindiCovenant) g.MwarindiCovenant = { status: function () { return { sealed: true, declaration: "Mwari ndi Mwari. Zvapera.", matrix: MATRIX.seal }; }, remind: function () { return "THE SEAMS ARE THE LOCK · ZVAPERA"; }, seal: function () { if (g.ChirombeAudit) g.ChirombeAudit.append("SEAL", { formula: "ZVAPERA" }); return this.status(); } };
  if (!g.ChirombeResonance) g.ChirombeResonance = { hz: 136.1, status: function () { return { oscillator: this.hz, mode: "symbolic-acoustic", supernaturalDetection: false }; }, measure: function () { return { hz: this.hz, amplitude: 0.018 }; }, activate: function () { return this.status(); } };
  function vec(seed) { var s = hash(seed + Date.now()); return { threat: Number((parseInt(s.slice(0, 2), 16) / 255).toFixed(3)), coherence: Number((0.77 + (parseInt(s.slice(2, 4), 16) / 255) * 0.22).toFixed(3)), resilience: Number((0.66 + (parseInt(s.slice(4, 6), 16) / 255) * 0.33).toFixed(3)) }; }
  if (!g.CHIROMBE_ENGINE) {
    var engineState = { status: "ENGINE READY", activated: false, last: null, deep: "NOT_LOADED" };
    var engines = {
      sense: function () { return { observations: (g.ChirombeCore.family || []).map(function (n) { return n.name; }), vector: vec("sense") }; },
      translate: function () { return { stateVector: vec("translate"), units: "model-only" }; },
      nim: function () { var fam = g.ChirombeCore.family || []; return { nodes: fam.length, intelligence: fam.map(function (n) { return { name: n.name, role: n.role || n.relation, score: 0.77 }; }) }; },
      eea: function () { return { graph: "reinforcement", edges: 33, resources: ["watchdog", "audit", "protection"] }; },
      ppm: function () { return { pathways: ["ancestry", "remembrance", "cover", "recovery"], horizon: "session" }; },
      "strategy.generate": function () { return { strategies: ["CLOAK", "DECOY", "DAMP", "REINFORCE", "CHOKEPOINT"] }; },
      reprogram: function () { return { feedback: g.ChirombeCore.evolve() }; },
      broadcast: function () { return { channel: "local-event-bus", message: "Mwari ndi Mwari" }; },
      "simulation.run": function () { return { agents: 7, result: "synthetic-only", claim: "computational" }; },
      "pioneer.hypothesis": function () { return { hypothesis: "Resilience increases when audit and bloodline stay decoupled from the visual layer.", confidence: 0.77 }; },
      "prophetic.input": function () { return { accepted: true, layer: "human-interpretation", notSensor: true }; }
    };
    g.CHIROMBE_ENGINE = {
      status: function () { return engineState; },
      activate: function () { engineState.activated = true; engineState.status = "ENGINE ARMED"; engineState.last = now(); engineState.deep = "OPTIONAL — historical artifact not executed"; if (g.ChirombeAudit) g.ChirombeAudit.append("ENGINE", { action: "activate" }); return engineState; },
      selfTest: function () { return { ok: true, checks: ["bus", "core", "audit", "health", "family", "engine"].map(function (k) { return { name: k, ok: true }; }), matrix: MATRIX }; },
      command: function (name, args) { var key = String(name || "").toLowerCase(); if (key === "self_test" || key === "selftest") return this.selfTest(); if (engines[name]) return engines[name](args || {}); if (engines[key]) return engines[key](args || {}); return { ok: false, error: "unknown engine command" }; }
    };
  }
  if (!g.CHIROMBE_LITURGY_AUDIO) {
    g.CHIROMBE_LITURGY_AUDIO = {
      unlocked: false, unlock: function () { this.unlocked = true; return true; },
      chooseVoice: function () { var voices = (g.speechSynthesis && speechSynthesis.getVoices()) || []; return voices[0] || { name: "Browser voice" }; },
      speak: function (item) { if (!g.speechSynthesis) return false; var u = new SpeechSynthesisUtterance((item && item.text) || "Mwari ndi Mwari."); u.rate = 0.88; speechSynthesis.cancel(); speechSynthesis.speak(u); return true; },
      stop: function () { if (g.speechSynthesis) speechSynthesis.cancel(); }
    };
  }
  if (!g.CHIROMBE_LITURGY) {
    var liturgyOn = false;
    g.CHIROMBE_LITURGY = {
      start: function () { liturgyOn = true; var text = "Mwari ndi Mwari. May peace, wisdom, unity, strength and protection remain with the House of Masawi. May Chirombe, Makwengura, Masawi and Masarura be remembered with dignity. May Sebastian Karumekangu Masawi and Risto Kasirori Masawi be covered. May HRH Saint Tariro Masawi, HRH Tarry Kupakwashe Masawi and Kenzi Masawi be held in truth. May Tenderayi, Silent, Trymore, Charles, Tatenda, and the eternal spirits of Corinna, Rhodha and Abigail be remembered. Zvapera."; if (g.CHIROMBE_LITURGY_AUDIO) g.CHIROMBE_LITURGY_AUDIO.speak({ text: text }); if (g.ChirombeAudit) g.ChirombeAudit.append("LITURGY", { started: true }); return { started: true }; },
      stop: function () { liturgyOn = false; if (g.CHIROMBE_LITURGY_AUDIO) g.CHIROMBE_LITURGY_AUDIO.stop(); },
      status: function () { return { running: liturgyOn }; }
    };
  }
  if (!g.ChirombeBus) {
    var cmds = {};
    function registerCommand(name, handler, meta) { cmds[name] = { handler: handler, meta: meta || {} }; }
    function executeCommand(name, args) {
      var t = Date.now(), rec = cmds[name];
      if (!rec) return { ok: false, command: name, timestamp: now(), duration: 0, error: "unknown command", subsystem: "bus" };
      try { var result = rec.handler(args || {}); return { ok: true, command: name, timestamp: now(), duration: Date.now() - t, result: result, subsystem: (rec.meta && rec.meta.subsystem) || "bus" }; }
      catch (e) { return { ok: false, command: name, timestamp: now(), duration: Date.now() - t, error: String(e), subsystem: "bus" }; }
    }
    g.ChirombeBus = { registerCommand: registerCommand, executeCommand: executeCommand, listCommands: function () { return Object.keys(cmds); } };
    registerCommand("version", function () { return { protocol: "CHIROMBE-3.0", schemaVersion: 3, matrix: MATRIX }; }, { subsystem: "core" });
    registerCommand("capabilities", function () { return g.ChirombeHealth.capabilities(); }, { subsystem: "core" });
    registerCommand("status", function () { return g.ChirombeSystem; }, { subsystem: "core" });
    registerCommand("family.list", function () { return (g.ChirombeCore && g.ChirombeCore.family) || []; }, { subsystem: "family" });
    registerCommand("health", function () { return g.ChirombeHealth.snapshot(); }, { subsystem: "health" });
    registerCommand("selftest", function () { return g.CHIROMBE_ENGINE.selfTest(); }, { subsystem: "test" });
    ["sense", "translate", "nim", "eea", "ppm", "reprogram", "broadcast"].forEach(function (n) { registerCommand(n, function (a) { return g.CHIROMBE_ENGINE.command(n, a); }, { subsystem: "engine" }); });
    registerCommand("strategy.generate", function (a) { return g.CHIROMBE_ENGINE.command("strategy.generate", a); }, { subsystem: "engine" });
    registerCommand("simulation.run", function (a) { return g.CHIROMBE_ENGINE.command("simulation.run", a); }, { subsystem: "engine" });
    registerCommand("pioneer.hypothesis", function (a) { return g.CHIROMBE_ENGINE.command("pioneer.hypothesis", a); }, { subsystem: "engine" });
    registerCommand("prophetic.input", function (a) { return g.CHIROMBE_ENGINE.command("prophetic.input", a); }, { subsystem: "engine" });
  }
  g.CHIROMBE_MATRIX = { version: "3.0.0", kernel: "standalone", matrix: MATRIX, historicalArtifact: "NOT_EXECUTED", note: "Computational protection and devotional interface. Not a supernatural sensor." };
})(typeof window !== "undefined" ? window : globalThis);
