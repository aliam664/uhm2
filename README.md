# درس‌یار ریاضی — پلتفرم آموزش تعاملی ریاضی

یک وب‌اپ آموزشی تعاملی، سینمایی و چندفایلی برای آموزش **«مجموع چند جملهٔ اول یک دنبالهٔ حسابی»** — طراحی‌شده مانند یک محصول EdTech حرفه‌ای، نه یک صفحهٔ وب ساده.

> سؤال نمونه: «مجموع چند جملهٔ اول دنبالهٔ حسابی (…، ۱۲، ۷، ۲) برابر با ۸۷ می‌شود؟» — پاسخ: **۶ جمله** (هیچ‌جای کد hard-code نشده؛ کاملاً محاسبه می‌شود)

---

## ویژگی‌ها

- **۹ مرحلهٔ آموزشی انیمیشنی** — از تشخیص دنباله تا بررسی نهایی جواب، بدون پرش مفهومی
- **موتور ریاضی مستقل از UI** — حساب کسری دقیق (`Fraction`)، حل‌گر معادلهٔ درجهٔ دوم با Δ، پشتیبانی از معادلهٔ خطی (d = 0)
- **فرمول‌نویسی واقعی با KaTeX** (کاملاً local) — ارقام فرمول‌ها با فونت **Vazirmatn FD** به‌صورت فارسی رندر می‌شوند
- **انیمیشن‌های GSAP** — تایم‌لاین چندمرحله‌ای، جایگذاری زندهٔ مقادیر در فرمول، شمارندهٔ اعداد، جشن پایانی ذرات
- **تغییر سؤال** — سه ورودی a₁ / d / Sₙ یا **ورود مستقیم دنباله**؛ همهٔ ۹ مرحله از نو تولید و محاسبه می‌شوند
- **حالت‌های جواب** — موفق / غیرصحیح / بدون جواب حقیقی / منفی، هرکدام با صحنهٔ اختصاصی
- **اعتبارسنجی کامل** — ورودی خالی، متن به‌جای عدد، دنبالهٔ غیرحسابی (با دلیل دقیق)، Δ منفی، اعداد نامعتبر
- **Dark / Light Theme**، سه سرعت انیمیشن، افکت صوتی ظریف (پیش‌فرض خاموش) — همه در LocalStorage
- **پیمایش** — دکمه‌های قبل/بعد، پخش خودکار ⏸/▶، شروع دوباره، کلیدهای → و ←، ریل پیشرفت کلیک‌پذیر
- **دسترس‌پذیری** — HTML معنایی، aria، فوکوس مرئی، پشتیبانی کامل از Reduced Motion
- **Responsive** — موبایل / تبلت / لپ‌تاپ / دسکتاپ؛ پنل تغییر سؤال در موبایل به Drawer تمام‌عرض تبدیل می‌شود
- **بدون اینترنت** — فونت‌ها، KaTeX و GSAP همگی داخل پروژه‌اند

## اجرا

پروژه کاملاً استاتیک است؛ کافی است یک سرور محلی اجرا کنید:

```bash
# هرکدام:
python3 -m http.server 8000
npx serve .
```

سپس `http://localhost:8000` را باز کنید. (به‌خاطر فونت‌ها و ماژول‌ها، سرور محلی به‌تر از باز کردن مستقیم فایل است.)

## ساختار پروژه

```
├── index.html                 # صفحهٔ اصلی + ترتیب بارگذاری
├── assets/
│   ├── fonts/                 # Vazirmatn متغیر + Vazirmatn FD (ارقام فارسی) + fonts.css
│   ├── katex/                 # KaTeX محلی (CSS + JS + فونت‌ها)
│   ├── icons/                 # favicon
│   └── vendor/                # GSAP محلی
├── css/
│   ├── variables.css          # توکن‌های طراحی (دو تم کامل)
│   ├── typography.css         # تایپوگرافی فارسی + لایهٔ KaTeX
│   ├── base.css               # ریست، پس‌زمینهٔ سینمایی، چیدمان
│   ├── components.css         # دکمه‌ها، کارت‌ها، ورودی‌ها، Drawer، Toast
│   ├── lesson.css             # ریل پیشرفت، صحنه‌ها، فرمول‌ها، دنباله‌ها
│   ├── animations.css         # keyframe ها + Reduced Motion
│   └── responsive.css         # ۴ نقطهٔ شکست + چاپ
├── js/
│   ├── utils.js               # DOM builder، ارقام فارسی، آیکون‌های SVG
│   ├── math/fraction.js       # حساب کسری دقیق (متن باز، بدون خطای اعشاری)
│   ├── math/sequence.js       # ساخت/تجزیه/تحلیل دنباله
│   ├── math/quadratic.js      # حل‌گر an²+bn+c=0 با Δ
│   ├── math-engine.js         # حل کامل مسئله + حالت‌های جواب
│   ├── state.js               # وضعیت برنامه (pub/sub)
│   ├── settings.js            # تم/سرعت/صدا + LocalStorage
│   ├── sound-engine.js        # افکت‌های صوتی WebAudio (سنتز، بدون فایل)
│   ├── formula-engine.js      # تولید LaTeX برای همهٔ صحنه‌ها
│   ├── animation-engine.js    # لایهٔ GSAP + ذرات جشن
│   ├── lesson-engine.js       # گردشندهٔ مراحل + پخش خودکار
│   ├── navigation.js          # کلیدهای جهت‌دار
│   └── app.js                 # نقطهٔ ورود، سیم‌کشی
├── components/                # کامپوننت‌های UI (Vanilla، Component-Based)
│   ├── header.js  hero.js  builder-panel.js  progress.js
│   ├── step-card.js  explanation-card.js  formula-card.js
│   ├── sequence-display.js  value-chips.js  controls.js
│   └── final-result.js  toast.js  drawer.js
├── scenes/                    # ۹ صحنهٔ آموزشی (هرکدام یک ماژول مستقل)
│   ├── scene-01-recognize.js      # تشخیص دنبالهٔ حسابی
│   ├── scene-02-first-term.js     # تعیین a₁
│   ├── scene-03-common-difference.js  # تعیین d + نردبان
│   ├── scene-04-formula.js        # ساخت تدریجی فرمول (ترفند گاوس)
│   ├── scene-05-substitution.js   # جایگذاری زندهٔ مقادیر
│   ├── scene-06-quadratic.js      # زنجیرهٔ تبدیل به معادله
│   ├── scene-07-delta.js          # مبیّن + حالت خطی/منفی
│   ├── scene-08-roots.js          # دو مسیر ریشه، رد جواب نامعتبر
│   └── scene-09-verify.js         # جمع واقعی + جشن
├── data/
│   ├── lessons.js             # رجیستری درس‌ها (قابل توسعه)
│   └── lessons/arithmetic-sum.js  # دادهٔ درس ۱ (Data-Driven)
└── tests/
    └── math.test.mjs          # تست موتور ریاضی (۲۱ سنجه)
```

## معماری در یک نگاه

```
App (app.js)
 ├── Header ── Settings (تم/سرعت/صدا ← LocalStorage)
 ├── Hero (کارت سؤال + شروع)
 ├── BuilderPanel ──► MathEngine ──► Solution
 │                                (Fraction دقيق + QuadraticSolver)
 └── LessonEngine
      ├── Progress (ریل ۹ مرحله‌ای)
      ├── Scenes ۱–۹  ──► FormulaEngine (LaTeX) ──► KaTeX
      │       └────────► AnimationEngine (GSAP) + SoundEngine
      └── Controls + Navigation (کیبورد)
```

- **Data-Driven**: دادهٔ درس در `data/` از منطق نمایش جدا شده؛ اضافه‌کردن درس جدید یعنی یک فایل تعریف + صحنه‌ها.
- **محاسبات دقیق**: همه‌چیز با کسر (`num/den`) انجام می‌شود؛ Δ = ۳۴۸۱ و √Δ = ۵۹ بدون خطای اعشاری.
- **ماتریس حالت‌ها**: موفق (n صحیح مثبت) / غیرصحیح / Δ منفی / بدون جواب مثبت / خطی — همهٔ صحنه‌ها خودشان را با وضعیت وفق می‌دهند.

## تست

```bash
node tests/math.test.mjs   # ۲۱ سنجهٔ موتور ریاضی
```

## افزودن درس جدید

1. فایل تعریف در `data/lessons/<id>.js` بسازید و در `data/lessons.js` ثبتش کنید.
2. صحنه‌های درس را در `scenes/` بنویسید (قرارداد: `{ num, title, short, lede, icon, build(ctx) → { el, tl } }`).
3. کلید صحنه‌ها را به `STEP_KEYS` در `lesson-engine.js` اضافه کنید.

## مجوزها

- فونت Vazirmatn — SIL OFL 1.1 (ساباق: rastikerdar/vazirmatn)
- KaTeX — MIT
- GSAP — استاندارد «GreenSock» (مصرف‌شده در نسخهٔ عمومی رایگان)
