/* CHIROMBE MATRIX 3.0 command surface. Kernel already installed the public APIs. */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.from(document.querySelectorAll(s)); };
  var state = { mode: "network", events: 0, cycle: 0, audio: null, osc: null, analyser: null };
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  function log(msg, type) {
    type = type || "SYS";
    var row = document.createElement("div"); row.innerHTML = "<b>" + escapeHtml(type) + "</b> " + escapeHtml(msg);
    if ($("#feed")) $("#feed").prepend(row); state.events++; if ($("#eventCount")) $("#eventCount").textContent = state.events;
    var j = document.createElement("div"); j.innerHTML = "<b>" + escapeHtml(new Date().toLocaleTimeString()) + "</b> " + escapeHtml(type) + " " + escapeHtml(msg);
    if ($("#journal")) $("#journal").prepend(j);
  }
  function safe(fn, fallback) { try { return fn(); } catch (e) { log(String(e), "ERROR"); return fallback; } }
  function pct(n) { return Math.round((Number(n) || 0) * 100) + "%"; }
  function showPanel(name) {
    $$(".panel").forEach(function (p) { p.classList.toggle("active", p.id === "panel-" + name); });
    $$(".nav-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.panel === name); });
  }
  $$(".nav-btn").forEach(function (b) { b.onclick = function () { showPanel(b.dataset.panel); }; });
  function family() {
    var f = safe(function () { return (window.ChirombeCore && window.ChirombeCore.family) || []; }, []);
    var grid = $("#familyGrid"); if (!grid) return; grid.innerHTML = "";
    if (!f.length) { grid.innerHTML = '<div class="family-node"><b>Protected circle empty</b><span>Kernel family seed missing.</span></div>'; return; }
    f.forEach(function (x, i) {
      var d = document.createElement("div"); d.className = "family-node";
      d.innerHTML = "<b>" + escapeHtml(x.name || ("NODE " + (i + 1))) + "</b><span>" + escapeHtml(x.relation || x.role || "authorised node") + (x.remembrance ? " REMEMBERED" : " PROTECTED") + "</span>";
      grid.appendChild(d);
    });
    if ($("#mNodes")) $("#mNodes").textContent = f.length;
  }
  function protectionGates() {
    var snap = safe(function () { return window.ChirombeHealth.snapshot(); }, {});
    var armed = safe(function () { return !!(window.ZionProtect && window.ZionProtect.snapshot().armed); }, false);
    var rows = [
      ["INTEGRITY", snap.auditValid ? "VERIFIED" : "DEGRADED"],
      ["BLOODLINE DATA", (snap.familyNodes || 0) > 0 ? "VERIFIED " + snap.familyNodes + " NODES" : "EMPTY"],
      ["WATCHDOG", snap.status === "OK" ? "ACTIVE" : "UNKNOWN"],
      ["AUDIT", snap.auditValid ? "VERIFIED" : "CHECK"],
      ["ENGINE BUS", (window.CHIROMBE_ENGINE && window.CHIROMBE_ENGINE.status().status) || "READY"],
      ["AUDIO", snap.speech ? "READY" : "UNAVAILABLE"],
      ["RECOVERY", "READY"],
      ["PROTECTION STATE", armed ? "ARMED" : "READY"]
    ];
    var host = $("#gateList");
    if (host) host.innerHTML = rows.map(function (r) { return '<div class="gate-row"><span>' + escapeHtml(r[0]) + "</span><i>" + escapeHtml(String(r[1])) + "</i></div>"; }).join("");
    var res = safe(function () { return window.ChirombeCore.state.resilience; }, 0.77);
    var coh = safe(function () { return window.ChirombeCore.state.coherence; }, 0.99);
    if ($("#mRes")) $("#mRes").textContent = pct(res);
    if ($("#mCoh")) $("#mCoh").textContent = pct(coh);
    if ($("#protectFill")) $("#protectFill").style.width = pct(armed ? Math.max(res, 0.9) : res);
    if ($("#protectState")) $("#protectState").textContent = armed ? "ARMED" : "READY";
  }
  function coreStatus() {
    var s = safe(function () { return window.ChirombeSystem || {}; }, {});
    if ($("#coreState")) $("#coreState").textContent = s.status || "CORE ONLINE";
    if ($("#healthCore")) $("#healthCore").textContent = JSON.stringify(s, null, 2);
    var caps = safe(function () { return window.ChirombeHealth.capabilities(); }, {});
    if ($("#healthCaps")) $("#healthCaps").textContent = JSON.stringify(caps, null, 2);
    var eng = safe(function () { return window.CHIROMBE_ENGINE.status(); }, { status: "ENGINE READY" });
    if ($("#engineState")) $("#engineState").textContent = eng.status || "ENGINE READY";
    if ($("#healthEngine")) $("#healthEngine").textContent = JSON.stringify(eng, null, 2);
    if ($("#mAudit")) $("#mAudit").textContent = safe(function () { return window.ChirombeAudit.verify() ? "VALID" : "CHECK"; }, "-");
    if ($("#auditOut")) $("#auditOut").textContent = JSON.stringify({ valid: safe(function () { return window.ChirombeAudit.verify(); }, false), head: safe(function () { return window.ChirombeAudit.head(); }, null), length: safe(function () { return window.ChirombeAudit.export().length; }, 0) }, null, 2);
    var diags = $("#diagnostics");
    if (diags) {
      var items = [["kernel", true], ["command-bus", !!window.ChirombeBus], ["family", !!(window.ChirombeCore && window.ChirombeCore.family && window.ChirombeCore.family.length)], ["audit", !!(window.ChirombeAudit && window.ChirombeAudit.verify())], ["watchdog", !!window.ChirombeWatchdog], ["engine", !!window.CHIROMBE_ENGINE], ["audio-api", !!window.speechSynthesis], ["deep-kernel", false]];
      diags.innerHTML = items.map(function (it) { return '<div class="diag ' + (it[1] ? "ok" : "warn") + '">' + it[0].toUpperCase() + " " + (it[1] ? "OK" : "OPTIONAL / STANDBY") + "</div>"; }).join("");
    }
    protectionGates();
  }
  function command(name, args) {
    var r = safe(function () { return window.ChirombeBus.executeCommand(name, args || {}); }, null);
    log(name + " -> " + JSON.stringify((r && (r.result || r)) || r), "CMD"); return r;
  }
  function protect() {
    safe(function () { return window.ZCCA.protect(); }, null);
    if ($("#protectState")) $("#protectState").textContent = "ARMED";
    log("protection cycle requested - computational model armed", "PROTECT"); coreStatus();
  }
  $("#protect").onclick = protect;
  $("#fullCycle").onclick = function () { protect(); command("status"); command("health"); safe(function () { return window.CHIROMBE_ENGINE.activate(); }, null); safe(function () { return window.ChirombeCore.evolve(); }, null); coreStatus(); };
  $("#selfTest").onclick = function () { var r = safe(function () { return window.CHIROMBE_ENGINE.selfTest(); }, {}); if ($("#engineOutput")) $("#engineOutput").textContent = JSON.stringify(r, null, 2); log("self test completed", "TEST"); };
  if ($("#refreshHealth")) $("#refreshHealth").onclick = coreStatus;
  if ($("#verifyAudit")) $("#verifyAudit").onclick = function () { var r = safe(function () { return window.ChirombeAudit.verify(); }, false); if ($("#auditOut")) $("#auditOut").textContent = JSON.stringify({ valid: r, head: safe(function () { return window.ChirombeAudit.head(); }, null) }, null, 2); log("audit verification " + r, "AUDIT"); };
  $$("[data-mode]").forEach(function (b) { b.onclick = function () { state.mode = b.dataset.mode; if ($("#matrixMode")) $("#matrixMode").textContent = state.mode.toUpperCase(); log("matrix mode " + state.mode, "MAP"); refreshEngineCards(); }; });
  function refreshEngineCards() {
    var nim = command("nim"), ppm = command("ppm"), eea = command("eea");
    if ($("#nimOut")) $("#nimOut").textContent = JSON.stringify((nim && nim.result) || nim, null, 2);
    if ($("#ppmOut")) $("#ppmOut").textContent = JSON.stringify((ppm && ppm.result) || ppm, null, 2);
    if ($("#eeaOut")) $("#eeaOut").textContent = JSON.stringify((eea && eea.result) || eea, null, 2);
  }
  $$("[data-engine]").forEach(function (b) {
    b.onclick = function () {
      var name = b.dataset.engine;
      if (name === "deep") {
        var r = safe(function () { return window.CHIROMBE_ENGINE.activate(); }, { state: "NOT_AVAILABLE" });
        if ($("#engineOutput")) $("#engineOutput").textContent = JSON.stringify({ deepKernel: "NOT_EXECUTED", reason: "Historical 729KB artifact is archived. Activation arms the live engine only.", engine: r }, null, 2);
        log("deep kernel refused - historical artifact stays archived", "KERNEL"); return;
      }
      var map = { sense: "sense", translate: "translate", nim: "nim", eea: "eea", ppm: "ppm", isg: "strategy.generate", reprogram: "reprogram", broadcast: "broadcast", simulation: "simulation.run", pioneer: "pioneer.hypothesis", prophetic: "prophetic.input" };
      var r2 = command(map[name] || name); if ($("#engineOutput")) $("#engineOutput").textContent = JSON.stringify(r2, null, 2);
    };
  });
  if ($("#addNode")) $("#addNode").onclick = function () {
    var name = prompt("Display name for an authorised symbolic node:"); if (!name) return;
    var rel = prompt("Relation / branch:", "protected");
    var node = { name: name, relation: rel || "protected", role: "NODE", createdAt: new Date().toISOString() };
    if (window.ChirombeCore && window.ChirombeCore.addNode) window.ChirombeCore.addNode(node);
    else if (window.ChirombeCore && Array.isArray(window.ChirombeCore.family)) window.ChirombeCore.family.push(node);
    family(); log("authorised node added: " + name, "FAMILY"); coreStatus();
  };
  function resizeCanvas(c) {
    var r = c.getBoundingClientRect(); var d = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.max(1, r.width * d); c.height = Math.max(1, r.height * d);
    var x = c.getContext("2d"); x.setTransform(d, 0, 0, d, 0, 0); return x;
  }
  function canvasLoop(id) {
    var c = $("#" + id); if (!c) return; var x = resizeCanvas(c);
    addEventListener("resize", function () { x = resizeCanvas(c); });
    var t = 0;
    function draw() {
      t += 0.012; var w = c.clientWidth, h = c.clientHeight; x.fillStyle = "#020806"; x.fillRect(0, 0, w, h); x.font = "10px monospace";
      var yy, xx, n; for (yy = 10; yy < h; yy += 16) { for (xx = 0; xx < w; xx += 12) { n = Math.abs(Math.sin(xx * 0.021 + yy * 0.017 + t * 2)); x.fillStyle = "rgba(92,210,154," + (0.08 + n * 0.25) + ")"; x.fillText(String((xx * yy + Math.floor(t * 100)) % 10), xx, yy); } }
      var cx = w / 2, cy = h / 2, r; for (r = 35; r < Math.min(w, h) / 1.7; r += 32) { x.beginPath(); x.arc(cx, cy, r + (t * 8) % 32, 0, Math.PI * 2); x.strokeStyle = "rgba(185,218,111," + (0.06 + (r % 64) / 900) + ")"; x.stroke(); }
      var i, a, rr, px, py; for (i = 0; i < 34; i++) { a = i * 0.62 + t * (i % 2 ? -1 : 1) * 0.3; rr = 40 + (i * 37) % (Math.min(w, h) / 2 - 55); px = cx + Math.cos(a) * rr; py = cy + Math.sin(a) * rr; x.beginPath(); x.arc(px, py, 2 + (i % 3), 0, 7); x.fillStyle = i % 7 === 0 ? "#d8b967" : "#8be2b1"; x.fill(); }
      requestAnimationFrame(draw);
    }
    draw();
  }
  function drawLineage() {
    var c = $("#lineageCanvas"); if (!c) return; var x = resizeCanvas(c);
    addEventListener("resize", function () { x = resizeCanvas(c); paint(); });
    function paint() {
      var fam = (window.ChirombeCore && window.ChirombeCore.family) || []; var w = c.clientWidth, h = c.clientHeight;
      x.fillStyle = "#020806"; x.fillRect(0, 0, w, h); var n = fam.length || 1, cx = w / 2, cy = h / 2, i, a, px, py;
      x.strokeStyle = "rgba(155,231,189,0.25)";
      for (i = 0; i < n; i++) { a = (i / n) * Math.PI * 2 - Math.PI / 2; px = cx + Math.cos(a) * Math.min(w, h) * 0.32; py = cy + Math.sin(a) * Math.min(w, h) * 0.32; x.beginPath(); x.moveTo(cx, cy); x.lineTo(px, py); x.stroke(); }
      x.fillStyle = "#d8b967"; x.beginPath(); x.arc(cx, cy, 8, 0, 7); x.fill(); x.fillStyle = "#8be2b1"; x.font = "9px monospace";
      for (i = 0; i < n; i++) { a = (i / n) * Math.PI * 2 - Math.PI / 2; px = cx + Math.cos(a) * Math.min(w, h) * 0.32; py = cy + Math.sin(a) * Math.min(w, h) * 0.32; x.beginPath(); x.arc(px, py, 4, 0, 7); x.fill(); x.fillStyle = "#cfe9db"; x.fillText((fam[i].name || "").slice(0, 18), px + 6, py + 3); x.fillStyle = "#8be2b1"; }
    }
    paint(); addEventListener("chirombe-family-ready", paint);
  }
  function audioUnlock() {
    if (!window.speechSynthesis) { log("Speech synthesis unavailable", "AUDIO"); return; }
    window.speechSynthesis.resume();
    if (window.CHIROMBE_LITURGY_AUDIO && window.CHIROMBE_LITURGY_AUDIO.unlock) window.CHIROMBE_LITURGY_AUDIO.unlock();
    state.audio = state.audio || new (window.AudioContext || window.webkitAudioContext)();
    if (state.audio.resume) state.audio.resume();
    state.analyser = state.audio.createAnalyser(); state.analyser.fftSize = 256;
    if (!state.osc) { var osc = state.audio.createOscillator(); var gain = state.audio.createGain(); osc.frequency.value = 136.1; gain.gain.value = 0.018; osc.connect(gain).connect(state.analyser).connect(state.audio.destination); osc.start(); state.osc = osc; }
    if ($("#audioState")) $("#audioState").textContent = "AUDIO UNLOCKED";
    if ($("#audioMode")) $("#audioMode").textContent = "UNLOCKED";
    var v = safe(function () { return window.CHIROMBE_LITURGY_AUDIO.chooseVoice(); }, null);
    if ($("#voiceName")) $("#voiceName").textContent = (v && v.name) || "Browser voice";
    log("audio unlocked - 136.1 Hz symbolic oscillator", "AUDIO"); drawAudio();
  }
  $("#unlockAudio").onclick = audioUnlock;
  $("#stopAudio").onclick = function () { safe(function () { return window.CHIROMBE_LITURGY_AUDIO.stop(); }, null); if ($("#audioMode")) $("#audioMode").textContent = "STOPPED"; };
  $("#speakPrayer").onclick = function () {
    if (!window.speechSynthesis) return; if (!state.audio) audioUnlock();
    var text = "Mwari ndi Mwari. May peace, wisdom, unity, strength and protection remain with the protected circle. May every member of the House of Masawi be remembered with dignity, love and faith. Amen.";
    safe(function () { return window.CHIROMBE_LITURGY_AUDIO.speak({ id: "matrix-prayer-" + Date.now(), type: "PRAYER", title: "House Declaration", text: text }); }, null);
    if ($("#audioMode")) $("#audioMode").textContent = "SPEAKING"; log("devotional declaration started", "AUDIO");
  };
  $("#liturgy").onclick = function () { safe(function () { return window.CHIROMBE_LITURGY.start(); }, null); if ($("#audioMode")) $("#audioMode").textContent = "LIVING LITURGY"; log("living liturgy requested", "AUDIO"); };
  function drawAudio() {
    var c = $("#audioCanvas"); if (!c || !state.analyser) return; var x = resizeCanvas(c); var data = new Uint8Array(state.analyser.frequencyBinCount);
    function f() { state.analyser.getByteFrequencyData(data); var w = c.clientWidth, h = c.clientHeight; x.clearRect(0, 0, w, h); x.strokeStyle = "#9be7bd"; x.beginPath(); data.forEach(function (v, i) { var px = (i / data.length) * w, py = h - (v / 255) * h * 0.8 - h * 0.05; if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.stroke(); requestAnimationFrame(f); }
    f();
  }
  function boot() {
    if ($("#boot-status")) $("#boot-status").textContent = "KERNEL ONLINE";
    if ($("#boot-progress")) $("#boot-progress").style.width = "100%";
    setTimeout(function () {
      if ($("#boot")) $("#boot").classList.add("hidden"); if ($("#app")) $("#app").classList.remove("hidden");
      coreStatus(); family(); canvasLoop("matrixCanvas"); canvasLoop("networkCanvas"); drawLineage(); refreshEngineCards();
      log("matrix shell online - historical kernel not executed", "READY");
    }, 280);
    setInterval(function () {
      state.cycle++; if ($("#cycle")) $("#cycle").textContent = String(state.cycle).padStart(6, "0");
      if ($("#entropy")) $("#entropy").textContent = (Math.sin(state.cycle * 0.03 + 0.77) * 0.5 + 0.5).toFixed(3);
      if ($("#signal")) $("#signal").textContent = (Math.cos(state.cycle * 0.017 + 0.99) * 0.5 + 0.5).toFixed(3);
      if (window.ChirombeWatchdog) window.ChirombeWatchdog.tick(); coreStatus(); family();
    }, 5000);
  }
  boot();
})();
