/* ============================================================
   درس ۱ — مجموع چند جملهٔ اول دنبالهٔ حسابی (Data-Driven)
   داده‌های درس از موتور نمایش جدا هستند؛ Lesson Engine بر
   اساس این داده و جواب MathEngine صحنه‌ها را می‌سازد.
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;

  const definition = {
    id: "arithmetic-sum",

    /** مقادیر پیش‌فرض سؤال */
    defaults: {
      a1: "2",
      d: "5",
      target: "87",
    },

    /** عنوان و زیرعنوان صفحهٔ اصلی */
    hero: {
      title: "حل تعاملی دنبالهٔ حسابی",
      subtitle: "از سؤال تا جواب، مرحله‌به‌مرحله",
    },

    /** ساخت متن سؤال از پارامترها (Fraction) */
    buildQuestion(input) {
      const a2 = input.a1.add(input.d);
      const terms = [input.a1, a2, a2.add(input.d)];
      return {
        sequence: terms.map((t) => U.fa(t.toString())).join(" ، "),
        target: U.fa(input.target.toString()),
      };
    },

    /** متن کامل سؤال به‌صورت ساده برای aria */
    questionAria(q) {
      return "مجموع چند جملهٔ اول دنبالهٔ حسابی " + q.sequence + " برابر " + q.target + " می‌شود؟";
    },

    /** صحنه‌های درس — توسط LessonEngine به ترتیب اجرا می‌شوند */
    scenes: "auto", // LessonEngine از App.Scenes کش می‌کند
  };

  App.Data.arithmeticSum = definition;
  const lesson = App.Data.getLesson("arithmetic-sum");
  if (lesson) lesson.definition = definition;
})(window.App = window.App || {});
