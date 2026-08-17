/* ============================================================
   StepCard — قاب هر مرحلهٔ درس
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;

  /**
   * stepCard({ num, total, title, lede, icon })
   * → { el, body, headRefs: { badge, icon, title, lede } }
   */
  function stepCard(opts) {
    const badge = U.el("span.badge-step", {
      html: U.icons.layers,
      text: " مرحلهٔ " + U.fa(opts.num) + " از " + U.fa(opts.total),
    });

    const icon = U.el("div.step-icon", { html: U.icons[opts.icon] || U.icons.sigma, aria: { hidden: "true" } });
    const title = U.el("h2.step-title", { text: opts.title });
    const lede = opts.lede ? U.el("p.step-lede", { text: opts.lede }) : null;

    const titles = U.el("div.step-titles", {}, [title, lede].filter(Boolean));
    const head = U.el("div.step-head", {}, [titles, icon]);

    const body = U.el("div.stack.stack-lg", { role: "list" });

    const el = U.el("section.step-card.glass.glass--strong", {
      aria: { labelledby: title.id || undefined },
    });
    // شناسهٔ یکتا برای aria
    const titleId = "step-title-" + opts.num;
    title.id = titleId;
    el.setAttribute("aria-labelledby", titleId);
    el.appendChild(badge);
    el.appendChild(head);
    el.appendChild(body);

    return {
      el,
      body,
      headRefs: { badge, icon, title, lede },
      addTo(child, role) {
        if (role) child.setAttribute("role", "listitem");
        body.appendChild(child);
        return child;
      },
    };
  }

  App.Components = App.Components || {};
  App.Components.StepCard = { create: stepCard };
})(window.App = window.App || {});
