/* ============================================================
   Fraction — حساب کسری دقیق (مخرج/صورت صحیح)
   محاسبات ریاضی نباید خطای اعشاری داشته باشد.
   ============================================================ */

(function (App) {
  "use strict";

  const ABS_LIMIT = 4503599627370496; // 2^52 — سقف امن اعداد صحیح

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) { [a, b] = [b, a % b]; }
    return a || 1;
  }

  function isInt(x) { return typeof x === "number" && isFinite(x) && Math.round(x) === x; }

  class Fraction {
    constructor(num, den) {
      if (den === undefined) den = 1;
      if (!isInt(num) || !isInt(den)) {
        throw new Error("Fraction: اعداد صحیح لازم است");
      }
      if (den === 0) throw new Error("Fraction: تقسیم بر صفر");
      if (den < 0) { num = -num; den = -den; }
      const g = gcd(num, den);
      this.n = num / g;
      this.d = den / g;
    }

    /* ---- سازنده‌ها ---- */

    /** از عدد یا کسر موجود */
    static from(x) {
      if (x instanceof Fraction) return x;
      if (isInt(x)) return new Fraction(x, 1);
      if (typeof x === "number" && isFinite(x)) return Fraction.fromString(String(x));
      throw new Error("Fraction.from: ورودی نامعتبر");
    }

    /** از رشتهٔ اعشاری دقیق: "2" | "-1.75" | "5/2" */
    static fromString(s) {
      s = String(s).trim();
      const slash = /^(-?\d+)\/(-?\d+)$/.exec(s);
      if (slash) return new Fraction(Number(slash[1]), Number(slash[2]));
      const m = /^(-?)(\d*)(?:\.(\d*))?$/.exec(s);
      if (!m || (m[2] === "" && (m[3] === undefined || m[3] === ""))) {
        throw new Error("Fraction.fromString: قالب نامعتبر — " + s);
      }
      const sign = m[1] === "-" ? -1 : 1;
      const intPart = m[2];
      const fracPart = m[3] || "";
      if ((intPart + fracPart).length > 15) {
        // برای دقت کافی، رقم‌های خیلی طولانی را نمی‌پذیریم
        throw new Error("Fraction.fromString: عدد بیش از حد طولانی");
      }
      const den = Math.pow(10, fracPart.length);
      const num = Number((intPart || "0") + fracPart);
      return new Fraction(sign * num, den);
    }

    /* ---- عملیات ---- */

    add(o) { o = Fraction.from(o); return new Fraction(this.n * o.d + o.n * this.d, this.d * o.d); }
    sub(o) { o = Fraction.from(o); return new Fraction(this.n * o.d - o.n * this.d, this.d * o.d); }
    mul(o) { o = Fraction.from(o); return new Fraction(this.n * o.n, this.d * o.d); }
    div(o) { o = Fraction.from(o); if (o.n === 0) throw new Error("تقسیم بر صفر"); return new Fraction(this.n * o.d, this.d * o.n); }
    neg() { return new Fraction(-this.n, this.d); }
    pow(k) {
      if (!isInt(k) || k < 0) throw new Error("توان صحیح نامنفی لازم است");
      return new Fraction(Math.pow(this.n, k), Math.pow(this.d, k));
    }
    abs() { return new Fraction(Math.abs(this.n), this.d); }

    /* ---- مقایسه ---- */

    cmp(o) { o = Fraction.from(o); return this.n * o.d - o.n * this.d; }
    isZero() { return this.n === 0; }
    isPositive() { return this.n > 0; }
    isNegative() { return this.n < 0; }
    isInteger() { return this.d === 1; }
    eq(o) { o = Fraction.from(o); return this.n === o.n && this.d === o.d; }

    /* ---- نمایش ---- */

    /** عدد اعشاری (تقریبی) */
    toNumber() { return this.n / this.d; }

    /** رشتهٔ لاتین: "5" یا "7/2" یا "-3/8" */
    toString() { return this.d === 1 ? String(this.n) : this.n + "/" + this.d; }

    /** رشتهٔ فارسی: «۵» یا «۷/۲» (برای متن UI) */
    toFa() { return App.Utils.fa(this.toString()); }

    /** مقدار اعشاری گردشدهٔ فارسی، مثل «−۵٫۸» */
    toFaApprox(digits) {
      const v = this.toNumber();
      return App.Utils.fa(Number(v.toFixed(digits == null ? 2 : digits)).toString());
    }
  }

  /** آزمون مربع کامل برای اعداد صحیح نامنفی */
  Fraction.isPerfectSquareInt = function (x) {
    if (!isInt(x) || x < 0) return false;
    const r = Math.round(Math.sqrt(x));
    return r * r === x;
  };

  /** جذر صحیحِ مربع کامل، وگرنه null */
  Fraction.intSqrt = function (x) {
    return Fraction.isPerfectSquareInt(x) ? Math.round(Math.sqrt(x)) : null;
  };

  Fraction.ABS_LIMIT = ABS_LIMIT;

  App.Fraction = Fraction;
})(window.App = window.App || {});
