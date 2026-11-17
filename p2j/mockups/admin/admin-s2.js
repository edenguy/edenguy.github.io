/* Screens 4-6: trips (with the trip drawer and its actions), jobs, drafts and cost with the kill switches. Fake data only. */
(function () {
  var A = window.A, S = A.S, t = A.t, esc = A.esc, $ = A.$;
  function T(id, title, own, vis, fz, langs, days, last, mem) { return { id: id, title: title, own: own, vis: vis, fz: fz, langs: langs, days: days, last: last, mem: mem }; }
  A.data.trips = [
    T('hungary-2026', 'Eger and Budapest', 'g…@e….com', 'listed', true, 'he en', 5, 2, 2), T('it-6d-fam-k3p9', 'Italy, 6 days with kids', 'm…@e….com', 'draft', false, 'en', 6, 1, 1),
    T('rome-hols-2027', 'Rome holidays', 's…@e….com', 'listed', false, 'en he', 7, 3, 3), T('lisbon-weekend', 'Lisbon long weekend', 'a…@e….com', 'listed', true, 'en', 3, 8, 2),
    T('tokyo-spring', 'Tokyo in spring', 'k…@e….com', 'unlisted', false, 'en', 9, 14, 4), T('ski-alps-fam', 'Alps ski week', 'r…@e….com', 'draft', false, 'en de', 7, 26, 1),
    T('crete-2027', 'Crete by car', 'n…@e….com', 'listed', false, 'en', 8, 61, 2), T('berlin-friends', 'Berlin with friends', 'j…@e….com', 'unlisted', true, 'de en', 4, 180, 5),
    T('iceland-ring', 'Iceland ring road', 'o…@e….com', 'listed', false, 'en', 10, 240, 2), T('vienna-xmas', 'Vienna Christmas', 'l…@e….com', 'draft', false, 'de', 4, 300, 1),
    T('porto-wine', 'Porto and the Douro', 'd…@e….com', 'listed', true, 'en', 5, 1440, 2), T('zz-smoke', 'Smoke test trip', 't…@e….test', 'unlisted', false, 'en he', 3, 2880, 1)
  ];
  function J(id, kind, trip, state, att, lease, err, steps) { return { id: id, kind: kind, trip: trip, state: state, att: att, lease: lease, err: err, steps: steps }; }
  var OK = 'done', R = 'running', F = 'failed', Q = 'queued';
  A.data.jobs = [
    J('job_7c41', 'build-trip', 'it-6d-fam-k3p9', R, 1, 'expires in 41 s', '-', [['brief-parsed', OK, 38], ['days-drafted', R, 7210], ['checked', Q, 0], ['stored', Q, 0]]),
    J('job_7c40', 'mail-links', 'rome-hols-2027', F, 3, '-', 'provider_429', [['render', OK, 12], ['send', F, 912], ['send', F, 880], ['send', F, 905]]),
    J('job_7c3f', 'build-trip', 'ski-alps-fam', F, 3, '-', 'llm_truncated', [['brief-parsed', OK, 41], ['days-drafted', OK, 14200], ['checked', F, 63], ['days-drafted', OK, 15100], ['checked', F, 58]]),
    J('job_7c3e', 'freeze-plan', 'hungary-2026', OK, 1, '-', '-', [['freeze', OK, 220]]), J('job_7c3d', 'build-trip', 'tokyo-spring', OK, 1, '-', '-', [['brief-parsed', OK, 36], ['days-drafted', OK, 16300], ['checked', OK, 52], ['stored', OK, 240]]),
    J('job_7c3c', 'build-trip', 'crete-2027', R, 2, 'expires in 12 s', 'lease_lost', [['brief-parsed', OK, 40], ['days-drafted', R, 3300]]), J('job_7c3b', 'mail-links', 'lisbon-weekend', Q, 0, '-', '-', [['render', Q, 0]]),
    J('job_7c3a', 'mail-links', 'porto-wine', OK, 1, '-', '-', [['render', OK, 11], ['send', OK, 640]]), J('job_7c39', 'build-trip', 'vienna-xmas', Q, 0, '-', '-', [['brief-parsed', Q, 0]]),
    J('job_7c38', 'build-trip', 'iceland-ring', OK, 2, '-', '-', [['brief-parsed', OK, 39], ['days-drafted', OK, 17000], ['checked', OK, 61], ['stored', OK, 260]])
  ];
  A.data.usage = { tokens: 1840000, ceiling: 2500000 };
  A.data.invites = [['inv-4c1f', 'Beta group A', 6, 612000, 74], ['inv-92ae', 'Press', 4, 480000, 58], ['inv-0b77', 'Friends of the owner', 5, 390000, 47], ['inv-e5d3', 'Open link, Sept', 2, 358000, 43]];
  A.data.audit = [
    { who: 'a-7f3c', action: 'rotate_owner_link', trip: 'tokyo-spring', reason: 'owner', note: 'owner lost the mail', at: '15:28' }, { who: 'a-19d0', action: 'job_retry', trip: 'ski-alps-fam', reason: 'investigation', note: '', at: '14:52' },
    { who: 'a-7f3c', action: 'enter_view', trip: 'rome-hols-2027', reason: 'complaint', note: 'planning went wrong', at: '14:10' }, { who: 'a-4b2e', action: 'reveal_owner_email', trip: 'lisbon-weekend', reason: 'owner', note: '', at: '11:36' },
    { who: 'a-19d0', action: 'unlist', trip: 'berlin-friends', reason: 'owner', note: 'asked by mail', at: '10:05' }, { who: 'a-4b2e', action: 'switch_off MAIL_ENABLED', trip: '-', reason: 'test', note: 'sandbox drill', at: '09:12' },
    { who: 'a-7f3c', action: 'sign_in', trip: '-', reason: '-', note: 'access, new device', at: '08:58' }, { who: 'a-7f3c', action: 'delete_trip', trip: 'zz-smoke-2', reason: 'test', note: '', at: 'Mon 17:20' }
  ];
  var tf = { q: '', f: 'all' }, jf = 'all';
  var vis = { listed: 'listed', unlisted: 'unlisted', draft: 'draft' };

  /* trips */
  function trow(x, i) {
    return '<tr tabindex="0" data-act="trip" data-i="' + i + '"><td data-l="' + t('tr.trip') + '"><b>' + esc(x.title) + '</b><br><span class="mono mut">' + x.id + '</span></td><td data-l="' + t('tr.status') + '"><span class="row" style="gap:6px">' + A.chip(vis[x.vis], 'tr.' + x.vis) + (x.fz ? A.chip('frozen', 'tr.frozen') : '') + '</span></td><td data-l="' + t('tr.owner') + '" class="mono">' + x.own + '</td><td data-l="' + t('tr.langs') + '">' + x.langs.toUpperCase().replace(' ', ' · ') + '</td><td data-l="' + t('tr.days') + '">' + x.days + '</td><td data-l="' + t('tr.last') + '">' + ago(x.last) + '</td></tr>';
  }
  function ago(m) { return m < 60 ? t('common.min', { n: m }) : m < 1440 ? t('common.hr', { n: Math.round(m / 60) }) : t('common.day', { n: Math.round(m / 1440) }); }
  function tlist() {
    var rows = A.data.trips.map(function (x, i) { return [x, i]; }).filter(function (p) {
      var x = p[0], q = tf.q.toLowerCase();
      return (tf.f === 'all' || (tf.f === 'frozen' ? x.fz : x.vis === tf.f)) && (!q || (x.id + x.title + x.own).toLowerCase().indexOf(q) >= 0);
    });
    $('#tbody').innerHTML = rows.map(function (p) { return trow(p[0], p[1]); }).join('') || '<tr><td colspan="6"><div class="empty">' + t('log.none') + '</div></td></tr>';
  }
  A.screens.trips = function () {
    var fc = function (f) { return '<button class="chip" data-act="tf" data-v="' + f + '" aria-pressed="' + (tf.f === f) + '">' + t('tr.f.' + f) + '</button>'; };
    return A.head(t('nav.trips'), t('tr.sub')) + '<div class="card"><div class="filters"><label class="fld s"><span class="sr">' + t('tr.search') + '</span><input type="search" id="tq" placeholder="' + t('tr.search') + '" value="' + esc(tf.q) + '"></label><div class="row" role="group" aria-label="' + t('tr.status') + '">' + ['all', 'listed', 'unlisted', 'draft', 'frozen'].map(fc).join('') + '</div></div>' +
      '<div class="tw"><table class="tbl"><thead><tr><th>' + t('tr.trip') + '</th><th>' + t('tr.status') + '</th><th>' + t('tr.owner') + '</th><th>' + t('tr.langs') + '</th><th>' + t('tr.days') + '</th><th>' + t('tr.last') + '</th></tr></thead><tbody id="tbody"></tbody></table></div><p class="mut" style="font-size:.84rem">' + t('tr.masked') + '</p></div>';
  };
  A.init.trips = function () { tlist(); $('#tq').oninput = function (e) { tf.q = e.target.value.trim(); tlist(); }; };
  A.acts.tf = function (el) { tf.f = el.dataset.v; A.render(); };
  A.acts.trip = function (el) {
    var x = A.data.trips[+el.dataset.i], listed = x.vis === 'listed';
    var act = function (a, ic, k, cls) { return '<button class="btn ' + (cls || '') + '" data-act="ta" data-a="' + a + '" data-i="' + el.dataset.i + '"><span aria-hidden="true">' + ic + '</span> ' + t('ta.' + k) + '</button>'; };
    A.drawer(x.title, '<p class="mono mut" style="margin:-6px 0 10px">' + x.id + '</p><div class="row">' + A.chip(vis[x.vis], 'tr.' + x.vis) + (x.fz ? A.chip('frozen', 'tr.frozen') : '') + A.chip('ok', 'dr.ownerok') + '</div>' +
      '<dl class="kv"><dt>' + t('tr.owner') + '</dt><dd class="mono">' + x.own + ' <span class="mut">(' + t('dr.rotated', { n: 12 }) + ')</span></dd><dt>' + t('tr.langs') + '</dt><dd>' + x.langs.toUpperCase().replace(' ', ' · ') + '</dd><dt>' + t('tr.days') + '</dt><dd>' + x.days + '</dd><dt>' + t('dr.members') + '</dt><dd>' + x.mem + '</dd><dt>' + t('dr.plan') + '</dt><dd>' + (x.fz ? t('dr.frozen') : t('dr.notfrozen')) + '</dd><dt>' + t('tr.last') + '</dt><dd>' + ago(x.last) + '</dd></dl>' +
      '<h3>' + t('dr.actions') + '</h3><div class="acts">' + act('view', '👁', 'view') + act('rotate', '🔑', 'rotate') + act('resend', '✉', 'resend') + (x.fz ? '' : act('freeze', '❄', 'freeze')) + act('list', listed ? '🚫' : '🌐', listed ? 'unlist' : 'list') + act('delete', '🗑', 'delete', 'danger') + '</div>' +
      '<p class="mut" style="font-size:.86rem">' + t('dr.nolinks') + '</p><h3>' + t('dr.audit') + '</h3>' + (A.data.audit.filter(function (a) { return a.trip === x.id; }).map(function (a) { return '<div class="health"><span class="mono">' + a.at + '</span><span>' + esc(a.action) + '</span>' + A.chip('hash', '', a.who) + '</div>'; }).join('') || '<p class="mut">' + t('dr.noaudit') + '</p>'));
  };
  A.acts.ta = function (el) {
    var x = A.data.trips[+el.dataset.i], a = el.dataset.a, M = { view: ['view', 'enter_view', 'ta.view.res'], rotate: ['rotate', 'rotate_owner_link', 'ta.rotate.res'], resend: ['resend', 'resend_links', 'ta.resend.res'], freeze: ['freeze', 'freeze_plan', 'ta.freeze.res'], list: ['list', x.vis === 'listed' ? 'unlist' : 'list', 'ta.list.res'], delete: ['delete', 'delete_trip', 'ta.delete.res'] }[a];
    A.reasonDialog({ title: t('ta.' + (a === 'list' ? (x.vis === 'listed' ? 'unlist' : 'list') : a)) + ': ' + x.id, intro: t('ta.' + a + '.intro'), cta: t('ta.' + a + '.cta'), danger: a === 'delete', typed: a === 'delete' ? x.id : '', audit: M[1], target: x.id, result: t(M[2]),
      done: function () { if (a === 'freeze') x.fz = true; if (a === 'list') x.vis = x.vis === 'listed' ? 'unlisted' : 'listed'; if (a === 'delete') A.data.trips.splice(+el.dataset.i, 1); A.close(); if (a === 'list' || a === 'freeze') A.acts.trip(el); A.render(); } });
  };

  /* jobs */
  A.screens.jobs = function () {
    var cnt = function (s) { return A.data.jobs.filter(function (j) { return j.state === s; }).length; }, fc = function (s) { return '<button class="chip ' + s + '" data-act="jf" data-v="' + s + '" aria-pressed="' + (jf === s) + '">' + t('job.' + s) + (s === 'all' ? '' : ' ' + cnt(s)) + '</button>'; };
    var rows = A.data.jobs.map(function (j, i) { return [j, i]; }).filter(function (p) { return jf === 'all' || p[0].state === jf; });
    return A.head(t('nav.jobs'), t('job.sub')) + '<div class="card"><div class="filters"><div class="row" role="group" aria-label="' + t('tr.status') + '">' + ['all', 'queued', 'running', 'done', 'failed'].map(fc).join('') + '</div></div><div class="tw"><table class="tbl"><thead><tr><th>' + t('job.job') + '</th><th>' + t('tr.trip') + '</th><th>' + t('tr.status') + '</th><th>' + t('job.att') + '</th><th>' + t('job.lease') + '</th><th>' + t('job.err') + '</th></tr></thead><tbody>' +
      rows.map(function (p) { var j = p[0]; return '<tr tabindex="0" data-act="job" data-i="' + p[1] + '"><td data-l="' + t('job.job') + '"><span class="mono">' + j.id + '</span><br><span class="mut">' + j.kind + '</span></td><td data-l="' + t('tr.trip') + '" class="mono">' + j.trip + '</td><td data-l="' + t('tr.status') + '">' + A.chip(j.state, 'job.' + j.state) + '</td><td data-l="' + t('job.att') + '">' + j.att + '/3</td><td data-l="' + t('job.lease') + '">' + j.lease + '</td><td data-l="' + t('job.err') + '" class="mono">' + (j.err === '-' ? '-' : '<span style="color:var(--red)">' + j.err + '</span>') + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
  };
  A.acts.jf = function (el) { jf = el.dataset.v; A.render(); };
  A.acts.job = function (el) {
    var j = A.data.jobs[+el.dataset.i], can = j.state === 'failed', stop = j.state === 'queued' || j.state === 'running';
    A.drawer(j.id, '<div class="row">' + A.chip(j.state, 'job.' + j.state) + '<span class="chip hash">' + j.kind + '</span></div><dl class="kv"><dt>' + t('tr.trip') + '</dt><dd class="mono">' + j.trip + '</dd><dt>' + t('job.att') + '</dt><dd>' + j.att + ' / 3</dd><dt>' + t('job.lease') + '</dt><dd>' + j.lease + '</dd><dt>' + t('job.err') + '</dt><dd class="mono">' + j.err + '</dd></dl><h3>' + t('job.steps') + '</h3><ol class="steps">' +
      j.steps.map(function (s, n) { var c = s[1] === 'done' ? 'ok' : s[1] === 'running' ? 'on' : s[1] === 'failed' ? 'bad' : ''; return '<li class="' + c + '"><span class="n"><span>' + (s[1] === 'failed' ? '!' : n + 1) + '</span></span>' + s[0] + '<small>' + (s[2] ? s[2] + ' ms' : t('job.' + s[1])) + '</small></li>'; }).join('') + '</ol>' +
      '<div class="row"><button class="btn primary" data-act="jb" data-a="retry" data-i="' + el.dataset.i + '"' + (can ? '' : ' disabled') + '>↻ ' + t('job.retry') + '</button><button class="btn danger" data-act="jb" data-a="cancel" data-i="' + el.dataset.i + '"' + (stop ? '' : ' disabled') + '>' + t('job.cancel') + '</button><a class="btn" href="#logs" data-act="close">' + t('job.logs') + '</a></div>');
  };
  A.acts.jb = function (el) {
    var j = A.data.jobs[+el.dataset.i], a = el.dataset.a;
    A.reasonDialog({ title: t('job.' + a) + ': ' + j.id, intro: t('job.' + a + '.intro'), cta: t('job.' + a), danger: a === 'cancel', audit: 'job_' + a, target: j.trip, result: t('job.' + a + '.res'), done: function () { j.state = a === 'retry' ? 'queued' : 'failed'; if (a === 'cancel') j.err = 'cancelled'; A.close(); A.render(); } });
  };

  /* drafts and cost: the daily ceiling, per-invite use, the kill switches */
  var KS = ['DRAFTS_ENABLED', 'MAIL_ENABLED', 'CREATE_ENABLED'];
  A.screens.drafts = function () {
    var u = A.data.usage, p = A.pct(u.tokens, u.ceiling), off = KS.filter(function (k) { return !S.kill[k]; });
    return A.head(t('nav.drafts'), t('dc.sub')) + (off.length ? '<div class="banner err" role="status">⚠ ' + t('dc.off', { k: off.join(', ') }) + '</div>' : '') + '<div class="grid two"><section class="card"><span class="k">' + t('dc.ceiling') + '</span><div class="big-n" style="margin:8px 0">' + p + '%</div>' + A.meter(p) + '<div class="mscale"><span>' + (u.tokens / 1e6).toFixed(2) + 'M</span><span>' + t('dc.of', { c: (u.ceiling / 1e6).toFixed(1) + 'M' }) + '</span></div><p class="mut">' + t('dc.reset') + '</p></section>' +
      '<section class="card"><span class="k">' + t('dc.kill') + '</span><p class="mut" style="margin:6px 0 0">' + t('dc.killsub') + '</p>' + KS.map(function (k) { return '<div class="ks"><div class="grow"><code>' + k + '</code><br><span class="mut">' + t('dc.' + k) + '</span></div><button class="sw" role="switch" aria-checked="' + !!S.kill[k] + '" aria-label="' + k + '" data-act="ks" data-k="' + k + '"><i></i><span>' + t(S.kill[k] ? 'dc.on' : 'dc.offl') + '</span></button></div>'; }).join('') + '</section></div>' +
      '<section class="card"><span class="k">' + t('dc.invites') + '</span><div class="tw"><table class="tbl"><thead><tr><th>' + t('dc.invite') + '</th><th>' + t('dc.today') + '</th><th>' + t('dc.tokens') + '</th><th>' + t('dc.share') + '</th></tr></thead><tbody>' + A.data.invites.map(function (v) {
        return '<tr><td data-l="' + t('dc.invite') + '"><span class="chip hash">' + v[0] + '</span> ' + esc(v[1]) + '</td><td data-l="' + t('dc.today') + '">' + v[2] + '</td><td data-l="' + t('dc.tokens') + '" class="mono">' + (v[3] / 1000) + 'k</td><td data-l="' + t('dc.share') + '" style="min-width:140px">' + A.meter(v[4], true) + '</td></tr>'; }).join('') + '</tbody></table></div></section>';
  };
  A.acts.ks = function (el) {
    var k = el.dataset.k, on = S.kill[k];
    A.reasonDialog({ title: t(on ? 'dc.switchoff' : 'dc.switchon') + ' ' + k, intro: t(on ? 'dc.offintro' : 'dc.onintro', { d: t('dc.' + k) }), cta: t(on ? 'dc.switchoff' : 'dc.switchon'), danger: on, audit: (on ? 'switch_off ' : 'switch_on ') + k, target: '-', result: k + ' ' + t(on ? 'dc.offl' : 'dc.on') + '.', done: function () { S.kill[k] = !on; A.render(); } });
  };
})();
