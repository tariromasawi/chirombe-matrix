/* CHIROMBE MATRIX 3.0 Phase 8. Watch Device. Browser session only. */
(function (g) {
  "use strict";
  var watch = {
    on: false,
    advancements: [],
    lastHash: "",
    heartbeat: null
  };

  function $(id) { return document.getElementById(id); }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }

  function loadAdvancements() {
    fetch("./data/advancements.json").then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (d && d.items) watch.advancements = d.items;
    }).catch(function () {});
  }

  function latestAudit() {
    var chain = (g.ChirombeAudit && g.ChirombeAudit.export) ? g.ChirombeAudit.export() : [];
    return chain.slice(-6).reverse();
  }

  function lastWalk() {
    var rows = (g.CHIROMBE_LEDGER && g.CHIROMBE_LEDGER.list) ? g.CHIROMBE_LEDGER.list() : [];
    return rows[0] || null;
  }

  function healthLine() {
    var snap = (g.ChirombeHealth && g.ChirombeHealth.snapshot) ? g.ChirombeHealth.snapshot() : {};
    var nodes = snap.familyNodes || ((g.ChirombeCore && g.ChirombeCore.family) || []).length;
    var audit = snap.auditValid ? "valid" : "check";
    return "System update. Matrix 3.0.8 Watch Device is online. Authorised nodes " + nodes + ". Audit chain " + audit + ". Session remains live while this screen stays open.";
  }

  function bulletinFromAudit(rec) {
    var type = rec && rec.type ? rec.type : "EVENT";
    var map = {
      BOOT: "Boot complete.",
      PROTECT: "Protection model armed.",
      PRAYER_WRITE: "A new prayer was sealed.",
      PRAYER_DECLARE: "A prayer was declared.",
      HOUSE_WALK_START: "A House walk began.",
      HOUSE_WALK_COMPLETE: "A House walk completed. Zvapera.",
      HOUSE_LITURGY_RECORD: "A liturgy record was sealed.",
      BROADCAST_START: "Night watch broadcast started.",
      BROADCAST_STOP: "Night watch broadcast stopped.",
      WATCH_ENTER: "Watch Device engaged.",
      ENGINE: "Engine state changed."
    };
    return "Advancement bulletin. " + (map[type] || ("System event " + type + "."));
  }

  function bulletins() {
    var out = [];
    out.push({ id: "SYS-HEALTH", title: "System Update", text: healthLine() });
    watch.advancements.forEach(function (item) {
      out.push({
        id: "ADV-" + item.id,
        title: item.title || item.id,
        text: "Advancement. " + (item.text || item.title)
      });
    });
    var walk = lastWalk();
    if (walk) {
      out.push({
        id: "WALK-" + walk.id,
        title: "Liturgy Record",
        text: "System update. Last House walk " + walk.id + " ended " + (walk.outcome || "recorded") + ". " + (walk.reached || 0) + " of " + (walk.total || 0) + " names were spoken."
      });
    }
    latestAudit().forEach(function (rec) {
      out.push({
        id: "AUD-" + rec.hash,
        title: rec.type,
        text: bulletinFromAudit(rec)
      });
    });
    return out;
  }

  function paintWatch() {
    setText("watchNow", watch.on ? "WATCH LIVE" : "WATCH READY");
    setText("watchLine", watch.on ? "Leave this screen on. Prayers and system updates are in the live queue." : "Engage Watch Device to hold the night screen.");
    var host = $("watchFeed");
    if (!host) return;
    host.innerHTML = bulletins().slice(0, 8).map(function (b) {
      return "<div><b>" + String(b.title).replace(/[&<>]/g, "") + "</b> " + String(b.text).replace(/[&<>]/g, "") + "</div>";
    }).join("");
  }

  function enterWatch() {
    watch.on = true;
    document.body.classList.add("watch-on");
    if ($("watchLayer")) $("watchLayer").classList.remove("hidden");
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(function () {});
    }
    if (g.ChirombeAudit && g.ChirombeAudit.append) g.ChirombeAudit.append("WATCH_ENTER", { version: "3.0.8" });
    if (g.CHIROMBE_PRAYER && g.CHIROMBE_PRAYER.droneOn) g.CHIROMBE_PRAYER.droneOn();
    if (g.CHIROMBE_PRAYER && g.CHIROMBE_PRAYER.broadcastOn) g.CHIROMBE_PRAYER.broadcastOn();
    paintWatch();
    if (watch.heartbeat) clearInterval(watch.heartbeat);
    watch.heartbeat = setInterval(function () {
      if (!watch.on) return;
      if (g.speechSynthesis) speechSynthesis.resume();
      if (g.CHIROMBE_PRAYER && g.CHIROMBE_PRAYER.status && !g.CHIROMBE_PRAYER.status().live) {
        g.CHIROMBE_PRAYER.broadcastOn();
      }
      paintWatch();
    }, 20000);
  }

  function exitWatch() {
    watch.on = false;
    document.body.classList.remove("watch-on");
    if ($("watchLayer")) $("watchLayer").classList.add("hidden");
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
    if (watch.heartbeat) clearInterval(watch.heartbeat);
    watch.heartbeat = null;
    if (g.CHIROMBE_PRAYER && g.CHIROMBE_PRAYER.broadcastOff) g.CHIROMBE_PRAYER.broadcastOff();
    if (g.ChirombeAudit && g.ChirombeAudit.append) g.ChirombeAudit.append("WATCH_EXIT", {});
    paintWatch();
  }

  function bind() {
    loadAdvancements();
    if ($("enterWatch")) $("enterWatch").onclick = enterWatch;
    if ($("exitWatch")) $("exitWatch").onclick = exitWatch;
    if ($("watchAllNight")) $("watchAllNight").onclick = enterWatch;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(function () {});
    }
    g.addEventListener("pageshow", function () {
      if (watch.on && g.CHIROMBE_PRAYER && g.CHIROMBE_PRAYER.broadcastOn) g.CHIROMBE_PRAYER.broadcastOn();
    });
    paintWatch();
    setInterval(paintWatch, 8000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();

  g.CHIROMBE_WATCH = {
    enter: enterWatch,
    exit: exitWatch,
    bulletins: bulletins,
    status: function () { return { on: watch.on, bulletins: bulletins().length }; }
  };
})(typeof window !== "undefined" ? window : globalThis);
