/* ============================================================
   ValueChips — کارت‌های کوچک مقدار (a₁ = ۲ ، d = ۵ ، Sₙ = ۸۷)
   + بنر پیام (verdict) + کارت‌های مسیر ریشه‌ها
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;

  /**
   * valueChips([{ name: 'a₁', value: '۲', hint }]) → { el, chips }
   */
  function valueChips(items) {
    const el = U.el("div.value-chips");
    const chips = items.map((it) => {
      const chip = U.el("div.v-chip", {}, [
        U.el("span.v-name", { html: U.rich(it.name) }),
        U.el("span.v-val", { text: it.value }),
      ]);
      el.appendChild(chip);
      return chip;
    });
    return { el, chips };
  }

  /**
   * verdict(text, { variant: 'success'|'warn'|'danger'|'accent', icon })
   * → element
   */
  function verdict(text, opts) {
    opts = opts || {};
    const variant = opts.variant || "success";
    const icon = opts.icon || (variant === "success" ? "checkCircle" : variant === "danger" ? "error" : variant === "warn" ? "warn" : "info");
    return U.el("div.verdict.verdict--" + variant, {
      role: "status",
      html: U.icons[icon] + "<span>" + U.escapeHtml(text) + "</span>",
    });
  }

  /**
   * pathCard({ kind: 'valid'|'rejected', title, formulas: [latex], note, statusText })
   * → { el, formulaBoxes, statusEl, noteEl, headEl }
   */
  function pathCard(opts) {
    const valid = opts.kind === "valid";
    const headEl = U.el("div.path-head", {
      html: U.icons[valid ? "checkCircle" : "warn"] + U.rich(opts.title),
    });

    const el = U.el("div.path-card" + (valid ? ".path-card--valid" : ".path-card--rejected"));

    const formulaBoxes = (opts.formulas || []).map((latex) => {
      const box = U.el("div.formula.formula--xl");
      App.Formula.render(box, latex);
      return box;
    });

    const statusEl = U.el("span.path-status", {
      html: U.icons[valid ? "check" : "warn"] + U.escapeHtml(opts.statusText || (valid ? "جواب قابل قبول" : "رد می‌شود")),
    });

    el.appendChild(headEl);
    formulaBoxes.forEach((b) => el.appendChild(b));
    el.appendChild(statusEl);

    let noteEl = null;
    if (opts.note) {
      noteEl = U.el("p.path-note", { html: U.rich(opts.note) });
      el.appendChild(noteEl);
    }

    return { el, formulaBoxes, statusEl, noteEl, headEl };
  }

  App.Components = App.Components || {};
  App.Components.ValueChips = { valueChips, verdict, pathCard };
})(window.App = window.App || {});
