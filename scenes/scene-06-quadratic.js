/* ============================================================
   صحنهٔ ۶ — تبدیل به معادلهٔ درجهٔ دوم
   زنجیرهٔ تبدیل + ضریب‌های a ، b ، c
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;
  const A = App.Animation;
  const F = App.Formula;
  const C = App.Components;

  const scene = {
    num: 6,
    title: "تبدیل به معادلهٔ درجهٔ دوم",
    short: "معادله",
    icon: "calculator",
    lede: "معادله‌ای که داریم هنوز شکل استاندارد ندارد؛ با چند عملیات جبری ساده آن را به شکل an² + bn + c = 0 می‌رسانیم.",

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

      /* ---- زنجیرهٔ تبدیل با برچسب عملیات ---- */

      const states = F.equationStates(sol);
      const rows = C.FormulaCard.derivationRows(states);
      rows.rows.forEach((r, i) => F.render(r.formulaBox, states[i].latex));
      card.addTo(rows.el);

      rows.rows.forEach((r) => gsap.set(r.el, { opacity: 0, y: 18 }));
      rows.rows.forEach((r) => {
        if (r.opEl) gsap.set(r.opEl, { opacity: 0, scale: 0.8 });
      });

      const gap = A.d(1.25);
      rows.rows.forEach((r, i) => {
        const at = t0 + gap * i;
        if (r.opEl) tl.to(r.opEl, { opacity: 1, scale: 1, duration: A.d(0.4), ease: "back.out(2)" }, at);
        tl.to(r.el, { opacity: 1, y: 0, duration: A.d(0.6), ease: "power3.out" }, at + A.d(0.18));
        tl.add(() => {
          rows.rows.forEach((rr, j) => {
            rr.el.classList.toggle("is-dimmed", j < i);
            rr.el.classList.toggle("is-focus", j === i);
          });
          if (i > 0) App.Sound.play("step");
        }, at + A.d(0.18));
      });

      /* ردیف استاندارد طلایی */
      const tFinal = t0 + gap * (rows.rows.length - 1);
      tl.fromTo(
        rows.rows[rows.rows.length - 1].el,
        { scale: 1 },
        { scale: 1.02, duration: A.d(0.35), yoyo: true, repeat: 1, ease: "power2.inOut", clearProps: "scale" },
        tFinal + A.d(0.9)
      );

      /* ---- ضریب‌ها ---- */

      const isLinear = sol.equation.a.isZero();
      const coefItems = isLinear
        ? [
            { name: "b", value: sol.equation.b.toFa() },
            { name: "c", value: sol.equation.c.toFa() },
          ]
        : [
            { name: "a (ضریب n²)", value: sol.equation.a.toFa() },
            { name: "b (ضریب n)", value: sol.equation.b.toFa() },
            { name: "c (عدد)", value: sol.equation.c.toFa() },
          ];
      const chips = C.ValueChips.valueChips(coefItems);
      card.addTo(chips.el);
      gsap.set(chips.chips, { opacity: 0, y: 18, scale: 0.9 });

      const tChips = tFinal + A.d(1.3);
      tl.to(chips.chips, { opacity: 1, y: 0, scale: 1, duration: A.d(0.5), stagger: A.d(0.22), ease: "back.out(1.9)" }, tChips);
      tl.add(() => App.Sound.play("click"), tChips + A.d(0.3));

      /* ---- توضیح ---- */

      const explain = C.ExplainCard.create(
        isLinear
          ? {
              what: "معادله را به شکل استاندارد خطی می‌رسانیم.",
              why: "چون اختلاف مشترک صفر است، جملهٔ n² حذف می‌شود و معادله خطی می‌شود؛ حلش ساده‌تر است.",
              result: "معادلهٔ خطی " + F.poly(sol.equation.a, sol.equation.b, sol.equation.c, "n") + " = ۰ به دست آمد (با ارقام فارسی: " + U.toFaDigits(F.poly(sol.equation.a, sol.equation.b, sol.equation.c, "n")) + " = ۰).",
            }
          : {
              what: "معادله را با ضرب در ۲، باز کردن پرانتز و انتقال به یک طرف، به شکل استاندارد می‌رسانیم.",
              why: "فرمول‌های حل معادلهٔ درجهٔ دوم (دلتا و ریشه‌ها) فقط روی شکل استاندارد an² + bn + c = 0 کار می‌کنند.",
              result: "معادلهٔ درجهٔ دوم با ضریب‌های a = " + sol.equation.a.toFa() + " ، b = " + sol.equation.b.toFa() + " و c = " + sol.equation.c.toFa() + " به دست آمد.",
            }
      );
      card.addTo(explain.el);
      const explainRows = Object.values(explain.rows);
      gsap.set(explainRows, { opacity: 0, x: 24 });
      tl.to(explainRows, { opacity: 1, x: 0, duration: A.d(0.55), stagger: A.d(0.3) }, tChips + A.d(1.0));

      return { el: card.el, tl };
    },
  };

  App.Scenes = App.Scenes || {};
  App.Scenes.step6 = scene;
})(window.App = window.App || {});
