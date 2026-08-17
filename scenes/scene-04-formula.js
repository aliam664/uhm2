/* ============================================================
   صحنهٔ ۴ — انتخاب فرمول مجموع
   ساخت تدریجی Sₙ = n/2 [2a₁ + (n−1)d]
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;
  const A = App.Animation;
  const F = App.Formula;
  const C = App.Components;

  const scene = {
    num: 4,
    title: "انتخاب فرمول",
    short: "فرمول",
    icon: "function",
    lede: "برای پیدا کردن مجموع n جملهٔ اول یک دنبالهٔ حسابی، به‌جای جمع کردن تک‌تک جمله‌ها از یک فرمول هوشمندانه استفاده می‌کنیم؛ فرمول را قدم‌به‌قدم می‌سازیم.",

    build(ctx) {
      const card = C.StepCard.create({
        num: scene.num, total: ctx.total,
        title: scene.title, lede: scene.lede, icon: scene.icon,
      });
      const tl = A.tl({ paused: true });

      const t0 = 0.35;
      tl.from(card.headRefs.badge, { opacity: 0, y: -12, duration: A.d(0.4) }, 0);
      tl.from(card.headRefs.title, { opacity: 0, y: 14, duration: A.d(0.5) }, 0.05);
      if (card.headRefs.lede) tl.from(card.headRefs.lede, { opacity: 0, y: 12, duration: A.d(0.5) }, 0.15);
      tl.from(card.headRefs.icon, { opacity: 0, scale: 0.6, duration: A.d(0.5), ease: "back.out(2)" }, 0.1);

      /* ---- کارت فرمول بزرگ با ساخت تدریجی ---- */

      const fCard = C.FormulaCard.create({ caption: "فرمول مجموع n جملهٔ اول", size: "hero" });
      const hero = U.el("div.formula.formula--hero");
      fCard.box.appendChild(hero);
      F.render(hero, "S_n");
      card.addTo(fCard.el);

      const labels = C.FormulaCard.formulaLabels([
        { text: "Sₙ = مجموع n جملهٔ اول", tone: "gold" },
        { text: "n = تعداد جمله‌ها", tone: "cyan" },
        { text: "a₁ = جملهٔ اول", tone: "gold" },
        { text: "d = اختلاف مشترک", tone: "cyan" },
      ]);
      fCard.el.appendChild(labels.el);
      gsap.set(labels.chips, { opacity: 0, y: 10 });

      const states = F.formulaBuild();
      let cursor = t0;

      states.forEach((st, i) => {
        tl.add(A.swapFormula(hero, st.latex, { mode: "replace" }), cursor);
        tl.add(() => App.Sound.play("click"), cursor + A.d(0.32));
        tl.to(labels.chips[Math.min(i, labels.chips.length - 1)], { opacity: 1, y: 0, duration: A.d(0.4) }, cursor + A.d(0.5));
        cursor += A.d(1.15);
      });

      /* پالس پایانی روی فرمول کامل */
      tl.fromTo(fCard.el, { scale: 1 }, { scale: 1.015, duration: A.d(0.3), yoyo: true, repeat: 1, clearProps: "scale" }, cursor + A.d(0.1));

      /* ---- نکتهٔ چرا n/2؟ ---- */

      const gauss = U.el("div.notice.notice--info", {
        html:
          U.icons.sparkle +
          '<div class="notice-body"><div class="notice-title">چرا نصف تعداد جمله‌ها؟</div>' +
          "ترفند گاوس: اگر جملهٔ اول و آخر را با هم جمع کنیم، جملهٔ دوم و یکی‌مانده به آخر را با هم، و به همین شکل جفت‌جفت — مجموع هر جفت برابر می‌شود. " +
          "با n جمله، دقیقاً n/2 جفت یکسان داریم؛ برای همین در n/2 ضرب می‌کنیم.</div>",
      });
      card.addTo(gauss);
      gsap.set(gauss, { opacity: 0, y: 18 });
      tl.to(gauss, { opacity: 1, y: 0, duration: A.d(0.6) }, cursor + A.d(0.5));

      /* ---- توضیح ---- */

      const explain = C.ExplainCard.create({
        what: "فرمول مجموع n جملهٔ اول دنبالهٔ حسابی را انتخاب می‌کنیم.",
        why: "جمع دستی n جمله کاری طولانی است؛ این فرمول با استفاده از فقط سه مقدار a₁ ، d و n مستقیماً مجموع را می‌دهد.",
        result: "فرمول آماده شد: Sₙ = n/2 × [2a₁ + (n−1)d].",
      });
      card.addTo(explain.el);
      const explainRows = Object.values(explain.rows);
      gsap.set(explainRows, { opacity: 0, x: 24 });
      tl.to(explainRows, { opacity: 1, x: 0, duration: A.d(0.55), stagger: A.d(0.3) }, cursor + A.d(1.1));

      return { el: card.el, tl };
    },
  };

  App.Scenes = App.Scenes || {};
  App.Scenes.step4 = scene;
})(window.App = window.App || {});
