/**
 * auth.js — клієнт для серверного auth-API (/auth/login, /register,
 * /protected). Токен зберігається в localStorage лише в цього браузера.
 */
(function (global) {
  "use strict";

  var TOKEN_KEY = "north-star-jwt";

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      return null;
    }
  }
  function setToken(t) {
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch (e) {}
  }
  function clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
  }

  /** Декодує payload JWT без перевірки підпису (лише щоб прочитати exp/login/id на клієнті). */
  function decodePayload(token) {
    try {
      var part = token.split(".")[1];
      var b64 = part.replace(/-/g, "+").replace(/_/g, "/");
      var json = decodeURIComponent(
        atob(b64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  function parseJsonSafe(res) {
    return res.json().catch(function () {
      return {};
    });
  }

  var NETWORK_ERROR = "Немає з'єднання із сервером. Переконайтесь, що запущено «npm start» і сторінка відкрита за адресою http://localhost:3000/ (а не подвійним кліком по файлу).";

  /** fetch(), який перетворює мережеву відмову (сервер не запущено, неправильний origin тощо) на зрозуміле повідомлення. */
  function safeFetch(url, options) {
    return fetch(url, options).catch(function (networkErr) {
      console.error("[auth] network error for " + url + ":", networkErr);
      throw new Error(NETWORK_ERROR);
    });
  }

  function login(loginName, password) {
    return safeFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: loginName, password: password }),
    }).then(function (res) {
      return parseJsonSafe(res).then(function (data) {
        if (!res.ok || !data.ok) throw new Error(data.message || "Помилка авторизації.");
        setToken(data.token);
        return decodePayload(data.token);
      });
    });
  }

  function register(loginName, password) {
    return safeFetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login: loginName, password: password }),
    }).then(function (res) {
      return parseJsonSafe(res).then(function (data) {
        if (!res.ok || !data.ok) throw new Error(data.message || "Помилка реєстрації.");
        return data.user;
      });
    });
  }

  /** Перевіряє збережений токен на сервері (шлях /protected, Bearer-заголовок). */
  function checkAccess() {
    var token = getToken();
    if (!token) return Promise.reject(new Error("no-token"));
    return safeFetch("/protected", { headers: { Authorization: "Bearer " + token } }).then(function (res) {
      return parseJsonSafe(res).then(function (data) {
        if (!res.ok || !data.ok) throw new Error(data.message || "no-access");
        return data.tokenPayload; // { login, id, iat, exp }
      });
    });
  }

  function logout() {
    clearToken();
  }

  /* ===================== Email-авторизація (додатково) ===================== */

  function registerEmail(email, password) {
    return safeFetch("/auth/email/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password }),
    }).then(function (res) {
      return parseJsonSafe(res).then(function (data) {
        if (!res.ok || !data.ok) throw new Error(data.message || "Помилка реєстрації.");
        return data; // { user, devNote, devCode }
      });
    });
  }

  function verifyEmail(email, code) {
    return safeFetch("/auth/email/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, code: code }),
    }).then(function (res) {
      return parseJsonSafe(res).then(function (data) {
        if (!res.ok || !data.ok) throw new Error(data.message || "Невірний код.");
        return data;
      });
    });
  }

  function loginEmail(email, password) {
    return safeFetch("/auth/email/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: password }),
    }).then(function (res) {
      return parseJsonSafe(res).then(function (data) {
        if (!res.ok || !data.ok) throw new Error(data.message || "Помилка авторизації.");
        setToken(data.token);
        return decodePayload(data.token);
      });
    });
  }

  global.App = global.App || {};
  global.App.auth = {
    getToken: getToken,
    setToken: setToken,
    clearToken: clearToken,
    decodePayload: decodePayload,
    login: login,
    register: register,
    checkAccess: checkAccess,
    logout: logout,
    registerEmail: registerEmail,
    verifyEmail: verifyEmail,
    loginEmail: loginEmail,
  };
})(window);
