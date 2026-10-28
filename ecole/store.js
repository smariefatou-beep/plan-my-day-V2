// École OS — persistance. Tout passe par localStorage, donc par la synchro Supabase de sync.js
// (chaque clé est poussée vers le cloud automatiquement). Partagé par ecole/index.html et par
// le Daily Planning de Plan the Day : une seule fiche par activité, lue partout.
//
// Clés :
//   school_state     ta progression (statuts, maîtrise, bilan, activités ajoutées, dates modifiées, routines cochées)
//   school_settings  tes préférences (capacité, emploi du temps, dates d'examens…)
//   school_plan      dernier planning généré (instantané, pour garder la journée stable)
//   school_history   journal : fait / défait / manqué — jamais effacé par le planning
(function (root) {
  'use strict';
  var E = root.SchoolEngine, CUR = root.SCHOOL_CURRICULUM;
  var KEYS = { state: 'school_state', settings: 'school_settings', plan: 'school_plan', history: 'school_history' };

  // `__schoolStorage` permet aux tests de travailler sur un stockage isolé, jamais sur tes vraies données.
  function ls() { return root.__schoolStorage || root.localStorage; }
  function read(k, def) { try { var v = ls().getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function write(k, v) { try { ls().setItem(k, JSON.stringify(v)); } catch (e) {} }

  function today() { return E.dayStr(new Date()); }
  function getState() { var s = read(KEYS.state, null); var d = E.emptyState(); if (s) for (var k in s) d[k] = s[k]; return d; }
  function saveState(s) { write(KEYS.state, s); }
  function getSettings() { return E.withDefaults(CUR, read(KEYS.settings, null)); }
  function saveSettings(s) { write(KEYS.settings, s); }
  function getHistory() { return read(KEYS.history, []); }
  function log(ev) {
    var h = getHistory();
    h.push(ev);
    if (h.length > 3000) h = h.slice(h.length - 3000);
    write(KEYS.history, h);
  }

  // Recalcule le planning. Ce qui était prévu un jour passé et pas fait est journalisé « manqué »
  // (une fois), puis replanifié par le moteur — jamais recopié sur plusieurs jours.
  function recompute(opts) {
    opts = opts || {};
    var t = opts.today || today();
    var state = getState(), settings = getSettings();
    var prev = read(KEYS.plan, null);
    if (prev && prev.today && prev.today < t) {
      var missed = E.detectMissed(prev, state, t);
      var hist = getHistory(), seen = {};
      hist.forEach(function (h) { if (h.ev === 'missed') seen[h.id + '@' + h.date] = 1; });
      missed.forEach(function (m) { if (!seen[m.id + '@' + m.date]) log({ t: new Date().toISOString(), ev: 'missed', id: m.id, date: m.date }); });
    }
    var plan = E.buildPlan(CUR, state, settings, t, opts.reset ? null : (prev && { today: prev.today, days: prev.days }));
    write(KEYS.plan, { today: t, generatedAt: plan.generatedAt, days: plan.byDate });
    return plan;
  }

  function setActivity(id, s, p) {
    var before = E.statusOf(getState(), id);
    var next = E.setStatus(getState(), id, s, p);
    saveState(next);
    if (before !== s) log({ t: new Date().toISOString(), ev: s, id: id, p: p || null });
  }
  function setMany(ids, s) {
    var st = getState();
    ids.forEach(function (id) { if (E.statusOf(st, id) !== s) { st = E.setStatus(st, id, s); log({ t: new Date().toISOString(), ev: s, id: id }); } });
    saveState(st);
  }
  function updateState(fn) { var s = getState(); fn(s); saveState(s); }
  function updateSettings(fn) { var s = getSettings(); fn(s); saveSettings(s); }

  function toggleRoutine(date, rid, linkedId) {
    updateState(function (s) {
      s.routineLog = s.routineLog || {};
      var d = s.routineLog[date] || (s.routineLog[date] = {});
      if (d[rid]) delete d[rid];
      else d[rid] = linkedId ? { done: true, linked: linkedId } : { done: true };
    });
  }

  root.SchoolStore = {
    KEYS: KEYS, today: today, getState: getState, saveState: saveState, getSettings: getSettings, saveSettings: saveSettings,
    getHistory: getHistory, recompute: recompute, setActivity: setActivity, setMany: setMany,
    updateState: updateState, updateSettings: updateSettings, toggleRoutine: toggleRoutine
  };
})(typeof window !== 'undefined' ? window : globalThis);
