// École OS — Mon planning de révision (solo, privé). Logique pure, testable avec jsc.
// Les contenus viennent de curriculum.js (mêmes semaines, mêmes chapitres, mêmes couleurs) ;
// les étapes de révision sont celles que tu as données pour chaque matière.
// Ta progression vit dans school_state.solo (synchronisé comme le reste d'École OS) :
//   dates   id -> 'AAAA-MM-JJ'   (le jour où tu l'as glissée ; absent = encore à planifier)
//   order   'AAAA-MM-JJ' -> [id] (l'ordre dans la journée)
//   done    id -> { d, pay }     (cochée ce jour-là, avec ce qu'elle a rapporté à la tirelire)
//   removed id -> true           (supprimée de ta liste)
//   titles  id -> nouveau nom
//   extra   [{ id, subject, unit, title, mins }]  (tes ajouts)
(function (root) {
  'use strict';

  var SUBJECTS = ['EC11', 'MG11', 'IR11', 'MA11'];

  // Étapes de chaque semaine (ou session pour les maths), puis ce qui se fait pour toute la matière.
  var STEPS = {
    EC11: {
      unit: [['read', 'Lire le cours', 30], ['blackboard', 'Refaire les exercices Blackboard', 45], ['seminar', 'Faire les exercices des slides du séminaire', 45], ['bristol', 'Faire la fiche Bristol', 40]],
      general: [['graphs', 'Faire la fiche des graphiques', 60], ['past', 'Faire les past papers (midterms)', 90], ['practice', 'Exercices d’entraînement et apprendre', 60]]
    },
    MG11: {
      unit: [['read', 'Lire le cours', 30], ['fiche', 'Faire la fiche', 40], ['case', 'Faire le business case study (BMW)', 45], ['personal', 'Faire mon application personnelle', 30], ['blackboard', 'Refaire les exercices Blackboard', 45]],
      general: [['mocks', 'Faire des mocks', 90], ['practice', 'Exercices d’entraînement et apprendre', 60], ['global', 'Faire une fiche de révision globale avec tous les points clés', 60]]
    },
    IR11: {
      unit: [['read', 'Lire le cours', 30], ['fiche', 'Faire la fiche', 40], ['quiz', 'Faire le quiz du cours', 15]],
      general: [['keys', 'Fiche des points, dates et noms clés + quiz pour les apprendre', 60], ['method', 'Revoir la méthodologie', 45], ['past', 'Revoir les past papers', 90], ['practice', 'Exercices et practice', 60]]
    },
    MA11: {
      unit: [['video', 'Regarder la vidéo du prof', 35], ['profex', 'Faire les exos des slides du prof', 45], ['semex', 'Faire les exos des slides du séminaire', 45]],
      general: [['mocks', 'Faire des mock exams', 90], ['practice', 'Practice', 60]]
    }
  };

  // Les 8 blocs du syllabus de maths (une ligne du tableau = une session à réviser).
  var MA11_SESSIONS = ['Session 1', 'Session 2', 'Sessions 3 et 4', 'Session 5', 'Session 6', 'Sessions 7 et 8', 'Session 9', 'Sessions 10 et 11'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseDay(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = parseDay(s); d.setDate(d.getDate() + n); return dayStr(d); }

  function norm(solo) {
    var s = solo || {};
    return { dates: s.dates || {}, order: s.order || {}, done: s.done || {}, removed: s.removed || {}, titles: s.titles || {}, extra: s.extra || [] };
  }
  function subjectOf(cur, id) { return cur.subjects.filter(function (s) { return s.id === id; })[0]; }

  // Les cases de révision d'une matière : « En général », puis chaque semaine (ou session).
  function units(cur, sid) {
    var s = subjectOf(cur, sid), out = [{ key: 'g', label: 'En général', title: 'Pour toute la matière' }];
    s.weeks.forEach(function (w) {
      if (w.n < 1 || w.n > 11) return;
      var t = String(w.title || '').replace(/^(Séance \d+|Chapitre \d+) — /, '');
      out.push(sid === 'MA11' ? { key: 'c' + w.n, label: MA11_SESSIONS[w.n - 1], title: t } : { key: 'w' + pad(w.n), label: 'Semaine ' + w.n, title: t });
    });
    return out;
  }

  // Toutes les tâches de révision (modèle + tes ajouts), avec leur état.
  function tasks(cur, solo) {
    var so = norm(solo), out = [];
    SUBJECTS.forEach(function (sid) {
      var st = STEPS[sid];
      units(cur, sid).forEach(function (u) {
        (u.key === 'g' ? st.general : st.unit).forEach(function (x) {
          out.push({ id: 'rs-' + sid + '-' + u.key + '-' + x[0], subject: sid, unit: u.key, unitLabel: u.label, unitTitle: u.title, title: x[1], mins: x[2] });
        });
      });
    });
    so.extra.forEach(function (x) {
      var u = x.unit ? units(cur, x.subject).filter(function (v) { return v.key === x.unit; })[0] : null;
      out.push({ id: x.id, subject: x.subject, unit: u ? u.key : null, unitLabel: u ? u.label : null, unitTitle: u ? u.title : null, title: x.title, mins: x.mins || 30, mine: true });
    });
    return out.filter(function (t) { return !so.removed[t.id]; }).map(function (t) {
      if (so.titles[t.id]) { t.originalTitle = t.title; t.title = so.titles[t.id]; }
      t.date = so.dates[t.id] || null;
      t.done = !!so.done[t.id];
      return t;
    });
  }

  // Les tâches d'un jour, dans l'ordre que tu as choisi.
  function dayTasks(cur, solo, date) {
    var so = norm(solo), order = so.order[date] || [];
    var list = tasks(cur, solo).filter(function (t) { return t.date === date; });
    list.sort(function (a, b) {
      var i = order.indexOf(a.id), j = order.indexOf(b.id);
      return (i === -1 ? 1e9 : i) - (j === -1 ? 1e9 : j);
    });
    return list;
  }

  // Les jours du calendrier : d'aujourd'hui jusqu'au dernier examen.
  function examsOf(cur, settings) {
    return cur.assessments.filter(function (x) { return SUBJECTS.indexOf(x.subject) !== -1 && /-final$/.test(x.id) && !x.past; })
      .map(function (x) { return { subject: x.subject, date: ((settings && settings.exams) || {})[x.id] || x.date, time: x.time || null }; })
      .filter(function (x) { return x.date; });
  }
  function days(cur, settings, today) {
    var last = examsOf(cur, settings).reduce(function (m, x) { return x.date > m ? x.date : m; }, today), out = [];
    for (var d = today; d <= last; d = addDays(d, 1)) out.push(d);
    return out;
  }

  // ---------------------------------------------------------------- Changements (renvoient un nouvel objet)
  function copy(solo) { return JSON.parse(JSON.stringify(norm(solo))); }
  function unorder(so, id) { Object.keys(so.order).forEach(function (d) { so.order[d] = so.order[d].filter(function (x) { return x !== id; }); if (!so.order[d].length) delete so.order[d]; }); }

  // Glisser une tâche sur un jour (à une position), ou la remettre dans la liste (date = null).
  function move(cur, solo, id, date, index) {
    var so = copy(solo);
    unorder(so, id);
    if (!date) { delete so.dates[id]; return so; }
    so.dates[id] = date;
    var ids = dayTasks(cur, so, date).map(function (t) { return t.id; }).filter(function (x) { return x !== id; });
    ids.splice(index == null || index > ids.length ? ids.length : Math.max(0, index), 0, id);
    so.order[date] = ids;
    return so;
  }
  function toggle(solo, id, today, pay) {
    var so = copy(solo);
    if (so.done[id]) delete so.done[id]; else so.done[id] = { d: today, pay: pay || 0 };
    return so;
  }
  // Supprimer : la tâche quitte ta liste (et ce qu'elle a rapporté quitte la tirelire).
  function remove(solo, id) {
    var so = copy(solo);
    unorder(so, id); delete so.dates[id]; delete so.done[id];
    if (/^rs-x-/.test(id)) so.extra = so.extra.filter(function (x) { return x.id !== id; }); else so.removed[id] = true;
    return so;
  }
  function restoreAll(solo) { var so = copy(solo); so.removed = {}; return so; }
  function add(cur, solo, x, date) {
    var so = copy(solo), id = 'rs-x-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    so.extra.push({ id: id, subject: x.subject, unit: x.unit || null, title: x.title, mins: x.mins || 30 });
    return date ? move(cur, so, id, date) : so;
  }
  function rename(cur, solo, id, title) {
    var so = copy(solo);
    if (/^rs-x-/.test(id)) { so.extra.forEach(function (x) { if (x.id === id && title) x.title = title; }); return so; }
    var orig = tasks(cur, { titles: {} }).filter(function (t) { return t.id === id; })[0];
    if (!title || (orig && orig.title === title)) delete so.titles[id]; else so.titles[id] = title;
    return so;
  }

  // Ce que les révisions ont rapporté à la tirelire École OS.
  function earned(solo) {
    var d = norm(solo).done, n = 0;
    Object.keys(d).forEach(function (k) { n += (d[k] && d[k].pay) || 0; });
    return n;
  }

  root.SoloPlan = {
    SUBJECTS: SUBJECTS, norm: norm, units: units, tasks: tasks, dayTasks: dayTasks, days: days, examsOf: examsOf,
    move: move, toggle: toggle, remove: remove, restoreAll: restoreAll, add: add, rename: rename, earned: earned,
    addDays: addDays, parseDay: parseDay
  };
})(typeof window !== 'undefined' ? window : globalThis);
