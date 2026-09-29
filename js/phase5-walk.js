/* CHIROMBE MATRIX 3.0 Phase 5. House walk. Browser speech only. */
(function (g) {
  "use strict";
  var walk = { on: false, i: 0, queue: [], utter: null };

  function $(id) { return document.getElementById(id); }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }

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

  function stopWalk() {
    walk.on = false;
    walk.queue = [];
    walk.i = 0;
    if (g.speechSynthesis) speechSynthesis.cancel();
    markCards(null);
    status("WALK STOPPED", "STOPPED");
    if (g.ChirombeAudit && g.ChirombeAudit.append) g.ChirombeAudit.append("HOUSE_WALK_STOP", {});
  }

  function finish() {
    walk.on = false;
    markCards(null);
    status("WALK COMPLETE ZVAPERA", "COMPLETE");
    if (g.speechSynthesis) {
      var close = new SpeechSynthesisUtterance("Zvapera. The House walk is complete.");
      close.rate = 0.88;
      speechSynthesis.speak(close);
    }
    if (g.ChirombeAudit && g.ChirombeAudit.append) g.ChirombeAudit.append("HOUSE_WALK_COMPLETE", {});
  }

  function speakCurrent() {
    if (!walk.on) return;
    if (walk.i >= walk.queue.length) { finish(); return; }
    var n = walk.queue[walk.i];
    if (g.CHIROMBE_BLOODLINE && g.CHIROMBE_BLOODLINE.select) g.CHIROMBE_BLOODLINE.select(n);
    markCards(n.name);
    status((walk.i + 1) + " / " + walk.queue.length + "  " + n.name, "WALKING");
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

  function startWalk() {
    var src = (g.CHIROMBE_BLOODLINE && g.CHIROMBE_BLOODLINE.stats) ? null : null;
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
    if (!queue.length) { status("NO CIRCLE", "IDLE"); return; }
    if (g.speechSynthesis) speechSynthesis.cancel();
    walk.on = true;
    walk.i = 0;
    walk.queue = queue;
    if (g.ChirombeAudit && g.ChirombeAudit.append) g.ChirombeAudit.append("HOUSE_WALK_START", { nodes: queue.length });
    status("1 / " + queue.length + "  " + queue[0].name, "WALKING");
    speakCurrent();
  }

  function bind() {
    if ($("startWalk")) $("startWalk").onclick = startWalk;
    if ($("stopWalk")) $("stopWalk").onclick = stopWalk;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();

  g.CHIROMBE_WALK = { start: startWalk, stop: stopWalk, status: function () { return { on: walk.on, i: walk.i, total: walk.queue.length }; } };
})(typeof window !== "undefined" ? window : globalThis);
