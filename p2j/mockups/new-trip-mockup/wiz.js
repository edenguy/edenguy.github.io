/* Wizard ("Guide me") over the full form: the same widgets and answers, shown one step at a time.
   Steps: 1 where, 2 when, 3 who, 4 likes/avoid, 5 food, 6 mobility, 7 pace/budget/languages, 8 e-mail. */
window.WIZ = (function () {
  var $ = function (s) { return document.querySelector(s); };
  var N = 8, OPTIONAL = { 3: 1, 4: 1, 5: 1, 6: 1, 7: 1 }, on = false, cur = 1;
  var form = function () { return $('#form-f'); };
  function t(k, p) { var L = document.documentElement.lang === 'he' ? 'he' : 'en', s = I18N[L][k] != null ? I18N[L][k] : k; for (var x in p || {}) s = s.replace('{' + x + '}', p[x]); return s; }

  function render() {
    var f = form();
    f.classList.toggle('wiz-on', on);
    $('#wz-start-box').hidden = on; $('#wz-top').hidden = !on; $('#wz-nav').hidden = !on;
    Array.prototype.forEach.call(f.querySelectorAll('[data-wz]'), function (e) { e.hidden = on && +e.dataset.wz !== cur; });
    if (!on) return;
    var last = cur === N;
    $('#wz-count').textContent = t('wzCount', { n: cur, m: N });
    var bar = $('#wz-bar'); bar.setAttribute('aria-valuenow', cur); bar.setAttribute('aria-valuetext', t('wzCount', { n: cur, m: N }));
    bar.firstElementChild.style.width = (cur / N * 100) + '%';
    $('#wz-q').textContent = t('wq' + cur);
    $('#wz-back').disabled = cur === 1;
    $('#wz-skip').hidden = !OPTIONAL[cur];
    $('#wz-next-t').textContent = t(last ? 'draft' : 'wzNext');
    $('#wz-arrow').hidden = last;
    var need = cur === 1 && !$('#f-country').value;
    $('#wz-next').disabled = need;
    $('#wz-next').title = need ? t('wzNeed') : '';
  }
  function open(step) { on = true; cur = Math.max(1, Math.min(N, step || 1)); render(); }
  function close() { on = false; render(); }
  function go(d, focus) {
    if (d > 0 && cur === N) { form().requestSubmit(); return; }
    cur = Math.max(1, Math.min(N, cur + d)); render();
    if (focus !== false) $('#wz-q').focus();
  }

  document.addEventListener('DOMContentLoaded', function () {
    $('#wz-start').addEventListener('click', function () { open(1); $('#wz-q').focus(); });
    $('#wz-all').addEventListener('click', function () { close(); $('#wz-start').focus(); });
    $('#wz-back').addEventListener('click', function () { go(-1); });
    $('#wz-next').addEventListener('click', function () { go(1); });
    $('#wz-skip').addEventListener('click', function () { go(1); });
    form().addEventListener('change', function () { if (on) render(); });
    new MutationObserver(function () { render(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    render();
  });
  return { open: open, close: close, refresh: render, isOn: function () { return on; } };
})();
