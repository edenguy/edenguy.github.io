/* Mockup behaviour: tab switching, fake interactions, the shared brief. No network, no storage. */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var L = 'en', S = { tab: 'd', phase: 'edit', src: 'd', empty: false }, route = [], B = [];
  var CHIPS = { i: ['museums', 'nature', 'food', 'beaches', 'history', 'kids', 'nightlife', 'shopping'], a: ['museums', 'crowds', 'drives', 'early', 'heat'], d: ['vegetarian', 'vegan', 'kosher', 'halal', 'glutenfree'], m: ['stroller', 'wheelchair', 'limited', 'noCar'], l: ['en', 'he'] };
  var GROUPS = ['gDest', 'gWhen', 'gWho', 'gLike', 'gAvoid', 'gFood', 'gMove', 'gPace', 'gLang'];
  var MAIL = 'sara@example.com';

  function t(k, p) { var s = (I18N[L][k] != null ? I18N[L][k] : k); for (var x in p || {}) s = s.replace('{' + x + '}', p[x]); return s; }
  function nm(c) { return COUNTRIES[c][L]; }
  function city(c, id) { var r = COUNTRIES[c].c.filter(function (x) { return x[0] === id; })[0]; return L === 'he' ? r[2] : r[1]; }

  /* build the static widgets once */
  function build() {
    $$('[data-chips]').forEach(function (box) {
      var p = box.dataset.chips;
      box.innerHTML = CHIPS[p].map(function (v) { return '<label class="chk' + ('neg' in box.dataset ? ' neg' : '') + '"><input type="checkbox" name="' + box.dataset.name + '" value="' + v + '"><span data-i18n="' + p + '.' + v + '"></span></label>'; }).join('');
    });
    $('#f-dur').innerHTML = [[3, 'wk'], [7, 'wk1'], [14, 'wk2'], [0, 'cust']].map(function (d) { return '<label><input type="radio" name="dur" value="' + d[0] + '"><span><b data-i18n="' + d[1] + '"></b>' + (d[0] ? '<small>' + d[0] + '</small>' : '') + '</span></label>'; }).join('');
    $('#f-budget').innerHTML = [1, 2, 3].map(function (n) { return '<label><input type="radio" name="budget" value="' + n + '"' + (n === 2 ? ' checked' : '') + '><span data-i18n="b' + n + '"></span></label>'; }).join('');
    $('#f-country').innerHTML = '<option value="" data-i18n="pickCountry"></option>' + Object.keys(COUNTRIES).map(function (c) { return '<option value="' + c + '"></option>'; }).join('');
    $('#states').innerHTML = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9'].map(function (k, i) { return '<button type="button" data-state="' + (i + 1) + '" aria-pressed="false" data-i18n="' + k + '"></button>'; }).join('');
  }

  /* text, direction, dynamic parts */
  function applyLang() {
    document.documentElement.lang = L; document.documentElement.dir = L === 'he' ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach(function (e) { e.textContent = t(e.dataset.i18n); });
    $$('[data-i18n-ph]').forEach(function (e) { e.placeholder = t(e.dataset.i18nPh); });
    $('#d-ex-t').textContent = t('ex');
    $$('#f-country option[value]').forEach(function (o) { if (o.value) o.textContent = nm(o.value); });
    $$('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.lang === L); });
    $$('#f-ages select').forEach(function (s, i) { s.previousElementSibling.textContent = t('age') + ' ' + (i + 1); });
    $('#add-form label').textContent = t('addPh');
    paceText(); drawPicks(); drawRoute(); drawBrief();
    $$('.mailto').forEach(function (e) { e.textContent = $('#d-mail').value || $('#f-mail').value || MAIL; });
  }
  function paceText() { $('#f-pace').setAttribute('aria-valuetext', t('p.' + $('#f-pace').value)); }

  /* cascading places and ordered route */
  function drawPicks() {
    var c = $('#f-country').value, box = $('#f-picks');
    $('#f-city-h').textContent = t(c ? 'cityHint' : 'cityNone');
    box.innerHTML = c ? COUNTRIES[c].c.map(function (x) {
      var on = route.some(function (r) { return r.c === c && r.id === x[0]; });
      return '<button type="button" class="pick" data-c="' + c + '" data-id="' + x[0] + '"' + (on ? ' disabled' : '') + '>' + (L === 'he' ? x[2] : x[1]) + '</button>';
    }).join('') : '';
  }
  function drawRoute() {
    $('#f-route-empty').hidden = route.length > 0;
    $('#f-route').innerHTML = route.map(function (r, i) {
      var n = city(r.c, r.id);
      return '<li><span class="nm">' + n + '</span><div class="tools"><div class="nights"><span>' + t('nights') + '</span><div class="step"><button type="button" data-rn="' + i + '" data-d="-1" aria-label="' + t('nights') + ' -">&minus;</button><input type="number" value="' + r.n + '" min="0" max="14" data-ri="' + i + '" aria-label="' + n + ' ' + t('nights') + '"><button type="button" data-rn="' + i + '" data-d="1" aria-label="' + t('nights') + ' +">+</button></div></div>' +
        '<button type="button" data-mv="' + i + '" data-d="-1" aria-label="' + t('up') + ': ' + n + '"' + (i ? '' : ' disabled') + '>&uarr;</button><button type="button" data-mv="' + i + '" data-d="1" aria-label="' + t('down') + ': ' + n + '"' + (i < route.length - 1 ? '' : ' disabled') + '>&darr;</button><button type="button" data-rm="' + i + '" aria-label="' + t('rm') + ': ' + n + '">&times;</button></div></li>';
    }).join('');
    var sum = route.reduce(function (a, r) { return a + r.n; }, 0);
    $('#f-sum').textContent = sum + ' ' + t('nightsSum') + ' / ' + $('#f-days').value + ' ' + t('days');
  }
  function drawAges(keep) {
    var n = +$('#f-kids').value, box = $('#f-ages'), old = $$('select', box).map(function (s) { return s.value; });
    box.innerHTML = '';
    for (var i = 0; i < n; i++) {
      var o = ''; for (var a = 0; a < 18; a++) o += '<option' + (String(a) === (old[i] || '5') ? ' selected' : '') + '>' + a + '</option>';
      var d = document.createElement('div'); d.innerHTML = '<label for="age' + i + '">' + t('age') + ' ' + (i + 1) + '</label><select id="age' + i + '">' + o + '</select>'; box.appendChild(d);
    }
  }
  function syncDur() { var d = +$('#f-days').value; var m = $('#f-dur input[value="' + ([3, 7, 14].indexOf(d) > -1 ? d : 0) + '"]'); m.checked = true; }

  /* the shared brief: both tabs produce this list of chips */
  function ch(g, f, no) { return { g: g, f: f, no: !!no }; }
  function checked(name) { return $$('input[name=' + name + ']:checked').map(function (i) { return i; }); }
  function briefFromForm() {
    var b = [], c = $('#f-country').value, ad = +$('#f-adults').value, kids = $$('#f-ages select').map(function (s) { return s.value; });
    route.forEach(function (r) { b.push(ch('gDest', function () { return city(r.c, r.id) + (r.n ? ' · ' + t('nLeft', { n: r.n }) : ''); })); });
    if (!route.length && c) b.push(ch('gDest', function () { return nm(c); }));
    var days = $('#f-days').value, st = $('#f-start').value;
    b.push(ch('gWhen', function () { return t('nDays', { n: days }); }));
    if (st) b.push(ch('gWhen', function () { return new Date(st).toLocaleDateString(L === 'he' ? 'he-IL' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }));
    b.push(ch('gWho', function () { return ad === 1 ? t('nAdults1') : t('nAdults', { n: ad }); }));
    if (kids.length) b.push(ch('gWho', function () { return (kids.length === 1 ? t('nKids1') : t('nKids', { n: kids.length })) + ' (' + t('ages', { a: kids.join(', ') }) + ')'; }));
    [['likes', 'i', 'gLike'], ['avoid', 'a', 'gAvoid'], ['diet', 'd', 'gFood'], ['move', 'm', 'gMove'], ['langs', 'l', 'gLang']].forEach(function (x) {
      checked(x[0]).forEach(function (i) { b.push(ch(x[2], function () { var s = t(x[1] + '.' + i.value); return x[1] === 'a' ? t('no', { x: s.toLowerCase() }) : s; }, x[1] === 'a')); });
    });
    var al = $('#f-allergy').value.trim(); if (al) b.push(ch('gFood', function () { return al; }));
    b.push(ch('gPace', function () { return t('pc') + ': ' + t('p.' + $('#f-pace').value); }));
    b.push(ch('gPace', function () { return t('budget') + ': ' + t('bb.' + (checked('budget')[0] || { value: 2 }).value); }));
    return b;
  }
  function briefFromText() {
    return [ch('gDest', function () { return L === 'he' ? 'איטליה' : 'Italy'; }), ch('gWhen', function () { return t('nDays', { n: 6 }); }), ch('gWho', function () { return t('nAdults', { n: 2 }); }), ch('gWho', function () { return t('nKids', { n: 2 }); }),
      ch('gAvoid', function () { return t('no', { x: t('a.museums').toLowerCase() }); }, true), ch('gFood', function () { return t('d.vegetarian'); }), ch('gMove', function () { return t('m.stroller'); })];
  }
  function drawBrief() {
    $('#brief').innerHTML = GROUPS.map(function (g) {
      var items = B.map(function (c, i) { return c.g === g ? '<span class="bchip' + (c.no ? ' no' : '') + '">' + c.f() + '<button type="button" data-bx="' + i + '" aria-label="' + t('remove') + ': ' + c.f() + '">&times;</button></span>' : ''; }).join('');
      return items ? '<div class="brow"><span class="g">' + t(g) + '</span><div class="cs">' + items + '</div></div>' : '';
    }).join('');
  }

  /* screen state */
  function show() {
    var ed = S.phase === 'edit';
    $('#editor').hidden = !ed; $('#working').hidden = S.phase !== 'working'; $('#result').hidden = S.phase !== 'result'; $('#created').hidden = S.phase !== 'created';
    $('#c-empty').hidden = !S.empty;
    setTab(S.tab, false);
    $$('.mailto').forEach(function (e) { e.textContent = (S.src === 'd' ? $('#d-mail') : $('#f-mail')).value || MAIL; });
  }
  function setTab(k, focus) {
    S.tab = k;
    $('#tab-d').setAttribute('aria-selected', k === 'd'); $('#tab-f').setAttribute('aria-selected', k === 'f');
    $('#tab-d').tabIndex = k === 'd' ? 0 : -1; $('#tab-f').tabIndex = k === 'f' ? 0 : -1;
    $('#pan-d').hidden = k !== 'd'; $('#pan-f').hidden = k !== 'f';
    if (focus) $('#tab-' + k).focus();
  }
  function setField(id, v) { $(id).value = v; }
  function resetD() { setField('#d-text', ''); setField('#d-mail', ''); $$('#pan-d [aria-invalid]').forEach(function (e) { e.removeAttribute('aria-invalid'); }); $$('#pan-d .err').forEach(function (e) { e.hidden = true; }); }
  function resetF() {
    route = []; setField('#f-country', ''); setField('#f-days', 6); setField('#f-adults', 2); setField('#f-kids', 0); setField('#f-allergy', ''); setField('#f-mail', ''); setField('#f-pace', 2);
    $$('#pan-f input[type=checkbox]').forEach(function (i) { i.checked = i.value === 'en'; }); $('#f-budget input[value="2"]').checked = true; $('#f-mail-e').hidden = true; $('#f-mail').removeAttribute('aria-invalid');
    drawAges(); syncDur(); paceText(); drawPicks(); drawRoute();
  }
  function fillF() {
    resetF(); setField('#f-country', 'it'); route = [{ c: 'it', id: 'rome', n: 2 }, { c: 'it', id: 'florence', n: 2 }, { c: 'it', id: 'venice', n: 2 }];
    setField('#f-kids', 2); drawAges(); $$('#f-ages select').forEach(function (s, i) { s.value = [3, 6][i]; });
    ['food', 'nature', 'museums', 'vegetarian', 'stroller'].forEach(function (v) { var i = $$('#pan-f input[type=checkbox][value=' + v + ']'); if (v === 'museums') i[1].checked = true; else i[0].checked = true; });
    setField('#f-pace', 1); setField('#f-mail', MAIL); paceText(); drawPicks(); drawRoute();
  }
  function setState(n) {
    $$('[data-state]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.state == n); });
    S.phase = 'edit'; S.empty = false;
    if (n <= 4 || n === 8) { S.src = 'd'; S.tab = 'd'; resetD(); }
    if (n >= 5 && n !== 8) { S.src = 'f'; S.tab = 'f'; }
    if (n === 2 || n >= 3 && n <= 4 || n === 8) { setField('#d-text', t('ex')); setField('#d-mail', MAIL); }
    if (n === 3) S.phase = 'working';
    if (n === 4) { S.phase = 'result'; B = briefFromText(); }
    if (n === 5) resetF();
    if (n >= 6 && n !== 8) fillF();
    if (n === 7) { S.phase = 'result'; B = briefFromForm(); }
    if (n === 8) S.phase = 'created';
    if (n === 9) { S.phase = 'created'; S.empty = true; }
    drawBrief(); show();
  }

  /* validation and actions */
  function need(inp, err) { var bad = !inp.value.trim(); inp.toggleAttribute('aria-invalid', bad); if (bad) inp.setAttribute('aria-invalid', 'true'); $(err).hidden = !bad; return !bad; }
  function submit(src, empty) {
    var mail = src === 'd' ? $('#d-mail') : $('#f-mail');
    if (src === 'd' && !need($('#d-text'), '#d-err')) { $('#d-text').focus(); return; }
    if (!need(mail, src === 'd' ? '#d-mail-e' : '#f-mail-e')) { mail.focus(); return; }
    S.src = src; S.empty = empty; S.phase = empty ? 'created' : 'working'; show(); $$('[data-state]').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
  }
  function bind() {
    $('#form-d').addEventListener('submit', function (e) { e.preventDefault(); submit('d', false); });
    $('#form-f').addEventListener('submit', function (e) { e.preventDefault(); submit('f', false); });
    $('#f-empty').addEventListener('click', function () { submit('f', true); });
    $('#d-ex').addEventListener('click', function () { setField('#d-text', t('ex')); $('#d-err').hidden = true; $('#d-text').focus(); });
    $('#w-mock').addEventListener('click', function () { B = S.src === 'd' ? briefFromText() : briefFromForm(); S.phase = 'result'; drawBrief(); show(); });
    $('#w-close').addEventListener('click', function () { $('#w-close').textContent = '✓ ' + t('wClose'); });
    $('#r-fix').addEventListener('click', function () { S.phase = 'edit'; S.tab = S.src; show(); });
    $('#r-ok').addEventListener('click', function () { S.phase = 'created'; show(); });
    $('#c-again').addEventListener('click', function () { resetD(); resetF(); S.phase = 'edit'; S.tab = 'd'; show(); });
    $('#add-form').addEventListener('submit', function (e) { e.preventDefault(); var v = $('#add-in').value.trim(); if (v) { B.push(ch('gLike', function () { return v; })); $('#add-in').value = ''; drawBrief(); } });
    $('#brief').addEventListener('click', function (e) { var b = e.target.closest('[data-bx]'); if (b) { B.splice(+b.dataset.bx, 1); drawBrief(); } });
    /* tabs: click and arrow keys (arrow direction follows the page direction) */
    $$('[role=tab]').forEach(function (b) {
      b.addEventListener('click', function () { setTab(b.id.slice(4), true); });
      b.addEventListener('keydown', function (e) {
        var rtl = document.documentElement.dir === 'rtl', next = e.key === (rtl ? 'ArrowLeft' : 'ArrowRight'), prev = e.key === (rtl ? 'ArrowRight' : 'ArrowLeft');
        if (next || prev || e.key === 'Home' || e.key === 'End') { e.preventDefault(); setTab(e.key === 'Home' || prev ? 'd' : 'f', true); }
      });
    });
    /* steppers, picks, route */
    document.addEventListener('click', function (e) {
      var s = e.target.closest('[data-step]'), p = e.target.closest('.pick'), rn = e.target.closest('[data-rn]'), mv = e.target.closest('[data-mv]'), rm = e.target.closest('[data-rm]');
      if (s) { var i = $('#f-' + s.dataset.step); i.value = Math.max(+i.min, Math.min(+i.max, +i.value + +s.dataset.d)); i.dispatchEvent(new Event('input', { bubbles: true })); }
      if (p) { route.push({ c: p.dataset.c, id: p.dataset.id, n: 2 }); drawPicks(); drawRoute(); }
      if (rn) { var r = route[+rn.dataset.rn]; r.n = Math.max(0, Math.min(14, r.n + +rn.dataset.d)); drawRoute(); }
      if (mv) { var a = +mv.dataset.mv, b = a + +mv.dataset.d, x = route[a]; route[a] = route[b]; route[b] = x; drawRoute(); }
      if (rm) { route.splice(+rm.dataset.rm, 1); drawPicks(); drawRoute(); }
    });
    $('#f-route').addEventListener('change', function (e) { var i = e.target.dataset.ri; if (i != null) { route[+i].n = Math.max(0, +e.target.value || 0); drawRoute(); } });
    $('#f-country').addEventListener('change', drawPicks);
    $('#f-days').addEventListener('input', function () { syncDur(); drawRoute(); });
    $('#f-kids').addEventListener('input', function () { drawAges(); });
    $('#f-pace').addEventListener('input', paceText);
    $('#f-dur').addEventListener('change', function (e) { if (+e.target.value) { setField('#f-days', e.target.value); drawRoute(); } });
    /* mockup controls */
    $('#states').addEventListener('click', function (e) { var b = e.target.closest('[data-state]'); if (b) setState(+b.dataset.state); });
    $$('[data-lang]').forEach(function (b) { b.addEventListener('click', function () { L = b.dataset.lang; applyLang(); show(); }); });
    $$('[data-theme-set]').forEach(function (b) {
      b.addEventListener('click', function () { var v = b.dataset.themeSet; if (v === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = v; $$('[data-theme-set]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); });
    });
  }

  build(); bind();
  var q = new URLSearchParams(location.search);
  if (q.get('lang') === 'he') L = 'he';
  if (q.get('theme')) { document.documentElement.dataset.theme = q.get('theme'); }
  applyLang(); setState(+q.get('state') || 1); applyLang();
  window.__setState = setState; window.__setLang = function (l) { L = l; applyLang(); show(); };
})();
