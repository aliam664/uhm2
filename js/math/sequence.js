/* ============================================================
   Sequence — موتور دنبالهٔ حسابی
   ساختن، تجزیهٔ ورودی، تشخیص حسابی بودن
   ============================================================ */

(function (App) {
  "use strict";

  const Fraction = App.Fraction;
  const U = App.Utils;

  const SequenceEngine = {};

  class MathInputError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }
  SequenceEngine.MathInputError = MathInputError;

  /** ساخت جمله‌های دنبالهٔ حسابی از a₁ و d */
  SequenceEngine.buildTerms = function (a1, d, count) {
    a1 = Fraction.from(a1);
    d = Fraction.from(d);
    const terms = [];
    let cur = a1;
    for (let i = 0; i < count; i++) {
      terms.push(cur);
      cur = cur.add(d);
    }
    return terms;
  };

  /** مجموع n جملهٔ اول (دقیق) */
  SequenceEngine.sumOf = function (a1, d, n) {
    a1 = Fraction.from(a1);
    d = Fraction.from(d);
    n = Fraction.from(n);
    // S = n/2 (2a1 + (n-1) d)
    return n.div(2).mul(a1.mul(2).add(n.sub(1).mul(d)));
  };

  /**
   * تجزیهٔ ورودی دنبالهٔ کاربر: "2, 7, 12" یا «۲ ۷ ۱۲»
   * خروجی: آرایهٔ Fraction
   */
  SequenceEngine.parseInput = function (raw) {
    const s = U.toLatinDigits(String(raw))
      .replace(/[٫]/g, ".")
      .replace(/[،؛;\s]+/g, ",")
      .replace(/,+$/, "")
      .replace(/^,+/, "");
    if (!s) throw new MathInputError("empty", "دنباله را وارد کنید.");
    const parts = s.split(",").filter((p) => p !== "");
    if (parts.length < 2) {
      throw new MathInputError("too-few", "برای تشخیص دنبالهٔ حسابی، دست‌کم دو جمله لازم است.");
    }
    if (parts.length > 40) {
      throw new MathInputError("too-many", "حداکثر ۴۰ جمله می‌توانید وارد کنید.");
    }
    const terms = parts.map((p) => {
      let f;
      try {
        f = Fraction.fromString(p);
      } catch (e) {
        throw new MathInputError("bad-number", "«" + p.trim() + "» عدد معتبری نیست.");
      }
      if (Math.abs(f.n) > Fraction.ABS_LIMIT || f.d > 1e6) {
        throw new MathInputError("too-large", "عدد «" + p.trim() + "» بیش از حد بزرگ است.");
      }
      return f;
    });
    return terms;
  };

  /**
   * بررسی حسابی بودن دنباله
   * خروجی: { isArithmetic, diffs: Fraction[] } — diffs اختلاف جمله‌های متوالی
   */
  SequenceEngine.analyze = function (terms) {
    const diffs = [];
    for (let i = 1; i < terms.length; i++) diffs.push(terms[i].sub(terms[i - 1]));
    let isArithmetic = diffs.length > 0;
    for (let i = 1; i < diffs.length; i++) {
      if (!diffs[i].eq(diffs[0])) { isArithmetic = false; break; }
    }
    return { isArithmetic, diffs };
  };

  App.SequenceEngine = SequenceEngine;
})(window.App = window.App || {});
