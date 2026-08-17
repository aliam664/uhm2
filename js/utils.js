/* ============================================================
   Utils — ابزارهای عمومی، ارقام فارسی، آیکون‌ها
   ============================================================ */

(function (App) {
  "use strict";

  const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

  const U = {};

  /* ---------- DOM ---------- */

  U.qs = (sel, root) => (root || document).querySelector(sel);
  U.qsa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /**
   * سازندهٔ عنصر: el("div.card", { text: "سلام", onClick: fn }, [children])
   */
  U.el = function (tag, attrs, children) {
    const parts = tag.split(".");
    const node = document.createElement(parts[0] || "div");
    if (parts.length > 1) node.className = parts.slice(1).join(" ");

    if (attrs) {
      for (const key of Object.keys(attrs)) {
        const val = attrs[key];
        if (val === null || val === undefined || val === false) continue;
        if (key === "text") { node.textContent = val; continue; }
        if (key === "html") { node.innerHTML = val; continue; }
        if (key === "style" && typeof val === "object") { Object.assign(node.style, val); continue; }
        if (key === "dataset") { Object.assign(node.dataset, val); continue; }
        if (key.startsWith("on") && typeof val === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), val);
          continue;
        }
        if (key === "aria") {
          for (const a of Object.keys(val)) node.setAttribute("aria-" + a, val[a]);
          continue;
        }
        node.setAttribute(key, val === true ? "" : String(val));
      }
    }

    if (children) {
      for (const child of children) {
        if (child === null || child === undefined || child === false) continue;
        node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
      }
    }
    return node;
  };

  /* ---------- اعداد فارسی ---------- */

  /** تبدیل ارقام لاتینِ رشته به فارسی */
  U.toFaDigits = (str) => String(str).replace(/[0-9]/g, (d) => FA_DIGITS[+d]);

  /** تبدیل ارقام فارسی/عربیِ رشته به لاتین */
  U.toLatinDigits = (str) =>
    String(str)
      .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

  /**
   * نمایش عدد به فارسی با جداکنندهٔ هزارگان «٬»
   * fa(174) → ۱۷۴   |   fa(12345) → ۱۲٬۳۴۵
   */
  U.fa = function (value, opts) {
    opts = opts || {};
    if (value === null || value === undefined || value === "") return "";
    let s = String(value);
    if (opts.decimals && !opts.keepFloat) {
      s = Number(value).toFixed(opts.decimals).replace(/\.?0+$/, "");
    }
    if (s.startsWith("-")) return "−" + U.fa(s.slice(1), opts); // منفیٔ ریاضی
    const [int, frac] = s.split(".");
    const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, "\u066C");
    return U.toFaDigits(frac != null ? grouped + "٫" + frac : grouped);
  };

  /* ---------- نرمال‌سازی ورودی عددی ---------- */

  /** نرمال‌سازی رشتهٔ عددی کاربر → لاتین با ممیز «.» (خروجی ممکن است نامعتبر باشد) */
  U.normalizeNumeric = (str) =>
    U.toLatinDigits(String(str))
      .replace(/[٫،,]/g, ".")
      .replace(/[−–—ـ]/g, "-")
      .replace(/\s+/g, "")
      .replace(/\.{2,}/g, ".");

  /** تجزیهٔ عدد دقیق → { ok, value } فقط برای اعشار ساده */
  U.parseNumber = function (str) {
    const s = U.normalizeNumeric(str);
    if (!/^-?\d*\.?\d+$/.test(s) && !/^-?\d+\.$/.test(s) && s !== "-") {
      if (!/^-?\d+(\.\d+)?$/.test(s)) return { ok: false };
    }
    if (s === "" || s === "-" || s === ".") return { ok: false };
    const v = Number(s);
    if (!isFinite(v)) return { ok: false };
    return { ok: true, value: v, normalized: s };
  };

  /* ---------- زمان‌بندی ---------- */

  U.sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  U.clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  U.escapeHtml = (str) =>
    String(str).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  /* ============================================================
     آیکون‌ها — SVG درون‌خطی (stroke بر مبنای currentColor)
     ============================================================ */

  const I = (paths, vb) =>
    '<svg viewBox="' + (vb || "0 0 24 24") + '" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + paths + "</svg>";

  U.icons = {
    sigma: I('<path d="M18.5 5H6.2l7.6 7-7.6 7h12.3" stroke-width="2.2"/>'),
    play: I('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>'),
    pause: I('<rect x="6.5" y="5" width="3.6" height="14" rx="1.3" fill="currentColor" stroke="none"/><rect x="13.9" y="5" width="3.6" height="14" rx="1.3" fill="currentColor" stroke="none"/>'),
    restart: I('<path d="M4.5 12a7.5 7.5 0 1 1 2.2 5.3"/><path d="M4.5 13.6V9.4m0 4.2h4.2"/>'),
    next: I('<path d="M14.5 6l-6 6 6 6"/>'),   // فلش رو به چپ = جلو در RTL
    prev: I('<path d="M9.5 6l6 6-6 6"/>'),    // فلش رو به راست = عقب در RTL
    check: I('<path d="M4.5 12.8l4.6 4.6L19.5 6.6" stroke-width="2.6"/>'),
    checkCircle: I('<circle cx="12" cy="12" r="8.6"/><path d="M8.3 12.3l2.6 2.6 4.9-5.3"/>'),
    warn: I('<path d="M12 3.8l9 15.6H3z" stroke-linejoin="round"/><path d="M12 9.8v4"/><circle cx="12" cy="16.7" r="0.4" fill="currentColor"/>'),
    error: I('<circle cx="12" cy="12" r="8.6"/><path d="M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6"/>'),
    info: I('<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5"/><circle cx="12" cy="8" r="0.4" fill="currentColor"/>'),
    sun: I('<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2M12 19.2v2M4.1 4.1l1.4 1.4M18.5 18.5l1.4 1.4M2.8 12h2M19.2 12h2M4.1 19.9l1.4-1.4M18.5 5.5l1.4-1.4"/>'),
    moon: I('<path d="M20.2 13.6A8.2 8.2 0 1 1 10.4 3.8a6.8 6.8 0 0 0 9.8 9.8z"/>'),
    soundOn: I('<path d="M4 9.6v4.8h3.2L12 18.6V5.4L7.2 9.6z"/><path d="M15.4 9a4.3 4.3 0 0 1 0 6M17.8 6.6a7.6 7.6 0 0 1 0 10.8"/>'),
    soundOff: I('<path d="M4 9.6v4.8h3.2L12 18.6V5.4L7.2 9.6z"/><path d="M15.6 10l4.4 4.4M20 10l-4.4 4.4"/>'),
    settings: I('<circle cx="12" cy="12" r="3.2"/><path d="M19.4 14.4a7.9 7.9 0 0 0 .1-2.5l2-1.5-2-3.4-2.3.9a8 8 0 0 0-2.2-1.3L14.6 4h-5.2l-.4 2.6a8 8 0 0 0-2.2 1.3l-2.3-.9-2 3.4 2 1.5a7.9 7.9 0 0 0 0 2.5l-2 1.5 2 3.4 2.3-.9a8 8 0 0 0 2.2 1.3l.4 2.6h5.2l.4-2.6a8 8 0 0 0 2.2-1.3l2.3.9 2-3.4z"/>'),
    bolt: I('<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>'),
    pencil: I('<path d="M4.5 19.5l.9-3.6L15.7 5.6a2 2 0 0 1 2.8 2.8L8.1 18.7z"/><path d="M14.5 6.8l2.8 2.8"/>'),
    plus: I('<path d="M12 5.5v13M5.5 12h13"/>'),
    minus: I('<path d="M5.5 12h13"/>'),
    x: I('<path d="M6 6l12 12M18 6L6 18"/>'),
    list: I('<path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11"/><circle cx="4.6" cy="6.5" r="0.5" fill="currentColor"/><circle cx="4.6" cy="12" r="0.5" fill="currentColor"/><circle cx="4.6" cy="17.5" r="0.5" fill="currentColor"/>'),
    sliders: I('<path d="M5 8h9M17 8h2M5 16h2M10 16h9"/><circle cx="15.5" cy="8" r="2"/><circle cx="8" cy="16" r="2"/>'),
    keyboard: I('<rect x="3" y="6.5" width="18" height="11" rx="2.4"/><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M6.5 13.5h.01M17 13.5h.01M9.5 13.5h5" stroke-width="1.6"/>'),
    clock: I('<circle cx="12" cy="12" r="8.6"/><path d="M12 7.5V12l3 2"/>'),
    arrowDown: I('<path d="M12 5v14M6.5 13.5L12 19l5.5-5.5"/>'),
    arrowLeft: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
    sparkle: I('<path d="M12 4l1.7 4.6L18.5 10l-4.8 1.4L12 16l-1.7-4.6L5.5 10l4.8-1.4z"/><path d="M18.8 15.2l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" stroke-width="1.4"/>'),
    function: I('<path d="M6 4.5v3a3 3 0 0 0 3 3h9"/><path d="M6 19.5v-3a3 3 0 0 1 3-3"/><circle cx="4.2" cy="4.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="4.2" cy="19.5" r="1.2" fill="currentColor" stroke="none"/><path d="M13 8.5c2.8 0 2.8 7 5.6 7" />'),
    layers: I('<path d="M12 3.8l8.5 4.4L12 12.6 3.5 8.2z"/><path d="M4.5 12.4L12 16.3l7.5-3.9"/><path d="M4.5 16.4L12 20.3l7.5-3.9"/>'),
    target: I('<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>'),
    flag: I('<path d="M6 21V4.5"/><path d="M6 5.2c3.5-1.8 6.5 1.6 12 0v8.6c-5.5 1.6-8.5-1.8-12 0"/>'),
    eye: I('<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>'),
    grid: I('<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>'),
    calculator: I('<rect x="5.5" y="3.5" width="13" height="17" rx="2.4"/><path d="M8.5 7.5h7"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 15.5h.01M12 15.5h.01M15.5 15.5h.01" stroke-width="2.4"/>'),
    book: I('<path d="M4.5 5.5A2 2 0 0 1 6.5 3.5H19.5v15H6.5a2 2 0 0 0-2 2z"/><path d="M4.5 18.5v2"/><path d="M8 7.5h8"/>'),
    swap: I('<path d="M7 4.5L3.5 8 7 11.5"/><path d="M3.5 8H16"/><path d="M17 12.5L20.5 16 17 19.5"/><path d="M20.5 16H8"/>'),
    expand: I('<path d="M9 4.5H4.5V9M15 4.5h4.5V9M9 19.5H4.5V15M15 19.5h4.5V15"/>'),
  };

  App.Utils = U;
})(window.App = window.App || {});
