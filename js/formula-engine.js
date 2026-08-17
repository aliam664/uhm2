/* ============================================================
   FormulaEngine — تولید LaTeX از روی جواب موتور ریاضی
   ارقام به‌صورت ASCII نوشته می‌شوند و فونت Vazirmatn FD
   آن‌ها را خودکار با نشان‌های فارسی رندر می‌کند.
   ============================================================ */

(function (App) {
  "use strict";

  const Fraction = App.Fraction;
  const F = {};

  /* ---------- رندر KaTeX ---------- */

  const KATEX_OPTS = {
    throwOnError: false,
    strict: false,
    trust: true,
    displayMode: true,
    output: "html",
  };

  F.render = function (el, latex) {
    try {
      katex.render(latex, el, KATEX_OPTS);
    } catch (e) {
      el.textContent = latex;
      console.warn("KaTeX:", e);
    }
    return el;
  };

  /* ---------- سازنده‌های پایه ---------- */

  /** عدد/کسر → لاتک؛ کسر به شکل \frac با علامت بیرون */
  function numLatex(f) {
    f = Fraction.from(f);
    if (f.d === 1) return String(f.n);
    const sign = f.isNegative() ? "-" : "";
    return sign + "\\frac{" + Math.abs(f.n) + "}{" + f.d + "}";
  }
  F.num = numLatex;

  /** عدد داخل پرانتز: (2) یا (-5) یا \left(\frac{7}{2}\right) */
  F.paren = function (f) {
    f = Fraction.from(f);
    if (f.d === 1) return "(" + f.n + ")";
    return "\\left(" + numLatex(f) + "\\right)";
  };

  /** جملهٔ چندجمله‌ای: coef·symbol با حذف ۱ و تاشدگی علامت */
  function termLatex(coef, sym) {
    coef = Fraction.from(coef);
    if (coef.isZero()) return "";
    const mag = coef.abs();
    const numPart = sym && mag.eq(1) ? "" : numLatex(mag);
    return (coef.isNegative() ? "-" : "") + numPart + (sym || "");
  }

  /** چندجمله‌ای an² + bn + c — علامت‌ها تاشده، جمله‌های صفر حذف */
  function polyLatex(a, b, c, sym) {
    const pieces = [];
    const terms = [
      { coef: a, s: sym ? sym + "^2" : "" },
      { coef: b, s: sym || "" },
      { coef: c, s: "" },
    ];
    terms.forEach((t, i) => {
      if (Fraction.from(t.coef).isZero()) return;
      const body = termLatex(t.coef.abs(), t.s);
      const sign = Fraction.from(t.coef).isNegative() ? "-" : "+";
      if (pieces.length === 0) pieces.push((sign === "-" ? "-" : "") + body);
      else pieces.push(sign + " " + body);
    });
    return pieces.join(" ") || "0";
  }
  F.poly = polyLatex;

  /** مقدار ریشه برای نمایش: صحیح، اعشاری، کسر یا تقریبی */
  function rootLatex(root) {
    if (root.exact && root.exact.isInteger()) return String(root.exact.n);
    if (root.exact) {
      const d = root.exact.d;
      // مخرجِ تنها از ۲ و ۵ → اعشاری پایا
      let dd = d;
      while (dd % 2 === 0) dd /= 2;
      while (dd % 5 === 0) dd /= 5;
      if (dd === 1) {
        const v = root.exact.toNumber();
        return trimDecimal(v.toFixed(6));
      }
      return numLatex(root.exact);
    }
    return "\\approx " + trimDecimal(root.approx.toFixed(2));
  }
  F.root = rootLatex;

  function trimDecimal(s) {
    if (s.indexOf(".") === -1) return s;
    s = s.replace(/0+$/, "").replace(/\.$/, "");
    return s === "-0" ? "0" : s;
  }
  F.trimDecimal = trimDecimal;

  /* ============================================================
     زنجیرهٔ مراحل — هر صحنه ردیف‌های فرمول خود را می‌گیرد
     ============================================================ */

  /**
   * شکل ساده‌شدهٔ داخل کمان: d·n + (2a₁−d)
   * مثال: 5n - 1
   */
  F.innerExpanded = function (sol) {
    const { lin, k } = sol.inner;
    const parts = [];
    if (!lin.isZero()) parts.push(termLatex(lin, "n"));
    if (!k.isZero() || parts.length === 0) parts.push((k.isNegative() ? "- " : parts.length ? "+ " : "") + numLatex(k.abs()));
    return parts.join(" ");
  };

  /* ---------- صحنهٔ ۱: اختلاف جمله‌ها ---------- */

  F.differenceEq = function (sol, i) {
    const t = sol.seqPreview;
    return numLatex(t[i + 1]) + " - " + numLatex(t[i]) + " = " + numLatex(sol.diffs[i]);
  };

  /* ---------- صحنهٔ ۲ و ۳ ---------- */

  F.firstTerm = (sol) => "a_1 = " + numLatex(sol.input.a1);

  F.commonDiff = function (sol) {
    const t = sol.seqPreview;
    return {
      symbol: "d = a_2 - a_1",
      substituted: "d = " + numLatex(t[1]) + " - " + numLatex(t[0]),
      result: "d = " + numLatex(sol.input.d),
    };
  };

  /* ---------- صحنهٔ ۴: ساخت تدریجی فرمول ---------- */

  F.formulaBuild = function () {
    return [
      { latex: "\\htmlClass{fx-hl--accent}{S_n}", note: "مجموع n جملهٔ اول — چیزی که می‌خواهیم" },
      { latex: "S_n = \\htmlClass{fx-hl--accent}{\\frac{n}{2}}", note: "n جمله را دو به دو جفت می‌کنیم؛ پس n/2 جفت داریم" },
      { latex: "S_n = \\frac{n}{2}\\,\\htmlClass{fx-hl--accent}{\\left[\\,2a_1\\,\\right]}", note: "جملهٔ اول و جملهٔ آخر — مجموع هر جفت" },
      {
        latex: "S_n = \\frac{n}{2}\\,\\left[\\,\\htmlClass{fx-hl--accent}{2a_1 + (n-1)d}\\,\\right]",
        note: "جملهٔ آخر از فرمول جملهٔ عمومی: aₙ = a₁ + (n−1)d",
      },
    ];
  };

  /* ---------- صحنهٔ ۵: جایگذاری ---------- */

  F.substitutionStates = function (sol) {
    const { a1, d, target } = sol.input;
    const inner = F.innerExpanded(sol);
    const twoA1 = "2" + F.paren(a1);
    const dParen = F.paren(d);
    const half = "\\frac{n}{2}";
    const br = (inner2) => "\\left[\\," + inner2 + "\\,\\right]";

    const states = [];

    states.push({
      latex: "S_n = " + half + br("2a_1 + (n-1)d"),
      note: "فرمول مجموع؛ حالا هر نماد را با مقدارش عوض می‌کنیم",
    });

    states.push({
      latex: "\\htmlClass{fx-hl}{" + numLatex(target) + "} = " + half + br("2a_1 + (n-1)d"),
      note: "مجموع داده‌شده جای Sₙ می‌نشیند",
      hl: "Sₙ",
    });

    states.push({
      latex: numLatex(target) + " = " + half + br("\\htmlClass{fx-hl}{" + twoA1 + "} + (n-1)d"),
      note: "جملهٔ اول: a₁ = " + a1.toFa(),
      hl: "a₁",
    });

    states.push({
      latex: numLatex(target) + " = " + half + br(twoA1 + " + (n-1)\\htmlClass{fx-hl}{" + dParen + "}"),
      note: "اختلاف مشترک: d = " + d.toFa(),
      hl: "d",
    });

    states.push({
      latex: numLatex(target) + " = " + half + br("\\htmlClass{fx-hl}{" + innerSubstituted(sol) + "}"),
      note: "دو در جملهٔ اول = " + a1.mul(2).toFa(),
    });

    states.push({
      latex: numLatex(target) + " = " + half + "\\,\\htmlClass{fx-hl--accent}{\\left(" + inner + "\\right)}",
      note: "باز کردن داخل کمان: " + innerToFa(sol),
    });

    return states;
  };

  /** نمایش فارزیِ داخل کمان برای یادداشت‌ها: 5n − 1 → «5n − 1» با اعداد فارسی */
  function innerToFa(sol) {
    return App.Utils.toFaDigits(F.innerExpanded(sol)).replace(/\*/g, "");
  }

  /** شکل ساده‌شدهٔ داخل کران پس از جایگذاری: 4 + 5(n−1) — با تاشدگی علامت */
  function innerSubstituted(sol) {
    const k = sol.input.a1.mul(2);
    const d = sol.input.d;
    let s = numLatex(k);
    if (!d.isZero()) {
      s += (d.isNegative() ? " - " : " + ") + (d.abs().eq(1) ? "" : numLatex(d.abs())) + "\\,(n-1)";
    }
    return s;
  }

  /* ---------- صحنهٔ ۶: ساخت معادله ---------- */

  F.equationStates = function (sol) {
    const { target } = sol.input;
    const { a, b, c } = sol.equation;
    const twoS = target.mul(2);
    const inner = F.innerExpanded(sol);
    const isLinear = a.isZero();

    const states = [];

    states.push({
      latex: numLatex(target) + " = \\frac{n}{2}\\left(" + inner + "\\right)",
      note: "از مرحلهٔ قبل",
    });

    states.push({
      latex: "\\htmlClass{fx-hl}{" + numLatex(twoS) + "} = n\\left(" + inner + "\\right)",
      op: "هر دو طرف را در ۲ ضرب می‌کنیم تا کسر حذف شود",
      note: "کسرِ n/2 برداشته شد",
    });

    states.push({
      latex: numLatex(twoS) + " = " + polyLatex(a, b, null, "n"),
      op: "پرانتز را باز می‌کنیم",
      note: isLinear ? "حاصل، معادله‌ای خطی است" : "حاصل، معادلهٔ درجهٔ دوم است",
    });

    states.push({
      latex: "\\htmlClass{fx-hl}{" + polyLatex(a, b, c, "n") + " = 0}",
      op: "همهٔ جمله‌ها را به یک طرف می‌بریم",
      note: "شکل استاندارد معادله",
    });

    return states;
  };

  /* ---------- صحنهٔ ۷: دلتا ---------- */

  F.deltaStates = function (sol) {
    const { a, b, c } = sol.equation;
    const q = sol.quadratic;
    const states = [];

    states.push({
      latex: "\\Delta = b^2 - 4ac",
      note: "مبیّن معادلهٔ درجهٔ دوم؛ تعداد جواب‌ها را تعیین می‌کند",
    });

    states.push({
      latex: "\\Delta = " + F.paren(b) + "^2 - 4" + F.paren(a) + F.paren(c),
      note: "جایگذاری a ، b و c از معادله",
    });

    if (sol.status === "no-real") {
      states.push({
        latex: "\\htmlClass{fx-hl}{\\Delta = " + numLatex(q.delta) + "}",
        note: "دلتا منفی است",
      });
      return states;
    }

    states.push({
      latex: "\\Delta = " + numLatex(b.mul(b)) + " + " + numLatex(a.mul(c).mul(-4)),
      note: "توان و ضرب‌ها را حساب می‌کنیم",
    });

    states.push({
      latex: "\\htmlClass{fx-hl}{\\Delta = " + numLatex(q.delta) + "}",
      note: "دلتا مثبت؛ یعنی دو جواب حقیقی داریم",
    });

    if (q.deltaRoot && q.deltaRoot.exact) {
      states.push({
        latex: "\\htmlClass{fx-hl}{\\sqrt{\\Delta} = " + numLatex(q.deltaRoot.exact) + "}",
        note: "دلتا مربع کامل است؛ جذرش عددی گویاست",
      });
    } else if (q.deltaRoot) {
      states.push({
        latex: "\\sqrt{\\Delta} \\approx " + trimDecimal(q.deltaRoot.approx.toFixed(2)),
        note: "دلتا مربع کامل نیست؛ از مقدار تقریبی استفاده می‌کنیم",
      });
    }

    return states;
  };

  /* ---------- صحنهٔ ۸: محاسبهٔ n ---------- */

  F.rootStates = function (sol) {
    const { a, b, c } = sol.equation;
    const q = sol.quadratic;
    const isLinear = q.kind === "linear";
    const negB = b.neg();
    const twoA = a.mul(2);
    const sqrtPart = q.deltaRoot && q.deltaRoot.exact ? numLatex(q.deltaRoot.exact) : "\\sqrt{\\Delta}";

    if (isLinear) {
      return {
        intro: [
          { latex: "n = \\frac{-c}{b}", note: "از معادلهٔ خطی bn + c = 0" },
          {
            latex: "n = \\frac{" + numLatex(c.neg()) + "}{" + numLatex(b) + "}",
            note: "جایگذاری b و c",
          },
        ],
        paths: q.roots.map((r) => ({
          root: r,
          sign: "+",
          formulas: ["n = \\htmlClass{fx-hl}{" + rootLatex(r) + "}"],
        })),
      };
    }

    const intro = [
      { latex: "n = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}", note: "فرمول کلی جواب معادلهٔ درجهٔ دوم" },
      {
        latex: "n = \\frac{" + numLatex(negB) + " \\pm " + sqrtPart + "}{" + numLatex(twoA) + "}",
        note: "جایگذاری b ، دلتا و a",
      },
    ];

    const paths = q.roots.map((r, i) => ({
      root: r,
      sign: i === 0 ? "+" : "-",
      formulas: [
        "n = \\frac{" + numLatex(negB) + " " + (i === 0 ? "+" : "-") + " " + sqrtPart + "}{" + numLatex(twoA) + "}",
        "n = " + "\\htmlClass{fx-hl}{" + rootLatex(r) + "}",
      ],
    }));

    return { intro, paths };
  };

  /* ---------- صحنهٔ ۹: بررسی ---------- */

  F.verification = function (sol) {
    const chosen = sol.chosen;
    if (!chosen) return null;
    const terms = chosen.terms.map((t) => numLatex(t));
    return {
      sumLatex: terms.join(" + ") + " = \\htmlClass{fx-hl}{" + numLatex(chosen.actualSum) + "}",
      formulaCheck:
        "S_{" + chosen.n + "} = \\frac{" + chosen.n + "}{2}\\left(" +
        numLatex(sol.input.a1.mul(2)) + " + " + chosen.n + " - 1)(" + numLatex(sol.input.d) + "\\right) = " +
        numLatex(chosen.actualSum),
    };
  };

  App.Formula = F;
})(window.App = window.App || {});
