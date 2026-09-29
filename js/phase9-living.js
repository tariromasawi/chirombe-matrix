/* CHIROMBE MATRIX 3.0 Phase 9. Living liturgy from events. */
(function (g) {
  "use strict";

  function $(id) { return document.getElementById(id); }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }
  function names(list) { return (list || []).map(function (m) { return m.name || m; }).filter(Boolean); }
  function all(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  function roster() {
    return (g.ChirombeCore && g.ChirombeCore.family) || [];
  }
  function lastWalk() {
    return (g.CHIROMBE_LEDGER && g.CHIROMBE_LEDGER.list && g.CHIROMBE_LEDGER.list()[0]) || null;
  }
  function recentAudit() {
    var chain = (g.ChirombeAudit && g.ChirombeAudit.export) ? g.ChirombeAudit.export() : [];
    return chain.slice(-5).reverse();
  }

  function compose() {
    var fam = roster();
    var remembered = names(fam.filter(function (m) { return m.remembrance || m.status === "remembered"; }));
    var living = names(fam.filter(function (m) {
      var gen = m.generation || m.relation || "";
      return !m.remembrance && m.role !== "HOUSE" && m.role !== "DESCENDANT" && gen !== "future";
    }));
    var heirs = names(fam.filter(function (m) {
      return m.role === "HEIR" || m.generation === "son" || m.relation === "son" || m.relation === "adopted nephew/son";
    }));
    var walk = lastWalk();
    var events = recentAudit().map(function (r) { return r.type; }).filter(Boolean);
    var when = new Date().toISOString().slice(0, 16).replace("T", " ");
    var text = [
      "Mwari ndi Mwari.",
      "This is the living liturgy of the House of Masawi, written from the life of this circle.",
      living.length ? ("The living are covered: " + living.join(", ") + ".") : "",
      remembered.length ? ("The remembered are honoured: " + remembered.join(", ") + ".") : "",
      heirs.length ? ("The heirs are held: " + heirs.join(", ") + ".") : "",
      walk ? ("The last House walk " + walk.id + " is received. " + (walk.reached || 0) + " of " + (walk.total || 0) + " names were spoken, outcome " + (walk.outcome || "recorded") + ".") : "No sealed walk stands yet. The circle still waits to be named.",
      events.length ? ("The house records these movements: " + events.join(", ") + ".") : "",
      "Let every advancement of this system serve cover, remembrance and peace.",
      "Let fear, confusion and harm lose their claim on this house.",
      "Truth. Love. Unity. Wisdom. Peace.",
      "Zvapera."
    ].filter(Boolean).join(" ");
    return { title: "Living Liturgy " + when, text: text, source: { walk: walk && walk.id, events: events, nodes: fam.length } };
  }

  function fill(prayer) {
    if ($("prayerTitle")) $("prayerTitle").value = prayer.title;
    if ($("prayerBody")) $("prayerBody").value = prayer.text;
    setText("prayerFocus", prayer.title);
    setText("livingStatus", prayer.title);
  }

  function release(opts) {
    opts = opts || {};
    var prayer = compose();
    fill(prayer);
    if (g.CHIROMBE_PRAYER && g.CHIROMBE_PRAYER.seal) g.CHIROMBE_PRAYER.seal();
    if (g.ChirombeAudit && g.ChirombeAudit.append) {
      g.ChirombeAudit.append("LIVING_LITURGY", { title: prayer.title, walk: prayer.source.walk, events: prayer.source.events, nodes: prayer.source.nodes });
    }
    if (opts.declare && g.CHIROMBE_PRAYER && g.CHIROMBE_PRAYER.declare) g.CHIROMBE_PRAYER.declare();
    if (opts.broadcast && g.CHIROMBE_PRAYER && g.CHIROMBE_PRAYER.broadcastOn) g.CHIROMBE_PRAYER.broadcastOn();
    return prayer;
  }

  function bind() {
    all("#composeLiving").forEach(function (btn) {
      btn.onclick = function () { release({ declare: false, broadcast: false }); };
    });
    all("#releaseLiving").forEach(function (btn) {
      btn.onclick = function () { release({ declare: true, broadcast: true }); };
    });
    g.addEventListener("chirombe-walk-complete", function () { release({ declare: false, broadcast: false }); });
    g.addEventListener("chirombe-walk-stop", function () { release({ declare: false, broadcast: false }); });
    if (g.CHIROMBE_WATCH && g.CHIROMBE_WATCH.enter) {
      var enter = g.CHIROMBE_WATCH.enter;
      g.CHIROMBE_WATCH.enter = function () {
        release({ declare: false, broadcast: false });
        return enter.apply(g.CHIROMBE_WATCH, arguments);
      };
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();

  g.CHIROMBE_LIVING = { compose: compose, release: release };
})(typeof window !== "undefined" ? window : globalThis);
