/* ============================================================
   FormulaCard — نمایش فرمول با KaTeX + ردیف‌های استنتاج
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;

  /**
   * formulaCard({ caption, size: 'md'|'lg'|'hero', gold })
   * → { el, box } — box ظرف رندر KaTeX است
   */
  function formulaCard(opts) {
    opts = opts || {};
    const box = U.el("div.formula-box");
    const el = U.el("div.formula-card", {
      class: "",
      ...(opts.gold ? { "data-gold": "true" } : {}),
    });
    if (opts.gold) el.classList.add("formula-card--gold");
    if (opts.size === "hero") el.classList.add("formula-card--hero");
    if (opts.caption) {
      el.appendChild(U.el("div.formula-caption", { text: opts.caption }));
    }
    el.appendChild(box);
    return { el, box };
  }

  /**
   * derivationRows(count) — ردیف‌های زنجیرهٔ استنتاج
   * هر ردیف: { el, formulaBox, noteEl, opEl? }
   * opEl برچسب عملیات بین دو ردیف است (مثل «در ۲ ضرب کن»)
   */
  function derivationRows(items) {
    const wrap = U.el("div.derivation");
    const rows = items.map((item, i) => {
      const formulaBox = U.el("div.formula");
      const row = U.el("div.d-row", { role: "group", aria: { label: "گام " + U.fa(i + 1) } });

      let opEl = null;
      if (item.op) {
        opEl = U.el("span.d-op", { html: U.icons.arrowDown + U.escapeHtml(item.op) });
        row.appendChild(opEl);
      }

      row.appendChild(formulaBox);

      let noteEl = null;
      if (item.note) {
        noteEl = U.el("div.d-note", { text: item.note });
        row.appendChild(noteEl);
      }

      wrap.appendChild(row);
      return { el: row, formulaBox, noteEl, opEl, item };
    });

    return { el: wrap, rows };
  }

  /** برچسب‌های اجزای فرمول زیر کارت */
  function formulaLabels(labels) {
    const el = U.el("div.formula-labels");
    const chips = labels.map((l) =>
      U.el("span.f-label" + (l.tone ? ".f-label--" + l.tone : ""), {}, [
        U.el("span.swatch"),
        U.el("span", { text: l.text }),
      ])
    );
    chips.forEach((c) => el.appendChild(c));
    return { el, chips };
  }

  App.Components = App.Components || {};
  App.Components.FormulaCard = { create: formulaCard, derivationRows, formulaLabels };
})(window.App = window.App || {});
