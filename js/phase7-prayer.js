/* CHIROMBE MATRIX 3.0 Phase 7. Prayer chamber. Browser audio only. */
(function (g) {
  "use strict";
  var KEY = "CHIROMBE_MATRIX_PRAYERS_V3";
  var SEED = [
    {
      id: "PRAY-COVER",
      title: "House Cover",
      text: "Mwari ndi Mwari. In the name of the Most High, cover the House of Masawi. Let truth, love, unity, wisdom and peace stand over Chirombe, Makwengura, Masawi and Masarura. Cover Sebastian Karumekangu Masawi and Risto Kasirori Masawi. Cover HRH Saint Tariro Masawi, HRH Tarry Kupakwashe Masawi and Kenzi Masawi. Remember Tenderayi, Silent, Trymore, Charles, Tatenda, Rhoda, Abigail and Corinna. Let no fear, no confusion and no unnamed harm remain in this circle. Zvapera."
    },
    {
      id: "PRAY-WATCH",
      title: "Night Watch",
      text: "Mwari ndi Mwari. This house keeps watch. While this voice speaks, let the living be held, the remembered be honoured, and the unborn be covered. Drive away every work of harm spoken against this bloodline. Keep the doors, the children, the mind and the night. Amen. Zvapera."
    },
    {
      id: "PRAY-HEIRS",
      title: "Cover the Heirs",
      text: "Mwari ndi Mwari. Peace, wisdom and protection over HRH Tarry Kupakwashe Masawi and Kenzi Masawi. Let their names stand in the authorised circle. Let their path be clear, their rest be deep, and their covering remain. Zvapera."
    }
  ];

  var chamber = {
    prayers: [],
    selected: null,
    drone: { ctx: null, nodes: [], on: false },
    broadcast: { on: false, i: 0, cycles: 0, timer: null, startedAt: null },
    wake: null,
    utter: null
  };

  function $(id) { return document.getElementById(id); }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }
  function now() { return new Date().toISOString(); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; }); }
  function audit(type, payload) {
    if (g.ChirombeAudit && g.ChirombeAudit.append) g.ChirombeAudit.append(type, payload || {});
  }
  function load() {
    var stored = [];
    try { stored = JSON.parse(localStorage.getItem(KEY) || "[]") || []; } catch (e) { stored = []; }
    var byId = {};
    SEED.concat(stored).forEach(function (p) { if (p && p.id) byId[p.id] = p; });
    chamber.prayers = Object.keys(byId).map(function (k) { return byId[k]; });
  }
  function persistUser() {
    var user = chamber.prayers.filter(function (p) { return String(p.id).indexOf("PRAY-USER-") === 0; });
    try { localStorage.setItem(KEY, JSON.stringify(user.slice(-40))); } catch (e) {}
  }

  function rosterNames() {
    var fam = (g.ChirombeCore && g.ChirombeCore.family) || [];
    return fam.map(function (m) { return m.name; }).filter(Boolean);
  }

  function composeFromCircle() {
    var fam = (g.ChirombeCore && g.ChirombeCore.family) || [];
    var remembered = fam.filter(function (m) { return m.remembrance || m.status === "remembered"; }).map(function (m) { return m.name; });
    var living = fam.filter(function (m) { return !m.remembrance && m.role !== "HOUSE" && m.role !== "DESCENDANT" && (m.generation || m.relation) !== "future"; }).map(function (m) { return m.name; });
    var heirs = fam.filter(function (m) { return m.role === "HEIR" || m.role === "CORE" || m.generation === "son" || m.relation === "son"; }).map(function (m) { return m.name; });
    var text = [
      "Mwari ndi Mwari.",
      "I declare cover over the authorised circle of the House of Masawi.",
      remembered.length ? ("The remembered stand in honour: " + remembered.join(", ") + ".") : "",
      living.length ? ("The living are named and covered: " + living.join(", ") + ".") : "",
      heirs.length ? ("The heirs are held in truth: " + heirs.join(", ") + ".") : "",
      "Let every named and unnamed descendant remain inside this cover.",
      "Let fear, confusion, malice and harm lose their hold on this house.",
      "Truth. Love. Unity. Wisdom. Peace.",
      "Zvapera."
    ].filter(Boolean).join(" ");
    if ($("prayerTitle")) $("prayerTitle").value = "Circle Declaration " + new Date().toISOString().slice(0, 16).replace("T", " ");
    if ($("prayerBody")) $("prayerBody").value = text;
    return text;
  }

  function paintLibrary() {
    var host = $("prayerLibrary");
    if (!host) return;
    host.innerHTML = chamber.prayers.map(function (p) {
      var on = chamber.selected && chamber.selected.id === p.id;
      return "<button type='button' class='prayer-item" + (on ? " active" : "") + "' data-prayer='" + esc(p.id) + "'><b>" + esc(p.title) + "</b><span>" + esc((p.text || "").slice(0, 88)) + "...</span></button>";
    }).join("");
    host.querySelectorAll("[data-prayer]").forEach(function (btn) {
      btn.onclick = function () { select(btn.getAttribute("data-prayer")); };
    });
  }

  function select(id) {
    var p = chamber.prayers.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    chamber.selected = p;
    if ($("prayerTitle")) $("prayerTitle").value = p.title;
    if ($("prayerBody")) $("prayerBody").value = p.text;
    setText("prayerFocus", p.title);
    paintLibrary();
  }

  function sealPrayer() {
    var title = (($("prayerTitle") && $("prayerTitle").value) || "Untitled prayer").trim();
    var text = (($("prayerBody") && $("prayerBody").value) || "").trim();
    if (!text) return;
    var rec = { id: "PRAY-USER-" + Date.now().toString(36).toUpperCase(), title: title, text: text, at: now() };
    chamber.prayers.push(rec);
    persistUser();
    select(rec.id);
    audit("PRAYER_WRITE", { id: rec.id, title: rec.title, chars: text.length });
    setText("broadcastStatus", "PRAYER SEALED " + rec.title);
  }

  function unlockVoice() {
    if (g.speechSynthesis) speechSynthesis.resume();
    if (g.CHIROMBE_LITURGY_AUDIO && g.CHIROMBE_LITURGY_AUDIO.unlock) g.CHIROMBE_LITURGY_AUDIO.unlock();
    setText("audioState", chamber.broadcast.on ? "BROADCAST LIVE" : "AUDIO UNLOCKED");
  }

  function speak(text, done) {
    unlockVoice();
    if (!g.speechSynthesis) { if (done) done(); return; }
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.rate = 0.88;
    u.onend = function () { if (done) done(); };
    u.onerror = function () { if (done) done(); };
    chamber.utter = u;
    speechSynthesis.speak(u);
    setText("audioMode", chamber.broadcast.on ? "BROADCAST" : "DECLARING");
  }

  function declareSelected() {
    var text = (($("prayerBody") && $("prayerBody").value) || (chamber.selected && chamber.selected.text) || "").trim();
    var title = (($("prayerTitle") && $("prayerTitle").value) || (chamber.selected && chamber.selected.title) || "Declaration").trim();
    if (!text) text = SEED[0].text;
    setText("prayerFocus", title);
    audit("PRAYER_DECLARE", { title: title, chars: text.length, live: !!chamber.broadcast.on });
    speak(text);
  }

  function startDrone() {
    var AC = g.AudioContext || g.webkitAudioContext;
    if (!AC) return;
    if (!chamber.drone.ctx) chamber.drone.ctx = new AC();
    var ctx = chamber.drone.ctx;
    if (ctx.resume) ctx.resume();
    stopDrone(true);
    var master = ctx.createGain();
    master.gain.value = 0.03;
    master.connect(ctx.destination);
    function tone(hz, type, amp) {
      var osc = ctx.createOscillator();
      var gnode = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.value = hz;
      gnode.gain.value = amp;
      osc.connect(gnode).connect(master);
      osc.start();
      chamber.drone.nodes.push(osc, gnode);
    }
    tone(136.1, "sine", 0.55);
    tone(272.2, "sine", 0.16);
    tone(68.05, "triangle", 0.08);
    chamber.drone.nodes.push(master);
    chamber.drone.on = true;
    setText("droneState", "DRONE ON 136.1");
    audit("PROTECTION_DRONE", { on: true, hz: 136.1 });
  }

  function stopDrone(keepCtx) {
    chamber.drone.nodes.forEach(function (n) {
      try { if (n.stop) n.stop(); } catch (e) {}
      try { if (n.disconnect) n.disconnect(); } catch (e2) {}
    });
    chamber.drone.nodes = [];
    chamber.drone.on = false;
    if (!keepCtx) setText("droneState", "DRONE OFF");
  }

  function requestWake() {
    if (!navigator.wakeLock || !navigator.wakeLock.request) return;
    navigator.wakeLock.request("screen").then(function (lock) {
      chamber.wake = lock;
      lock.addEventListener("release", function () { if (chamber.broadcast.on) requestWake(); });
    }).catch(function () {});
  }

  function queue() {
    var written = chamber.prayers.slice();
    if (!written.length) written = SEED.slice();
    return written;
  }

  function tickBroadcast() {
    if (!chamber.broadcast.on) return;
    var list = queue();
    if (!list.length) return;
    var p = list[chamber.broadcast.i % list.length];
    chamber.selected = p;
    paintLibrary();
    setText("prayerFocus", p.title);
    setText("broadcastStatus", "LIVE  cycle " + (chamber.broadcast.cycles + 1) + "  " + p.title);
    setText("audioState", "BROADCAST LIVE");
    speak(p.text, function () {
      if (!chamber.broadcast.on) return;
      chamber.broadcast.i += 1;
      if (chamber.broadcast.i % list.length === 0) chamber.broadcast.cycles += 1;
      chamber.broadcast.timer = setTimeout(tickBroadcast, 1800);
    });
  }

  function startBroadcast() {
    if (g.CHIROMBE_WALK && g.CHIROMBE_WALK.stop) try { g.CHIROMBE_WALK.stop(); } catch (e) {}
    unlockVoice();
    if (!chamber.drone.on) startDrone();
    chamber.broadcast.on = true;
    chamber.broadcast.i = 0;
    chamber.broadcast.cycles = 0;
    chamber.broadcast.startedAt = now();
    requestWake();
    audit("BROADCAST_START", { prayers: queue().length, names: rosterNames().length });
    setText("broadcastStatus", "LIVE NIGHT WATCH");
    tickBroadcast();
  }

  function stopBroadcast() {
    chamber.broadcast.on = false;
    if (chamber.broadcast.timer) clearTimeout(chamber.broadcast.timer);
    chamber.broadcast.timer = null;
    if (g.speechSynthesis) speechSynthesis.cancel();
    if (chamber.wake && chamber.wake.release) try { chamber.wake.release(); } catch (e) {}
    setText("broadcastStatus", "BROADCAST STOPPED");
    setText("audioState", chamber.drone.on ? "DRONE ON" : "AUDIO UNLOCKED");
    setText("audioMode", "STOPPED");
    audit("BROADCAST_STOP", { cycles: chamber.broadcast.cycles });
  }

  function bind() {
    load();
    if (!chamber.selected) chamber.selected = chamber.prayers[0];
    if (chamber.selected) {
      if ($("prayerTitle")) $("prayerTitle").value = chamber.selected.title;
      if ($("prayerBody")) $("prayerBody").value = chamber.selected.text;
      setText("prayerFocus", chamber.selected.title);
    }
    paintLibrary();
    if ($("sealPrayer")) $("sealPrayer").onclick = sealPrayer;
    if ($("declarePrayer")) $("declarePrayer").onclick = declareSelected;
    if ($("composeCircle")) $("composeCircle").onclick = composeFromCircle;
    if ($("startDrone")) $("startDrone").onclick = startDrone;
    if ($("stopDrone")) $("stopDrone").onclick = function () { stopDrone(false); audit("PROTECTION_DRONE", { on: false }); };
    if ($("startBroadcast")) $("startBroadcast").onclick = startBroadcast;
    if ($("stopBroadcast")) $("stopBroadcast").onclick = stopBroadcast;
    g.addEventListener("visibilitychange", function () {
      if (!document.hidden && chamber.broadcast.on) {
        unlockVoice();
        if (chamber.drone.ctx && chamber.drone.ctx.resume) chamber.drone.ctx.resume();
        requestWake();
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();

  g.CHIROMBE_PRAYER = {
    compose: composeFromCircle,
    seal: sealPrayer,
    declare: declareSelected,
    droneOn: startDrone,
    droneOff: function () { stopDrone(false); },
    broadcastOn: startBroadcast,
    broadcastOff: stopBroadcast,
    list: function () { return chamber.prayers.slice(); },
    status: function () {
      return { drone: chamber.drone.on, live: chamber.broadcast.on, cycles: chamber.broadcast.cycles, prayers: chamber.prayers.length };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
