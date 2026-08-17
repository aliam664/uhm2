/* ============================================================
   صحنهٔ ۹ — بررسی جواب با جمع واقعی + جشن پایانی
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;
  const A = App.Animation;
  const F = App.Formula;
  const C = App.Components;

  const scene = {
    num: 9,
    title: "بررسی جواب",
    short: "بررسی",
    icon: "checkCircle",
    lede: "قانون طلایی ریاضی: هیچ جوابی را بدون بررسی نپذیر! جمله‌ها را واقعاً می‌سازیم و جمع می‌زنیم تا مطمئن شویم.",

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

      /* ---------- حالت ناموفق: کارت جمع‌بندی ---------- */

      if (sol.status !== "success") {
        const msg = conclusionFor(sol);
        const cc = C.FinalResult.conclusionCard(msg);
        card.addTo(cc.el);
        gsap.set(cc.el, { opacity: 0, y: 22, scale: 0.97 });
        tl.to(cc.el, { opacity: 1, y: 0, scale: 1, duration: A.d(0.7), ease: "back.out(1.4)" }, t0);
        tl.add(() => App.Sound.play("warn"), t0 + A.d(0.4));

        const explain = C.ExplainCard.create({
          what: "نتیجهٔ نهایی مسئله را جمع‌بندی می‌کنیم.",
          why: "همیشه باید معنی جواب ریاضی را در متن مسئله بررسی کنیم، نه فقط عدد را.",
          result: msg.title,
        });
        card.addTo(explain.el);
        gsap.set(Object.values(explain.rows), { opacity: 0, x: 24 });
        tl.to(Object.values(explain.rows), { opacity: 1, x: 0, duration: A.d(0.55), stagger: A.d(0.3) }, t0 + A.d(1.0));

        return { el: card.el, tl };
      }

      /* ---------- حالت موفق ---------- */

      const chosen = sol.chosen;
      const n = chosen.n;

      /* ۱) نمایش جمله‌های واقعی */

      const seqBox = U.el("div.formula-card", { style: { overflowX: "auto" } });
      const displayTerms = chosen.huge ? chosen.displayTerms : chosen.terms;
      const seq = C.SequenceDisplay.horizontal({
        terms: displayTerms,
        showArrows: false,
        moreAfter: chosen.huge ? 6 : displayTerms.length,
      });
      seqBox.appendChild(U.el("div.formula-caption", { text: n.toFa() + " جملهٔ اول دنباله" }));
      seqBox.appendChild(seq.el);
      card.addTo(seqBox);

      gsap.set(seq.termEls, { opacity: 0, scale: 0.5 });
      tl.to(seq.termEls, { opacity: 1, scale: 1, duration: A.d(0.45), stagger: A.d(0.16), ease: "back.out(2)" }, t0);
      tl.add(() => App.Sound.play("click"), t0 + A.d(0.4));

      /* ۲) جمع تجمعی */

      const sv = C.FinalResult.sumViz({
        terms: chosen.huge ? displayTerms : chosen.terms,
        total: chosen.actualSum,
      });
      card.addTo(sv.el);

      gsap.set(sv.termEls, { opacity: 0.35 });
      gsap.set(sv.totalEl, { opacity: 0 });
      gsap.set(sv.meterFill, { scaleX: 0 });

      const tSum = t0 + A.d(0.16) * displayTerms.length + A.d(0.5);
      const totalNum = chosen.actualSum.toNumber();
      let cumulative = 0;

      (chosen.huge ? displayTerms : chosen.terms).forEach((term, i) => {
        const at = tSum + A.d(0.55) * i;
        cumulative = term.toNumber();
        const running = chosen.terms.slice(0, i + 1).reduce((acc, t2) => acc.add(t2), App.Fraction.from(0));
        tl.add(() => sv.termEls[i].classList.add("is-added"), at);
        tl.to(sv.meterFill, {
          scaleX: Math.max(0.02, cumulative / totalNum),
          duration: A.d(0.45),
          ease: "power2.out",
        }, at);
        tl.to(sv.runningEl, {
          onStart() {},
          duration: 0.01,
        }, at);
        tl.add(() => {
          sv.runningEl.textContent = running.toFa() + " از " + chosen.actualSum.toFa();
        }, at);
      });

      tl.to(sv.totalEl, { opacity: 1, duration: A.d(0.5), ease: "power2.out" }, tSum + A.d(0.55) * displayTerms.length);
      tl.fromTo(sv.totalEl, { scale: 1.25 }, { scale: 1, duration: A.d(0.6), ease: "back.out(2)", clearProps: "scale" }, tSum + A.d(0.55) * displayTerms.length);

      /* ۳) کارت پاسخ نهایی */

      const finalCard = C.FinalResult.successCard({
        n: n.toString(),
        message: "جواب درست است — مجموع " + n.toFa() + " جملهٔ اول برابر " + sol.input.target.toFa() + " است.",
      });
      finalCard.setRecap([
        { text: "a₁ = " + sol.input.a1.toFa(), icon: "target" },
        { text: "d = " + sol.input.d.toFa(), icon: "swap" },
        { text: "Sₙ = " + sol.input.target.toFa(), icon: "sigma" },
        { text: "n = " + n.toFa(), icon: "checkCircle", tone: "success" },
        { text: "جمع واقعی = " + chosen.actualSum.toFa(), icon: "check", tone: "success" },
      ]);
      card.addTo(finalCard.el);

      gsap.set(finalCard.el, { opacity: 0, y: 24, scale: 0.96 });
      const tFinal = tSum + A.d(0.55) * displayTerms.length + A.d(0.8);
      tl.to(finalCard.el, { opacity: 1, y: 0, scale: 1, duration: A.d(0.7), ease: "back.out(1.5)" }, tFinal);
      tl.add(A.drawCheck(finalCard.orbSvg), tFinal + A.d(0.4));
      tl.add(A.countUp(finalCard.nValueEl, { from: 0, to: n.toNumber(), format: (v) => U.fa(Math.round(v)), duration: 1.3 }), tFinal + A.d(0.5));
      tl.fromTo(
        finalCard.recapEl.querySelectorAll(".chip"),
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: A.d(0.45), stagger: A.d(0.12), clearProps: "transform" },
        tFinal + A.d(1.1)
      );

      /* ۴) جشن ظریف */

      tl.add(() => {
        App.Sound.play("celebrate");
        A.celebrate(finalCard.el);
      }, tFinal + A.d(1.4));

      /* ۵) توضیح */

      const explain = C.ExplainCard.create({
        what: "جمله‌های دنباله را تا جملهٔ n اُم می‌سازیم و واقعاً جمع می‌زنیم.",
        why: "این بررسی نشان می‌دهد عددی که از معادله به دست آمد واقعاً همان تعدادی است که مجموع را کامل می‌کند.",
        result: "جمع " + n.toFa() + " جملهٔ اول دقیقاً برابر " + chosen.actualSum.toFa() + " شد؛ جواب تأیید شد.",
      });
      card.addTo(explain.el);
      gsap.set(Object.values(explain.rows), { opacity: 0, x: 24 });
      tl.to(Object.values(explain.rows), { opacity: 1, x: 0, duration: A.d(0.55), stagger: A.d(0.3) }, tFinal + A.d(1.8));

      return { el: card.el, tl };
    },
  };

  function conclusionFor(sol) {
    if (sol.status === "no-real") {
      return {
        variant: "danger",
        title: "برای این مقادیر جواب حقیقی وجود ندارد",
        message: "چون Δ منفی شد، معادلهٔ درجهٔ دوم هیچ ریشهٔ حقیقی ندارد؛ یعنی با این جملهٔ اول، اختلاف و مجموع هدف، هیچ تعداد جمله‌ای مجموع را دقیقاً کامل نمی‌کند. مقدار مجموع هدف را تغییر دهید و دوباره امتحان کنید.",
      };
    }
    if (sol.status === "non-integer") {
      const approx = sol.outcome.approximate;
      return {
        variant: "warn",
        title: "این مقدار مجموع، تعداد صحیحی از جملات را ایجاد نمی‌کند",
        message: "معادله جوابی حدود " + (approx.exact ? approx.exact.toFaApprox() : U.fa(approx.approx.toFixed(2))) + " دارد که صحیح نیست؛ اما تعداد جمله‌ها باید عدد صحیح باشد. پس چنین دنباله‌ای با این مجموع وجود ندارد — مجموع هدف را کمی تغییر دهید.",
      };
    }
    return {
      variant: "warn",
      title: "جواب‌ها شرط مسئله را برآورده نمی‌کنند",
      message: "ریشه‌های معادله یا منفی‌اند یا صفر؛ در حالی که n تعداد جمله‌هاست و باید عددی صحیح و بزرگ‌تر از صفر باشد. برای این مقادیر، سؤال جواب ندارد.",
    };
  }

  App.Scenes = App.Scenes || {};
  App.Scenes.step9 = scene;
})(window.App = window.App || {});
