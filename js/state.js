/* ============================================================
   State — وضعیت برنامه با انتشار رویداد (pub/sub)
   ============================================================ */

(function (App) {
  "use strict";

  const listeners = new Map();

  const state = {
    phase: "home",          // 'home' | 'lesson'
    question: null,         // { a1, d, target } — رشته‌های خام
    solution: null,         // خروجی MathEngine
    stepIndex: 0,
    playing: false,
    resumeStep: null,       // مرحلهٔ ذخیره‌شده برای ادامه
  };

  const State = {
    get(key) { return state[key]; },
    set(patch, silent) {
      const changed = [];
      for (const key of Object.keys(patch)) {
        if (state[key] !== patch[key]) {
          state[key] = patch[key];
          changed.push(key);
        }
      }
      if (!silent) changed.forEach((key) => State.emit("change:" + key, state[key]));
      if (changed.length) State.emit("change", state);
      return changed.length > 0;
    },
    raw() { return state; },

    on(event, fn) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(fn);
      return () => listeners.get(event).delete(fn);
    },
    off(event, fn) {
      const set = listeners.get(event);
      if (set) set.delete(fn);
    },
    emit(event, payload) {
      const set = listeners.get(event);
      if (set) set.forEach((fn) => { try { fn(payload); } catch (e) { console.error(e); } });
    },
  };

  App.State = State;
})(window.App = window.App || {});
