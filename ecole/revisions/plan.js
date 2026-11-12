// Révisions à deux — logique pure (aucun accès réseau ni DOM), testable avec jsc.
// Un planning = des matières, des tâches datées (fiches, séance d'exercices, flashcards…)
// et des routines quotidiennes (maths à 20 h). La progression de chacune est à part.
(function (root) {
  'use strict';

  // Couleurs reprises d'École OS (curriculum.js) pour que chaque matière garde la sienne.
  var PALETTE = {
    MA11: { color: '#EBA3BA', soft: '#F9DDE6', ink: '#9E4F6B' },
    EC11: { color: '#C4ADE0', soft: '#ECE3F6', ink: '#76579B' },
    IR11: { color: '#F4C095', soft: '#FCE8D6', ink: '#A2653A' },
    MG11: { color: '#F2B8C9', soft: '#FCE6EC', ink: '#A0566F' },
    SK11: { color: '#EDD38A', soft: '#FAF0CF', ink: '#8E7024' },
    LE11: { color: '#B6D39A', soft: '#E5F0D8', ink: '#5B7C42' },
    ZH: { color: '#EFAE9C', soft: '#FBE2DA', ink: '#9E5A47' },
    IT: { color: '#A9CCE8', soft: '#E0EEF8', ink: '#4D7A9C' }
  };
  var EXTRA_COLORS = [
    { color: '#A9D2EA', soft: '#E2F0F8', ink: '#4D7A9C' },
    { color: '#9CC896', soft: '#E3F0DC', ink: '#5B7C42' },
    { color: '#F5D27E', soft: '#FBEFCB', ink: '#8E7024' }
  ];

  var TYPES = {
    fiche: { label: 'Fiche', pay: 7 },
    exos: { label: 'Séance d’exercices', pay: 10 },
    flash: { label: 'Flashcards', pay: 5 },
    session: { label: 'Révision', pay: 7 },
    other: { label: 'Mon ajout', pay: 5 }
  };
  var SUBJECT_BONUS = 20;   // quand toutes les tâches d'une matière sont faites
  var ROUTINE_PAY = 10;     // 1 h de maths

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseDay(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = parseDay(s); d.setDate(d.getDate() + n); return dayStr(d); }
  function uid(prefix) { return (prefix || 't') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function subjectMeta(id, name) {
    var c = PALETTE[id] || EXTRA_COLORS[0];
    return { id: id, name: name, color: c.color, soft: c.soft, ink: c.ink };
  }

  // Le programme décidé ensemble (novembre 2026). Les jours des fiches sont une proposition :
  // chaque tâche peut être déplacée, renommée ou supprimée dans l'app.
  function seedPlan() {
    var tasks = [];
    function block(subject, prefix, days, fichesPerDay) {
      var n = 1;
      fichesPerDay.forEach(function (count, i) {
        for (var k = 0; k < count; k++, n++) tasks.push({ id: prefix + '-f' + n, subject: subject, type: 'fiche', title: 'Fiche ' + n, date: days[i] });
      });
      var last = days[days.length - 1];
      tasks.push({ id: prefix + '-exos', subject: subject, type: 'exos', title: 'Séance d’exercices sur les fiches', date: last });
      tasks.push({ id: prefix + '-flash', subject: subject, type: 'flash', title: 'Flashcards', date: last });
    }
    // Vendredi 13 : Microeconomics + maths.
    tasks.push({ id: 'ec-13', subject: 'EC11', type: 'session', title: 'Révision de Microeconomics', date: '2026-11-13' });
    // Business : samedi 14 → mercredi 18 (dernier délai), 9 fiches puis exercices + flashcards.
    block('MG11', 'mg', ['2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18'], [2, 2, 2, 2, 1]);
    // Microeconomics : jeudi 19 → dimanche 22, 9 fiches puis exercices + flashcards.
    block('EC11', 'ec', ['2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22'], [3, 3, 3]);
    // International Relations : lundi 23 → jeudi 26. Nombre de fiches pas encore confirmé (9 par défaut).
    block('IR11', 'ir', ['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26'], [3, 3, 3]);

    return {
      v: 1,
      title: 'Nos révisions',
      subjects: [
        subjectMeta('MG11', 'Business'),
        subjectMeta('EC11', 'Microeconomics'),
        subjectMeta('IR11', 'International Relations'),
        subjectMeta('MA11', 'Maths')
      ],
      windows: {
        MG11: { from: '2026-11-14', to: '2026-11-18' },
        EC11: { from: '2026-11-19', to: '2026-11-22' },
        IR11: { from: '2026-11-23', to: '2026-11-26' }
      },
      flags: { IR11: 'Nombre de fiches à confirmer : 9 mis par défaut, comme Business et Microeconomics.' },
      tasks: tasks,
      routines: [
        { id: 'maths20', subject: 'MA11', title: '1 h de maths', time: '20:00', mins: 60, from: '2026-11-13', to: null }
      ]
    };
  }

  function subjectById(plan, id) {
    for (var i = 0; i < plan.subjects.length; i++) if (plan.subjects[i].id === id) return plan.subjects[i];
    return { id: id, name: id, color: '#B6D39A', soft: '#E5F0D8', ink: '#5B7C42' };
  }
  function typeOf(t) { return TYPES[t.type] || TYPES.other; }
  function payOf(t) { return t.pay != null ? t.pay : typeOf(t).pay; }

  function emptyProgress() { return { done: {}, routines: {}, notes: {} }; }
  function norm(p) { p = p || {}; return { done: p.done || {}, routines: p.routines || {}, notes: p.notes || {} }; }
  function isDone(prog, id) { return !!norm(prog).done[id]; }
  function routineDone(prog, date, rid) { return !!(norm(prog).routines[date] || {})[rid]; }

  function routineOn(r, date) {
    if (r.from && date < r.from) return false;
    if (r.to && date > r.to) return false;
    if (r.days && r.days.indexOf(parseDay(date).getDay()) === -1) return false;
    return true;
  }

  function byOrder(plan) {
    var order = {};
    plan.subjects.forEach(function (s, i) { order[s.id] = i; });
    return function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      var sa = order[a.subject] == null ? 99 : order[a.subject], sb = order[b.subject] == null ? 99 : order[b.subject];
      return sa - sb;
    };
  }

  // Ce qui est prévu un jour donné : tâches + routines.
  function day(plan, date) {
    return {
      date: date,
      tasks: plan.tasks.filter(function (t) { return t.date === date; }).sort(byOrder(plan)),
      routines: (plan.routines || []).filter(function (r) { return routineOn(r, date); })
    };
  }

  // Tâches d'avant aujourd'hui pas encore cochées (dit gentiment, sans culpabiliser).
  function leftovers(plan, prog, today) {
    return plan.tasks.filter(function (t) { return t.date < today && !isDone(prog, t.id); }).sort(byOrder(plan));
  }

  function dateRange(plan) {
    var ds = plan.tasks.map(function (t) { return t.date; }).sort();
    return ds.length ? { from: ds[0], to: ds[ds.length - 1] } : null;
  }

  // Avancement d'une matière pour une personne. Maths = routine : compte les jours faits.
  function subjectProgress(plan, prog, sid, today) {
    var ts = plan.tasks.filter(function (t) { return t.subject === sid; });
    var done = ts.filter(function (t) { return isDone(prog, t.id); }).length;
    var total = ts.length;
    (plan.routines || []).forEach(function (r) {
      if (r.subject !== sid) return;
      var end = r.to || maxDate(dateRange(plan) ? dateRange(plan).to : today, today);
      for (var d = r.from; d <= end; d = addDays(d, 1)) {
        if (!routineOn(r, d)) continue;
        total++;
        if (routineDone(prog, d, r.id)) done++;
      }
    });
    return { done: done, total: total, pct: total ? Math.round(done / total * 100) : 0 };
  }
  function maxDate(a, b) { return a > b ? a : b; }

  function wallet(plan, prog) {
    var p = norm(prog), total = 0, bySubject = {};
    plan.tasks.forEach(function (t) {
      if (!p.done[t.id]) return;
      total += payOf(t);
      bySubject[t.subject] = (bySubject[t.subject] || 0) + payOf(t);
    });
    var routines = {};
    (plan.routines || []).forEach(function (r) { routines[r.id] = r; });
    Object.keys(p.routines).forEach(function (d) {
      Object.keys(p.routines[d] || {}).forEach(function (rid) {
        var r = routines[rid];
        if (!r || !p.routines[d][rid] || !routineOn(r, d)) return;
        var pay = r.pay != null ? r.pay : ROUTINE_PAY;
        total += pay; bySubject[r.subject] = (bySubject[r.subject] || 0) + pay;
      });
    });
    var bonuses = [];
    plan.subjects.forEach(function (s) {
      var ts = plan.tasks.filter(function (t) { return t.subject === s.id; });
      if (ts.length && ts.every(function (t) { return p.done[t.id]; })) { total += SUBJECT_BONUS; bonuses.push(s.id); bySubject[s.id] = (bySubject[s.id] || 0) + SUBJECT_BONUS; }
    });
    return { total: total, bySubject: bySubject, bonuses: bonuses };
  }

  // Fenêtres des matières (de quand à quand on la révise) pour la frise.
  function windows(plan) {
    return plan.subjects.map(function (s) {
      var w = (plan.windows || {})[s.id];
      if (!w) {
        var ds = plan.tasks.filter(function (t) { return t.subject === s.id; }).map(function (t) { return t.date; }).sort();
        w = ds.length ? { from: ds[0], to: ds[ds.length - 1] } : null;
      }
      return w ? { subject: s.id, from: w.from, to: w.to } : null;
    }).filter(Boolean);
  }

  // ------------------------------------------------------------ modifications du planning
  // Chaque op prend un planning et le modifie sur place (appliquée sur la version la plus récente du cloud).
  var OPS = {
    // a.kind = type de tâche (fiche, exos…) ; a.type est le nom de l'opération.
    addTask: function (plan, a) { plan.tasks.push({ id: a.id || uid('t'), subject: a.subject, type: a.kind || 'other', title: a.title, date: a.date }); },
    removeTask: function (plan, a) { plan.tasks = plan.tasks.filter(function (t) { return t.id !== a.id; }); },
    editTask: function (plan, a) { plan.tasks.forEach(function (t) { if (t.id === a.id) { ['title', 'date', 'subject'].forEach(function (k) { if (a[k] != null) t[k] = a[k]; }); if (a.kind) t.type = a.kind; } }); },
    addSubject: function (plan, a) {
      if (plan.subjects.some(function (s) { return s.id === a.id; })) return;
      var c = PALETTE[a.id] || EXTRA_COLORS[plan.subjects.length % EXTRA_COLORS.length];
      plan.subjects.push({ id: a.id, name: a.name, color: c.color, soft: c.soft, ink: c.ink });
      if (a.from && a.to) { plan.windows = plan.windows || {}; plan.windows[a.id] = { from: a.from, to: a.to }; }
      var n = +a.fiches || 0, days = [];
      if (a.from && a.to) for (var d = a.from; d <= a.to; d = addDays(d, 1)) days.push(d);
      if (!days.length) return;
      var ficheDays = days.length > 1 ? days.slice(0, -1) : days;
      for (var i = 0; i < n; i++) plan.tasks.push({ id: uid('t'), subject: a.id, type: 'fiche', title: 'Fiche ' + (i + 1), date: ficheDays[Math.floor(i * ficheDays.length / n)] });
      if (a.exos !== false) {
        plan.tasks.push({ id: uid('t'), subject: a.id, type: 'exos', title: 'Séance d’exercices sur les fiches', date: days[days.length - 1] });
        plan.tasks.push({ id: uid('t'), subject: a.id, type: 'flash', title: 'Flashcards', date: days[days.length - 1] });
      }
    },
    removeSubject: function (plan, a) {
      plan.subjects = plan.subjects.filter(function (s) { return s.id !== a.id; });
      plan.tasks = plan.tasks.filter(function (t) { return t.subject !== a.id; });
      if (plan.windows) delete plan.windows[a.id];
    },
    setWindow: function (plan, a) { plan.windows = plan.windows || {}; plan.windows[a.subject] = { from: a.from, to: a.to }; },
    clearFlag: function (plan, a) { if (plan.flags) delete plan.flags[a.subject]; },
    editRoutine: function (plan, a) { (plan.routines || []).forEach(function (r) { if (r.id === a.id) { ['title', 'time', 'from', 'to'].forEach(function (k) { if (k in a) r[k] = a[k]; }); } }); }
  };
  function apply(plan, op) {
    var copy = JSON.parse(JSON.stringify(plan));
    if (OPS[op.type]) OPS[op.type](copy, op);
    return copy;
  }

  root.RevPlan = {
    TYPES: TYPES, SUBJECT_BONUS: SUBJECT_BONUS, ROUTINE_PAY: ROUTINE_PAY, PALETTE: PALETTE,
    dayStr: dayStr, parseDay: parseDay, addDays: addDays, uid: uid,
    seedPlan: seedPlan, subjectById: subjectById, typeOf: typeOf, payOf: payOf,
    emptyProgress: emptyProgress, norm: norm, isDone: isDone, routineDone: routineDone, routineOn: routineOn,
    day: day, leftovers: leftovers, dateRange: dateRange, subjectProgress: subjectProgress, wallet: wallet, windows: windows,
    apply: apply
  };
})(typeof window !== 'undefined' ? window : this);
