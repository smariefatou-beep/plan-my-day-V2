// École OS — interface. Lit le curriculum, la progression et le planning via SchoolStore /
// SchoolEngine, dessine avec SchoolArt ; ne contient aucune règle de planification.
(function () {
  'use strict';
  var S = window.SchoolStore, E = window.SchoolEngine, C = window.SCHOOL_CURRICULUM, ART = window.SchoolArt;
  var ui = { view: 'today', subject: null, week: null, weekPage: 0 };
  var plan, today, state, settings;

  var TYPE = {
    understand: 'Comprendre', video: 'Vidéo', write: 'Écrire le cours', read: 'Lire le cours', aiquiz: 'Quiz IA',
    notebooklm: 'NotebookLM', fiches: 'Fiches', inclass: 'En classe', test: 'Test en ligne', practice: 'Exercices',
    reading: 'Manuel', prep: 'Prépa séminaire', project: 'Projet de groupe', revision: 'Révision', mine: 'Mon ajout'
  };
  var KIND = { deadline: 'Échéance', current: 'Cours actuel', catchup: 'Rattrapage', seminar: 'En classe', optional: 'Facultatif', mine: 'Mon ajout' };
  var MASTERY = ['Graine', 'Pousse', 'Bouton', 'En fleur'];
  var MASTERY_HINT = ['pas encore vu', 'découvert', 'compris', 'maîtrisé'];
  var DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  var MONTHS_L = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
  var BUILDING = { MA11: 'cottage', EC11: 'stall', IR11: 'manor', MG11: 'shop', SK11: 'gazebo', LE11: 'nook', ZH: 'teahouse', IT: 'piazza' };
  // Une plante par routine (jamais deux fois la même le même jour).
  var PLANT_OF = {
    'math-practice': 'sunflower', 'math-practice-thu': 'sunflower', 'zh-practice': 'peony', 'ir-book': 'lavender',
    'it-sheet': 'lemon', 'zh-homework': 'daisy', 'micro-review': 'hydrangea', 'zh-prep-tue': 'muguet',
    'check-new': 'cactus', 'mylab-check': 'bell', 'biz-monday': 'poppy', 'it-review': 'lemon',
    'zh-prep-sun': 'muguet', 'week-review': 'daisy'
  };
  function plantOf(r, i) { var k = Object.keys(ART.PLANTS); return PLANT_OF[r.id] || k[i % k.length]; }

  // ---------------------------------------------------------------- utilitaires
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function subj(id) { return E.subjectById(C, id) || { id: id, short: 'Perso', color: '#B6D39A', soft: '#E5F0D8', ink: '#5B7C42' }; }
  function vars(s) { return '--c:' + s.color + ';--cs:' + s.soft + ';--ci:' + s.ink + ';'; }
  function hm(mins) { mins = Math.round(mins || 0); if (mins < 60) return mins + ' min'; var h = Math.floor(mins / 60), m = mins % 60; return h + ' h' + (m ? ' ' + (m < 10 ? '0' : '') + m : ''); }
  function money(n) { return Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ') + ' $'; }
  var MONTHS_S = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  function shortDate(s) { var d = E.parseDay(s); return d.getDate() + ' ' + MONTHS_S[d.getMonth()]; }
  function longDate(s) { var d = E.parseDay(s); return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS_L[d.getMonth()]; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function act(id) { return plan.acts[id]; }
  function stOf(id) { return (state.acts || {})[id] || { s: 'todo' }; }
  function load() { today = S.today(); plan = S.recompute(); state = S.getState(); settings = S.getSettings(); }
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
  var XMARK = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#6D4D57" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ---------------------------------------------------------------- briques
  function stoneBtn(a, cls) {
    var st = stOf(a.id), c = 'stone' + (cls ? ' ' + cls : ''), style = '';
    if (st.s === 'done') c += ' on';
    else if (st.s === 'doing') { c += ' half'; style = '--p:' + (st.p || 0) + '%;'; }
    else if (st.s === 'blocked' || (a.blocked && st.s === 'todo')) c += ' blocked';
    return '<button class="' + c + '" style="' + style + '" data-a="toggle" data-id="' + esc(a.id) + '" aria-label="Cocher « ' + esc(a.title) + ' »">' + CHECK + '</button>';
  }
  function pills(a, it, opts) {
    opts = opts || {};
    var s = subj(a.subject), st = stOf(a.id), out = [];
    out.push('<span class="pill">' + (TYPE[a.type] || a.type) + '</span>');
    out.push('<span class="pill">' + hm(st.s === 'done' ? a.mins : E.remainingMins(a, state)) + (st.s === 'doing' ? ' restantes' : '') + '</span>');
    if (it) out.push('<span class="pill k-' + it.kind + '">' + (it.pinned ? 'Choisi par toi' : KIND[it.kind]) + '</span>');
    if (a.due && st.s !== 'done') out.push('<span class="pill k-deadline">' + (a.due < today ? 'échéance passée' : 'avant ' + E.niceDay(a.due, today)) + '</span>');
    if (st.s === 'doing') out.push('<span class="pill">en cours · ' + (st.p || 0) + ' %</span>');
    if (st.s === 'blocked' || (a.blocked && st.s === 'todo')) out.push('<span class="pill">' + esc(a.blocked || 'pas encore disponible') + '</span>');
    else if (a.release && a.release > today && st.s !== 'done') out.push('<span class="pill">dispo vers le ' + shortDate(a.release) + '</span>');
    if (a.custom) out.push('<span class="pill">ajoutée par toi</span>');
    if (a.removed) out.push('<span class="pill k-removed">supprimée de ton planning</span><button class="pill restore" data-a="restore" data-id="' + esc(a.id) + '">Remettre</button>');
    return out.join('');
  }
  function taskRow(a, it, opts) {
    opts = opts || {};
    var s = subj(a.subject), st = stOf(a.id);
    return '<div class="task' + (st.s === 'done' ? ' done' : '') + (a.removed ? ' removed' : '') + '" id="t-' + esc(a.id) + '" style="' + vars(s) + '">' +
      (opts.stepN ? '<span class="step-n">' + opts.stepN + '</span>' : '') +
      stoneBtn(a, opts.trail ? '' : 'inline') +
      '<div class="t-ico">' + ART.icon(a.type === 'test' ? 'test' : a.type, s.color, 22) + '</div>' +
      '<div class="t-main">' + (opts.noSubject ? '' : '<span class="t-subj">' + esc(s.short) + (a.week > 0 && a.week < 12 ? ' · S' + a.week : '') + '</span>') +
      '<div class="t-title">' + esc(a.title) + '</div>' +
      '<div class="t-meta">' + pills(a, it, opts) + '<span class="pill money mob">+' + money(E.reward(a)) + '</span></div>' +
      (it && it.reason ? '<details class="why"><summary>Pourquoi ' + (opts.dayLabel || 'aujourd’hui') + ' ?</summary><p>' + esc(it.reason) + '</p></details>' : '') +
      (a.questions ? '<details class="why"><summary>Les 3 questions du séminaire</summary><p>' + a.questions.map(function (q, i) { return (i + 1) + '. ' + esc(q); }).join('<br>') + '</p></details>' : '') +
      '</div><span class="reward">+' + money(E.reward(a)) + '</span><button class="more" data-a="open" data-id="' + esc(a.id) + '" aria-label="Détails">⋯</button></div>';
  }
  function extraRow(x, opts) {
    opts = opts || {};
    var s = subj(x.subject || '');
    return '<div class="task' + (x.done ? ' done' : '') + '" style="' + vars(s) + '">' +
      '<button class="stone' + (opts.trail ? '' : ' inline') + (x.done ? ' on' : '') + '" data-a="extra-toggle" data-id="' + esc(x.id) + '" aria-label="Cocher">' + CHECK + '</button>' +
      '<div class="t-ico">' + ART.icon('mine', s.color, 22) + '</div>' +
      '<div class="t-main">' + (x.subject ? '<span class="t-subj">' + esc(s.short) + '</span>' : '') + '<div class="t-title">' + esc(x.title) + '</div><div class="t-meta">' +
      '<span class="pill">' + hm(x.mins) + '</span><span class="pill k-mine">Mon ajout</span></div></div>' +
      '<span class="reward">+' + money(x.mins * 40) + '</span><button class="more" data-a="extra-del" data-id="' + esc(x.id) + '" aria-label="Supprimer">×</button></div>';
  }

  // ---------------------------------------------------------------- Aujourd'hui
  function doneTodayIds() {
    var h = S.getHistory(), m = {};
    h.forEach(function (e) { if (e.t && E.dayStr(new Date(e.t)) === today) { if (e.ev === 'done') m[e.id] = 1; else delete m[e.id]; } });
    return Object.keys(m).filter(function (id) { return stOf(id).s === 'done' && act(id); });
  }
  function assessedCount() {
    var subs = C.subjects.filter(function (s) { return !s.noSyllabus; });
    return { done: subs.filter(function (s) { return (state.assessed || {})[s.id]; }).length, total: subs.length };
  }
  function walletChip() {
    var w = E.wallet(C, state, settings);
    return '<button class="wallet-chip" data-a="go" data-view="progress">' + ART.icon('coin', null, 34) + '<span><b>' + money(w.total) + '</b><small>' + esc(w.levelName) + (w.next ? ' · encore ' + money(w.next.at - w.total) : '') + '</small></span></button>';
  }

  function viewToday() {
    var day = plan.days[0];
    var items = day.items.filter(function (it) { return act(it.id); });
    var extras = day.extras || [];
    var doneIds = doneTodayIds();
    var left = items.reduce(function (s, it) { return s + (it.inClass ? 0 : it.mins); }, 0) + extras.reduce(function (s, x) { return s + (x.done ? 0 : x.mins); }, 0);
    var rlog = (state.routineLog || {})[today] || {};
    var h = '<section class="hello"><div><div class="date">' + longDate(today) + '</div>' +
      '<div class="sub">' + (day.inBreak ? 'Semaine sans cours · ' : (day.academicWeek ? 'Semaine ' + day.academicWeek + ' · ' : '')) +
      (items.length + extras.length ? (items.length + extras.length) + ' étape' + (items.length + extras.length > 1 ? 's' : '') + ' sur ton chemin · ' + hm(left) + ' + ' + hm(day.routineMins) + ' de routines' : 'Rien d’autre à faire pour l’école aujourd’hui') + '</div>' +
      '<div class="today-actions">' + (items.length ? '<button class="btn" data-a="helper">' + ART.icon('pin', '#FBE0E8', 18) + ' Par où je commence ?</button>' : '') +
      '<button class="btn soft" data-a="day-add" data-date="' + today + '">' + ART.icon('plus', null, 16) + ' Ajouter une tâche</button></div></div>' + walletChip() + '</section>';

    var as = assessedCount();
    if (as.done < as.total) {
      h += '<div class="banner">' + ART.icon('map', '#FBF5EA', 34) + '<div class="b-txt"><b>Bilan initial : ' + as.done + ' matière' + (as.done > 1 ? 's' : '') + ' sur ' + as.total + '</b>' +
        'Tout est vide au départ. Ouvre chaque matière sur la carte et coche, semaine par semaine, ce que tu as déjà fait.</div>' +
        '<button class="btn" data-a="go" data-view="subjects">Ouvrir la carte</button></div>';
    }

    h += '<div class="grid-2"><div>';
    h += '<div class="section-h"><h3>Le chemin du jour</h3><span class="aside">dans l’ordre conseillé</span></div>';
    if (items.length || extras.length) {
      h += '<div class="trail snake">' + items.map(function (it) { return taskRow(act(it.id), it, { trail: true }); }).join('') +
        extras.map(function (x) { return extraRow(x, { trail: true }); }).join('') + '</div>';
    } else h += '<div class="card empty">' + ART.plant(3, '#F2B6C8') + '<br>Tout ce qui était prévu est fait. Repose-toi, ou arrose ton jardin de routines.</div>';

    day.seminars.forEach(function (sm) {
      var s = subj(sm.subject);
      h += '<div class="soft-note" style="margin-top:10px;"><b>' + (sm.kind === 'seminar' ? 'Séminaire' : sm.kind === 'workshop' ? 'Atelier' : 'Follow-up') + ' de ' + esc(s.short) + (sm.start ? ' · ' + esc(sm.start) : '') + '</b> : ' +
        (sm.activity && act(sm.activity) ? 'exercices de la semaine ' + sm.week + '.' : '') + (sm.note ? ' ' + esc(sm.note) : '') + '</div>';
    });
    if (plan.conflicts.length) {
      h += '<div class="gentle" style="margin-top:14px;"><h4>Petit embouteillage</h4><ul>' + plan.conflicts.map(function (c) { return '<li><span>' + esc(c.msg) + '</span></li>'; }).join('') + '</ul></div>';
    }
    h += '</div><div>';

    var rTodo = day.routines.filter(function (r) { return r.kind !== 'class'; });
    var rDone = rTodo.filter(function (r) { return rlog[r.id]; }).length;
    h += '<div class="section-h"><h3>Mon petit jardin</h3><span class="aside">' + rDone + '/' + rTodo.length + ' en fleur</span></div>' +
      '<p class="garden-hint">Tes habitudes du jour : une plante chacune. Touche-la quand c’est fait, elle fleurit.</p><div class="garden">';
    rTodo.forEach(function (r, i) {
      var done = !!rlog[r.id], kind = plantOf(r, i);
      h += '<button class="sprout' + (done ? ' done' : '') + '" data-a="routine" data-r="' + r.id + '" aria-pressed="' + done + '" aria-label="' + esc(r.title) + (done ? ' : fait' : ' : à faire') + '">' +
        '<span class="g-check">' + CHECK + '</span>' + ART.gardenPlant(kind, done) +
        '<span class="g-name">' + esc(r.title) + (r.optional ? ' (si besoin)' : '') + '</span><span class="min">' + r.mins + ' min · ' + ART.PLANTS[kind].name + '</span></button>';
    });
    h += '</div>';
    var classes = day.routines.filter(function (r) { return r.kind === 'class'; });
    if (classes.length) h += '<p class="garden-note">' + classes.map(function (r) { return esc(r.title); }).join(' · ') + '</p>';
    var mathR = day.routines.filter(function (r) { return r.adaptive; })[0];
    if (mathR) {
      var nx = E.nextInSequence(C, state, settings, mathR.adaptive, today, ['practice', 'reading', 'fiches']);
      if (nx) h += '<p class="garden-note">Pour ta pratique de maths, la suite logique : <b>' + esc(nx.title) + '</b> (S' + nx.week + '). <a href="#" class="btn-link" data-a="routine-link" data-r="' + mathR.id + '" data-id="' + esc(nx.id) + '">Fait, compte-le aussi</a></p>';
    }
    h += '<p class="garden-note">Le livre d’IR du jour avance tes lectures « avant le cours » (Allison, Ambrose & Brinkley).</p>';

    if (doneIds.length) {
      h += '<div class="section-h"><h3>Déjà fait aujourd’hui</h3><span class="aside">' + doneIds.length + '</span></div>';
      h += doneIds.map(function (id) { return taskRow(act(id)); }).join('');
    }
    var missed = plan.missed.filter(function (id) { return !(state.dismissed || {})[id]; });
    if (missed.length) {
      h += '<div class="gentle" style="margin-top:16px;"><h4>Échéances déjà passées</h4><p>Ces tests avaient une vraie date limite. Si tu les as faits, coche-les. Sinon, laisse filer, ce n’est pas grave.</p><ul>' +
        missed.slice(0, 5).map(function (id) {
          var a = act(id), s = subj(a.subject);
          return '<li><span>' + esc(s.short) + ' S' + a.week + ' · ' + esc(a.title) + '</span><span style="display:flex;gap:6px;flex-shrink:0;">' +
            '<button class="btn soft small" data-a="set" data-s="done" data-id="' + esc(id) + '">Fait</button><button class="btn soft small" data-a="dismiss" data-id="' + esc(id) + '">Laisser</button></span></li>';
        }).join('') + '</ul>' + (missed.length > 5 ? '<p style="margin-top:8px;">… et ' + (missed.length - 5) + ' autres, dans la Tirelire.</p>' : '') + '</div>';
    }
    h += '</div></div>';
    return h;
  }

  // ---------------------------------------------------------------- Semaine
  function viewWeek() {
    var page = ui.weekPage, days = plan.days.slice(page * 7, page * 7 + 7);
    var total = days.reduce(function (s, d) { return s + d.load + d.routineMins; }, 0);
    var h = '<h2 class="title">Ma semaine</h2><div class="subtitle">Touche une tâche pour la déplacer à un autre jour, la petite croix pour la supprimer, « Ajouter » pour mettre ce que tu veux sur une journée.</div>';
    h += '<div class="week-nav"><button class="btn soft small" data-a="wpage" data-d="-1" ' + (page === 0 ? 'disabled style="opacity:.4"' : '') + '>← 7 jours</button>' +
      '<b>' + shortDate(days[0].date) + ' → ' + shortDate(days[days.length - 1].date) + ' · ' + hm(total) + '</b>' +
      '<button class="btn soft small" data-a="wpage" data-d="1" ' + (page === 1 ? 'disabled style="opacity:.4"' : '') + '>7 jours →</button></div>';
    h += '<div class="week-days">';
    days.forEach(function (d) {
      var pct = d.studyCap ? Math.min(100, Math.round(100 * d.load / d.studyCap)) : 0;
      h += '<div class="wday' + (d.date === today ? ' today' : '') + '"><div class="wday-h"><b>' + DAYS[d.weekday] + '</b><span>' + shortDate(d.date) + '</span></div>' +
        (d.inBreak ? '<span class="tag">pas de cours</span>' : (d.academicWeek ? '<span class="tag blue">semaine ' + d.academicWeek + '</span>' : '')) +
        '<div class="load' + (d.over ? ' over' : '') + '"><i style="width:' + pct + '%"></i></div><div class="load-txt">' + hm(d.load) + ' sur ' + hm(d.studyCap) + '</div>';
      if (!d.items.length && !(d.extras || []).length) h += '<div style="font-size:12.5px;color:var(--ink-3);padding:4px 0;">Journée légère</div>';
      d.items.forEach(function (it) {
        var a = act(it.id); if (!a) return;
        var s = subj(a.subject);
        var tag = it.pinned ? '<span class="wk pin">choisi</span>' : it.kind === 'catchup' ? '<span class="wk catch">rattrapage</span>' : it.kind === 'deadline' ? '<span class="wk dead">échéance</span>' : it.kind === 'seminar' ? '<span class="wk sem">en classe</span>' : '';
        h += '<div class="wtask' + (stOf(a.id).s === 'done' ? ' done' : '') + '" style="' + vars(s) + '" data-a="open" data-id="' + esc(a.id) + '" role="button"><span class="w-body"><span class="t-subj">' + esc(s.short) + '</span><span class="w-title">' + esc(a.title.length > 70 ? a.title.slice(0, 68) + '…' : a.title) + '</span><span class="w-meta">' + hm(it.mins) + ' ' + tag + '</span></span>' +
          (it.inClass ? '' : '<button class="w-del" data-a="remove" data-id="' + esc(a.id) + '" aria-label="Supprimer cette tâche" title="Supprimer">' + XMARK + '</button>') + '</div>';
      });
      (d.extras || []).forEach(function (x) {
        var s = subj(x.subject || '');
        h += '<div class="wtask' + (x.done ? ' done' : '') + '" style="' + vars(s) + '" data-a="extra-toggle" data-id="' + esc(x.id) + '" role="button"><span class="w-body">' + (x.subject ? '<span class="t-subj">' + esc(s.short) + '</span>' : '') + '<span class="w-title">' + esc(x.title) + '</span><span class="w-meta">' + hm(x.mins) + ' <span class="wk mine">à moi</span></span></span>' +
          '<button class="w-del" data-a="extra-del" data-id="' + esc(x.id) + '" aria-label="Supprimer cette tâche" title="Supprimer">' + XMARK + '</button></div>';
      });
      d.seminars.forEach(function (sm) { h += '<div class="wtask cls" style="' + vars(subj(sm.subject)) + '"><span class="w-body"><span class="t-subj">' + esc(subj(sm.subject).short) + '</span><span class="w-title">' + (sm.kind === 'seminar' ? 'Séminaire' : sm.kind === 'workshop' ? 'Atelier' : 'Follow-up session') + '</span>' + (sm.start ? '<span class="w-meta">' + esc(sm.start) + (sm.end ? ' – ' + esc(sm.end) : '') + '</span>' : '') + '</span></div>'; });
      h += '<div class="w-foot"><span>' + d.routines.filter(function (r) { return r.kind !== 'class'; }).length + ' routines · ' + hm(d.routineMins) + '</span><button class="add-day" data-a="day-add" data-date="' + d.date + '">+ Ajouter</button></div></div>';
    });
    h += '</div>';

    var un = plan.unscheduled.filter(function (u) { return u.kind !== 'optional'; });
    var bySub = {};
    un.forEach(function (u) { var a = act(u.id); (bySub[a.subject] = bySub[a.subject] || []).push(a); });
    h += '<div class="grid-2"><div><div class="section-h"><h3>Pas encore placé</h3><span class="aside">' + un.length + ' étapes · ' + hm(un.reduce(function (s, u) { return s + E.remainingMins(act(u.id), state); }, 0)) + '</span></div>';
    if (!un.length) h += '<div class="card empty">Tout tient dans les 14 prochains jours.</div>';
    else {
      h += '<div class="card"><p class="soft-note" style="margin-bottom:8px;">Ce qui ne tient pas dans les 14 prochains jours sans surcharger tes journées. Je l’ajoute au fur et à mesure que tu avances. Tu peux aussi augmenter ton temps par jour dans Réglages, ou placer une étape toi-même avec « + Ajouter ».</p>';
      Object.keys(bySub).forEach(function (sid) {
        var s = subj(sid), l = bySub[sid];
        h += '<div class="form-row"><label><b>' + esc(s.short) + '</b><small>' + l.length + ' étapes, à partir de « ' + esc(l[0].title.slice(0, 48)) + ' » (S' + l[0].week + ')</small></label><span class="load-txt">' + hm(l.reduce(function (x, a) { return x + E.remainingMins(a, state); }, 0)) + '</span></div>';
      });
      h += '</div>';
    }
    h += '</div><div>' + assessmentsBlock() + '</div></div>';
    return h;
  }

  function assessmentsBlock() {
    var exams = C.assessments.filter(function (x) { return !x.past; }).map(function (x) { return { x: x, date: E.examDate(settings, x) }; });
    var dated = exams.filter(function (e) { return e.date && e.date >= today; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var undated = exams.filter(function (e) { return !e.date; });
    var h = '<div class="section-h"><h3>Évaluations</h3><span class="aside">' + dated.length + ' datées</span></div><div class="card">';
    dated.forEach(function (e) {
      var s = subj(e.x.subject);
      h += '<div class="form-row"><label><b>' + esc(s.short) + '</b> · ' + esc(e.x.title) + '<small>' + E.niceDay(e.date, today) + (e.x.time ? ' · ' + e.x.time.replace(':', ' h ') : '') + ' · ' + e.x.weight + ' %</small></label><span class="pill k-deadline">J-' + E.diffDays(today, e.date) + '</span></div>';
    });
    if (undated.length) h += '<p class="soft-note">' + undated.length + ' évaluations n’ont pas encore de date (midterms, présentations). <a href="#" class="btn-link" data-a="go" data-view="settings">Ajoute-les dans Réglages</a> quand tu les connais : je prévoirai des révisions juste avant.</p>';
    return h + '</div>';
  }

  // ---------------------------------------------------------------- Carte
  var MAP_POS = { MA11: [88, 100], EC11: [214, 92], MG11: [80, 214], SK11: [214, 226], IR11: [362, 212], LE11: [88, 322], ZH: [352, 330], IT: [214, 372] };
  var MAP_ROADS = [
    'M214 362C204 330 226 300 214 262C204 232 226 200 216 170C206 140 222 120 214 98',
    'M216 170C180 160 150 140 120 130C104 124 94 116 90 104',
    'M214 262C170 250 130 236 84 218',
    'M220 300C170 300 130 318 92 326',
    'M214 226C250 214 280 210 310 212C330 214 348 214 362 214',
    'M216 332C260 338 300 332 350 332'
  ];
  function viewSubjects() {
    if (ui.subject) return subjectDetail(subj(ui.subject));
    var pr = E.progress(C, state, settings, today);
    var h = '<h2 class="title">Ma carte des cours</h2><div class="subtitle">Chaque maison est une matière. Touche-la pour entrer dans son village, ouvrir ses semaines et cocher ce que tu as fait.</div>';
    h += '<div class="grid-2"><div class="map-wrap grain"><svg viewBox="0 0 420 430" role="img" aria-label="Carte des matières">' + ART.mapScene(MAP_ROADS);
    C.subjects.forEach(function (s) {
      var p = MAP_POS[s.id], r = pr[s.id];
      h += '<g class="map-place" data-a="subject" data-id="' + s.id + '" role="button" tabindex="0" aria-label="' + esc(s.short) + '"><g class="bld"><g transform="translate(' + p[0] + ' ' + p[1] + ') scale(.78)">' + ART.building(BUILDING[s.id], 0, 0, s.color, s.soft) + '</g></g>' +
        '<text x="' + p[0] + '" y="' + (p[1] + 18) + '" text-anchor="middle" class="map-label">' + esc(s.short) + '</text>' +
        '<text x="' + p[0] + '" y="' + (p[1] + 30) + '" text-anchor="middle" class="map-pct">' + (s.noSyllabus ? 'routines' : s.finished ? 'examen passé' : r.pct + ' % fait') + '</text></g>';
    });
    h += '</svg></div><div class="subj-list">';
    C.subjects.forEach(function (s) {
      var r = pr[s.id], assessed = (state.assessed || {})[s.id];
      var sub = s.noSyllabus ? 'Suivi par tes routines' : r.done + ' étapes faites sur ' + r.total + (assessed ? (r.behindMins ? ' · ' + hm(r.behindMins) + ' à rattraper' : ' · rien à rattraper') : '');
      h += '<button class="subj-card" style="' + vars(s) + '--p:' + (s.noSyllabus ? 0 : r.pct) + '" data-a="subject" data-id="' + s.id + '">' +
        '<div class="ring"><span>' + ART.symbol(s.id, s.color, 22) + '</span></div><div class="sc-main"><div class="sc-name">' + esc(s.short) + '</div><div class="sc-sub">' + sub + '</div></div>' + statusPill(s, r) + '</button>';
    });
    return h + '</div></div>';
  }
  function statusPill(s, r) {
    var map = { 'on-track': 'Dans les temps', watch: 'Un peu de retard', attention: 'Besoin d’attention', routine: 'Routines' };
    if (!s.noSyllabus && !(state.assessed || {})[s.id]) return '<span class="status routine">Bilan à faire</span>';
    return '<span class="status ' + r.status + '">' + map[r.status] + '</span>';
  }

  function defaultWeekFor(s) {
    var aw = E.academicWeekOf(C, today), cur = aw ? (aw.inBreak ? aw.n + 1 : aw.n) : 1, first = null;
    s.weeks.forEach(function (w) {
      if (first !== null) return;
      var pending = w.activities.some(function (a) { return !a.optional && stOf(a.id).s !== 'done'; });
      if (pending && w.n > 0 && w.n <= cur) first = w.n;
    });
    var has = s.weeks.some(function (w) { return w.n === cur; });
    return first !== null ? first : (has ? cur : (s.weeks[0] ? s.weeks[0].n : null));
  }

  function subjectDetail(s) {
    var pr = E.progress(C, state, settings, today)[s.id];
    if (ui.week == null || !s.weeks.some(function (w) { return w.n === ui.week; })) ui.week = defaultWeekFor(s);
    var aw = E.academicWeekOf(C, today), curN = aw ? (aw.inBreak ? aw.n + 1 : aw.n) : null;
    var next = pr.upcoming[0];
    var exam = C.assessments.filter(function (x) { return x.subject === s.id && /final/.test(x.id) && E.examDate(settings, x); })[0];
    var h = '<section class="village-head" style="' + vars(s) + '">' +
      '<div class="vh-txt"><button class="chip-btn" data-a="subject" data-id="">' + ART.icon('back', null, 14) + ' La carte</button>' +
      '<div class="vh-name">' + ART.symbol(s.id, s.color, 34) + '<h2>Le village ' + (/^[AEIOUÉ]/.test(s.short) ? 'd’' : 'de ') + esc(s.short) + '</h2></div>' +
      '<div class="code">' + (s.noSyllabus ? esc(s.name) : s.id + ' · ' + esc(s.name) + ' · ' + s.ects + ' ECTS') + '</div>';
    if (!s.noSyllabus) {
      h += '<div class="sh-stats"><div class="sh-stat"><b>' + pr.pct + ' %</b>du travail fait</div>' +
        '<div class="sh-stat"><b>' + (s.finished ? '—' : (state.assessed || {})[s.id] ? (pr.behind ? hm(pr.behindMins) : '0') : '—') + '</b>à rattraper</div>' +
        (exam ? '<div class="sh-stat"><b>' + shortDate(E.examDate(settings, exam)) + '</b>examen final</div>' : '') +
        '<div class="sh-stat"><b>' + (next ? E.niceDay(next.due, today) : '—') + '</b>prochaine échéance</div></div>';
    }
    h += '</div><div class="vh-scene">' + ART.village(s.id, s.color, s.soft) + '</div></section>';
    if (s.finished) h += '<div class="flag" style="margin-top:12px;">' + esc(s.finished) + '</div>';
    if (s.books) h += '<div class="books"><div style="font-size:12.5px;color:var(--ink-3);">Les noms d’auteurs que tu vois dans les lectures (par ex. « ' + esc(s.books[0].split(' — ')[0]) + ' ») viennent de ce' + (s.books.length > 1 ? 's manuels officiels' : ' manuel officiel') + ', cité' + (s.books.length > 1 ? 's' : '') + ' dans le syllabus :</div>' +
      s.books.map(function (b) { return '<div class="book">' + ART.icon('reading', s.soft, 20) + '<span>' + esc(b) + '</span></div>'; }).join('') + '</div>';
    h += '<p class="soft-note" style="margin-top:10px;">' + esc(s.prepNote) + (s.weeksEstimated ? ' Les semaines sont estimées (ordre du syllabus).' : '') + '</p>';

    if (s.noSyllabus) {
      h += '<div class="section-h"><h3>Tes routines</h3></div><div class="garden">';
      C.routines.filter(function (r) { return r.subject === s.id; }).forEach(function (r) {
        h += '<div class="sprout' + (r.kind === 'class' ? ' cls' : '') + '">' + (r.kind === 'class' ? ART.symbol(s.id, s.color, 34) : ART.pot(false, s.color)) + '<span>' + esc(r.title) + '</span><span class="min">' + r.days.map(function (d) { return DAYS[d].slice(0, 3); }).join(', ') + '</span></div>';
      });
      return h + '</div><p class="soft-note" style="margin-top:12px;">Envoie-moi un programme et je l’ajoute ici, semaine par semaine.</p>';
    }

    var assessed = (state.assessed || {})[s.id];
    h += '<div class="card" style="margin-top:12px;display:flex;align-items:center;gap:12px;"><div style="flex:1;font-size:13.5px;"><b>Bilan initial</b><br><span style="color:var(--ink-2);">' +
      (assessed ? 'Fait. Tu peux toujours corriger une case.' : 'Coche ce que tu as déjà fait dans chaque semaine, puis active.') + '</span></div>' +
      '<button class="toggle' + (assessed ? ' on' : '') + '" data-a="assessed" data-id="' + s.id + '" aria-label="Bilan fait"></button></div>';

    h += '<div class="week-chips" style="' + vars(s) + '">';
    s.weeks.forEach(function (w) {
      var list = w.activities.filter(function (a) { return !a.optional && !a.viaRoutine && !(state.removed || {})[a.id]; });
      var nDone = list.filter(function (a) { return stOf(a.id).s === 'done'; }).length;
      var full = list.length && nDone === list.length;
      var lvl = full ? 3 : !nDone ? 0 : nDone * 2 >= list.length ? 2 : 1;
      var ws = E.weekStart(C, w.n);
      h += '<button class="wchip' + (w.n === ui.week ? ' on' : '') + (full ? ' full' : '') + (w.n === curN ? ' now' : '') + '" data-a="week" data-n="' + w.n + '" title="' + nDone + '/' + list.length + ' étapes faites">' +
        ART.plant(lvl, s.color) + '<b>' + (w.n === 0 ? 'Avant' : w.n === 12 ? 'En plus' : 'S' + w.n) + '</b><small>' + (w.n === 12 ? 'à ton rythme' : w.n === 0 ? 'le cours' : shortDate(ws)) + '</small></button>';
    });
    h += '</div>';

    var wk = s.weeks.filter(function (w) { return w.n === ui.week; })[0];
    if (!wk) return h;
    var ws = E.weekStart(C, wk.n);
    var acts = E.activities(C, state, settings).filter(function (a) { return a.subject === s.id && a.week === wk.n; });
    h += '<div class="card week-card meadow" style="margin-top:6px;' + vars(s) + '">';
    h += '<h3>' + esc(wk.title) + '</h3><div class="wk-date">' + (wk.n === 0 ? 'Avant le 7 septembre' : wk.n === 12 ? 'Contenu en autonomie' : 'Semaine ' + wk.n + ' · à partir du lundi ' + shortDate(ws) + (wk.n === curN ? ' · c’est la semaine en cours' : '')) + '</div>';
    (wk.flags || []).forEach(function (f) { h += '<div class="flag">' + esc(f) + '</div>'; });
    if (wk.note) h += '<div class="flag" style="background:var(--lilac-soft);color:#76579B;">' + esc(wk.note) + '</div>';
    if (wk.topics && wk.topics.length) h += '<details style="margin-top:10px;"><summary class="btn-link" style="cursor:pointer;">Ce qu’on voit cette semaine (' + wk.topics.length + ')</summary><ul class="topics">' + wk.topics.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></details>';

    var method = acts.filter(function (a) { return a.step; }).sort(function (x, y) { return x.step - y.step || x.seq - y.seq; });
    var syl = acts.filter(function (a) { return !a.step; });
    if (method.length) {
      h += '<div class="grp-h">Ma méthode</div><div class="grp-sub">Dans cet ordre : chaque étape débloque la suivante. Une étape inutile pour toi ? Ouvre-la (⋯) et supprime-la.</div>';
      h += method.map(function (a) { var it = plannedItem(a.id); return taskRow(a, it && it.item, { noSubject: true, stepN: a.step, dayLabel: it ? E.niceDay(it.date, today) : '' }); }).join('');
    }
    if (syl.length || (wk.refs && wk.refs.length) || (wk.refsText && wk.refsText.length)) {
      h += '<div class="grp-h">Demandé par le syllabus</div>';
      h += syl.map(function (a) { var it = plannedItem(a.id); return taskRow(a, it && it.item, { noSubject: true, dayLabel: it ? E.niceDay(it.date, today) : '' }); }).join('');
      if ((wk.refs && wk.refs.length) || (wk.refsText && wk.refsText.length)) {
        h += '<div class="refs">';
        (wk.refs || []).forEach(function (r) { var a = act(r.id), done = stOf(r.id).s === 'done'; h += '<div class="ref">' + ART.icon('reading', s.soft, 18) + '<span>' + esc(a ? a.title : r.id) + ' — déjà prévu en S' + r.week + (done ? ' (fait)' : '') + '</span></div>'; });
        (wk.refsText || []).forEach(function (t) { h += '<div class="ref">' + ART.icon('reading', s.soft, 18) + '<span>' + esc(t) + '</span></div>'; });
        h += '</div>';
      }
    }
    if (wk.n > 0 && wk.n < 12) {
      var mk = s.id + '-w' + pad(wk.n), mv = (state.mastery || {})[mk];
      h += '<div class="grp-h">Ma maîtrise</div><div class="grp-sub">Ton ressenti à toi : cocher les étapes ne fait pas pousser la fleur.</div><div class="mastery">' +
        MASTERY.map(function (m, i) { return '<button class="' + (mv === i ? 'on' : '') + '" data-a="mastery" data-k="' + mk + '" data-v="' + i + '" title="' + MASTERY_HINT[i] + '">' + ART.plant(i, s.color) + m + '</button>'; }).join('') + '</div>';
    }
    h += '<div class="row-actions"><button class="btn soft small" data-a="weekall" data-id="' + s.id + '" data-n="' + wk.n + '">Toute la semaine est déjà faite</button>' +
      '<button class="btn soft small" data-a="add" data-id="' + s.id + '" data-n="' + wk.n + '">+ Ajouter une activité</button></div></div>';
    return h;
  }
  function plannedItem(id) {
    for (var i = 0; i < plan.days.length; i++) {
      var d = plan.days[i];
      for (var j = 0; j < d.items.length; j++) if (d.items[j].id === id) return { date: d.date, item: d.items[j] };
    }
    return null;
  }

  // ---------------------------------------------------------------- Tirelire
  function viewProgress() {
    var w = E.wallet(C, state, settings);
    var pr = E.progress(C, state, settings, today);
    var subs = C.subjects.filter(function (s) { return !s.noSyllabus; });
    var h = '<h2 class="title">Ma tirelire</h2><div class="subtitle">Chaque étape cochée te rapporte des dollars. Objectif : devenir millionnaire d’ici la fin du semestre.</div>';
    h += '<div class="card bank">' + ART.piggyBank(160) + '<div><div class="amount">' + money(w.total) + '</div><div class="lvl">Niveau ' + (w.level + 1) + ' · ' + esc(w.levelName) + '</div>' +
      (w.next ? '<div class="coins-bar"><i style="width:' + w.toNext + '%"></i></div><div style="font-size:12.5px;color:var(--ink-2);">Encore <b>' + money(w.next.at - w.total) + '</b> pour devenir « ' + esc(w.next.name) + ' »</div>' : '<div style="margin-top:8px;">Tu as tout débloqué ✿</div>') +
      '<div class="earn" style="margin-top:12px;"><div><span>Étapes de cours (' + w.rate + ' $ la minute)</span><b>' + money(w.work) + '</b></div>' +
      '<div><span>Routines du jardin</span><b>' + money(w.routines) + '</b></div><div><span>Tes ajouts</span><b>' + money(w.extras) + '</b></div>' +
      '<div><span>Bonus semaine complète (' + money(w.weekBonus) + ' chacune)</span><b>' + money(w.bonus) + '</b></div></div></div></div>';
    var taken = ((state.rewards || {}).taken) || {};
    var toTake = w.levels.map(function (l, i) { return i; }).filter(function (i) { return i > 0 && i <= w.level && !taken[i]; });
    h += '<div class="section-h"><h3>Niveaux et récompenses</h3><span class="aside">' + (toTake.length ? toTake.length + ' récompense' + (toTake.length > 1 ? 's' : '') + ' à t’offrir' : 'à chaque niveau, un vrai cadeau') + '</span></div>' +
      '<p class="soft-note" style="margin-bottom:10px;">À chaque niveau atteint, tu t’offres quelque chose en vrai, avec le budget indiqué (en euros). Touche « Modifier » pour choisir ta propre récompense.</p><div class="levels">' + w.levels.map(function (l, i) {
      var got = w.total >= l[0], rw = E.levelReward(state, i);
      var foot = i === 0 ? '<small>Le point de départ</small>' :
        taken[i] ? '<span class="rw-state ok">Offerte le ' + shortDate(taken[i]) + ' ✓</span>' :
        got ? '<button class="btn small" data-a="reward-take" data-l="' + i + '">Je me l’offre</button>' :
        '<small>encore ' + money(l[0] - w.total) + '</small>';
      return '<div class="level' + (got ? ' got' : '') + (i === w.level ? ' now' : '') + (got && i > 0 && !taken[i] ? ' ready' : '') + '">' +
        '<div class="lv-top">' + ART.icon('coin', got ? '#F5D27E' : '#EFE6DA', 26) + '<span><b>' + esc(l[1]) + '</b>' + money(l[0]) + '</span></div>' +
        (i ? '<div class="rw"><span class="rw-txt">' + esc(rw.text) + '</span><span class="rw-budget">Budget : ' + rw.budget + ' €</span></div>' : '') +
        '<div class="lv-foot">' + foot + (i ? '<button class="btn-link" data-a="reward-edit" data-l="' + i + '">Modifier</button>' : '') + '</div></div>';
    }).join('') + '</div>';

    if (!assessedCount().done) h += '<div class="banner"><div class="b-txt"><b>Ton vrai retard n’est pas encore calculé</b>Tant que tu n’as pas coché ce que tu as déjà fait, tout apparaît « à faire ». Fais ton bilan sur la carte : les chiffres ci-dessous deviendront justes.</div><button class="btn" data-a="go" data-view="subjects">Faire le bilan</button></div>';

    h += '<div class="section-h"><h3>Par matière</h3><span class="aside">pondéré par la durée de chaque étape</span></div><div class="subj-list">';
    subs.forEach(function (s) {
      var r = pr[s.id];
      h += '<div class="card prog-card" style="' + vars(s) + '--p:' + r.pct + '">' +
        '<div class="prog-top"><div class="ring"><span>' + r.pct + '%</span></div><div class="sc-main"><div class="sc-name">' + esc(s.short) + '</div><div class="sc-sub">' + r.done + ' faites · ' + (r.total - r.done) + ' restantes</div></div>' + statusPill(s, r) + '</div>' +
        '<div class="two-bars"><div class="tb"><span>Prévu à date</span><span class="track"><i style="width:' + r.expectedPct + '%;background:var(--ink-3)"></i></span><span>' + r.expectedPct + '%</span></div>' +
        '<div class="tb"><span>Vraiment fait</span><span class="track"><i style="width:' + r.pct + '%;background:' + s.color + '"></i></span><span>' + r.pct + '%</span></div></div>';
      var ws = s.weeks.filter(function (x) { return x.n > 0 && x.n < 12; });
      h += '<div class="bars">' + ws.map(function (x) { var q = r.weeks[x.n] || { totalMins: 0, doneMins: 0 }; var p = q.totalMins ? Math.round(100 * q.doneMins / q.totalMins) : 0; return '<div title="S' + x.n + ' : ' + p + ' %"><i style="height:' + p + '%"></i></div>'; }).join('') + '</div>' +
        '<div class="bars-lbl">' + ws.map(function (x) { return '<span>' + x.n + '</span>'; }).join('') + '</div>';
      h += '<div class="kv"><div><b>' + ((state.assessed || {})[s.id] ? (r.behind ? hm(r.behindMins) : '0') : '—') + '</b>à rattraper</div>' +
        '<div><b>' + money(r.doneMins * w.rate) + '</b>gagnés ici</div>' +
        '<div><b>' + (r.mastery != null ? MASTERY[Math.round(r.mastery)] : '—') + '</b>maîtrise ressentie</div>' +
        '<div><b>' + (r.upcoming[0] ? E.niceDay(r.upcoming[0].due, today) : '—') + '</b>' + (r.upcoming[0] ? esc(r.upcoming[0].title.slice(0, 32)) : 'pas d’échéance sous 14 j') + '</div></div></div>';
    });
    h += '</div>';

    if (plan.missed.length) {
      h += '<div class="section-h"><h3>Échéances passées</h3><span class="aside">coche si c’était fait</span></div><div class="card">' +
        plan.missed.map(function (id) { var a = act(id), s = subj(a.subject); return '<div class="form-row"><label>' + esc(s.short) + ' S' + a.week + ' · ' + esc(a.title) + '<small>Échéance du ' + shortDate(a.due) + ((state.dismissed || {})[id] ? ' · laissée' : '') + '</small></label><button class="btn soft small" data-a="set" data-s="done" data-id="' + esc(id) + '">Fait</button></div>'; }).join('') + '</div>';
    }
    var hist = S.getHistory().slice(-14).reverse();
    var EV = { done: 'Fait', todo: 'Décoché', doing: 'En cours', blocked: 'Pas dispo', missed: 'Prévu, pas fait' };
    h += '<div class="section-h"><h3>Mon carnet</h3><span class="aside">rien n’est jamais effacé</span></div><div class="card hist">' +
      (hist.length ? hist.map(function (e) { var a = act(e.id); return '<div><time>' + (e.date || E.dayStr(new Date(e.t))).slice(5).split('-').reverse().join('/') + '</time><span><b>' + EV[e.ev] + '</b> · ' + esc(a ? subj(a.subject).short + ' · ' + a.title : e.id) + '</span>' + (e.ev === 'done' && a ? '<span class="m">+' + money(E.reward(a)) + '</span>' : '') + '</div>'; }).join('') : '<div>Encore rien : coche ta première étape.</div>') + '</div>';
    return h;
  }

  // ---------------------------------------------------------------- Réglages
  function viewSettings() {
    var h = '<h2 class="title">Réglages</h2><div class="subtitle">Ton temps, ton emploi du temps et tes dates d’examens : le planning s’adapte tout de suite.</div><div class="grid-2"><div>';
    h += '<div class="section-h"><h3>Temps de travail par jour</h3><span class="aside">routines comprises</span></div><div class="card">';
    WEEK_ORDER.forEach(function (d) {
      var rm = C.routines.filter(function (r) { return r.days.indexOf(d) !== -1 && !(settings.routinesOff || {})[r.id] && r.kind !== 'class' && !r.optional; }).reduce(function (s, r) { return s + r.mins; }, 0);
      h += '<div class="form-row"><label>' + DAYS[d] + '<small>dont ' + hm(rm) + ' de routines, donc ' + hm(Math.max(0, settings.capacity[d] - rm)) + ' pour les cours</small></label><input class="inp num" type="number" min="0" step="15" value="' + settings.capacity[d] + '" data-set="capacity" data-d="' + d + '"> <span class="load-txt">min</span></div>';
    });
    h += '<div class="form-row"><label>Part max du rattrapage<small>les jours où il y a aussi des cours à préparer</small></label><input type="range" min="30" max="90" step="10" value="' + Math.round(settings.catchupShare * 100) + '" data-set="share" style="width:120px;"> <span class="load-txt">' + Math.round(settings.catchupShare * 100) + ' %</span></div></div>';

    h += '<div class="section-h"><h3>Emploi du temps</h3></div><div class="card"><p class="soft-note">Repris de ton calendrier ESCP. Les exercices « en classe » de ta méthode sont placés tout seuls sur tes <b>séminaires</b>, <b>follow-up sessions</b> et <b>ateliers</b>. Corrige ici si un cours change.</p>';
    (settings.timetable || []).forEach(function (t, i) {
      h += '<div class="tt-row"><select class="inp" data-set="tt" data-i="' + i + '" data-f="subject">' + C.subjects.map(function (s) { return '<option value="' + s.id + '"' + (s.id === t.subject ? ' selected' : '') + '>' + esc(s.short) + '</option>'; }).join('') + '</select>' +
        '<select class="inp" data-set="tt" data-i="' + i + '" data-f="kind">' + [['followup', 'Follow-up session'], ['seminar', 'Séminaire'], ['workshop', 'Atelier'], ['language', 'Cours de langue']].map(function (k) { return '<option value="' + k[0] + '"' + (k[0] === t.kind ? ' selected' : '') + '>' + k[1] + '</option>'; }).join('') + '</select>' +
        '<select class="inp" data-set="tt" data-i="' + i + '" data-f="day">' + WEEK_ORDER.map(function (d) { return '<option value="' + d + '"' + (d === t.day ? ' selected' : '') + '>' + DAYS[d] + '</option>'; }).join('') + '</select>' +
        '<input class="inp" type="time" value="' + esc(t.start) + '" data-set="tt" data-i="' + i + '" data-f="start"><input class="inp" type="time" value="' + esc(t.end) + '" data-set="tt" data-i="' + i + '" data-f="end">' +
        '<button class="btn soft small" data-a="tt-del" data-i="' + i + '">Retirer</button></div>';
    });
    h += '<div class="row-actions"><button class="btn soft small" data-a="tt-add" data-k="seminar">+ Séminaire</button><button class="btn soft small" data-a="tt-add" data-k="followup">+ Follow-up</button><button class="btn soft small" data-a="tt-add" data-k="workshop">+ Atelier</button></div></div>';
    h += '</div><div>';

    h += '<div class="section-h"><h3>Dates d’évaluations</h3></div><div class="card"><p class="soft-note">Les finals viennent du calendrier « Fall final exams B1 ». Pour chaque date, je planifie des révisions juste avant (3 pour un midterm, 4 pour un final).</p>';
    C.assessments.forEach(function (x) {
      h += '<div class="form-row"><label><b>' + esc(subj(x.subject).short) + '</b> · ' + esc(x.title) + '<small>' + x.weight + ' % · ' + esc(x.when) + '</small></label>' + (x.past ? '<span class="pill">passé</span>' : '<input class="inp" type="date" value="' + (E.examDate(settings, x) || '') + '" data-set="exam" data-id="' + x.id + '">') + '</div>';
    });
    h += '</div><div class="section-h"><h3>Routines</h3></div><div class="card">';
    C.routines.forEach(function (r) {
      var on = !(settings.routinesOff || {})[r.id];
      h += '<div class="form-row"><label>' + esc(r.title) + '<small>' + (r.days.length === 7 ? 'Tous les jours' : r.days.map(function (d) { return DAYS[d]; }).join(', ')) + (r.mins ? ' · ' + r.mins + ' min' : '') + '</small></label><button class="toggle' + (on ? ' on' : '') + '" data-a="routine-off" data-r="' + r.id + '"></button></div>';
    });
    h += '</div><div class="row-actions"><button class="btn soft small" data-a="replan">Replanifier depuis zéro</button><a class="btn soft small" href="tests.html" style="text-decoration:none;">Tests du moteur</a><button class="btn soft small" data-a="reset" style="color:#B35A6E;">Tout décocher</button></div>';
    h += '<p class="soft-note" style="margin-top:12px;">Calendrier : ' + esc(C.calendar.source) + '. ' + esc(C.calendar.breaks[0].label) + '.</p></div></div>';
    return h;
  }

  // ---------------------------------------------------------------- Feuilles
  var timer = { int: null };
  function sheet(html, onMount) {
    closeSheet();
    var bg = document.createElement('div'); bg.className = 'sheet-bg'; bg.id = 'sheet';
    bg.innerHTML = '<div class="sheet grain">' + html + '</div>';
    bg.addEventListener('click', function (e) { if (e.target === bg) closeSheet(); });
    document.body.appendChild(bg);
    if (onMount) onMount(bg);
  }
  function closeSheet() { var s = document.getElementById('sheet'); if (s) s.remove(); if (timer.int) { clearInterval(timer.int); timer.int = null; } }
  function dayChoices(selected) {
    return '<div class="day-pick">' + plan.days.map(function (d) { return '<button data-day="' + d.date + '" class="' + (d.date === selected ? 'on' : '') + '">' + (d.date === today ? 'Aujourd’hui' : DAYS[d.weekday].slice(0, 3) + ' ' + E.parseDay(d.date).getDate()) + '</button>'; }).join('') + '</div>';
  }

  function openActivity(id) {
    var a = act(id); if (!a) return;
    var s = subj(a.subject), st = stOf(id), pi = plannedItem(id), pinned = (state.pins || {})[id];
    var cur = st.s === 'todo' && a.blocked ? 'blocked' : st.s;
    var h = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;' + vars(s) + '"><span class="pill subj">' + esc(s.short) + (a.week ? ' · S' + a.week : '') + '</span><span class="pill">' + (TYPE[a.type] || a.type) + '</span><span class="pill money">+' + money(E.reward(a)) + '</span></div>' +
      '<h3>' + esc(a.title) + '</h3><div class="s-sub">' + esc(a.weekTitle || '') + '</div>';
    if (pi) h += '<div class="soft-note">Prévu <b>' + E.niceDay(pi.date, today) + '</b> : ' + esc(pi.item.reason) + '</div>';
    h += '<div class="field"><label>Où j’en suis</label><div class="seg">' +
      [['todo', 'Pas commencé'], ['doing', 'En cours'], ['done', 'Fait'], ['blocked', 'Pas encore dispo']].map(function (o) { return '<button data-st="' + o[0] + '" class="' + (cur === o[0] ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="field" id="pfield" style="' + (cur === 'doing' ? '' : 'display:none') + '"><label>Avancement : <span id="pval">' + (st.p || 0) + '</span> %</label><input type="range" min="0" max="95" step="5" value="' + (st.p || 0) + '" id="prange"></div>';
    if (!a.inClass || E.classify(a, state, today) !== 'inclass') {
      h += '<div class="field"><label>Le faire quel jour ?</label>' + dayChoices(pinned || null) + '<small>' + (pinned ? 'Tu l’as placé toi-même. <a href="#" class="btn-link" data-x="unpin">Laisser l’app choisir</a>' : 'Choisis un jour pour le placer toi-même ; sinon l’app choisit.') + '</small></div>';
    }
    h += '<div class="field"><label>Durée estimée (minutes)</label><input class="inp" type="number" min="5" step="5" id="fmins" value="' + a.mins + '"></div>' +
      '<div class="field"><label>Échéance réelle</label><input class="inp" type="date" id="fdue" value="' + (a.due || '') + '"><small>' + esc(a.due ? (a.dueSrc || '') : 'Aucune échéance dans le syllabus : n’en mets une que si le prof l’a donnée.') + '</small></div>';
    if (a.src) h += '<p style="font-size:12px;color:var(--ink-3);margin-top:12px;">Source : ' + esc(a.src) + '</p>';
    h += '<div class="sheet-actions">' + (a.custom ? '<button class="btn soft" data-x="del" style="margin-right:auto;color:#B35A6E;">Supprimer</button>' :
      a.removed ? '<button class="btn soft" data-x="restore" style="margin-right:auto;">Remettre dans mon planning</button>' :
      '<button class="btn soft" data-x="remove" style="margin-right:auto;color:#B35A6E;">Supprimer de mon planning</button>') + '<button class="btn soft" data-x="close">Annuler</button><button class="btn" data-x="save">Enregistrer</button></div>';
    sheet(h, function (root) {
      var chosen = cur, day = pinned || null, unpin = false;
      root.querySelectorAll('[data-st]').forEach(function (b) {
        b.onclick = function () {
          chosen = b.dataset.st;
          root.querySelectorAll('[data-st]').forEach(function (x) { x.classList.toggle('on', x === b); });
          root.querySelector('#pfield').style.display = chosen === 'doing' ? '' : 'none';
        };
      });
      root.querySelectorAll('[data-day]').forEach(function (b) {
        b.onclick = function () { day = day === b.dataset.day ? null : b.dataset.day; unpin = !day; root.querySelectorAll('[data-day]').forEach(function (x) { x.classList.toggle('on', x.dataset.day === day); }); };
      });
      var up = root.querySelector('[data-x="unpin"]'); if (up) up.onclick = function (e) { e.preventDefault(); unpin = true; day = null; root.querySelectorAll('[data-day]').forEach(function (x) { x.classList.remove('on'); }); };
      var pr = root.querySelector('#prange'); pr.oninput = function () { root.querySelector('#pval').textContent = pr.value; };
      root.querySelector('[data-x="close"]').onclick = closeSheet;
      var rm = root.querySelector('[data-x="remove"]'); if (rm) rm.onclick = function () { closeSheet(); removeTask(id); };
      var rs = root.querySelector('[data-x="restore"]'); if (rs) rs.onclick = function () { closeSheet(); restoreTask(id); };
      var del = root.querySelector('[data-x="del"]');
      if (del) del.onclick = function () { S.updateState(function (st) { st.custom = (st.custom || []).filter(function (c) { return c.id !== id; }); delete st.acts[id]; if (st.pins) delete st.pins[id]; }); closeSheet(); rerender(); toast('Activité supprimée'); };
      root.querySelector('[data-x="save"]').onclick = function () {
        var mins = +root.querySelector('#fmins').value, due = root.querySelector('#fdue').value || null;
        S.updateState(function (st) {
          st.overrides = st.overrides || {};
          var o = st.overrides[id] || {};
          if (mins && mins !== a.mins) o.mins = mins;
          if ((due || null) !== (a.due || null)) o.due = due;
          if (Object.keys(o).length) st.overrides[id] = o;
          if (a.custom) (st.custom || []).forEach(function (c) { if (c.id === id) { c.mins = mins || c.mins; c.due = due; c.dueSrc = due ? 'Ajoutée par toi' : null; } });
          st.pins = st.pins || {};
          if (day) st.pins[id] = day; else if (unpin) delete st.pins[id];
        });
        if (chosen !== stOf(id).s || chosen === 'doing') S.setActivity(id, chosen, chosen === 'doing' ? +pr.value : null);
        closeSheet(); rerender(); toast(day && day !== pinned ? 'Placé ' + E.niceDay(day, today) + ' · le reste s’est réorganisé' : 'Enregistré · planning recalculé');
      };
    });
  }

  function openDayAdd(date) {
    var cands = E.activities(C, state, settings).filter(function (a) {
      var c = E.classify(a, state, today);
      return (c === 'behind' || c === 'current' || c === 'upcoming' || c === 'future' || c === 'open') && !(state.pins || {})[a.id];
    }).sort(function (x, y) { return x.seq - y.seq; });
    var subs = C.subjects.filter(function (s) { return !s.noSyllabus; });
    var h = '<div class="s-title">' + (date === today ? 'Aujourd’hui' : longDate(date)) + '</div><div class="s-sub">Ajoute une tâche à toi, ou choisis une étape du programme à faire ce jour-là.</div>' +
      '<div class="grp-h" style="margin-top:4px;">Une tâche à moi</div>' +
      '<div class="field" style="margin-top:0;"><input class="inp" id="xtitle" placeholder="ex. Relire mes notes de micro au café"></div>' +
      '<div style="display:flex;gap:8px;margin-top:8px;"><input class="inp" id="xmins" type="number" min="5" step="5" value="30" style="width:90px;"><select class="inp" id="xsub" style="flex:1;"><option value="">Sans matière</option>' + C.subjects.map(function (s) { return '<option value="' + s.id + '">' + esc(s.short) + '</option>'; }).join('') + '</select><button class="btn" data-x="addx">Ajouter</button></div>' +
      '<div class="grp-h">Une étape du programme</div><select class="inp" id="psub" style="width:100%;">' + subs.map(function (s) { return '<option value="' + s.id + '">' + esc(s.short) + '</option>'; }).join('') + '</select><div class="pick-list" id="plist"></div>' +
      '<div class="sheet-actions"><button class="btn soft" data-x="close">Fermer</button></div>';
    sheet(h, function (root) {
      function fill() {
        var sid = root.querySelector('#psub').value, s = subj(sid);
        var l = cands.filter(function (a) { return a.subject === sid; }).slice(0, 40);
        root.querySelector('#plist').innerHTML = l.length ? l.map(function (a) { return '<button data-pick="' + esc(a.id) + '" style="' + vars(s) + '">' + ART.icon(a.type, s.color, 18) + '<span><b>S' + a.week + '</b> · ' + esc(a.title) + ' <span style="color:var(--ink-3)">· ' + hm(a.mins) + '</span></span></button>'; }).join('') : '<div class="empty">Rien à placer pour cette matière.</div>';
        root.querySelectorAll('[data-pick]').forEach(function (b) {
          b.onclick = function () { var id = b.dataset.pick; S.updateState(function (st) { st.pins = st.pins || {}; st.pins[id] = date; }); closeSheet(); rerender(); toast('Placé ' + E.niceDay(date, today) + ' · le reste s’est réorganisé'); };
        });
      }
      root.querySelector('#psub').onchange = fill; fill();
      root.querySelector('[data-x="close"]').onclick = closeSheet;
      root.querySelector('[data-x="addx"]').onclick = function () {
        var t = root.querySelector('#xtitle').value.trim();
        if (!t) { root.querySelector('#xtitle').focus(); return; }
        S.updateState(function (st) { st.extras = st.extras || []; st.extras.push({ id: 'x-' + Date.now().toString(36), date: date, title: t, mins: +root.querySelector('#xmins').value || 30, subject: root.querySelector('#xsub').value || null, done: false }); });
        closeSheet(); rerender(); toast('Ajouté ' + E.niceDay(date, today));
      };
    });
  }

  function openAdd(sid, n) {
    var s = subj(sid);
    var h = '<div class="s-title">Nouvelle activité</div><div class="s-sub">' + esc(s.short) + ' · semaine ' + n + ' : un devoir ou un contenu publié en cours de semestre.</div>' +
      '<div class="field"><label>Intitulé</label><input class="inp" id="atitle" placeholder="ex. Problem set 3"></div>' +
      '<div class="field"><label>Type</label><select class="inp" id="atype">' + ['practice', 'reading', 'test', 'project', 'revision', 'video', 'write'].map(function (t) { return '<option value="' + t + '">' + TYPE[t] + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>Durée estimée (minutes)</label><input class="inp" id="amins" type="number" value="30" min="5" step="5"></div>' +
      '<div class="field"><label>Échéance (si le prof en a donné une)</label><input class="inp" id="adue" type="date"></div>' +
      '<div class="sheet-actions"><button class="btn soft" data-x="close">Annuler</button><button class="btn" data-x="save">Ajouter</button></div>';
    sheet(h, function (root) {
      root.querySelector('[data-x="close"]').onclick = closeSheet;
      root.querySelector('[data-x="save"]').onclick = function () {
        var title = root.querySelector('#atitle').value.trim();
        if (!title) { root.querySelector('#atitle').focus(); return; }
        var due = root.querySelector('#adue').value || null;
        S.updateState(function (st) {
          st.custom = st.custom || [];
          st.custom.push({ id: 'custom-' + sid + '-' + Date.now().toString(36), subject: sid, week: n, type: root.querySelector('#atype').value, title: title, mins: +root.querySelector('#amins').value || 30, due: due, dueSrc: due ? 'Ajoutée par toi' : null, syllabus: true });
        });
        closeSheet(); rerender(); toast('Ajoutée et placée dans le planning');
      };
    });
  }

  function openHelper() {
    var it = plan.days[0].items.filter(function (i) { return act(i.id) && stOf(i.id).s !== 'done' && !i.inClass; })[0];
    if (!it) return;
    var a = act(it.id), s = subj(a.subject), left = 5 * 60, running = false;
    var row = document.getElementById('t-' + a.id);
    if (row) { row.classList.add('highlight'); row.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    var h = '<div class="timer"><div class="s-sub" style="margin:0;">Ta prochaine étape</div><div class="s-title">' + esc(a.title) + '</div>' +
      '<div class="s-sub">' + esc(s.short) + (a.week ? ' · semaine ' + a.week : '') + ' · ' + hm(it.mins) + ' · +' + money(E.reward(a)) + '</div>' +
      '<div class="t-big" id="tclock">5:00</div><p>Juste 5 minutes pour démarrer. Après, tu continues si ça roule, ou tu t’arrêtes : c’est déjà gagné.</p>' +
      '<div class="sheet-actions" style="justify-content:center;"><button class="btn soft" data-x="close">Plus tard</button><button class="btn soft" data-x="go">C’est parti</button><button class="btn" data-x="done">J’ai fini</button></div></div>';
    sheet(h, function (root) {
      var clock = root.querySelector('#tclock');
      root.querySelector('[data-x="close"]').onclick = closeSheet;
      root.querySelector('[data-x="go"]').onclick = function () {
        var b = this; running = !running; b.textContent = running ? 'Pause' : 'Reprendre';
        if (running) timer.int = setInterval(function () {
          left = Math.max(0, left - 1);
          clock.textContent = Math.floor(left / 60) + ':' + pad(left % 60);
          if (!left) { clearInterval(timer.int); timer.int = null; clock.textContent = '5 min ✿'; }
        }, 1000);
        else { clearInterval(timer.int); timer.int = null; }
      };
      root.querySelector('[data-x="done"]').onclick = function () { closeSheet(); S.setActivity(a.id, 'done'); rerender(); toast('Bravo ! +' + money(E.reward(a)) + ' dans ta tirelire'); };
    });
  }

  // ---------------------------------------------------------------- Supprimer une tâche (« je ne la fais pas »)
  function removeTask(id) {
    var a = act(id);
    S.updateState(function (st) { st.removed = st.removed || {}; st.removed[id] = new Date().toISOString(); if (st.pins) delete st.pins[id]; });
    rerender();
    toast('« ' + (a ? a.title.slice(0, 40) : 'Tâche') + ' » supprimée · le planning s’est réorganisé', function () { restoreTask(id, true); });
  }
  function restoreTask(id, quiet) {
    S.updateState(function (st) { if (st.removed) delete st.removed[id]; });
    rerender();
    if (!quiet) toast('Remise dans ton planning');
  }

  // ---------------------------------------------------------------- Récompenses de niveau
  function checkRewards() {
    if (document.getElementById('sheet')) return;
    var w = E.wallet(C, state, settings), list = E.newRewards(state, w);
    S.updateState(function (st) { st.rewards = st.rewards || { seen: 0, taken: {}, custom: {} }; if ((st.rewards.seen || 0) < w.level) st.rewards.seen = w.level; });
    if (!list.length) return;
    state = S.getState();
    var last = list[list.length - 1];
    var h = '<div class="celebrate">' + ART.piggyBank(120) + '<div class="s-title">Niveau ' + (last.level + 1) + ' atteint !</div>' +
      '<div class="s-sub">Tu es maintenant « ' + esc(last.name) + ' ». Tu as gagné le droit de t’offrir une récompense, pour de vrai :</div>' +
      list.map(function (r) { return '<div class="rw big"><span class="rw-txt">' + esc(r.text) + '</span><span class="rw-budget">Budget : ' + r.budget + ' €</span><small>' + esc(r.name) + ' · ' + money(r.at) + '</small></div>'; }).join('') +
      '<div class="sheet-actions" style="justify-content:center;"><button class="btn soft" data-x="close">Plus tard</button><button class="btn" data-x="take">Je me l’offre maintenant</button></div>' +
      '<p class="soft-note" style="text-align:center;margin-top:10px;">« Plus tard » : elle t’attend dans ta tirelire.</p></div>';
    sheet(h, function (root) {
      petals(root.querySelector('.piggy'));
      root.querySelector('[data-x="close"]').onclick = closeSheet;
      root.querySelector('[data-x="take"]').onclick = function () {
        S.updateState(function (st) { list.forEach(function (r) { st.rewards.taken[r.level] = today; }); });
        closeSheet(); rerender(); toast('Profite bien, tu l’as mérité ✿');
      };
    });
  }
  function openRewardEdit(i) {
    var rw = E.levelReward(state, i);
    var h = '<div class="s-title">Ma récompense</div><div class="s-sub">Niveau « ' + esc(rw.name) + ' » · ' + money(rw.at) + '</div>' +
      '<div class="field"><label>Ce que je m’offre</label><input class="inp" id="rwtext" value="' + esc(rw.text) + '"></div>' +
      '<div class="field"><label>Budget (en euros)</label><input class="inp" id="rwbudget" type="number" min="0" step="1" value="' + rw.budget + '"></div>' +
      '<div class="sheet-actions"><button class="btn soft" data-x="close">Annuler</button><button class="btn" data-x="save">Enregistrer</button></div>';
    sheet(h, function (root) {
      root.querySelector('[data-x="close"]').onclick = closeSheet;
      root.querySelector('[data-x="save"]').onclick = function () {
        var t = root.querySelector('#rwtext').value.trim(), b = +root.querySelector('#rwbudget').value;
        S.updateState(function (st) { st.rewards = st.rewards || { seen: 0, taken: {}, custom: {} }; st.rewards.custom = st.rewards.custom || {}; st.rewards.custom[i] = { text: t || null, budget: isNaN(b) ? null : b }; });
        closeSheet(); rerender(); toast('Récompense enregistrée');
      };
    });
  }

  // ---------------------------------------------------------------- Le chemin qui serpente
  // Les pierres alternent à gauche et à droite ; on trace une route pavée qui ondule de l'une à l'autre.
  var trailObs = null;
  function drawTrails() {
    if (trailObs) { trailObs.disconnect(); trailObs = null; }
    var trails = document.querySelectorAll('.trail.snake');
    function draw(tr) {
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
      var svgEl = '<svg class="road" width="' + box.width + '" height="' + (box.height + 40) + '" aria-hidden="true">' +
        '<path d="' + d + '" stroke="#F4DCE3" stroke-width="20" fill="none" stroke-linecap="round"/>' +
        '<path d="' + d + '" stroke="#A7B8CE" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="0.1 12"/>' +
        '<path d="' + d + '" stroke="#C9D5E3" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-dasharray="0.1 12" stroke-dashoffset="-6"/>' + deco + '</svg>';
      tr.insertAdjacentHTML('afterbegin', svgEl);
    }
    trails.forEach(draw);
    if (trails.length && window.ResizeObserver) {
      var lastW = {};
      trailObs = new ResizeObserver(function (entries) {
        entries.forEach(function (en) { var w = Math.round(en.contentRect.width); if (lastW[w] && en.target.__w === w) return; en.target.__w = w; lastW[w] = 1; draw(en.target); });
      });
      trails.forEach(function (t) { trailObs.observe(t); });
    }
  }

  // ---------------------------------------------------------------- Rendu + événements
  function render() {
    var v = document.getElementById('view');
    var html = ui.view === 'today' ? viewToday() : ui.view === 'week' ? viewWeek() : ui.view === 'subjects' ? viewSubjects() : ui.view === 'progress' ? viewProgress() : viewSettings();
    v.innerHTML = '<div class="view">' + html + '</div>';
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('on', t.dataset.view === ui.view); });
    drawTrails();
  }
  function rerender() { load(); render(); checkRewards(); }
  function go(view) { ui.view = view; if (view !== 'subjects') ui.subject = null; render(); window.scrollTo(0, 0); try { localStorage.setItem('school_ui_view', view); } catch (e) {} }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-a], .tab');
    if (!t) return;
    if (t.classList.contains('tab')) { go(t.dataset.view); return; }
    var a = t.dataset.a, id = t.dataset.id;
    if (t.tagName === 'A') e.preventDefault();
    switch (a) {
      case 'go': go(t.dataset.view); break;
      case 'toggle': {
        var cur = stOf(id).s, x = act(id);
        if (cur === 'done') S.setActivity(id, 'todo');
        else { S.setActivity(id, 'done'); petals(t); }
        setTimeout(rerender, cur === 'done' ? 0 : 300);
        if (cur !== 'done' && x) toast('+' + money(E.reward(x)) + ' dans ta tirelire');
        break;
      }
      case 'open': openActivity(id); break;
      case 'set': S.setActivity(id, t.dataset.s); rerender(); break;
      case 'dismiss': S.updateState(function (st) { st.dismissed = st.dismissed || {}; st.dismissed[id] = true; }); rerender(); break;
      case 'routine': {
        var done = ((state.routineLog || {})[today] || {})[t.dataset.r];
        S.toggleRoutine(today, t.dataset.r);
        if (!done) petals(t);
        setTimeout(rerender, done ? 0 : 280);
        break;
      }
      case 'routine-link': {
        var log = ((state.routineLog || {})[today] || {});
        if (log[t.dataset.r]) S.toggleRoutine(today, t.dataset.r);
        S.toggleRoutine(today, t.dataset.r, id);
        S.setActivity(id, 'done');
        rerender(); toast('Routine fleurie et étape cochée');
        break;
      }
      case 'extra-toggle': {
        var wasDone = false;
        S.updateState(function (st) { (st.extras || []).forEach(function (x) { if (x.id === id) { wasDone = x.done; x.done = !x.done; } }); });
        if (!wasDone) petals(t);
        setTimeout(rerender, wasDone ? 0 : 280);
        break;
      }
      case 'extra-del': {
        var gone = null;
        S.updateState(function (st) { st.extras = (st.extras || []).filter(function (x) { if (x.id === id) gone = x; return x.id !== id; }); });
        rerender();
        if (gone) toast('« ' + gone.title.slice(0, 40) + ' » supprimée', function () { S.updateState(function (st) { st.extras = st.extras || []; st.extras.push(gone); }); rerender(); });
        break;
      }
      case 'remove': removeTask(id); break;
      case 'restore': restoreTask(id); break;
      case 'reward-take': S.updateState(function (st) { st.rewards = st.rewards || { seen: 0, taken: {}, custom: {} }; st.rewards.taken = st.rewards.taken || {}; st.rewards.taken[t.dataset.l] = today; }); rerender(); toast('Profite bien, tu l’as mérité ✿'); break;
      case 'reward-edit': openRewardEdit(+t.dataset.l); break;
      case 'day-add': openDayAdd(t.dataset.date); break;
      case 'helper': openHelper(); break;
      case 'wpage': ui.weekPage = Math.max(0, Math.min(1, ui.weekPage + +t.dataset.d)); render(); break;
      case 'subject': ui.subject = id || null; ui.week = null; ui.view = 'subjects'; render(); window.scrollTo(0, 0); break;
      case 'week': ui.week = +t.dataset.n; render(); break;
      case 'assessed': S.updateState(function (st) { st.assessed = st.assessed || {}; if (st.assessed[id]) delete st.assessed[id]; else st.assessed[id] = true; }); rerender(); break;
      case 'mastery': S.updateState(function (st) { st.mastery = st.mastery || {}; if (st.mastery[t.dataset.k] === +t.dataset.v) delete st.mastery[t.dataset.k]; else st.mastery[t.dataset.k] = +t.dataset.v; }); rerender(); break;
      case 'weekall': {
        var n = +t.dataset.n, before = JSON.parse(JSON.stringify(S.getState()));
        var ids = E.activities(C, state, settings).filter(function (x) { return x.subject === id && x.week === n && !x.optional; }).map(function (x) { return x.id; });
        S.setMany(ids, 'done'); rerender();
        toast('Semaine ' + n + ' cochée', function () { S.saveState(before); rerender(); });
        break;
      }
      case 'add': openAdd(id, +t.dataset.n); break;
      case 'tt-add': S.updateSettings(function (s) { s.timetable.push({ id: 'tt-' + Date.now().toString(36), subject: 'EC11', kind: t.dataset.k, day: 3, start: '', end: '' }); }); rerender(); break;
      case 'tt-del': S.updateSettings(function (s) { s.timetable.splice(+t.dataset.i, 1); }); rerender(); break;
      case 'routine-off': S.updateSettings(function (s) { s.routinesOff = s.routinesOff || {}; if (s.routinesOff[t.dataset.r]) delete s.routinesOff[t.dataset.r]; else s.routinesOff[t.dataset.r] = true; }); rerender(); break;
      case 'replan': S.recompute({ reset: true }); rerender(); toast('Planning recalculé depuis zéro'); break;
      case 'reset':
        if (window.confirm('Tout décocher ? Ta progression, tes ajouts et tes routines cochées repartent à zéro. Tes réglages sont gardés.')) {
          var keep = S.getState();
          S.saveState({ v: 1, acts: {}, mastery: {}, assessed: {}, custom: keep.custom || [], overrides: keep.overrides || {}, routineLog: {}, pins: {}, extras: [], removed: {}, rewards: { seen: 0, taken: {}, custom: (keep.rewards || {}).custom || {} } });
          S.recompute({ reset: true }); rerender(); toast('Tout est vide : à toi de cocher');
        }
        break;
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSheet();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('map-place')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
  document.addEventListener('change', function (e) {
    var t = e.target, k = t.dataset && t.dataset.set; if (!k) return;
    S.updateSettings(function (s) {
      if (k === 'capacity') s.capacity[t.dataset.d] = Math.max(0, +t.value || 0);
      if (k === 'share') s.catchupShare = (+t.value) / 100;
      if (k === 'exam') { s.exams = s.exams || {}; if (t.value) s.exams[t.dataset.id] = t.value; else delete s.exams[t.dataset.id]; }
      if (k === 'tt') { var row = s.timetable[+t.dataset.i]; row[t.dataset.f] = t.dataset.f === 'day' ? +t.value : t.value; }
    });
    rerender(); toast('Réglage enregistré · planning recalculé');
  });

  // Habillage : grain de papier, icônes dessinées des onglets et du titre.
  document.documentElement.style.setProperty('--grain', ART.GRAIN);
  document.documentElement.style.setProperty('--grass', ART.GRASS);
  document.body.style.backgroundImage = ART.GRAIN;
  document.querySelectorAll('.tab').forEach(function (t) { t.insertAdjacentHTML('afterbegin', ART.icon(t.dataset.ico, null, 20)); });
  var brand = document.getElementById('brand-art');
  if (brand) brand.innerHTML = ART.brandMark();

  try { var v = localStorage.getItem('school_ui_view'); if (v) ui.view = v; } catch (e) {}
  if (/[?&]view=(\w+)/.test(location.search)) ui.view = RegExp.$1;
  rerender();
})();
