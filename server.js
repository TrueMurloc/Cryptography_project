// server.js — об'єднаний сервер: віддає сайт (public/) і всі auth-шляхи
// (Basic Auth /login, реєстрація, JWT /auth/login, email-авторизація,
// захищений /protected). БД ініціалізується асинхронно перед стартом.

const path = require("path");
const express = require("express");
const { PORT } = require("./config");
const db = require("./database");
const verifyToken = require("./middleware/verifyToken");

const loginRoute = require("./routes/login"); // GET /login (Basic Auth) — Завдання 3
const authRoutes = require("./routes/auth"); // POST /register, /auth/login, /auth/email/* — Завдання 4 + бонус

const app = express();
app.use(express.json());

app.use(loginRoute);
app.use(authRoutes);

app.get("/protected", verifyToken, (req, res) => {
  res.json({
    ok: true,
    message: `Доступ дозволено. Вітаємо, ${req.user.login} (id ${req.user.id})!`,
    tokenPayload: req.user,
  });
});

app.use(express.static(path.join(__dirname, "public")));

db.initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Сервер запущено: http://localhost:${PORT}`);
      console.log(`БД: data/bureau.sqlite`);
    });
  })
  .catch((err) => {
    console.error("Не вдалося ініціалізувати базу даних:", err);
    process.exit(1);
  });

module.exports = app;
