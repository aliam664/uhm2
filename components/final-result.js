/* ============================================================
   FinalResult — کارت پاسخ نهایی + جمع‌بندی
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;

  /**
   * successCard({ n, target, message })
   * → { el, nValueEl, orbSvg, recapEl }
   */
  function successCard(opts) {
    const faLabel = U.el("span.fa-label", { text: "پاسخ نهایی — تعداد جمله‌ها" });
    const nValueEl = U.el("div.fa-value.num", { text: U.fa(opts.n) });

    const orb = U.el("div.check-orb", { html: U.icons.checkCircle, aria: { hidden: "true" } });

    const messageEl = U.el("p.final-message", { text: opts.message });

    const recapEl = U.el("div.final-recap");
    const card = U.el("section.final-card", {}, [
      orb,
      U.el("div.final-answer", {}, [faLabel, nValueEl]),
      messageEl,
      recapEl,
    ]);
    card.appendChild(U.el("span.final-glow", { aria: { hidden: "true" } }));

    return {
      el: card,
      nValueEl,
      orbSvg: orb.querySelector("svg"),
      messageEl,
      recapEl,
      setRecap(chips) {
        recapEl.innerHTML = "";
        chips.forEach((c) => {
          recapEl.appendChild(
            U.el("span.chip" + (c.tone ? ".chip--" + c.tone : ""), {
              html: (c.icon ? U.icons[c.icon] : "") + "<span>" + U.escapeHtml(c.text) + "</span>",
            })
          );
        });
        return recapEl;
      },
    };
  }

  /**
   * conclusionCard({ variant, title, message }) — وقتی جوابی وجود ندارد
   */
  function conclusionCard(opts) {
    const icon = opts.variant === "danger" ? U.icons.error : U.icons.warn;
    const card = U.el("section.final-card", { style: { borderColor: opts.variant === "danger" ? "var(--danger-line)" : "var(--warn-line)" } }, [
      U.el("div.check-orb", {
        style: {
          background: "var(--warn-soft)",
          borderColor: opts.variant === "danger" ? "var(--danger-line)" : "var(--warn-line)",
          boxShadow: "none",
        },
        html: icon,
        aria: { hidden: "true" },
      }),
      U.el("h3.final-message", { text: opts.title }),
      U.el("p.lead", { text: opts.message, style: { textAlign: "center", maxWidth: "56ch" } }),
    ]);
    return { el: card };
  }

  /**
   * sumViz({ terms: Fraction[], total: Fraction }) — جمع تجمعی مرحلهٔ ۹
   * → { el, termEls, ops, totalEl, meterFill, captionEl, runningEl }
   */
  function sumViz(opts) {
    const terms = opts.terms;
    const termEls = [];
    const pieces = [];

    terms.forEach((t, i) => {
      pieces.push(U.el("span.s-term", { text: U.fa(t.toString()) }));
      if (i < terms.length - 1) pieces.push(U.el("span.s-op", { text: "+" }));
    });
    pieces.push(U.el("span.s-eq", { text: "=" }));
    const totalEl = U.el("span.s-total", { text: U.fa(opts.total.toString()) });
    pieces.push(totalEl);

    const row = U.el("div.sum-terms", {}, pieces);
    termEls.push(...row.querySelectorAll(".s-term"));

    const meterFill = U.el("div.meter-fill");
    const meter = U.el("div.sum-meter", { role: "img", aria: { label: "نوار پیشرفت جمع" } }, [meterFill]);

    const runningEl = U.el("span");
    const captionEl = U.el("div.sum-meter-caption", {}, [
      U.el("span", { text: "جمع تا اینجا: " }),
      runningEl,
    ]);

    const el = U.el("div.sum-viz", {}, [row, meter, captionEl]);
    return { el, termEls, totalEl, meterFill, runningEl, captionEl };
  }

  App.Components = App.Components || {};
  App.Components.FinalResult = { successCard, conclusionCard, sumViz };
})(window.App = window.App || {});
