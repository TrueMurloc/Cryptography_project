// middleware/verifyToken.js — захищає шлях, вимагаючи валідний
// Bearer-токен у заголовку Authorization (завдання 4г', 4д).

const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

module.exports = function verifyToken(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      ok: false,
      message: "Потрібен Bearer-токен у заголовку Authorization: Bearer <token>.",
    });
  }

  jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }, function (err, decoded) {
    if (err) {
      var message = err.name === "TokenExpiredError" ? "Термін дії токена вичерпано." : "Недійсний токен.";
      return res.status(403).json({ ok: false, message: message });
    }
    req.user = decoded; // { login, id, iat, exp }
    next();
  });
};
