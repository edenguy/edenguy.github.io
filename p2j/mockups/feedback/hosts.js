/* Host screens as small stand-ins (scenery, not real pages). Only the top bar and the pill are the product element. */
window.HOSTS = (function () {
  var D = {
    en: { homeH: 'Plan the trip.', homeA: 'Keep the diary.', homeL: 'A planner that turns each passing day into a keepsake journal.', homeC: 'Start a new trip', homeP: 'No trips on this device yet',
      lanH: 'From plan', lanA: 'to journal', lanL: 'Before the trip it is a planner. As each day passes it becomes a diary.', c1: 'Plan', c1t: 'Every option, in one place.', c2: 'Journal', c2t: 'Photos and the day’s story.', c3: 'What changed', c3t: 'Planned versus what happened.',
      ntH: 'Plan', ntA: 'a new trip', ntL: 'Tell us about it in your own words.', ntF: 'Your trip', ntP: 'Where, when, and with whom?',
      jD: '13 Nov', jH: 'Eger,', jA: 'then the hills', jL: 'Cellar tour, a long lunch and the road to Lillafüred.', jC: 'Photo caption', t: ['Day', 'Map', 'Food', 'To do', 'More'],
      cpH: 'Captions', cpL: 'One caption per theme for the photo album.', cpC: 'Copy' },
    he: { homeH: 'מתכננים את הטיול.', homeA: 'כותבים את היומן.', homeL: 'מתכנן שהופך כל יום שעובר ליומן מזכרת.', homeC: 'מתחילים טיול חדש', homeP: 'אין עדיין טיולים במכשיר הזה',
      lanH: 'מתכנון', lanA: 'ליומן', lanL: 'לפני הטיול זה מתכנן. כל יום שעובר הופך ליומן.', c1: 'תכנון', c1t: 'כל האפשרויות במקום אחד.', c2: 'יומן', c2t: 'תמונות וסיפור היום.', c3: 'מה השתנה', c3t: 'מה תוכנן מול מה שקרה.',
      ntH: 'מתכננים', ntA: 'טיול חדש', ntL: 'ספרו לנו עליו במילים שלכם.', ntF: 'הטיול שלכם', ntP: 'לאן, מתי ועם מי?',
      jD: '13 בנוב׳', jH: 'אגר,', jA: 'ואז הגבעות', jL: 'סיור במרתפים, ארוחה ארוכה והדרך ללילפורד.', jC: 'כיתוב לתמונה', t: ['יום', 'מפה', 'אוכל', 'משימות', 'עוד'],
      cpH: 'כיתובים', cpL: 'כיתוב אחד לכל נושא עבור אלבום התמונות.', cpC: 'העתקה' }
  };
  var ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';
  function pill(t, fixed) { return '<button type="button" class="fb-pill' + (fixed ? ' fb-fixed' : '') + '" aria-haspopup="dialog" aria-expanded="false" aria-label="' + t('pillLabel') + '"><span class="in">' + ICON + t('pill') + '</span></button>'; }
  function bar(t, env, withPill, extra) {
    var e = env === 'none' ? '' : '<span class="bp ' + env + '">' + env + '</span>';
    return '<div class="top"><span class="brand"><i aria-hidden="true"></i><span class="bt">' + t('brand') + '</span></span><span class="badges" id="p2j-badge-slot"><span class="bp">' + t('beta') + '</span>' + e + (withPill ? pill(t) : '') + '</span>' + (extra || '') + '</div>';
  }
  function h1(a, b) { return '<h1>' + a + ' <span class="acc">' + b + '</span></h1>'; }
  var chips = function (t) { return '<button type="button" class="chip" tabindex="-1" aria-hidden="true">' + '◐' + '</button><button type="button" class="chip" tabindex="-1" aria-hidden="true">' + t('langChip') + '</button>'; };
  var R = {
    home: function (t, d, env, fl) { return bar(t, env, !fl) + '<div class="sc">' + h1(d.homeH, d.homeA) + '<p class="lead">' + d.homeL + '</p><div class="card"><p>' + d.homeP + '</p></div><p style="margin-top:18px"><span class="btn primary" aria-hidden="true">' + d.homeC + '</span></p></div>'; },
    landing: function (t, d, env, fl) { return bar(t, env, !fl) + '<div class="sc">' + h1(d.lanH, d.lanA) + '<p class="lead">' + d.lanL + '</p><div class="row3">' + [1, 2, 3].map(function (n) { return '<div class="card"><h3>' + d['c' + n] + '</h3><p>' + d['c' + n + 't'] + '</p></div>'; }).join('') + '</div></div>'; },
    newtrip: function (t, d, env, fl) { return bar(t, env, !fl, '') .replace('</div>', chips(t) + '</div>') + '<div class="sc">' + h1(d.ntH, d.ntA) + '<p class="lead">' + d.ntL + '</p><div class="card"><label class="lbl">' + d.ntF + '</label><textarea placeholder="' + d.ntP + '" tabindex="-1" aria-hidden="true"></textarea></div></div>'; },
    journal: function (t, d, env, fl) { return bar(t, env, !fl) + '<div class="sc"><div class="cover" aria-hidden="true">13</div><p class="cap">' + d.jD + '</p>' + h1(d.jH, d.jA) + '<p class="lead">' + d.jL + '</p><div class="row3"><div class="ph" role="img" aria-label="' + d.jC + '"></div><div class="ph"></div><div class="ph"></div></div><div class="tabs" aria-hidden="true">' + d.t.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div></div>'; },
    captions: function (t, d, env, fl) { return '<div class="sc"><div style="height:18px"></div>' + h1(d.cpH, '') + '<p class="lead">' + d.cpL + '</p>' + [1, 2, 3].map(function () { return '<div class="card"><div class="ph" style="height:60px"></div><p class="cap">' + d.cpL + '</p></div>'; }).join('') + '</div>'; }
  };
  return {
    list: ['home', 'landing', 'newtrip', 'journal', 'captions'],
    draw: function (host, L, t, env, fixed) {
      var fl = host === 'captions' || fixed;
      return '<div class="host' + (host === 'journal' ? ' has-nav' : '') + (host === 'newtrip' ? ' nt' : '') + '">' + R[host](t, D[L], env, fl) + (fl ? pill(t, true) : '') + '</div>';
    }
  };
})();
