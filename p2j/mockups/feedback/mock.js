/* Mockup controls: state, host, language, theme, environment pill, pill placement. The view is the query string:
   ?state=1..14&host=home|landing|newtrip|journal|captions&lang=en|he&theme=dark|light&env=sb|dev|none&float=1 */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var Q = new URLSearchParams(location.search), HOSTS = window.HOSTS;
  var S = { state: +Q.get('state') || 1, host: HOSTS.list.indexOf(Q.get('host')) >= 0 ? Q.get('host') : 'home', lang: Q.get('lang') === 'he' ? 'he' : 'en',
    theme: Q.get('theme') === 'light' ? 'light' : Q.get('theme') === 'auto' ? 'auto' : 'dark', env: ['sb', 'dev', 'none'].indexOf(Q.get('env')) >= 0 ? Q.get('env') : 'sb', fix: Q.get('float') === '1' };

  function t(k, p) { var s = window.I18N[S.lang][k]; if (s == null) s = k; for (var x in p || {}) s = s.split('{' + x + '}').join(p[x]); return s; }
  function btn(attr, val, label, on) { return '<button type="button" data-' + attr + '="' + val + '" aria-pressed="' + on + '">' + label + '</button>'; }
  function group(name, key, items) { return '<div class="row" role="group" aria-label="' + t(name) + '"><span style="font-size:12px;font-weight:700;color:var(--mut);align-self:center">' + t(name) + '</span>' + items.map(function (i) { return btn(key, i[0], i[1], S[key] == i[0]); }).join('') + '</div>'; }

  function controls() {
    var sts = []; for (var n = 1; n <= 14; n++) sts.push([n, t('s' + n)]);
    $('#mockbody').innerHTML = group('cState', 'state', sts) + group('cHost', 'host', HOSTS.list.map(function (h) { return [h, t('h' + h[0].toUpperCase() + h.slice(1))]; })) +
      group('cLang', 'lang', [['en', 'English'], ['he', 'עברית']]) + group('cTheme', 'theme', [['auto', t('auto')], ['light', t('light')], ['dark', t('dark')]]) +
      group('cEnv', 'env', [['sb', 'sb'], ['dev', 'dev'], ['none', t('eNone')]]) + group('cFloat', 'fix', [[0, t('fRow')], [1, t('fFix')]]);
    $('#mockbody').querySelectorAll('[data-fix]').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.fix === (S.fix ? 1 : 0))); });
    $('#mocksum').textContent = t('mock');
  }
  function theme() {
    var th = S.theme === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : S.theme;
    document.documentElement.dataset.theme = th;
  }
  function url() {
    var q = new URLSearchParams({ state: S.state, host: S.host, lang: S.lang, theme: S.theme, env: S.env }); if (S.fix) q.set('float', '1');
    history.replaceState(null, '', '?' + q.toString());
  }
  function drawHost() {
    $('#host').innerHTML = HOSTS.draw(S.host, S.lang, t, S.env, S.fix);
    document.querySelectorAll('.fb-pill').forEach(function (p) { p.addEventListener('click', function () { window.Sheet.open(p); }); });
  }
  function all() {
    document.documentElement.lang = S.lang; document.documentElement.dir = S.lang === 'he' ? 'rtl' : 'ltr';
    theme(); controls(); drawHost(); window.Sheet.retext(t); window.Sheet.state(S.state); url();
  }

  $('#mockbody').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var d = b.dataset;
    if (d.state) S.state = +d.state; else if (d.host) S.host = d.host; else if (d.lang) S.lang = d.lang; else if (d.theme) S.theme = d.theme; else if (d.env) S.env = d.env; else if (d.fix != null) S.fix = d.fix === '1';
    all();
  });
  window.Sheet.init($('#fb-root'), t);
  all();
})();
