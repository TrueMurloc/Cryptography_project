// scripts/generate-token.js — Завдання 4г: згенерувати токен окремо від
// сервера, щоб перевірити його на https://jwt.io
//
// Використання:  node scripts/generate-token.js [прізвище]

const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config");
const db = require("../database");

const login = process.argv[2] || "Романенко";

db.initDb().then(() => {
  const user = db.findByLogin(login);
  if (!user) {
    console.error('Користувача "%s" не знайдено в базі.', login);
    process.exit(1);
  }

  const token = jwt.sign({ login: user.login, id: user.id }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: JWT_EXPIRES_IN,
  });

  console.log("Payload:", { login: user.login, id: user.id });
  console.log("\nJWT-токен:\n" + token);
  console.log("\nЩоб перевірити на jwt.io:");
  console.log('  1. Вставте токен у поле "Encoded".');
  console.log('  2. У розділі "Verify signature" вставте секрет:');
  console.log("     " + JWT_SECRET);
  console.log('  3. Підпис має підсвітитися зеленим ("Signature Verified").');
});
