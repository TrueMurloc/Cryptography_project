/**
 * levels.js — генерація випадкових завдань для режиму «Рівні» та збереження
 * прогресу. Кожен виклик generateChallenge() створює НОВИЙ випадковий текст
 * і ключ, тож рівень щоразу інший.
 */
(function (global) {
  "use strict";

  var PROGRESS_KEY = "pivnichna-zirka-progress-v2";

  var PHRASES = {
    uk: {
      1: ["Місія почалася", "Пароль прийнято", "Слідкуй за тінню", "Замок відкрито", "Сигнал отримано", "Кур'єр у дорозі"],
      2: [
        "Штаб підтверджує зустріч на світанку",
        "Донесення надійде опівночі біля маяка",
        "Агенте знищ документи після прочитання",
        "Ворог перехопив попередній шифр будь обережний",
        "Координати цілі передано резервному каналу",
      ],
      3: [
        "Операція відбудеться рівно опівночі на північному причалі тож будь напоготові й нікому не довіряй",
        "Подвійний агент виявлений у східному відділі негайно повідомте штаб-квартиру й замініть усі паролі",
        "Резервний план активовано евакуація через старий тунель почнеться за сигналом червоної ракети",
      ],
    },
    en: {
      1: ["Mission has begun", "Password accepted", "Watch the shadow", "The lock is open", "Signal received", "Courier en route"],
      2: [
        "Headquarters confirms the meeting at dawn",
        "The dispatch arrives at midnight near the lighthouse",
        "Agent destroy the documents after reading",
        "The enemy intercepted our last cipher stay alert",
        "Target coordinates sent to the backup channel",
      ],
      3: [
        "The operation begins at exactly midnight on the northern pier so stay alert and trust no one",
        "A double agent was found in the eastern division notify headquarters at once and change every password",
        "The backup plan is active evacuation through the old tunnel begins on the signal of a red flare",
      ],
    },
  };

  var KEYWORDS = {
    uk: {
      1: ["КІТ", "ДІМ", "ЛУК", "МИР"],
      2: ["ЗІРКА", "ВОГОНЬ", "ГРОЗА", "ПОЛЮС", "КОМЕТА"],
      3: ["ПІВНІЧНИЙ", "РОЗВІДНИК", "ОПЕРАЦІЯ", "БУРШТИНОВИЙ"],
    },
    en: {
      1: ["CAT", "SUN", "MAP", "FOX"],
      2: ["SHADOW", "ROCKET", "COMPASS", "THUNDER", "GALAXY"],
      3: ["NORTHERN", "OPERATIVE", "MIDNIGHT", "CHECKPOINT"],
    },
  };

  // shiftRange = [min, max]; max буде додатково обмежено довжиною абетки
  var CONFIG = {
    caesar: [
      { id: 1, difficulty: "easy", shiftRange: [1, 9] },
      { id: 2, difficulty: "hard", shiftRange: [1, 32] },
    ],
    transposition: [
      { id: 1, difficulty: "easy", keyBank: 1 },
      { id: 2, difficulty: "medium", keyBank: 2 },
      { id: 3, difficulty: "hard", keyBank: 3 },
    ],
  };

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function generateChallenge(cipherType, levelId, lang) {
    var ciphers = global.App.ciphers;
    var levelCfg = CONFIG[cipherType].filter(function (l) { return l.id === levelId; })[0];

    if (cipherType === "caesar") {
      var plaintext = pick(PHRASES[lang][levelCfg.id]);
      var maxAlpha = ciphers.alphabetLength(lang) - 1;
      var max = Math.min(levelCfg.shiftRange[1], maxAlpha);
      var shift = randomInt(levelCfg.shiftRange[0], max);
      var ciphertext = ciphers.caesar(plaintext, shift, false);
      return {
        cipherType: "caesar",
        levelId: levelId,
        difficulty: levelCfg.difficulty,
        lang: lang,
        plaintext: plaintext,
        key: shift,
        keyMax: max,
        keyMin: levelCfg.shiftRange[0],
        ciphertext: ciphertext,
      };
    }

    // transposition
    var phrase = pick(PHRASES[lang][levelCfg.id]);
    var keyword = pick(KEYWORDS[lang][levelCfg.keyBank]);
    var enc = ciphers.transposition.encrypt(phrase, keyword);
    return {
      cipherType: "transposition",
      levelId: levelId,
      difficulty: levelCfg.difficulty,
      lang: lang,
      plaintext: phrase,
      key: keyword,
      ciphertext: enc.cipher,
    };
  }

  function normalize(s) {
    return (s || "")
      .replace(/_+$/, "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function checkAnswer(challenge, attemptText) {
    return normalize(attemptText) === normalize(challenge.plaintext);
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(PROGRESS_KEY);
      return raw ? JSON.parse(raw) : { caesar: {}, transposition: {} };
    } catch (e) {
      return { caesar: {}, transposition: {} };
    }
  }

  function saveProgress(p) {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
    } catch (e) {}
  }

  function markComplete(cipherType, levelId) {
    var p = loadProgress();
    p[cipherType] = p[cipherType] || {};
    p[cipherType][levelId] = true;
    saveProgress(p);
    return p;
  }

  function isComplete(cipherType, levelId) {
    var p = loadProgress();
    return !!(p[cipherType] && p[cipherType][levelId]);
  }

  global.App = global.App || {};
  global.App.levels = {
    CONFIG: CONFIG,
    generateChallenge: generateChallenge,
    checkAnswer: checkAnswer,
    normalize: normalize,
    loadProgress: loadProgress,
    markComplete: markComplete,
    isComplete: isComplete,
  };
})(window);
