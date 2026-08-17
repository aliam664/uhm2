/* ============================================================
   Progress — ریل پیشرفت ۹ مرحله‌ای با خط گرادیانی متحرک
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;

  /**
   * Progress.render(steps, { onJump }) → { el, update(currentIndex) }
   * steps: [{ short }] از LessonEngine
   */
  function render(steps, opts) {
    opts = opts || {};
    const total = steps.length;

    const rail = U.el("div.progress-rail");
    const line = U.el("div.progress-line", {}, [U.el("div.progress-line-fill")]);
    const nodes = [];

    steps.forEach((s, i) => {
      const dot = U.el("span.dot", { text: U.fa(String(i + 1).padStart(2, "0")) });
      const lbl = U.el("span.lbl", { text: s.short });
      const node = U.el("button.progress-node", {
        type: "button",
        "aria-label": "مرحلهٔ " + U.fa(i + 1) + ": " + s.title + (i === 0 ? "" : ""),
        onClick: () => opts.onJump && opts.onJump(i),
      }, [dot, lbl]);
      node.setAttribute("aria-current", "false");
      nodes.push({ node, dot });
      rail.appendChild(node);
    });

    const el = U.el("div.progress-wrap.glass", {}, [
      U.el("nav", { aria: { label: "پیشرفت درس" } }, [line, rail]),
    ]);

    function update(current) {
      nodes.forEach((n, i) => {
        n.node.classList.toggle("is-done", i < current);
        n.node.classList.toggle("is-current", i === current);
        n.node.setAttribute("aria-current", i === current ? "step" : "false");
        n.node.setAttribute(
          "aria-label",
          "مرحلهٔ " + U.fa(i + 1) + " از " + U.fa(total) + ": " + steps[i].title +
            (i < current ? " (تمام‌شده)" : i === current ? " (جاری)" : "")
        );
        if (i < current) n.dot.innerHTML = U.icons.check;
        else n.dot.textContent = U.fa(String(i + 1).padStart(2, "0"));
      });
      const fill = line.firstChild;
      const ratio = total <= 1 ? 1 : current / (total - 1);
      fill.style.setProperty("--fill", String(ratio));
    }

    update(0);
    return { el, update, nodes };
  }

  App.Components = App.Components || {};
  App.Components.Progress = { render };
})(window.App = window.App || {});
