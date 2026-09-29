/* CHIROMBE MATRIX 3.0 Phase 5/6. House walk. Browser speech only. */
(function (g) {
  "use strict";
  var walk = { on: false, i: 0, queue: [], utter: null, id: null, startedAt: null, replayOf: null };

  function $(id) { return document.getElementById(id); }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }
  function namesOf() { return walk.queue.map(function (n) { return n.name; }); }
  function emit(type, extra) {
    var detail = Object.assign({
      id: walk.id,
      i: walk.i,
      total: walk.queue.length,
      names: namesOf(),
      startedAt: walk.startedAt,
      replayOf: walk.replayOf,
      current: walk.queue[walk.i] ? walk.queue[walk.i].name : null
    }, extra || {});
    if (g.dispatchEvent) g.dispatchEvent(new CustomEvent(type, { detail: detail }));
  }

  function lineFor(n) {
    if (!n) return "Mwari ndi Mwari. Zvapera.";
    if (n.remembrance) return "Mwari ndi Mwari. " + n.name + " is remembered with dignity, love and faith.";
    if (n.future) return "Mwari ndi Mwari. Cover over the named and unnamed descendants of the House of Masawi.";
    if (n.house) return "Mwari ndi Mwari. Seal over the House of Masawi.";
    if (n.core) return "Mwari ndi Mwari. Peace, wisdom and protection over " + n.name + ", core of this circle.";
    if (n.heir) return "Mwari ndi Mwari. Cover over " + n.name + ", heir of this House.";
    return "Mwari ndi Mwari. Peace, wisdom and protection over " + n.name + ".";
  }

  function markCards(name) {
    document.querySelectorAll("#familyGrid .family-node").forEach(function (btn) {
      var label = btn.querySelector("b");
      btn.classList.toggle("walking", !!(label && label.textContent === name));
    });
  }

  function status(msg, mode) {
    setText("walkStatus", msg);
    setText("liturgyFocus", walk.on && walk.queue[walk.i] ? walk.queue[walk.i].name : (msg || "House of Masawi"));
    setText("audioMode", mode || (walk.on ? "HOUSE WALK" : "STANDBY"));
  }

  function nodeFromName(name) {
    var fam = (g.ChirombeCore && g.ChirombeCore.family) || [];
    var m = fam.filter(function (x) { return x.name === name; })[0];
    if (m) {
      var gen = m.generation || m.relation || "";
      return {
        name: m.name,
        generation: gen,
        role: m.role || "NODE",
        remembrance: !!(m.remembrance || m.status === "remembered"),
        future: !!(m.anonymousUntilNamed || gen === "future" || m.role === "DESCENDANT"),
        house: m.role === "HOUSE",
        heir: m.role === "HEIR" || gen === "son" || gen === "adopted nephew/son",
        core: m.role === "CORE",
        raw: m
      };
    }
    return { name: name, generation: "record", role: "RECORD", remembrance: false, future: false, house: false, heir: false, core: false, raw: { name: name } };
  }

  function stopWalk() {
    var snapshot = { names: namesOf(), reached: walk.i, total: walk.queue.length, id: walk.id, startedAt: walk.startedAt, replayOf: walk.replayOf };
    walk.on = false;
    if (g.speechSynthesis) speechSynthesis.cancel();
    markCards(null);
    status("WALK STOPPED", "STOPPED");
    emit("chirombe-walk-stop", { outcome: "STOPPED", reached: snapshot.reached, names: snapshot.names, total: snapshot.total });
    if (g.ChirombeAudit && g.ChirombeAudit.append) g.ChirombeAudit.append("HOUSE_WALK_STOP", { id: snapshot.id, reached: snapshot.reached, total: snapshot.total });
    walk.queue = [];
    walk.i = 0;
  }

  function finish() {
    var snapshot = { names: namesOf(), total: walk.queue.length, id: walk.id, startedAt: walk.startedAt, replayOf: walk.replayOf };
    walk.on = false;
    markCards(null);
    status("WALK COMPLETE ZVAPERA", "COMPLETE");
    if (g.speechSynthesis) {
      var close = new SpeechSynthesisUtterance("Zvapera. The House walk is complete.");
      close.rate = 0.88;
      speechSynthesis.speak(close);
    }
    emit("chirombe-walk-complete", { outcome: "COMPLETE", reached: snapshot.total, names: snapshot.names, total: snapshot.total });
    if (g.ChirombeAudit && g.ChirombeAudit.append) g.ChirombeAudit.append("HOUSE_WALK_COMPLETE", { id: snapshot.id, nodes: snapshot.total });
  }

  function speakCurrent() {
    if (!walk.on) return;
    if (walk.i >= walk.queue.length) { finish(); return; }
    var n = walk.queue[walk.i];
    if (g.CHIROMBE_BLOODLINE && g.CHIROMBE_BLOODLINE.select) g.CHIROMBE_BLOODLINE.select(n);
    markCards(n.name);
    status((walk.i + 1) + " / " + walk.queue.length + "  " + n.name, walk.replayOf ? "REPLAY" : "WALKING");
    if (!g.speechSynthesis) {
      walk.i += 1;
      setTimeout(speakCurrent, 900);
      return;
    }
    var u = new SpeechSynthesisUtterance(lineFor(n));
    u.rate = 0.88;
    u.onend = function () {
      if (!walk.on) return;
      walk.i += 1;
      setTimeout(speakCurrent, 380);
    };
    u.onerror = function () {
      if (!walk.on) return;
      walk.i += 1;
      setTimeout(speakCurrent, 380);
    };
    walk.utter = u;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  function begin(queue, replayOf) {
    if (!queue.length) { status("NO CIRCLE", "IDLE"); return; }
    if (g.speechSynthesis) speechSynthesis.cancel();
    walk.on = true;
    walk.i = 0;
    walk.queue = queue;
    walk.id = "WALK-" + Date.now().toString(36).toUpperCase();
    walk.startedAt = new Date().toISOString();
    walk.replayOf = replayOf || null;
    emit("chirombe-walk-start", { outcome: replayOf ? "REPLAY" : "LIVE" });
    if (g.ChirombeAudit && g.ChirombeAudit.append) g.ChirombeAudit.append("HOUSE_WALK_START", { id: walk.id, nodes: queue.length, replayOf: walk.replayOf });
    status("1 / " + queue.length + "  " + queue[0].name, walk.replayOf ? "REPLAY" : "WALKING");
    speakCurrent();
  }

  function startWalk() {
    var fam = (g.ChirombeCore && g.ChirombeCore.family) || [];
    var TIER = {"great-great-grandfather":0,"great-grandfather":1,"grandfather":2,"grandmother":2,"father":3,"mother":3,"self":4,"brother":4,"sister":4,"son":5,"adopted nephew/son":5,"house":6,"future":7};
    var queue = fam.map(function (m, i) {
      var gen = m.generation || m.relation || "";
      return {
        name: m.name || ("NODE " + (i + 1)),
        generation: gen,
        role: m.role || "NODE",
        remembrance: !!(m.remembrance || m.status === "remembered"),
        protect: m.protect !== false,
        future: !!(m.anonymousUntilNamed || gen === "future" || m.role === "DESCENDANT"),
        house: m.role === "HOUSE",
        heir: m.role === "HEIR" || gen === "son" || gen === "adopted nephew/son",
        core: m.role === "CORE",
        tier: TIER.hasOwnProperty(gen) ? TIER[gen] : 4,
        raw: m
      };
    }).sort(function (a, b) {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return a.name.localeCompare(b.name);
    });
    begin(queue, null);
  }

  function startFrom(names, replayOf) {
    var list = (names || []).map(nodeFromName);
    begin(list, replayOf || "LEDGER");
  }

  function bind() {
    if ($("startWalk")) $("startWalk").onclick = startWalk;
    if ($("stopWalk")) $("stopWalk").onclick = stopWalk;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();

  g.CHIROMBE_WALK = {
    start: startWalk,
    stop: stopWalk,
    startFrom: startFrom,
    status: function () {
      return { on: walk.on, i: walk.i, total: walk.queue.length, id: walk.id, names: namesOf(), replayOf: walk.replayOf };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
