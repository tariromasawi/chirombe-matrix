/* CHIROMBE MATRIX 3.0 Phase 10. House voice. Browser speech only. */
(function (g) {
  "use strict";
  var KEY = "CHIROMBE_MATRIX_VOICE_V3";
  var state = { voiceURI: "", track: "BOTH", lastCycle: -1 };

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved) { state.voiceURI = saved.voiceURI || ""; state.track = saved.track || "BOTH"; }
  } catch (e) {}

  function $(id) { return document.getElementById(id); }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ voiceURI: state.voiceURI, track: state.track })); } catch (e) {}
  }

  function voices() {
    return (g.speechSynthesis && speechSynthesis.getVoices()) || [];
  }
  function currentVoice() {
    var list = voices();
    return list.filter(function (v) { return v.voiceURI === state.voiceURI; })[0] || list[0] || null;
  }
  function langFor(track) {
    if (track === "SN") return "sn-ZW";
    return "en-GB";
  }

  function paintVoices() {
    var sel = $("houseVoice");
    if (!sel) return;
    var list = voices();
    var prev = state.voiceURI;
    sel.innerHTML = list.map(function (v) {
      return "<option value=\"" + v.voiceURI.replace(/"/g, "") + "\">" + v.name + " (" + v.lang + ")</option>";
    }).join("");
    if (prev && list.some(function (v) { return v.voiceURI === prev; })) sel.value = prev;
    else if (list[0]) { state.voiceURI = list[0].voiceURI; sel.value = list[0].voiceURI; }
    var v = currentVoice();
    setText("voiceName", v ? v.name : "Browser voice");
    setText("trackState", state.track);
    document.querySelectorAll("[data-track]").forEach(function (b) {
      b.classList.toggle("primary", b.getAttribute("data-track") === state.track);
    });
  }

  function applyUtterance(u, track) {
    var v = currentVoice();
    if (v) u.voice = v;
    u.rate = 0.88;
    u.lang = langFor(track || state.track);
    return u;
  }

  function shonaLiving(en) {
    var fam = (g.ChirombeCore && g.ChirombeCore.family) || [];
    var remembered = fam.filter(function (m) { return m.remembrance || m.status === "remembered"; }).map(function (m) { return m.name; });
    var living = fam.filter(function (m) {
      var gen = m.generation || m.relation || "";
      return !m.remembrance && m.role !== "HOUSE" && m.role !== "DESCENDANT" && gen !== "future";
    }).map(function (m) { return m.name; });
    var heirs = fam.filter(function (m) {
      return m.role === "HEIR" || m.generation === "son" || m.relation === "son" || m.relation === "adopted nephew/son";
    }).map(function (m) { return m.name; });
    return [
      "Mwari ndi Mwari.",
      "Iyi ndiyo liturgy mhenyu yeImba yeMasawi.",
      living.length ? ("Vapenyu vanovharirwa: " + living.join(", ") + ".") : "",
      remembered.length ? ("Vakafa vanorangarirwa nerukudzo: " + remembered.join(", ") + ".") : "",
      heirs.length ? ("Vadyi venhaka vanochengetwa: " + heirs.join(", ") + ".") : "",
      "Chokwadi. Rudo. Kubatana. Ungwaru. Runyararo.",
      "Zvapera."
    ].filter(Boolean).join(" ");
  }

  function upsertLiving() {
    if (!g.CHIROMBE_LIVING || !g.CHIROMBE_LIVING.compose) return;
    if (!g.CHIROMBE_PRAYER || !g.CHIROMBE_PRAYER.ingest) return;
    var prayer = g.CHIROMBE_LIVING.compose();
    var en = { id: "PRAY-USER-LIVING-EN", title: "Living Liturgy EN", text: prayer.text, lang: "EN" };
    var sn = { id: "PRAY-USER-LIVING-SN", title: "Living Liturgy SN", text: shonaLiving(prayer), lang: "SN" };
    if (state.track === "EN" || state.track === "BOTH") g.CHIROMBE_PRAYER.ingest(en, { silent: true });
    if (state.track === "SN" || state.track === "BOTH") g.CHIROMBE_PRAYER.ingest(sn, { silent: true });
    if (state.track === "EN") g.CHIROMBE_PRAYER.ingest({ id: "PRAY-USER-LIVING-SN", title: "Living Liturgy SN", text: "", lang: "SN" }, { silent: true, remove: true });
    if (state.track === "SN") g.CHIROMBE_PRAYER.ingest({ id: "PRAY-USER-LIVING-EN", title: "Living Liturgy EN", text: "", lang: "EN" }, { silent: true, remove: true });
    setText("livingStatus", "REFRESHED " + state.track);
    if ($("prayerTitle")) $("prayerTitle").value = state.track === "SN" ? sn.title : en.title;
    if ($("prayerBody")) $("prayerBody").value = state.track === "SN" ? sn.text : en.text;
  }

  function speakTracked(text, done) {
    if (!g.speechSynthesis) { if (done) done(); return; }
    speechSynthesis.cancel();
    var parts = [];
    if (state.track === "SN") parts.push({ text: text, track: "SN" });
    else if (state.track === "EN") parts.push({ text: text, track: "EN" });
    else parts.push({ text: text, track: "EN" });
    function next() {
      if (!parts.length) { if (done) done(); return; }
      var part = parts.shift();
      var u = new SpeechSynthesisUtterance(part.text);
      applyUtterance(u, part.track);
      u.onend = next;
      u.onerror = next;
      speechSynthesis.speak(u);
    }
    next();
  }

  function bind() {
    paintVoices();
    if (g.speechSynthesis) {
      speechSynthesis.onvoiceschanged = paintVoices;
      setTimeout(paintVoices, 400);
    }
    if ($("houseVoice")) $("houseVoice").onchange = function () {
      state.voiceURI = $("houseVoice").value;
      save();
      paintVoices();
    };
    document.querySelectorAll("[data-track]").forEach(function (b) {
      b.onclick = function () {
        state.track = b.getAttribute("data-track");
        save();
        paintVoices();
        upsertLiving();
      };
    });
    g.addEventListener("chirombe-watch-cycle", function (ev) {
      var n = ev.detail && ev.detail.cycles;
      if (n === state.lastCycle) return;
      state.lastCycle = n;
      upsertLiving();
    });
    if (g.CHIROMBE_WATCH && g.CHIROMBE_WATCH.enter) {
      var enter = g.CHIROMBE_WATCH.enter;
      g.CHIROMBE_WATCH.enter = function () {
        upsertLiving();
        return enter.apply(g.CHIROMBE_WATCH, arguments);
      };
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();

  g.CHIROMBE_VOICE = {
    current: currentVoice,
    lang: function () { return langFor(state.track === "SN" ? "SN" : "EN"); },
    track: function () { return state.track; },
    apply: applyUtterance,
    refreshLiving: upsertLiving,
    speak: speakTracked
  };
})(typeof window !== "undefined" ? window : globalThis);
