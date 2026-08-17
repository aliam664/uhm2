/* ============================================================
   صحنهٔ ۷ — محاسبهٔ مبیّن (دلتا)
   شامل حالت‌های: مثبت، صفر، منفی، و معادلهٔ خطی
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;
  const A = App.Animation;
  const F = App.Formula;
  const C = App.Components;

  const scene = {
    num: 7,
    title: "محاسبهٔ مبیّن (Δ)",
    short: "دلتا",
    icon: "bolt",
    lede: "مبیّن (دلتا) قبل از حل معادله به ما می‌گوید اصلاً جواب حقیقی داریم یا نه — و اگر داریم، چند تا.",

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

      /* ---------- حالت ویژه: معادلهٔ خطی (d = 0) ---------- */

      if (sol.quadratic.kind === "linear") {
        const info = U.el("div.notice.notice--info", {
          html:
            U.icons.info +
            '<div class="notice-body"><div class="notice-title">این سؤال معادلهٔ درجهٔ دوم ندارد!</div>' +
            "چون اختلاف مشترک صفر است، جملهٔ n² در معادله حذف شد و معادله خطی شد. برای معادلهٔ خطی نیازی به دلتا نیست؛ " +
            "n را مستقیم از n = −c/b به دست می‌آوریم.</div>",
        });
        card.addTo(info);
        gsap.set(info, { opacity: 0, y: 16 });
        tl.to(info, { opacity: 1, y: 0, duration: A.d(0.6) }, t0);

        const roots = F.rootStates(sol);
        const rows = C.FormulaCard.derivationRows(
          roots.intro.map((s) => ({ note: s.note }))
        );
        rows.rows.forEach((r, i) => F.render(r.formulaBox, roots.intro[i].latex));
        card.addTo(rows.el);
        rows.rows.forEach((r) => gsap.set(r.el, { opacity: 0, y: 16 }));
        rows.rows.forEach((r, i) => {
          tl.to(r.el, { opacity: 1, y: 0, duration: A.d(0.55) }, t0 + A.d(0.9) + A.d(1.0) * i);
          tl.add(() => App.Sound.play("step"), t0 + A.d(0.9) + A.d(1.0) * i);
        });

        const explain = C.ExplainCard.create({
          what: "چون معادله خطی است، مستقیماً n را حساب می‌کنیم.",
          why: "با d = ۰ همهٔ جمله‌ها برابر a₁ هستند و مجموع برابر n × a₁ می‌شود؛ رابطه خطی است.",
          result: "بدون نیاز به دلتا، n قابل محاسبه است.",
        });
        card.addTo(explain.el);
        gsap.set(Object.values(explain.rows), { opacity: 0, x: 24 });
        tl.to(Object.values(explain.rows), { opacity: 1, x: 0, duration: A.d(0.55), stagger: A.d(0.3) }, t0 + A.d(0.9) + A.d(1.0) * rows.rows.length + A.d(0.3));

        return { el: card.el, tl };
      }

      /* ---------- حالت عادی: درجهٔ دوم ---------- */

      const states = F.deltaStates(sol);
      const rows = C.FormulaCard.derivationRows(states);
      rows.rows.forEach((r, i) => F.render(r.formulaBox, states[i].latex));
      card.addTo(rows.el);

      rows.rows.forEach((r) => gsap.set(r.el, { opacity: 0, y: 18 }));
      const gap = A.d(1.15);
      rows.rows.forEach((r, i) => {
        const at = t0 + gap * i;
        tl.to(r.el, { opacity: 1, y: 0, duration: A.d(0.6), ease: "power3.out" }, at);
        tl.add(() => {
          rows.rows.forEach((rr, j) => {
            rr.el.classList.toggle("is-dimmed", j < i);
            rr.el.classList.toggle("is-focus", j === i);
          });
          if (i > 0) App.Sound.play("step");
        }, at);
      });

      /* ردیف مقدار دلتا برجسته */
      const tDelta = t0 + gap * 2;
      tl.fromTo(rows.rows[2].el, { scale: 1 }, { scale: 1.02, duration: A.d(0.3), yoyo: true, repeat: 1, clearProps: "scale" }, tDelta + A.d(0.7));

      /* ---------- پیام بر اساس علامت دلتا ---------- */

      const noReal = sol.status === "no-real";
      let verdict;
      if (noReal) {
        verdict = C.ValueChips.verdict(
          "Δ منفی است؛ معادله جواب حقیقی ندارد و ادامهٔ حل در مرحلهٔ بعد توضیح داده می‌شود.",
          { variant: "danger", icon: "error" }
        );
      } else if (sol.quadratic.delta.isZero()) {
        verdict = C.ValueChips.verdict(
          "Δ صفر است؛ معادله دقیقاً یک جواب دارد.",
          { variant: "accent", icon: "info" }
        );
      } else {
        verdict = C.ValueChips.verdict(
          "Δ مثبت است؛ معادله دو جواب حقیقی دارد — در مرحلهٔ بعد هر دو را پیدا می‌کنیم.",
          { variant: "success" }
        );
      }
      card.addTo(verdict);
      gsap.set(verdict, { opacity: 0, y: 14, scale: 0.97 });
      const tVerdict = t0 + gap * rows.rows.length + A.d(0.2);
      tl.to(verdict, { opacity: 1, y: 0, scale: 1, duration: A.d(0.55), ease: "back.out(1.6)" }, tVerdict);
      tl.add(() => App.Sound.play(noReal ? "error" : "success"), tVerdict);

      /* ---------- توضیح ---------- */

      const explain = C.ExplainCard.create({
        what: "مبیّن Δ = b² − 4ac را با ضریب‌های معادله حساب می‌کنیم.",
        why: "علامت دلتا تعداد جواب‌های حقیقی را مشخص می‌کند: مثبت یعنی دو جواب، صفر یعنی یک جواب، منفی یعنی هیچ جواب حقیقی.",
        result: noReal
          ? "Δ = " + sol.quadratic.delta.toFa() + " منفی است؛ جواب حقیقی وجود ندارد."
          : "Δ = " + sol.quadratic.delta.toFa() + (sol.quadratic.deltaRoot.exact ? " و √Δ = " + sol.quadratic.deltaRoot.exact.toFa() : "") + ".",
      });
      card.addTo(explain.el);
      const explainRows = Object.values(explain.rows);
      gsap.set(explainRows, { opacity: 0, x: 24 });
      tl.to(explainRows, { opacity: 1, x: 0, duration: A.d(0.55), stagger: A.d(0.3) }, tVerdict + A.d(0.7));

      return { el: card.el, tl };
    },
  };

  App.Scenes = App.Scenes || {};
  App.Scenes.step7 = scene;
})(window.App = window.App || {});
