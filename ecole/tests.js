// École OS — tests de comportement du moteur (les 15 scénarios demandés).
// Navigateur : ouvrir ecole/tests.html. Terminal (macOS) :
//   jsc ecole/curriculum.js ecole/engine.js ecole/store.js ecole/tests.js
(function (root) {
  'use strict';
  var out = [], fails = 0;
  var say = root.print || function (s) { console.log(s); };
  function ok(cond, name, detail) {
    out.push((cond ? '✅ ' : '❌ ') + name + (cond || !detail ? '' : '  → ' + detail));
    if (!cond) fails++;
  }

  // localStorage factice pour jsc (dans le navigateur on isole aussi les tests du vrai stockage).
  var mem = {};
  var fakeLS = {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
    setItem: function (k, v) { mem[k] = String(v); },
    removeItem: function (k) { delete mem[k]; }
  };

  var CUR = root.SCHOOL_CURRICULUM, E = root.SchoolEngine;
  var TODAY = '2026-10-29'; // jeudi, pendant la pause entre S6 et S7
  var settings = E.defaultSettings(CUR);
  var empty = E.emptyState();
  var acts = E.activities(CUR, empty, settings);
  var byId = {}; acts.forEach(function (a) { byId[a.id] = a; });
  function planItems(plan) { var l = []; plan.days.forEach(function (d) { d.items.forEach(function (it) { l.push({ id: it.id, date: d.date, kind: it.kind, inClass: it.inClass }); }); }); return l; }

  // 1. Une matière démarre avec toutes ses activités non cochées
  var ec = acts.filter(function (a) { return a.subject === 'EC11'; });
  ok(ec.length > 50 && ec.every(function (a) { return E.statusOf(empty, a.id) === 'todo'; }), '1. EC11 importé : ' + ec.length + ' activités, toutes « pas commencé »');

  // 2. Bilan initial : cocher des semaines passées
  var w1 = ec.filter(function (a) { return a.week === 1; }).map(function (a) { return a.id; });
  var st = empty;
  w1.forEach(function (id) { st = E.setStatus(st, id, 'done'); });
  st = E.setStatus(st, 'EC11-w02-video', 'done');
  ok(w1.every(function (id) { return E.classify(byId[id], st, TODAY) === 'done'; }) && E.statusOf(st, 'EC11-w02-video') === 'done',
    '2. Semaine 1 + vidéo S2 cochées pendant le bilan initial');

  // 3. Calcul du restant
  var pr = E.progress(CUR, st, settings, TODAY).EC11;
  var countable = ec.filter(function (a) { return a.type !== 'class' && !a.optional; });
  var doneCountable = countable.filter(function (a) { return E.statusOf(st, a.id) === 'done'; }).length;
  ok(pr.total === countable.length && pr.done === doneCountable && pr.total - pr.done === countable.length - doneCountable,
    '3. Restant EC11 = ' + (pr.total - pr.done) + ' activités / ' + pr.total, JSON.stringify({ total: pr.total, done: pr.done }));

  // 4. Retard sans échéance inventée
  var irRead = byId['IR11-best-ch08'], ecQuiz3 = byId['EC11-w03-quiz'];
  ok(!irRead.due && E.classify(irRead, st, TODAY) === 'behind', '4a. Lecture IR S4 sans échéance → « à rattraper », pas « en retard »', E.classify(irRead, st, TODAY));
  ok(ecQuiz3.due === '2026-09-26' && E.classify(ecQuiz3, st, TODAY) === 'missed', '4b. Test EC11 S3 (samedi 26/09, syllabus) → échéance passée, à vérifier', ecQuiz3.due);
  var invented = acts.filter(function (a) { return a.due && !a.dueSrc && a.type !== 'revision'; });
  ok(invented.length === 0, '4c. Aucune échéance sans source (syllabus ou ta routine)', invented.map(function (a) { return a.id; }).join(','));

  // 5. Rattrapage + cours actuels en même temps
  var plan = E.buildPlan(CUR, st, settings, TODAY, null);
  var items = planItems(plan);
  var firstWeek = items.filter(function (i) { return E.diffDays(TODAY, i.date) < 7; });
  var hasCatch = firstWeek.some(function (i) { return i.kind === 'catchup'; });
  var hasCurrent = firstWeek.some(function (i) { return i.kind === 'current' || i.kind === 'deadline'; });
  ok(hasCatch && hasCurrent, '5. Les 7 prochains jours mélangent rattrapage et préparation de S7', JSON.stringify({ hasCatch: hasCatch, hasCurrent: hasCurrent }));
  var catchSubjects = {}; items.filter(function (i) { return i.kind === 'catchup'; }).forEach(function (i) { catchSubjects[byId[i.id].subject] = 1; });
  ok(Object.keys(catchSubjects).length >= 4, '5b. Le rattrapage est réparti entre ' + Object.keys(catchSubjects).length + ' matières');
  var catchDays = {}; items.filter(function (i) { return i.kind === 'catchup'; }).forEach(function (i) { catchDays[i.date] = 1; });
  ok(Object.keys(catchDays).length >= 7, '5c. Rattrapage étalé sur ' + Object.keys(catchDays).length + ' jours (pas tout demain)');

  // 6. Échéances réelles respectées
  var q7 = items.filter(function (i) { return i.id === 'EC11-w07-quiz'; })[0];
  var ml7 = items.filter(function (i) { return i.id === 'MA11-w07-mylab'; })[0];
  ok(q7 && q7.date <= '2026-11-07', '6a. Test EC11 S7 placé avant samedi 07/11', q7 && q7.date);
  ok(ml7 && ml7.date <= '2026-11-09', '6b. MyLab S7 placé avant lundi 09/11', ml7 && ml7.date);

  // 7. Prérequis et dates de mise à disposition
  var where = {}; items.forEach(function (i) { where[i.id] = i.date; });
  var early = items.filter(function (i) { var a = byId[i.id]; return a && a.release && i.date < a.release; });
  ok(early.length === 0, '7a. Rien n’est planifié avant sa mise à disposition', early.map(function (i) { return i.id + '@' + i.date; }).join(','));
  var badPrereq = items.filter(function (i) {
    var a = byId[i.id]; return a && (a.prereq || []).some(function (p) { return where[p] && where[p] > i.date; });
  });
  ok(badPrereq.length === 0, '7b. Chaque prérequis est planifié avant (ou le même jour que) ce qui en dépend', badPrereq.map(function (i) { return i.id; }).join(','));
  var stB = E.setStatus(st, 'MA11-w07-video', 'blocked');
  var planB = E.buildPlan(CUR, stB, settings, TODAY, null);
  var blockedIds = planItems(planB).map(function (i) { return i.id; });
  ok(blockedIds.indexOf('MA11-w07-video') === -1 && blockedIds.indexOf('MA11-w07-mylab') === -1,
    '7c. Vidéo bloquée (pas dispo) → ni elle ni le MyLab qui en dépend ne sont planifiés');

  // 8. Exercices de séminaire
  var s2 = JSON.parse(JSON.stringify(settings));
  s2.timetable.push({ id: 'tt-sem-ec', subject: 'EC11', kind: 'seminar', day: 3, start: '10:00', end: '11:30' });
  var planS = E.buildPlan(CUR, st, s2, TODAY, null);
  var wed = planS.days.filter(function (d) { return d.date === '2026-11-04'; })[0];
  var semItem = wed.items.filter(function (i) { return i.id === 'EC11-w07-sem'; })[0];
  var whereS = {}; planItems(planS).forEach(function (i) { whereS[i.id] = i.date; });
  ok(semItem && semItem.kind === 'seminar' && semItem.inClass && whereS['EC11-w07-video'] <= '2026-11-04',
    '8. Séminaire EC11 du mercredi 04/11 → exercices de S7 pendant le séminaire, vidéo vue avant', JSON.stringify(semItem));

  // 9. Routines quotidiennes visibles
  var allDaysHaveRoutines = plan.days.every(function (d) {
    var ids = d.routines.map(function (r) { return r.id; });
    return ids.indexOf('zh-vocab') !== -1 && ids.indexOf('ir-book') !== -1 && ids.indexOf('zh-practice') !== -1 &&
      (ids.indexOf('math-practice') !== -1 || ids.indexOf('math-practice-thu') !== -1);
  });
  ok(allDaysHaveRoutines, '9. Maths, mandarin, vocabulaire et livre d’IR présents chaque jour');

  // 10. Cocher une tâche met à jour toutes les vues
  var firstId = plan.days[0].items[0].id;
  var stDone = E.setStatus(st, firstId, 'done');
  var plan2 = E.buildPlan(CUR, stDone, settings, TODAY, null);
  var pr2 = E.progress(CUR, stDone, settings, TODAY)[byId[firstId].subject];
  var pr1 = E.progress(CUR, st, settings, TODAY)[byId[firstId].subject];
  ok(planItems(plan2).every(function (i) { return i.id !== firstId; }) && pr2.done === pr1.done + 1,
    '10. « ' + firstId + ' » coché → retiré du planning, progression +1');

  // 11. Tâche manquée → replanifiée sans doublon
  var snap = { today: TODAY, days: plan.byDate };
  var tomorrow = E.addDays(TODAY, 1);
  var missed = E.detectMissed(snap, st, tomorrow);
  var plan3 = E.buildPlan(CUR, st, settings, tomorrow, snap);
  var it3 = planItems(plan3);
  var counts = {}; it3.forEach(function (i) { counts[i.id] = (counts[i.id] || 0) + 1; });
  var dups = Object.keys(counts).filter(function (k) { return counts[k] > 1; });
  var missedRescheduled = missed.filter(function (m) { return counts[m.id] === 1; }).length;
  ok(missed.length > 0 && dups.length === 0 && missedRescheduled === missed.filter(function (m) { return E.classify(byId[m.id], st, tomorrow) !== 'missed'; }).length,
    '11. ' + missed.length + ' tâches d’hier non faites → replanifiées une seule fois chacune', 'dups=' + dups.join(','));

  // 12. Pas de journée irréaliste
  var tooHeavy = plan.days.filter(function (d) {
    if (d.load <= d.studyCap) return false;
    var paid = d.items.filter(function (i) { return !i.inClass; });
    var conflict = plan.conflicts.some(function (c) { return c.date === d.date; });
    return !(paid.length === 1 || conflict);
  });
  ok(tooHeavy.length === 0, '12. Aucune journée au-delà de ta capacité (sauf conflit signalé)', tooHeavy.map(function (d) { return d.date + ':' + d.load + '/' + d.studyCap; }).join(' '));
  var avg = plan.days.reduce(function (s, d) { return s + d.load + d.routineMins; }, 0) / plan.days.length;
  ok(avg <= 300, '12b. Charge moyenne ' + Math.round(avg) + ' min/jour (routines comprises)');

  // 13. Le Daily Planning d'origine n'est pas touché : clés séparées
  var K = root.SchoolStore.KEYS;
  ok(['planner_events', 'today_plan', 'todos', 'weekly_plans'].every(function (k) { return [K.state, K.settings, K.plan, K.history].indexOf(k) === -1; }),
    '13. Le module École n’écrit dans aucune clé de Plan the Day');

  // 14. Persistance (rechargement simulé)
  root.__schoolStorage = fakeLS;
  var S = root.SchoolStore;
  S.setActivity('IR11-w01-video', 'done');
  S.setActivity('IR11-w02-video', 'doing', 40);
  var reloaded = JSON.parse(mem[K.state]);
  ok(reloaded.acts['IR11-w01-video'].s === 'done' && reloaded.acts['IR11-w02-video'].p === 40 && S.getHistory().length === 2,
    '14. Progression relue après « rechargement » (fait + en cours à 40 %) et historique conservé');
  var p1 = S.recompute({ today: TODAY });
  var p2 = S.recompute({ today: TODAY });
  ok(JSON.stringify(p1.byDate[TODAY]) === JSON.stringify(p2.byDate[TODAY]), '14b. Recalculer ne change pas la journée en cours (plan stable)');
  delete root.__schoolStorage;

  // 15. Une seule fiche par activité dans toutes les vues
  var ids15 = planItems(plan).map(function (i) { return i.id; });
  var uniq = {}; ids15.forEach(function (i) { uniq[i] = (uniq[i] || 0) + 1; });
  var allIds = acts.map(function (a) { return a.id; }), uniqAll = {};
  allIds.forEach(function (i) { uniqAll[i] = (uniqAll[i] || 0) + 1; });
  ok(Object.keys(uniq).every(function (k) { return uniq[k] === 1; }) && Object.keys(uniqAll).every(function (k) { return uniqAll[k] === 1; }),
    '15. Aucun doublon : ' + allIds.length + ' activités uniques, chacune au plus une fois dans le planning');
  var irCh12 = acts.filter(function (a) { return a.id === 'IR11-best-ch12'; });
  ok(irCh12.length === 1 && irCh12[0].week === 4, '15b. Best ch. 12 (cité en S4, S5, S6, S10) = une seule lecture, renvoyée depuis les autres semaines');

  out.push('');
  out.push(fails ? fails + ' test(s) en échec' : 'Tous les tests passent (' + out.length + ' vérifications).');
  root.SCHOOL_TEST_RESULTS = { lines: out, fails: fails, plan: plan };
  if (!root.document) say(out.join('\n'));
})(typeof window !== 'undefined' ? window : globalThis);
