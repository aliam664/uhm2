/* ============================================================
   SequenceDisplay — نمایش دنبالهٔ حسابی
   دو حالت: افقی (جمله‌ها + فلش اختلاف) و نردبان عمودی
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;

  /**
   * horizontal({ terms: Fraction[], diffs, showArrows, moreAfter, firstTag })
   * moreAfter: بعد از چند جمله «…» بگذاریم
   * → { el, termEls, linkEls }
   */
  function horizontal(opts) {
    const terms = opts.terms;
    const diffs = opts.diffs || [];
    const showArrows = opts.showArrows !== false;
    const limit = opts.moreAfter != null ? opts.moreAfter : terms.length;

    const el = U.el("div.seq-display");
    const termEls = [];
    const linkEls = [];

    terms.forEach((t, i) => {
      if (i === limit) {
        termEls.push(U.el("div.seq-term.seq-term--more", { text: "…", aria: { hidden: "true" } }));
        el.appendChild(termEls[termEls.length - 1]);
        return;
      }
      const term = U.el("div.seq-term", {
        text: U.fa(t.toString()),
        title: "جملهٔ " + U.fa(i + 1),
      });
      if (i === 0 && opts.firstTag) {
        term.appendChild(U.el("span.seq-brace"));
        term.appendChild(U.el("span.seq-tag", { text: opts.firstTag }));
      }
      termEls.push(term);
      el.appendChild(term);

      if (i < terms.length - 1 && i !== limit - 1) {
        const line = U.el("span.arrow-line");
        const diffEl = diffs[i] !== undefined && showArrows
          ? U.el("span.arrow-diff", { text: "+" + (diffs[i].isNegative() ? "−" : "") + U.fa(diffs[i].abs().toString()) })
          : null;
        const link = U.el("div.seq-link", {}, [diffEl, line].filter(Boolean));
        linkEls.push({ el: link, line, diffEl });
        el.appendChild(link);
      }
    });

    const wrap = U.el("div.seq-wrap");
    wrap.appendChild(el);
    return { el: wrap, inner: el, termEls, linkEls };
  }

  /**
   * ladder({ terms: Fraction[], diffs }) — نردبان عمودی
   * → { el, termEls, linkEls }
   */
  function ladder(opts) {
    const terms = opts.terms;
    const diffs = opts.diffs || [];
    const el = U.el("div.ladder");
    const termEls = [];
    const linkEls = [];

    terms.forEach((t, i) => {
      const step = U.el("div.ladder-step");
      const term = U.el("div.seq-term", { text: U.fa(t.toString()) });
      termEls.push(term);
      step.appendChild(term);
      el.appendChild(step);

      if (i < terms.length - 1 && diffs[i] !== undefined) {
        const link = U.el("div.ladder-link", {}, [
          U.el("span.v-diff", { text: "+" + U.fa(diffs[i].toString()) }),
          U.el("span.v-line"),
        ]);
        linkEls.push({ el: link, line: link.querySelector(".v-line"), diffEl: link.querySelector(".v-diff") });
        el.appendChild(link);
      }
    });

    return { el, termEls, linkEls };
  }

  App.Components = App.Components || {};
  App.Components.SequenceDisplay = { horizontal, ladder };
})(window.App = window.App || {});
