/* The request sheet: one model M, one render. Typing updates only the counters, so focus and the caret are never lost.
   Nothing is sent anywhere: "Send" waits a moment and shows the sent state. */
(function () {
  var MB = 1048576, MAXT = 4000, MAXN = 80, MAXI = 1.5 * MB, SAMPLE = '';
  var M = fresh(), root, t, opener, timer;

  function fresh() { return { phase: 'edit', text: '', name: '', img: null, imgMsg: null, tErr: false, over: false, rate: 15 }; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function size(b) { return '<bdi dir="ltr">' + (b >= 100000 ? (b / MB).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1000)) + ' KB') + '</bdi>'; }
  function num(n) { return '<bdi>' + n.toLocaleString('en') + '</bdi>'; }
  function long(n) { var s = ''; while (s.length < n) s += SAMPLE; return s.slice(0, n); }
  function fill(p) { for (var k in p) M[k] = p[k]; }

  function states() {
    SAMPLE = t('sample') + ' ';
    return {
    1: null,
    2: {},
    3: { text: SAMPLE, name: 'Dana' },
    4: { text: SAMPLE, img: { name: 'screenshot-day2.png', size: 652000, from: 0 } },
    5: { text: SAMPLE, img: { name: 'IMG_2043.jpeg', size: 0.9 * MB, from: 3.1 * MB } },
    6: { text: SAMPLE, imgMsg: 'type' },
    7: { phase: 'sending', text: SAMPLE, img: { name: 'screenshot-day2.png', size: 652000, from: 0 } },
    8: { phase: 'sent' },
    9: { phase: 'net', text: SAMPLE, img: { name: 'screenshot-day2.png', size: 652000, from: 0 } },
    10: { phase: 'rate', text: SAMPLE, rate: 15 },
    11: { phase: 'srv', text: SAMPLE },
    12: { phase: 'off' },
    13: { text: long(3950) },
    14: { text: long(4012), over: true }
    };
  }

  function tpl() {
    var p = M.phase;
    if (p === 'sent') return head('okTitle', 'okTitle2') + msg('', '✓', 'okLead', '<div class="fb-actions" style="justify-content:center"><button type="button" class="btn primary" data-a="again" style="flex:0 1 auto">' + t('okAgain') + '</button><button type="button" class="btn" data-a="close">' + t('okClose') + '</button></div>');
    if (p === 'off') return head('offT', 'offT2') + msg('off', '⏸', 'offL', '<button type="button" class="btn" data-a="close">' + t('okClose') + '</button>');
    var busy = p === 'sending', banner = { net: 'net', rate: 'rate', srv: 'srv' }[p];
    return head('title', 'title2') + (banner ? '<div class="fb-banner" role="alert"><div><b>' + t(banner + 'T') + '</b><span>' + t(banner + 'L', { min: M.rate }) + '</span></div></div>' : '') +
      '<form novalidate><fieldset' + (busy ? ' disabled' : '') + ' style="border:0;padding:0;margin:0 0 4px;min-width:0">' + fText() + fName() + fImage() + '</fieldset>' +
      '<p class="fb-with"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.5"/></svg><span><b>' + t('sentWith') + '</b> ' + t('sentWithT') + '</span></p>' +
      '<div class="fb-actions"><button type="submit" class="btn primary" data-a="send"' + (busy ? ' aria-busy="true"' : '') + '>' + (busy ? '<span class="spin" aria-hidden="true"></span>' + t('sending') : t(banner ? 'retry' : 'send')) + '</button><button type="button" class="btn" data-a="close"' + (busy ? ' disabled' : '') + '>' + t('cancel') + '</button></div></form>';
  }
  function head(a, b) { return '<button type="button" class="fb-x" data-a="close" aria-label="' + t('close') + '">×</button><span class="fb-eyebrow">' + t('eyebrow') + '</span><h2 id="fb-title">' + t(a) + ' <span class="acc">' + t(b) + '</span></h2>'; }
  function msg(cls, ico, key, btns) { return '<div class="fb-msg ' + cls + '" role="status"><div class="ico" aria-hidden="true">' + ico + '</div><p>' + t(key) + '</p>' + btns + '</div>'; }
  function fText() {
    var n = M.text.length, over = n > MAXT, bad = M.tErr || over;
    return '<div class="f"><label for="fb-text">' + t('tLabel') + '</label><textarea id="fb-text" placeholder="' + esc(t('tPh')) + '" aria-describedby="fb-text-c"' + (bad ? ' aria-invalid="true"' : '') + '>' + esc(M.text) + '</textarea>' +
      (M.tErr ? '<p class="fb-err" role="alert">' + t('tErr') + '</p>' : '') + (over ? '<p class="fb-err" role="alert">' + t('tOver', { n: num(n - MAXT) }) + '</p>' : '') + count('fb-text-c', n, MAXT, 'tCount') + '</div>';
  }
  function count(id, n, max, key) {
    var cls = n > max ? 'over' : n >= max * 0.975 ? 'warn' : '';
    return '<div class="fb-count ' + cls + '" id="' + id + '"><span></span><span class="n"' + (cls ? ' aria-live="polite"' : '') + '>' + t(key, { n: num(n), max: num(max) }) + '</span></div>';
  }
  function fName() { return '<div class="f"><label for="fb-name">' + t('nLabel') + '</label><input type="text" id="fb-name" maxlength="' + MAXN + '" placeholder="' + esc(t('nPh')) + '" value="' + esc(M.name) + '" aria-describedby="fb-name-c" autocomplete="off">' + count('fb-name-c', M.name.length, MAXN, 'nCount') + '</div>'; }
  function fImage() {
    var i = M.img, h = '<div class="f"><span class="lbl" id="fb-img-l">' + t('iLabel') + '</span>';
    if (i) {
      h += '<div class="fb-file"><span class="fb-thumb" role="img" aria-label="' + t('iPrev') + '"' + (i.url ? ' style="background:url(' + i.url + ') center/cover"' : '') + '></span><div class="meta"><b>' + esc(i.name) + '</b><span>' + size(i.size) + '</span></div><button type="button" class="btn sm" data-a="rm">' + t('iRemove') + '</button></div>';
      if (i.from) h += '<p class="fb-note" role="status">' + t('iShrunk', { from: size(i.from), to: size(i.size) }) + '</p>';
    } else {
      h += '<div class="fb-pick"><button type="button" class="btn sm" data-a="pick" aria-describedby="fb-img-h fb-img-e">🖼︎  ' + t('iPick') + '</button></div><input type="file" id="fb-file" accept="image/png,image/jpeg,image/webp" hidden>';
    }
    if (M.imgMsg) h += '<p class="fb-err" id="fb-img-e" role="alert">' + t(M.imgMsg === 'type' ? 'iBadType' : 'iBig') + '</p>';
    return h + '<p class="hint" id="fb-img-h">' + t('iHint') + '</p></div>';
  }

  function render(keep) {
    root.innerHTML = '<div class="fb-sheet" role="dialog" aria-modal="true" aria-labelledby="fb-title" id="fb-sheet">' + tpl() + '</div>';
    if (keep !== false) focusFirst();
  }
  function focusFirst() { var e = M.tErr || M.over ? root.querySelector('#fb-text') : root.querySelector('#fb-text,.fb-actions .btn,.fb-x'); if (e) e.focus(); }

  function open(from) {
    opener = from || opener; root.hidden = false; document.body.style.overflow = 'hidden';
    var host = document.getElementById('host'); if (host) host.inert = true;
    if (opener) opener.setAttribute('aria-expanded', 'true');
    render();
  }
  function close() {
    clearTimeout(timer); root.hidden = true; root.innerHTML = ''; document.body.style.overflow = '';
    var host = document.getElementById('host'); if (host) host.inert = false;
    var p = opener && document.contains(opener) ? opener : document.querySelector('.fb-pill');
    if (p) { p.setAttribute('aria-expanded', 'false'); p.focus(); }
    if (M.phase === 'sent') M = fresh();
  }
  function send() {
    M.tErr = !M.text.trim(); if (M.tErr || M.text.length > MAXT) { render(); return; }
    M.phase = 'sending'; M.over = false; render();
    timer = setTimeout(function () { M.phase = 'sent'; render(); }, 1300);
  }
  function pickFile(f) {
    M.imgMsg = null;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) M.imgMsg = 'type';
    else if (f.size > 8 * MB) M.imgMsg = 'big';
    else M.img = { name: f.name, size: f.size > MAXI ? Math.min(f.size * 0.3, MAXI * 0.8) : f.size, from: f.size > MAXI ? f.size : 0, url: URL.createObjectURL(f) };
    render(false); var e = root.querySelector('[data-a=rm],[data-a=pick]'); if (e) e.focus();
  }

  function onClick(e) {
    var b = e.target.closest('[data-a]'); if (!b) { if (e.target === root) close(); return; }
    var a = b.dataset.a;
    if (a === 'close') close();
    else if (a === 'send') { e.preventDefault(); send(); }
    else if (a === 'pick') root.querySelector('#fb-file').click();
    else if (a === 'rm') { M.img = null; M.imgMsg = null; render(false); root.querySelector('[data-a=pick]').focus(); }
    else if (a === 'again') { M = fresh(); render(); }
  }
  function onInput(e) {
    var id = e.target.id; if (id !== 'fb-text' && id !== 'fb-name') return;
    var txt = id === 'fb-text'; M[txt ? 'text' : 'name'] = e.target.value; if (txt) M.tErr = false;
    var c = root.querySelector(txt ? '#fb-text-c' : '#fb-name-c'), n = e.target.value.length, max = txt ? MAXT : MAXN;
    c.outerHTML = count(txt ? 'fb-text-c' : 'fb-name-c', n, max, txt ? 'tCount' : 'nCount');
  }
  function onKey(e) {
    if (root.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return;
    var f = [].filter.call(root.querySelectorAll('button,input,textarea,[href]'), function (x) { return !x.disabled && !x.hidden && x.type !== 'hidden' && x.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  window.Sheet = {
    init: function (el, tr) {
      root = el; t = tr; root.addEventListener('click', onClick); root.addEventListener('input', onInput); document.addEventListener('keydown', onKey);
      root.addEventListener('change', function (e) { if (e.target.id === 'fb-file' && e.target.files[0]) pickFile(e.target.files[0]); });
    },
    open: open, close: close,
    retext: function (tr) { t = tr; if (!root.hidden) render(false); },
    state: function (n) {
      var s = states()[n]; clearTimeout(timer);
      if (!root.hidden) { root.hidden = true; root.innerHTML = ''; document.body.style.overflow = ''; }
      M = fresh();
      if (s) { fill(s); var p = document.querySelector('.fb-pill'); open(p); } else { var h = document.getElementById('host'); if (h) h.inert = false; document.querySelectorAll('.fb-pill').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); }); }
    }
  };
})();
