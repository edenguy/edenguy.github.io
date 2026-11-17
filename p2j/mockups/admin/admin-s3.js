/* Screens 7-9: build a trip from a free-text brief (POST /api/admin/trips), audit, system. Fake data only. */
(function () {
  var A = window.A, S = A.S, t = A.t, esc = A.esc, $ = A.$;
  var PROMPT = 'A tour in Italy for 6 days, 4 of us: 2 adults and 2 children. We have a stroller, we don\'t like museums, and we\'re vegetarian.';
  var B = { phase: 'form', step: 0, prompt: PROMPT, mail: '', lang: 'auto', shown: 0 }, tm;
  var STEPS = ['brief', 'days', 'checked', 'stored'];
  function host() { return S.env === 'production' ? 'plan-to-journal.example' : S.env + '.plan-to-journal.example'; }
  function url() { return 'https://' + host() + '/t/it-6d-fam-k3p9/'; }
  function stepper() {
    return '<ol class="steps" aria-live="polite">' + STEPS.map(function (s, i) {
      var c = B.phase === 'done' || i < B.step ? 'ok' : (i === B.step ? (B.phase === 'failed' ? 'bad' : 'on') : '');
      return '<li class="' + c + '"><span class="n"><span>' + (c === 'bad' ? '!' : i + 1) + '</span></span>' + t('bt.s.' + s) + '<small>' + (c === 'ok' ? ['38 ms', '7.2 s', '61 ms', '240 ms'][i] : c === 'on' ? t('job.running') : c === 'bad' ? 'llm_truncated' : '') + '</small></li>'; }).join('') + '</ol>';
  }
  function copyrow(label, v) { return '<div class="fld"><span class="k" style="margin-bottom:5px">' + label + '</span><div class="urlbox"><code>' + esc(v) + '</code><button class="icopy" data-act="copy" data-v="' + esc(v) + '">' + t('common.copy') + '</button></div></div>'; }
  function owner() {
    var l = url() + '#k=EXAMPLE-NOT-A-REAL-TOKEN';
    if (B.shown === 0) return '<div class="urlbox" aria-label="' + t('bt.owner') + '"><code>' + url() + '#k=••••••••••••••</code><button class="btn sm" data-act="bshow">👁 ' + t('bt.show') + '</button></div><p class="mut" style="font-size:.86rem">' + t('bt.once') + '</p>';
    if (B.shown === 1) return '<div class="banner" role="alert">⚠ ' + t('bt.warn') + '</div><div class="urlbox"><code>' + l + '</code><button class="icopy" data-act="bcopy">' + t('common.copy') + '</button></div><div class="row" style="margin-top:10px"><button class="btn sm" data-act="bhide">' + t('bt.hide') + '</button></div>';
    return '<div class="banner" style="--cc:var(--c)">✓ ' + t('bt.gone') + '</div>';
  }
  A.screens.build = function () {
    var ph = B.phase, form = '', out = '';
    var lock = ph !== 'form' ? ' disabled' : '';
    form = '<section class="card"><span class="k">' + t('bt.brief') + '</span><label class="fld" style="margin-top:8px"><span class="sr">' + t('bt.brief') + '</span><textarea id="bp"' + lock + ' aria-describedby="bph">' + esc(B.prompt) + '</textarea><small id="bph">' + t('bt.hint') + '</small></label>' +
      '<div class="grid two" style="margin-bottom:0"><label class="fld"><span>' + t('bt.mail') + '</span><input type="email" id="bm" placeholder="owner@example.test" value="' + esc(B.mail) + '"' + lock + '><small>' + t('bt.mailhint') + '</small></label><label class="fld"><span>' + t('bt.lang') + '</span><select id="bl"' + lock + '>' + ['auto', 'en', 'he', 'de'].map(function (l) { return '<option value="' + l + '"' + (B.lang === l ? ' selected' : '') + '>' + t('bt.l.' + l) + '</option>'; }).join('') + '</select></label></div>' +
      '<div class="row"><button class="btn primary xl" data-act="bgo"' + lock + '>✨ ' + t('bt.go') + '</button><span class="mut mono" style="font-size:.82rem">POST /api/admin/trips</span></div></section>';
    if (ph !== 'form') {
      var hd = ph === 'done' ? '<span class="chip ok">200 ' + t('bt.done') + '</span>' : ph === 'failed' ? '<span class="chip err">' + t('job.failed') + '</span>' : '<span class="chip run mono">202 Accepted</span>';
      out = '<section class="card"><div class="ch"><h2>' + t(ph === 'done' ? 'bt.donetitle' : ph === 'failed' ? 'bt.failtitle' : 'bt.running') + '</h2>' + hd + '</div>' + copyrow(t('bt.id'), 'it-6d-fam-k3p9') + copyrow(t('bt.url'), url()) + '<dl class="kv"><dt>' + t('job.job') + '</dt><dd class="mono">job_7c41 <a href="#jobs">' + t('bt.openjob') + '</a></dd></dl>' + stepper() +
        (ph === 'running' ? '<p class="mut">' + t('bt.leave') + '</p>' : '') +
        (ph === 'failed' ? '<div class="banner err" role="alert">' + t('bt.failmsg') + '</div><div class="row"><button class="btn primary" data-act="bgo">↻ ' + t('job.retry') + '</button><button class="btn" data-act="bform">' + t('bt.edit') + '</button></div>' : '') + '</section>';
      if (ph === 'done') out += '<section class="hero"><span class="k">' + t('bt.result') + '</span><h2 style="margin:6px 0">' + t('bt.days', { n: 6, c: 3 }) + '</h2><p style="margin:0 0 12px">' + t('bt.sum') + '</p><div class="row"><a class="btn primary" href="#build" data-act="bopen">↗ ' + t('bt.open') + '</a><button class="btn" data-act="bform">' + t('bt.another') + '</button></div></section>' +
        '<section class="card"><span class="k">' + t('bt.owner') + '</span><div style="margin-top:10px">' + owner() + '</div>' + (B.mail ? '<p class="mut" style="font-size:.86rem;margin-bottom:0">' + t('bt.mailed', { e: '<span class="mono">' + esc(B.mail.charAt(0)) + '…@e…</span>' }) + '</p>' : '') + '</section>';
    }
    return A.head('<span class="acc">' + t('nav.build') + '</span>', t('bt.sub')) + form + out;
  };
  function sync() { var p = $('#bp'); if (p) { B.prompt = p.value; B.mail = $('#bm').value; B.lang = $('#bl').value; } }
  function run() {
    clearInterval(tm); B.phase = 'running'; B.step = 0; B.shown = 0; A.render();
    tm = setInterval(function () { B.step++; if (B.step >= 4) { clearInterval(tm); B.phase = 'done'; } A.render(); }, 1300);
  }
  A.acts.bgo = function () { sync(); if (!B.prompt.trim()) { A.toast(t('bt.empty')); return; } run(); };
  A.acts.bform = function () { clearInterval(tm); B.phase = 'form'; A.render(); };
  A.acts.bopen = function () { A.toast(t('bt.opened', { u: url() })); };
  A.acts.bshow = function () { A.reasonDialog({ title: t('bt.show'), intro: t('bt.showintro'), cta: t('bt.show'), audit: 'reveal_owner_link', target: 'it-6d-fam-k3p9', result: t('bt.revealed'), done: function () { B.shown = 1; A.render(); } }); };
  A.acts.bcopy = function () { A.copy(url() + '#k=EXAMPLE-NOT-A-REAL-TOKEN'); B.shown = 2; A.render(); };
  A.acts.bhide = function () { B.shown = 2; A.render(); };
  A.ctl = (function (prev) { return function () {
    var set = function (p) { return '<button data-act="bph" data-v="' + p + '" aria-pressed="' + (B.phase === p) + '">' + t('bt.ph.' + p) + '</button>'; };
    return prev() + '<div class="grp"><span>' + t('ctl.build') + '</span>' + ['form', 'running', 'done', 'failed'].map(set).join('') + '</div>'; }; })(A.ctl);
  A.acts.bph = function (el) { clearInterval(tm); var p = el.dataset.v; B.phase = p; B.step = p === 'running' ? 2 : p === 'failed' ? 2 : 4; B.shown = 0; location.hash = '#build'; A.render(); };

  /* audit */
  var af = 'all';
  A.screens.audit = function () {
    var rows = A.data.audit.filter(function (a) { return af === 'all' || a.reason === af; });
    return A.head(t('nav.audit'), t('au.sub')) + '<div class="card"><div class="filters"><div class="row" role="group" aria-label="' + t('act.reason') + '"><button class="chip" data-act="af" data-v="all" aria-pressed="' + (af === 'all') + '">' + t('tr.f.all') + '</button>' + ['complaint', 'owner', 'investigation', 'test'].map(function (r) { return '<button class="chip" data-act="af" data-v="' + r + '" aria-pressed="' + (af === r) + '">' + t('reason.' + r) + '</button>'; }).join('') + '</div></div><div class="tw"><table class="tbl"><thead><tr><th>' + t('au.who') + '</th><th>' + t('au.what') + '</th><th>' + t('tr.trip') + '</th><th>' + t('act.reason') + '</th><th>' + t('au.when') + '</th></tr></thead><tbody>' +
      rows.map(function (a) { return '<tr' + (a.fresh ? ' style="outline:2px solid var(--c);outline-offset:-2px;border-radius:14px"' : '') + '><td data-l="' + t('au.who') + '"><span class="chip hash">' + a.who + '</span></td><td data-l="' + t('au.what') + '"><span class="mono">' + esc(a.action) + '</span>' + (a.note ? '<br><span class="mut">' + esc(a.note) + '</span>' : '') + '</td><td data-l="' + t('tr.trip') + '" class="mono">' + esc(a.trip) + '</td><td data-l="' + t('act.reason') + '">' + (a.reason === '-' ? '-' : A.chip(a.reason === 'complaint' ? 'err' : a.reason === 'test' ? 'draft' : a.reason === 'owner' ? 'ok' : 'warn', 'reason.' + a.reason)) + '</td><td data-l="' + t('au.when') + '" class="mono">' + a.at + '</td></tr>'; }).join('') + '</tbody></table></div><p class="mut" style="font-size:.84rem">' + t('au.note') + '</p></div>';
  };
  A.acts.af = function (el) { af = el.dataset.v; A.render(); };

  /* system */
  A.screens.system = function () {
    var led = function (c, k, v) { return '<div class="health"><span class="led ' + (c || '') + '" aria-hidden="true"></span><b>' + t(k) + '</b><span class="mut">' + v + '</span></div>'; };
    return A.head(t('nav.system'), t('sy.sub')) + '<div class="grid two"><section class="card"><span class="k">' + t('sy.env') + '</span><div class="row" style="margin:10px 0"><span class="pill beta">' + t('brand.beta') + '</span>' + (S.env === 'production' ? '<span class="chip">' + t('env.production') + '</span>' : '<span class="pill env-' + S.env + '">' + S.env + '</span>') + '</div><p class="mut" style="margin:0 0 8px">' + t('sy.envnote') + '</p><dl class="kv"><dt>' + t('sy.build') + '</dt><dd class="mono">20261117.4 · 7c41e0a</dd><dt>' + t('sy.contract') + '</dt><dd class="mono">services v2 · log v1</dd><dt>' + t('sy.store') + '</dt><dd class="mono">LOG_STORE=d1 · payloads off</dd></dl></section>' +
      '<section class="card"><span class="k">' + t('sy.health') + '</span>' + led('', 'sy.queue', t('sy.queued', { n: 2, a: '14 s' })) + led('', 'sy.runner', t('sy.tick', { s: 8 })) + led('warn', 'sy.lease', t('sy.leasel', { n: 1 })) + led('', 'sy.db', 'D1 · p95 38 ms') + led('', 'sy.access', t('sy.verified')) + '</section></div>' +
      '<div class="grid two"><section class="card"><span class="k">' + t('sy.allow') + '</span><p class="mut" style="margin:8px 0 12px">' + t('sy.allownote') + '</p><div class="admins">' + [1, 2, 3].map(function (n) { return '<span class="who"' + (n === 2 ? ' style="border-color:var(--p1)"' : '') + '><i aria-hidden="true">A' + n + '</i><span style="display:inline">admin-' + n + '@example.test</span></span>'; }).join('') + '</div><p class="mut" style="font-size:.84rem;margin-bottom:0">' + t('sy.you') + '</p></section>' +
      '<section class="card"><span class="k">' + t('sy.sess') + '</span><dl class="kv"><dt>' + t('sy.team') + '</dt><dd class="mono">example-team · aud 4f1c…</dd><dt>' + t('sy.keys') + '</dt><dd>' + t('sy.keysv') + '</dd><dt>' + t('sy.session') + '</dt><dd>' + t('sy.sessv') + '</dd></dl><button class="btn danger" data-act="signout">' + t('sy.signout') + '</button></section></div>';
  };
  A.acts.signout = function () { A.reasonDialog({ title: t('sy.signout'), intro: t('sy.signoutintro'), cta: t('sy.signout'), danger: true, audit: 'sign_out_everywhere', target: '-', result: t('sy.signedout'), done: function () { S.signin = 'start'; location.hash = '#signin'; } }); };
})();
