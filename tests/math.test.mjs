/* ============================================================
   تست موتور ریاضی — اجرا:  node tests/math.test.mjs
   بدون وابستگی خارجی؛ مستقل از DOM
   ============================================================ */

import fs from "fs";
import path from "path";
import url from "url";

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
globalThis.window = globalThis;
globalThis.document = {
  addEventListener() {},
  createElement: () => ({ style: {}, setAttribute() {}, appendChild() {}, querySelector: () => null }),
};

const files = [
  "js/utils.js",
  "js/math/fraction.js",
  "js/math/sequence.js",
  "js/math/quadratic.js",
  "js/math-engine.js",
];
for (const f of files) {
  eval(fs.readFileSync(path.join(root, f), "utf8"));
}
const App = globalThis.App;

let pass = 0;
let fail = 0;
const eq = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++;
  else {
    fail++;
    console.log("FAIL:", name, "| got:", got, "| want:", want);
  }
};

/* --- سؤال اصلی درس: باید دقیقاً n = ۶ شود --- */
const sol = App.MathEngine.solveArithmeticSum({ a1: "2", d: "5", target: "87" });
eq("default n", sol.chosen.n.toString(), "6");
eq("default delta", sol.quadratic.delta.toString(), "3481");
eq("default sqrt-delta", sol.quadratic.deltaRoot.exact.toString(), "59");
eq("default terms", sol.chosen.terms.map((t) => t.toString()), ["2", "7", "12", "17", "22", "27"]);
eq("default sum", sol.chosen.actualSum.toString(), "87");
eq("default verified", sol.chosen.verified, true);
eq("default status", sol.status, "success");
eq("coefficients a,b,c", [sol.equation.a.toString(), sol.equation.b.toString(), sol.equation.c.toString()], ["5", "-1", "-174"]);
eq("roots", sol.quadratic.roots.map((r) => (r.exact ? r.exact.toString() : r.approx)), ["6", "-29/5"]);

/* --- حالت‌های خاص --- */
eq("non-integer (3,4,90)", App.MathEngine.solveArithmeticSum({ a1: "3", d: "4", target: "90" }).status, "non-integer");
eq("no-real (Δ<0)", App.MathEngine.solveArithmeticSum({ a1: "1", d: "1", target: "-1" }).status, "no-real");
eq("linear d=0 → n=50", App.MathEngine.solveArithmeticSum({ a1: "2", d: "0", target: "100" }).chosen.n.toString(), "50");
eq("linear d=0 non-integer", App.MathEngine.solveArithmeticSum({ a1: "2", d: "0", target: "99" }).status, "non-integer");
eq("two valid roots → smallest", App.MathEngine.solveArithmeticSum({ a1: "5", d: "-2", target: "5" }).chosen.n.toString(), "1");
eq("decimal input", typeof App.MathEngine.solveArithmeticSum({ a1: "1.5", d: "2.5", target: "20" }).status, "string");

/* --- ورود مستقیم دنباله --- */
eq("sequence input n=6", App.MathEngine.solveFromSequence({ sequence: "۲، ۷، ۱۲", target: "87" }).chosen.n.toString(), "6");
try {
  App.MathEngine.solveFromSequence({ sequence: "2, 7, 11", target: "87" });
  fail++;
  console.log("FAIL: not-arithmetic should throw");
} catch (e) {
  pass++;
  eq("error code", e.code, "not-arithmetic");
}

/* --- اعتبارسنجی ورودی --- */
for (const [params, code] of [
  [{ a1: "", d: "5", target: "87" }, null],
  [{ a1: "x", d: "5", target: "87" }, null],
  [{ a1: "0", d: "0", target: "87" }, null],
]) {
  try {
    App.MathEngine.solveArithmeticSum(params);
    fail++;
    console.log("FAIL: should throw for", params);
  } catch (e) {
    pass++;
    if (code) eq("code " + params.a1, e.code, code);
  }
}

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
