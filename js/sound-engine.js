/* ============================================================
   SoundEngine — افکت‌های صوتی بسیار ظریف (سنتز WebAudio)
   بدون فایل صوتی، بدون اینترنت. پیش‌فرض خاموش است.
   ============================================================ */

(function (App) {
  "use strict";

  let ctx = null;
  let master = null;

  function ensureContext() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.14;
      master.connect(ctx.destination);
      return true;
    } catch (e) {
      return false;
    }
  }

  /** یک نُت سینوسی با پوش نرم */
  function tone({ freq = 440, dur = 0.18, delay = 0, type = "sine", gain = 1, glide = 0 }) {
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + glide), t0 + dur);
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(gain, t0 + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(env);
    env.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  const EFFECTS = {
    /* انتقال مرحله — تِک لطیف */
    step() {
      tone({ freq: 620, dur: 0.09, type: "sine", gain: 0.5 });
      tone({ freq: 930, dur: 0.07, delay: 0.035, gain: 0.25 });
    },
    /* کلیک دکمه */
    click() {
      tone({ freq: 480, dur: 0.05, type: "triangle", gain: 0.35 });
    },
    /* موفقیت — آکورد ماژور نرم */
    success() {
      [523.25, 659.25, 783.99].forEach((f, i) =>
        tone({ freq: f, dur: 0.5, delay: i * 0.09, gain: 0.3, type: "sine" })
      );
    },
    /* جشن پایانی — آرپژ زنگی */
    celebrate() {
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
        tone({ freq: f, dur: 0.9, delay: i * 0.12, gain: 0.26 })
      );
    },
    /* هشدار / رد شدن جواب */
    warn() {
      tone({ freq: 340, dur: 0.16, type: "triangle", gain: 0.4 });
      tone({ freq: 290, dur: 0.22, delay: 0.13, type: "triangle", gain: 0.35 });
    },
    /* خطا */
    error() {
      tone({ freq: 210, dur: 0.3, type: "sawtooth", gain: 0.18 });
      tone({ freq: 180, dur: 0.32, delay: 0.06, type: "sawtooth", gain: 0.14 });
    },
  };

  const Sound = {
    play(name) {
      if (!App.Settings.sound) return;
      if (!ensureContext()) return;
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
      const fx = EFFECTS[name];
      if (fx) fx();
    },
  };

  App.Sound = Sound;
})(window.App = window.App || {});
