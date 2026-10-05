/**
 * i18n.js — переклад інтерфейсу. Елементи з data-i18n="key" отримують
 * текст, з data-i18n-ph="key" — placeholder. Перемикання мови зберігається
 * у localStorage.
 */
(function (global) {
  "use strict";

  var LANG_KEY = "pivnichna-zirka-lang-v1";

  var dict = {
    uk: {
      "eyebrow": "ВІДДІЛ КРИПТОГРАФІЇ · СХІДНЕ КРИЛО",
      "title": "Бюро шифрів «Північна Зірка»",
      "lede": "Робочий стіл шифрувальника. Тренуйтеся вільно або пройдіть рівні — кожна спроба лягає у журнал перехоплень.",
      "stamp": "ЗАСЕКРЕЧЕНО",
      "lang-btn": "EN",

      "gate-kicker": "ПРОПУСКНИЙ ПУНКТ",
      "gate-title": "Пред'явіть перепустку",
      "gate-hint": "Логін — прізвище, пароль — ім'я (як у базі агентів бюро).",
      "gate-example": "Приклад: Романенко / Михайло (регістр літер значення не має).",
      "gate-tab-login": "Увійти",
      "gate-tab-register": "Реєстрація",
      "gate-field-login": "Прізвище",
      "gate-field-pass": "Ім'я",
      "gate-submit-login": "Увійти за пропуском",
      "gate-submit-register": "Оформити перепустку",
      "gate-register-success": "Перепустку оформлено. Тепер увійдіть.",
      "gate-session-expired": "Термін дії перепустки вичерпано. Увійдіть знову.",
      "gate-logout": "Вийти",
      "gate-method-classic": "За прізвищем",
      "gate-method-email": "За поштою",
      "gate-field-email": "Пошта",
      "gate-field-emailpass": "Пароль",
      "gate-field-code": "Код підтвердження",
      "gate-submit-verify": "Підтвердити пошту",
      "gate-verify-note": "Код підтвердження надіслано на {email}.",
      "gate-verify-devcode": "код для демо (бо SMTP не підключено)",

      "badge-generate": "Новий позивний",
      "badge-custom": "Свій позивний",
      "badge-cases-toggle": "Відмінки",
      "badge-custom-placeholder": "Впишіть власний позивний…",
      "badge-custom-save": "Зберегти",
      "badge-custom-note": "Форми відмінків доступні лише для згенерованих позивних.",
      "badge-en-note": "В англійській мові немає відмінків — тому тут лише одна форма імені. Перемкніться на українську, щоб побачити всі сім.",

      "mode-practice": "Практика",
      "mode-levels": "Рівні",

      "tab-caesar": "Шифр Цезаря",
      "tab-transp": "Шифр перестановки",
      "tab-freq": "Частотний аналіз",

      "caesar-h2": "Диск Цезаря",
      "caesar-sub": "Кожна літера зсувається по колу абетки на задану кількість кроків. Українські літери йдуть українською абеткою (33 літери), англійські — англійською (26 літер); цифри, пробіли й пунктуація не змінюються.",
      "wheel-caption": "зовнішнє коло — відкритий текст · внутрішнє — шифр",
      "shift-label": "Крок зсуву (ключ)",
      "field-text": "Текст",
      "caesar-placeholder": "Введіть донесення…",
      "btn-encrypt": "Зашифрувати",
      "btn-decrypt": "Розшифрувати",
      "btn-clear": "Очистити",
      "result-label": "Результат",
      "copy-btn": "копіювати",
      "copy-done": "скопійовано",

      "transp-h2": "Ґрати перестановки",
      "transp-sub": "Текст вкладається у рядки під ключовим словом, стовпці перечитуються у порядку, заданому алфавітом літер ключа. Короткий залишок доповнюється символом «_».",
      "field-key": "Ключове слово",
      "transp-placeholder": "Введіть донесення…",

      "freq-h2": "Частотний аналіз літер",
      "freq-sub": "Класичний інструмент криптоаналітика: порахуйте, яка літера зустрічається найчастіше, і порівняйте з типовим розподілом мови — це дає змогу вгадати зсув шифру Цезаря без перебору.",
      "freq-placeholder": "Встав сюди шифротекст або будь-який текст для аналізу…",
      "freq-analyze-btn": "Аналізувати",
      "freq-detected": "Визначена абетка: {lang}",
      "freq-lang-uk": "українська",
      "freq-lang-en": "англійська",
      "freq-use-uk": "УКР",
      "freq-use-en": "ENG",
      "freq-table-letter": "Літера",
      "freq-table-count": "Кількість",
      "freq-table-percent": "Відсоток",
      "freq-empty": "Введіть текст і натисніть «Аналізувати».",
      "freq-no-letters": "У тексті немає літер цієї абетки.",
      "freq-guess-title": "Спроба зламати як шифр Цезаря",
      "freq-guess-text": "Найімовірніший зсув: {shift} — найчастіша літера шифротексту зіставлена з найчастішою літерою мови.",
      "freq-apply-btn": "Відкрити в «Цезарі» з цим зсувом",
      "freq-ref-h3": "Еталонна частота літер мови",
      "freq-ref-sub": "Середній відсоток, з яким літера трапляється у звичайному тексті мови (орієнтовні значення). Саме з цим еталоном звіряють спостережений розподіл, коли зламують шифр Цезаря.",
      "freq-ref-tip": "Шифр перестановки лише міняє літери місцями, тому його частотний розподіл завжди такий самий, як у тексту-оригіналу — а шифр Цезаря зсуває самі літери, тому саме його й зламує частотний аналіз.",

      "levels-caesar-sub": "Оберіть рівень: система випадково згенерує фразу та зсув. Крутіть диск, поки текст не стане читабельним, і перевірте відповідь.",
      "levels-transp-sub": "Оберіть рівень: система випадково згенерує фразу та ключове слово. Підберіть ключ, щоб розкрити повідомлення.",
      "level-label": "Рівень",
      "level-done": "пройдено",
      "level-locked": "не пройдено",
      "level-easy": "легкий",
      "level-medium": "середній",
      "level-hard": "складний",
      "challenge-cipher-label": "Перехоплене шифрування",
      "challenge-your-key": "Ваш ключ",
      "challenge-preview": "Ваша розшифровка",
      "btn-check": "Перевірити",
      "btn-new-round": "Новий раунд",
      "btn-hint": "Підказка",
      "check-success": "Влучно! Донесення розкрито.",
      "check-fail": "Поки що не збігається. Спробуйте інший ключ.",
      "hint-caesar": "Ключ — число від {min} до {max}.",
      "hint-transp": "Довжина ключа: {len} літер.",

      "log-title": "Журнал перехоплень",
      "log-clear": "Очистити журнал",
      "log-empty": "Ще жодного донесення не перехоплено.",
      "log-in": "вхід",
      "log-out": "вихід",
      "log-level-pass": "рівень пройдено",
      "log-encrypted": "зашифровано",
      "log-decrypted": "розшифровано",
      "log-shift": "зсув",
      "log-key": "ключ",

      "footer": "Бюро шифрів «Північна Зірка» · навчальний проєкт із криптографії",
    },

    en: {
      "eyebrow": "CRYPTOGRAPHY DIVISION · EAST WING",
      "title": "The Northern Star Cipher Bureau",
      "lede": "The clerk's desk. Practice freely or clear the levels — every attempt lands in the intercept log below.",
      "stamp": "CLASSIFIED",
      "lang-btn": "UA",

      "gate-kicker": "CHECKPOINT",
      "gate-title": "Show your pass",
      "gate-hint": "Login is your surname, password is your first name (matches the bureau's agent roster).",
      "gate-example": "Example: Романенко / Михайло — same Cyrillic spelling as the roster (letter case doesn't matter).",
      "gate-tab-login": "Sign in",
      "gate-tab-register": "Register",
      "gate-field-login": "Surname",
      "gate-field-pass": "First name",
      "gate-submit-login": "Sign in with pass",
      "gate-submit-register": "Issue a pass",
      "gate-register-success": "Pass issued. Now sign in.",
      "gate-session-expired": "Your pass has expired. Please sign in again.",
      "gate-logout": "Sign out",
      "gate-method-classic": "By surname",
      "gate-method-email": "By email",
      "gate-field-email": "Email",
      "gate-field-emailpass": "Password",
      "gate-field-code": "Verification code",
      "gate-submit-verify": "Verify email",
      "gate-verify-note": "A verification code was sent to {email}.",
      "gate-verify-devcode": "demo code (no SMTP connected)",

      "badge-generate": "New codename",
      "badge-custom": "Custom codename",
      "badge-cases-toggle": "Grammar cases",
      "badge-custom-placeholder": "Type your own codename…",
      "badge-custom-save": "Save",
      "badge-custom-note": "Grammar-case forms are only shown for generated codenames.",
      "badge-en-note": "English has no grammatical cases, so only one form of the name is shown. Switch to Ukrainian to see all seven.",

      "mode-practice": "Practice",
      "mode-levels": "Levels",

      "tab-caesar": "Caesar Cipher",
      "tab-transp": "Transposition Cipher",
      "tab-freq": "Frequency Analysis",

      "caesar-h2": "The Caesar Dial",
      "caesar-sub": "Every letter is shifted a fixed number of steps around its own alphabet. Ukrainian letters shift through the 33-letter Ukrainian alphabet, English letters through the 26-letter English one; digits, spaces and punctuation are left untouched.",
      "wheel-caption": "outer ring — plain text · inner ring — cipher",
      "shift-label": "Shift amount (key)",
      "field-text": "Text",
      "caesar-placeholder": "Type a dispatch…",
      "btn-encrypt": "Encrypt",
      "btn-decrypt": "Decrypt",
      "btn-clear": "Clear",
      "result-label": "Result",
      "copy-btn": "copy",
      "copy-done": "copied",

      "transp-h2": "The Transposition Grid",
      "transp-sub": "The text is laid out in rows under a keyword; columns are read back in the order given by the keyword's alphabetical order. A short remainder is padded with an underscore.",
      "field-key": "Keyword",
      "transp-placeholder": "Type a dispatch…",

      "freq-h2": "Letter Frequency Analysis",
      "freq-sub": "A classic cryptanalyst's tool: count which letter appears most often and compare it to the language's typical distribution — this lets you guess a Caesar shift without brute-forcing it.",
      "freq-placeholder": "Paste ciphertext or any text to analyze…",
      "freq-analyze-btn": "Analyze",
      "freq-detected": "Detected alphabet: {lang}",
      "freq-lang-uk": "Ukrainian",
      "freq-lang-en": "English",
      "freq-use-uk": "UKR",
      "freq-use-en": "ENG",
      "freq-table-letter": "Letter",
      "freq-table-count": "Count",
      "freq-table-percent": "Percent",
      "freq-empty": "Type some text and click \"Analyze\".",
      "freq-no-letters": "This text has no letters of this alphabet.",
      "freq-ref-h3": "Reference letter frequency",
      "freq-ref-sub": "The average share of a text a letter typically takes up in the language (approximate, well-known figures). This is the baseline a Caesar cipher's observed distribution gets compared against when cracking it.",
      "freq-ref-tip": "A transposition cipher only reorders letters, so its frequency distribution always matches the original text exactly — a Caesar cipher shifts the letters themselves, which is why frequency analysis can crack it.",
      "freq-guess-title": "Attempt to crack as a Caesar cipher",
      "freq-guess-text": "Most likely shift: {shift} — the ciphertext's most common letter matched to the language's most common letter.",
      "freq-apply-btn": "Open in Caesar tool with this shift",

      "levels-caesar-sub": "Pick a level: the system randomly generates a phrase and a shift. Turn the dial until the text reads clearly, then check your answer.",
      "levels-transp-sub": "Pick a level: the system randomly generates a phrase and a keyword. Find the key to reveal the message.",
      "level-label": "Level",
      "level-done": "cleared",
      "level-locked": "not cleared",
      "level-easy": "easy",
      "level-medium": "medium",
      "level-hard": "hard",
      "challenge-cipher-label": "Intercepted cipher",
      "challenge-your-key": "Your key",
      "challenge-preview": "Your decoding",
      "btn-check": "Check",
      "btn-new-round": "New round",
      "btn-hint": "Hint",
      "check-success": "Nailed it! The dispatch is decoded.",
      "check-fail": "Not quite yet. Try another key.",
      "hint-caesar": "The key is a number between {min} and {max}.",
      "hint-transp": "Key length: {len} letters.",

      "log-title": "Intercept Log",
      "log-clear": "Clear log",
      "log-empty": "No dispatch intercepted yet.",
      "log-in": "in",
      "log-out": "out",
      "log-level-pass": "level cleared",
      "log-encrypted": "encrypted",
      "log-decrypted": "decrypted",
      "log-shift": "shift",
      "log-key": "key",

      "footer": "The Northern Star Cipher Bureau · a cryptography study project",
    },
  };

  var state = { lang: "uk" };

  function t(key, vars) {
    var s = (dict[state.lang] && dict[state.lang][key]) || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        s = s.replace("{" + k + "}", vars[k]);
      });
    }
    return s;
  }

  function apply() {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      var pairs = el.getAttribute("data-i18n-attr").split(",");
      pairs.forEach(function (pair) {
        var parts = pair.split(":");
        el.setAttribute(parts[0], t(parts[1]));
      });
    });
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: state.lang } }));
  }

  function setLang(lang) {
    state.lang = lang === "en" ? "en" : "uk";
    try {
      localStorage.setItem(LANG_KEY, state.lang);
    } catch (e) {}
    apply();
  }

  function toggle() {
    setLang(state.lang === "uk" ? "en" : "uk");
  }

  function init() {
    var saved = null;
    try {
      saved = localStorage.getItem(LANG_KEY);
    } catch (e) {}
    state.lang = saved === "en" ? "en" : "uk";
    apply();
  }

  global.App = global.App || {};
  global.App.i18n = {
    t: t,
    apply: apply,
    setLang: setLang,
    toggle: toggle,
    init: init,
    get lang() {
      return state.lang;
    },
  };
})(window);
