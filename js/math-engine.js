/* ============================================================
   MathEngine — حل کامل مسئلهٔ «مجموع n جملهٔ اول دنبالهٔ حسابی»
   مستقل از UI؛ همهٔ محاسبات دقیق (Fraction) انجام می‌شود.

   مسئله: با داشتن a₁ ، d و Sₙ ، عدد n را بیاب به‌طوری که
          Sₙ = n/2 [2a₁ + (n−1)d]

   استخراج معادله (ضرب طرفین در ۲ و باز کردن):
          d·n² + (2a₁ − d)·n − 2Sₙ = 0
   ============================================================ */

(function (App) {
  "use strict";

  const Fraction = App.Fraction;
  const Seq = App.SequenceEngine;
  const QS = App.QuadraticSolver;

  const LIMIT = 1e9;

  const MathError = Seq.MathInputError;

  /* ---------- اعتبارسنجی پارامترها ---------- */

  function readParam(raw, nameFa) {
    if (raw === null || raw === undefined || String(raw).trim() === "") {
      throw new MathError("empty", "مقدار «" + nameFa + "» را وارد کنید.");
    }
    let f;
    try {
      f = Fraction.fromString(App.Utils.normalizeNumeric(raw));
    } catch (e) {
      throw new MathError("bad-number", "مقدار «" + nameFa + "» باید یک عدد باشد.");
    }
    if (Math.abs(f.n) > LIMIT * f.d) {
      throw new MathError("too-large", "مقدار «" + nameFa + "» نباید از ۱٬۰۰۰٬۰۰۰٬۰۰۰ بزرگ‌تر باشد.");
    }
    return f;
  }

  /* ---------- تعیین وضعیت نهایی ---------- */

  function pickOutcome(quadratic) {
    const validRoots = [];
    let positiveNonInteger = null;

    for (const r of quadratic.roots) {
      const value = r.exact ? r.exact.toNumber() : r.approx;
      if (Number.isInteger(Math.round(value)) && Math.abs(value - Math.round(value)) < 1e-9 && value >= 1) {
        const n = Fraction.from(Math.round(value));
        if (!validRoots.some((x) => x.exact && x.exact.eq(n))) validRoots.push({ exact: n, approx: value, kind: "integer" });
      } else if (value > 0 && value < 1e7 && !positiveNonInteger) {
        positiveNonInteger = r;
      }
    }

    if (quadratic.status === "no-real") {
      return { status: "no-real", validRoots: [] };
    }
    if (quadratic.status === "infinite") {
      return { status: "infinite", validRoots: [] };
    }
    if (quadratic.status === "none") {
      return { status: "degenerate-none", validRoots: [] };
    }
    if (validRoots.length > 0) {
      // اگر چند جواب مثبتِ صحیح وجود داشت، کوچک‌ترین را (اولین بار رسیدن به مجموع) برمی‌داریم
      validRoots.sort((x, y) => x.approx - y.approx);
      return { status: "success", validRoots };
    }
    if (positiveNonInteger) {
      return { status: "non-integer", validRoots: [], approximate: positiveNonInteger };
    }
    return { status: "none-positive", validRoots: [] };
  }

  /* ---------- حل اصلی ---------- */

  /**
   * solveArithmeticSum({ a1, d, target })
   * همهٔ ورودی‌ها رشته/عدد قابل‌تجزیه به کسر دقیق.
   */
  function solveArithmeticSum(params) {
    const a1 = readParam(params.a1, "جملهٔ اول");
    const d = readParam(params.d, "اختلاف مشترک");
    const target = readParam(params.target, "مجموع هدف");

    if (a1.isZero() && d.isZero()) {
      throw new MathError(
        "degenerate",
        target.isZero()
          ? "وقتی جملهٔ اول و اختلاف هر دو صفر باشند، مجموع در هر تعداد جمله صفر است و مسئلهٔ مشخصی وجود ندارد."
          : "وقتی جملهٔ اول و اختلاف هر دو صفر باشند، مجموع هرگز " + target.toFa() + " نمی‌شود."
      );
    }

    /* ---- ساخت دنباله برای نمایش ---- */
    const seqPreview = Seq.buildTerms(a1, d, 6);

    /* ---- ضریب‌های معادله ---- */
    const eqA = d;                    // d·n²
    const eqB = a1.mul(2).sub(d);     // (2a₁ − d)·n
    const eqC = target.mul(-2);       // − 2Sₙ

    const quadratic = QS.solve(eqA, eqB, eqC);
    const outcome = pickOutcome(quadratic);

    /* ---- در صورت موفقیت: بسط جملات و بررسی ---- */
    let chosen = null;
    if (outcome.status === "success") {
      const n = outcome.validRoots[0].exact;
      const nInt = n.n;
      const terms = Seq.buildTerms(a1, d, Math.min(nInt, 12));
      const actualSum = Seq.sumOf(a1, d, n);
      chosen = {
        n,
        nInt,
        terms,
        displayTerms: nInt <= 12 ? terms : terms.slice(0, 6),
        actualSum,
        verified: actualSum.eq(target),
        huge: nInt > 12,
      };
    }

    return {
      input: { a1, d, target, source: params.source || "params", raw: params },
      seqPreview,
      diffs: seqPreview.slice(1).map((t, i) => t.sub(seqPreview[i])),
      equation: { a: eqA, b: eqB, c: eqC },
      inner: { lin: d, k: a1.mul(2).sub(d) }, // شکل ساده‌شدهٔ داخل کمان: d·n + (2a₁−d)
      quadratic,
      outcome,
      chosen,
      status: outcome.status,
    };
  }

  /**
   * تجزیهٔ ورودی مستقیم دنباله + مجموع هدف
   * { sequence: "2, 7, 12", target: "87" }
   */
  function solveFromSequence(params) {
    const terms = Seq.parseInput(params.sequence || "");
    const target = readParam(params.target, "مجموع هدف");
    const analysis = Seq.analyze(terms);

    if (!analysis.isArithmetic) {
      // دقیق توضیح می‌دهیم کجا ثابت بودن اختلاف به هم می‌خورد
      let firstBad = -1;
      for (let i = 1; i < analysis.diffs.length; i++) {
        if (!analysis.diffs[i].eq(analysis.diffs[0])) { firstBad = i; break; }
      }
      const i = firstBad;
      throw new MathError(
        "not-arithmetic",
        "این دنباله حسابی نیست، چون اختلاف همهٔ جمله‌های متوالی ثابت نیست: " +
          "اختلاف جملهٔ " + App.Utils.fa(i) + " و " + App.Utils.fa(i + 1) + " برابر " +
          analysis.diffs[i - 1].toFa() + " است اما اختلاف جملهٔ " + App.Utils.fa(i + 1) + " و " +
          App.Utils.fa(i + 2) + " برابر " + analysis.diffs[i].toFa() + " می‌شود."
      );
    }

    const a1 = terms[0];
    const d = analysis.diffs[0];
    const solution = solveArithmeticSum({
      a1: a1.toString(),
      d: d.toString(),
      target: target.toString(),
      source: "sequence",
    });
    solution.input.sequenceTerms = terms;
    return solution;
  }

  App.MathEngine = {
    solveArithmeticSum,
    solveFromSequence,
    MathError,
    buildTerms: Seq.buildTerms,
    sumOf: Seq.sumOf,
    analyze: Seq.analyze,
    parseInput: Seq.parseInput,
  };
})(window.App = window.App || {});
