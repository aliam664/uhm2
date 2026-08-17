/* ============================================================
   Toast — پیام‌های شناور کوتاه
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;
  let zone = null;
  let lastKey = "";
  let lastTime = 0;

  function ensureZone() {
    if (!zone) {
      zone = U.el("div.toast-zone", { aria: { live: "polite", atomic: "false" } });
      document.body.appendChild(zone);
    }
    return zone;
  }

  /**
   * Toast.show(message, type)
   * type: 'error' | 'success' | 'info'
   */
  function show(message, type) {
    type = type || "info";
    const now = Date.now();
    const key = type + ":" + message;
    if (key === lastKey && now - lastTime < 400) return; // جلوگیری از تکرار پیاپی
    lastKey = key;
    lastTime = now;

    const icon = type === "error" ? U.icons.error : type === "success" ? U.icons.checkCircle : U.icons.info;
    const el = U.el("div.toast.toast--" + type, {
      role: "status",
      html: icon + "<span>" + U.escapeHtml(message) + "</span>",
    });
    ensureZone().appendChild(el);

    gsap.fromTo(el, { opacity: 0, y: 24, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.8)" });

    setTimeout(() => {
      gsap.to(el, {
        opacity: 0, y: 12, duration: 0.4, ease: "power2.in",
        onComplete: () => el.remove(),
      });
    }, 3400);
  }

  App.Components = App.Components || {};
  App.Components.Toast = { show };
})(window.App = window.App || {});
