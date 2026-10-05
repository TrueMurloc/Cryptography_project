/**
 * app.js — точка входу. i18n.init() спершу (щоб мова була відома до
 * першого рендеру), потім gate.init() показує КПП; сама гра (game.init())
 * запускається зсередини gate.js лише після успішного входу.
 */
document.addEventListener("DOMContentLoaded", function () {
  App.i18n.init();
  App.gate.init();
});
