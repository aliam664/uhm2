/* ============================================================
   Settings — تم، سرعت انیمیشن، صدا + ذخیره در LocalStorage
   ============================================================ */

(function (App) {
  "use strict";

  const KEY = "doryar.settings.v1";

  const SPEEDS = {
    slow: { factor: 1.6, label: "آرام" },
    normal: { factor: 1, label: "عادی" },
    fast: { factor: 0.55, label: "سریع" },
  };

  const DEFAULTS = {
    theme: "dark",
    speed: "normal",
    sound: false,
  };

  let current = { ...DEFAULTS };
  const mediaReduced =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : { matches: false, addEventListener() {} };

  /* ---------- بارگذاری ---------- */

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        current = {
          theme: saved.theme === "light" ? "light" : "dark",
          speed: SPEEDS[saved.speed] ? saved.speed : "normal",
          sound: !!saved.sound,
        };
      }
    } catch (e) { /* LocalStorage در دسترس نیست — پیش‌فرض‌ها */ }
    apply();
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch (e) { /* بی‌صدا */ }
  }

  function apply() {
    document.documentElement.setAttribute("data-theme", current.theme);
    document.body.classList.toggle("reduced-motion", isReduced());
    App.State.set({ settings: { ...current } }, true);
  }

  /* ---------- API ---------- */

  const Settings = {
    load,
    SPEEDS,
    all() { return { ...current }; },

    get theme() { return current.theme; },
    get speed() { return current.speed; },
    get sound() { return current.sound; },

    toggleTheme() {
      current.theme = current.theme === "dark" ? "light" : "dark";
      save();
      apply();
      App.State.emit("change:theme", current.theme);
      return current.theme;
    },

    setSpeed(speed) {
      if (!SPEEDS[speed]) return;
      current.speed = speed;
      save();
      App.State.emit("change:speed", speed);
    },

    toggleSound() {
      current.sound = !current.sound;
      save();
      App.State.emit("change:sound", current.sound);
      return current.sound;
    },

    /** ضریب سرعت انیمیشن‌ها */
    speedFactor() {
      const base = SPEEDS[current.speed].factor;
      return isReduced() ? base * 0.12 : base;
    },

    /** آیا کاربر حرکت کمتر را ترجیح می‌دهد؟ */
    isReduced() {
      return mediaReduced.matches;
    },
  };

  function isReduced() { return Settings.isReduced(); }

  mediaReduced.addEventListener("change", () => {
    document.body.classList.toggle("reduced-motion", isReduced());
  });

  App.Settings = Settings;
})(window.App = window.App || {});
