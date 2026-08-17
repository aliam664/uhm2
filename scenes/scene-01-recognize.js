/* ============================================================
   صحنهٔ ۱ — تشخیص دنبالهٔ حسابی
   نمایش دنباله، فلش اختلاف، اثبات ثابت بودن اختلاف
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;
  const A = App.Animation;
  const F = App.Formula;
  const C = App.Components;

  const scene = {
    num: 1,
    title: "تشخیص دنبالهٔ حسابی",
    short: "تشخیص دنباله",
    icon: "list",
    lede: "قبل از هر محاسبه‌ای باید مطمئن شویم واقعاً با یک دنبالهٔ حسابی روبه‌رو هستیم؛ یعنی فاصلهٔ جمله‌های متوالی ثابت باشد.",

    build(ctx) {
      const sol = ctx.sol;
      const card = C.StepCard.create({
        num: scene.num, total: ctx.total,
        title: scene.title, lede: scene.lede, icon: scene.icon,
      });
      const tl = A.tl({ paused: true });

      /* ---- ۱) نمایش دنباله با فلش‌ها (ابتدا پنهان) ---- */

      const seqBox = U.el("div.formula-card", { style: { overflowX: "auto" } });
      const seq = C.SequenceDisplay.horizontal({
        terms: sol.seqPreview,
        diffs: sol.diffs,
        showArrows: true,
        moreAfter: 5,
      });
      seqBox.appendChild(seq.el);
      card.addTo(seqBox);

      const shownTerms = seq.termEls.filter((_, i) => i < 5);
      const ellipsis = seq.termEls[5];
      const lines = seq.inner.querySelectorAll(".arrow-line");
      const diffs = seq.inner.querySelectorAll(".arrow-diff");

      gsap.set(shownTerms, { opacity: 0, scale: 0.5 });
      gsap.set(ellipsis, { opacity: 0 });
      gsap.set(lines, { scaleX: 0, transformOrigin: "left center" });
      gsap.set(diffs, { opacity: 0, y: -8 });

      /* سربرگ */
      tl.from(card.headRefs.badge, { opacity: 0, y: -12, duration: A.d(0.4) }, 0);
      tl.from(card.headRefs.title, { opacity: 0, y: 14, duration: A.d(0.5) }, 0.05);
      if (card.headRefs.lede) tl.from(card.headRefs.lede, { opacity: 0, y: 12, duration: A.d(0.5) }, 0.15);
      tl.from(card.headRefs.icon, { opacity: 0, scale: 0.6, duration: A.d(0.5), ease: "back.out(2)" }, 0.1);

      /* جمله‌ها یکی‌یکی */
      const tTerms = 0.4;
      tl.to(shownTerms, { opacity: 1, scale: 1, duration: A.d(0.5), stagger: A.d(0.24), ease: "back.out(1.9)" }, tTerms);
      tl.add(() => App.Sound.play("click"), tTerms);
      tl.to(ellipsis, { opacity: 1, duration: A.d(0.4) }, tTerms + A.d(1.35));

      /* فلش‌ها و اختلاف */
      const tArrows = tTerms + A.d(1.7);
      tl.to(lines, { scaleX: 1, duration: A.d(0.4), stagger: A.d(0.3), ease: "power2.out" }, tArrows);
      tl.to(diffs, { opacity: 1, y: 0, duration: A.d(0.4), stagger: A.d(0.3), ease: "back.out(1.8)" }, tArrows + A.d(0.18));

      /* ---- ۲) محاسبهٔ اختلاف‌ها ---- */

      const diffRows = C.FormulaCard.derivationRows([
        { note: "اختلاف جملهٔ دوم از جملهٔ اول" },
        { note: "اختلاف جملهٔ سوم از جملهٔ دوم" },
      ]);
      F.render(diffRows.rows[0].formulaBox, F.differenceEq(sol, 0));
      F.render(diffRows.rows[1].formulaBox, F.differenceEq(sol, 1));
      card.addTo(diffRows.el);

      diffRows.rows.forEach((r) => gsap.set(r.el, { opacity: 0, y: 18 }));

      const tDiff1 = tArrows + A.d(1.35);
      tl.to(diffRows.rows[0].el, { opacity: 1, y: 0, duration: A.d(0.6) }, tDiff1);
      tl.add(() => {
        seq.termEls[0].classList.add("is-hot");
        seq.termEls[1].classList.add("is-hot");
      }, tDiff1);

      const tDiff2 = tDiff1 + A.d(0.9);
      tl.to(diffRows.rows[1].el, { opacity: 1, y: 0, duration: A.d(0.6) }, tDiff2);
      tl.add(() => {
        seq.termEls[1].classList.remove("is-hot");
        seq.termEls[2].classList.add("is-hot");
      }, tDiff2);
      tl.add(() => seq.termEls.forEach((t) => t.classList.remove("is-hot")), tDiff2 + A.d(0.8));

      /* ---- ۳) توضیح سه‌لایه ---- */

      const explain = C.ExplainCard.create({
        what: "اختلاف هر دو جملهٔ متوالی را حساب می‌کنیم.",
        why: "اگر این اختلاف برای همهٔ جمله‌ها یکسان باشد، دنباله حسابی است و می‌توانیم از فرمول‌های مخصوص آن استفاده کنیم.",
        result: "هر دو اختلاف برابر " + sol.diffs[0].toFa() + " است؛ پس دنباله حسابی است.",
      });
      card.addTo(explain.el);
      const explainRows = Object.values(explain.rows);
      gsap.set(explainRows, { opacity: 0, x: 24 });
      tl.to(explainRows, { opacity: 1, x: 0, duration: A.d(0.55), stagger: A.d(0.3) }, tDiff2 + A.d(1.1));

      /* ---- ۴) حکم نهایی ---- */

      const verdict = C.ValueChips.verdict(
        "اختلاف جملات ثابت است، پس این یک دنبالهٔ حسابی است.",
        { variant: "success" }
      );
      card.addTo(verdict);
      gsap.set(verdict, { opacity: 0, y: 16, scale: 0.97 });
      const tVerdict = tDiff2 + A.d(2.3);
      tl.to(verdict, { opacity: 1, y: 0, scale: 1, duration: A.d(0.6), ease: "back.out(1.6)" }, tVerdict);
      tl.add(() => App.Sound.play("success"), tVerdict);

      return { el: card.el, tl };
    },
  };

  App.Scenes = App.Scenes || {};
  App.Scenes.step1 = scene;
})(window.App = window.App || {});
