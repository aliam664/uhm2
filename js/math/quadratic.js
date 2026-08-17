/* ============================================================
   Quadratic — حل معادلهٔ درجهٔ دوم با محاسبهٔ دقیق
   an² + bn + c = 0  →  Δ = b² − 4ac  →  n = (−b ± √Δ) / 2a
   ============================================================ */

(function (App) {
  "use strict";

  const Fraction = App.Fraction;

  /**
   * حل معادلهٔ an² + bn + c = 0 (ورودی‌ها Fraction یا عدد)
   *
   * خروجی:
   * {
   *   a, b, c: Fraction,
   *   kind: 'quadratic' | 'linear' | 'constant',
   *   delta: Fraction | null,
   *   deltaRoot: { exact: Fraction | null, approx: number },
   *   roots: Array<{
   *     exact: Fraction | null,   // اگر گویا و قابل‌نمایش دقیق
   *     approx: number,           // مقدار عددی
   *     kind: 'integer' | 'rational' | 'irrational',
   *   }>,
   *   status: 'two-real' | 'one-real' | 'no-real' | 'linear' | 'none'
   * }
   */
  function solveQuadratic(a, b, c) {
    a = Fraction.from(a);
    b = Fraction.from(b);
    c = Fraction.from(c);

    // معادلهٔ درجهٔ اول؟
    if (a.isZero()) {
      if (b.isZero()) {
        return {
          a, b, c, kind: "constant",
          delta: null, deltaRoot: null, roots: [],
          status: c.isZero() ? "infinite" : "none",
        };
      }
      // bn + c = 0 → n = −c / b
      const root = c.neg().div(b);
      return {
        a, b, c, kind: "linear",
        delta: null, deltaRoot: null,
        roots: [classify(root)],
        status: "linear",
      };
    }

    const delta = b.mul(b).sub(a.mul(c).mul(4));
    const twoA = a.mul(2);

    if (delta.isNegative()) {
      return {
        a, b, c, kind: "quadratic",
        delta, deltaRoot: null,
        roots: [],
        status: "no-real",
      };
    }

    // جذر دقیق دلتا: دلتا = n/d — مربع کامل باشد
    let exactSqrt = null;
    const sn = Fraction.intSqrt(delta.n);
    const sd = Fraction.intSqrt(delta.d);
    if (sn !== null && sd !== null) {
      exactSqrt = new Fraction(sn, sd);
    }

    const deltaRoot = {
      exact: exactSqrt,
      approx: Math.sqrt(delta.toNumber()),
    };

    if (delta.isZero()) {
      const root = b.neg().div(twoA);
      return { a, b, c, kind: "quadratic", delta, deltaRoot, roots: [classify(root)], status: "one-real" };
    }

    let roots;
    if (exactSqrt) {
      roots = [
        classify(b.neg().add(exactSqrt).div(twoA)),
        classify(b.neg().sub(exactSqrt).div(twoA)),
      ];
    } else {
      const negB = b.neg().toNumber();
      const s = deltaRoot.approx;
      const den = twoA.toNumber();
      roots = [
        classifyApprox((negB + s) / den),
        classifyApprox((negB - s) / den),
      ];
    }

    return { a, b, c, kind: "quadratic", delta, deltaRoot, roots, status: "two-real" };
  }

  function classify(frac) {
    return {
      exact: frac,
      approx: frac.toNumber(),
      kind: frac.isInteger() ? "integer" : "rational",
    };
  }

  function classifyApprox(value) {
    const rounded = Math.abs(value - Math.round(value)) < 1e-9;
    return {
      exact: null,
      approx: value,
      kind: rounded ? "integer" : "irrational",
    };
  }

  App.QuadraticSolver = { solve: solveQuadratic };
})(window.App = window.App || {});
