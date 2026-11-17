/* Mockup behaviour: the state switcher (also by address), theme, language, environment, the sheets with focus handling,
   remove with undo, search, and the fake send. No network, no storage. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  /* load: skeletons; n: trips on the device; closed: creation closed; sheet/stage: an open sheet; stale: a card whose link may have expired */
  var PRESETS = {
    1: { load: 1, n: 0 }, 2: { n: 0 }, 3: { n: 1 }, 4: { n: 4 }, 5: { n: 8 }, 6: { n: 4, closed: 1 },
    7: { n: 0, sheet: 'find', stage: 'empty' }, 8: { n: 0, sheet: 'find', stage: 'sending' }, 9: { n: 0, sheet: 'find', stage: 'sent' },
    10: { n: 0, sheet: 'find', stage: 'net' }, 11: { n: 0, sheet: 'find', stage: 'rate' },
    12: { n: 4, stale: 1 }, 13: { n: 4, sheet: 'clear' }
  };
  var S = V.S = { state: 2, lang: 'en', theme: 'dark', env: 'sb', trips: [], q: '', sheet: null, stage: 'empty', email: '', err: false, cd: 52, preset: PRESETS[2] };
  var opener = null, timer = null, undoBuf = null, toastTimer = null, cdTimer = null;

  function apply(n) {
    S.state = n; S.preset = PRESETS[n]; S.trips = window.TRIPS.slice(0, S.preset.n).map(function (x) { return Object.assign({}, x); });
    S.q = ''; S.sheet = S.preset.sheet || null; S.stage = S.preset.stage || 'empty'; S.err = false; S.cd = 52;
    S.email = (n >= 8 && n <= 11) ? 'ana.levi@example.test' : '';
    toast(null); draw(); sync();
  }

  function sync() {
    var u = new URLSearchParams({ state: S.state, lang: S.lang, theme: S.theme, env: S.env });
    history.replaceState(null, '', '?' + u.toString());
    $$('[data-state]').forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.state === S.state); });
    $$('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lang === S.lang); });
    $$('[data-theme-set]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.themeSet === S.theme); });
    $$('[data-env]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.env === S.env); });
  }

  function chrome() {
    var h = document.documentElement; h.lang = S.lang; h.dir = S.lang === 'he' ? 'rtl' : 'ltr'; h.dataset.theme = S.theme;
    $('#brand').lastChild.textContent = V.t('brand');
    $('#beta').textContent = V.t('beta'); $('#suggt').textContent = V.t('sugg');
    var env = $('#envpill'); env.hidden = S.env === 'none'; env.className = 'pill env ' + S.env; env.textContent = S.env;
    var tb = $('#tbtn'); tb.textContent = V.t(S.theme === 'dark' ? 'toLight' : 'toDark'); tb.setAttribute('aria-label', V.t('themeTip'));
    var lc = $('#lbtn'); lc.textContent = V.t('langChip'); lc.setAttribute('aria-label', V.t('langTip')); lc.lang = S.lang === 'en' ? 'he' : 'en';
    $('#mockt').textContent = V.t('mock');
    $$('[data-i18n]').forEach(function (e) { e.textContent = V.t(e.dataset.i18n); });
    document.title = V.t('brand') + ' (mockup)';
  }

  function draw() {
    chrome();
    $('#app').innerHTML = V.page();
    drawSheet();
    drawToast();
  }

  /* sheet: dialog semantics, focus moved in, trapped and returned, the page behind made inert */
  function drawSheet() {
    var layer = $('#layer'), was = layer.firstChild;
    $('#app').inert = $('#top').inert = !!S.sheet;
    clearInterval(cdTimer);
    if (!S.sheet) { layer.innerHTML = ''; if (was && opener && document.contains(opener)) opener.focus(); return; }
    layer.innerHTML = '<div class="scrim" data-act="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t">' + V.sheet() + '</div></div>';
    var f = $('#em', layer);
    if (S.stage === 'empty' && S.sheet === 'find' && f && !was) f.focus(); else if ($('#sh-t', layer)) $('#sh-t', layer).focus();
    if (S.sheet === 'find' && S.stage === 'sent') cdTimer = setInterval(tick, 1000);
  }
  function tick() {
    var b = $('#again'); if (!b) return clearInterval(cdTimer);
    S.cd = Math.max(0, S.cd - 1);
    if (S.cd) b.textContent = V.t('sAgainIn', { s: S.cd }); else { b.textContent = V.t('sAgain'); b.disabled = false; clearInterval(cdTimer); }
  }
  function closeSheet() {
    if (S.state >= 7 && S.state <= 11) { S.state = 2; S.preset = PRESETS[2]; }
    if (S.state === 13) { S.state = 4; S.preset = PRESETS[4]; }
    S.sheet = null; S.stage = 'empty'; clearTimeout(timer); draw(); sync();
  }
  function openSheet(kind, from) { opener = from; S.sheet = kind; S.stage = 'empty'; S.err = false; drawSheet(); }
  function send() {
    var v = ($('#em') || {}).value || ''; S.email = v.trim();
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(S.email)) { S.err = true; drawSheet(); $('#em').focus(); return; }
    S.err = false; S.stage = 'sending'; drawSheet(); $('#sh-t').focus();
    timer = setTimeout(function () { S.stage = 'sent'; S.cd = 52; drawSheet(); }, 1400);
  }

  /* undo toast */
  function toast(msg, undo) {
    undoBuf = undo || null; S.toast = msg; clearTimeout(toastTimer); drawToast();
    if (msg) toastTimer = setTimeout(function () { S.toast = null; undoBuf = null; drawToast(); }, 8000);
  }
  function drawToast() {
    $('#toast').innerHTML = S.toast ? '<div class="toast" role="status"><span>' + S.toast + '</span>' + (undoBuf ? '<button type="button" class="btn sm outline" data-act="undo">' + V.t('undo') + '</button>' : '') + '<button type="button" class="btn sm ghost" data-act="dismiss">' + V.t('dismiss') + '</button></div>' : '';
  }
  function redrawList() { var w = $('#listwrap'); if (!w) return draw(); var q = $('#q'), pos = q ? q.selectionStart : 0; w.innerHTML = V.list(); q = $('#q'); if (q && S.q) { q.focus(); q.setSelectionRange(pos, pos); } }

  var ACT = {
    'open-find': function (e) { openSheet('find', e); },
    'clear-open': function (e) { openSheet('clear', e); },
    close: closeSheet,
    scrim: function (e, ev) { if (ev.target === e) closeSheet(); },
    retry: function () { S.stage = 'empty'; send(); },
    again: function () { S.stage = 'empty'; send(); },
    'clear-q': function () { S.q = ''; redrawList(); var q = $('#q'); if (q) q.focus(); },
    'clear-yes': function () { S.trips = []; S.sheet = null; S.state = 2; S.preset = PRESETS[2]; draw(); sync(); toast(V.t('cleared')); },
    rm: function (e) {
      var i = S.trips.findIndex(function (x) { return x.id === e.dataset.id; }), x = S.trips[i];
      S.trips.splice(i, 1); toast(V.t('removed', { t: x.title.replace(/</g, '&lt;') }), { i: i, x: x }); draw();
      var next = $('.rm') || $('[data-act=open-find]'); if (next) next.focus();
    },
    undo: function () { if (undoBuf) { S.trips.splice(undoBuf.i, 0, undoBuf.x); toast(null); draw(); } },
    dismiss: function () { toast(null); },
    create: function () {}, 'open-trip': function () {}
  };
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('[data-act]'); if (!a) return;
    ev.preventDefault(); if (ACT[a.dataset.act]) ACT[a.dataset.act](a, ev);
  });
  document.addEventListener('submit', function (ev) { ev.preventDefault(); send(); });
  document.addEventListener('input', function (ev) { if (ev.target.id === 'q') { S.q = ev.target.value; redrawList(); } });
  document.addEventListener('keydown', function (ev) {
    if (!S.sheet) return;
    if (ev.key === 'Escape') { ev.preventDefault(); closeSheet(); return; }
    if (ev.key !== 'Tab') return;
    var f = $$('.sheet button:not([disabled]),.sheet input:not([disabled]),.sheet [tabindex="-1"]'); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); } else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  });

  /* mockup controls and the top bar buttons */
  $('#states').innerHTML = Object.keys(PRESETS).map(function (n) { return '<button type="button" data-state="' + n + '" aria-pressed="false" data-i18n="s' + n + '"></button>'; }).join('');
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.state) apply(+b.dataset.state);
    else if (b.dataset.lang) { S.lang = b.dataset.lang; draw(); sync(); }
    else if (b.dataset.themeSet) { S.theme = b.dataset.themeSet === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : b.dataset.themeSet; draw(); sync(); }
    else if (b.dataset.env) { S.env = b.dataset.env; draw(); sync(); }
    else if (b.id === 'tbtn') { S.theme = S.theme === 'dark' ? 'light' : 'dark'; draw(); sync(); }
    else if (b.id === 'lbtn') { S.lang = S.lang === 'en' ? 'he' : 'en'; draw(); sync(); }
  });

  var q = new URLSearchParams(location.search), n = +q.get('state');
  if (q.get('lang') === 'he') S.lang = 'he';
  if (q.get('theme') === 'light') S.theme = 'light';
  if (['sb', 'dev', 'none'].indexOf(q.get('env')) > -1) S.env = q.get('env');
  apply(PRESETS[n] ? n : 2);
})();
