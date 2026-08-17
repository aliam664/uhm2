/* ============================================================
   Hero — کارت سؤال و شروع حل
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;

  /**
   * Hero.render(mount, { question, aria, onStart, resumeStep })
   * question: خروجی buildQuestion → { sequence, target }
   */
  function render(mount, opts) {
    const q = opts.question;
    mount.innerHTML = "";

    const titleWrap = U.el("div.hero-title-wrap.fade-enter", {}, [
      U.el("h1.h-display", { text: App.Data.arithmeticSum.hero.title }),
      U.el("p.lead", { text: App.Data.arithmeticSum.hero.subtitle, style: { marginTop: "10px" } }),
    ]);

    const questionEl = U.el("p.hero-question", {
      html:
        "مجموع چند جملهٔ اول دنبالهٔ حسابی " +
        '<span class="q-seq" dir="ltr">' + U.escapeHtml(q.sequence) + " ، …</span>" +
        " برابر با " +
        '<span class="q-sum num">' + U.escapeHtml(q.target) + "</span>" +
        " می‌شود؟",
    });
    questionEl.id = "hero-question-text";

    const meta = U.el("div.hero-meta", {}, [
      chip("sigma", "جبر — دنباله‌ها"),
      chip("layers", "۹ مرحلهٔ تعاملی"),
      chip("clock", "حدود ۳ دقیقه"),
      chip("keyboard", "پیمایش با کلیدهای جهت"),
    ]);

    const startBtn = U.el("button.btn.btn--primary.btn--lg", {
      type: "button",
      html: U.icons.play + "<span>شروع حل</span>",
      "aria-describedby": "hero-question-text",
      onClick: () => opts.onStart(),
    });

    const actionsRow = U.el("div.row.row--center", { style: { gap: "12px", flexWrap: "wrap" } }, [startBtn]);

    /* دکمهٔ ادامه اگر مرحلهٔ ذخیره‌شده وجود دارد */
    if (opts.resumeStep && opts.resumeStep > 0 && opts.resumeStep < 9) {
      actionsRow.appendChild(
        U.el("button.btn.btn--ghost", {
          type: "button",
          html: U.icons.restart + "<span>ادامه از مرحلهٔ " + U.fa(opts.resumeStep + 1) + "</span>",
          onClick: () => opts.onStart(opts.resumeStep),
        })
      );
    }

    const actions = U.el("div.hero-actions", {}, [actionsRow]);

    const card = U.el("section.hero.glass.glass--strong", { aria: { labelledby: "hero-question-text" } }, [
      titleWrap,
      questionEl,
      meta,
      actions,
    ]);

    mount.appendChild(card);

    /* انیمیشن ورود */
    gsap.fromTo(
      card.querySelectorAll(".hero-meta .chip"),
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, delay: 0.25, ease: "power3.out", clearProps: "transform" }
    );
    gsap.fromTo(startBtn, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.5, ease: "back.out(1.7)", clearProps: "transform" });

    return { el: card, startBtn };
  }

  function chip(icon, text) {
    return U.el("span.chip", { html: U.icons[icon] + "<span>" + U.escapeHtml(text) + "</span>" });
  }

  App.Components = App.Components || {};
  App.Components.Hero = { render };
})(window.App = window.App || {});
