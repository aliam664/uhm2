/* ============================================================
   صحنهٔ ۵ — جایگذاری اطلاعات در فرمول
   مقادیر زنده وارد فرمول می‌شوند
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;
  const A = App.Animation;
  const F = App.Formula;
  const C = App.Components;

  const scene = {
    num: 5,
    title: "جایگذاری اطلاعات",
    short: "جایگذاری",
    icon: "sliders",
    lede: "حالا هر سه مقداری را که می‌شناسیم — جملهٔ اول، اختلاف و مجموع هدف — سر جایشان در فرمول می‌گذاریم.",

    build(ctx) {
      const sol = ctx.sol;
      const card = C.StepCard.create({
        num: scene.num, total: ctx.total,
        title: scene.title, lede: scene.lede, icon: scene.icon,
      });
      const tl = A.tl({ paused: true });

      const t0 = 0.35;
      tl.from(card.headRefs.badge, { opacity: 0, y: -12, duration: A.d(0.4) }, 0);
      tl.from(card.headRefs.title, { opacity: 0, y: 14, duration: A.d(0.5) }, 0.05);
      if (card.headRefs.lede) tl.from(card.headRefs.lede, { opacity: 0, y: 12, duration: A.d(0.5) }, 0.15);

      /* ---- مقادیر شناخته‌شده ---- */

      const chips = C.ValueChips.valueChips([
        { name: "جملهٔ اول — a₁", value: sol.input.a1.toFa() },
        { name: "اختلاف مشترک — d", value: sol.input.d.toFa() },
        { name: "مجموع هدف — Sₙ", value: sol.input.target.toFa() },
      ]);
      card.addTo(chips.el);
      gsap.set(chips.chips, { opacity: 0, y: 20, scale: 0.9 });
      tl.to(chips.chips, { opacity: 1, y: 0, scale: 1, duration: A.d(0.5), stagger: A.d(0.28), ease: "back.out(1.9)" }, t0);
      tl.add(() => App.Sound.play("click"), t0 + A.d(0.5));

      /* ---- زنجیرهٔ جایگذاری ---- */

      const states = F.substitutionStates(sol);
      const rows = C.FormulaCard.derivationRows(
        states.map((s) => ({ note: s.note }))
      );
      rows.rows.forEach((r, i) => F.render(r.formulaBox, states[i].latex));
      card.addTo(rows.el);

      rows.rows.forEach((r) => gsap.set(r.el, { opacity: 0, y: 18 }));
      const tSub = t0 + A.d(1.2);
      const gap = A.d(1.05);

      rows.rows.forEach((r, i) => {
        const at = tSub + gap * i;
        tl.to(r.el, { opacity: 1, y: 0, duration: A.d(0.55), ease: "power3.out" }, at);
        /* حرکت تمرکز: ردیف فعال برجسته، قبلی‌ها کم‌رنگ */
        tl.add(() => {
          rows.rows.forEach((rr, j) => {
            rr.el.classList.toggle("is-dimmed", j < i);
            rr.el.classList.toggle("is-focus", j === i);
          });
          if (i > 0) App.Sound.play("step");
        }, at);
        /* پالس مقدار تازه‌وارد */
        tl.add(() => {
          const hl = r.formulaBox.querySelector(".fx-hl, .fx-hl--accent, .katex .fx-hl");
          if (hl) gsap.fromTo(hl, { scale: 1.14 }, { scale: 1, duration: A.d(0.5), ease: "power2.out", clearProps: "scale" });
        }, at + A.d(0.35));
      });

      /* ردیف آخر طلایی می‌شود */
      tl.add(() => {
        rows.rows[rows.rows.length - 1].el.classList.add("is-focus");
      }, tSub + gap * (rows.rows.length - 1));

      /* ---- توضیح ---- */

      const explain = C.ExplainCard.create({
        what: "مقادیر a₁ ، d و Sₙ را در فرمول جایگذاری و داخل کمان را ساده می‌کنیم.",
        why: "جایگذاری، مسئله را از یک رابطهٔ عمومی به یک معادلهٔ مشخص با تنها یک مجهول (n) تبدیل می‌کند.",
        result: "به معادله‌ای رسیدیم که فقط n در آن مجهول است؛ آمادهٔ حل کردن.",
      });
      card.addTo(explain.el);
      const explainRows = Object.values(explain.rows);
      gsap.set(explainRows, { opacity: 0, x: 24 });
      tl.to(explainRows, { opacity: 1, x: 0, duration: A.d(0.55), stagger: A.d(0.3) }, tSub + gap * rows.rows.length + A.d(0.3));

      return { el: card.el, tl };
    },
  };

  App.Scenes = App.Scenes || {};
  App.Scenes.step5 = scene;
})(window.App = window.App || {});
