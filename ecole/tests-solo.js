// Tests de Mon planning de révision : jsc curriculum.js engine.js solo-plan.js tests-solo.js
(function (root) {
  var P = root.SoloPlan, C = root.SCHOOL_CURRICULUM, E = root.SchoolEngine, fails = 0, out = [];
  function ok(c, m, d) { out.push((c ? '✅ ' : '❌ ') + m + (c ? '' : '  → ' + (d || ''))); if (!c) fails++; }
  var all = P.tasks(C, {});
  function n(sid, unit) { return all.filter(function (t) { return t.subject === sid && t.unit === unit; }).length; }
  ok(n('EC11', 'w01') === 4 && n('EC11', 'g') === 3 && n('MG11', 'w01') === 5 && n('MG11', 'g') === 3 && n('IR11', 'w01') === 3 && n('IR11', 'g') === 4 && n('MA11', 'c1') === 3 && n('MA11', 'g') === 2,
    '1. Les étapes de chaque matière (par semaine et en général) sont là');
  ok(P.units(C, 'EC11').length === 12 && P.units(C, 'IR11').length === 12 && P.units(C, 'MG11').length === 12 && P.units(C, 'MA11').length === 9 && P.units(C, 'MA11')[3].label === 'Sessions 3 et 4',
    '2. Mêmes semaines qu’École OS (11 + en général), maths en 8 sessions du syllabus');
  var d = P.days(C, {}, '2026-11-25');
  ok(d[0] === '2026-11-25' && d[d.length - 1] === '2026-12-14', '3. Le calendrier va d’aujourd’hui au dernier examen (maths, 14 déc.)', d[d.length - 1]);
  var a = 'rs-EC11-w01-read', b = 'rs-EC11-w02-read', c = 'rs-MG11-g-mocks';
  var s = P.move(C, {}, a, '2026-11-26'); s = P.move(C, s, b, '2026-11-26'); s = P.move(C, s, c, '2026-11-26', 0);
  ok(P.dayTasks(C, s, '2026-11-26').map(function (t) { return t.id; }).join() === [c, a, b].join(), '4. Glisser sur un jour, à la bonne place');
  s = P.move(C, s, a, '2026-11-27'); s = P.move(C, s, b, null);
  ok(P.dayTasks(C, s, '2026-11-26').length === 1 && P.dayTasks(C, s, '2026-11-27')[0].id === a && !P.tasks(C, s).filter(function (t) { return t.id === b; })[0].date,
    '5. Déplacer d’un jour à l’autre, ou remettre dans la liste');
  s = P.toggle(s, a, '2026-11-25', 7); s = P.toggle(s, c, '2026-11-25', 10);
  var st = E.emptyState(); st.solo = s;
  ok(P.earned(s) === 17 && E.wallet(C, st, E.defaultSettings(C)).revision === 17 && E.wallet(C, st, E.defaultSettings(C)).total === 17, '6. Chaque tâche cochée rapporte à la tirelire École OS');
  s = P.remove(s, c); s = P.add(C, s, { subject: 'IR11', unit: 'w03', title: 'Mon quiz à moi', mins: 20 }, '2026-11-28');
  var mine = P.dayTasks(C, s, '2026-11-28')[0];
  s = P.rename(C, s, a, 'Relire S1');
  ok(P.earned(s) === 7 && !P.tasks(C, s).some(function (t) { return t.id === c; }) && mine && mine.unitLabel === 'Semaine 3' && P.tasks(C, s).filter(function (t) { return t.id === a; })[0].title === 'Relire S1',
    '7. Supprimer, ajouter et renommer une tâche');
  out.push(''); out.push(fails ? fails + ' test(s) en échec' : 'Tous les tests passent (' + (out.length - 1) + ' vérifications).');
  print(out.join('\n'));
})(globalThis);
