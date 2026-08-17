/* ============================================================
   Lessons Registry — فهرست درس‌های پلتفرم
   معماری برای افزودن درس‌های آینده آماده است:
   هر درس یک شناسه، عنوان، مقادیر پیش‌فرض و سازندهٔ صحنه‌ها دارد.
   ============================================================ */

(function (App) {
  "use strict";

  App.Data = App.Data || {};

  App.Data.lessons = [
    {
      id: "arithmetic-sum",
      title: "مجموع جمله‌های دنبالهٔ حسابی",
      subtitle: "جبر — دنباله‌ها",
      level: "متوسطهٔ دوم",
      icon: "sigma",
      definition: null, // توسط data/lessons/arithmetic-sum.js پر می‌شود
    },
  ];

  App.Data.getLesson = function (id) {
    return App.Data.lessons.find((l) => l.id === id) || null;
  };
})(window.App = window.App || {});
