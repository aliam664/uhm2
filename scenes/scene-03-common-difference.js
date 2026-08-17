/* ============================================================
   صحنهٔ ۳ — تعیین اختلاف مشترک (d)
   فرمول + نردبان عمودی
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;
  const A = App.Animation;
  const F = App.Formula;
  const C = App.Components;

  const scene = {
    num: 3,
    title: "تعیین اختلاف مشترک",
    short: "اختلاف",
    icon: "swap",
    lede: "اختلاف مشترک، دومی از دو پارامتری است که دنبالهٔ حسابی را تعریف می‌کند؛ آن را با حرف d نشان می‌دهیم.",

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

      /* ---- دو ستون: فرمول | نردبان ---- */

      const cd = F.commonDiff(sol);

      const rows = C.FormulaCard.derivationRows([
        { latex: cd.symbol, note: "تعریف: اختلاف دو جملهٔ متوالی" },
        { latex: cd.substituted, note: "جایگذاری جملهٔ اول و دوم" },
        { latex: cd.result, note: "اختلاف مشترک دنباله" },
      ]);
      rows.rows.forEach((r) => F.render(r.formulaBox, r.item.latex));
      if (rows.rows[2]) rows.rows[2].el.classList.add("is-focus");

      const formulaCard = U.el("div.formula-card.formula-card--hero", {}, [rows.el]);

      const ladder = C.SequenceDisplay.ladder({
        terms: sol.seqPreview.slice(0, 3),
        diffs: sol.diffs.slice(0, 2),
      });
      const ladderCard = U.el("div.formula-card", { style: { display: "grid", placeItems: "center" } }, [ladder.el]);
      ladderCard.appendChild(U.el("div.formula-caption", { text: "پیمایش دنباله" }));

      const duo = U.el("div.duo-grid", {}, [formulaCard, ladderCard]);
      card.addTo(duo);

      /* حالت اولیه */
      rows.rows.forEach((r) => gsap.set(r.el, { opacity: 0, y: 16 }));
      gsap.set(ladder.termEls, { opacity: 0, y: -14, scale: 0.7 });
      gsap.set(ladder.linkEls.map((l) => l.el), { opacity: 0 });

      /* فرمول‌ها */
      tl.to(rows.rows[0].el, { opacity: 1, y: 0, duration: A.d(0.5) }, t0);
      tl.to(rows.rows[1].el, { opacity: 1, y: 0, duration: A.d(0.5) }, t0 + A.d(0.8));
      tl.add(() => App.Sound.play("click"), t0 + A.d(0.8));
      tl.to(rows.rows[2].el, { opacity: 1, y: 0, duration: A.d(0.55), ease: "back.out(1.6)" }, t0 + A.d(1.7));
      tl.add(() => {
        App.Sound.play("step");
        ladder.termEls[0].classList.add("is-hot");
        setTimeout(() => ladder.termEls[0].classList.remove("is-hot"), 1400);
      }, t0 + A.d(1.7));

      /* نردبان به موازات فرمول */
      const tLadder = t0 + A.d(0.6);
      const gap = A.d(0.75);
      ladder.termEls.forEach((termEl, i) => {
        tl.to(termEl, { opacity: 1, y: 0, scale: 1, duration: A.d(0.45), ease: "back.out(2)" }, tLadder + gap * i);
      });
      ladder.linkEls.forEach((lk, i) => {
        tl.to(lk.el, { opacity: 1, duration: A.d(0.3) }, tLadder + gap * i + A.d(0.35));
      });

      /* ---- توضیح ---- */

      const explain = C.ExplainCard.create({
        what: "اختلاف مشترک d را از تفاضل دو جملهٔ متوالی به دست می‌آوریم.",
        why: "در فرمول مجموع، d تعیین می‌کند جمله‌ها چقدر از هم فاصله دارند؛ بدون d نمی‌توان جمله‌های بعدی را ساخت.",
        result: "d = " + sol.input.d.toFa() + "؛ یعنی هر جمله " + sol.input.d.toFa() + " واحد از جملهٔ قبلش بزرگ‌تر است.",
      });
      card.addTo(explain.el);
      const explainRows = Object.values(explain.rows);
      gsap.set(explainRows, { opacity: 0, x: 24 });
      tl.to(explainRows, { opacity: 1, x: 0, duration: A.d(0.55), stagger: A.d(0.3) }, t0 + A.d(2.6));

      return { el: card.el, tl };
    },
  };

  App.Scenes = App.Scenes || {};
  App.Scenes.step3 = scene;
})(window.App = window.App || {});
