/* ============================================================
   BuilderPanel — ساخت سؤال جدید + ورود مستقیم دنباله
   شامل اعتبارسنجی کامل و پیام‌های خطای دقیق
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;

  /**
   * BuilderPanel.create({ values, onSubmit(params), compact })
   * values: { a1, d, target, sequence } — رشته‌های خام
   * onSubmit: با { a1, d, target } یا { sequence, target } صدا می‌شود
   * → { el, getValues }
   */
  function create(opts) {
    opts = opts || {};
    const values = Object.assign(
      { a1: "", d: "", target: "", sequence: "" },
      opts.values || {}
    );
    let activeTab = "params";

    const el = U.el("div.builder-panel");
    const noticeZone = U.el("div.stack.stack-md");

    /* ---------- تب‌ها ---------- */

    const tabParams = U.el("button.tab", { type: "button", role: "tab", "aria-selected": "true", text: "ساخت سؤال جدید", onClick: () => switchTab("params") });
    const tabSeq = U.el("button.tab", { type: "button", role: "tab", "aria-selected": "false", text: "ورود مستقیم دنباله", onClick: () => switchTab("sequence") });
    const tabs = U.el("div.tabs", { role: "tablist", aria: { label: "روش تنظیم سؤال" } }, [tabParams, tabSeq]);

    /* ---------- فرم پارامترها ---------- */

    const inputA1 = numberField({ label: "جملهٔ اول", symbol: "a₁", value: values.a1, hint: "عدد اول دنباله" });
    const inputD = numberField({ label: "اختلاف مشترک", symbol: "d", value: values.d, hint: "فاصلهٔ جمله‌های متوالی" });
    const inputS = numberField({ label: "مجموع هدف", symbol: "Sₙ", value: values.target, hint: "مجموعی که باید به آن برسیم" });

    const paramsForm = U.el("div.builder-grid", {}, [inputA1.wrap, inputD.wrap, inputS.wrap]);

    /* ---------- فرم دنباله ---------- */

    const seqInput = U.el("input", {
      type: "text",
      value: values.sequence,
      placeholder: "2، 7، 12  یا  2 7 12",
      inputmode: "numeric",
      autocomplete: "off",
      aria: { label: "جمله‌های دنباله" },
      dir: "ltr",
    });
    const seqField = U.el("div.field", {}, [
      U.el("label", { text: "جمله‌های دنباله", for: seqInputId(seqInput) }),
      U.el("div.input-wrap", {}, [seqInput]),
      U.el("span.hint", { text: "دست‌کم دو جمله؛ با ویرگول یا فاصله جدا کنید" }),
    ]);

    const seqTargetInput = U.el("input", {
      type: "text",
      value: values.target,
      placeholder: "87",
      inputmode: "numeric",
      autocomplete: "off",
      aria: { label: "مجموع هدف" },
    });
    seqInput.id = "builder-seq-input";
    seqTargetInput.id = "builder-seq-target";
    const seqTargetField = U.el("div.field", {}, [
      U.el("label", { text: "مجموع هدف", for: "builder-seq-target" }),
      U.el("div.input-wrap", {}, [seqTargetInput]),
      U.el("span.hint", { text: "مجموعی که باید به آن برسیم" }),
    ]);

    const seqForm = U.el("div.builder-grid", { style: { gridTemplateColumns: "1.6fr 1fr" } }, [seqField, seqTargetField]);

    const formsWrap = U.el("div", {}, [paramsForm]);

    /* ---------- دکمه‌ها ---------- */

    const solveBtn = U.el("button.btn.btn--primary", {
      type: "button",
      html: U.icons.bolt + "<span>حل این سؤال</span>",
      onClick: submit,
    });

    const resetBtn = U.el("button.btn.btn--ghost", {
      type: "button",
      html: U.icons.restart + "<span>بازنشانی پیش‌فرض</span>",
      onClick: () => {
        const def = App.Data.arithmeticSum.defaults;
        inputA1.input.value = def.a1;
        inputD.input.value = def.d;
        inputS.input.value = def.target;
        seqInput.value = "";
        seqTargetInput.value = def.target;
        clearNotice();
        App.Sound.play("click");
      },
    });

    const actions = U.el("div.builder-actions", {}, [
      resetBtn,
      solveBtn,
    ]);

    /* ---------- ساختار نهایی ---------- */

    const head = U.el("div.panel-head", {}, [
      U.el("div.panel-title", { html: U.icons.sliders + "<span>ساخت سؤال جدید</span>" }),
      tabs,
    ]);

    el.appendChild(head);
    el.appendChild(formsWrap);
    el.appendChild(noticeZone);
    el.appendChild(actions);

    /* Enter → حل */
    [inputA1.input, inputD.input, inputS.input, seqInput, seqTargetInput].forEach((inp) =>
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") submit();
      })
    );

    /* ---------- رفتار ---------- */

    function switchTab(tab) {
      activeTab = tab;
      tabParams.setAttribute("aria-selected", tab === "params" ? "true" : "false");
      tabSeq.setAttribute("aria-selected", tab === "sequence" ? "true" : "false");
      formsWrap.innerHTML = "";
      formsWrap.appendChild(tab === "params" ? paramsForm : seqForm);
      movePill();
      App.Sound.play("click");
    }

    /* قرص متحرک تب */
    const pill = U.el("span.tab-pill");
    tabs.appendChild(pill);
    requestAnimationFrame(movePill);
    window.addEventListener("resize", movePill);

    function movePill() {
      const active = activeTab === "params" ? tabParams : tabSeq;
      const t = active.offsetLeft;
      const w = active.offsetWidth;
      pill.style.insetInlineStart = "auto";
      pill.style.left = t + "px";
      pill.style.width = w + "px";
    }

    function notice(kind, title, message) {
      clearNotice();
      const cls = kind === "error" ? "notice--error" : kind === "success" ? "notice--success" : "notice--info";
      const icon = kind === "error" ? U.icons.error : kind === "success" ? U.icons.checkCircle : U.icons.info;
      const box = U.el("div.notice." + cls, {
        html: icon + '<div class="notice-body"><div class="notice-title">' + U.escapeHtml(title) + "</div><div>" + U.escapeHtml(message) + "</div></div>",
      });
      noticeZone.appendChild(box);
      gsap.fromTo(box, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" });
      return box;
    }

    function clearNotice() {
      noticeZone.innerHTML = "";
    }

    function getValues() {
      return {
        a1: inputA1.input.value.trim(),
        d: inputD.input.value.trim(),
        target: inputS.input.value.trim(),
        sequence: seqInput.value.trim(),
        seqTarget: seqTargetInput.value.trim(),
        tab: activeTab,
      };
    }

    function submit() {
      clearNotice();
      const v = getValues();
      App.Sound.play("click");

      if (activeTab === "params") {
        // اعتبارسنجی سه فیلد
        const checks = [
          [v.a1, "جملهٔ اول"],
          [v.d, "اختلاف مشترک"],
          [v.target, "مجموع هدف"],
        ];
        for (const [raw, name] of checks) {
          if (!raw) return fail("فیلد خالی", "مقدار «" + name + "» را وارد کنید.");
          const p = U.parseNumber(raw);
          if (!p.ok) return fail("عدد نامعتبر", "مقدار «" + name + "» باید فقط عدد باشد؛ مثلاً ۲ یا 7.5-");
          if (Math.abs(p.value) > 1e9) return fail("عدد خیلی بزرگ", "مقدار «" + name + "» باید کوچک‌تر از یک میلیارد باشد.");
        }
        opts.onSubmit({ a1: v.a1, d: v.d, target: v.target });
      } else {
        if (!v.sequence) return fail("دنباله خالی", "جمله‌های دنباله را وارد کنید؛ مثلاً 2، 7، 12");
        const target = v.seqTarget || v.target;
        if (!target) return fail("فیلد خالی", "«مجموع هدف» را وارد کنید.");
        const p = U.parseNumber(target);
        if (!p.ok) return fail("عدد نامعتبر", "«مجموع هدف» باید فقط عدد باشد.");
        if (Math.abs(p.value) > 1e9) return fail("عدد خیلی بزرگ", "«مجموع هدف» باید کوچک‌تر از یک میلیارد باشد.");
        opts.onSubmit({ sequence: v.sequence, target });
      }

      function fail(title, msg) {
        notice("error", title, msg);
        App.Sound.play("error");
        return false;
      }
    }

    /* نمایش نتیجهٔ تحلیل دنباله (وقتی حسابی است) */
    function showSequenceOk(a1, d) {
      notice(
        "success",
        "دنبالهٔ حسابی شناسایی شد",
        "جملهٔ اول " + a1.toFa() + " و اختلاف مشترک " + d.toFa() + " است. حالا حل می‌کنیم…"
      );
    }

    return { el, getValues, showSequenceOk, notice, clearNotice };
  }

  /* ---------- فیلد عددی با دکمهٔ ± ---------- */

  function numberField(o) {
    const input = U.el("input", {
      type: "text",
      value: o.value,
      placeholder: "0",
      inputmode: "numeric",
      autocomplete: "off",
      aria: { label: o.label },
    });
    input.id = "builder-field-" + o.symbol.replace(/[^a-zA-Z0-9]/g, "");

    const down = U.el("button", { type: "button", html: App.Utils.icons.minus, "aria-label": o.label + " — کم کردن", onClick: () => step(-1) });
    const up = U.el("button", { type: "button", html: App.Utils.icons.plus, "aria-label": o.label + " — زیاد کردن", onClick: () => step(1) });
    const stepper = U.el("div.stepper", {}, [up, down]);

    const wrap = U.el("div.field", {}, [
      U.el("label", { for: input.id, html: "<bdi>" + U.rich(o.symbol) + "</bdi> — " + U.escapeHtml(o.label) }),
      U.el("div.input-wrap", {}, [input, stepper]),
      o.hint ? U.el("span.hint", { text: o.hint }) : null,
    ].filter(Boolean));

    function step(dir) {
      const p = U.parseNumber(input.value || "0");
      const base = p.ok ? p.value : 0;
      input.value = String(Math.round((base + dir) * 100) / 100);
      App.Sound.play("click");
    }

    return { wrap, input };
  }

  function seqInputId(input) {
    input.id = input.id || "builder-seq-input";
    return input.id;
  }

  App.Components = App.Components || {};
  App.Components.BuilderPanel = { create };
})(window.App = window.App || {});
