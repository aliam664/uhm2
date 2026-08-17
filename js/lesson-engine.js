/* ============================================================
   LessonEngine — اجرا و مدیریت صحنه‌های درس
   ترتیب، گذر مراحل، پخش خودکار، ذخیرهٔ پیشرفت
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;

  const AUTO_STEP_GAP = 1.7;   // ثانیهٔ مکث بین مراحل در پخش خودکار
  const STEP_KEYS = ["step1", "step2", "step3", "step4", "step5", "step6", "step7", "step8", "step9"];
  const PROGRESS_KEY = "doryar.progress.v1";

  const engine = {
    scenes: [],
    current: -1,
    playing: false,
    activeTl: null,
    autoTimer: null,
    view: null,
    solution: null,

    get steps() {
      return this.scenes.map((s) => ({ num: s.num, title: s.title, short: s.short }));
    },

    /* ---------- نصب روی صفحه ---------- */

    mount(view) {
      this.view = view;
      const self = this;
      this.scenes = STEP_KEYS.map((k) => App.Scenes[k]).filter(Boolean);

      this.progressApi = App.Components.Progress.render(this.steps, {
        onJump: (i) => self.goTo(i),
      });
      view.progressMount.appendChild(this.progressApi.el);

      this.controlsApi = App.Components.Controls.render({
        next: () => self.next(),
        prev: () => self.prev(),
        restart: () => self.restart(),
        togglePlay: () => self.togglePlay(),
      });
      view.controlsMount.appendChild(this.controlsApi.el);

      App.Navigation.init(this);
    },

    /* ---------- شروع درس ---------- */

    start(solution, opts) {
      this.solution = solution;
      this.playing = false;
      this.current = -1;
      this.clearAutoTimer();
      App.State.set({ playing: false });
      this.goTo(opts && opts.startAt ? opts.startAt : 0, { forceReplay: true });
    },

    /* ---------- گذر بین مراحل ---------- */

    goTo(index, opts) {
      opts = opts || {};
      if (!this.scenes.length) return;
      index = U.clamp(index, 0, this.scenes.length - 1);
      if (index === this.current && !opts.forceReplay) return;

      const goingBack = !opts.forceReplay && index <= this.current;
      this.clearAutoTimer();
      if (this.activeTl) {
        this.activeTl.kill();
        this.activeTl = null;
      }

      this.current = index;
      App.State.set({ stepIndex: index });
      this.persistStep(index);
      this.progressApi.update(index);
      this.updateControls();
      App.Sound.play("step");

      const scene = this.scenes[index];
      const ctx = {
        sol: this.solution,
        question: App.State.get("question"),
        total: this.scenes.length,
      };
      const stage = this.view.stageEl;
      const self = this;

      /* تعویض صحنه + ساخت تایم‌لاین */
      App.Animation.stageSwap(stage, function () {
        const built = scene.build(ctx);
        const inner = U.el("div.stage-inner");
        inner.appendChild(built.el);
        inner.__tl = built.tl;
        return inner;
      });

      gsap.delayedCall(App.Animation.d(0.3), () => {
        const inner = stage.querySelector(".stage-inner");
        if (!inner || !inner.__tl) return;
        const tl = inner.__tl;
        self.activeTl = tl;

        if (goingBack || opts.instant) {
          /* برگشت: نتیجهٔ نهایی بدون پخش دوباره */
          tl.progress(1);
          self.afterSceneDone(index);
        } else {
          tl.restart(true);
          tl.eventCallback("onComplete", () => self.afterSceneDone(index));
          self.scrollToStage();
        }
      });

      this.updateControls();
    },

    /* ---------- پخش خودکار ---------- */

    afterSceneDone(index) {
      if (this.current !== index || !this.playing) return;
      if (index < this.scenes.length - 1) {
        this.autoTimer = setTimeout(() => {
          if (this.playing) this.goTo(index + 1);
        }, App.Animation.d(AUTO_STEP_GAP) * 1000);
      } else {
        this.playing = false;
        App.State.set({ playing: false });
        this.updateControls();
      }
    },

    togglePlay() {
      this.playing = !this.playing;
      App.State.set({ playing: this.playing });
      this.updateControls();
      App.Sound.play("click");

      const tl = this.activeTl;
      if (this.playing) {
        if (tl && tl.paused() && tl.progress() < 1) {
          tl.play(); // ادامهٔ انیمیشن متوقف‌شده
        } else if (!tl || tl.progress() >= 1) {
          this.afterSceneDone(this.current);
        }
      } else {
        this.clearAutoTimer();
        if (tl && tl.progress() < 1 && !tl.paused()) tl.pause();
      }
    },

    next() {
      if (this.current < this.scenes.length - 1) this.goTo(this.current + 1);
    },

    prev() {
      if (this.current > 0) this.goTo(this.current - 1);
    },

    restart() {
      this.start(this.solution, { startAt: 0 });
    },

    clearAutoTimer() {
      if (this.autoTimer) {
        clearTimeout(this.autoTimer);
        this.autoTimer = null;
      }
    },

    updateControls() {
      if (!this.controlsApi) return;
      this.controlsApi.update({
        index: this.current,
        total: this.scenes.length,
        playing: this.playing,
      });
    },

    scrollToStage() {
      const stage = this.view.stageEl;
      const y = stage.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: y, behavior: App.Settings.isReduced() ? "auto" : "smooth" });
    },

    /* ---------- ذخیرهٔ پیشرفت ---------- */

    persistStep(index) {
      try {
        const q = App.State.get("question");
        if (!q) return;
        const raw = q.raw || q;
        localStorage.setItem(PROGRESS_KEY, JSON.stringify({ step: index, question: JSON.stringify(raw) }));
      } catch (e) { /* بی‌صدا */ }
    },

    loadPersistedStep(rawQuestion) {
      try {
        const data = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "null");
        if (!data) return 0;
        const savedQ = JSON.parse(data.question || "null");
        if (savedQ && rawQuestion && JSON.stringify(savedQ) === JSON.stringify(rawQuestion)) {
          return U.clamp(data.step || 0, 0, STEP_KEYS.length - 1);
        }
      } catch (e) { /* بی‌صدا */ }
      return 0;
    },
  };

  App.LessonEngine = engine;
})(window.App = window.App || {});
