/* ============================================================
   Drawer — پنل کناری «تغییر سؤال» (در موبایل تمام‌عرض)
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;

  let scrim = null;
  let panel = null;
  let openState = false;
  let lastFocus = null;

  function ensure() {
    if (scrim) return;
    scrim = U.el("div.drawer-scrim", { onClick: close });
    panel = U.el("aside.drawer", { role: "dialog", aria: { modal: "true", labelledby: "drawer-title" } });

    document.body.appendChild(scrim);
    document.body.appendChild(panel);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && openState) close();
    });
  }

  /**
   * Drawer.open({ title, content, onClose })
   */
  function open(opts) {
    ensure();
    opts = opts || {};
    lastFocus = document.activeElement;

    panel.innerHTML = "";
    const closeBtn = U.el("button.icon-btn", {
      type: "button",
      html: U.icons.x,
      "aria-label": "بستن پنل",
      onClick: close,
    });
    panel.appendChild(U.el("div.drawer-head", {}, [
      U.el("h3", { id: "drawer-title", text: opts.title || "تنظیمات", style: { fontSize: "1.1rem", fontWeight: 800 } }),
      closeBtn,
    ]));
    const body = U.el("div.drawer-body");
    if (opts.content) body.appendChild(opts.content);
    panel.appendChild(body);

    document.body.style.overflow = "hidden";
    scrim.classList.add("is-open");
    panel.classList.add("is-open");
    openState = true;

    gsap.fromTo(panel, { x: -40, opacity: 0.6 }, { x: 0, opacity: 1, duration: 0.45, ease: "power3.out" });

    const focusable = panel.querySelector("input, button");
    if (focusable) setTimeout(() => focusable.focus(), 80);
  }

  function close() {
    if (!openState) return;
    openState = false;
    scrim.classList.remove("is-open");
    panel.classList.remove("is-open");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function isOpen() {
    return openState;
  }

  App.Components = App.Components || {};
  App.Components.Drawer = { open, close, isOpen };
})(window.App = window.App || {});
