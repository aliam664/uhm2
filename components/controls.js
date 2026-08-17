/* ============================================================
   Controls — نوار کنترل درس: قبل/بعد، پخش، توقف، شروع دوباره
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;

  /**
   * Controls.render(engine) → { el, update(state) }
   * state: { index, total, playing }
   */
  function render(engine) {
    const prevBtn = U.el("button.btn", {
      type: "button",
      html: U.icons.prev + "<span class='btn-label'>مرحلهٔ قبل</span>",
      "aria-label": "مرحلهٔ قبل",
      onClick: () => engine.prev(),
    });

    const playBtn = U.el("button.btn", {
      type: "button",
      html: U.icons.play + "<span class='btn-label'>پخش خودکار</span>",
      "aria-label": "پخش خودکار مراحل",
      "aria-pressed": "false",
      onClick: () => engine.togglePlay(),
    });

    const nextBtn = U.el("button.btn.btn--primary", {
      type: "button",
      html: "<span class='btn-label'>مرحلهٔ بعد</span>" + U.icons.next,
      "aria-label": "مرحلهٔ بعد",
      onClick: () => engine.next(),
    });

    const restartBtn = U.el("button.icon-btn", {
      type: "button",
      html: U.icons.restart,
      "aria-label": "شروع دوبارهٔ حل",
      title: "شروع دوباره",
      onClick: () => engine.restart(),
    });
    restartBtn.addEventListener("click", () => {
      restartBtn.classList.remove("spin-once");
      void restartBtn.offsetWidth;
      restartBtn.classList.add("spin-once");
    });

    const bar = U.el("div.lesson-controls", { role: "toolbar", aria: { label: "کنترل‌های درس" } }, [
      prevBtn,
      U.el("span.divider-v"),
      playBtn,
      restartBtn,
      U.el("span.divider-v"),
      nextBtn,
    ]);

    const hint = U.el("p.ctl-hint", {
      html: "با کلیدهای <kbd>→</kbd> و <kbd>←</kbd> هم می‌توانید بین مراحل جابه‌جا شوید",
    });

    const el = U.el("div.stack.stack-sm", { style: { alignItems: "center" } }, [bar, hint]);

    function update(state) {
      prevBtn.disabled = state.index <= 0;
      nextBtn.disabled = state.index >= state.total - 1 && !state.allowWrap;
      const playing = state.playing;
      playBtn.innerHTML =
        (playing ? U.icons.pause : U.icons.play) +
        "<span class='btn-label'>" + (playing ? "توقف" : "پخش خودکار") + "</span>";
      playBtn.setAttribute("aria-pressed", playing ? "true" : "false");
      playBtn.classList.toggle("btn--gold", playing);
    }

    return { el, update };
  }

  App.Components = App.Components || {};
  App.Components.Controls = { render };
})(window.App = window.App || {});
