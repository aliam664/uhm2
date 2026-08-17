/* ============================================================
   صحنهٔ ۲ — تعیین جملهٔ اول (a₁)
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;
  const A = App.Animation;
  const F = App.Formula;
  const C = App.Components;

  const scene = {
    num: 2,
    title: "تعیین جملهٔ اول",
    short: "جملهٔ اول",
    icon: "target",
    lede: "هر دنبالهٔ حسابی با دو عدد کاملاً مشخص می‌شود: جملهٔ اول و اختلاف مشترک. از جملهٔ اول شروع می‌کنیم.",

    build(ctx) {
      const sol = ctx.sol;
      const card = C.StepCard.create({
        num: scene.num, total: ctx.total,
        title: scene.title, lede: scene.lede, icon: scene.icon,
      });
      const tl = A.tl({ paused: true });

      /* ---- نمایش دنباله با برچسب a₁ ---- */

      const seqBox = U.el("div.formula-card", { style: { overflowX: "auto" } });
      const seq = C.SequenceDisplay.horizontal({
        terms: sol.seqPreview,
        showArrows: false,
        moreAfter: 5,
        firstTag: "a₁",
      });
      seqBox.appendChild(seq.el);
      card.addTo(seqBox);

      const brace = seq.inner.querySelector(".seq-brace");
      const tag = seq.inner.querySelector(".seq-tag");
      const first = seq.termEls[0];

      gsap.set(seq.termEls, { opacity: 0.45, scale: 1 });
      gsap.set(brace, { opacity: 0, scaleX: 0, transformOrigin: "center" });
      gsap.set(tag, { opacity: 0, y: -6 });

      const t0 = 0.35;
      tl.from(card.headRefs.badge, { opacity: 0, y: -12, duration: A.d(0.4) }, 0);
      tl.from(card.headRefs.title, { opacity: 0, y: 14, duration: A.d(0.5) }, 0.05);
      if (card.headRefs.lede) tl.from(card.headRefs.lede, { opacity: 0, y: 12, duration: A.d(0.5) }, 0.15);

      /* اول همهٔ جمله‌ها آرام دیده می‌شوند، بعد تمرکز روی جملهٔ اول */
      tl.to(seq.termEls.filter((_, i) => i < 5), { opacity: 1, duration: A.d(0.4), stagger: 0.05 }, t0);

      const tFocus = t0 + A.d(0.8);
      tl.to(brace, { opacity: 1, scaleX: 1, duration: A.d(0.5), ease: "power2.out" }, tFocus);
      tl.to(tag, { opacity: 1, y: 0, duration: A.d(0.45), ease: "back.out(1.8)" }, tFocus + A.d(0.2));
      tl.add(() => {
        first.classList.add("is-hot");
        seq.termEls.filter((_, i) => i > 0).forEach((t2) => t2.classList.add("is-soft"));
        App.Sound.play("step");
      }, tFocus);
      tl.fromTo(first, { scale: 1 }, { scale: 1.12, duration: A.d(0.3), yoyo: true, repeat: 1, ease: "power2.inOut" }, tFocus + A.d(0.15));

      /* ---- فرمول a₁ = … ---- */

      const rows = C.FormulaCard.derivationRows([
        { latex: "a_1 = " + F.num(sol.input.a1), note: "اولین جملهٔ دنباله" },
      ]);
      F.render(rows.rows[0].formulaBox, rows.rows[0].item.latex);
      const fCard = U.el("div.formula-card.formula-card--hero", {}, [rows.el]);
      card.addTo(fCard);

      gsap.set(rows.rows[0].el, { opacity: 0, scale: 0.94 });
      const tFormula = tFocus + A.d(1.2);
      tl.to(rows.rows[0].el, { opacity: 1, scale: 1, duration: A.d(0.6), ease: "back.out(1.7)" }, tFormula);
      tl.add(() => {
        const hl = rows.rows[0].formulaBox.querySelector(".katex");
        if (hl) gsap.fromTo(hl, { scale: 1 }, { scale: 1.05, duration: A.d(0.3), yoyo: true, repeat: 1, clearProps: "scale" });
      }, tFormula + A.d(0.3));

      /* ---- توضیح ---- */

      const explain = C.ExplainCard.create({
        what: "جملهٔ اول دنباله را پیدا و نام‌گذاری می‌کنیم.",
        why: "جملهٔ اول یکی از دو پارامتری است که کل دنباله را می‌سازد و در فرمول مجموع هم مستقیماً ظاهر می‌شود.",
        result: "اولین جملهٔ دنباله " + sol.input.a1.toFa() + " است؛ پس a₁ = " + sol.input.a1.toFa() + ".",
      });
      card.addTo(explain.el);
      const explainRows = Object.values(explain.rows);
      gsap.set(explainRows, { opacity: 0, x: 24 });
      tl.to(explainRows, { opacity: 1, x: 0, duration: A.d(0.55), stagger: A.d(0.3) }, tFormula + A.d(0.7));

      return { el: card.el, tl };
    },
  };

  App.Scenes = App.Scenes || {};
  App.Scenes.step2 = scene;
})(window.App = window.App || {});
