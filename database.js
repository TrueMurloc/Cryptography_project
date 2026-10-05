// database.js — справжня БД (SQLite через sql.js — чистий WASM, без
// нативної компіляції, тому встановлюється на будь-якій машині без
// build tools). Файл бази лежить у data/bureau.sqlite і переживає
// перезапуск сервера.
//
// Підтримує два типи акаунтів в одній таблиці users:
//   - "класичний": login (прізвище) + password (ім'я)         — Завдання 3-4
//   - "поштовий":  email + password, з підтвердженням кодом    — додаткове завдання

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const initSqlJs = require("sql.js");
const { PASSWORD_HASH_ALGO, EMAIL_CODE_TTL_MINUTES } = require("./config");

const DB_PATH = path.join(__dirname, "data", "bureau.sqlite");

let db = null;

function sha256(text) {
  return crypto.createHash(PASSWORD_HASH_ALGO).update(String(text), "utf8").digest("hex");
}

// Логін/пошта/пароль звіряємо без урахування регістру й зайвих пробілів.
function normalize(text) {
  return String(text).trim().toLowerCase();
}

function persist() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function run(sql, params) {
  db.run(sql, params || []);
  persist();
}

function queryOne(sql, params) {
  const stmt = db.prepare(sql);
  stmt.bind(params || []);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

function queryAll(sql, params) {
  const stmt = db.prepare(sql);
  stmt.bind(params || []);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

async function initDb() {
  const SQL = await initSqlJs();
  db = fs.existsSync(DB_PATH) ? new SQL.Database(fs.readFileSync(DB_PATH)) : new SQL.Database();

  // Увага: SQLite-функція LOWER() розуміє лише ASCII і НЕ приводить
  // кирилицю до нижнього регістру, тому для пошуку без урахування
  // регістру зберігаємо окремі "нормалізовані" колонки, порівняні вже
  // нормалізованим (у JS) значенням — а не SQL LOWER(login).
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      login              TEXT,
      login_norm         TEXT UNIQUE,
      email              TEXT,
      email_norm         TEXT UNIQUE,
      password_hash      TEXT NOT NULL,
      email_verified     INTEGER NOT NULL DEFAULT 0,
      verification_code  TEXT,
      code_expires       INTEGER,
      created_at         TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const countRow = queryOne("SELECT COUNT(*) AS c FROM users");
  if (!countRow || countRow.c === 0) {
    // Завдання 3в: троє користувачів бюро (18 — на 1 вище, 19 — я, 20 — наступна).
    const seed = [
      [18, "Прокіпець", "Богдан"],
      [19, "Романенко", "Михайло"],
      [20, "Стебельська", "Катерина"],
    ];
    seed.forEach(function ([id, login, firstName]) {
      db.run("INSERT INTO users (id, login, login_norm, password_hash, email_verified) VALUES (?,?,?,?,1)", [
        id,
        login,
        normalize(login),
        sha256(normalize(firstName)),
      ]);
    });
    persist();
  }
}

/* ===================== Класичний логін (прізвище/ім'я) ===================== */

function findByLogin(login) {
  if (!login) return null;
  return queryOne("SELECT * FROM users WHERE login_norm = ?", [normalize(login)]);
}

function findById(id) {
  return queryOne("SELECT * FROM users WHERE id = ?", [id]);
}

/** Реєстрація нового користувача за прізвищем/паролем (бонусне завдання). */
function addUser(login, password) {
  if (findByLogin(login)) return null;
  run("INSERT INTO users (login, login_norm, password_hash, email_verified) VALUES (?,?,?,1)", [
    login.trim(),
    normalize(login),
    sha256(normalize(password)),
  ]);
  return findByLogin(login);
}

function verifyPassword(login, password) {
  const user = findByLogin(login);
  if (!user) return null;
  return user.password_hash === sha256(normalize(password)) ? user : null;
}

/* ===================== Авторизація через пошту (додатково) ===================== */

function findByEmail(email) {
  if (!email) return null;
  return queryOne("SELECT * FROM users WHERE email_norm = ?", [normalize(email)]);
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-значний код
}

/** Реєстрація через email: створює непідтверджений акаунт + код підтвердження. */
function registerEmail(email, password) {
  if (findByEmail(email)) return { error: "exists" };
  const code = generateCode();
  const expires = Math.floor(Date.now() / 1000) + EMAIL_CODE_TTL_MINUTES * 60;
  run(
    "INSERT INTO users (email, email_norm, password_hash, email_verified, verification_code, code_expires) VALUES (?,?,?,0,?,?)",
    [email.trim(), normalize(email), sha256(normalize(password)), code, expires]
  );
  return { user: findByEmail(email), code: code };
}

/** Підтвердження пошти кодом (код діє EMAIL_CODE_TTL_MINUTES хвилин). */
function verifyEmailCode(email, code) {
  const user = findByEmail(email);
  if (!user) return { error: "not-found" };
  if (user.email_verified) return { user: user, already: true };
  if (user.code_expires && Math.floor(Date.now() / 1000) > user.code_expires) return { error: "expired" };
  if (String(user.verification_code).trim() !== String(code).trim()) return { error: "wrong-code" };
  run("UPDATE users SET email_verified = 1, verification_code = NULL, code_expires = NULL WHERE id = ?", [user.id]);
  return { user: findById(user.id) };
}

function verifyPasswordByEmail(email, password) {
  const user = findByEmail(email);
  if (!user) return { error: "not-found" };
  if (!user.email_verified) return { error: "not-verified" };
  if (user.password_hash !== sha256(normalize(password))) return { error: "wrong-password" };
  return { user: user };
}

module.exports = {
  initDb,
  sha256,
  normalize,
  findByLogin,
  findById,
  addUser,
  verifyPassword,
  findByEmail,
  registerEmail,
  verifyEmailCode,
  verifyPasswordByEmail,
};
