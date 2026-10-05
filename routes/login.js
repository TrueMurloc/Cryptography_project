// routes/login.js — Завдання 3: шлях /login, доступний лише
// авторизованому користувачу (HTTP Basic Auth), пароль звіряється
// у вигляді SHA256-хешу без солі.

const express = require("express");
const { verifyPassword } = require("../database");

const router = express.Router();

function parseBasicAuth(header) {
  if (!header || !header.startsWith("Basic ")) return null;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const idx = decoded.indexOf(":");
  if (idx === -1) return null;
  return { login: decoded.slice(0, idx), password: decoded.slice(idx + 1) };
}

// GET /login  (заголовок Authorization: Basic base64(прізвище:ім'я))
router.get("/login", (req, res) => {
  const creds = parseBasicAuth(req.headers.authorization);

  if (!creds) {
    res.set("WWW-Authenticate", 'Basic realm="auth-server"');
    return res.status(401).json({
      ok: false,
      message: "Потрібна Basic-авторизація: логін — прізвище, пароль — ім'я.",
    });
  }

  const user = verifyPassword(creds.login, creds.password);

  if (!user) {
    res.set("WWW-Authenticate", 'Basic realm="auth-server"');
    return res.status(401).json({ ok: false, message: "Невірний логін або пароль." });
  }

  // Завдання 3е: повідомлення про успішну авторизацію.
  res.json({
    ok: true,
    message: `Користувач "${user.login}" (id ${user.id}) успішно авторизований.`,
  });
});

module.exports = router;
