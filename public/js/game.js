/**
 * game.js — вся робота з DOM: перемикання режимів/вкладок, практика,
 * рівні-виклики, позивний агента, журнал перехоплень.
 */
(function (global) {
  "use strict";

  var ciphers = global.App.ciphers;
  var i18n = global.App.i18n;
  var nick = global.App.nicknames;
  var levels = global.App.levels;

  var LOG_KEY = "pivnichna-zirka-log-v2";
  var svgNS = "http://www.w3.org/2000/svg";

  var el = {}; // кеш DOM-елементів, заповнюється в init()
  var state = {
    mode: "practice", // 'practice' | 'levels'
    practiceTab: "caesar", // 'caesar' | 'transposition' | 'frequency'
    levelsTab: "caesar", // 'caesar' | 'transposition'
    agent: null,
    activeChallenge: null,
  };

  /* ================= Журнал перехоплень ================= */

  function loadLog() {
    try {
      var raw = localStorage.getItem(LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
  function saveLog(entries) {
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(entries));
    } catch (e) {}
  }
  function truncate(s, n) {
    s = s || "";
    return s.length > n ? s.slice(0, n) + "…" : s;
  }
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function renderLog() {
    var entries = loadLog();
    if (!entries.length) {
      el.logList.innerHTML = '<div class="log-empty" data-i18n="log-empty">' + i18n.t("log-empty") + "</div>";
      return;
    }
    el.logList.innerHTML = entries
      .map(function (e) {
        var time = new Date(e.ts);
        var timeStr = time.toLocaleString(i18n.lang === "uk" ? "uk-UA" : "en-GB", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
        var lines = e.isLevel
          ? '<div class="line">' + escapeHtml(e.summary) + "</div>"
          : '<div class="line"><b>' + i18n.t("log-in") + ":</b> " + escapeHtml(truncate(e.inputText, 90)) + "</div>" +
            '<div class="line"><b>' + i18n.t("log-out") + ":</b> " + escapeHtml(truncate(e.outputText, 90)) + "</div>";
        return (
          '<div class="telegram">' +
          '<div class="meta"><span class="kind">' + escapeHtml(e.kind) + "</span><span>" + timeStr + "</span></div>" +
          lines +
          "</div>"
        );
      })
      .join("");
  }
  function addLog(entry) {
    entry.ts = Date.now();
    var entries = loadLog();
    entries.unshift(entry);
    if (entries.length > 40) entries = entries.slice(0, 40);
    saveLog(entries);
    renderLog();
  }

  /* ================= Позивний агента ================= */

  function refreshBadge() {
    var a = state.agent;
    el.badgeId.textContent = "ID: " + (a.id || "00000");
    el.badgeName.textContent = nick.displayName(a, "nom");

    var showCases = a.lang === "uk" && !a.custom;
    el.casesToggleBtn.hidden = a.custom; // для власного позивного відмінки не показуємо
    if (!showCases) {
      el.casesPanel.hidden = true;
    }
    renderCasesTable();
  }

  function renderCasesTable() {
    var a = state.agent;
    if (a.custom) {
      el.casesPanel.innerHTML = '<p class="cases-note">' + i18n.t("badge-custom-note") + "</p>";
      return;
    }
    if (a.lang !== "uk") {
      el.casesPanel.innerHTML = '<p class="cases-note">' + i18n.t("badge-en-note") + "</p>";
      return;
    }
    var rows = nick.CASES.map(function (c) {
      return (
        "<tr><th>" + nick.CASE_LABELS_UK[c] + "</th><td>" + nick.displayName(a, c) + "</td></tr>"
      );
    }).join("");
    el.casesPanel.innerHTML = "<table>" + rows + "</table>";
  }

  function setAgent(agent) {
    state.agent = agent;
    nick.save(agent);
    refreshBadge();
  }

  /* ================= Режими / вкладки ================= */

  function selectMode(mode) {
    state.mode = mode;
    el.modePractice.setAttribute("aria-selected", mode === "practice" ? "true" : "false");
    el.modeLevels.setAttribute("aria-selected", mode === "levels" ? "true" : "false");
    el.practiceSection.hidden = mode !== "practice";
    el.levelsSection.hidden = mode !== "levels";
  }

  // Вкладки режиму "Практика" — три незалежні інструменти (Цезар,
  // перестановка, частотний аналіз), не пов'язані з рівнями.
  function selectPracticeTab(type) {
    state.practiceTab = type;
    el.tabCaesar.setAttribute("aria-selected", type === "caesar" ? "true" : "false");
    el.tabTransp.setAttribute("aria-selected", type === "transposition" ? "true" : "false");
    el.tabFreq.setAttribute("aria-selected", type === "frequency" ? "true" : "false");

    el.panelCaesar.hidden = type !== "caesar";
    el.panelTransp.hidden = type !== "transposition";
    el.panelFreq.hidden = type !== "frequency";
  }

  // Вкладки режиму "Рівні" — лише Цезар/перестановка (частотний аналіз —
  // окремий інструмент-практика, рівнів для нього немає).
  function selectLevelsTab(type) {
    state.levelsTab = type;
    var isCaesar = type === "caesar";

    el.levelTabCaesar.setAttribute("aria-selected", isCaesar ? "true" : "false");
    el.levelTabTransp.setAttribute("aria-selected", isCaesar ? "false" : "true");

    el.levelsCaesar.hidden = !isCaesar;
    el.levelsTransp.hidden = isCaesar;

    closeChallenge();
  }

  /** Перемикає на вкладку "Цезар" у Практиці й підставляє готовий зсув
   * (використовується кнопкою "застосувати" з інструмента частотного
   * аналізу). */
  function openCaesarPracticeWithShift(ciphertext, shift) {
    selectMode("practice");
    selectPracticeTab("caesar");
    el.caesarInput.value = ciphertext;
    syncShift(shift);
    el.caesarResult.textContent = ciphers.caesar(ciphertext, shift, true);
  }

  /* ================= Диск Цезаря (практика) ================= */

  function drawRing(group, radius, color) {
    group.innerHTML = "";
    var n = ciphers.UA.length;
    for (var i = 0; i < n; i++) {
      var angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      var x = 110 + radius * Math.cos(angle);
      var y = 110 + radius * Math.sin(angle);
      var t = document.createElementNS(svgNS, "text");
      t.setAttribute("x", x);
      t.setAttribute("y", y);
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("dominant-baseline", "middle");
      t.setAttribute("font-family", "'JetBrains Mono', monospace");
      t.setAttribute("font-size", "9.5");
      t.setAttribute("fill", color);
      t.textContent = ciphers.UA[i];
      group.appendChild(t);
    }
  }

  function setWheel(shift) {
    var deg = (shift / ciphers.UA.length) * 360;
    el.innerRing.style.transform = "rotate(" + deg + "deg)";
  }

  function syncShift(v) {
    v = Math.max(0, Math.min(32, parseInt(v, 10) || 0));
    el.shiftRange.value = v;
    el.shiftNum.value = v;
    setWheel(v);
  }

  function runCaesarPractice(decrypt) {
    var shift = parseInt(el.shiftNum.value, 10) || 0;
    var text = el.caesarInput.value;
    var out = ciphers.caesar(text, shift, decrypt);
    el.caesarResult.textContent = out || "—";
    addLog({
      kind: i18n.t("tab-caesar") + " · " + (decrypt ? i18n.t("log-decrypted") : i18n.t("log-encrypted")) + " · " + i18n.t("log-shift") + " " + shift,
      inputText: text,
      outputText: out,
    });
  }

  /* ================= Транспозиція (практика) ================= */

  function cleanKey(k) {
    var v = (k || "").trim();
    return v.length ? v : "KEY";
  }

  function renderGrid(container, grid, order, cols) {
    if (!grid || !grid.length) {
      container.innerHTML = "";
      return;
    }
    var rank = new Array(cols);
    order.forEach(function (colIdx, readPos) {
      rank[colIdx] = readPos + 1;
    });
    var html = "<table><thead><tr>";
    for (var c = 0; c < cols; c++) html += "<th>" + rank[c] + "</th>";
    html += "</tr></thead><tbody>";
    grid.forEach(function (row) {
      html += "<tr>";
      row.forEach(function (ch) {
        var cls = ch === ciphers.FILLER ? ' class="filler"' : "";
        html += "<td" + cls + ">" + (ch === " " ? "·" : ch) + "</td>";
      });
      html += "</tr>";
    });
    html += "</tbody></table>";
    container.innerHTML = html;
  }

  function runTranspPractice(decrypt) {
    var key = cleanKey(el.transpKey.value);
    var text = el.transpInput.value;
    if (decrypt) {
      var r = ciphers.transposition.decrypt(text, key);
      el.transpResult.textContent = r.plain || "—";
      renderGrid(el.transpGrid, r.grid, r.order, r.cols);
      addLog({ kind: i18n.t("tab-transp") + " · " + i18n.t("log-decrypted") + " · " + i18n.t("log-key") + " «" + key + "»", inputText: text, outputText: r.plain });
    } else {
      var e = ciphers.transposition.encrypt(text, key);
      el.transpResult.textContent = e.cipher || "—";
      renderGrid(el.transpGrid, e.grid, e.order, e.cols);
      addLog({ kind: i18n.t("tab-transp") + " · " + i18n.t("log-encrypted") + " · " + i18n.t("log-key") + " «" + key + "»", inputText: text, outputText: e.cipher });
    }
  }

  /* ================= Копіювання ================= */

  function wireCopyButtons() {
    document.querySelectorAll(".copy-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = document.getElementById(btn.getAttribute("data-copy-target"));
        var text = target ? target.textContent : "";
        if (!text || text === "—") return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard
            .writeText(text)
            .then(function () {
              var old = btn.textContent;
              btn.textContent = i18n.t("copy-done");
              setTimeout(function () {
                btn.textContent = old;
              }, 1200);
            })
            .catch(function () {});
        }
      });
    });
  }

  /* ================= Режим «Рівні» — картки рівнів ================= */

  function renderLevelCards(container, cipherType) {
    container.innerHTML = "";
    levels.CONFIG[cipherType].forEach(function (cfg) {
      var done = levels.isComplete(cipherType, cfg.id);
      var card = document.createElement("button");
      card.type = "button";
      card.className = "level-card" + (done ? " done" : "");
      card.innerHTML =
        '<span class="level-num">' + i18n.t("level-label") + " " + cfg.id + "</span>" +
        '<span class="level-diff">' + i18n.t("level-" + cfg.difficulty) + "</span>" +
        '<span class="level-status">' + (done ? "✓ " + i18n.t("level-done") : i18n.t("level-locked")) + "</span>";
      card.addEventListener("click", function () {
        startChallenge(cipherType, cfg.id);
      });
      container.appendChild(card);
    });
  }

  function renderAllLevelCards() {
    renderLevelCards(el.levelsCaesarCards, "caesar");
    renderLevelCards(el.levelsTranspCards, "transposition");
  }

  function closeChallenge() {
    state.activeChallenge = null;
    el.challengePanel.hidden = true;
  }

  function startChallenge(cipherType, levelId) {
    var challenge = levels.generateChallenge(cipherType, levelId, i18n.lang);
    state.activeChallenge = challenge;

    el.challengePanel.hidden = false;
    el.challengeFeedback.textContent = "";
    el.challengeFeedback.className = "challenge-feedback";
    el.challengeCipherText.textContent = challenge.ciphertext;
    el.challengeTitle.textContent = i18n.t("level-label") + " " + levelId + " · " + i18n.t(cipherType === "caesar" ? "tab-caesar" : "tab-transp");

    el.challengeCaesarControls.hidden = cipherType !== "caesar";
    el.challengeTranspControls.hidden = cipherType === "caesar";

    if (cipherType === "caesar") {
      el.challengeShiftRange.max = challenge.keyMax > 9 ? 32 : 9;
      el.challengeShiftRange.value = 0;
      el.challengeShiftNum.value = 0;
      updateChallengePreview();
    } else {
      el.challengeKeyInput.value = "";
      el.challengeGrid.innerHTML = "";
      el.challengePreview.textContent = "—";
    }

    // прокрутити до панелі виклику
    el.challengePanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function updateChallengePreview() {
    var c = state.activeChallenge;
    if (!c) return;
    if (c.cipherType === "caesar") {
      var shift = parseInt(el.challengeShiftNum.value, 10) || 0;
      var decoded = ciphers.caesar(c.ciphertext, shift, true);
      el.challengePreview.textContent = decoded;
    } else {
      var key = (el.challengeKeyInput.value || "").trim();
      if (!key) {
        el.challengePreview.textContent = "—";
        el.challengeGrid.innerHTML = "";
        return;
      }
      var r = ciphers.transposition.decrypt(c.ciphertext, key);
      el.challengePreview.textContent = r.plain;
      renderGrid(el.challengeGrid, r.grid, r.order, r.cols);
    }
  }

  function checkChallenge() {
    var c = state.activeChallenge;
    if (!c) return;
    var attempt = el.challengePreview.textContent;
    var ok = levels.checkAnswer(c, attempt);

    if (ok) {
      levels.markComplete(c.cipherType, c.levelId);
      el.challengeFeedback.textContent = "✓ " + i18n.t("check-success");
      el.challengeFeedback.className = "challenge-feedback ok";
      renderAllLevelCards();
      addLog({
        kind: i18n.t(c.cipherType === "caesar" ? "tab-caesar" : "tab-transp") + " · " + i18n.t("level-label") + " " + c.levelId,
        isLevel: true,
        summary: "🏁 " + i18n.t("log-level-pass") + " — “" + c.plaintext + "” (" + i18n.t("log-key") + ": " + c.key + ")",
      });
    } else {
      el.challengeFeedback.textContent = "✗ " + i18n.t("check-fail");
      el.challengeFeedback.className = "challenge-feedback fail";
    }
  }

  function showHint() {
    var c = state.activeChallenge;
    if (!c) return;
    var text =
      c.cipherType === "caesar"
        ? i18n.t("hint-caesar", { min: c.keyMin, max: c.keyMax })
        : i18n.t("hint-transp", { len: c.key.length });
    el.challengeFeedback.textContent = "💡 " + text;
    el.challengeFeedback.className = "challenge-feedback";
  }

  /* ================= Ініціалізація ================= */

  function cacheDom() {
    var ids = [
      "modePractice", "modeLevels", "practiceSection", "levelsSection",
      "tabCaesar", "tabTransp", "tabFreq", "panelCaesar", "panelTransp", "panelFreq",
      "levelTabCaesar", "levelTabTransp", "levelsCaesar", "levelsTransp",
      "levelsCaesarCards", "levelsTranspCards",
      "innerRing", "outerRing", "shiftRange", "shiftNum", "caesarInput", "caesarResult",
      "caesarEncryptBtn", "caesarDecryptBtn", "caesarClearBtn",
      "transpKey", "transpInput", "transpResult", "transpGrid",
      "transpEncryptBtn", "transpDecryptBtn", "transpClearBtn",
      "challengePanel", "challengeTitle", "challengeCipherText", "challengeFeedback",
      "challengeCaesarControls", "challengeShiftRange", "challengeShiftNum",
      "challengeTranspControls", "challengeKeyInput", "challengeGrid",
      "challengePreview", "challengeCheckBtn", "challengeHintBtn", "challengeNewBtn", "challengeCloseBtn",
      "badgeId", "badgeName", "generateAgentBtn", "customToggleBtn", "customInput", "customSaveBtn",
      "casesToggleBtn", "casesPanel",
      "logList", "clearLogBtn", "langToggleBtn",
    ];
    ids.forEach(function (id) {
      el[id] = document.getElementById(id);
    });
  }

  function wireEvents() {
    el.modePractice.addEventListener("click", function () { selectMode("practice"); });
    el.modeLevels.addEventListener("click", function () { selectMode("levels"); });

    el.tabCaesar.addEventListener("click", function () { selectPracticeTab("caesar"); });
    el.tabTransp.addEventListener("click", function () { selectPracticeTab("transposition"); });
    el.tabFreq.addEventListener("click", function () { selectPracticeTab("frequency"); });
    el.levelTabCaesar.addEventListener("click", function () { selectLevelsTab("caesar"); });
    el.levelTabTransp.addEventListener("click", function () { selectLevelsTab("transposition"); });

    el.shiftRange.addEventListener("input", function () { syncShift(el.shiftRange.value); });
    el.shiftNum.addEventListener("input", function () { syncShift(el.shiftNum.value); });
    el.caesarEncryptBtn.addEventListener("click", function () { runCaesarPractice(false); });
    el.caesarDecryptBtn.addEventListener("click", function () { runCaesarPractice(true); });
    el.caesarClearBtn.addEventListener("click", function () {
      el.caesarInput.value = "";
      el.caesarResult.textContent = "—";
    });

    el.transpEncryptBtn.addEventListener("click", function () { runTranspPractice(false); });
    el.transpDecryptBtn.addEventListener("click", function () { runTranspPractice(true); });
    el.transpClearBtn.addEventListener("click", function () {
      el.transpInput.value = "";
      el.transpResult.textContent = "—";
      el.transpGrid.innerHTML = "";
    });

    el.challengeShiftRange.addEventListener("input", function () {
      el.challengeShiftNum.value = el.challengeShiftRange.value;
      updateChallengePreview();
    });
    el.challengeShiftNum.addEventListener("input", function () {
      el.challengeShiftRange.value = el.challengeShiftNum.value;
      updateChallengePreview();
    });
    el.challengeKeyInput.addEventListener("input", updateChallengePreview);
    el.challengeCheckBtn.addEventListener("click", checkChallenge);
    el.challengeHintBtn.addEventListener("click", showHint);
    el.challengeNewBtn.addEventListener("click", function () {
      var c = state.activeChallenge;
      if (c) startChallenge(c.cipherType, c.levelId);
    });
    el.challengeCloseBtn.addEventListener("click", closeChallenge);

    el.generateAgentBtn.addEventListener("click", function () {
      setAgent(nick.generateAgent(i18n.lang));
    });
    el.customToggleBtn.addEventListener("click", function () {
      el.customInput.hidden = !el.customInput.hidden;
      el.customSaveBtn.hidden = !el.customSaveBtn.hidden;
      if (!el.customInput.hidden) el.customInput.focus();
    });
    el.customSaveBtn.addEventListener("click", function () {
      var v = el.customInput.value.trim();
      if (!v) return;
      setAgent(nick.customAgent(v));
      el.customInput.hidden = true;
      el.customSaveBtn.hidden = true;
      el.customInput.value = "";
    });
    el.casesToggleBtn.addEventListener("click", function () {
      el.casesPanel.hidden = !el.casesPanel.hidden;
    });

    el.clearLogBtn.addEventListener("click", function () {
      saveLog([]);
      renderLog();
    });

    el.langToggleBtn.addEventListener("click", function () {
      i18n.toggle();
    });

    document.addEventListener("langchange", function () {
      refreshBadge();
      renderAllLevelCards();
      renderLog();
      if (state.activeChallenge) closeChallenge();
    });
  }

  function init() {
    cacheDom();
    wireEvents();
    wireCopyButtons();

    drawRing(el.outerRing, 87, "#90a2b0");
    drawRing(el.innerRing, 55, "#f2a93c");
    syncShift(3);

    selectMode("practice");
    selectPracticeTab("caesar");
    selectLevelsTab("caesar");

    var savedAgent = nick.load() || nick.generateAgent(i18n.lang);
    state.agent = savedAgent;
    refreshBadge();

    renderAllLevelCards();
    renderLog();

    if (global.App.frequency) global.App.frequency.init();
  }

  global.App = global.App || {};
  global.App.game = {
    init: init,
    openCaesarPracticeWithShift: openCaesarPracticeWithShift,
  };
})(window);
