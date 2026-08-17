/* ============================================================
   ExplanationCard — سه لایهٔ آموزشی: چه؟ چرا؟ نتیجه
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;

  const TAGS = {
    what: { label: "چه کار می‌کنیم؟", icon: "eye" },
    why: { label: "چرا؟", icon: "info" },
    result: { label: "نتیجه", icon: "sparkle" },
  };

  /**
   * explainCard({ what, why, result })
   * خروجی: { el, rows: { what, why, result } } — هر ردیف قابل انیمیشن
   */
  function explainCard(opts) {
    const rows = {};
    const el = U.el("div.explain-card");

    [
      ["what", opts.what],
      ["why", opts.why],
      ["result", opts.result],
    ].forEach(([key, text]) => {
      if (!text) return;
      const tag = TAGS[key];
      const row = U.el("div.explain-row.explain-row--" + key, {
        html:
          '<span class="explain-tag">' + U.icons[tag.icon] + tag.label + "</span>" +
          '<div class="explain-body">' + U.rich(text) + "</div>",
      });
      rows[key] = row;
      el.appendChild(row);
    });

    return { el, rows };
  }

  App.Components = App.Components || {};
  App.Components.ExplainCard = { create: explainCard };
})(window.App = window.App || {});
