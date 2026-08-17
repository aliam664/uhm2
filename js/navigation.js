/* ============================================================
   Navigation — کلیدهای جهت‌دار و میان‌برها
   → : مرحلهٔ بعد   ← : مرحلهٔ قبل
   ============================================================ */

(function (App) {
  "use strict";

  let engine = null;
  let bound = false;

  function isTypingTarget(e) {
    const t = e.target;
    if (!t) return false;
    const tag = (t.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || t.isContentEditable;
  }

  function onKeyDown(e) {
    if (!engine || isTypingTarget(e)) return;
    if (App.State.get("phase") !== "lesson") return;

    switch (e.key) {
      case "ArrowRight": // طبق خواستهٔ کاربر: راست = جلو
        e.preventDefault();
        engine.next();
        break;
      case "ArrowLeft":
        e.preventDefault();
        engine.prev();
        break;
      case " ":
        if (e.target === document.body) {
          e.preventDefault();
          engine.togglePlay();
        }
        break;
      case "r":
      case "R":
        engine.restart();
        break;
      default:
        break;
    }
  }

  const Navigation = {
    init(lessonEngine) {
      engine = lessonEngine;
      if (!bound) {
        document.addEventListener("keydown", onKeyDown);
        bound = true;
      }
    },
  };

  App.Navigation = Navigation;
})(window.App = window.App || {});
