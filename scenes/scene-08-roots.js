/* ============================================================
   صحنهٔ ۸ — یافتن n از فرمول درجهٔ دوم
   دو مسیر: جواب مثبت و جواب نامعتبر
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;
  const A = App.Animation;
  const F = App.Formula;
  const C = App.Components;

  const scene = {
    num: 8,
    title: "یافتن n",
    short: "ریشه‌ها",
    icon: "expand",
    lede: "حالا از فرمول جواب معادلهٔ درجهٔ دوم استفاده می‌کنیم. علامت ± یعنی دو مسیر داریم؛ هر دو را بررسی می‌کنیم تا جواب واقعی پیدا شود.",

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

      /* ---- معرفی فرمول ---- */

      const roots = F.rootStates(sol);
      const introRows = C.FormulaCard.derivationRows(
        roots.intro.map((s) => ({ note: s.note }))
      );
      introRows.rows.forEach((r, i) => F.render(r.formulaBox, roots.intro[i].latex));
      card.addTo(introRows.el);

      introRows.rows.forEach((r) => gsap.set(r.el, { opacity: 0, y: 16 }));
      introRows.rows.forEach((r, i) => {
        tl.to(r.el, { opacity: 1, y: 0, duration: A.d(0.55) }, t0 + A.d(1.05) * i);
        tl.add(() => App.Sound.play("step"), t0 + A.d(1.05) * i);
      });

      const tPaths = t0 + A.d(1.05) * introRows.rows.length + A.d(0.2);

      /* ---- حالت بدون جواب حقیقی ---- */

      if (sol.quadratic.roots.length === 0) {
        const v = C.ValueChips.verdict(
          "چون Δ منفی است، فرمول جواب هیچ عدد حقیقی نمی‌دهد؛ برای این مقادیر جواب حقیقی وجود ندارد.",
          { variant: "danger", icon: "error" }
        );
        card.addTo(v);
        gsap.set(v, { opacity: 0, y: 14, scale: 0.97 });
        tl.to(v, { opacity: 1, y: 0, scale: 1, duration: A.d(0.6), ease: "back.out(1.6)" }, tPaths);
        tl.add(() => App.Sound.play("error"), tPaths);

        const explain = C.ExplainCard.create({
          what: "سعی می‌کنیم n را از فرمول درجهٔ دوم به دست آوریم.",
          why: "فرمول جواب، ریشه‌های معادله را می‌دهد؛ اما فقط ریشه‌هایی که عدد صحیح و مثبت باشند برای n قابل قبول‌اند.",
          result: "هیچ جواب حقیقی وجود ندارد؛ سؤال با این مقادیر جواب ندارد.",
        });
        card.addTo(explain.el);
        gsap.set(Object.values(explain.rows), { opacity: 0, x: 24 });
        tl.to(Object.values(explain.rows), { opacity: 1, x: 0, duration: A.d(0.55), stagger: A.d(0.3) }, tPaths + A.d(0.8));
        return { el: card.el, tl };
      }

      /* ---- مسیرها ---- */

      const grid = U.el("div.paths-grid");
      card.addTo(grid);

      const pathCards = roots.paths.map((p) => {
        const value = p.root.exact ? p.root.exact.toNumber() : p.root.approx;
        const isValid = p.root.kind === "integer" && value >= 1;
        const pc = C.ValueChips.pathCard({
          kind: isValid ? "valid" : "rejected",
          title: p.sign === "+" ? "مسیر اول — با علامت به‌علاوه" : "مسیر دوم — با علامت منفی",
          formulas: p.formulas,
          statusText: isValid
            ? "جواب معتبر"
            : value < 1
              ? "رد می‌شود"
              : "عدد صحیح نیست",
          note: isValid
            ? "عددی صحیح و مثبت است؛ پس برای تعداد جمله‌ها قابل قبول است."
            : value < 1
              ? "چون n تعداد جمله‌هاست، باید عددی صحیح و مثبت باشد؛ این مقدار منفی یا صفر است و معنا ندارد."
              : "این مقدار مثبت است اما عدد صحیح نیست؛ تعداد جمله‌ها نمی‌توان کسری باشد. این مقدار مجموع، تعداد صحیحی از جملات را ایجاد نمی‌کند.",
        });
        grid.appendChild(pc.el);
        return { pc, isValid, value };
      });

      gsap.set(Array.from(grid.children), { opacity: 0, y: 26 });
      pathCards.forEach((p, i) => {
        const at = tPaths + A.d(1.15) * i;
        tl.to(p.pc.el, { opacity: 1, y: 0, duration: A.d(0.6), ease: "power3.out" }, at);
        tl.add(() => App.Sound.play(p.isValid ? "success" : "warn"), at + A.d(0.4));
        if (!p.isValid) tl.add(() => A.shake(p.pc.el), at + A.d(0.45));
      });

      /* ---- کارت پاسخ (فقط در صورت موفقیت) ---- */

      const success = sol.status === "success";
      const tFinal = tPaths + A.d(1.15) * pathCards.length + A.d(0.3);

      if (success) {
        const n = sol.chosen.n;
        const finalCard = C.FinalResult.successCard({
          n: n.toString(),
          message: "پس n = " + n.toFa() + " — اما هنوز مطلب آخر مانده: در مرحلهٔ بعد درستی‌اش را با جمع واقعی جمله‌ها بررسی می‌کنیم.",
        });
        finalCard.setRecap([
          { text: "معادله: " + U.toFaDigits(F.poly(sol.equation.a, sol.equation.b, sol.equation.c, "n")) + " = ۰", icon: "calculator" },
          { text: "Δ = " + sol.quadratic.delta.toFa(), icon: "bolt" },
          { text: "جواب معتبر: n = " + n.toFa(), icon: "checkCircle", tone: "success" },
        ]);
        card.addTo(finalCard.el);

        gsap.set(finalCard.el, { opacity: 0, y: 24, scale: 0.96 });
        tl.to(finalCard.el, { opacity: 1, y: 0, scale: 1, duration: A.d(0.7), ease: "back.out(1.5)" }, tFinal);
        tl.add(A.drawCheck(finalCard.orbSvg), tFinal + A.d(0.35));
        tl.add(A.countUp(finalCard.nValueEl, {
          from: 0,
          to: Math.abs(n.toNumber()),
          format: (v) => (n.isNegative() ? "−" : "") + U.fa(Math.round(v)),
          duration: 1.2,
        }), tFinal + A.d(0.45));
        tl.add(() => App.Sound.play("success"), tFinal + A.d(0.3));
      } else {
        const msg = verdictFor(sol);
        const v = C.ValueChips.verdict(msg.text, { variant: msg.variant, icon: msg.icon });
        card.addTo(v);
        gsap.set(v, { opacity: 0, y: 14 });
        tl.to(v, { opacity: 1, y: 0, duration: A.d(0.6) }, tFinal);
        tl.add(() => App.Sound.play("warn"), tFinal);
      }

      /* ---- توضیح ---- */

      const explain = C.ExplainCard.create({
        what: "هر دو جواب معادلهٔ درجهٔ دوم را می‌یابیم و آن‌ها را با شرط مسئل بررسی می‌کنیم.",
        why: "معادلهٔ درجهٔ دوم می‌تواند دو جواب بدهد، اما n تعداد جمله‌هاست و فقط عدد صحیح و مثبت پذیرفته می‌شود.",
        result: success
          ? "جواب معتبر n = " + sol.chosen.n.toFa() + " است."
          : "هیچ جوابی شرط «صحیح و مثبت» را برآورده نمی‌کند.",
      });
      card.addTo(explain.el);
      gsap.set(Object.values(explain.rows), { opacity: 0, x: 24 });
      tl.to(Object.values(explain.rows), { opacity: 1, x: 0, duration: A.d(0.55), stagger: A.d(0.3) }, tFinal + A.d(0.9));

      return { el: card.el, tl };
    },
  };

  function verdictFor(sol) {
    if (sol.status === "non-integer") {
      const approx = sol.outcome.approximate;
      return {
        text: "جواب مثبتِ حدود " + (approx.exact ? approx.exact.toFaApprox() : U.fa(approx.approx.toFixed(2))) + " عدد صحیح نیست؛ این مقدار مجموع، تعداد صحیحی از جملات را ایجاد نمی‌کند.",
        variant: "warn",
        icon: "warn",
      };
    }
    if (sol.status === "no-real") {
      return { text: "برای این مقادیر جواب حقیقی وجود ندارد.", variant: "danger", icon: "error" };
    }
    return {
      text: "هیچ‌کدام از جواب‌ها عددی صحیح و مثبت نیستند؛ برای این مقادیر، سؤال جواب ندارد.",
      variant: "warn",
      icon: "warn",
    };
  }

  App.Scenes = App.Scenes || {};
  App.Scenes.step8 = scene;
})(window.App = window.App || {});
