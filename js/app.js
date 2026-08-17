/* ============================================================
   App — نقطهٔ ورود؛ سیم‌کشی همهٔ اجزا
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;
  const QUESTION_KEY = "doryar.question.v1";

  const AppController = {
    els: {},
    builder: null,

    boot() {
      App.Settings.load();

      /* پس‌زمینه */
      const glyphs = U.el("div.bg-glyphs", { aria: { hidden: "true" } });
      ["Σ", "∫", "π", "Δ", "√"].forEach((g) => glyphs.appendChild(U.el("span", { text: g })));
      document.body.prepend(glyphs);
      document.body.prepend(U.el("div.bg-scene", { aria: { hidden: "true" } }));

      this.els.header = U.qs("#app-header");
      this.els.home = U.qs("#home-view");
      this.els.lesson = U.qs("#lesson-view");
      this.els.footer = U.qs("#app-footer");

      App.Components.Header.render(this.els.header);

      /* بارگذاری آخرین سؤال یا پیش‌فرض */
      const saved = this.loadQuestion();
      const def = App.Data.arithmeticSum.defaults;
      const values = saved || { a1: def.a1, d: def.d, target: def.target };

      this.renderHome(values, saved);

      this.els.footer.appendChild(U.el("div.footer-divider"));
      this.els.footer.appendChild(
        U.el("p", {
          html: "درس‌یار ریاضی — همهٔ محاسبات این درس به‌صورت زنده و دقیق انجام می‌شود؛ هیچ پاسخی از پیش نوشته نشده است.",
        })
      );

      /* نماها */
      this.els.lesson.hidden = true;
    },

    /* ---------- صفحهٔ اصلی ---------- */

    renderHome(values, hadSaved) {
      const self = this;
      this.els.home.innerHTML = "";

      const heroMount = U.el("div");
      const builderMount = U.el("div.panel-section.glass", { style: { marginTop: "26px" } });

      this.els.home.appendChild(heroMount);
      this.els.home.appendChild(builderMount);

      const paramsForRender = { a1: values.a1, d: values.d, target: values.target };

      const renderQuestionCard = (onStart) => {
        let question = { sequence: "۲ ، ۷ ، ۱۲", target: "۸۷" };
        try {
          const probe = App.MathEngine.solveArithmeticSum({
            a1: values.a1 || "2", d: values.d || "5", target: values.target || "87",
          });
          question = App.Data.arithmeticSum.buildQuestion(probe.input);
        } catch (e) {
          question = { sequence: U.fa(values.a1 || "2") + " ، " + U.fa((Number(values.a1) || 2) + (Number(values.d) || 5)) + " ، " + U.fa((Number(values.a1) || 2) + 2 * (Number(values.d) || 5)), target: U.fa(values.target || "87") };
        }

        const resumeStep = App.LessonEngine.loadPersistedStep(self.currentRawParams());

        App.Components.Hero.render(heroMount, {
          question,
          onStart: (startAt) => onStart(startAt),
          resumeStep,
        });
      };

      /* پنل ساخت سؤال */
      this.builder = App.Components.BuilderPanel.create({
        values: {
          a1: values.a1, d: values.d, target: values.target,
          sequence: values.sequence || "",
        },
        onSubmit: (params) => self.handleSolve(params, { fromHome: true, builder: self.builder }),
      });
      builderMount.appendChild(this.builder.el);

      renderQuestionCard((startAt) => self.handleSolve(paramsForRender, { fromHome: true, startAt }));
    },

    currentRawParams() {
      const saved = this.loadQuestion();
      const def = App.Data.arithmeticSum.defaults;
      return saved || { a1: def.a1, d: def.d, target: def.target };
    },

    /* ---------- حل و شروع درس ---------- */

    handleSolve(params, opts) {
      opts = opts || {};
      try {
        let solution;
        if (params.sequence) {
          solution = App.MathEngine.solveFromSequence({ sequence: params.sequence, target: params.target });
          if (opts.builder) opts.builder.showSequenceOk(solution.input.a1, solution.input.d);
        } else {
          solution = App.MathEngine.solveArithmeticSum(params);
        }

        this.saveQuestion(params);
        App.State.set({
          phase: "lesson",
          solution,
          question: { raw: params, display: App.Data.arithmeticSum.buildQuestion(solution.input) },
        });

        this.showLesson(solution, opts.startAt || 0, opts);
        if (App.Components.Drawer.isOpen()) App.Components.Drawer.close();
      } catch (err) {
        if (err && err.code) {
          const title =
            err.code === "not-arithmetic" ? "این دنباله حسابی نیست"
            : err.code === "empty" ? "فیلد خالی"
            : err.code === "bad-number" ? "عدد نامعتبر"
            : err.code === "too-large" ? "عدد خیلی بزرگ"
            : err.code === "too-few" ? "جمله‌های کم"
            : err.code === "too-many" ? "جمله‌های زیاد"
            : "خطای ورودی";
          if (opts.builder) opts.builder.notice("error", title, err.message);
          else App.Components.Toast.show(err.message, "error");
          App.Sound.play("error");
        } else {
          console.error(err);
          App.Components.Toast.show("خطای غیرمنتظره‌ای رخ داد.", "error");
        }
      }
    },

    showLesson(solution, startAt, opts) {
      const self = this;
      this.els.home.hidden = true;
      this.els.lesson.hidden = false;
      this.els.lesson.innerHTML = "";

      /* نوار خلاصهٔ سؤال جاری */
      const ctxChips = U.el("div.ctx-chips", {}, [
        U.el("span.chip", { html: U.icons.sigma + "<span>" + U.rich("a₁ = " + solution.input.a1.toFa()) + "</span>" }),
        U.el("span.chip", { html: U.icons.swap + "<span>" + U.rich("d = " + solution.input.d.toFa()) + "</span>" }),
        U.el("span.chip.chip--gold", { html: U.icons.target + "<span>" + U.rich("Sₙ = " + solution.input.target.toFa()) + "</span>" }),
      ]);

      const changeBtn = U.el("button.btn.btn--ghost", {
        type: "button",
        html: U.icons.pencil + "<span>تغییر سؤال</span>",
        onClick: () => self.openChangeDrawer(),
      });

      const homeBtn = U.el("button.icon-btn", {
        type: "button",
        html: U.icons.arrowLeft,
        "aria-label": "بازگشت به صفحهٔ سؤال",
        title: "بازگشت به سؤال",
        onClick: () => {
          if (self.builder) self.builder.clearNotice();
          App.State.set({ phase: "home" });
          self.els.lesson.hidden = true;
          /* صفحهٔ اصلی را تازه بساز تا کارت سؤال و دکمهٔ «ادامه» به‌روز باشند */
          const saved = self.currentRawParams();
          const def = App.Data.arithmeticSum.defaults;
          self.renderHome(saved || { a1: def.a1, d: def.d, target: def.target }, saved);
          self.els.home.hidden = false;
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
      });

      const contextBar = U.el("div.lesson-context", {}, [
        ctxChips,
        U.el("div.row", {}, [homeBtn, changeBtn]),
      ]);

      const progressMount = U.el("div");
      const stage = U.el("div.lesson-stage", { aria: { live: "polite" } });
      const controlsMount = U.el("div");

      const lessonEl = U.el("section.lesson.container", {}, [
        contextBar,
        progressMount,
        stage,
        controlsMount,
      ]);
      this.els.lesson.appendChild(lessonEl);

      if (!App.LessonEngine.view) {
        App.LessonEngine.mount({ progressMount, stageEl: stage, controlsMount });
      } else {
        /* نصب مجدد روی نماها (progress/controls در DOM جدید) */
        App.LessonEngine.view.progressMount = progressMount;
        App.LessonEngine.view.stageEl = stage;
        App.LessonEngine.view.controlsMount = controlsMount;
        progressMount.appendChild(App.LessonEngine.progressApi.el);
        controlsMount.appendChild(App.LessonEngine.controlsApi.el);
      }

      App.LessonEngine.start(solution, { startAt });
      window.scrollTo({ top: 0, behavior: "auto" });
    },

    openChangeDrawer() {
      const self = this;
      const saved = this.loadQuestion();
      const def = App.Data.arithmeticSum.defaults;
      const builder = App.Components.BuilderPanel.create({
        values: {
          a1: saved ? saved.a1 : def.a1,
          d: saved ? saved.d : def.d,
          target: saved ? saved.target : def.target,
          sequence: saved && saved.sequence ? saved.sequence : "",
        },
        onSubmit: (params) => self.handleSolve(params, { builder }),
      });
      App.Components.Drawer.open({ title: "تغییر سؤال", content: builder.el });
    },

    /* ---------- LocalStorage ---------- */

    saveQuestion(params) {
      try {
        localStorage.setItem(QUESTION_KEY, JSON.stringify(params));
      } catch (e) { /* بی‌صدا */ }
    },

    loadQuestion() {
      try {
        const raw = localStorage.getItem(QUESTION_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (!data || (!data.a1 && !data.sequence)) return null;
        return data;
      } catch (e) {
        return null;
      }
    },
  };

  /* ---------- اجرا ---------- */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => AppController.boot());
  } else {
    AppController.boot();
  }

  App.Controller = AppController;
})(window.App = window.App || {});
