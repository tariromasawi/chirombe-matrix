/* CHIROMBE MATRIX 3.0 Phase 6. Dated House liturgy records. Browser-local only. */
(function (g) {
  "use strict";
  var KEY = "CHIROMBE_MATRIX_WALKS_V3";
  var open = null;

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]") || []; } catch (e) { return []; }
  }
  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(-80))); } catch (e) {}
  }
  function stamp() { return new Date().toISOString(); }
  function pretty(iso) {
    if (!iso) return "-";
    try { return new Date(iso).toUTCString().replace(" GMT", " UTC"); } catch (e) { return iso; }
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return "&#" + c.charCodeAt(0) + ";"; });
  }

  function list() { return load().slice().reverse(); }

  function begin(detail) {
    open = {
      id: detail.id,
      startedAt: detail.startedAt || stamp(),
      endedAt: null,
      outcome: detail.outcome || "LIVE",
      names: detail.names || [],
      reached: 0,
      total: detail.total || (detail.names || []).length,
      replayOf: detail.replayOf || null
    };
    paint();
  }

  function seal(detail) {
    var rec = open || {
      id: detail.id || ("WALK-" + Date.now().toString(36).toUpperCase()),
      startedAt: detail.startedAt || stamp(),
      names: detail.names || [],
      total: detail.total || 0,
      replayOf: detail.replayOf || null
    };
    rec.endedAt = stamp();
    rec.outcome = detail.outcome || "COMPLETE";
    rec.names = detail.names && detail.names.length ? detail.names : rec.names;
    rec.reached = typeof detail.reached === "number" ? detail.reached : rec.total;
    rec.total = detail.total || rec.names.length;
    rec.circle = rec.names.join(" · ");
    var all = load();
    if (!all.some(function (x) { return x.id === rec.id && x.endedAt; })) all.push(rec);
    save(all);
    if (g.ChirombeAudit && g.ChirombeAudit.append) {
      g.ChirombeAudit.append("HOUSE_LITURGY_RECORD", {
        id: rec.id,
        outcome: rec.outcome,
        startedAt: rec.startedAt,
        endedAt: rec.endedAt,
        reached: rec.reached,
        total: rec.total,
        names: rec.names,
        replayOf: rec.replayOf
      });
    }
    open = null;
    paint();
    return rec;
  }

  function replay(id) {
    var rec = load().filter(function (x) { return x.id === id; })[0];
    if (!rec) return;
    if (g.CHIROMBE_WALK && g.CHIROMBE_WALK.startFrom) {
      var panel = document.querySelector('[data-panel="bloodline"]');
      if (panel) panel.click();
      g.CHIROMBE_WALK.startFrom(rec.names, rec.id);
    }
  }

  function exportLedger() {
    var blob = new Blob([JSON.stringify({ house: "Masawi", seal: "77-99-33", exportedAt: stamp(), walks: load() }, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "chirombe-house-walks.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function paint() {
    var host = document.getElementById("walkLedger");
    if (!host) return;
    var rows = list();
    if (!rows.length) {
      host.innerHTML = "<p class='honest'>No sealed House walk yet. Start a walk from BLOODLINE. Records stay in this browser.</p>";
      return;
    }
    host.innerHTML = rows.map(function (r) {
      return "<article class='walk-record'>" +
        "<div class='walk-record-head'><b>" + esc(r.id) + "</b><span>" + esc(r.outcome) + "</span></div>" +
        "<div class='walk-record-meta'>" + esc(pretty(r.startedAt)) + " · " + esc(String(r.reached || 0)) + "/" + esc(String(r.total || 0)) + " names" +
        (r.replayOf ? " · replay of " + esc(r.replayOf) : "") + "</div>" +
        "<div class='walk-record-circle'>" + esc(r.circle || (r.names || []).join(" · ")) + "</div>" +
        "<div class='bl-actions'><button type='button' data-replay='" + esc(r.id) + "'>REPLAY WALK</button></div>" +
        "</article>";
    }).join("");
    host.querySelectorAll("[data-replay]").forEach(function (btn) {
      btn.onclick = function () { replay(btn.getAttribute("data-replay")); };
    });
  }

  function bind() {
    g.addEventListener("chirombe-walk-start", function (ev) { begin(ev.detail || {}); });
    g.addEventListener("chirombe-walk-stop", function (ev) { seal(ev.detail || {}); });
    g.addEventListener("chirombe-walk-complete", function (ev) { seal(ev.detail || {}); });
    var exp = document.getElementById("exportWalks");
    if (exp) exp.onclick = exportLedger;
    paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();

  g.CHIROMBE_LEDGER = { list: list, replay: replay, export: exportLedger, paint: paint };
})(typeof window !== "undefined" ? window : globalThis);
