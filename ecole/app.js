// École OS — interface. Lit le curriculum, la progression et le planning via SchoolStore /
// SchoolEngine ; ne contient aucune règle de planification.
(function () {
  'use strict';
  var S = window.SchoolStore, E = window.SchoolEngine, C = window.SCHOOL_CURRICULUM;
  var ui = { view: 'today', subject: null, week: null, weekPage: 0 };
  var plan, today, state, settings;

  var TYPE = {
    video: ['▶︎', 'Vidéo'], reading: ['📖', 'Lecture'], notes: ['✍️', 'Notes'], class: ['🏫', 'Cours'],
    exercise: ['✏️', 'Exercices'], quiz: ['✅', 'Test en ligne'], assignment: ['🧮', 'Devoir'], project: ['👥', 'Projet'],
    prep: ['💬', 'Prépa séminaire'], revision: ['🔁', 'Révision']
  };
  var TYPE_ORDER = ['video', 'reading', 'notes', 'prep', 'exercise', 'quiz', 'assignment', 'project', 'revision', 'class'];
  var KIND = { deadline: 'Échéance', current: 'Cours actuel', catchup: 'Rattrapage', seminar: 'Pendant le séminaire', optional: 'Facultatif' };
  var MASTERY = ['Pas encore vu', 'Découvert 🌱', 'Compris 🌿', 'Maîtrisé 🌸'];
  var DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  var WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

  // ---------------------------------------------------------------- utilitaires
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function subj(id) { return E.subjectById(C, id) || { id: id, short: id, color: '#FF4F9A', soft: '#FFE1EE', emoji: '✦' }; }
  function hm(mins) { mins = Math.round(mins || 0); if (mins < 60) return mins + ' min'; var h = Math.floor(mins / 60), m = mins % 60; return h + ' h' + (m ? ' ' + (m < 10 ? '0' : '') + m : ''); }
  function shortDate(s) { var d = E.parseDay(s); return d.getDate() + ' ' + ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'][d.getMonth()]; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function darker(hex) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r * 0.62 + 60 * 0.38); g = Math.round(g * 0.5); b = Math.round(b * 0.7 + 120 * 0.3);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function act(id) { return plan.acts[id]; }
  function stOf(id) { return (state.acts || {})[id] || { s: 'todo' }; }
  function load() { today = S.today(); plan = S.recompute(); state = S.getState(); settings = S.getSettings(); }
  function toast(msg, undo) {
    var old = document.querySelector('.toast'); if (old) old.remove();
    var t = document.createElement('div'); t.className = 'toast';
    t.innerHTML = esc(msg) + (undo ? ' &nbsp;<button style="color:#FF8CC0;font-weight:700;">Annuler</button>' : '');
    document.body.appendChild(t);
    if (undo) t.querySelector('button').onclick = function () { undo(); t.remove(); };
    setTimeout(function () { t.remove(); }, undo ? 6000 : 2600);
  }
  function burst(el) {
    var r = el.getBoundingClientRect(), chars = ['✦', '★', '♥', '✧', '✿'];
    for (var i = 0; i < 9; i++) {
      var b = document.createElement('span'); b.className = 'burst';
      b.textContent = chars[i % chars.length];
      b.style.left = (r.left + r.width / 2 - 8) + 'px'; b.style.top = (r.top + r.height / 2 - 10) + 'px';
      var ang = (Math.PI * 2 * i) / 9;
      b.style.setProperty('--dx', Math.round(Math.cos(ang) * 46) + 'px'); b.style.setProperty('--dy', Math.round(Math.sin(ang) * 46) + 'px');
      b.style.color = ['#FF4F9A', '#B99CF5', '#FF9B45', '#2FCB6E', '#7CC2F7'][i % 5];
      document.body.appendChild(b);
      setTimeout(function (x) { return function () { x.remove(); }; }(b), 950);
    }
  }
  var CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ---------------------------------------------------------------- briques
  function checkBtn(a) {
    var st = stOf(a.id), cls = 'check', style = '';
    if (st.s === 'done') cls += ' on';
    else if (st.s === 'doing') { cls += ' half'; style = '--p:' + (st.p || 0) + '%;'; }
    else if (st.s === 'blocked' || (a.blocked && st.s === 'todo')) cls += ' blocked';
    return '<button class="' + cls + '" style="' + style + '" data-a="toggle" data-id="' + esc(a.id) + '" aria-label="Cocher">' + CHECK_SVG + '</button>';
  }
  function metaPills(a, it, opts) {
    opts = opts || {};
    var s = subj(a.subject), t = TYPE[a.type] || ['•', a.type], out = [];
    if (!opts.noSubject) out.push('<span class="pill subj" style="--c:' + s.color + ';--cs:' + s.soft + '">' + s.emoji + ' ' + esc(s.short) + (a.week != null && a.week > 0 && a.week < 12 ? ' · S' + a.week : '') + '</span>');
    out.push('<span class="pill">' + t[0] + ' ' + t[1] + '</span>');
    var st = stOf(a.id);
    if (a.type !== 'class') out.push('<span class="pill">⏱ ' + hm(st.s === 'done' ? a.mins : E.remainingMins(a, state)) + (st.s === 'doing' ? ' restantes' : '') + '</span>');
    if (it) out.push('<span class="pill k-' + it.kind + '">' + KIND[it.kind] + '</span>');
    if (a.due && st.s !== 'done') out.push('<span class="pill k-deadline">📌 ' + (a.due < today ? 'échéance passée' : 'avant ' + E.niceDay(a.due, today)) + '</span>');
    if (st.s === 'doing') out.push('<span class="pill">En cours · ' + (st.p || 0) + ' %</span>');
    if (st.s === 'blocked' || (a.blocked && st.s === 'todo')) out.push('<span class="pill">⏳ ' + esc(a.blocked || 'Pas encore disponible') + '</span>');
    else if (a.release && a.release > today && st.s !== 'done') out.push('<span class="pill">Dispo ~ ' + shortDate(a.release) + '</span>');
    if (a.custom) out.push('<span class="pill">Ajoutée par toi</span>');
    return out.join('');
  }
  function taskRow(a, it, opts) {
    opts = opts || {};
    var s = subj(a.subject), st = stOf(a.id);
    return '<div class="task' + (st.s === 'done' ? ' done' : '') + '" id="t-' + esc(a.id) + '" style="--c:' + s.color + ';--cs:' + s.soft + '">' +
      checkBtn(a) +
      '<div class="t-main"><div class="t-title">' + esc(a.title) + '</div>' +
      '<div class="t-meta">' + metaPills(a, it, opts) + '</div>' +
      (it && it.reason ? '<details class="why"><summary>Pourquoi ' + (opts.dayLabel || 'aujourd’hui') + ' ?</summary><p>' + esc(it.reason) + (it.tier ? ' · priorité « ' + E.TIER_LABEL[it.tier] + ' »' : '') + '</p></details>' : '') +
      (a.questions ? '<details class="why"><summary>Les questions du séminaire</summary><p>' + a.questions.map(function (q, i) { return (i + 1) + '. ' + esc(q); }).join('<br>') + '</p></details>' : '') +
      '</div><button class="more" data-a="open" data-id="' + esc(a.id) + '" aria-label="Détails">⋯</button></div>';
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

  function viewToday() {
    var day = plan.days[0];
    var items = day.items.filter(function (it) { return act(it.id); });
    var doneIds = doneTodayIds();
    var studyLeft = items.reduce(function (s, it) { return s + (it.inClass ? 0 : it.mins); }, 0);
    var rlog = (state.routineLog || {})[today] || {};
    var rTodo = day.routines.filter(function (r) { return r.kind !== 'class' && !r.optional; });
    var rDone = rTodo.filter(function (r) { return rlog[r.id]; }).length;
    var total = items.length + doneIds.length + rTodo.length, doneN = doneIds.length + rDone;
    var pct = total ? Math.round(100 * doneN / total) : 0;
    var d = E.parseDay(today);
    var h = '';

    h += '<section class="compowder">' +
      '<span class="sparkle" style="top:14px;right:22px;">✦</span><span class="sparkle" style="top:46px;right:64px;animation-delay:.8s">✧</span><span class="sparkle" style="bottom:20px;right:30px;animation-delay:1.4s">★</span>' +
      '<div class="cp-row"><div class="gem' + (items.length ? ' pulse' : '') + '">' + items.length + '</div><div>' +
      '<div class="cp-kicker">Mission du jour' + (day.inBreak ? ' · semaine sans cours' : (day.academicWeek ? ' · semaine ' + day.academicWeek : '')) + '</div>' +
      '<div class="cp-date">' + DAYS[d.getDay()] + ' ' + shortDate(today) + '</div>' +
      '<div class="cp-sub">' + (items.length ? items.length + ' mission' + (items.length > 1 ? 's' : '') + ' d’école · ' + hm(studyLeft) + ' + ' + hm(day.routineMins) + ' de routines' : 'Rien d’autre à faire pour l’école aujourd’hui ✨') + '</div>' +
      '</div></div>' +
      '<div class="cp-bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="cp-actions">' + (items.length ? '<button class="btn-pop" data-a="helper">🎯 Je ne sais pas par où commencer</button>' : '') +
      '<button class="btn-ghost-w" data-a="go" data-view="week">Voir ma semaine →</button></div></section>';

    var as = assessedCount();
    if (as.done < as.total) {
      h += '<div class="banner"><div class="b-ico">🗺</div><div class="b-txt"><b>Bilan initial : ' + as.done + '/' + as.total + ' matières faites</b>' +
        'Ouvre chaque matière, semaine par semaine, et coche ce que tu as déjà fait. Le planning se recalcule tout seul.</div>' +
        '<button class="btn-main pink" data-a="go" data-view="subjects">Commencer</button></div>';
    }

    h += '<div class="grid-2"><div>';
    h += '<div class="section-h"><h3>Missions d’école</h3><span class="aside">dans l’ordre conseillé</span></div>';
    if (items.length) h += items.map(function (it) { return taskRow(act(it.id), it); }).join('');
    else h += '<div class="card empty"><div class="big">🌸</div>Tout ce qui était prévu est fait. Repose-toi, ou avance une routine.</div>';

    day.seminars.forEach(function (sm) {
      var s = subj(sm.subject);
      h += '<div class="soft-note" style="margin-top:10px;">🎓 <b>Séminaire de ' + esc(s.short) + (sm.start ? ' · ' + esc(sm.start) : '') + '</b> — ' +
        (sm.activity && act(sm.activity) ? 'exercices de la semaine ' + sm.week + ' : « ' + esc(act(sm.activity).title) + ' ».' : '') + (sm.note ? ' ' + esc(sm.note) : '') + '</div>';
    });

    if (plan.conflicts.length) {
      h += '<div class="gentle" style="margin-top:14px;"><h4>💛 Petit embouteillage</h4><ul>' +
        plan.conflicts.map(function (c) { return '<li><span>' + esc(c.msg) + '</span></li>'; }).join('') + '</ul></div>';
    }
    h += '</div><div>';

    h += '<div class="section-h"><h3>Routines du jour</h3><span class="aside">' + rDone + '/' + rTodo.length + '</span></div><div class="routines">';
    day.routines.forEach(function (r) {
      var s = r.subject ? subj(r.subject) : null, done = !!rlog[r.id], sub = '';
      if (r.adaptive) {
        var nx = E.nextInSequence(C, state, settings, r.adaptive, today);
        if (nx) sub = 'Suggestion selon ta progression : ' + esc(nx.title) + ' (S' + nx.week + ')' +
          ' · <a href="#" class="btn-link" data-a="routine-link" data-r="' + r.id + '" data-id="' + esc(nx.id) + '">fait, ça compte aussi pour la checklist</a>';
      }
      if (r.id === 'ir-book') sub = 'Lectures « avant le cours » d’IR11 : Allison, Ambrose & Brinkley (coche-les dans IR quand c’est fini)';
      if (done && rlog[r.id].linked && act(rlog[r.id].linked)) sub = 'Compté aussi pour : ' + esc(act(rlog[r.id].linked).title);
      if (r.kind === 'class') {
        h += '<div class="routine cls"><span style="font-size:18px;">' + (s ? s.emoji : '🏫') + '</span><span class="r-title">' + esc(r.title) + '</span></div>';
        return;
      }
      h += '<div class="routine' + (done ? ' done' : '') + '" style="--c:' + (s ? s.color : '#B99CF5') + '">' +
        '<button class="check' + (done ? ' on' : '') + '" data-a="routine" data-r="' + r.id + '">' + CHECK_SVG + '</button>' +
        '<span class="r-title">' + esc(r.title) + (r.optional ? ' <em style="color:var(--ink-3);font-size:12px;">(si besoin)</em>' : '') + (sub ? '<span class="r-sub">' + sub + '</span>' : '') + '</span>' +
        '<span class="r-min">' + r.mins + ' min</span></div>';
    });
    h += '</div>';

    if (doneIds.length) {
      h += '<div class="section-h"><h3>Fait aujourd’hui ✓</h3><span class="aside">' + doneIds.length + '</span></div>';
      h += doneIds.map(function (id) { return taskRow(act(id)); }).join('');
    }

    var missed = plan.missed.filter(function (id) { return !(state.dismissed || {})[id]; });
    if (missed.length) {
      h += '<div class="gentle" style="margin-top:16px;"><h4>📌 Échéances déjà passées</h4><p>Ces tests ou devoirs avaient une date limite réelle. Si tu les as faits, coche-les ; sinon, laisse filer, ce n’est pas grave 💛</p><ul>' +
        missed.slice(0, 5).map(function (id) {
          var a = act(id), s = subj(a.subject);
          return '<li><span>' + s.emoji + ' ' + esc(s.short) + ' S' + a.week + ' — ' + esc(a.title) + '</span><span style="display:flex;gap:6px;flex-shrink:0;">' +
            '<button class="btn-soft" data-a="set" data-s="done" data-id="' + esc(id) + '">Fait ✓</button><button class="btn-soft" data-a="dismiss" data-id="' + esc(id) + '">Laisser</button></span></li>';
        }).join('') + '</ul>' + (missed.length > 5 ? '<p style="margin-top:8px;">… et ' + (missed.length - 5) + ' autres (voir Progrès).</p>' : '') + '</div>';
    }
    h += '</div></div>';
    return h;
  }

  // ---------------------------------------------------------------- Semaine
  function viewWeek() {
    var page = ui.weekPage, days = plan.days.slice(page * 7, page * 7 + 7);
    var total = days.reduce(function (s, d) { return s + d.load + d.routineMins; }, 0);
    var h = '<h2 class="title">Ma semaine</h2><div class="subtitle">Cours, rattrapage, routines et échéances : tout est réparti selon ta capacité de chaque jour.</div>';
    h += '<div class="week-nav"><button class="btn-soft" data-a="wpage" data-d="-1" ' + (page === 0 ? 'disabled style="opacity:.4"' : '') + '>← 7 jours</button>' +
      '<b style="font-size:14px;">' + shortDate(days[0].date) + ' → ' + shortDate(days[days.length - 1].date) + ' · ' + hm(total) + '</b>' +
      '<button class="btn-soft" data-a="wpage" data-d="1" ' + (page === 1 ? 'disabled style="opacity:.4"' : '') + '>7 jours →</button></div>';
    h += '<div class="week-days">';
    days.forEach(function (d) {
      var pct = d.studyCap ? Math.min(100, Math.round(100 * d.load / d.studyCap)) : 0;
      var dd = E.parseDay(d.date);
      h += '<div class="wday' + (d.date === today ? ' today' : '') + '">' +
        '<div class="wday-h"><b>' + DAYS[dd.getDay()] + '</b><span>' + shortDate(d.date) + '</span></div>' +
        (d.inBreak ? '<span class="w-break">pas de cours</span>' : (d.academicWeek ? '<span class="w-break" style="background:var(--blue-soft);color:#2A6FA8;">semaine ' + d.academicWeek + '</span>' : '')) +
        '<div class="lava' + (d.over ? ' over' : '') + '" title="' + d.load + ' / ' + d.studyCap + ' min d’étude"><i style="width:' + pct + '%"></i></div>' +
        '<div style="font-size:11.5px;color:var(--ink-3);margin:-4px 0 6px;">' + hm(d.load) + ' / ' + hm(d.studyCap) + ' d’étude</div>';
      if (!d.items.length) h += '<div style="font-size:12.5px;color:var(--ink-3);padding:4px 0;">Journée légère 🌿</div>';
      d.items.forEach(function (it) {
        var a = act(it.id); if (!a) return;
        var s = subj(a.subject), tag = it.kind === 'catchup' ? '<span class="wk catch">rattrapage</span>' : it.kind === 'deadline' ? '<span class="wk dead">échéance</span>' : it.kind === 'seminar' ? '<span class="wk sem">séminaire</span>' : '';
        h += '<div class="wtask' + (stOf(a.id).s === 'done' ? ' done' : '') + '" style="--c:' + s.color + '" data-a="open" data-id="' + esc(a.id) + '" role="button"><i></i><span><b>' + esc(s.short) + '</b> ' + esc(a.title.length > 60 ? a.title.slice(0, 58) + '…' : a.title) + ' <span style="color:var(--ink-3)">· ' + hm(it.mins) + '</span>' + tag + '</span></div>';
      });
      d.seminars.forEach(function (sm) { h += '<div class="wtask" style="--c:' + subj(sm.subject).color + '"><i></i><span>🎓 Séminaire ' + esc(subj(sm.subject).short) + '</span></div>'; });
      var rv = d.routines.filter(function (r) { return r.kind !== 'class'; });
      var cl = d.routines.filter(function (r) { return r.kind === 'class'; });
      h += '<div class="w-routines">🔁 ' + rv.length + ' routines · ' + hm(d.routineMins) + (cl.length ? '<br>🏫 ' + cl.map(function (r) { return esc(r.title.replace(/^Pendant.*/, 'Flashcards en cours')); }).join(', ') : '') + '</div>';
      h += '</div>';
    });
    h += '</div>';

    // Rattrapage non encore planifié
    var un = plan.unscheduled.filter(function (u) { return u.kind === 'behind' || u.kind === 'open'; });
    var bySub = {};
    un.forEach(function (u) { var a = act(u.id); (bySub[a.subject] = bySub[a.subject] || []).push(a); });
    h += '<div class="grid-2"><div><div class="section-h"><h3>Rattrapage pas encore placé</h3><span class="aside">' + un.length + ' activités · ' + hm(un.reduce(function (s, u) { return s + E.remainingMins(act(u.id), state); }, 0)) + '</span></div>';
    if (!un.length) h += '<div class="card empty"><div class="big">🎀</div>Tout ton rattrapage tient dans les 14 prochains jours.</div>';
    else {
      h += '<div class="card"><p class="soft-note" style="margin-bottom:10px;">Ce qui ne tient pas dans les 14 prochains jours sans surcharger tes journées. Je l’ajoute au planning au fur et à mesure que tu avances. Tu peux aussi augmenter ta capacité dans Réglages.</p>';
      Object.keys(bySub).forEach(function (sid) {
        var s = subj(sid), l = bySub[sid];
        h += '<div class="form-row"><label>' + s.emoji + ' <b>' + esc(s.short) + '</b><small>' + l.length + ' activités · à partir de « ' + esc(l[0].title.slice(0, 50)) + ' » (S' + l[0].week + ')</small></label><span class="r-min">' + hm(l.reduce(function (x, a) { return x + E.remainingMins(a, state); }, 0)) + '</span></div>';
      });
      h += '</div>';
    }
    h += '</div><div>' + assessmentsBlock() + '</div></div>';
    return h;
  }

  function assessmentsBlock() {
    var exams = C.assessments.map(function (x) { return { x: x, date: (settings.exams || {})[x.id] || null }; });
    var dated = exams.filter(function (e) { return e.date && e.date >= today; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var undated = exams.filter(function (e) { return !e.date; });
    var h = '<div class="section-h"><h3>Évaluations</h3><span class="aside">' + dated.length + ' datées</span></div><div class="card">';
    dated.forEach(function (e) {
      var s = subj(e.x.subject), n = E.diffDays(today, e.date);
      h += '<div class="form-row"><label>' + s.emoji + ' <b>' + esc(s.short) + '</b> · ' + esc(e.x.title) + '<small>' + E.niceDay(e.date, today) + ' · ' + e.x.weight + ' %</small></label><span class="pill k-deadline">J-' + n + '</span></div>';
    });
    if (undated.length) h += '<p class="soft-note" style="margin-top:8px;">' + undated.length + ' évaluations n’ont pas encore de date dans les syllabus (midterms, finals, présentations…). <a href="#" class="btn-link" data-a="go" data-view="settings">Ajoute-les dans Réglages</a> dès que tu les connais : je planifierai des révisions avant chacune.</p>';
    return h + '</div>';
  }

  // ---------------------------------------------------------------- Matières
  var MAP_POS = { MA11: [92, 112], EC11: [300, 96], MG11: [205, 196], IR11: [330, 250], SK11: [80, 262], LE11: [196, 318], ZH: [88, 392], IT: [312, 392] };
  function viewSubjects() {
    if (ui.subject) return subjectDetail(subj(ui.subject));
    var pr = E.progress(C, state, settings, today);
    var h = '<h2 class="title">Mon campus</h2><div class="subtitle">Touche un lieu pour ouvrir sa matière, puis coche semaine par semaine ce que tu as déjà fait.</div>';
    h += '<div class="grid-2"><div class="map-wrap"><svg viewBox="0 0 400 460" role="img" aria-label="Carte des matières">' +
      '<path d="M40 70 C 60 20, 170 30, 210 44 C 260 20, 360 20, 372 80 C 392 140, 360 170, 380 230 C 400 300, 372 340, 380 400 C 384 446, 300 450, 240 440 C 180 452, 90 456, 50 430 C 10 400, 30 330, 22 280 C 12 220, 40 180, 24 130 C 16 100, 26 84, 40 70 Z" fill="#FFF4E6" stroke="#F3D6C4" stroke-width="3"/>' +
      '<path d="M92 112 C 150 120, 170 170, 205 196 S 280 120, 300 96 M205 196 C 260 210, 300 230, 330 250 M205 196 C 150 220, 110 240, 80 262 M80 262 C 120 300, 160 310, 196 318 M196 318 C 250 330, 290 360, 312 392 M196 318 C 150 350, 110 370, 88 392" fill="none" stroke="#B7C7E6" stroke-width="9" stroke-linecap="round" stroke-dasharray="1 13"/>' +
      tree(150, 70) + tree(250, 150) + tree(360, 170) + tree(40, 190) + tree(140, 290) + tree(270, 290) + tree(205, 420) + tree(355, 320) + tree(44, 330) +
      '<text x="200" y="34" text-anchor="middle" class="map-title">✿ Campus B1 ✿</text>';
    C.subjects.forEach(function (s) {
      var p = MAP_POS[s.id], r = pr[s.id], pct = s.noSyllabus ? 0 : r.pct, circ = 2 * Math.PI * 30;
      h += '<g class="map-place" data-a="subject" data-id="' + s.id + '" role="button" tabindex="0">' +
        '<g class="mp-circle"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="34" fill="#fff" stroke="' + s.soft + '" stroke-width="2"/>' +
        '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="30" fill="none" stroke="' + s.soft + '" stroke-width="7"/>' +
        '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="30" fill="none" stroke="' + s.color + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + (circ * pct / 100).toFixed(1) + ' ' + circ.toFixed(1) + '" transform="rotate(-90 ' + p[0] + ' ' + p[1] + ')"/>' +
        '<text x="' + p[0] + '" y="' + (p[1] + 9) + '" text-anchor="middle" font-size="25">' + s.emoji + '</text></g>' +
        '<text x="' + p[0] + '" y="' + (p[1] + 52) + '" text-anchor="middle" class="map-label">' + esc(s.place) + (s.noSyllabus ? '' : ' · ' + pct + '%') + '</text></g>';
    });
    h += '</svg></div><div class="subj-list">';
    C.subjects.forEach(function (s) {
      var r = pr[s.id], assessed = (state.assessed || {})[s.id];
      var sub = s.noSyllabus ? 'Suivi par tes routines' : r.done + '/' + r.total + ' activités · ' + (r.behindMins ? hm(r.behindMins) + ' à rattraper' : 'rien à rattraper') + (assessed ? '' : ' · bilan à faire');
      h += '<button class="subj-card" style="--c:' + s.color + ';--cs:' + s.soft + ';--p:' + (s.noSyllabus ? 0 : r.pct) + '" data-a="subject" data-id="' + s.id + '">' +
        '<div class="ring"><span>' + s.emoji + '</span></div><div class="sc-main"><div class="sc-name">' + esc(s.short) + ' <span style="font-weight:500;color:var(--ink-3);font-size:12px;">' + (s.noSyllabus ? '' : s.id) + '</span></div><div class="sc-sub">' + sub + '</div></div>' +
        statusPill(s, r) + '</button>';
    });
    h += '</div></div>';
    return h;
  }
  function tree(x, y) { return '<g><rect x="' + (x - 2) + '" y="' + y + '" width="4" height="14" rx="2" fill="#B98A6A"/><circle cx="' + x + '" cy="' + (y - 4) + '" r="11" fill="#9ED8A0"/><circle cx="' + (x + 4) + '" cy="' + (y - 8) + '" r="2" fill="#F48FB1"/></g>'; }
  function statusPill(s, r) {
    var map = { 'on-track': 'Dans les temps', watch: 'Un peu de retard', attention: 'Besoin d’attention', routine: 'Routines' };
    // Tant que le bilan initial n'est pas fait, « en retard » ne veut rien dire : on ne juge pas.
    if (!s.noSyllabus && !(state.assessed || {})[s.id]) return '<span class="status routine">Bilan à faire</span>';
    return '<span class="status ' + r.status + '">' + map[r.status] + '</span>';
  }

  function defaultWeekFor(s) {
    var aw = E.academicWeekOf(C, today), cur = aw ? (aw.inBreak ? aw.n + 1 : aw.n) : 1;
    var first = null;
    s.weeks.forEach(function (w) {
      if (first !== null) return;
      var pending = w.activities.some(function (a) { return a.type !== 'class' && !a.optional && stOf(a.id).s !== 'done'; });
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
    var h = '<section class="subj-head" style="--c:' + s.color + ';--c2:' + darker(s.color) + '">' +
      '<button class="back" data-a="subject" data-id="">← Campus</button>' +
      '<h2>' + s.emoji + ' ' + esc(s.short) + '</h2><div class="code">' + (s.noSyllabus ? esc(s.name) : s.id + ' · ' + esc(s.name) + ' · ' + s.ects + ' ECTS') + '</div>';
    if (!s.noSyllabus) {
      h += '<div class="sh-stats"><div class="sh-stat"><b>' + pr.pct + ' %</b>du travail fait</div>' +
        '<div class="sh-stat"><b>' + (pr.behind ? hm(pr.behindMins) : '0') + '</b>à rattraper (' + pr.behind + ')</div>' +
        '<div class="sh-stat"><b>' + (next ? E.niceDay(next.due, today) : '—') + '</b>prochaine échéance</div></div>';
    }
    h += '</section>';
    h += '<p class="soft-note" style="margin-top:12px;">' + esc(s.prepNote) + (s.weeksEstimated ? ' Les semaines sont estimées (ordre du syllabus).' : '') + '</p>';

    if (s.noSyllabus) {
      h += '<div class="section-h"><h3>Tes routines pour cette matière</h3></div><div class="routines">';
      C.routines.filter(function (r) { return r.subject === s.id; }).forEach(function (r) {
        h += '<div class="routine' + (r.kind === 'class' ? ' cls' : '') + '"><span class="r-title">' + esc(r.title) + '<span class="r-sub">' + r.days.map(function (d) { return DAYS[d]; }).join(', ') + '</span></span><span class="r-min">' + (r.mins ? r.mins + ' min' : '') + '</span></div>';
      });
      return h + '</div><p class="soft-note" style="margin-top:12px;">Envoie-moi un syllabus ou un programme et je l’ajouterai ici, semaine par semaine.</p>';
    }

    var assessed = (state.assessed || {})[s.id];
    h += '<div class="card" style="margin-top:12px;display:flex;align-items:center;gap:12px;"><div style="flex:1;font-size:13.5px;"><b>Bilan initial</b><br><span style="color:var(--ink-2);">' +
      (assessed ? 'Fait ✓ Tu peux toujours corriger une case.' : 'Coche ce que tu as déjà fait dans chaque semaine, puis valide.') + '</span></div>' +
      '<button class="toggle' + (assessed ? ' on' : '') + '" data-a="assessed" data-id="' + s.id + '" aria-label="Bilan fait"></button></div>';

    h += '<div class="week-chips" style="--c:' + s.color + '">';
    s.weeks.forEach(function (w) {
      var list = w.activities.filter(function (a) { return a.type !== 'class' && !a.optional; });
      var full = list.length && list.every(function (a) { return stOf(a.id).s === 'done'; });
      var ws = E.weekStart(C, w.n);
      var lbl = w.n === 0 ? 'Avant' : (w.n === 12 ? 'Digital' : 'S' + w.n);
      var sm = w.n === 12 ? 'à ton rythme' : (w.n === 0 ? 'le cours' : (ws ? shortDate(ws) : ''));
      h += '<button class="wchip' + (w.n === ui.week ? ' on' : '') + (full ? ' full' : '') + (w.n === curN ? ' now' : '') + '" data-a="week" data-n="' + w.n + '">' + lbl + '<small>' + sm + '</small></button>';
    });
    h += '</div>';

    var wk = s.weeks.filter(function (w) { return w.n === ui.week; })[0];
    if (!wk) return h;
    var ws = E.weekStart(C, wk.n);
    var acts = plan ? E.activities(C, state, settings).filter(function (a) { return a.subject === s.id && a.week === wk.n; }) : [];
    h += '<div class="card week-card" style="margin-top:6px;--c:' + s.color + '">';
    h += '<h3>' + esc(wk.title) + '</h3><div class="wk-date">' + (wk.n === 0 ? 'Avant le 7 septembre' : wk.n === 12 ? 'Contenu en autonomie' : 'Semaine ' + wk.n + ' · du lundi ' + shortDate(ws) + (wk.n === curN ? ' · c’est la semaine en cours' : '')) + '</div>';
    (wk.flags || []).forEach(function (f) { h += '<div class="flag">⚠︎ ' + esc(f) + '</div>'; });
    if (wk.note) h += '<div class="flag" style="background:var(--lav-soft);color:var(--plum);">📌 ' + esc(wk.note) + '</div>';
    if (wk.topics && wk.topics.length) h += '<details style="margin-top:10px;"><summary class="btn-link" style="cursor:pointer;">Contenu de la semaine (' + wk.topics.length + ')</summary><ul class="topics">' + wk.topics.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></details>';
    if ((wk.refs && wk.refs.length) || (wk.refsText && wk.refsText.length)) {
      h += '<div class="refs">';
      (wk.refs || []).forEach(function (r) {
        var a = act(r.id), done = stOf(r.id).s === 'done';
        h += '<div class="ref">' + (done ? '✅' : '📖') + ' <span>' + esc(a ? a.title : r.id) + ' — <em>une seule lecture, déjà prévue en S' + r.week + '</em>' + (done ? ' (faite)' : '') + '</span></div>';
      });
      (wk.refsText || []).forEach(function (t) { h += '<div class="ref">📖 <span>' + esc(t) + '</span></div>'; });
      h += '</div>';
    }

    TYPE_ORDER.forEach(function (ty) {
      var list = acts.filter(function (a) { return a.type === ty; });
      if (!list.length) return;
      h += '<div class="grp-h">' + TYPE[ty][0] + ' ' + (ty === 'class' ? 'Présence' : TYPE[ty][1]) + (list.length > 1 ? ' · ' + list.filter(function (a) { return stOf(a.id).s === 'done'; }).length + '/' + list.length : '') + '</div>';
      h += list.map(function (a) { var it = plannedItem(a.id); return taskRow(a, it && it.item, { noSubject: true, dayLabel: it ? E.niceDay(it.date, today) : '' }); }).join('');
    });

    if (wk.n > 0 && wk.n < 12) {
      var mk = s.id + '-w' + pad(wk.n), mv = (state.mastery || {})[mk];
      h += '<div class="grp-h">🌸 Maîtrise ressentie</div><div style="font-size:12.5px;color:var(--ink-3);">Ton ressenti à toi : cocher les tâches ne remplit pas cette case.</div><div class="mastery">' +
        MASTERY.map(function (m, i) { return '<button class="' + (mv === i ? 'on' : '') + '" data-a="mastery" data-k="' + mk + '" data-v="' + i + '">' + m + '</button>'; }).join('') + '</div>';
    }
    h += '<div class="row-actions"><button class="btn-soft" data-a="weekall" data-id="' + s.id + '" data-n="' + wk.n + '">✓ Tout cocher (déjà fait)</button>' +
      '<button class="btn-soft" data-a="add" data-id="' + s.id + '" data-n="' + wk.n + '">＋ Ajouter une activité</button></div>';
    h += '</div>';
    return h;
  }
  function plannedItem(id) {
    for (var i = 0; i < plan.days.length; i++) {
      var d = plan.days[i];
      for (var j = 0; j < d.items.length; j++) if (d.items[j].id === id) return { date: d.date, item: d.items[j] };
    }
    return null;
  }

  // ---------------------------------------------------------------- Progrès
  function viewProgress() {
    var pr = E.progress(C, state, settings, today);
    var subs = C.subjects.filter(function (s) { return !s.noSyllabus; });
    var tot = 0, done = 0, behind = 0, behindN = 0, missedN = 0;
    subs.forEach(function (s) { var r = pr[s.id]; tot += r.totalMins; done += r.doneMins; behind += r.behindMins; behindN += r.behind; missedN += r.missed; });
    var catchCap = plan.days.reduce(function (x, d) { return x + d.items.filter(function (i) { return i.kind === 'catchup'; }).reduce(function (y, i) { return y + i.mins; }, 0); }, 0) / plan.days.length;
    var h = '<h2 class="title">Mes progrès</h2><div class="subtitle">Pondéré par la durée estimée de chaque activité : un gros chapitre compte plus qu’une vidéo de 9 min.</div>';
    if (!assessedCount().done) {
      h += '<div class="banner" style="margin-top:0;"><div class="b-ico">🗺</div><div class="b-txt"><b>Ton vrai retard n’est pas encore calculé</b>Tant que tu n’as pas coché ce que tu as déjà fait, tout apparaît « à faire ». Fais ton bilan initial matière par matière : les chiffres ci-dessous deviendront justes.</div><button class="btn-main pink" data-a="go" data-view="subjects">Faire le bilan</button></div>';
    }
    h += '<div class="card" style="margin-top:12px;"><div class="kv">' +
      '<div><b>' + (tot ? Math.round(100 * done / tot) : 0) + ' %</b>du semestre fait (' + hm(done) + ' / ' + hm(tot) + ')</div>' +
      '<div><b>' + hm(behind) + '</b>de rattrapage (' + behindN + ' activités)</div>' +
      '<div><b>' + (catchCap ? '≈ ' + Math.ceil(behind / catchCap) + ' jours' : '—') + '</b>pour tout rattraper au rythme actuel</div>' +
      '<div><b>' + missedN + '</b>échéances passées non cochées</div>' +
      '</div></div>';
    h += '<div class="section-h"><h3>Par matière</h3></div><div class="subj-list">';
    subs.forEach(function (s) {
      var r = pr[s.id];
      h += '<div class="card prog-card" style="--c:' + s.color + ';--cs:' + s.soft + ';--p:' + r.pct + '">' +
        '<div class="prog-top"><div class="ring"><span>' + r.pct + '%</span></div><div class="sc-main"><div class="sc-name">' + s.emoji + ' ' + esc(s.short) + '</div><div class="sc-sub">' + r.done + ' faites · ' + (r.total - r.done) + ' restantes</div></div>' + statusPill(s, r) + '</div>' +
        '<div class="two-bars"><div class="tb"><span>Prévu à date</span><span class="track"><i style="width:' + r.expectedPct + '%;background:var(--ink-3)"></i></span><span>' + r.expectedPct + '%</span></div>' +
        '<div class="tb"><span>Vraiment fait</span><span class="track"><i style="width:' + r.pct + '%;background:' + s.color + '"></i></span><span>' + r.pct + '%</span></div></div>';
      var ws = s.weeks.filter(function (w) { return w.n > 0 && w.n < 12; });
      h += '<div class="bars">' + ws.map(function (w) { var x = r.weeks[w.n] || { totalMins: 0, doneMins: 0 }; var p = x.totalMins ? Math.round(100 * x.doneMins / x.totalMins) : 0; return '<div title="S' + w.n + ' : ' + p + ' %"><i style="height:' + p + '%"></i></div>'; }).join('') + '</div>' +
        '<div class="bars-lbl">' + ws.map(function (w) { return '<span>' + w.n + '</span>'; }).join('') + '</div>';
      h += '<div class="kv"><div><b>' + (r.behind ? hm(r.behindMins) : '0') + '</b>à rattraper (' + r.behind + ')</div>' +
        '<div><b>' + (r.classesPast ? r.classesDone + '/' + r.classesPast : '—') + '</b>présence cochée</div>' +
        '<div><b>' + (r.mastery != null ? MASTERY[Math.round(r.mastery)].split(' ')[0] : '—') + '</b>maîtrise ressentie' + (r.masteryCount ? ' (' + r.masteryCount + ' sem.)' : '') + '</div>' +
        '<div><b>' + (r.upcoming[0] ? E.niceDay(r.upcoming[0].due, today) : '—') + '</b>' + (r.upcoming[0] ? esc(r.upcoming[0].title.slice(0, 34)) : 'pas d’échéance sous 14 j') + '</div></div>';
      h += '</div>';
    });
    h += '</div>';

    var missed = plan.missed;
    if (missed.length) {
      h += '<div class="section-h"><h3>Échéances passées</h3><span class="aside">coche si c’était fait</span></div><div class="card">' +
        missed.map(function (id) { var a = act(id), s = subj(a.subject); return '<div class="form-row"><label>' + s.emoji + ' ' + esc(s.short) + ' S' + a.week + ' — ' + esc(a.title) + '<small>Échéance ' + shortDate(a.due) + ((state.dismissed || {})[id] ? ' · laissée' : '') + '</small></label><button class="btn-soft" data-a="set" data-s="done" data-id="' + esc(id) + '">Fait ✓</button></div>'; }).join('') + '</div>';
    }

    var hist = S.getHistory().slice(-14).reverse();
    var EV = { done: 'Fait', todo: 'Décoché', doing: 'En cours', blocked: 'Pas dispo', missed: 'Prévu mais pas fait' };
    h += '<div class="section-h"><h3>Historique</h3><span class="aside">rien n’est jamais effacé</span></div><div class="card hist">' +
      (hist.length ? hist.map(function (e) { var a = act(e.id); return '<div><time>' + (e.date || E.dayStr(new Date(e.t))).slice(5).split('-').reverse().join('/') + '</time><span><b>' + EV[e.ev] + '</b> · ' + esc(a ? subj(a.subject).short + ' — ' + a.title : e.id) + '</span></div>'; }).join('') : '<div>Encore rien : coche ta première case ✦</div>') + '</div>';
    return h;
  }

  // ---------------------------------------------------------------- Réglages
  function viewSettings() {
    var h = '<h2 class="title">Réglages</h2><div class="subtitle">Ta capacité, ton emploi du temps et tes dates d’examens : le planning s’adapte immédiatement.</div>';
    h += '<div class="grid-2"><div>';
    h += '<div class="section-h"><h3>Temps de travail par jour</h3><span class="aside">routines comprises</span></div><div class="card">';
    WEEK_ORDER.forEach(function (d) {
      var rts = C.routines.filter(function (r) { return r.days.indexOf(d) !== -1 && !(settings.routinesOff || {})[r.id] && r.kind !== 'class' && !r.optional; });
      var rm = rts.reduce(function (s, r) { return s + r.mins; }, 0);
      h += '<div class="form-row"><label>' + DAYS[d] + '<small>dont ' + hm(rm) + ' de routines → ' + hm(Math.max(0, settings.capacity[d] - rm)) + ' pour les cours</small></label><input class="inp num" type="number" min="0" step="15" value="' + settings.capacity[d] + '" data-set="capacity" data-d="' + d + '"> <span class="r-min">min</span></div>';
    });
    h += '<div class="form-row"><label>Part max du rattrapage<small>les jours où il y a aussi des cours à préparer</small></label><input type="range" min="30" max="90" step="10" value="' + Math.round(settings.catchupShare * 100) + '" data-set="share" style="width:120px;"> <span class="r-min">' + Math.round(settings.catchupShare * 100) + ' %</span></div>';
    h += '</div>';

    h += '<div class="section-h"><h3>Emploi du temps</h3><span class="aside">jours de cours et séminaires</span></div><div class="card">';
    h += '<p class="soft-note">Ajoute tes <b>séminaires</b> : les exercices de la matière y seront placés automatiquement. Je n’ai mis que les cours que tu m’as indiqués, sans inventer d’horaires.</p>';
    (settings.timetable || []).forEach(function (t, i) {
      h += '<div class="tt-row"><select class="inp" data-set="tt" data-i="' + i + '" data-f="subject">' + C.subjects.map(function (s) { return '<option value="' + s.id + '"' + (s.id === t.subject ? ' selected' : '') + '>' + s.emoji + ' ' + esc(s.short) + '</option>'; }).join('') + '</select>' +
        '<select class="inp" data-set="tt" data-i="' + i + '" data-f="kind">' + [['followup', 'Cours / follow-up'], ['seminar', 'Séminaire'], ['language', 'Cours de langue'], ['workshop', 'Atelier']].map(function (k) { return '<option value="' + k[0] + '"' + (k[0] === t.kind ? ' selected' : '') + '>' + k[1] + '</option>'; }).join('') + '</select>' +
        '<select class="inp" data-set="tt" data-i="' + i + '" data-f="day">' + WEEK_ORDER.map(function (d) { return '<option value="' + d + '"' + (d === t.day ? ' selected' : '') + '>' + DAYS[d] + '</option>'; }).join('') + '</select>' +
        '<input class="inp" type="time" value="' + esc(t.start) + '" data-set="tt" data-i="' + i + '" data-f="start">' +
        '<input class="inp" type="time" value="' + esc(t.end) + '" data-set="tt" data-i="' + i + '" data-f="end">' +
        '<button class="btn-soft" data-a="tt-del" data-i="' + i + '">Retirer</button></div>';
    });
    h += '<div class="row-actions"><button class="btn-soft" data-a="tt-add" data-k="seminar">＋ Séminaire</button><button class="btn-soft" data-a="tt-add" data-k="followup">＋ Cours</button></div></div>';
    h += '</div><div>';

    h += '<div class="section-h"><h3>Dates d’évaluations</h3><span class="aside">absentes des syllabus</span></div><div class="card">';
    h += '<p class="soft-note">Dès qu’une date est saisie, je planifie des séances de révision juste avant (3 pour un midterm, 4 pour un final).</p>';
    C.assessments.forEach(function (x) {
      var s = subj(x.subject);
      h += '<div class="form-row"><label>' + s.emoji + ' <b>' + esc(s.short) + '</b> — ' + esc(x.title) + '<small>' + x.weight + ' % · ' + esc(x.when) + '</small></label><input class="inp" type="date" value="' + ((settings.exams || {})[x.id] || '') + '" data-set="exam" data-id="' + x.id + '"></div>';
    });
    h += '</div>';

    h += '<div class="section-h"><h3>Routines</h3><span class="aside">activer / désactiver</span></div><div class="card">';
    C.routines.forEach(function (r) {
      var on = !(settings.routinesOff || {})[r.id];
      h += '<div class="form-row"><label>' + esc(r.title) + '<small>' + (r.days.length === 7 ? 'Tous les jours' : r.days.map(function (d) { return DAYS[d]; }).join(', ')) + (r.mins ? ' · ' + r.mins + ' min' : '') + '</small></label><button class="toggle' + (on ? ' on' : '') + '" data-a="routine-off" data-r="' + r.id + '"></button></div>';
    });
    h += '</div>';
    h += '<div class="row-actions"><button class="btn-soft" data-a="replan">↻ Replanifier depuis zéro</button><a class="btn-soft" href="tests.html" style="text-decoration:none;">🧪 Tests du moteur</a></div>';
    h += '<p class="soft-note" style="margin-top:12px;">Calendrier : ' + esc(C.calendar.source) + '. ' + esc(C.calendar.breaks[0].label) + '.</p>';
    h += '</div></div>';
    return h;
  }

  // ---------------------------------------------------------------- Feuilles
  function sheet(html, onMount) {
    closeSheet();
    var bg = document.createElement('div'); bg.className = 'sheet-bg'; bg.id = 'sheet';
    bg.innerHTML = '<div class="sheet">' + html + '</div>';
    bg.addEventListener('click', function (e) { if (e.target === bg) closeSheet(); });
    document.body.appendChild(bg);
    if (onMount) onMount(bg);
  }
  function closeSheet() { var s = document.getElementById('sheet'); if (s) s.remove(); if (timer.int) { clearInterval(timer.int); timer.int = null; } }

  function openActivity(id) {
    var a = act(id); if (!a) return;
    var s = subj(a.subject), st = stOf(id), pi = plannedItem(id);
    var cur = st.s === 'todo' && a.blocked ? 'blocked' : st.s;
    var h = '<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;"><span class="pill subj" style="--c:' + s.color + ';--cs:' + s.soft + '">' + s.emoji + ' ' + esc(s.short) + (a.week ? ' · S' + a.week : '') + '</span><span class="pill">' + (TYPE[a.type] || ['', a.type])[1] + '</span></div>' +
      '<h3>' + esc(a.title) + '</h3><div class="s-sub">' + esc(a.weekTitle || '') + '</div>';
    if (pi) h += '<div class="soft-note">🗓 Prévu <b>' + E.niceDay(pi.date, today) + '</b> — ' + esc(pi.item.reason) + '</div>';
    if (a.type !== 'class') {
      h += '<div class="field"><label>Où j’en suis</label><div class="seg">' +
        [['todo', '○ Pas commencé'], ['doing', '◐ En cours'], ['done', '● Fait'], ['blocked', '⏳ Pas encore dispo']].map(function (o) { return '<button data-st="' + o[0] + '" class="' + (cur === o[0] ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div></div>' +
        '<div class="field" id="pfield" style="' + (cur === 'doing' ? '' : 'display:none') + '"><label>Avancement : <span id="pval">' + (st.p || 0) + '</span> %</label><input type="range" min="0" max="95" step="5" value="' + (st.p || 0) + '" id="prange"><small>Le temps restant est recalculé pour le planning.</small></div>' +
        '<div class="field"><label>Durée estimée (minutes)</label><input class="inp" type="number" min="5" step="5" id="fmins" value="' + a.mins + '"><small>Estimation de départ. Ajuste-la si ça te prend plus ou moins de temps.</small></div>' +
        '<div class="field"><label>Échéance réelle</label><input class="inp" type="date" id="fdue" value="' + (a.due || '') + '"><small>' + esc(a.due ? (a.dueSrc || '') : 'Aucune échéance dans le syllabus : n’en mets une que si le prof l’a donnée.') + '</small></div>';
    } else {
      h += '<div class="field"><label>Présence</label><div class="seg"><button data-st="todo" class="' + (cur !== 'done' ? 'on' : '') + '">Pas encore / absente</button><button data-st="done" class="' + (cur === 'done' ? 'on' : '') + '">J’y étais ✓</button></div></div>';
    }
    if (a.src) h += '<p style="font-size:12px;color:var(--ink-3);margin-top:12px;">Source : ' + esc(a.src) + '</p>';
    if (a.release && a.release > today) h += '<p style="font-size:12px;color:var(--ink-3);">Considérée disponible à partir du ' + shortDate(a.release) + ' (sinon, mets « Pas encore dispo »).</p>';
    h += '<div class="sheet-actions">' + (a.custom ? '<button class="btn-soft" data-x="del" style="margin-right:auto;color:#C2334B;">Supprimer</button>' : '') + '<button class="btn-soft" data-x="close">Annuler</button><button class="btn-main pink" data-x="save">Enregistrer</button></div>';
    sheet(h, function (root) {
      var chosen = cur;
      root.querySelectorAll('[data-st]').forEach(function (b) {
        b.onclick = function () {
          chosen = b.dataset.st;
          root.querySelectorAll('[data-st]').forEach(function (x) { x.classList.toggle('on', x === b); });
          var pf = root.querySelector('#pfield'); if (pf) pf.style.display = chosen === 'doing' ? '' : 'none';
        };
      });
      var pr = root.querySelector('#prange'); if (pr) pr.oninput = function () { root.querySelector('#pval').textContent = pr.value; };
      root.querySelector('[data-x="close"]').onclick = closeSheet;
      var del = root.querySelector('[data-x="del"]');
      if (del) del.onclick = function () { S.updateState(function (st) { st.custom = (st.custom || []).filter(function (c) { return c.id !== id; }); delete st.acts[id]; }); closeSheet(); rerender(); toast('Activité supprimée'); };
      root.querySelector('[data-x="save"]').onclick = function () {
        if (a.type !== 'class') {
          var mins = +root.querySelector('#fmins').value, due = root.querySelector('#fdue').value || null;
          S.updateState(function (st) {
            st.overrides = st.overrides || {};
            var o = st.overrides[id] || {};
            if (mins && mins !== a.mins) o.mins = mins;
            if ((due || null) !== (a.due || null)) o.due = due;
            if (Object.keys(o).length) st.overrides[id] = o;
            if (a.custom) (st.custom || []).forEach(function (c) { if (c.id === id) { c.mins = mins || c.mins; c.due = due; c.dueSrc = due ? 'Ajoutée par toi' : null; } });
          });
        }
        if (chosen !== stOf(id).s || chosen === 'doing') S.setActivity(id, chosen, chosen === 'doing' ? +(pr ? pr.value : 0) : null);
        closeSheet(); rerender(); toast('Enregistré · planning recalculé');
      };
    });
  }

  function openAdd(sid, n) {
    var s = subj(sid);
    var h = '<h3>Nouvelle activité — ' + s.emoji + ' ' + esc(s.short) + ' S' + n + '</h3><div class="s-sub">Pour un devoir ou un contenu publié en cours de semestre.</div>' +
      '<div class="field"><label>Intitulé</label><input class="inp" id="atitle" placeholder="ex. Problem set 3"></div>' +
      '<div class="field"><label>Type</label><select class="inp" id="atype">' + TYPE_ORDER.filter(function (t) { return t !== 'class'; }).map(function (t) { return '<option value="' + t + '">' + TYPE[t][0] + ' ' + TYPE[t][1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>Durée estimée (minutes)</label><input class="inp" id="amins" type="number" value="30" min="5" step="5"></div>' +
      '<div class="field"><label>Échéance (si le prof en a donné une)</label><input class="inp" id="adue" type="date"></div>' +
      '<div class="sheet-actions"><button class="btn-soft" data-x="close">Annuler</button><button class="btn-main pink" data-x="save">Ajouter</button></div>';
    sheet(h, function (root) {
      root.querySelector('[data-x="close"]').onclick = closeSheet;
      root.querySelector('[data-x="save"]').onclick = function () {
        var title = root.querySelector('#atitle').value.trim();
        if (!title) { root.querySelector('#atitle').focus(); return; }
        var due = root.querySelector('#adue').value || null;
        S.updateState(function (st) {
          st.custom = st.custom || [];
          st.custom.push({ id: 'custom-' + sid + '-' + Date.now().toString(36), subject: sid, week: n, type: root.querySelector('#atype').value, title: title, mins: +root.querySelector('#amins').value || 30, due: due, dueSrc: due ? 'Ajoutée par toi' : null });
        });
        closeSheet(); rerender(); toast('Ajoutée · je l’ai placée dans le planning');
      };
    });
  }

  var timer = { int: null };
  function openHelper() {
    var it = plan.days[0].items.filter(function (i) { return act(i.id) && stOf(i.id).s !== 'done'; })[0];
    if (!it) return;
    var a = act(it.id), s = subj(a.subject), left = 5 * 60, running = false;
    var row = document.getElementById('t-' + a.id);
    if (row) { row.classList.add('highlight'); row.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    var h = '<div class="timer"><div style="font-size:13px;color:var(--ink-3);text-transform:uppercase;letter-spacing:1.4px;font-weight:600;">Ta mission</div>' +
      '<h3 style="margin-top:8px;">' + s.emoji + ' ' + esc(a.title) + '</h3><div class="s-sub">' + esc(s.short) + (a.week ? ' · semaine ' + a.week : '') + ' · ' + hm(it.mins) + '</div>' +
      '<div class="t-big" id="tclock">5:00</div><p>Juste 5 minutes pour démarrer. Après, tu continues si ça roule, ou tu t’arrêtes : c’est déjà une victoire.</p>' +
      '<div class="sheet-actions" style="justify-content:center;"><button class="btn-soft" data-x="close">Plus tard</button><button class="btn-main" data-x="go">▶ C’est parti</button><button class="btn-main pink" data-x="done">J’ai fini ✓</button></div></div>';
    sheet(h, function (root) {
      var clock = root.querySelector('#tclock');
      root.querySelector('[data-x="close"]').onclick = closeSheet;
      root.querySelector('[data-x="go"]').onclick = function () {
        var b = this; running = !running; b.textContent = running ? '⏸ Pause' : '▶ Reprendre';
        if (running) timer.int = setInterval(function () {
          left = Math.max(0, left - 1);
          clock.textContent = Math.floor(left / 60) + ':' + pad(left % 60);
          if (!left) { clearInterval(timer.int); timer.int = null; clock.textContent = '✦ 5 min ✦'; }
        }, 1000);
        else { clearInterval(timer.int); timer.int = null; }
      };
      root.querySelector('[data-x="done"]').onclick = function () { closeSheet(); S.setActivity(a.id, 'done'); rerender(); toast('Bravo ✦ Une de faite !'); };
    });
  }

  // ---------------------------------------------------------------- Rendu + événements
  function render() {
    var v = document.getElementById('view');
    var html = ui.view === 'today' ? viewToday() : ui.view === 'week' ? viewWeek() : ui.view === 'subjects' ? viewSubjects() : ui.view === 'progress' ? viewProgress() : viewSettings();
    v.innerHTML = '<div class="view">' + html + '</div>';
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('on', t.dataset.view === ui.view); });
  }
  function rerender() { load(); render(); }
  function go(view) { ui.view = view; if (view !== 'subjects') { ui.subject = null; } render(); window.scrollTo(0, 0); try { localStorage.setItem('school_ui_view', view); } catch (e) {} }

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
        if (cur === 'done') { S.setActivity(id, 'todo'); }
        else { S.setActivity(id, 'done'); burst(t); }
        setTimeout(rerender, cur === 'done' ? 0 : 280);
        if (cur !== 'done' && x && x.type !== 'class') toast('✦ Fait ! Le planning s’est mis à jour');
        break;
      }
      case 'open': openActivity(id); break;
      case 'set': S.setActivity(id, t.dataset.s); rerender(); break;
      case 'dismiss': S.updateState(function (st) { st.dismissed = st.dismissed || {}; st.dismissed[id] = true; }); rerender(); break;
      case 'routine': {
        var done = ((state.routineLog || {})[today] || {})[t.dataset.r];
        S.toggleRoutine(today, t.dataset.r);
        if (!done) burst(t);
        setTimeout(rerender, done ? 0 : 250);
        break;
      }
      case 'routine-link': {
        var log = ((state.routineLog || {})[today] || {});
        if (log[t.dataset.r]) S.toggleRoutine(today, t.dataset.r);
        S.toggleRoutine(today, t.dataset.r, id);
        S.setActivity(id, 'done');
        rerender(); toast('Routine faite + activité cochée dans la checklist');
        break;
      }
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

  try { var v = localStorage.getItem('school_ui_view'); if (v) ui.view = v; } catch (e) {}
  if (/[?&]view=(\w+)/.test(location.search)) ui.view = RegExp.$1;
  rerender();
})();
