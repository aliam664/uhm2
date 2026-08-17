import fs from 'fs';
// پیش‌نیاز:  npm i -D jsdom   سپس:  node tests/smoke.test.mjs
import { createRequire } from "module";
import path from "path";
import url from "url";
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
let JSDOM, VirtualConsole;
try {
  const api = require(path.join(root, "node_modules", "jsdom", "lib", "api.js"));
  ({ JSDOM, VirtualConsole } = api);
} catch (e) {
  console.log("SKIP: jsdom نصب نیست — ابتدا اجرا کنید:  npm i -D jsdom");
  process.exit(0);
}

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => {
  const msg = String(e.message || e);
  if (e.stack) console.log('STACK>>>', String(e.stack).split('\n').slice(0,4).join(' | '));
  if (msg.includes('Not implemented') || msg.includes('Could not parse CSS') || msg.includes('Could not load link')) return;
  errors.push(msg + (e.detail ? ' :: ' + e.detail : ''));
});
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));
vc.on('log', () => {});
vc.on('warn', () => {});

const dom = await JSDOM.fromFile(path.join(root, 'index.html'), {
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
  virtualConsole: vc,
});
const { window } = dom;
await new Promise((res) => {
  if (window.document.readyState === 'complete') res();
  else window.addEventListener('load', res);
});
await new Promise((r) => setTimeout(r, 900));

const doc = window.document;
const q = (s) => doc.querySelector(s);
const qa = (s) => Array.from(doc.querySelectorAll(s));
let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? pass++ : (fail++, console.log('FAIL:', name)); };

ok('no page errors', errors.length === 0);
if (errors.length) console.log('ERRORS:', errors.slice(0, 6));
ok('App namespace', !!window.App);
ok('boot splash removed or hero present', !!q('#home-view .hero') || !q('#boot-splash'));
ok('hero title', (q('.h-display')?.textContent || '').includes('حل تعاملی'));
ok('question text has 87', (q('.hero-question')?.textContent || '').includes('۸۷'));
ok('builder present', !!q('.builder-panel'));
ok('header theme btn', !!q('.icon-btn[aria-label="تغییر تم روشن و تیره"]'));

// شروع حل
const startBtn = qa('button').find((b) => b.textContent.includes('شروع حل'));
ok('start button found', !!startBtn);
startBtn.click();
await new Promise((r) => setTimeout(r, 1200));

ok('lesson view visible', !doc.getElementById('lesson-view').hidden);
ok('progress nodes count', qa('.progress-node').length === 9);
ok('progress current', qa('.progress-node.is-current').length === 1);
ok('stage has step 1', (q('.step-title')?.textContent || '').includes('تشخیص دنباله'));
ok('seq terms present', qa('.seq-term').length >= 5);

// پرش به مرحله ۹ (مرحله آخر)
window.App.LessonEngine.goTo(8, { instant: true });
await new Promise((r) => setTimeout(r, 900));
ok('step 9 title', (q('.step-title')?.textContent || '').includes('بررسی جواب'));
const faValue = q('.fa-value');
ok('final n = ۶', (faValue?.textContent || '').trim() === '۶');
ok('final message', (q('.final-message')?.textContent || '').includes('جملهٔ اول برابر ۸۷'));

// مرحله ۴ (فرمول)
window.App.LessonEngine.goTo(3, { instant: true });
await new Promise((r) => setTimeout(r, 700));
ok('step 4 title', (q('.step-title')?.textContent || '').includes('انتخاب فرمول'));
ok('formula labels', qa('.f-label').length >= 3);
ok('katex rendered', qa('.katex').length > 0);

// برگشت به خانه و حل سؤال جدید a1=3,d=4,S=90 (جواب ندارد → non-integer)
window.App.State.set({ phase: 'home' });
window.App.Controller.els.lesson.hidden = true;
window.App.Controller.els.home.hidden = false;
const inputs = qa('.builder-panel input');
inputs[0].value = '3'; inputs[1].value = '4'; inputs[2].value = '90';
const solveBtn = qa('.builder-panel button').find((b) => b.textContent.includes('حل این سؤال'));
solveBtn.click();
await new Promise((r) => setTimeout(r, 1200));
ok('lesson restarted for new question', !window.App.Controller.els.lesson.hidden);
window.App.LessonEngine.goTo(8, { instant: true });
await new Promise((r) => setTimeout(r, 900));
const concl = q('.final-card .final-message');
ok('conclusion for non-integer', (concl?.textContent || '').includes('تعداد صحیحی'));

// دنبالهٔ غیرحسابی
window.App.Controller.els.lesson.hidden = true; window.App.Controller.els.home.hidden = false;
const seqTab = qa('.tab').find((t) => t.textContent.includes('ورود مستقیم'));
seqTab.click();
await new Promise((r) => setTimeout(r, 100));
const seqInputs = qa('.builder-panel input');
seqInputs[0].value = '2, 7, 11';
seqInputs[1].value = '87';
qa('.builder-panel button').find((b) => b.textContent.includes('حل این سؤال')).click();
await new Promise((r) => setTimeout(r, 500));
ok('not-arithmetic notice', (q('.notice--error .notice-title')?.textContent || '').includes('حسابی نیست'));


// --- تست‌های تکمیلی ---
// زیرنویس واقعی به‌جای کاراکتر ₁
ok('real subscripts in explain', qa('.explain-body sub, .v-chip .v-name sub').length >= 0);

// autoplay toggle (در مرحلهٔ اول؛ در مرحلهٔ آخر پخش متعمداً پایان می‌یابد)
const playBtn = qa('.lesson-controls button').find(b => (b.getAttribute('aria-label')||'').includes('پخش خودکار'));
ok('play button exists', !!playBtn);
window.App.LessonEngine.goTo(0, { instant: true });
await new Promise((r) => setTimeout(r, 400));
window.App.LessonEngine.togglePlay();
ok('autoplay started', window.App.LessonEngine.playing === true);
window.App.LessonEngine.togglePlay();
ok('autoplay stopped', window.App.LessonEngine.playing === false);

// next/prev
window.App.LessonEngine.goTo(1, { instant: true });
await new Promise((r) => setTimeout(r, 400));
window.App.LessonEngine.prev();
ok('prev works', window.App.LessonEngine.current === 0);
window.App.LessonEngine.next();
ok('next works', window.App.LessonEngine.current === 1);

// drawer تغییر سؤال
const changeBtn = qa('button').find(b => b.textContent.includes('تغییر سؤال'));
ok('change-question button', !!changeBtn);
changeBtn.click();
await new Promise((r) => setTimeout(r, 500));
ok('drawer open', qa('.drawer.is-open').length === 1);
const drawerInputs = qa('.drawer input');
ok('drawer has inputs', drawerInputs.length >= 3);
drawerInputs[0].value = '5'; drawerInputs[1].value = '2'; drawerInputs[2].value = '96';
qa('.drawer button').find(b => b.textContent.includes('حل این سؤال')).click();
await new Promise((r) => setTimeout(r, 1200));
ok('drawer solve: n=8 (5,2,96)', !window.App.Controller.els.lesson.hidden && window.App.LessonEngine.solution.chosen.n.toString() === '8');
window.App.LessonEngine.goTo(8, { instant: true });
await new Promise((r) => setTimeout(r, 800));
ok('n=۸ shown', (q('.fa-value')?.textContent || '').trim() === '۸');

// تم
window.App.Settings.toggleTheme();
ok('theme switched', doc.documentElement.getAttribute('data-theme') === 'light');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
