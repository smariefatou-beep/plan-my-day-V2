// Révisions à deux — interface (même univers qu'École OS : carte pastel, chemin, tirelire).
// Lit et écrit via RevApi ; toute la logique de planning est dans RevPlan.
(function () {
  'use strict';
  var P = window.RevPlan, API = window.RevApi, ART = window.SchoolArt;
  var ui = { view: 'today' };
  var me = null, planId = null, row = null, data = null, members = [], progress = {}, today = P.dayStr(new Date());
  var m = /[?&]today=(\d{4}-\d{2}-\d{2})/.exec(location.search); if (m) today = m[1];

  var DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  var MONTHS_L = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var ICON_OF = { fiche: 'fiches', exos: 'practice', flash: 'revision', session: 'understand', maths: 'practice', other: 'mine' };
  var CHECK = '<svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#6D4D57" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var XMARK = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  var NUDGES = ['Maths faites pour moi !', 'On s’y met ?', 'Courage, on y est presque', 'Je commence un peu plus tard ce soir'];

  // ---------------------------------------------------------------- utilitaires
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ') + ' $'; }
  function longDate(s) { var d = P.parseDay(s); return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS_L[d.getMonth()]; }
  function shortDay(s) { var d = P.parseDay(s); return DAYS[d.getDay()].toLowerCase() + ' ' + d.getDate(); }
  function niceDay(s) { if (s === today) return 'aujourd’hui'; if (s === P.addDays(today, 1)) return 'demain'; if (s === P.addDays(today, -1)) return 'hier'; return shortDay(s); }
  function hour(t) { var p = String(t || '20:00').split(':'); return +p[0] + ' h' + (p[1] && p[1] !== '00' ? ' ' + p[1] : ''); }
  function subj(id) { return P.subjectById(data, id); }
  function vars(s) { return '--c:' + s.color + ';--cs:' + s.soft + ';--ci:' + s.ink + ';'; }
  function myProg() { return P.norm(progress[me.id]); }
  function isOwner() { return !!(row && me && row.owner === me.id); }
  function friend() { return members.filter(function (x) { return x.user_id !== me.id; })[0] || null; }
  function friendProg() { var f = friend(); return f ? P.norm(progress[f.user_id]) : null; }
  function myName() { var x = members.filter(function (y) { return y.user_id === me.id; })[0]; return (x && x.name) || 'Moi'; }
  function fname() { var f = friend(); return f ? (f.name || 'Ta copine') : 'Ta copine'; }
  function inviteLink() { return location.origin + location.pathname + '?code=' + (row ? row.invite_code : ''); }

  function toast(msg, undo) {
    var old = document.querySelector('.toast'); if (old) old.remove();
    var t = document.createElement('div'); t.className = 'toast';
    t.innerHTML = esc(msg) + (undo ? ' &nbsp;<button style="color:#F6C3D2;font-weight:700;">Annuler</button>' : '');
    document.body.appendChild(t);
    if (undo) t.querySelector('button').onclick = function () { undo(); t.remove(); };
    setTimeout(function () { t.remove(); }, undo ? 6000 : 2600);
  }
  function petals(el) {
    var r = el.getBoundingClientRect(), cols = ['#F2B6C8', '#C4ADE0', '#F5D27E', '#9CC896', '#A9D2EA'];
    for (var i = 0; i < 8; i++) {
      var b = document.createElement('span'); b.className = 'petal';
      b.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M6 1c3 2 3 7 0 10-3-3-3-8 0-10z" fill="' + cols[i % 5] + '" stroke="#8A6A5C" stroke-width=".8"/></svg>';
      b.style.left = (r.left + r.width / 2 - 6) + 'px'; b.style.top = (r.top + r.height / 2 - 6) + 'px';
      var ang = (Math.PI * 2 * i) / 8;
      b.style.setProperty('--dx', Math.round(Math.cos(ang) * 44) + 'px'); b.style.setProperty('--dy', Math.round(Math.sin(ang) * 44) + 'px');
      document.body.appendChild(b);
      setTimeout(function (x) { return function () { x.remove(); }; }(b), 1000);
    }
  }

  // Petit résumé gardé sur l'appareil : École OS l'affiche sous ta carte sans requête réseau.
  function cache() {
    try { localStorage.setItem('rev_cache', JSON.stringify({ planId: planId, me: me.id, data: data, members: members, progress: progress, at: new Date().toISOString() })); } catch (e) {}
  }

  // ---------------------------------------------------------------- chargement
  function load() {
    return API.load(planId).then(function (r) {
      row = r.plan; data = r.plan.data; members = r.members; progress = r.progress || {};
      cache();
      if (P.needsMigration(data)) { data = P.apply(data, { type: 'migrate' }); API.applyOp(planId, { type: 'migrate' }, me.id).then(function (next) { data = next; cache(); render(); }).catch(function () {}); }
    });
  }
  function refresh() { if (!planId) return; load().then(render).catch(function () {}); }

  function saveMine(mutator, okMsg) {
    var p = myProg(); mutator(p); progress[me.id] = p; cache(); render();
    API.saveProgress(planId, me.id, p).then(function () { if (okMsg) toast(okMsg); })
      .catch(function (e) { toast('Pas enregistré (connexion ?) : ' + (e.message || e)); });
  }
  function change(op, msg, undoOp) {
    data = P.apply(data, op); cache(); render();
    API.applyOp(planId, op, me.id).then(function (next) { data = next; cache(); render(); toast(msg || 'Planning mis à jour', undoOp ? function () { change(undoOp, 'Annulé'); } : null); })
      .catch(function (e) { toast('Pas enregistré : ' + (e.message || e)); refresh(); });
  }

  // ---------------------------------------------------------------- briques
  function stone(on, action, id, label, extra) {
    return '<button class="stone' + (on ? ' on' : '') + '" data-a="' + action + '" data-id="' + esc(id) + '"' + (extra || '') + ' aria-pressed="' + on + '" aria-label="Cocher « ' + esc(label) + ' »">' + CHECK + '</button>';
  }
  function taskRow(t, opts) {
    opts = opts || {};
    var s = subj(t.subject), done = !!myProg().done[t.id], fp = friendProg();
    var fdone = fp && fp.done[t.id];
    return '<div class="task' + (done ? ' done' : '') + '" style="' + vars(s) + '">' +
      stone(done, 'toggle', t.id, t.title) +
      '<div class="t-ico">' + ART.icon(ICON_OF[t.type] || 'mine', s.color, 22) + '</div>' +
      '<div class="t-main"><span class="t-subj">' + esc(s.name) + '</span><div class="t-title">' + esc(t.title) + '</div>' +
      '<div class="t-meta"><span class="pill">' + esc(P.typeOf(t).label) + '</span>' + (opts.late ? '<span class="pill k-catchup">prévu ' + niceDay(t.date) + '</span>' : '') +
      (friend() ? '<span class="pill duo' + (fdone ? ' ok' : '') + '">' + esc(fname()) + (fdone ? ' : fait' : ' : pas encore') + '</span>' : '') +
      '<span class="pill money mob">+' + money(P.payOf(t)) + '</span></div></div>' +
      '<span class="reward">+' + money(P.payOf(t)) + '</span><button class="more" data-a="edit" data-id="' + esc(t.id) + '" aria-label="Modifier">⋯</button></div>';
  }
  function walletChip() {
    var w = P.wallet(data, myProg());
    return '<button class="wallet-chip" data-a="go" data-view="duo">' + ART.icon('coin', null, 34) + '<span><b>' + money(w.total) + '</b><small>ta tirelire de révisions</small></span></button>';
  }
  function currentPhase() {
    var ws = P.windows(data).filter(function (w) { return w.from <= today && today <= w.to; });
    var next = P.windows(data).filter(function (w) { return w.from > today; }).sort(function (a, b) { return a.from < b.from ? -1 : 1; })[0];
    return { now: ws, next: next };
  }

  // ---------------------------------------------------------------- Aujourd'hui
  function mathsCard() {
    var d = P.day(data, today), r = d.routines[0];
    if (!r) return '';
    var s = subj(r.subject), mine = P.routineDone(myProg(), today, r.id), fp = friendProg(), f = friend();
    var fdone = fp && P.routineDone(fp, today, r.id);
    var myNote = (myProg().notes[today] || {}).text, fNote = fp && (fp.notes[today] || {}).text;
    var h = '<div class="card maths-card" style="' + vars(s) + '"><div class="mc-top"><div class="mc-time">' + hour(r.time) + '</div>' +
      '<div class="mc-txt"><span class="t-subj">' + esc(s.name) + '</span><div class="t-title">' + esc(r.title) + ', du lundi au vendredi</div><div class="mc-sub">+' + money(r.pay != null ? r.pay : P.ROUTINE_PAY) + ' à chaque fois</div></div>' +
      '<div class="mc-check">' + stone(mine, 'routine', r.id, r.title) + '</div></div>';
    h += '<div class="mc-duo"><div class="mc-who' + (mine ? ' ok' : '') + '"><b>' + esc(myName()) + '</b><span>' + (mine ? 'fait' : 'pas encore') + '</span></div>';
    if (f) h += '<div class="mc-who' + (fdone ? ' ok' : '') + '"><b>' + esc(fname()) + '</b><span>' + (fdone ? 'fait' : 'pas encore') + '</span></div>';
    else h += '<div class="mc-who"><b>Ta copine</b><span>pas encore invitée</span></div>';
    h += '</div>';
    if (f) {
      h += '<div class="notes">' + (fNote ? '<div class="note them"><b>' + esc(fname()) + '</b> ' + esc(fNote) + '</div>' : '') +
        (myNote ? '<div class="note mine"><b>Toi</b> ' + esc(myNote) + '</div>' : '') + '</div>' +
        '<div class="nudges">' + NUDGES.map(function (n) { return '<button class="pill" data-a="nudge" data-t="' + esc(n) + '">' + esc(n) + '</button>'; }).join('') +
        '<button class="pill" data-a="nudge-free">Écrire…</button></div>';
    }
    return h + '</div>';
  }

  function friendToday() {
    var f = friend();
    if (!f) return '<div class="card invite-card">' + ART.icon('pin', null, 30) + '<div><b>Invite ta copine</b><p>Envoie-lui ce lien. Elle crée son compte et voit seulement ce planning, jamais le reste de ton École OS.</p>' +
      '<div class="code-row"><span class="code">' + esc(row.invite_code) + '</span><button class="btn small" data-a="copy">Copier le lien</button></div></div></div>';
    var fp = friendProg(), d = P.day(data, today);
    var done = d.tasks.filter(function (t) { return fp.done[t.id]; }).length;
    var h = '<div class="section-h"><h3>' + esc(fname()) + ' aujourd’hui</h3><span class="aside">' + done + '/' + d.tasks.length + '</span></div><div class="card">';
    if (!d.tasks.length) h += '<p class="soft-note">Pas de fiche prévue aujourd’hui.</p>';
    d.tasks.forEach(function (t) {
      var s = subj(t.subject), ok = !!fp.done[t.id];
      h += '<div class="wtask' + (ok ? ' done' : '') + '" style="' + vars(s) + '"><i></i><span class="w-body"><span class="w-title">' + esc(s.name) + ' · ' + esc(t.title) + '</span></span><span class="wk ' + (ok ? 'mine' : '') + '">' + (ok ? 'fait' : '…') + '</span></div>';
    });
    return h + '</div>';
  }

  function viewToday() {
    var d = P.day(data, today), ph = currentPhase(), mp = myProg();
    var left = d.tasks.filter(function (t) { return !mp.done[t.id]; }).length;
    var todaySubs = ph.now.map(function (w) { return w.subject; });
    d.tasks.concat(d.routines).forEach(function (x) { if (todaySubs.indexOf(x.subject) === -1) todaySubs.push(x.subject); });
    var phaseTxt = ph.now.length ? todaySubs.map(function (id) { return subj(id).name; }).join(' + ') +
      ' · jusqu’à ' + niceDay(ph.now[0].to) : (ph.next ? 'Prochaine étape : ' + subj(ph.next.subject).name + ' à partir de ' + niceDay(ph.next.from) : 'Maths du lundi au vendredi à 20 h');
    var h = '<section class="hello"><div><div class="date">' + longDate(today) + '</div><div class="sub">' + esc(phaseTxt) + '</div>' +
      '<div class="today-actions"><button class="btn soft" data-a="add" data-date="' + today + '">' + ART.icon('plus', null, 16) + ' Ajouter une tâche</button></div></div>' + walletChip() + '</section>';
    ph.now.forEach(function (w) { var fl = (data.flags || {})[w.subject]; if (fl) h += '<div class="flag">' + esc(subj(w.subject).name) + ' : ' + esc(fl) + ' <a href="#" class="btn-link" data-a="go" data-view="plan">Ajuster</a></div>'; });

    h += '<div class="grid-2"><div>';
    h += '<div class="section-h"><h3>Le chemin du jour</h3><span class="aside">' + (d.tasks.length ? (left ? left + ' à faire' : 'tout est fait') : '') + '</span></div>';
    if (d.tasks.length) h += '<div class="trail snake">' + d.tasks.map(function (t) { return taskRow(t); }).join('') + '</div>';
    else {
      var nx = data.tasks.filter(function (t) { return t.date > today; }).map(function (t) { return t.date; }).sort()[0];
      h += '<div class="card empty">' + ART.plant(3, '#F2B6C8') + '<br>Pas de fiche aujourd’hui' + (d.routines.length ? ', juste les maths de 20 h.' : '.') + (nx ? '<br>On commence ' + niceDay(nx) + ' : <a href="#" class="btn-link" data-a="go" data-view="plan">voir le planning</a>' : '') + '</div>';
    }
    var lo = P.leftovers(data, mp, today);
    if (lo.length) {
      h += '<div class="gentle" style="margin-top:16px;"><h4>Des jours d’avant</h4><p>Pas encore cochées. Si c’est fait, coche-les ; sinon, glisse-les sur un autre jour, tranquillement.</p></div>';
      h += lo.slice(0, 8).map(function (t) { return taskRow(t, { late: true }); }).join('');
      if (lo.length > 8) h += '<p class="garden-note">… et ' + (lo.length - 8) + ' autres dans Planning.</p>';
    }
    h += '</div><div>';
    var mc = mathsCard();
    h += (mc ? '<div class="section-h"><h3>Le rendez-vous de ' + hour(d.routines[0].time) + '</h3></div>' + mc : '') + friendToday();
    return h + '</div></div>';
  }

  // ---------------------------------------------------------------- Planning
  function frise() {
    var ws = P.windows(data); if (!ws.length) return '';
    var from = ws.reduce(function (a, w) { return w.from < a ? w.from : a; }, ws[0].from), to = ws.reduce(function (a, w) { return w.to > a ? w.to : a; }, ws[0].to);
    if (today < from) from = today;
    var span = Math.round((P.parseDay(to) - P.parseDay(from)) / 864e5) + 1;
    function x(d) { return Math.round((P.parseDay(d) - P.parseDay(from)) / 864e5); }
    var h = '<div class="frise card">';
    ws.forEach(function (w) {
      var s = subj(w.subject), l = x(w.from) / span * 100, wd = (x(w.to) - x(w.from) + 1) / span * 100;
      h += '<div class="fr-row"><span class="fr-name">' + esc(s.name) + '</span><div class="fr-track"><i style="left:' + l + '%;width:' + wd + '%;' + vars(s) + '"><span>' + shortDay(w.from) + ' → ' + shortDay(w.to) + '</span></i>' +
        (today >= from && today <= to ? '<b class="fr-today" style="left:' + ((x(today) + .5) / span * 100) + '%"></b>' : '') + '</div></div>';
    });
    var r = (data.routines || [])[0];
    if (r) h += '<div class="fr-row"><span class="fr-name">' + esc(subj(r.subject).name) + '</span><div class="fr-track"><i style="left:' + (Math.max(0, x(r.from)) / span * 100) + '%;width:' + (100 - Math.max(0, x(r.from)) / span * 100) + '%;' + vars(subj(r.subject)) + '"><span>' + hour(r.time) + ' en semaine · le week-end en tâche</span></i></div></div>';
    return h + '</div>';
  }

  function viewPlan() {
    var rg = P.dateRange(data) || { from: today, to: today };
    var start = rg.from < today ? rg.from : today, end = rg.to > today ? rg.to : today, mp = myProg();
    var h = '<h2 class="title">Notre planning</h2><div class="subtitle">Commun à vous deux : ce que l’une ajoute, déplace ou supprime, l’autre le voit aussi. Ce que chacune coche reste à elle.</div>';
    h += frise();
    Object.keys(data.flags || {}).forEach(function (sid) { h += '<div class="flag">' + esc(subj(sid).name) + ' : ' + esc(data.flags[sid]) + ' <a href="#" class="btn-link" data-a="clear-flag" data-id="' + esc(sid) + '">C’est bon</a></div>'; });
    h += '<div class="week-days" style="margin-top:16px;">';
    for (var d = start; d <= end; d = P.addDays(d, 1)) {
      var day = P.day(data, d);
      h += '<div class="wday' + (d === today ? ' today' : '') + (d < today ? ' past' : '') + '" id="d-' + d + '"><div class="wday-h"><b>' + DAYS[P.parseDay(d).getDay()] + '</b><span>' + P.parseDay(d).getDate() + ' ' + MONTHS_L[P.parseDay(d).getMonth()] + '</span></div>';
      var subs = []; day.tasks.forEach(function (t) { if (subs.indexOf(t.subject) === -1) subs.push(t.subject); });
      day.routines.forEach(function (r) { if (subs.indexOf(r.subject) === -1) subs.push(r.subject); });
      h += '<div class="day-subs">' + subs.map(function (sid) { var s = subj(sid); return '<span class="t-subj" style="' + vars(s) + '">' + esc(s.name) + '</span>'; }).join('') + '</div>';
      day.tasks.forEach(function (t) {
        var s = subj(t.subject), done = !!mp.done[t.id];
        h += '<div class="wtask' + (done ? ' done' : '') + '" style="' + vars(s) + '">' + stone(done, 'toggle', t.id, t.title, ' data-small="1"').replace('class="stone', 'class="stone mini') +
          '<span class="w-body" data-a="edit" data-id="' + esc(t.id) + '" role="button"><span class="w-title">' + esc(t.title) + '</span><span class="w-meta">' + esc(s.name) + ' · +' + money(P.payOf(t)) + '</span></span>' +
          '<button class="w-del" data-a="del" data-id="' + esc(t.id) + '" aria-label="Supprimer" title="Supprimer">' + XMARK + '</button></div>';
      });
      day.routines.forEach(function (r) {
        var s = subj(r.subject), done = P.routineDone(mp, d, r.id);
        h += '<div class="wtask routine' + (done ? ' done' : '') + '" style="' + vars(s) + '">' + stone(done, 'routine', r.id, r.title, ' data-date="' + d + '"').replace('class="stone', 'class="stone mini') +
          '<span class="w-body"><span class="w-title">' + esc(r.title) + '</span><span class="w-meta">' + hour(r.time) + ' · du lundi au vendredi</span></span></div>';
      });
      h += '<div class="w-foot"><span></span><button class="add-day" data-a="add" data-date="' + d + '">+ Ajouter</button></div></div>';
    }
    h += '</div>';
    return h;
  }

  // ---------------------------------------------------------------- Nous deux
  function viewDuo() {
    var f = friend(), fp = friendProg(), mp = myProg();
    var wm = P.wallet(data, mp), wf = fp ? P.wallet(data, fp) : null;
    var h = '<h2 class="title">Nous deux</h2><div class="subtitle">Où tu en es, où ' + (f ? esc(fname()) : 'ta copine') + ' en est. Chacune son rythme, le même chemin.</div>';
    h += '<div class="duo-head">' +
      '<div class="card bank-mini"><div class="bm-name">' + esc(myName()) + '</div><div class="amount">' + money(wm.total) + '</div><small>ta tirelire de révisions</small></div>' +
      (f ? '<div class="card bank-mini"><div class="bm-name">' + esc(fname()) + '</div><div class="amount">' + money(wf.total) + '</div><small>sa tirelire</small></div>' : '<div class="card bank-mini muted"><div class="bm-name">Ta copine</div><p>Pas encore là. Son code : <b>' + esc(row.invite_code) + '</b></p><button class="btn small" data-a="copy">Copier le lien</button></div>') + '</div>';

    h += '<div class="section-h"><h3>Par matière</h3><span class="aside">+' + money(P.SUBJECT_BONUS) + ' quand une matière est finie</span></div><div class="duo-list">';
    data.subjects.forEach(function (s) {
      var a = P.subjectProgress(data, mp, s.id, today), b = fp ? P.subjectProgress(data, fp, s.id, today) : null;
      h += '<div class="card duo-subj" style="' + vars(s) + '"><div class="ds-top"><span class="ring" style="--p:' + a.pct + '"><span>' + ART.symbol(s.id, s.color, 22) + '</span></span><div><div class="sc-name">' + esc(s.name) + '</div><div class="sc-sub">' + a.total + ' étapes' + ((data.windows || {})[s.id] ? ' · ' + shortDay(data.windows[s.id].from) + ' → ' + shortDay(data.windows[s.id].to) : '') + '</div></div></div>' +
        '<div class="ds-bar"><span>' + esc(myName()) + '</span><div class="track"><i style="width:' + a.pct + '%"></i></div><b>' + a.done + '/' + a.total + '</b></div>' +
        (b ? '<div class="ds-bar them"><span>' + esc(fname()) + '</span><div class="track"><i style="width:' + b.pct + '%"></i></div><b>' + b.done + '/' + b.total + '</b></div>' : '') + '</div>';
    });
    h += '</div>';

    var r = (data.routines || [])[0];
    if (r) {
      var days = [], d0 = r.from;
      var endD = today; for (var d = P.addDays(endD, -13) > d0 ? P.addDays(endD, -13) : d0; d <= endD; d = P.addDays(d, 1)) days.push(d);
      h += '<div class="section-h"><h3>Les maths de 20 h</h3><span class="aside">14 derniers jours</span></div><div class="card"><div class="dots-grid" style="grid-template-columns:auto repeat(' + days.length + ',1fr);">' +
        '<span></span>' + days.map(function (x) { return '<span class="dg-d">' + P.parseDay(x).getDate() + '</span>'; }).join('') +
        '<span class="dg-n">' + esc(myName()) + '</span>' + days.map(function (x) { return '<span class="dot' + (P.routineDone(mp, x, r.id) ? ' on' : '') + '"></span>'; }).join('') +
        (fp ? '<span class="dg-n">' + esc(fname()) + '</span>' + days.map(function (x) { return '<span class="dot them' + (P.routineDone(fp, x, r.id) ? ' on' : '') + '"></span>'; }).join('') : '') + '</div></div>';
    }

    var notes = [];
    [[me.id, myName()], f ? [f.user_id, fname()] : null].forEach(function (p) {
      if (!p) return; var n = P.norm(progress[p[0]]).notes;
      Object.keys(n).forEach(function (d) { if (n[d] && n[d].text) notes.push({ d: d, who: p[1], mine: p[0] === me.id, text: n[d].text, at: n[d].at || d }); });
    });
    notes.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    if (notes.length) {
      h += '<div class="section-h"><h3>Nos petits mots</h3></div><div class="card notes">' + notes.slice(0, 12).map(function (n) { return '<div class="note ' + (n.mine ? 'mine' : 'them') + '"><b>' + esc(n.who) + ' · ' + niceDay(n.d) + '</b> ' + esc(n.text) + '</div>'; }).join('') + '</div>';
    }
    if (!isOwner()) {
      h += '<div class="section-h"><h3>Toi</h3></div><div class="card"><div class="form-row"><label><b>Ton prénom</b><small>C’est ce que ' + esc(fname()) + ' voit</small></label><input class="inp" id="myname" value="' + esc(myName()) + '" style="width:160px;"></div>' +
        '<p class="garden-note" style="margin-top:8px;"><a href="#" class="btn-link" data-a="leave">Quitter ce planning</a></p></div>';
    }
    return h;
  }

  // ---------------------------------------------------------------- Réglages
  function viewSettings() {
    var r = (data.routines || [])[0];
    var h = '<h2 class="title">Réglages</h2><div class="subtitle">Ce planning est partagé. Ton École OS, tes notes et ta tirelire principale restent privés.</div><div class="grid-2"><div>';
    h += '<div class="section-h"><h3>Toi</h3></div><div class="card"><div class="form-row"><label><b>Ton prénom</b><small>C’est ce que ' + (friend() ? esc(fname()) : 'ta copine') + ' voit</small></label><input class="inp" id="myname" value="' + esc(myName()) + '" style="width:160px;"></div></div>';
    h += '<div class="section-h"><h3>Inviter</h3></div><div class="card"><p class="soft-note">Envoie ce lien à ta copine. Elle crée son compte (email + mot de passe), puis elle voit uniquement ce planning et sa propre progression.</p>' +
      '<div class="code-row"><span class="code">' + esc(row.invite_code) + '</span><button class="btn small" data-a="copy">Copier le lien</button></div><p class="garden-note" style="word-break:break-all;">' + esc(inviteLink()) + '</p>' +
      '<p class="garden-note">Dans le groupe : ' + members.map(function (x) { return esc(x.name || '…'); }).join(', ') + '</p></div>';
    if (r) h += '<div class="section-h"><h3>Maths du lundi au vendredi</h3></div><div class="card"><div class="form-row"><label><b>Heure</b></label><input class="inp" type="time" id="rtime" value="' + esc(r.time || '20:00') + '"></div>' +
      '<div class="form-row"><label><b>Dernier jour</b><small>Vide = sans fin. Le week-end, les maths sont une tâche du planning.</small></label><input class="inp" type="date" id="rto" value="' + esc(r.to || '') + '"></div></div>';
    h += '</div><div>';
    h += '<div class="section-h"><h3>Ajouter une matière</h3></div><div class="card add-subj">' +
      '<div class="field"><input class="inp" id="ns-name" placeholder="ex. Rhetoric" style="width:100%"></div>' +
      '<div class="form-row"><label><b>Du</b></label><input class="inp" type="date" id="ns-from"></div><div class="form-row"><label><b>Au</b><small>dernier délai</small></label><input class="inp" type="date" id="ns-to"></div>' +
      '<div class="form-row"><label><b>Nombre de fiches</b></label><input class="inp num" type="number" min="0" id="ns-n" value="9"></div>' +
      '<p class="garden-note">Les fiches se répartissent sur les jours, puis la séance d’exercices et les flashcards le dernier jour.</p><button class="btn" data-a="add-subject">Ajouter au planning</button></div>';
    h += '<div class="section-h"><h3>Matières</h3></div><div class="card">' + data.subjects.map(function (s) {
      var w = (data.windows || {})[s.id];
      return '<div class="form-row" style="' + vars(s) + '"><label><span class="t-subj">' + esc(s.name) + '</span><small>' + (w ? shortDay(w.from) + ' → ' + shortDay(w.to) + ' · ' : '') + (s.id === 'MA11' ? '1 h en semaine à ' + hour(((data.routines || [])[0] || {}).time) + ' · ' : '') + data.tasks.filter(function (t) { return t.subject === s.id; }).length + ' tâches' + '</small></label>' +
        (s.id === 'MA11' ? '' : '<button class="btn soft small" data-a="del-subject" data-id="' + esc(s.id) + '">Retirer</button>') + '</div>';
    }).join('') + '</div>';
    h += '<p class="garden-note" style="margin-top:16px;"><a href="#" class="btn-link" data-a="leave">Quitter ce planning</a> (tes coches disparaissent, le planning reste pour l’autre).</p>';
    return h + '</div></div>';
  }

  // ---------------------------------------------------------------- feuilles
  function sheet(html, onMount) {
    closeSheet();
    var bg = document.createElement('div'); bg.className = 'sheet-bg'; bg.id = 'sheet';
    bg.innerHTML = '<div class="sheet grain">' + html + '</div>';
    bg.addEventListener('click', function (e) { if (e.target === bg) closeSheet(); });
    document.body.appendChild(bg);
    if (onMount) onMount(bg);
  }
  function closeSheet() { var s = document.getElementById('sheet'); if (s) s.remove(); }
  function subjOptions(sel) { return data.subjects.map(function (s) { return '<option value="' + s.id + '"' + (s.id === sel ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join(''); }
  function typeOptions(sel) { return Object.keys(P.TYPES).map(function (k) { return '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>' + esc(P.TYPES[k].label) + ' · +' + P.TYPES[k].pay + ' $</option>'; }).join(''); }

  function openTask(id, date) {
    var t = id ? data.tasks.filter(function (x) { return x.id === id; })[0] : null;
    if (id && !t) return;
    var cur = t || { subject: (currentPhase().now[0] || {}).subject || data.subjects[0].id, type: 'fiche', title: '', date: date || today };
    var h = '<div class="s-title">' + (t ? 'Modifier' : 'Ajouter') + '</div><div class="s-sub">' + (t ? 'Change le nom ou le jour : ta copine voit le changement aussi.' : 'Pour vous deux, le ' + esc(longDate(cur.date)) + '.') + '</div>' +
      '<div class="field"><input class="inp" id="tt" style="width:100%" placeholder="ex. Fiche 10 · la stratégie" value="' + esc(cur.title) + '"></div>' +
      '<div class="form-row"><label><b>Matière</b></label><select class="inp" id="ts">' + subjOptions(cur.subject) + '</select></div>' +
      '<div class="form-row"><label><b>Type</b></label><select class="inp" id="ty">' + typeOptions(cur.type) + '</select></div>' +
      '<div class="form-row"><label><b>Jour</b></label><input class="inp" type="date" id="td" value="' + esc(cur.date) + '"></div>' +
      '<div class="sheet-actions">' + (t ? '<button class="btn soft" data-x="del">Supprimer</button>' : '') + '<button class="btn soft" data-x="close">Fermer</button><button class="btn" data-x="save">' + (t ? 'Enregistrer' : 'Ajouter') + '</button></div>';
    sheet(h, function (root) {
      root.querySelector('[data-x="close"]').onclick = closeSheet;
      if (t) root.querySelector('[data-x="del"]').onclick = function () { closeSheet(); del(t.id); };
      root.querySelector('[data-x="save"]').onclick = function () {
        var title = root.querySelector('#tt').value.trim(), d = root.querySelector('#td').value;
        if (!title) { root.querySelector('#tt').focus(); return; }
        if (!d) { root.querySelector('#td').focus(); return; }
        var op = { title: title, subject: root.querySelector('#ts').value, type: root.querySelector('#ty').value, date: d };
        closeSheet();
        if (t) change({ type: 'editTask', id: t.id, title: op.title, subject: op.subject, date: d, kind: op.type }, 'Modifié · ' + niceDay(d));
        else change({ type: 'addTask', id: P.uid('t'), subject: op.subject, title: op.title, date: d, kind: op.type }, 'Ajouté ' + niceDay(d));
      };
    });
  }
  function del(id) {
    var t = data.tasks.filter(function (x) { return x.id === id; })[0]; if (!t) return;
    change({ type: 'removeTask', id: id }, '« ' + t.title + ' » supprimée', { type: 'addTask', id: t.id, subject: t.subject, title: t.title, date: t.date, kind: t.type });
  }
  function freeNote() {
    sheet('<div class="s-title">Un petit mot</div><div class="s-sub">' + esc(fname()) + ' le voit sur sa page aujourd’hui.</div><div class="field"><input class="inp" id="nt" style="width:100%" maxlength="140" value="' + esc((myProg().notes[today] || {}).text || '') + '"></div>' +
      '<div class="sheet-actions"><button class="btn soft" data-x="close">Fermer</button><button class="btn" data-x="send">Envoyer</button></div>', function (root) {
      root.querySelector('[data-x="close"]').onclick = closeSheet;
      root.querySelector('[data-x="send"]').onclick = function () { var v = root.querySelector('#nt').value.trim(); closeSheet(); sendNote(v); };
      root.querySelector('#nt').focus();
    });
  }
  function sendNote(text) { saveMine(function (p) { if (text) p.notes[today] = { text: text, at: new Date().toISOString() }; else delete p.notes[today]; }, text ? 'Envoyé à ' + fname() : 'Mot effacé'); }

  // ---------------------------------------------------------------- accueil (pas encore de planning)
  function viewSetup(code) {
    var h = '<h2 class="title">Réviser à deux</h2><div class="subtitle">Un planning commun, une progression chacune, et un œil sur où en est l’autre.</div><div class="grid-2">';
    h += '<div class="card"><div class="section-h" style="margin-top:0"><h3>J’ai un code</h3></div><p class="soft-note">Ta copine t’a envoyé un lien ou un code de 6 lettres.</p>' +
      '<div class="field"><input class="inp" id="j-code" placeholder="Code" value="' + esc(code || '') + '" style="width:100%;text-transform:uppercase;letter-spacing:.2em"></div>' +
      '<div class="field"><input class="inp" id="j-name" placeholder="Ton prénom" style="width:100%"></div><button class="btn" data-a="join">Rejoindre</button></div>';
    if (!code) h += '<div class="card"><div class="section-h" style="margin-top:0"><h3>Créer notre planning</h3></div><p class="soft-note">Il démarre avec votre programme : vendredi 13 Microeconomics, Business du 14 au 18, Microeconomics du 19 au 22, International Relations du 23 au 26, et 1 h de maths chaque jour à 20 h. Tout se modifie ensuite.</p>' +
      '<div class="field"><input class="inp" id="c-name" placeholder="Ton prénom" style="width:100%"></div><button class="btn" data-a="create">Créer et inviter</button></div>';
    return h + '</div>';
  }

  // ---------------------------------------------------------------- rendu + événements
  function render() {
    var v = document.getElementById('view');
    var tabs = document.getElementById('tabs');
    if (!data) { tabs.style.display = 'none'; v.innerHTML = '<div class="view">' + viewSetup(ui.code) + '</div>'; return; }
    tabs.style.display = '';
    // Les réglages (inviter, matières, heure des maths) sont réservés à celle qui a créé le planning.
    var setTab = tabs.querySelector('[data-view="settings"]'); if (setTab) setTab.style.display = isOwner() ? '' : 'none';
    if (ui.view === 'settings' && !isOwner()) ui.view = 'today';
    var html = ui.view === 'plan' ? viewPlan() : ui.view === 'duo' ? viewDuo() : ui.view === 'settings' ? viewSettings() : viewToday();
    var y = window.scrollY;
    v.innerHTML = '<div class="view">' + html + '</div>';
    window.scrollTo(0, y);
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('on', t.dataset.view === ui.view); });
    drawTrails();
  }
  function go(view) { ui.view = view; render(); window.scrollTo(0, 0); try { localStorage.setItem('rev_ui_view', view); } catch (e) {} if (view === 'plan') { var el = document.getElementById('d-' + today); if (el) el.scrollIntoView({ block: 'center' }); } }

  function copyLink() {
    var link = inviteLink();
    var txt = 'Rejoins notre planning de révisions : ' + link + ' (code ' + row.invite_code + ')';
    if (navigator.share && /Mobi/.test(navigator.userAgent)) { navigator.share({ text: txt }).catch(function () {}); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast('Lien copié, envoie-le-lui'); }, function () { window.prompt('Copie ce lien :', link); });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-a], .tab');
    if (!t) return;
    if (t.classList.contains('tab')) { go(t.dataset.view); return; }
    var a = t.dataset.a, id = t.dataset.id;
    if (t.tagName === 'A') e.preventDefault();
    switch (a) {
      case 'go': go(t.dataset.view); break;
      case 'toggle': {
        var was = !!myProg().done[id], task = data.tasks.filter(function (x) { return x.id === id; })[0];
        if (!was) petals(t);
        setTimeout(function () { saveMine(function (p) { if (was) delete p.done[id]; else p.done[id] = new Date().toISOString(); }, !was && task ? '+' + money(P.payOf(task)) + ' dans ta tirelire' : null); }, was ? 0 : 280);
        break;
      }
      case 'routine': {
        var d = t.dataset.date || today, on = P.routineDone(myProg(), d, id);
        if (!on) petals(t);
        setTimeout(function () { saveMine(function (p) { p.routines[d] = p.routines[d] || {}; if (on) delete p.routines[d][id]; else p.routines[d][id] = new Date().toISOString(); }, on ? null : 'Maths faites · +' + money(P.ROUTINE_PAY)); }, on ? 0 : 280);
        break;
      }
      case 'nudge': sendNote(t.dataset.t); break;
      case 'nudge-free': freeNote(); break;
      case 'edit': openTask(id); break;
      case 'add': openTask(null, t.dataset.date); break;
      case 'del': del(id); break;
      case 'copy': copyLink(); break;
      case 'clear-flag': change({ type: 'clearFlag', subject: id }, 'Noté'); break;
      case 'add-subject': {
        var name = document.getElementById('ns-name').value.trim(), from = document.getElementById('ns-from').value, to = document.getElementById('ns-to').value;
        if (!name || !from || !to || to < from) { toast('Il faut un nom, un premier et un dernier jour'); return; }
        change({ type: 'addSubject', id: 'S-' + Date.now().toString(36), name: name, from: from, to: to, fiches: +document.getElementById('ns-n').value || 0 }, name + ' ajoutée au planning');
        break;
      }
      case 'del-subject': {
        var s = subj(id);
        if (window.confirm('Retirer ' + s.name + ' et toutes ses tâches du planning, pour vous deux ?')) change({ type: 'removeSubject', id: id }, s.name + ' retirée');
        break;
      }
      case 'leave':
        if (window.confirm('Quitter ce planning ? Il reste pour l’autre, mais tu ne le verras plus.')) API.leave(planId, me.id).then(function () { try { localStorage.removeItem('rev_cache'); } catch (e) {} planId = null; data = null; render(); });
        break;
      case 'create': {
        var nm = document.getElementById('c-name').value.trim();
        if (!nm) { document.getElementById('c-name').focus(); return; }
        t.disabled = true;
        API.create(P.seedPlan(), nm).then(function (r) { planId = r.id; return load(); }).then(function () { ui.view = 'settings'; render(); toast('Planning créé · envoie le lien à ta copine'); })
          .catch(function (err) { t.disabled = false; toast('Impossible : ' + (err.message || err) + '. As-tu lancé supabase-revisions.sql ?'); });
        break;
      }
      case 'join': {
        var code = document.getElementById('j-code').value.trim(), jn = document.getElementById('j-name').value.trim();
        if (!code || !jn) { toast('Il faut le code et ton prénom'); return; }
        t.disabled = true;
        API.join(code, jn).then(function (pid) { planId = pid; history.replaceState(null, '', location.pathname); return load(); }).then(function () { ui.view = 'today'; render(); toast('Bienvenue dans le planning'); })
          .catch(function (err) { t.disabled = false; toast(/inconnu/.test(err.message || '') ? 'Ce code n’existe pas, vérifie-le' : 'Impossible : ' + (err.message || err)); });
        break;
      }
    }
  });
  document.addEventListener('change', function (e) {
    var t = e.target; if (!data) return;
    if (t.id === 'myname' && t.value.trim()) { var nm = t.value.trim(); members.forEach(function (x) { if (x.user_id === me.id) x.name = nm; }); API.rename(planId, me.id, nm).then(function () { toast('Prénom enregistré'); }); }
    if (t.id === 'rtime' && t.value) change({ type: 'editRoutine', id: data.routines[0].id, time: t.value }, 'Heure des maths : ' + t.value);
    if (t.id === 'rto') change({ type: 'editRoutine', id: data.routines[0].id, to: t.value || null }, t.value ? 'Maths jusqu’au ' + niceDay(t.value) : 'Maths en semaine, sans fin');
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

  // Chemin dessiné entre les pierres (même rendu qu'École OS).
  function drawTrails() {
    document.querySelectorAll('.trail.snake').forEach(function (tr) {
      var old = tr.querySelector('svg.road'); if (old) old.remove();
      var box = tr.getBoundingClientRect(), pts = [];
      tr.querySelectorAll(':scope > .task > .stone').forEach(function (b) { var r = b.getBoundingClientRect(); pts.push([r.left - box.left + r.width / 2, r.top - box.top + r.height / 2]); });
      if (!pts.length) return;
      var d = 'M' + (pts[0][0] + 14) + ' ' + Math.max(0, pts[0][1] - 26) + ' Q' + pts[0][0] + ' ' + (pts[0][1] - 12) + ' ' + pts[0][0] + ' ' + pts[0][1], deco = '';
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i], dy = b[1] - a[1], sw = (a[0] - b[0]) * 0.9 || (i % 2 ? 22 : -22);
        d += ' C' + (a[0] + sw) + ' ' + (a[1] + dy * 0.5) + ' ' + (b[0] - sw) + ' ' + (b[1] - dy * 0.5) + ' ' + b[0] + ' ' + b[1];
        var mx = (a[0] + b[0]) / 2 + (i % 2 ? -18 : 18), my = (a[1] + b[1]) / 2;
        deco += i % 2 ? '<circle cx="' + mx + '" cy="' + my + '" r="2.6" fill="' + ['#F2B6C8', '#F5D27E', '#C4ADE0', '#A9D2EA'][i % 4] + '" stroke="#8A6A5C" stroke-width=".8"/>' :
          '<path d="M' + (mx - 4) + ' ' + (my + 3) + 'c1-3 1.5-5 1-7M' + mx + ' ' + (my + 3) + 'c0-3 .5-6 2-8M' + (mx + 4) + ' ' + (my + 3) + 'c.5-2 2-4 4-5" stroke="#86B97F" stroke-width="1.2" fill="none" stroke-linecap="round"/>';
      }
      var L = pts[pts.length - 1];
      d += ' Q' + L[0] + ' ' + (L[1] + 20) + ' ' + (L[0] + (pts.length % 2 ? 16 : -16)) + ' ' + (L[1] + 34);
      tr.insertAdjacentHTML('afterbegin', '<svg class="road" width="' + box.width + '" height="' + (box.height + 40) + '" aria-hidden="true">' +
        '<path d="' + d + '" stroke="#F4DCE3" stroke-width="20" fill="none" stroke-linecap="round"/>' +
        '<path d="' + d + '" stroke="#A7B8CE" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="0.1 12"/>' +
        '<path d="' + d + '" stroke="#C9D5E3" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-dasharray="0.1 12" stroke-dashoffset="-6"/>' + deco + '</svg>');
    });
  }
  window.addEventListener('resize', function () { clearTimeout(window.__revRs); window.__revRs = setTimeout(drawTrails, 150); });

  // ---------------------------------------------------------------- démarrage
  document.documentElement.style.setProperty('--grain', ART.GRAIN);
  document.documentElement.style.setProperty('--grass', ART.GRASS);
  document.body.style.backgroundImage = ART.GRAIN;
  document.querySelectorAll('.tab').forEach(function (t) { t.insertAdjacentHTML('afterbegin', ART.icon(t.dataset.ico, null, 20)); });
  var brand = document.getElementById('brand-art'); if (brand) brand.innerHTML = ART.brandMark();
  try { var sv = localStorage.getItem('rev_ui_view'); if (sv) ui.view = sv; } catch (e) {}
  var cm = /[?&]code=([A-Za-z0-9]+)/.exec(location.search); if (cm) ui.code = cm[1].toUpperCase();

  API.ready().then(function (r) {
    me = r.user;
    return API.myPlans(me.id);
  }).then(function (plans) {
    if (ui.code || !plans.length) { render(); return; }
    planId = plans[0].plan_id;
    return load().then(render);
  }).catch(function (err) {
    document.getElementById('view').innerHTML = '<div class="card" style="margin-top:20px;"><b>Le planning partagé ne répond pas.</b><p class="soft-note" style="margin-top:8px;">Si c’est la première fois, il faut lancer le fichier <b>supabase-revisions.sql</b> dans Supabase (SQL Editor). Détail : ' + esc(err.message || err) + '</p></div>';
  });
  setInterval(function () { if (document.visibilityState === 'visible') refresh(); }, 30000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') refresh(); });
})();
