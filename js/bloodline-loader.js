/* Loads Phase 4 seal after kernel. Safe if file already present. */
(function () {
  if (window.__CHIROMBE_P4__) return;
  window.__CHIROMBE_P4__ = true;
  var s = document.createElement("script");
  s.src = "./js/phase4-seal.js";
  s.onload = function () {
    if (window.CHIROMBE_BLOODLINE && window.CHIROMBE_BLOODLINE.render) window.CHIROMBE_BLOODLINE.render();
  };
  document.head.appendChild(s);
})();
