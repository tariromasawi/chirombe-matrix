/* CHIROMBE MATRIX 3.0 Phase 4 overlay. Seals roster. Binds liturgy to selected node. */
(function (g) {
  "use strict";
  function normName(s) {
    return String(s || "").toLowerCase().replace(/[\u2014\u2013-]+/g, "-").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function isFuturePlaceholder(n) {
    var nm = normName(n && n.name);
    return !!(n && (n.anonymousUntilNamed || n.role === "DESCENDANT" || n.generation === "future" || n.relation === "future") && nm.indexOf("descendants of the house") === 0);
  }
  function dedupeFamily(list) {
    var out = [], seen = {}, futureKept = false, i, n, key;
    list = list || [];
    for (i = 0; i < list.length; i++) {
      n = list[i];
      if (isFuturePlaceholder(n)) {
        if (futureKept) continue;
        n.id = n.id || "FAM-DESC";
        n.name = "Descendants of the House";
        n.generation = "future";
        n.relation = "future";
        n.role = "DESCENDANT";
        n.anonymousUntilNamed = true;
        n.protect = true;
        futureKept = true;
        out.push(n);
        continue;
      }
      key = normName(n.name);
      if (!key || seen[key]) continue;
      seen[key] = true;
      out.push(n);
    }
    if (!futureKept) out.push({ id: "FAM-DESC", name: "Descendants of the House", relation: "future", generation: "future", role: "DESCENDANT", protect: true, anonymousUntilNamed: true });
    return out;
  }
  function persist() {
    if (!g.ChirombeCore || !g.ChirombeCore.state) return;
    try {
      localStorage.setItem("CHIROMBE_MATRIX_CORE_V3", JSON.stringify({
        family: g.ChirombeCore.family,
        generation: g.ChirombeCore.state.generation,
        threat: g.ChirombeCore.state.threat,
        resilience: g.ChirombeCore.state.resilience,
        coherence: g.ChirombeCore.state.coherence,
        prayerIndex: g.ChirombeCore.state.prayerIndex,
        armed: g.ChirombeCore.state.armed
      }));
    } catch (e) {}
  }
  function sealRoster() {
    if (!g.ChirombeCore) return [];
    var sealed = dedupeFamily(g.ChirombeCore.family || []);
    g.ChirombeCore.family = sealed;
    if (g.ChirombeCore.state) g.ChirombeCore.state.family = sealed;
    persist();
    return sealed;
  }
  function liturgyLine(node) {
    if (!node) return "Mwari ndi Mwari. May peace, wisdom, unity, strength and protection remain with the House of Masawi. Zvapera.";
    if (node.remembrance || node.status === "remembered") return "Mwari ndi Mwari. " + node.name + " is remembered with dignity, love and faith. May peace rest with this name. Zvapera.";
    if (node.role === "DESCENDANT" || node.generation === "future") return "Mwari ndi Mwari. Cover over the named and unnamed descendants of the House of Masawi. Zvapera.";
    return "Mwari ndi Mwari. Peace, wisdom and protection over " + node.name + ". Zvapera.";
  }
  if (g.ChirombeCore) {
    g.ChirombeCore.sealRoster = sealRoster;
    var prevAdd = g.ChirombeCore.addNode;
    g.ChirombeCore.addNode = function (node) {
      if (prevAdd) prevAdd.call(g.ChirombeCore, node);
      else (g.ChirombeCore.family || (g.ChirombeCore.family = [])).push(node);
      return sealRoster();
    };
    sealRoster();
  }
  g.CHIROMBE_LITURGY = g.CHIROMBE_LITURGY || {};
  g.CHIROMBE_LITURGY.start = function (node) {
    var focus = node || (g.CHIROMBE_BLOODLINE && g.CHIROMBE_BLOODLINE.selected && (g.CHIROMBE_BLOODLINE.selected.raw || g.CHIROMBE_BLOODLINE.selected)) || null;
    var text = focus ? liturgyLine(focus) : liturgyLine(null);
    if (!focus) {
      text = "Mwari ndi Mwari. May peace, wisdom, unity, strength and protection remain with the House of Masawi. May Chirombe, Makwengura, Masawi and Masarura be remembered with dignity. May Sebastian Karumekangu Masawi and Risto Kasirori Masawi be covered. May HRH Saint Tariro Masawi, HRH Tarry Kupakwashe Masawi and Kenzi Masawi be held in truth. May Tenderayi, Silent, Trymore, Charles, Tatenda, and the eternal spirits of Corinna, Rhoda and Abigail be remembered. Zvapera.";
    }
    if (g.CHIROMBE_LITURGY_AUDIO && g.CHIROMBE_LITURGY_AUDIO.speak) g.CHIROMBE_LITURGY_AUDIO.speak({ text: text });
    if (g.ChirombeAudit && g.ChirombeAudit.append) g.ChirombeAudit.append("LITURGY", { for: focus && focus.name });
    return { started: true, for: focus && focus.name, text: text };
  };
  g.CHIROMBE_LITURGY.cover = function (node) { return g.CHIROMBE_LITURGY.start(node); };
  if (g.ChirombeBus && g.ChirombeBus.registerCommand) {
    g.ChirombeBus.registerCommand("family.seal", function () { return sealRoster(); }, { subsystem: "family" });
    g.ChirombeBus.registerCommand("liturgy.start", function (a) { return g.CHIROMBE_LITURGY.start(a && a.node); }, { subsystem: "audio" });
    g.ChirombeBus.registerCommand("liturgy.cover", function (a) { return g.CHIROMBE_LITURGY.cover(a && a.node); }, { subsystem: "audio" });
  }
  if (g.ChirombeSystem) g.ChirombeSystem.version = "3.0.4";
  addEventListener("chirombe-family-ready", function () { sealRoster(); });
})(typeof window !== "undefined" ? window : globalThis);
