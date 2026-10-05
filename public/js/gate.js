/**
 * gate.js — «пропускний пункт»: показує форму входу/реєстрації, доки
 * немає валідного JWT, і відкриває основний вміст сторінки (#appContent)
 * лише після успішної перевірки токена на сервері (/protected).
 */
(function (global) {
  "use strict";

  var auth = global.App.auth;
  var i18n = global.App.i18n;

  var el = {};
  var timerInterval = null;
  var gameStarted = false;

  function cacheDom() {
    [
      "authGate", "appContent", "sessionBar", "sessionUser", "sessionTimer", "logoutBtn",
      "gateMethodClassic", "gateMethodEmail", "gateClassicBlock", "gateEmailBlock",
      "gateTabLogin", "gateTabRegister", "gateLoginForm", "gateRegisterForm",
      "gateLoginName", "gateLoginPass", "gateLoginError",
      "gateRegLogin", "gateRegPass", "gateRegisterError",
      "gateEmailTabLogin", "gateEmailTabRegister",
      "gateEmailLoginForm", "gateEmailRegisterForm", "gateEmailVerifyForm",
      "gateEmailLoginAddr", "gateEmailLoginPass", "gateEmailLoginError",
      "gateEmailRegAddr", "gateEmailRegPass", "gateEmailRegisterError",
      "gateEmailCode", "gateEmailVerifyError", "gateVerifyNote",
    ].forEach(function (id) {
      el[id] = document.getElementById(id);
    });
  }

  function selectGateTab(tab) {
    var isLogin = tab === "login";
    el.gateTabLogin.setAttribute("aria-selected", isLogin ? "true" : "false");
    el.gateTabRegister.setAttribute("aria-selected", isLogin ? "false" : "true");
    el.gateLoginForm.hidden = !isLogin;
    el.gateRegisterForm.hidden = isLogin;
  }

  function selectGateMethod(method) {
    var isClassic = method === "classic";
    el.gateMethodClassic.setAttribute("aria-selected", isClassic ? "true" : "false");
    el.gateMethodEmail.setAttribute("aria-selected", isClassic ? "false" : "true");
    el.gateClassicBlock.hidden = !isClassic;
    el.gateEmailBlock.hidden = isClassic;
  }

  function selectEmailTab(tab) {
    var isLogin = tab === "login";
    el.gateEmailTabLogin.setAttribute("aria-selected", isLogin ? "true" : "false");
    el.gateEmailTabRegister.setAttribute("aria-selected", isLogin ? "false" : "true");
    el.gateEmailLoginForm.hidden = !isLogin;
    el.gateEmailRegisterForm.hidden = isLogin;
    el.gateEmailVerifyForm.hidden = true;
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function showGate(message) {
    stopTimer();
    el.authGate.hidden = false;
    el.appContent.hidden = true;
    el.sessionBar.hidden = true;
    if (message) el.gateLoginError.textContent = message;
  }

  function showApp(payload) {
    el.authGate.hidden = true;
    el.appContent.hidden = false;
    el.sessionBar.hidden = false;
    el.sessionUser.textContent = payload.login + " · id " + payload.id;
    startTimer(payload.exp);

    if (!gameStarted) {
      global.App.game.init();
      gameStarted = true;
    }
  }

  function formatMMSS(totalSeconds) {
    var m = Math.floor(totalSeconds / 60);
    var s = totalSeconds % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function startTimer(expSeconds) {
    stopTimer();
    function tick() {
      var remaining = expSeconds - Math.floor(Date.now() / 1000);
      if (remaining <= 0) {
        auth.logout();
        showGate(i18n.t("gate-session-expired"));
        return;
      }
      el.sessionTimer.textContent = formatMMSS(remaining);
    }
    tick();
    timerInterval = setInterval(tick, 1000);
  }

  function tryStoredToken() {
    auth
      .checkAccess()
      .then(function (payload) {
        showApp(payload);
      })
      .catch(function () {
        auth.clearToken();
        showGate();
      });
  }

  function wireEvents() {
    el.gateTabLogin.addEventListener("click", function () {
      selectGateTab("login");
    });
    el.gateTabRegister.addEventListener("click", function () {
      selectGateTab("register");
    });

    el.gateLoginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      el.gateLoginError.textContent = "";
      var loginName = el.gateLoginName.value.trim();
      var pass = el.gateLoginPass.value;
      auth
        .login(loginName, pass)
        .then(function (payload) {
          el.gateLoginPass.value = "";
          showApp(payload);
        })
        .catch(function (err) {
          el.gateLoginError.textContent = err.message;
        });
    });

    el.gateRegisterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      el.gateRegisterError.textContent = "";
      var loginName = el.gateRegLogin.value.trim();
      var pass = el.gateRegPass.value;
      auth
        .register(loginName, pass)
        .then(function (user) {
          el.gateRegisterForm.reset();
          selectGateTab("login");
          el.gateLoginName.value = user.login;
          el.gateLoginError.textContent = i18n.t("gate-register-success");
        })
        .catch(function (err) {
          el.gateRegisterError.textContent = err.message;
        });
    });

    el.logoutBtn.addEventListener("click", function () {
      auth.logout();
      showGate();
    });

    el.gateMethodClassic.addEventListener("click", function () {
      selectGateMethod("classic");
    });
    el.gateMethodEmail.addEventListener("click", function () {
      selectGateMethod("email");
    });
    el.gateEmailTabLogin.addEventListener("click", function () {
      selectEmailTab("login");
    });
    el.gateEmailTabRegister.addEventListener("click", function () {
      selectEmailTab("register");
    });

    el.gateEmailLoginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      el.gateEmailLoginError.textContent = "";
      var email = el.gateEmailLoginAddr.value.trim();
      var pass = el.gateEmailLoginPass.value;
      auth
        .loginEmail(email, pass)
        .then(function (payload) {
          el.gateEmailLoginPass.value = "";
          showApp(payload);
        })
        .catch(function (err) {
          el.gateEmailLoginError.textContent = err.message;
        });
    });

    el.gateEmailRegisterForm.addEventListener("submit", function (e) {
      e.preventDefault();
      el.gateEmailRegisterError.textContent = "";
      var email = el.gateEmailRegAddr.value.trim();
      var pass = el.gateEmailRegPass.value;
      auth
        .registerEmail(email, pass)
        .then(function (data) {
          el.gateEmailRegisterForm.hidden = true;
          el.gateEmailVerifyForm.hidden = false;
          el.gateEmailVerifyForm.dataset.email = email;
          el.gateVerifyNote.textContent = i18n.t("gate-verify-note", { email: email }) + " " + data.devNote + " (" + i18n.t("gate-verify-devcode") + ": " + data.devCode + ")";
        })
        .catch(function (err) {
          el.gateEmailRegisterError.textContent = err.message;
        });
    });

    el.gateEmailVerifyForm.addEventListener("submit", function (e) {
      e.preventDefault();
      el.gateEmailVerifyError.textContent = "";
      var email = el.gateEmailVerifyForm.dataset.email;
      var code = el.gateEmailCode.value.trim();
      auth
        .verifyEmail(email, code)
        .then(function () {
          el.gateEmailVerifyForm.hidden = true;
          el.gateEmailCode.value = "";
          selectEmailTab("login");
          el.gateEmailLoginAddr.value = email;
          el.gateEmailLoginError.textContent = i18n.t("gate-register-success");
        })
        .catch(function (err) {
          el.gateEmailVerifyError.textContent = err.message;
        });
    });

    document.addEventListener("langchange", function () {
      // повідомлення про помилки лишаємо як є (не перекладаємо вже показані),
      // але статичні підписи форми оновлює App.i18n.apply() через data-i18n.
    });
  }

  function init() {
    cacheDom();
    wireEvents();
    selectGateTab("login");
    selectGateMethod("classic");
    selectEmailTab("login");
    tryStoredToken();
  }

  global.App = global.App || {};
  global.App.gate = { init: init };
})(window);
