// routes/auth.js — реєстрація/JWT-логін за прізвищем (Завдання 4 + бонус)
// та додаткова авторизація через електронну пошту (з кодом підтвердження).

const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../database");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config");

const router = express.Router();

function issueToken(subject, id) {
  return jwt.sign({ login: subject, id: id }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: JWT_EXPIRES_IN,
  });
}

/* ===================== Класична реєстрація/логін (прізвище/ім'я) ===================== */

// POST /register  { "login": "...", "password": "..." }
router.post("/register", (req, res) => {
  const { login, password } = req.body || {};
  if (!login || !password) {
    return res.status(400).json({ ok: false, message: "Потрібні поля login і password." });
  }
  if (db.findByLogin(login)) {
    return res.status(409).json({ ok: false, message: "Користувач із таким логіном вже існує." });
  }
  const user = db.addUser(login, password);
  res.status(201).json({ ok: true, message: "Користувача зареєстровано.", user: { id: user.id, login: user.login } });
});

// POST /auth/login  { "login": "...", "password": "..." } -> { token }
router.post("/auth/login", (req, res) => {
  const { login, password } = req.body || {};
  if (!login || !password) {
    return res.status(400).json({ ok: false, message: "Потрібні поля login і password." });
  }
  const user = db.verifyPassword(login, password);
  if (!user) {
    return res.status(401).json({ ok: false, message: "Невірний логін або пароль." });
  }
  res.json({ ok: true, token: issueToken(user.login, user.id) });
});

/* ===================== Авторизація через email (додатково) ===================== */

// POST /auth/email/register  { "email": "...", "password": "..." }
// Реальне надсилання листа вимагає SMTP-акаунта, якого тут немає, тож код
// підтвердження для демонстрації просто повертається у відповіді
// (і друкується в консоль сервера) — позначено devCode.
router.post("/auth/email/register", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, message: "Потрібні поля email і password." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, message: "Некоректна адреса пошти." });
  }

  const result = db.registerEmail(email, password);
  if (result.error === "exists") {
    return res.status(409).json({ ok: false, message: "Користувач із такою поштою вже зареєстрований." });
  }

  console.log(`[email-auth] Код підтвердження для ${email}: ${result.code}`);

  res.status(201).json({
    ok: true,
    message: "Акаунт створено. Введіть код підтвердження, надісланий на пошту.",
    user: { id: result.user.id, email: result.user.email },
    devNote: "SMTP не налаштовано: код підтвердження виводиться тут і в консолі сервера лише для демонстрації.",
    devCode: result.code,
  });
});

// POST /auth/email/verify  { "email": "...", "code": "..." }
router.post("/auth/email/verify", (req, res) => {
  const { email, code } = req.body || {};
  if (!email || !code) {
    return res.status(400).json({ ok: false, message: "Потрібні поля email і code." });
  }
  const result = db.verifyEmailCode(email, code);
  if (result.error === "not-found") {
    return res.status(404).json({ ok: false, message: "Користувача з такою поштою не знайдено." });
  }
  if (result.error === "wrong-code") {
    return res.status(400).json({ ok: false, message: "Невірний код підтвердження." });
  }
  if (result.error === "expired") {
    return res.status(410).json({ ok: false, message: "Код підтвердження прострочено. Зареєструйтесь ще раз, щоб отримати новий." });
  }
  res.json({
    ok: true,
    message: result.already ? "Пошту вже було підтверджено раніше." : "Пошту підтверджено. Тепер можна увійти.",
  });
});

// POST /auth/email/login  { "email": "...", "password": "..." } -> { token }
router.post("/auth/email/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ ok: false, message: "Потрібні поля email і password." });
  }
  const result = db.verifyPasswordByEmail(email, password);
  if (result.error === "not-found" || result.error === "wrong-password") {
    return res.status(401).json({ ok: false, message: "Невірна пошта або пароль." });
  }
  if (result.error === "not-verified") {
    return res.status(403).json({ ok: false, message: "Пошту ще не підтверджено. Перевірте код підтвердження." });
  }
  const user = result.user;
  res.json({ ok: true, token: issueToken(user.email, user.id) });
});

module.exports = router;
