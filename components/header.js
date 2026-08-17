/* ============================================================
   Header — نوار بالای برنامه: برند، سرعت، صدا، تم
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;

  function render(mount) {
    const brand = U.el("a.brand", { href: "#main", aria: { label: "درس‌یار ریاضی — رفتن به محتوای اصلی" } }, [
      U.el("span.brand-mark", { html: "Σ", aria: { hidden: "true" } }),
      U.el("span", {}, [
        U.el("span.brand-name", { text: "درس‌یار ریاضی" }),
        U.el("span.brand-sub", { text: "پلتفرم آموزش تعاملی" }),
      ]),
    ]);

    /* --- کنترل سرعت --- */
    const speedBtns = Object.keys(App.Settings.SPEEDS).map((key) => {
      const meta = App.Settings.SPEEDS[key];
      const btn = U.el("button", {
        type: "button",
        text: meta.label,
        "aria-pressed": App.Settings.speed === key ? "true" : "false",
        onClick() {
          App.Settings.setSpeed(key);
          App.Sound.play("click");
          speedBtns.forEach((b) => b.setAttribute("aria-pressed", "false"));
          btn.setAttribute("aria-pressed", "true");
        },
      });
      return btn;
    });

    const speed = U.el("div.segmented", {
      role: "group",
      aria: { label: "سرعت انیمیشن" },
    });
    speedBtns.forEach((b) => speed.appendChild(b));

    /* --- صدا --- */
    const soundBtn = U.el("button.icon-btn", {
      type: "button",
      html: App.Settings.sound ? U.icons.soundOn : U.icons.soundOff,
      "aria-pressed": App.Settings.sound ? "true" : "false",
      "aria-label": "افکت‌های صوتی",
      title: "افکت‌های صوتی",
      onClick() {
        const on = App.Settings.toggleSound();
        soundBtn.innerHTML = on ? U.icons.soundOn : U.icons.soundOff;
        soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
        soundBtn.classList.toggle("is-active", on);
        if (on) App.Sound.play("success");
      },
    });
    if (App.Settings.sound) soundBtn.classList.add("is-active");

    /* --- تم --- */
    const themeBtn = U.el("button.icon-btn", {
      type: "button",
      html: App.Settings.theme === "dark" ? U.icons.sun : U.icons.moon,
      "aria-label": "تغییر تم روشن و تیره",
      title: "تم روشن / تیره",
      onClick() {
        const next = App.Settings.toggleTheme();
        themeBtn.innerHTML = next === "dark" ? U.icons.sun : U.icons.moon;
        gsap.fromTo(themeBtn, { rotate: -40, scale: 0.7 }, { rotate: 0, scale: 1, duration: 0.45, ease: "back.out(2)" });
        App.Sound.play("click");
      },
    });

    /* --- برچسب درس جاری (اشاره به توسعه‌پذیری پلتفرم) --- */
    const lessonChip = U.el("span.chip.chip--accent", {
      html: U.icons.book + "<span>درس ۱ از ۱</span>",
      title: "درس‌های بیشتر به‌زودی اضافه می‌شود",
    });

    const actions = U.el("div.header-actions", {}, [lessonChip, speed, soundBtn, themeBtn]);

    const bar = U.el("div.container", {}, [brand, actions]);
    mount.appendChild(bar);

    return { el: mount, themeBtn, soundBtn };
  }

  App.Components = App.Components || {};
  App.Components.Header = { render };
})(window.App = window.App || {});
