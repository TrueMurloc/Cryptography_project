/**
 * frequency.js — інструмент частотного аналізу: таблиця відсотків по
 * кожній літері абетки + спроба вгадати зсув шифру Цезаря методом
 * кореляції з типовим розподілом мови (ciphers.guessCaesarShift).
 */
(function (global) {
  "use strict";

  var ciphers = global.App.ciphers;
  var i18n = global.App.i18n;

  var el = {};
  var state = { lang: null, refLang: "uk" }; // lang: null = автовизначення за текстом

  function cacheDom() {
    [
      "freqInput", "freqAnalyzeBtn", "freqLangUk", "freqLangEn", "freqDetected", "freqTableBody", "freqGuessBox",
      "freqRefLangUk", "freqRefLangEn", "freqRefTableBody",
    ].forEach(function (id) {
      el[id] = document.getElementById(id);
    });
  }

  /** Статична довідкова таблиця (не залежить від введеного тексту) — Завдання: "табличка з % на літеру". */
  function renderReferenceTable(lang) {
    state.refLang = lang;
    el.freqRefLangUk.setAttribute("aria-pressed", lang === "uk" ? "true" : "false");
    el.freqRefLangEn.setAttribute("aria-pressed", lang === "en" ? "true" : "false");

    var ref = ciphers.REFERENCE_FREQ[lang];
    var alphabet = lang === "uk" ? ciphers.UA : ciphers.EN;
    var rows = alphabet
      .split("")
      .map(function (l) {
        return { letter: l, percent: ref[l] || 0 };
      })
      .sort(function (a, b) {
        return b.percent - a.percent;
      });
    var maxPercent = rows.reduce(function (m, r) {
      return Math.max(m, r.percent);
    }, 0.0001);

    el.freqRefTableBody.innerHTML = rows
      .map(function (r) {
        var barWidth = (r.percent / maxPercent) * 100;
        return (
          "<tr>" +
          "<td class='freq-letter'>" + r.letter + "</td>" +
          "<td>" + r.percent.toFixed(2) + "%</td>" +
          "<td class='freq-bar-cell'><div class='freq-bar freq-bar-ref' style='width:" + barWidth.toFixed(1) + "%'></div></td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function renderTable(freqList) {
    var maxPercent = freqList.reduce(function (m, f) {
      return Math.max(m, f.percent);
    }, 0.0001);

    el.freqTableBody.innerHTML = freqList
      .map(function (f) {
        var barWidth = (f.percent / maxPercent) * 100;
        return (
          "<tr>" +
          "<td class='freq-letter'>" + f.letter + "</td>" +
          "<td>" + f.count + "</td>" +
          "<td>" + f.percent.toFixed(1) + "%</td>" +
          "<td class='freq-bar-cell'><div class='freq-bar' style='width:" + barWidth.toFixed(1) + "%'></div></td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function renderGuess(text, lang) {
    var guess = ciphers.guessCaesarShift(text, lang);
    if (!guess.total) {
      el.freqGuessBox.innerHTML = "";
      return;
    }

    el.freqGuessBox.innerHTML =
      "<p class='freq-guess-title'>" + i18n.t("freq-guess-title") + "</p>" +
      "<p class='freq-guess-text'>" + i18n.t("freq-guess-text", { shift: guess.shift }) + "</p>" +
      "<button class='action primary' id='freqApplyBtn' type='button'>" + i18n.t("freq-apply-btn") + "</button>";

    var applyBtn = document.getElementById("freqApplyBtn");
    if (applyBtn) {
      applyBtn.addEventListener("click", function () {
        global.App.game.openCaesarPracticeWithShift(text, guess.shift);
      });
    }
  }

  function analyze() {
    var text = el.freqInput.value;

    if (!text.trim()) {
      el.freqTableBody.innerHTML = "";
      el.freqGuessBox.innerHTML = "<p class='freq-note'>" + i18n.t("freq-empty") + "</p>";
      el.freqDetected.textContent = "";
      return;
    }

    var lang = state.lang || ciphers.detectLanguage(text);
    el.freqLangUk.setAttribute("aria-pressed", lang === "uk" ? "true" : "false");
    el.freqLangEn.setAttribute("aria-pressed", lang === "en" ? "true" : "false");
    el.freqDetected.textContent = i18n.t("freq-detected", {
      lang: i18n.t(lang === "uk" ? "freq-lang-uk" : "freq-lang-en"),
    });

    var freqList = ciphers.letterFrequency(text, lang).sort(function (a, b) {
      return b.count - a.count;
    });
    var hasAny = freqList.some(function (f) {
      return f.count > 0;
    });

    if (!hasAny) {
      el.freqTableBody.innerHTML = "";
      el.freqGuessBox.innerHTML = "<p class='freq-note'>" + i18n.t("freq-no-letters") + "</p>";
      return;
    }

    renderTable(freqList);
    renderGuess(text, lang);
  }

  function wireEvents() {
    el.freqAnalyzeBtn.addEventListener("click", analyze);
    el.freqLangUk.addEventListener("click", function () {
      state.lang = "uk";
      analyze();
    });
    el.freqLangEn.addEventListener("click", function () {
      state.lang = "en";
      analyze();
    });
    el.freqRefLangUk.addEventListener("click", function () {
      renderReferenceTable("uk");
    });
    el.freqRefLangEn.addEventListener("click", function () {
      renderReferenceTable("en");
    });
    document.addEventListener("langchange", function () {
      if (el.freqInput.value.trim()) analyze();
      renderReferenceTable(state.refLang);
    });
  }

  function init() {
    cacheDom();
    wireEvents();
    renderReferenceTable(i18n.lang === "en" ? "en" : "uk");
  }

  global.App = global.App || {};
  global.App.frequency = { init: init };
})(window);
