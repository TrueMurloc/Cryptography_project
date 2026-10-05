/**
 * ciphers.js — чиста логіка шифрування, без звернень до DOM.
 * Підтримує українську (33 літери) та англійську (26 літер) абетки одночасно:
 * кожен символ обробляється у "своїй" абетці, решта символів (цифри,
 * пробіли, пунктуація) лишається без змін.
 */
(function (global) {
  "use strict";

  var UA = "АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ"; // 33 літери
  var EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // 26 letters
  var FILLER = "_";

  function alphabetLength(lang) {
    return lang === "uk" ? UA.length : EN.length;
  }

  function shiftChar(ch, shift) {
    var isUpper = ch === ch.toUpperCase();
    var upper = ch.toUpperCase();

    var idxUA = UA.indexOf(upper);
    if (idxUA !== -1) {
      var n = UA.length;
      var res = UA[(((idxUA + shift) % n) + n) % n];
      return isUpper ? res : res.toLowerCase();
    }

    var idxEN = EN.indexOf(upper);
    if (idxEN !== -1) {
      var n2 = EN.length;
      var res2 = EN[(((idxEN + shift) % n2) + n2) % n2];
      return isUpper ? res2 : res2.toLowerCase();
    }

    return ch;
  }

  /** Шифр Цезаря: зсуває кожну літеру на `shift` кроків по її абетці. */
  function caesar(text, shift, decrypt) {
    var s = decrypt ? -shift : shift;
    var out = "";
    for (var i = 0; i < text.length; i++) {
      out += shiftChar(text[i], s);
    }
    return out;
  }

  /** Порядок читання стовпців за ключовим словом (стійке сортування). */
  function columnOrder(keyword) {
    var arr = keyword.split("").map(function (ch, i) {
      return { ch: ch.toUpperCase(), i: i };
    });
    arr.sort(function (a, b) {
      if (a.ch < b.ch) return -1;
      if (a.ch > b.ch) return 1;
      return a.i - b.i;
    });
    return arr.map(function (o) {
      return o.i;
    });
  }

  /** Шифр перестановки (стовпчикова транспозиція) за ключовим словом. */
  function transpositionEncrypt(text, keyword) {
    var cols = keyword.length;
    if (cols < 1) return { cipher: "", grid: [], order: [], rows: 0, cols: 0 };

    var rows = Math.ceil(text.length / cols) || 1;
    var padded = text;
    while (padded.length < rows * cols) {
      padded += FILLER;
    }

    var grid = [];
    for (var r = 0; r < rows; r++) {
      grid.push(padded.slice(r * cols, r * cols + cols).split(""));
    }

    var order = columnOrder(keyword);
    var out = "";
    order.forEach(function (colIdx) {
      for (var r = 0; r < rows; r++) out += grid[r][colIdx];
    });

    return { cipher: out, grid: grid, order: order, rows: rows, cols: cols };
  }

  function transpositionDecrypt(cipher, keyword) {
    var cols = keyword.length;
    if (cols < 1) return { plain: "", grid: [], order: [], rows: 0, cols: 0 };

    var rows = Math.ceil(cipher.length / cols) || 1;
    var order = columnOrder(keyword);

    var grid = [];
    for (var r = 0; r < rows; r++) grid.push(new Array(cols).fill(""));

    var pos = 0;
    order.forEach(function (colIdx) {
      for (var r = 0; r < rows; r++) {
        grid[r][colIdx] = cipher[pos] || FILLER;
        pos++;
      }
    });

    var out = "";
    for (var r = 0; r < rows; r++) out += grid[r].join("");
    out = out.replace(new RegExp(FILLER + "+$"), "");

    return { plain: out, grid: grid, order: order, rows: rows, cols: cols };
  }

  /* ===================== Частотний аналіз ===================== */

  // Приблизні (орієнтовні) частоти літер у відсотках — для української
  // та англійської мов. Використовуються лише для навчальної атаки на
  // шифр Цезаря методом частотного аналізу; це не точна статистика з
  // корпусу, а усереднені, добре відомі в криптографії орієнтири.
  var REFERENCE_FREQ = {
    en: {
      E: 12.7, T: 9.1, A: 8.2, O: 7.5, I: 7.0, N: 6.7, S: 6.3, H: 6.1, R: 6.0,
      D: 4.3, L: 4.0, C: 2.8, U: 2.8, M: 2.4, W: 2.4, F: 2.2, G: 2.0, Y: 2.0,
      P: 1.9, B: 1.5, V: 1.0, K: 0.8, J: 0.15, X: 0.15, Q: 0.10, Z: 0.07,
    },
    uk: {
      О: 9.3, А: 7.2, Н: 6.6, И: 6.0, Т: 6.1, Е: 4.8, В: 5.4, І: 5.4, Р: 4.6,
      С: 4.7, Л: 4.1, К: 3.5, М: 3.2, У: 3.2, Д: 2.8, П: 2.7, Я: 2.5, З: 2.1,
      Ь: 1.8, Б: 1.6, Г: 1.6, Ч: 1.3, Й: 1.0, Х: 0.8, Ж: 0.9, Ю: 0.6, Ш: 0.8,
      Ц: 0.5, Щ: 0.3, Ф: 0.3, Є: 0.8, Ї: 0.4, Ґ: 0.01,
    },
  };

  /**
   * Рахує, скільки разів і який відсоток від усіх літер тексту припадає
   * на кожну літеру заданої абетки (UA або EN). Регістр не враховується,
   * символи поза абеткою (цифри, пробіли, пунктуація, літери іншої мови)
   * ігноруються й не входять у загальну кількість.
   */
  function letterFrequency(text, lang) {
    var alphabet = lang === "uk" ? UA : EN;
    var counts = {};
    alphabet.split("").forEach(function (l) {
      counts[l] = 0;
    });

    var total = 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i].toUpperCase();
      if (counts.hasOwnProperty(ch)) {
        counts[ch]++;
        total++;
      }
    }

    return alphabet.split("").map(function (l) {
      return { letter: l, count: counts[l], percent: total ? (counts[l] / total) * 100 : 0 };
    });
  }

  /** Визначає, якої абетки (uk/en) у тексті більше — для автовизначення мови. */
  function detectLanguage(text) {
    var uaCount = 0;
    var enCount = 0;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i].toUpperCase();
      if (UA.indexOf(ch) !== -1) uaCount++;
      else if (EN.indexOf(ch) !== -1) enCount++;
    }
    return uaCount >= enCount ? "uk" : "en";
  }

  /**
   * Класична атака на шифр Цезаря частотним аналізом: перебирає всі
   * можливі зсуви й обирає той, що дає найкращу кореляцію спостереженого
   * розподілу літер з еталонним розподілом мови. Повертає зсув, який
   * можна одразу підставити в caesar(cipher, shift, true).
   */
  function guessCaesarShift(ciphertext, lang) {
    var alphabet = lang === "uk" ? UA : EN;
    var n = alphabet.length;
    var ref = REFERENCE_FREQ[lang] || {};

    var observed = new Array(n).fill(0);
    var total = 0;
    for (var i = 0; i < ciphertext.length; i++) {
      var idx = alphabet.indexOf(ciphertext[i].toUpperCase());
      if (idx !== -1) {
        observed[idx]++;
        total++;
      }
    }
    if (!total) return { shift: 0, confidence: 0 };

    var refArr = alphabet.split("").map(function (l) {
      return ref[l] || 0;
    });

    var bestShift = 0;
    var bestScore = -Infinity;
    for (var s = 0; s < n; s++) {
      var score = 0;
      for (var i2 = 0; i2 < n; i2++) {
        score += refArr[i2] * observed[(i2 + s) % n];
      }
      if (score > bestScore) {
        bestScore = score;
        bestShift = s;
      }
    }
    return { shift: bestShift, score: bestScore, total: total };
  }

  global.App = global.App || {};
  global.App.ciphers = {
    UA: UA,
    EN: EN,
    FILLER: FILLER,
    alphabetLength: alphabetLength,
    caesar: caesar,
    transposition: {
      encrypt: transpositionEncrypt,
      decrypt: transpositionDecrypt,
      columnOrder: columnOrder,
    },
    REFERENCE_FREQ: REFERENCE_FREQ,
    letterFrequency: letterFrequency,
    detectLanguage: detectLanguage,
    guessCaesarShift: guessCaesarShift,
  };
})(window);
