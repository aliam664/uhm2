/* ============================================================
   AnimationEngine — لایهٔ یکنواخت روی GSAP
   همهٔ مدت‌ها با ضریب سرعت کاربر و حالت Reduced Motion مقیاس می‌گیرند.
   فقط transform و opacity — بدون layout سنگین.
   ============================================================ */

(function (App) {
  "use strict";

  const U = App.Utils;
  const A = {};

  /** ضرب مدت بر سرعت و حرکت کمتر */
  A.d = function (seconds) {
    return seconds * App.Settings.speedFactor();
  };

  /** ساخت تایم‌لاین پیش‌فرض */
  A.tl = function (vars) {
    return gsap.timeline(
      Object.assign({ defaults: { ease: "power3.out", duration: A.d(0.6) } }, vars || {})
    );
  };

  /* ---------- ورود عناصر ---------- */

  A.fadeUp = function (targets, vars) {
    return gsap.fromTo(
      targets,
      { opacity: 0, y: 26 },
      Object.assign({ opacity: 1, y: 0, duration: A.d(0.7), ease: "power3.out", clearProps: "transform" }, vars || {})
    );
  };

  A.popIn = function (targets, vars) {
    return gsap.fromTo(
      targets,
      { opacity: 0, scale: 0.6 },
      Object.assign(
        { opacity: 1, scale: 1, duration: A.d(0.55), ease: "back.out(2.2)", clearProps: "transform" },
        vars || {}
      )
    );
  };

  A.blurIn = function (targets, vars) {
    return gsap.fromTo(
      targets,
      { opacity: 0, filter: "blur(10px)", y: 14 },
      Object.assign(
        { opacity: 1, filter: "blur(0px)", y: 0, duration: A.d(0.8), ease: "power2.out", clearProps: "filter,transform" },
        vars || {}
      )
    );
  };

  A.stagger = function (targets, vars) {
    const opts = Object.assign({ each: A.d(0.12) }, (vars && vars.stagger) || {});
    const tweenVars = Object.assign({}, vars || {});
    delete tweenVars.stagger;
    return gsap.fromTo(
      targets,
      { opacity: 0, y: 22, scale: 0.96 },
      Object.assign(
        { opacity: 1, y: 0, scale: 1, duration: A.d(0.6), ease: "power3.out", stagger: opts, clearProps: "transform" },
        tweenVars
      )
    );
  };

  /* ---------- تأکید ---------- */

  A.pulse = function (target, vars) {
    return gsap.fromTo(
      target,
      { scale: 1 },
      Object.assign(
        { scale: 1.09, duration: A.d(0.28), yoyo: true, repeat: 1, ease: "power2.inOut", clearProps: "scale" },
        vars || {}
      )
    );
  };

  A.shake = function (target) {
    return gsap.fromTo(
      target,
      { x: 0 },
      { keyframes: [{ x: -6 }, { x: 6 }, { x: -4 }, { x: 0 }], duration: A.d(0.5), ease: "power1.inOut", clearProps: "x" }
    );
  };

  /**
   * شمارندهٔ زندهٔ اعداد فارسی
   * countUp(el, { from:0, to:87, format:(v)=>U.fa(v), duration })
   */
  A.countUp = function (el, opts) {
    const o = Object.assign({ from: 0, to: 100, duration: 1.4, format: (v) => U.fa(Math.round(v)), ease: "power2.out" }, opts || {});
    const state = { v: o.from };
    el.textContent = o.format(o.from);
    return gsap.to(state, {
      v: o.to,
      duration: A.d(o.duration),
      ease: o.ease,
      onUpdate() {
        el.textContent = o.format(state.v);
      },
      onComplete() {
        el.textContent = o.format(o.to);
      },
    });
  };

  /* ---------- فرمول‌ها ---------- */

  /**
   * تعویض فرمول با انیمیشن: محو → رندر KaTeX → ورود با پالس
   * A.swapFormula(el, latex, {mode:'replace'|'append'}) → تایم‌لاین
   */
  A.swapFormula = function (el, latex, vars) {
    const o = Object.assign({ mode: "replace", scale: 1 }, vars || {});
    const tl = gsap.timeline();
    if (o.mode === "replace") {
      tl.to(el, { opacity: 0, y: -8, duration: A.d(0.28), ease: "power2.in" });
      tl.add(() => App.Formula.render(el, latex));
      tl.fromTo(
        el,
        { opacity: 0, y: 10, scale: 0.97 },
        { opacity: 1, y: 0, scale: o.scale, duration: A.d(0.5), ease: "power3.out", clearProps: "transform" }
      );
    } else {
      tl.add(() => App.Formula.render(el, latex));
      tl.fromTo(
        el,
        { opacity: 0, y: 12, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: A.d(0.55), ease: "back.out(1.8)", clearProps: "transform" }
      );
    }
    return tl;
  };

  /** رسم چک موفقیت داخل .check-orb */
  A.drawCheck = function (svg) {
    const path = svg.querySelector("path");
    if (!path) return gsap.timeline();
    return gsap.fromTo(
      path,
      { strokeDashoffset: 60 },
      { strokeDashoffset: 0, duration: A.d(0.7), ease: "power2.inOut" }
    );
  };

  /* ---------- جلوه‌های موفقیت ---------- */

  let canvas = null;
  let ctx = null;
  let running = false;

  function ensureCanvas() {
    if (canvas) return true;
    try {
      canvas = document.createElement("canvas");
      canvas.className = "celebrate-canvas";
      canvas.setAttribute("aria-hidden", "true");
      document.body.appendChild(canvas);
      ctx = canvas.getContext("2d");
      if (!ctx) return false;
      const fit = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      fit();
      window.addEventListener("resize", fit);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * جشن ظریف پایان درس — ذرات طلایی و نیلی + حلقه‌های نور
   * منبع: مختصات عنصر (اختیاری) یا مرکز صفحه
   */
  A.celebrate = function (sourceEl) {
    if (App.Settings.isReduced()) return;
    if (!ensureCanvas()) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    let cx = W / 2;
    let cy = H * 0.4;

    if (sourceEl && sourceEl.getBoundingClientRect) {
      const r = sourceEl.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
    }

    const palette = ["#e8c57e", "#f4d9a4", "#7f8cf8", "#45c8e8", "#ffffff"];
    const parts = [];
    const count = 110;

    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8.5;
      parts.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed - 2.5,
        size: 2 + Math.random() * 4,
        color: palette[(Math.random() * palette.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        life: 1,
        decay: 0.006 + Math.random() * 0.012,
        shape: Math.random() < 0.35 ? "rect" : "circle",
      });
    }

    const rings = [
      { r: 10, alpha: 0.5, vr: 7 },
      { r: 6, alpha: 0.35, vr: 11, delay: 8 },
    ];

    if (running) return;
    running = true;
    const totalFrames = 210;

    let frame = 0;
    function tick() {
      ctx.clearRect(0, 0, W, H);
      frame++;

      // حلقه‌های نور
      rings.forEach((ring) => {
        if (frame < ring.delay) return;
        ring.r += ring.vr;
        ring.alpha *= 0.965;
        if (ring.alpha <= 0.01) return;
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(232, 197, 126, " + ring.alpha.toFixed(3) + ")";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // ذرات
      parts.forEach((p) => {
        if (p.life <= 0) return;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.11;
        p.vx *= 0.985;
        p.life -= p.decay;
        p.rot += p.vr;

        ctx.globalAlpha = Math.max(0, p.life) * 0.9;
        ctx.fillStyle = p.color;
        if (p.shape === "rect") {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.globalAlpha = 1;

      if (frame < totalFrames) {
        requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, W, H);
        running = false;
      }
    }
    requestAnimationFrame(tick);
  };

  /* ---------- گذر صحنه ---------- */

  /**
   * تعویض محتوای stage با انیمیشن و حفظ نرم ارتفاع
   */
  A.stageSwap = function (stageEl, build) {
    const prevH = stageEl.offsetHeight;
    if (prevH > 0) stageEl.style.minHeight = prevH + "px";

    const tl = gsap.timeline();
    const old = stageEl.querySelector(".stage-inner");

    tl.to(stageEl, { opacity: 0, duration: A.d(0.26), ease: "power1.in" }, 0);
    if (old) tl.to(old, { y: -18, duration: A.d(0.26), ease: "power1.in" }, 0);

    tl.add(() => {
      if (old) old.remove();
      stageEl.appendChild(build());
      gsap.set(stageEl, { opacity: 1 });
      /* قفل ارتفاع تازه تا گذر مرحلهٔ بعد نرم باشد */
      stageEl.style.minHeight = "0px";
      const h = stageEl.offsetHeight;
      stageEl.style.minHeight = Math.max(h, 320) + "px";
    });

    return tl;
  };

  App.Animation = A;
})(window.App = window.App || {});
