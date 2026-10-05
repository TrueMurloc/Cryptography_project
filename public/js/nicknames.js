/**
 * nicknames.js — генератор позивних.
 * Для української мови позивний складається з Прикметника + Іменника,
 * обидва відмінюються узгоджено в усіх 7 відмінках (іменники — за готовою
 * таблицею форм, прикметники — за регулярною твердою/м'якою моделлю).
 * Для англійської — просто пара слів без відмінків (в англійській
 * граматичних відмінків немає).
 * Користувач також може задати власний позивний: для нього відмінювання
 * не застосовується.
 */
(function (global) {
  "use strict";

  var AGENT_KEY = "pivnichna-zirka-agent-v2";

  // --- Іменники: gender + повна таблиця форм (7 відмінків) -------------
  var NOUNS = [
    { key: "sokil", gender: "m", forms: { nom: "Сокіл", gen: "Сокола", dat: "Соколу", acc: "Сокола", ins: "Соколом", loc: "Соколі", voc: "Соколе" } },
    { key: "tin", gender: "f", forms: { nom: "Тінь", gen: "Тіні", dat: "Тіні", acc: "Тінь", ins: "Тінню", loc: "Тіні", voc: "Тіне" } },
    { key: "vovk", gender: "m", forms: { nom: "Вовк", gen: "Вовка", dat: "Вовкові", acc: "Вовка", ins: "Вовком", loc: "Вовкові", voc: "Вовче" } },
    { key: "burevii", gender: "m", forms: { nom: "Буревій", gen: "Буревія", dat: "Буревієві", acc: "Буревія", ins: "Буревієм", loc: "Буревії", voc: "Буревію" } },
    { key: "inii", gender: "m", forms: { nom: "Іній", gen: "Інію", dat: "Інієві", acc: "Інію", ins: "Інієм", loc: "Інії", voc: "Інію" } },
    { key: "polumya", gender: "n", forms: { nom: "Полум'я", gen: "Полум'я", dat: "Полум'ю", acc: "Полум'я", ins: "Полум'ям", loc: "Полум'ї", voc: "Полум'я" } },
    { key: "voron", gender: "m", forms: { nom: "Ворон", gen: "Ворона", dat: "Ворону", acc: "Ворона", ins: "Вороном", loc: "Вороні", voc: "Вороне" } },
    { key: "kometa", gender: "f", forms: { nom: "Комета", gen: "Комети", dat: "Кометі", acc: "Комету", ins: "Кометою", loc: "Кометі", voc: "Комето" } },
    { key: "blyskavka", gender: "f", forms: { nom: "Блискавка", gen: "Блискавки", dat: "Блискавці", acc: "Блискавку", ins: "Блискавкою", loc: "Блискавці", voc: "Блискавко" } },
    { key: "taifun", gender: "m", forms: { nom: "Тайфун", gen: "Тайфуна", dat: "Тайфуну", acc: "Тайфуна", ins: "Тайфуном", loc: "Тайфуні", voc: "Тайфуне" } },
    { key: "moroz", gender: "m", forms: { nom: "Мороз", gen: "Мороза", dat: "Морозу", acc: "Мороза", ins: "Морозом", loc: "Морозі", voc: "Морозе" } },
    { key: "ekho", gender: "n", forms: { nom: "Ехо", gen: "Ехо", dat: "Ехо", acc: "Ехо", ins: "Ехо", loc: "Ехо", voc: "Ехо" } }, // незмінюване запозичення
  ];

  // --- Прикметники: стем + тип моделі (тверда / м'яка) -----------------
  var ADJ_ENDINGS = {
    hard: {
      m: { nom: "ий", gen: "ого", dat: "ому", acc: "ого", ins: "им", loc: "ому", voc: "ий" },
      f: { nom: "а", gen: "ої", dat: "ій", acc: "у", ins: "ою", loc: "ій", voc: "а" },
      n: { nom: "е", gen: "ого", dat: "ому", acc: "е", ins: "им", loc: "ому", voc: "е" },
    },
    soft: {
      m: { nom: "ій", gen: "ього", dat: "ьому", acc: "ього", ins: "ім", loc: "ьому", voc: "ій" },
      f: { nom: "я", gen: "ьої", dat: "ій", acc: "ю", ins: "ьою", loc: "ій", voc: "я" },
      n: { nom: "є", gen: "ього", dat: "ьому", acc: "є", ins: "ім", loc: "ьому", voc: "є" },
    },
  };

  var ADJECTIVES = [
    { key: "pivnichnyi", stem: "північн", type: "hard" },
    { key: "tykhyi", stem: "тих", type: "hard" },
    { key: "stalevyi", stem: "сталев", type: "hard" },
    { key: "nichnyi", stem: "нічн", type: "hard" },
    { key: "zoryanyi", stem: "зорян", type: "hard" },
    { key: "prykhovanyi", stem: "прихован", type: "hard" },
    { key: "shvydkyi", stem: "швидк", type: "hard" },
    { key: "kholodnyi", stem: "холодн", type: "hard" },
    { key: "ostannii", stem: "останн", type: "soft" },
    { key: "burshtynovyi", stem: "бурштинов", type: "hard" },
  ];

  var CASES = ["nom", "gen", "dat", "acc", "ins", "loc", "voc"];
  var CASE_LABELS_UK = { nom: "Називний", gen: "Родовий", dat: "Давальний", acc: "Знахідний", ins: "Орудний", loc: "Місцевий", voc: "Кличний" };

  var NOUN_EN = ["Falcon", "Shadow", "Wolf", "Storm", "Raven", "Comet", "Lightning", "Typhoon", "Frost", "Echo", "Hawk", "Ghost"];
  var ADJ_EN = ["Northern", "Silent", "Steel", "Night", "Starry", "Hidden", "Swift", "Cold", "Last", "Amber"];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function randomId() {
    return String(Math.floor(10000 + Math.random() * 89999));
  }

  function adjectiveForm(adj, gender, caseKey) {
    return adj.stem + ADJ_ENDINGS[adj.type][gender][caseKey];
  }

  /** Повертає позивний у заданому відмінку (лише для мови 'uk' і не custom). */
  function declineUk(agent, caseKey) {
    var noun = NOUNS.filter(function (n) { return n.key === agent.nounKey; })[0];
    var adj = ADJECTIVES.filter(function (a) { return a.key === agent.adjKey; })[0];
    if (!noun || !adj) return "";
    var form = adjectiveForm(adj, noun.gender, caseKey);
    var capitalized = form.charAt(0).toUpperCase() + form.slice(1);
    return capitalized + " " + noun.forms[caseKey];
  }

  function generateAgent(lang) {
    if (lang === "en") {
      return { custom: false, lang: "en", id: randomId(), text: pick(ADJ_EN) + " " + pick(NOUN_EN) };
    }
    var noun = pick(NOUNS);
    var adj = pick(ADJECTIVES);
    return { custom: false, lang: "uk", id: randomId(), nounKey: noun.key, adjKey: adj.key };
  }

  function customAgent(text) {
    return { custom: true, lang: null, id: randomId(), text: text.trim() };
  }

  /** Форма для показу (за замовчуванням — називний відмінок). */
  function displayName(agent, caseKey) {
    if (!agent) return "";
    if (agent.custom) return agent.text;
    if (agent.lang === "uk") return declineUk(agent, caseKey || "nom");
    return agent.text;
  }

  function save(agent) {
    try {
      localStorage.setItem(AGENT_KEY, JSON.stringify(agent));
    } catch (e) {}
  }

  function load() {
    try {
      var raw = localStorage.getItem(AGENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  global.App = global.App || {};
  global.App.nicknames = {
    CASES: CASES,
    CASE_LABELS_UK: CASE_LABELS_UK,
    generateAgent: generateAgent,
    customAgent: customAgent,
    displayName: displayName,
    save: save,
    load: load,
  };
})(window);
