/* Drawing: the landing page body and the two sheets. Pure string builders over the mock state S (set in mock.js).
   All strings are the mock's own invented text, so innerHTML is safe here; the real page uses textContent. */
(function () {
  var V = window.V = {};
  var ROLE_ICON = { owner: '🔑', member: '👥', viewer: '👁️' };
  var FLAG = { en: 'en-GB', he: 'he-IL' };

  function t(k, p) { var s = window.I18N[V.S.lang][k]; if (s == null) s = k; for (var x in p || {}) s = s.split('{' + x + '}').join(p[x]); return s; }
  V.t = t;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function rel(h) {
    var d = Math.floor(h / 24);
    if (h < 1) return t('now_h');
    if (h < 2) return t('h1');
    if (h < 3) return t('h2');
    if (h < 24) return t('hN', { n: Math.floor(h) });
    if (d < 2) return t('d1');
    if (d < 7) return t('dN', { n: d });
    if (d < 14) return t('w1');
    if (d < 30) return t('wN', { n: Math.floor(d / 7) });
    if (d < 60) return t('m1');
    return t('mN', { n: Math.floor(d / 30) });
  }
  function range(a, b) {
    var f = new Intl.DateTimeFormat(FLAG[V.S.lang], { day: 'numeric', month: 'short', year: 'numeric' });
    return f.formatRange(new Date(a + 'T12:00:00'), new Date(b + 'T12:00:00'));
  }
  function when(x) {
    var a = new Date(x.from + 'T00:00:00'), b = new Date(x.to + 'T23:59:59'), n = window.TODAY;
    return a > n ? 'up' : (b < n ? 'past' : 'now');
  }

  function card(x, i) {
    var w = when(x), stale = V.S.preset.stale && x.stale;
    return '<li class="trip' + (stale ? ' stale' : '') + '" style="animation-delay:' + (i * 0.05) + 's">' +
      '<a class="open" href="#" data-act="open-trip" lang="' + x.lang + '"><h3 dir="auto">' + esc(x.title) + '</h3></a>' +
      '<p class="dates"><span>' + range(x.from, x.to) + '</span><span class="when ' + w + '">' + t(w) + '</span></p>' +
      '<div class="chips"><span class="chip ' + x.role + '"><span aria-hidden="true">' + ROLE_ICON[x.role] + '</span>' + t('role_' + x.role) + '</span>' +
      '<span class="chip">' + t('lang_' + x.lang) + '</span><span class="opened">' + t('opened', { r: rel(x.ago) }) + '</span></div>' +
      (stale ? '<div class="note warn" role="note"><span class="ni" aria-hidden="true">⏳</span><span><b>' + t('staleT') + '</b>' + t('staleB') + '</span></div>' : '') +
      '<div class="foot"><span class="go">' + t('open') + ' <span class="flip" aria-hidden="true">→</span></span>' +
      '<button type="button" class="rm" data-act="rm" data-id="' + x.id + '" aria-label="' + esc(t('removeTip', { t: x.title })) + '"><span aria-hidden="true">✕</span>' + t('remove') + '</button></div></li>';
  }

  function skeletons() {
    var c = '<li class="trip" aria-hidden="true"><span class="skel sk" style="width:70%"></span><span class="skel sk" style="width:45%"></span><span class="skel sk" style="width:60%;height:28px"></span><span class="skel sk" style="width:35%;margin-top:6px"></span></li>';
    return '<div class="listhead"><span class="skel sk" style="width:160px"></span></div><ul class="trips" aria-hidden="true">' + c + c + c + '</ul>';
  }

  V.list = function () {
    var S = V.S, all = S.trips, many = all.length > 6, q = S.q.trim().toLowerCase();
    var shown = all.filter(function (x) { return !q || x.title.toLowerCase().indexOf(q) > -1; });
    var h = '<div class="listhead"><h2>' + t('listTitle') + '</h2><span class="meta" id="cnt" aria-live="polite">' +
      (q ? t('countShown', { m: shown.length, n: all.length }) : (all.length === 1 ? t('count1') : t('countN', { n: all.length }))) + (all.length > 1 ? ' · ' + t('sorted') : '') + '</span></div>';
    if (many) h += '<div class="search"><label for="q">' + t('searchL') + '</label><div class="box"><input id="q" type="search" autocomplete="off" placeholder="' + esc(t('searchPh')) + '" value="' + esc(S.q) + '"></div></div>';
    if (!shown.length) return h + '<div class="empty" role="status"><h2>' + t('noMatchT') + '</h2><p>' + t('noMatchB', { q: esc(S.q.trim()) }) + '</p><div class="hero-actions"><button class="btn sm" data-act="clear-q">' + t('clearSearch') + '</button> <button class="btn sm outline" data-act="open-find">' + t('find') + '</button></div></div>';
    return h + '<ul class="trips">' + shown.map(card).join('') + '</ul>';
  };

  V.page = function () {
    var S = V.S, P = S.preset, n = S.trips.length, welcome = !P.load && n === 0;
    var open = !P.closed;
    var h = '<header class="hero"><span class="eyebrow">' + t(welcome ? 'eyWelcome' : 'eyTrips') + '</span>';
    h += welcome ? '<h1><span>' + t('h1a') + '</span><span class="acc">' + t('h1b') + '</span></h1>' : '<h1><span>' + t('h2a') + '</span><span class="acc">' + t('h2b') + '</span></h1>';
    h += '<p class="lead">' + t(welcome ? 'leadWelcome' : 'leadTrips') + '</p><div class="actions">';
    if (P.load) h += '<span class="skel btn-s" aria-hidden="true"></span>';
    else if (open) h += '<a class="btn primary" href="#" data-act="create">' + t('create') + ' <span class="flip" aria-hidden="true">→</span></a>';
    h += '</div>';
    if (P.closed) h += '<div class="note closednote" role="note"><span class="ni" aria-hidden="true">🌙</span><span>' + t('closed') + '</span></div>';
    if (welcome && open) h += '<p class="hint">' + t('linkHint') + '</p>';
    h += '</header>';
    if (P.load) return h + '<section aria-busy="true" aria-label="' + esc(t('listTitle')) + '">' + skeletons() + '</section>';
    if (welcome) return h + '<section class="empty"><h2>' + t('emptyT') + '</h2><p>' + t('noList') + '</p><button type="button" class="btn outline" data-act="open-find">' + t('find') + '</button></section>';
    h += '<section id="listwrap">' + V.list() + '</section>';
    h += '<div class="findrow"><p>' + t('findHint') + '</p><button type="button" class="btn outline sm" data-act="open-find">' + t('find') + '</button></div>';
    return h + '<div class="clearrow"><button type="button" class="btn ghost sm" data-act="clear-open">' + t('clearEntry') + '</button><span>' + t('clearHint') + '</span></div>';
  };

  function head(id, key) {
    return '<div class="bar"><span class="k">' + t(key) + '</span><button type="button" class="x" data-act="close" aria-label="' + t('close') + '"><span aria-hidden="true">✕</span></button></div>';
  }

  V.sheet = function () {
    var S = V.S, st = S.stage, m = '<span class="sent-to">' + esc(S.email) + '</span>';
    if (S.sheet === 'clear') {
      return head('c', 'listTitle') + '<h2 id="sh-t" tabindex="-1">' + t('cT') + '</h2><p>' + t('cB') + '</p>' +
        '<div class="actions"><button type="button" class="btn danger" data-act="clear-yes">' + t('cYes') + '</button><button type="button" class="btn outline" data-act="close">' + t('cNo') + '</button></div>';
    }
    var h = head('f', 'find');
    if (st === 'sent') return h + '<span class="dot" aria-hidden="true"></span><h2 id="sh-t" tabindex="-1">' + t('sT') + '</h2><p>' + t('sB') + '</p><p>' + t('sTo') + ' ' + m + '</p>' +
      '<div class="actions"><button type="button" class="btn outline" data-act="again" id="again" disabled>' + t('sAgainIn', { s: S.cd }) + '</button><button type="button" class="btn ghost" data-act="close">' + t('sDone') + '</button></div>';
    if (st === 'net') return h + '<span class="dot bad" aria-hidden="true"></span><h2 id="sh-t" tabindex="-1">' + t('eNetT') + '</h2><p role="alert">' + t('eNetB') + '</p>' +
      '<div class="actions"><button type="button" class="btn primary" data-act="retry">' + t('eNetBtn') + '</button><button type="button" class="btn ghost" data-act="close">' + t('close') + '</button></div>';
    if (st === 'rate') return h + '<span class="dot bad" aria-hidden="true"></span><h2 id="sh-t" tabindex="-1">' + t('eRateT') + '</h2><p role="alert">' + t('eRateB', { m: 14 }) + '</p>' +
      '<div class="actions"><button type="button" class="btn primary" disabled>' + t('eRateBtn', { m: 14 }) + '</button><button type="button" class="btn ghost" data-act="close">' + t('close') + '</button></div>';
    var busy = st === 'sending';
    return h + '<h2 id="sh-t" tabindex="-1">' + t('fT') + '</h2><p>' + t('fB') + '</p>' +
      '<form id="ff" novalidate' + (busy ? ' aria-busy="true"' : '') + '><div class="field"><label class="lbl" for="em">' + t('fL') + '</label>' +
      '<input id="em" type="email" autocomplete="email" dir="ltr" placeholder="' + esc(t('fPh')) + '" value="' + esc(S.email) + '"' + (busy ? ' disabled' : '') + (S.err ? ' aria-invalid="true" aria-describedby="em-e"' : '') + '>' +
      (S.err ? '<p class="err" id="em-e" role="alert">' + t('fErrEmail') + '</p>' : '') + '</div>' +
      (busy ? '<div class="prog" role="progressbar" aria-label="' + esc(t('fSending')) + '"><i></i></div><p role="status">' + t('fSendingB') + '</p>' : '') +
      '<div class="actions"><button type="submit" class="btn primary"' + (busy ? ' disabled' : '') + '>' + t(busy ? 'fSending' : 'fSend') + '</button></div></form>' +
      '<div class="note info honest" role="note"><span class="ni" aria-hidden="true">🔒</span><span>' + t('fHonest') + '</span></div>';
  };
})();
