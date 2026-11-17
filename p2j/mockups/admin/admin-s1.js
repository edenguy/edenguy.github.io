/* Screens 1-3: sign-in wall, overview, logs (with the event drawer). Fake data only. */
(function () {
  var A = window.A, S = A.S, t = A.t, esc = A.esc, $ = A.$;
  function L(ago, ts, lv, comp, ev, tr, dp, trip, dur, off, msg) { return { ago: ago, ts: ts, lv: lv, comp: comp, ev: ev, tr: tr, dp: dp, trip: trip, dur: dur, off: off, msg: msg, req: 'req_' + tr.slice(3) }; }
  A.data.logs = [
    L(1, '15:41:07.412', 'info', 'job', 'job.done', 'tr_8f21', 0, 'it-6d-fam-k3p9', 18420, 18420, 'kind=build-trip days=6 attempt=1'),
    L(1, '15:41:07.398', 'info', 'check', 'check.findings', 'tr_8f21', 1, 'it-6d-fam-k3p9', 41, 18300, 'n=0 package ok'),
    L(1, '15:41:02.114', 'warn', 'llm', 'llm.repair', 'tr_8f21', 1, 'it-6d-fam-k3p9', null, 11800, 'repair round opens: 2 findings, first: days[3].items[2].maps is [invalid]'),
    L(1, '15:40:54.907', 'info', 'llm', 'llm.call', 'tr_8f21', 2, 'it-6d-fam-k3p9', 7210, 4590, 'provider=fake round=1 in=3120 out=5480 truncated=false'),
    L(1, '15:40:50.300', 'info', 'job', 'job.step', 'tr_8f21', 1, 'it-6d-fam-k3p9', 38, 40, 'step=brief-parsed vegetarian=true stroller=true museums=avoid'),
    L(2, '15:40:50.260', 'info', 'http', 'http.request', 'tr_8f21', 0, 'it-6d-fam-k3p9', 64, 0, 'POST /api/admin/trips 202 role=admin bytes_in=212'),
    L(3, '15:39:12.020', 'error', 'mail', 'mail.send', 'tr_19be', 0, 'rome-hols-2027', 912, 912, 'template=owner_links lang=he to=[email] adapter=resend err=provider_429'),
    L(3, '15:39:11.108', 'warn', 'rate', 'rate.hit', 'tr_19be', 1, null, null, 0, 'limit=5/h bucket=create:ip-9c1e retry_after=2312'),
    L(5, '15:37:44.551', 'warn', 'http', 'http.request', 'tr_77d0', 0, 'hungary-2026', 133, 133, 'PUT /api/trips/:id 400 role=owner findings=1 first=days[2].items[1].t is [invalid]'),
    L(5, '15:37:44.470', 'warn', 'check', 'check.findings', 'tr_77d0', 1, 'hungary-2026', 12, 60, 'n=1 first=days[2].items[1].t is [invalid]'),
    L(8, '15:34:03.002', 'warn', 'db', 'db.slow', 'tr_c04a', 1, 'lisbon-weekend', 412, 40, 'op=all n=118 sql=SELECT path,value,ts FROM leaves WHERE trip=?'),
    L(8, '15:34:02.981', 'info', 'http', 'http.request', 'tr_c04a', 0, 'lisbon-weekend', 463, 463, 'GET /api/trips/:id/state 200 role=member bytes_out=48211'),
    L(12, '15:30:41.700', 'warn', 'auth', 'auth.admin_refused', 'tr_5aa2', 0, null, null, 0, 'ok=false email=[email] reason=not_on_allow_list ip=ip-31ab'),
    L(14, '15:28:09.330', 'info', 'admin', 'admin.action', 'tr_d913', 0, 'tokyo-spring', null, 0, 'action=rotate_owner_link target=tokyo-spring result=ok reason=owner'),
    L(20, '15:22:30.004', 'info', 'cron', 'cron.freeze', 'tr_e001', 0, null, 220, 220, 'frozen=2 skipped=31'),
    L(26, '15:16:18.118', 'error', 'job', 'job.failed', 'tr_a771', 0, 'ski-alps-fam', 30210, 30210, 'kind=build-trip step=checked err=llm_truncated attempt=3'),
    L(26, '15:16:17.900', 'warn', 'llm', 'llm.capped', 'tr_a771', 1, 'ski-alps-fam', null, 29900, 'daily token ceiling 91% reached, call refused'),
    L(41, '15:01:55.560', 'debug', 'http', 'http.request', 'tr_f20c', 0, null, 9, 9, 'GET /version.json 200 sampled=1/50')
  ];
  var lf = { lv: { debug: false, info: true, warn: true, error: true }, trip: '', req: '', range: 60 };
  var POOL = [['info', 'http', 'http.request', 'PUT /api/trips/:id/state 200 role=member'], ['info', 'mail', 'mail.send', 'template=member_link lang=en to=[email] adapter=resend'], ['warn', 'rate', 'rate.hit', 'limit=60/h bucket=state:ip-e2b0'], ['info', 'job', 'job.step', 'step=days-drafted day=3 of 6']];
  var seq = 0;

  A.redact = function (s) { return esc(s).replace(/\[(email|invalid|token|ip|prompt)\]/g, function (m, k) { return '<span class="chip red" title="' + t('log.redacted') + '">' + m + '</span>'; }); };
  function row(e, i, fresh) {
    return '<button class="lr l-' + e.lv + (fresh ? ' new' : '') + '" data-act="ev" data-i="' + i + '"><span class="ld">' + e.ts.slice(0, 8) + '</span><span class="lv">' + e.lv + '</span><span class="lm" style="--dp:' + e.dp + '"><span class="ev">' + e.ev + '</span> <span class="sp">' + (e.trip || '') + '</span> ' + A.redact(e.msg) + '</span><span class="ld">' + (e.dur != null ? e.dur + ' ms' : '') + '</span></button>';
  }
  function list() {
    var rows = A.data.logs.map(function (e, i) { return [e, i]; }).filter(function (p) {
      var e = p[0]; return lf.lv[e.lv] && e.ago <= lf.range && (!lf.trip || (e.trip || '').indexOf(lf.trip) >= 0) && (!lf.req || e.req.indexOf(lf.req) >= 0);
    });
    $('#loglist').innerHTML = rows.length ? rows.map(function (p) { return row(p[0], p[1], p[0].fresh && (p[0].fresh = false, true)); }).join('') : '<div class="empty">' + t('log.none') + '</div>';
    $('#logcount').textContent = t('log.count', { n: rows.length, m: A.data.logs.length });
  }
  A.screens.logs = function () {
    var sw = '<button class="sw tail" role="switch" aria-checked="' + !!lf.tail + '" data-act="tail"><i></i><span>' + t('log.tail') + '</span></button>';
    return A.head(t('nav.logs'), t('log.sub'), sw) + '<div class="card"><div class="filters"><div class="row" role="group" aria-label="' + t('log.level') + '">' + ['debug', 'info', 'warn', 'error'].map(function (l) {
      return '<button class="chip ' + ({ debug: '', info: 'ok', warn: 'warn', error: 'err' }[l]) + '" data-act="lv" data-v="' + l + '" aria-pressed="' + lf.lv[l] + '">' + l + '</button>'; }).join('') + '</div>' +
      '<label class="fld s"><span class="sr">' + t('log.trip') + '</span><input type="search" id="ftrip" placeholder="' + t('log.trip') + '" value="' + esc(lf.trip) + '"></label>' +
      '<label class="fld"><span class="sr">' + t('log.req') + '</span><input type="search" id="freq" placeholder="' + t('log.req') + '" value="' + esc(lf.req) + '"></label>' +
      '<label class="fld"><span class="sr">' + t('log.range') + '</span><select id="frange">' + [[15, '15m'], [60, '1h'], [1440, '24h'], [10080, '7d']].map(function (r) { return '<option value="' + r[0] + '"' + (lf.range === r[0] ? ' selected' : '') + '>' + t('log.last', { r: r[1] }) + '</option>'; }).join('') + '</select></label></div>' +
      '<p class="mut" id="logcount" style="margin:0 0 10px" aria-live="polite"></p><div class="log" id="loglist"></div></div>';
  };
  var timer;
  A.init.logs = function () {
    list();
    $('#ftrip').oninput = function (e) { lf.trip = e.target.value.trim(); list(); };
    $('#freq').oninput = function (e) { lf.req = e.target.value.trim(); list(); };
    $('#frange').onchange = function (e) { lf.range = +e.target.value; list(); };
    clearInterval(timer);
    if (lf.tail) timer = setInterval(function () {
      if (S.screen !== 'logs') return clearInterval(timer);
      var p = POOL[seq++ % POOL.length], n = new Date();
      A.data.logs.unshift({ ago: 0, ts: n.toTimeString().slice(0, 8) + '.' + String(n.getMilliseconds()).padStart(3, '0'), lv: p[0], comp: p[1], ev: p[2], tr: 'tr_' + (4000 + seq).toString(16), dp: 0, trip: 'it-6d-fam-k3p9', dur: 20 + seq * 7, off: 0, msg: p[3], fresh: true, req: 'req_' + (4000 + seq).toString(16) });
      list();
    }, 2200);
  };
  A.acts.tail = function (el) { lf.tail = !lf.tail; A.render(); };
  A.acts.lv = function (el) { lf.lv[el.dataset.v] = !lf.lv[el.dataset.v]; A.render(); };
  A.acts.ev = function (el) {
    var e = A.data.logs[+el.dataset.i], same = A.data.logs.filter(function (x) { return x.tr === e.tr; }).sort(function (a, b) { return a.off - b.off; }), max = Math.max.apply(null, same.map(function (x) { return x.off + (x.dur || 0); })) || 1;
    A.drawer(e.ev, '<div class="row"><span class="chip ' + ({ debug: '', info: 'ok', warn: 'warn', error: 'err' }[e.lv]) + '">' + e.lv + '</span><span class="chip hash">' + e.comp + '</span>' + (e.trip ? '<span class="chip">' + e.trip + '</span>' : '') + '</div>' +
      '<dl class="kv"><dt>' + t('log.time') + '</dt><dd class="mono">' + e.ts + '</dd><dt>' + t('log.trace') + '</dt><dd class="mono">' + e.tr + '</dd><dt>' + t('log.req') + '</dt><dd class="mono">' + e.req + '</dd><dt>' + t('log.dur') + '</dt><dd>' + (e.dur != null ? e.dur + ' ms' : '-') + '</dd></dl>' +
      '<h3>' + t('log.msg') + '</h3><p class="log">' + A.redact(e.msg) + '</p><p class="mut" style="font-size:.86rem">' + t('log.redactnote') + '</p>' +
      '<h3>' + t('log.trace') + ' <span class="mut mono">' + same.length + ' ' + t('log.spans') + '</span></h3><div class="tr log" role="list">' + same.map(function (x) {
        return '<div class="bar" role="listitem" style="' + (x === e ? 'font-weight:800' : '') + '"><span style="padding-inline-start:' + x.dp * 14 + 'px">' + x.ev + '</span><span class="track"><i style="--o:' + Math.round(x.off * 100 / max) + '%;width:' + Math.max(2, Math.round((x.dur || 0) * 100 / max)) + '%"></i></span><span>' + (x.dur != null ? x.dur + 'ms' : '') + '</span></div>'; }).join('') + '</div>' +
      '<div class="row"><button class="btn sm" data-act="filtertrace" data-v="' + e.req + '">' + t('log.onlytrace') + '</button><button class="btn sm" data-act="copy" data-v="' + e.tr + '">' + t('common.copy') + ' ' + e.tr + '</button></div>');
  };
  A.acts.filtertrace = function (el) { lf.req = el.dataset.v; A.close(); location.hash = '#logs'; A.render(); };

  /* overview */
  A.screens.overview = function () {
    var d = A.data, jr = d.jobs.filter(function (j) { return j.state === 'running'; }).length, jf = d.jobs.filter(function (j) { return j.state === 'failed'; }).length, pct = A.pct(d.usage.tokens, d.usage.ceiling);
    var recent = d.logs.filter(function (e) { return e.lv === 'warn' || e.lv === 'error'; }).slice(0, 5);
    return A.head('<span class="acc">' + t('nav.overview') + '</span>', t('ov.sub')) + '<div class="grid">' +
      cnt('t1', t('ov.trips'), d.trips.length + 29, t('ov.trips.sub', { n: 3 })) + cnt('t4', t('ov.drafts'), 17, t('ov.drafts.sub', { n: 11 })) +
      cnt('t2', t('ov.jobs'), jr + ' / <span class="bad">' + jf + '</span>', t('ov.jobs.sub')) + cnt('t3', t('ov.mail'), '38 / <span class="bad">2</span>', t('ov.mail.sub')) + '</div>' +
      '<div class="grid two"><section class="card"><span class="k">' + t('ov.tokens') + '</span><div class="big-n" style="margin:6px 0">' + (d.usage.tokens / 1e6).toFixed(2) + 'M <span class="mut" style="font-size:1rem;font-family:var(--fb)">/ ' + (d.usage.ceiling / 1e6).toFixed(1) + 'M</span></div>' + A.meter(pct) +
      '<div class="mscale"><span>0</span><span>' + t('ov.ceiling') + '</span></div><p class="mut" style="margin:10px 0 0">' + t('ov.spend', { s: '$4.12', c: '$5.50' }) + '</p><div aria-hidden="true" style="display:flex;align-items:flex-end;gap:5px;height:110px;margin-top:18px">' + [2, 3, 1, 4, 6, 9, 14, 11, 16, 12, 18, 9, 7, 5, 8, 3].map(function (h) { return '<i style="flex:1;height:' + h * 5 + '%;border-radius:6px 6px 2px 2px;background:linear-gradient(180deg,var(--a),var(--b));opacity:.85"></i>'; }).join('') + '</div></section>' +
      '<section class="card"><span class="k">' + t('ov.recent') + '</span><div class="log" style="margin-top:10px">' + recent.map(function (e) { return row(e, d.logs.indexOf(e)); }).join('') + '</div><a class="btn sm" href="#logs">' + t('ov.alllogs') + '</a></section></div>';
  };
  function cnt(c, k, v, s) { return '<div class="cnt ' + c + '"><span class="k">' + k + '</span><b>' + v + '</b><small>' + s + '</small></div>'; }
  A.meter = function (pct, sm) { return '<div class="meter' + (sm ? ' sm' : '') + '" role="meter" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="' + pct + '%"><i style="width:' + pct + '%;--bw:' + (pct ? Math.round(10000 / pct) : 100) + '%"></i></div>'; };

  /* sign-in wall: the Cloudflare Access hand-off */
  A.screens.signin = function () {
    var st = S.signin, body;
    if (st === 'start') body = '<p>' + t('si.lead') + '</p><button class="btn primary xl" data-act="si" data-v="checking">☁ ' + t('si.cta') + '</button><p class="mut" style="font-size:.86rem;margin-bottom:0">' + t('si.fine') + '</p>';
    else if (st === 'checking') body = '<p>' + t('si.checking') + '</p><ol class="steps"><li class="ok"><span class="n"><span>1</span></span>' + t('si.s1') + '</li><li class="ok"><span class="n"><span>2</span></span>' + t('si.s2') + '</li><li class="on"><span class="n"><span>3</span></span>' + t('si.s3') + '</li></ol><button class="btn" data-act="si" data-v="ok">' + t('si.next') + '</button>';
    else if (st === 'denied') body = '<div class="banner err" role="alert">' + t('si.denied') + '</div><p>' + t('si.deniedsub', { e: '<b class="mono">visitor-9@example.test</b>' }) + '</p><button class="btn" data-act="si" data-v="start">' + t('common.back') + '</button>';
    else body = '<p>' + t('si.ok') + '</p><div style="margin:10px 0"><span class="who"><i aria-hidden="true">A2</i><span style="display:inline">admin-2@example.test</span></span></div><div class="row" style="justify-content:center"><span class="chip ok">' + t('si.session') + '</span><span class="chip">' + t('si.2fa') + '</span></div><a class="btn primary xl" href="#overview">' + t('si.enter') + '</a>';
    return '<section class="card gate"><div class="lock" aria-hidden="true">' + (st === 'denied' ? '⛔' : '🔒') + '</div><span class="k">' + t('si.k') + '</span><h1 style="font-size:2rem;margin:6px 0 10px">' + (st === 'denied' ? t('si.denied') : '<span class="acc">' + t('si.title') + '</span>') + '</h1>' + body + '</section>';
  };
  A.acts.si = function (el) { S.signin = el.dataset.v; A.render(); };
  var oc = A.ctl; A.ctl = function () {
    return (oc ? oc() : '') + '<div class="grp"><span>' + t('ctl.signin') + '</span>' + ['start', 'checking', 'ok', 'denied'].map(function (s) { return '<button data-set="signin" data-v="' + s + '" aria-pressed="' + (S.signin === s) + '">' + t('si.st.' + s) + '</button>'; }).join('') + '</div>';
  };
})();
