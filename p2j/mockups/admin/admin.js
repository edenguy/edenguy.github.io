/* Admin mock core: state, router, frame (top bar, nav, mockup controls), drawer, reason dialog, toast. No network, no storage.
   Screens live in admin-s1.js (sign-in, overview, logs), admin-s2.js (trips, jobs, drafts), admin-s3.js (build, audit, system). */
(function () {
  var S = { screen: 'overview', lang: 'en', theme: 'dark', env: 'sb', signin: 'start', stale: false, kill: { DRAFTS_ENABLED: true, MAIL_ENABLED: true, CREATE_ENABLED: true } };
  var NAV = [['overview', '◉'], ['logs', '☰'], ['trips', '✈'], ['build', '✨'], ['jobs', '↻'], ['drafts', '◐'], ['audit', '✎'], ['system', '⚙']];
  var SEC = { jobs: 1, drafts: 1, audit: 1, system: 1 };
  var A = window.A = { S: S, screens: {}, init: {}, acts: {}, data: {}, ME: 'a-7f3c' };
  var $ = A.$ = function (s, r) { return (r || document).querySelector(s); };
  A.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  A.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  A.t = function (k, p) {
    var s = (I18N[S.lang] && I18N[S.lang][k] != null) ? I18N[S.lang][k] : (I18N.en[k] != null ? I18N.en[k] : k);
    for (var x in p || {}) s = s.split('{' + x + '}').join(p[x]);
    return s;
  };
  var t = A.t, esc = A.esc;
  A.chip = function (cls, key, raw) { return '<span class="chip ' + cls + '">' + esc(raw || t(key)) + '</span>'; };
  A.head = function (title, sub, extra) { return '<div class="ph"><div class="grow"><h1>' + title + '</h1><p>' + sub + '</p></div>' + (extra || '') + '</div>'; };
  A.pct = function (n, d) { return Math.round(n * 100 / d); };

  /* toast */
  var tt;
  A.toast = function (msg) {
    var o = $('.toast'); if (o) o.remove();
    var e = document.createElement('div'); e.className = 'toast'; e.setAttribute('role', 'status'); e.textContent = msg; document.body.appendChild(e);
    clearTimeout(tt); tt = setTimeout(function () { e.remove(); }, 4200);
  };
  A.copy = function (txt) {
    try { navigator.clipboard.writeText(txt); } catch (e) { /* mock: clipboard may be blocked */ }
    A.toast(t('common.copied'));
  };

  /* layers: drawer and dialog share one mechanism (scrim, Escape, focus returns to the opener) */
  var stack = [];
  function layer(kind, html) {
    var op = document.activeElement, host = document.createElement('div');
    host.className = kind === 'dlg' ? 'dlg' : '';
    if (kind === 'drawer') host.innerHTML = '<div class="scrim" data-act="close"></div><aside class="drawer" role="dialog" aria-modal="true" aria-label="' + esc(html.title) + '"><div class="dh"><h2>' + esc(html.title) + '</h2><button class="ib" data-act="close" aria-label="' + t('common.close') + '">✕</button></div>' + html.body + '</aside>';
    else host.innerHTML = '<div role="dialog" aria-modal="true" aria-label="' + esc(html.title) + '"><h2>' + esc(html.title) + '</h2>' + html.body + '</div>';
    document.body.appendChild(host);
    var rec = { host: host, op: op }; stack.push(rec);
    var f = $('input:not([type=hidden]),textarea,button:not([data-act=close])', host) || $('button', host); if (f) f.focus();
    return host;
  }
  A.drawer = function (title, body) { return layer('drawer', { title: title, body: body }); };
  A.dialog = function (title, body) { return layer('dlg', { title: title, body: body }); };
  A.close = function () {
    var r = stack.pop(); if (!r) return; r.host.remove();
    if (r.op && document.body.contains(r.op)) r.op.focus();
  };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && stack.length) A.close();
    if (e.key === 'Tab' && stack.length) {
      var h = stack[stack.length - 1].host, f = A.$$('button,input,textarea,select,[tabindex="0"]', h).filter(function (x) { return !x.disabled && x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('tr[tabindex]')) { e.preventDefault(); e.target.click(); }
  });

  /* reason dialog: every action asks for one of four reasons, may need the trip id typed, and lands in the audit */
  var REASONS = ['complaint', 'owner', 'investigation', 'test'];
  A.audit = function (action, target, reason, note) {
    A.data.audit.unshift({ who: A.ME, action: action, trip: target, reason: reason, note: note || '', at: '15:4' + (2 + A.data.audit.length % 7), fresh: true });
  };
  A.reasonDialog = function (o) {
    var typed = o.typed ? '<label class="fld"><span>' + t('act.typed', { id: '<b class="mono">' + esc(o.typed) + '</b>' }) + '</span><input type="text" id="typed" autocomplete="off" spellcheck="false"></label>' : '';
    var h = A.dialog(o.title, '<p>' + o.intro + '</p><fieldset class="fld" style="border:0;padding:0;margin:0 0 12px"><legend class="k" style="margin-bottom:8px">' + t('act.reason') + '</legend><div class="seg" role="radiogroup">' +
      REASONS.map(function (r, i) { return '<label><input type="radio" name="reason" value="' + r + '"' + (i === 0 ? ' checked' : '') + '><span>' + t('reason.' + r) + '</span></label>'; }).join('') +
      '</div></fieldset><label class="fld"><span>' + t('act.note') + '</span><input type="text" id="note"></label>' + typed +
      '<p class="mut" style="font-size:.86rem">✎ ' + t('act.auditnote') + '</p><div class="row"><button class="btn" data-act="close">' + t('common.cancel') + '</button><button class="btn ' + (o.danger ? 'danger solid' : 'primary') + '" id="go"' + (o.typed ? ' disabled' : '') + '>' + o.cta + '</button></div>');
    if (o.typed) $('#typed', h).addEventListener('input', function (e) { $('#go', h).disabled = e.target.value.trim() !== o.typed; });
    $('#go', h).addEventListener('click', function () {
      var r = $('input[name=reason]:checked', h).value, n = $('#note', h).value;
      A.close(); A.audit(o.audit, o.target, r, n); o.done && o.done(r);
      A.toast(o.result + ' ' + t('act.landed'));
      if (S.screen === 'audit') render();
    });
    return h;
  };

  /* delegated clicks: data-act names an entry of A.acts */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]'); if (!el) return;
    var a = el.dataset.act;
    if (a === 'close') { if (!(el.classList.contains('scrim') && !stack.length)) A.close(); return; }
    if (A.acts[a]) A.acts[a](el, e);
  });
  A.acts.copy = function (el) { A.copy(el.dataset.v); };
  A.acts.more = function (el) { var m = $('#menu'); m.hidden = !m.hidden; el.setAttribute('aria-expanded', String(!m.hidden)); };
  A.acts.theme = function () { S.theme = S.theme === 'dark' ? 'light' : 'dark'; render(); };
  A.acts.lang = function () { S.lang = S.lang === 'en' ? 'he' : 'en'; render(); };

  /* frame */
  function env() {
    if (S.env === 'production') return '';
    return '<span class="pill env-' + S.env + '" title="' + t('env.' + S.env) + '">' + S.env + '</span>';
  }
  function top() {
    var nowho = S.screen === 'signin' && S.signin !== 'ok';
    return '<a class="brand" href="#overview" style="color:inherit;text-decoration:none"><i aria-hidden="true"></i>Plan to Journal <small>' + t('brand.admin') + '</small></a>' +
      '<span class="pill beta">' + t('brand.beta') + '</span>' + env() + (S.stale ? '<span class="pill stale">' + t('common.stale') + '</span>' : '') + '<span class="sp"></span>' +
      (nowho ? '' : '<span class="who" title="' + t('who.title') + '"><i aria-hidden="true">A2</i><span>admin-2@example.test</span></span>') +
      '<button class="ib" data-act="theme" aria-label="' + t('ctl.theme') + '">' + (S.theme === 'dark' ? '☾' : '☀') + '</button>' +
      '<button class="ib" data-act="lang" aria-label="' + t('ctl.lang') + '">' + (S.lang === 'en' ? 'עב' : 'EN') + '</button>';
  }
  function nav() {
    var jobsBad = A.data.jobs ? A.data.jobs.filter(function (j) { return j.state === 'failed'; }).length : 0;
    return '<nav class="nav" aria-label="' + t('nav.label') + '">' + NAV.map(function (n) {
      return '<a href="#' + n[0] + '"' + (SEC[n[0]] ? ' class="sec"' : '') + (S.screen === n[0] ? ' aria-current="page"' : '') + '><span class="ic" aria-hidden="true">' + n[1] + '</span>' + t('nav.' + n[0]) + (n[0] === 'jobs' && jobsBad ? '<span class="badge" aria-label="' + jobsBad + '">' + jobsBad + '</span>' : '') + '</a>';
    }).join('') + '<button class="more" data-act="more" aria-haspopup="menu" aria-expanded="false" aria-controls="menu"><span class="ic" aria-hidden="true">…</span>' + t('nav.more') + '</button><hr><div class="nb">' + t('nav.note') + '</div></nav>' +
      '<div class="menu" id="menu" role="menu" hidden>' + NAV.filter(function (n) { return SEC[n[0]]; }).map(function (n) {
        return '<a role="menuitem" href="#' + n[0] + '"' + (S.screen === n[0] ? ' aria-current="page"' : '') + '><span class="ic" aria-hidden="true">' + n[1] + '</span>' + t('nav.' + n[0]) + '</a>'; }).join('') + '</div>';
  }
  var SCREENS = ['signin', 'overview', 'logs', 'trips', 'jobs', 'drafts', 'build', 'audit', 'system'];
  function controls() {
    var seg = function (label, items, cur, k) { return '<div class="grp"><span>' + label + '</span>' + items.map(function (i) { return '<button data-set="' + k + '" data-v="' + i[0] + '" aria-pressed="' + (cur === i[0]) + '">' + i[1] + '</button>'; }).join('') + '</div>'; };
    return '<details' + (S.open ? ' open' : '') + '><summary>' + t('ctl.title') + '</summary><div class="grp" role="tablist" aria-label="' + t('ctl.screen') + '"><span>' + t('ctl.screen') + '</span>' + SCREENS.map(function (s, i) {
      return '<button role="tab" data-set="screen" data-v="' + s + '" aria-selected="' + (S.screen === s) + '">' + (i + 1) + ' ' + t('nav.' + s) + '</button>'; }).join('') + '</div>' +
      seg(t('ctl.env'), [['sb', 'sb'], ['dev', 'dev'], ['production', t('env.prodshort')]], S.env, 'env') +
      seg(t('ctl.theme'), [['dark', t('ctl.dark')], ['light', t('ctl.light')]], S.theme, 'theme') + seg(t('ctl.lang'), [['en', 'EN'], ['he', 'עברית']], S.lang, 'lang') +
      seg(t('ctl.data'), [['0', t('ctl.fresh')], ['1', t('ctl.stale')]], S.stale ? '1' : '0', 'stale') +
      (A.ctl ? A.ctl() : '') + '</details>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-set]'); if (!b) return;
    var k = b.dataset.set, v = b.dataset.v;
    if (k === 'screen') location.hash = '#' + v; else { S[k] = k === 'stale' ? v === '1' : v; if (k === 'signin') S.screen = 'signin'; render(); }
  });
  A.render = render;
  function render() {
    var scr = S.screen, d = document.documentElement;
    d.lang = S.lang; d.dir = S.lang === 'he' ? 'rtl' : 'ltr'; d.dataset.theme = S.theme; document.title = 'Plan to Journal, ' + t('brand.admin');
    var open = $('.mockbar details'); S.open = open ? open.open : false;
    $('.mockbar').innerHTML = controls();
    $('#top').innerHTML = top();
    var wall = scr === 'signin';
    $('#app').className = wall ? '' : 'app';
    $('#app').innerHTML = wall ? '<main class="wall" id="main">' + A.screens.signin() + '</main>' : nav() + '<main class="view" id="main" tabindex="-1">' + A.screens[scr]() + '</main>';
    if (A.init[scr]) A.init[scr]($('#main'));
  }
  function route() {
    var h = location.hash.slice(1); if (SCREENS.indexOf(h) < 0) h = 'overview';
    var changed = h !== S.screen; S.screen = h;
    if (stack.length) while (stack.length) A.close();
    render(); if (changed) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('DOMContentLoaded', function () { route(); });
})();
