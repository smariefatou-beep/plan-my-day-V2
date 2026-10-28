// École OS — moteur de planification. Logique pure : aucune lecture du DOM ni de localStorage.
// Entrées : curriculum (curriculum.js), state (ta progression), settings (tes préférences), today.
// Sorties : liste d'activités classées, planning sur N jours, statistiques de progression.
// Chargé tel quel par le navigateur (window.SchoolEngine) et par les tests (globalThis).
(function (root) {
  'use strict';

  // ---------------------------------------------------------------- Dates (chaînes 'YYYY-MM-DD', heure locale)
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dayStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseDay(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function addDays(s, n) { var d = parseDay(s); d.setDate(d.getDate() + n); return dayStr(d); }
  function weekday(s) { return parseDay(s).getDay(); }
  function diffDays(a, b) { return Math.round((parseDay(b) - parseDay(a)) / 86400000); }
  var WD = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  function niceDay(s, today) {
    if (today) {
      var d = diffDays(today, s);
      if (d === 0) return 'aujourd’hui';
      if (d === 1) return 'demain';
      if (d === -1) return 'hier';
    }
    var x = parseDay(s);
    return WD[x.getDay()] + ' ' + x.getDate() + ' ' + MONTHS[x.getMonth()];
  }

  // ---------------------------------------------------------------- Réglages par défaut
  // capacity = minutes de travail possibles ce jour-là, routines comprises.
  function defaultSettings(cur) {
    return {
      v: 1,
      capacity: { 0: 270, 1: 240, 2: 210, 3: 210, 4: 300, 5: 300, 6: 270 },
      catchupShare: 0.6,      // part max de la capacité restante donnée au rattrapage quand il y a des cours à préparer
      catchupPerSubject: 120, // minutes max de rattrapage d'une même matière par jour
      horizon: 14,
      timetable: JSON.parse(JSON.stringify(cur.timetable)),
      exams: {},              // assessmentId -> 'YYYY-MM-DD'
      routinesOff: {},        // routineId -> true
      prepDays: {}            // subjectId -> [weekday, …] (remplace les préférences par défaut)
    };
  }
  function withDefaults(cur, settings) {
    var d = defaultSettings(cur), s = settings || {};
    for (var k in s) if (s[k] !== undefined) d[k] = s[k];
    return d;
  }
  function emptyState() {
    return { v: 1, acts: {}, mastery: {}, assessed: {}, custom: [], overrides: {}, routineLog: {} };
  }

  // ---------------------------------------------------------------- Calendrier académique
  function weekStart(cur, n) {
    if (n === 0) return addDays(cur.calendar.weeks[1], -7);
    return cur.calendar.weeks[n] || null;
  }
  // Semaine académique contenant `date` (null avant S1, inBreak pendant une pause).
  function academicWeekOf(cur, date) {
    var best = null;
    for (var n = 1; n <= 11; n++) {
      var ws = cur.calendar.weeks[n];
      if (ws && ws <= date) best = n;
    }
    if (best === null) return null;
    var inBreak = diffDays(cur.calendar.weeks[best], date) >= 7;
    return { n: best, inBreak: inBreak };
  }

  // ---------------------------------------------------------------- Activités
  function subjectById(cur, id) {
    for (var i = 0; i < cur.subjects.length; i++) if (cur.subjects[i].id === id) return cur.subjects[i];
    return null;
  }

  // Liste à plat de toutes les activités, avec leurs dates calculées. Une seule fiche par activité :
  // c'est elle qu'affichent la checklist, la semaine, la journée et le Daily de Plan the Day.
  function activities(cur, state, settings) {
    state = state || emptyState();
    settings = withDefaults(cur, settings);
    var out = [], seq = 0;
    var ov = state.overrides || {};
    function finish(a, subj, wk) {
      var o = ov[a.id] || {};
      var ws = weekStart(cur, wk.n);
      a.subject = subj.id;
      a.week = wk.n;
      a.weekTitle = wk.title;
      a.seq = seq++;
      if (o.mins != null) a.mins = o.mins;
      a.target = ws ? addDays(ws, wk.n === 0 ? 7 : (subj.prepOffset || 0)) : null;
      if (a.dueOffset != null && ws) a.due = addDays(ws, a.dueOffset);
      if (o.due !== undefined) { a.due = o.due || null; a.dueSrc = o.due ? 'Date saisie par toi' : a.dueSrc; }
      if (a.due && a.target && a.target > a.due) a.target = a.due;
      // Mise à disposition : les manuels sont toujours disponibles ; vidéos, tests et devoirs
      // sont supposés publiés le lundi de leur semaine (la semaine d'avant pour un cours du lundi,
      // préparé le jeudi/dimanche précédent). Marque « bloqué » ce qui n'est pas encore en ligne.
      var online = a.type === 'video' || a.type === 'quiz' || a.type === 'assignment' || a.seminar;
      a.release = o.release !== undefined ? o.release :
        (online && ws && wk.n > 0 ? addDays(ws, subj.prepOffset === 0 ? -7 : 0) : null);
      a.seminarDate = null;
      if (a.seminar && ws && wk.n > 0) {
        (settings.timetable || []).forEach(function (t) {
          if (t.subject === subj.id && t.kind === 'seminar' && t.day != null) {
            var d = addDays(ws, (t.day + 6) % 7);
            if (!a.seminarDate || d < a.seminarDate) a.seminarDate = d;
          }
        });
      }
      out.push(a);
    }
    cur.subjects.forEach(function (subj) {
      subj.weeks.forEach(function (wk) {
        wk.activities.forEach(function (raw) {
          var a = {}; for (var k in raw) a[k] = raw[k];
          finish(a, subj, wk);
        });
        (state.custom || []).forEach(function (c) {
          if (c.subject === subj.id && c.week === wk.n) {
            var a = {}; for (var k in c) a[k] = c[k];
            a.custom = true;
            finish(a, subj, wk);
          }
        });
      });
    });
    // Révisions d'examen : générées seulement quand tu as saisi la date de l'évaluation.
    cur.assessments.forEach(function (ex) {
      var date = (settings.exams || {})[ex.id];
      if (!date) return;
      var n = /final/.test(ex.id) ? 4 : (/mid|essay/.test(ex.id) ? 3 : 0);
      for (var k = 1; k <= n; k++) {
        out.push({
          id: 'rev-' + ex.id + '-' + k, type: 'revision', subject: ex.subject, week: null, weekTitle: ex.title,
          title: 'Révision — ' + ex.title + ' (' + k + '/' + n + ')', mins: 45, seq: seq++,
          target: addDays(date, -1), due: addDays(date, -1), dueSrc: 'Avant l’examen du ' + date,
          release: addDays(date, -10), exam: ex.id, prereq: k > 1 ? ['rev-' + ex.id + '-' + (k - 1)] : []
        });
      }
    });
    return out;
  }

  function indexById(list) { var m = {}; list.forEach(function (a) { m[a.id] = a; }); return m; }

  function statusOf(state, id) {
    var r = (state.acts || {})[id];
    return r ? r.s : 'todo';
  }
  function remainingMins(a, state) {
    var r = (state.acts || {})[a.id];
    if (!r || r.s === 'todo' || r.s === 'blocked') return a.mins;
    if (r.s === 'done') return 0;
    return Math.max(5, Math.round(a.mins * (1 - (r.p || 0) / 100)));
  }

  // Catégorie d'une activité à une date donnée. Jamais « en retard » sans vraie échéance :
  //  missed  = échéance réelle dépassée (test fermé ?) → à vérifier, pas replanifié
  //  behind  = semaine prévue passée, sans échéance dépassée → rattrapage
  function classify(a, state, today) {
    var s = statusOf(state, a.id);
    if (s === 'done') return 'done';
    if (a.type === 'class') return a.target && a.target < today ? 'past-class' : 'class';
    if (s === 'blocked' || (a.blocked && s !== 'doing')) return 'blocked';
    if (a.viaRoutine) return 'routine';
    if (a.optional) return 'optional';
    if (a.due && a.due < today) return 'missed';
    if (!a.target) return 'open';
    if (a.target < today) return 'behind';
    var d = diffDays(today, a.target);
    if (d <= 7) return 'current';
    if (d <= 14) return 'upcoming';
    return 'future';
  }

  // ---------------------------------------------------------------- Routines du jour
  function routinesFor(cur, settings, date) {
    var wd = weekday(date), off = settings.routinesOff || {};
    return cur.routines.filter(function (r) { return !off[r.id] && r.days.indexOf(wd) !== -1; });
  }
  function routineMinutes(list) {
    return list.reduce(function (s, r) { return s + (r.kind === 'class' || r.optional ? 0 : r.mins); }, 0);
  }

  // Prochaine activité d'une matière dans l'ordre du syllabus (sert à la routine de maths adaptative).
  function nextInSequence(cur, state, settings, subjectId, today) {
    var list = activities(cur, state, settings).filter(function (a) {
      return a.subject === subjectId && a.type !== 'class' && !a.optional && statusOf(state, a.id) !== 'done' &&
        (!a.release || a.release <= today) && a.week != null;
    });
    list.sort(function (x, y) { return x.seq - y.seq; });
    return list[0] || null;
  }

  // ---------------------------------------------------------------- Planificateur
  var TIER_LABEL = { 1: 'Échéance proche', 2: 'Prochain cours', 3: 'Base pour la suite', 4: 'Rattrapage', 5: 'Révision', 6: 'Facultatif' };

  function buildPlan(cur, state, settings, today, prevPlan) {
    state = state || emptyState();
    settings = withDefaults(cur, settings);
    var H = settings.horizon || 14;
    var acts = activities(cur, state, settings);
    var byId = indexById(acts);
    var subjOf = function (a) { return subjectById(cur, a.subject) || {}; };

    var days = [], dayIdx = {};
    for (var i = 0; i < H; i++) {
      var date = addDays(today, i);
      var rts = routinesFor(cur, settings, date);
      var cap = (settings.capacity || {})[weekday(date)];
      if (cap == null) cap = 180;
      var aw = academicWeekOf(cur, date);
      var day = {
        date: date, weekday: weekday(date), routines: rts, routineMins: routineMinutes(rts),
        capacity: cap, studyCap: Math.max(0, cap - routineMinutes(rts)), load: 0, catchLoad: 0, catchBySubj: {},
        items: [], academicWeek: aw ? aw.n : null, inBreak: aw ? aw.inBreak : false, seminars: []
      };
      days.push(day); dayIdx[date] = i;
    }
    var horizonEnd = days[days.length - 1].date;
    var placedOn = {};   // id -> date
    var conflicts = [];

    var isCandidate = function (a) {
      var c = classify(a, state, today);
      return (c === 'behind' || c === 'current' || c === 'upcoming' || c === 'future' || c === 'open') && remainingMins(a, state) > 0;
    };
    var cls = {};
    acts.forEach(function (a) { cls[a.id] = classify(a, state, today); });

    // Un prérequis bloque tant qu'il est à faire et planifiable mais pas encore placé.
    function prereqReadyBy(a, date) {
      var ps = a.prereq || [];
      for (var i = 0; i < ps.length; i++) {
        var p = byId[ps[i]];
        if (!p) continue;
        var c = cls[p.id];
        if (c === 'done' || c === 'class' || c === 'past-class' || c === 'optional' || c === 'routine' || c === 'missed') continue;
        if (c === 'blocked') return false;
        if (!placedOn[p.id] || placedOn[p.id] > date) return false;
      }
      return true;
    }
    function released(a, date) { return !a.release || a.release <= date; }
    function hasBlockedPrereq(a) {
      return (a.prereq || []).some(function (pid) { var p = byId[pid]; return p && (cls[p.id] === 'blocked' || hasBlockedPrereq(p)); });
    }
    function fits(day, mins, opts) {
      opts = opts || {};
      var free = day.studyCap - day.load;
      if (opts.catchup) {
        var cap = day.studyCap;
        if (opts.limitShare) cap = Math.floor(day.studyCap * settings.catchupShare);
        if (day.catchLoad + mins > cap && !(day.catchLoad === 0 && mins > cap && free >= mins)) return false;
        if ((day.catchBySubj[opts.subject] || 0) + mins > settings.catchupPerSubject && (day.catchBySubj[opts.subject] || 0) > 0) return false;
      }
      return mins <= free || (day.load === 0 && day.studyCap > 0 && mins > day.studyCap);
    }
    function put(a, day, kind, tier, reason, opts) {
      opts = opts || {};
      var mins = remainingMins(a, state);
      var cost = opts.free ? 0 : mins;
      day.items.push({ id: a.id, mins: mins, kind: kind, tier: tier, reason: reason, inClass: !!opts.free });
      day.load += cost;
      if (kind === 'catchup') {
        day.catchLoad += cost;
        day.catchBySubj[a.subject] = (day.catchBySubj[a.subject] || 0) + cost;
      }
      placedOn[a.id] = day.date;
    }
    function windowDays(from, to) {
      var res = [];
      days.forEach(function (d) { if (d.date >= from && d.date <= to) res.push(d); });
      return res;
    }
    // Choisit un jour : d'abord les jours préférés de la matière, sinon le plus tôt possible.
    function pickDay(a, from, to, prefs, fitOpts) {
      var win = windowDays(from, to).filter(function (d) { return released(a, d.date) && prereqReadyBy(a, d.date); });
      var mins = remainingMins(a, state);
      if (prefs && prefs.length) {
        for (var i = 0; i < win.length; i++) if (prefs.indexOf(win[i].weekday) !== -1 && fits(win[i], mins, fitOpts)) return { day: win[i], pref: true };
      }
      for (var j = 0; j < win.length; j++) if (fits(win[j], mins, fitOpts)) return { day: win[j], pref: false };
      return null;
    }
    function prefsFor(a) {
      var s = subjOf(a);
      var custom = (settings.prepDays || {})[a.subject];
      if (a.type === 'quiz' && a.subject === 'EC11') return [6, 5];
      if (a.type === 'assignment' && a.subject === 'MA11') return [6, 0];
      if (a.subject === 'LE11' && a.type === 'video') return [6];
      return custom || s.prepDays || [];
    }
    function labelOf(a) { var s = subjOf(a); return s.short || a.subject; }

    // Place une activité et, avant elle, ses prérequis encore à faire.
    function placeWithPrereqs(a, from, to, kind, tier, reasonFn, depth) {
      if (placedOn[a.id] || !isCandidate(a)) return !!placedOn[a.id];
      if ((depth || 0) > 6) return false;
      (a.prereq || []).forEach(function (pid) {
        var p = byId[pid];
        if (p && isCandidate(p) && !placedOn[p.id]) {
          placeWithPrereqs(p, from, to, kind === 'deadline' ? 'current' : kind, Math.min(tier, 3), function () {
            return 'Prérequis de « ' + shortTitle(a) + ' »';
          }, (depth || 0) + 1);
        }
      });
      var pick = pickDay(a, from, to, prefsFor(a), kind === 'catchup' ? { catchup: true, subject: a.subject, limitShare: true } : null);
      if (!pick) return false;
      put(a, pick.day, kind, tier, reasonFn(pick.day, pick.pref));
      return true;
    }

    // 0) Garder stable ce qui était déjà prévu aujourd'hui (le plan ne se réorganise pas sous tes yeux).
    if (prevPlan && prevPlan.today === today && prevPlan.days && prevPlan.days[today]) {
      prevPlan.days[today].forEach(function (it) {
        var a = byId[it.id];
        if (a && isCandidate(a) && !placedOn[a.id] && released(a, today)) put(a, days[0], it.kind, it.tier, it.reason, { free: it.inClass });
      });
    }

    // 1) Séminaires : les exercices de la matière, pendant le séminaire (temps de cours, pas d'étude).
    days.forEach(function (day) {
      (settings.timetable || []).forEach(function (t) {
        if (t.kind !== 'seminar' || t.day !== day.weekday || day.inBreak || day.academicWeek == null) return;
        var subj = subjectById(cur, t.subject);
        if (!subj) return;
        var sem = acts.filter(function (a) { return a.subject === t.subject && a.seminar && a.week === day.academicWeek; })[0];
        var info = { subject: t.subject, start: t.start, end: t.end, week: day.academicWeek, activity: sem ? sem.id : null, note: null };
        if (!sem) info.note = 'Pas d’exercice de séminaire précis dans le syllabus pour cette semaine.';
        else if (cls[sem.id] === 'done') info.note = 'Exercices déjà faits ✔';
        else if (isCandidate(sem) && !placedOn[sem.id]) {
          (sem.prereq || []).forEach(function (pid) {
            var p = byId[pid];
            if (p && isCandidate(p) && !placedOn[p.id]) {
              placeWithPrereqs(p, today, day.date, 'current', 2, function () {
                return 'À voir avant ton séminaire de ' + subj.short + ' (' + niceDay(day.date, today) + ')';
              });
            }
          });
          if (prereqReadyBy(sem, day.date)) {
            put(sem, day, 'seminar', 2, 'Pendant ton séminaire de ' + subj.short + ' — exercices de la semaine ' + day.academicWeek, { free: true });
          } else {
            info.note = 'Étudie d’abord le cours de la semaine ' + day.academicWeek + ' : les exercices en dépendent.';
          }
        }
        day.seminars.push(info);
      });
    });

    // 2) Échéances réelles dans l'horizon (tests, MyLab, révisions d'examen).
    acts.filter(function (a) { return a.due && a.due >= today && a.due <= horizonEnd && isCandidate(a); })
      .sort(function (x, y) { return x.due < y.due ? -1 : x.due > y.due ? 1 : x.seq - y.seq; })
      .forEach(function (a) {
        var tier = diffDays(today, a.due) <= 3 ? 1 : 2;
        var from = addDays(a.due, -6) > today ? addDays(a.due, -6) : today;
        var ok = placeWithPrereqs(a, from, a.due, 'deadline', tier, function (d, pref) {
          return 'Échéance ' + niceDay(a.due, today) + (pref ? ' · ton créneau habituel' : '');
        });
        if (!ok && !placedOn[a.id] && hasBlockedPrereq(a)) {
          conflicts.push({ id: a.id, date: null, msg: '« ' + shortTitle(a) + ' » (' + labelOf(a) + ', échéance ' + niceDay(a.due, today) + ') attend un contenu marqué « pas encore disponible ». Vérifie Blackboard / MyLab.' });
        } else if (!ok && !placedOn[a.id]) {
          // Pas de place : on le met quand même le jour le moins chargé avant l'échéance, et on le signale.
          var win = windowDays(today, a.due).filter(function (d) { return released(a, d.date); });
          if (win.length) {
            win.sort(function (x, y) { return (x.load - x.studyCap) - (y.load - y.studyCap); });
            put(a, win[0], 'deadline', 1, 'Échéance ' + niceDay(a.due, today) + ' — ajouté malgré une journée pleine');
            conflicts.push({ id: a.id, date: win[0].date, msg: 'Pas assez de temps libre avant l’échéance de « ' + shortTitle(a) + ' » (' + labelOf(a) + ', ' + niceDay(a.due, today) + '). Je l’ai gardé en priorité ; allège ce jour-là ou augmente ta capacité.' });
          } else {
            conflicts.push({ id: a.id, date: null, msg: '« ' + shortTitle(a) + ' » n’est pas encore disponible avant son échéance (' + niceDay(a.due, today) + '). Vérifie sur Blackboard / MyLab.' });
          }
        }
      });

    // 3) Préparation des cours en cours et à venir — jamais repoussée par le rattrapage.
    acts.filter(function (a) { return (cls[a.id] === 'current' || cls[a.id] === 'upcoming') && isCandidate(a) && !placedOn[a.id] && !a.seminar; })
      .sort(function (x, y) { return x.target < y.target ? -1 : x.target > y.target ? 1 : x.seq - y.seq; })
      .forEach(function (a) {
        var s = subjOf(a);
        var end = s.prepOffset === 0 ? addDays(a.target, -1) : a.target;
        if (end < today) end = today;
        // Juste à temps : dans la semaine qui précède l'objectif, pour laisser l'avance au rattrapage.
        var from = addDays(end, -6) > today ? addDays(end, -6) : today;
        var ok = placeWithPrereqs(a, from, end > horizonEnd ? horizonEnd : end, 'current', 2, function (d, pref) {
          return pref ? 'Bloc ' + labelOf(a) + ' du ' + WD[d.weekday] + ' (ta routine) · pour la semaine ' + a.week
            : 'Prépa ' + labelOf(a) + ' semaine ' + a.week + ' · objectif ' + niceDay(a.target, today);
        });
        if (!ok) {
          ok = placeWithPrereqs(a, addDays(end, 1), horizonEnd, 'current', 2, function () {
            return 'Prépa ' + labelOf(a) + ' semaine ' + a.week + ' — pas de place avant l’objectif, au plus tôt après';
          });
        }
      });
    // Séminaires non couverts par l'emploi du temps : à faire comme une prépa normale.
    acts.filter(function (a) { return a.seminar && (cls[a.id] === 'current' || cls[a.id] === 'upcoming') && isCandidate(a) && !placedOn[a.id] && !a.seminarDate; })
      .forEach(function (a) {
        placeWithPrereqs(a, today, a.target < horizonEnd ? (a.target < today ? today : a.target) : horizonEnd, 'current', 2, function () {
          return 'Exercices de séminaire ' + labelOf(a) + ' semaine ' + a.week + ' (ajoute l’horaire du séminaire dans Réglages pour les placer pendant le séminaire)';
        });
      });

    // 4) Rattrapage, réparti sur plusieurs jours et entre les matières.
    var behind = acts.filter(function (a) { return cls[a.id] === 'behind' && isCandidate(a) && !placedOn[a.id]; });
    behind.forEach(function (a) { a._tier = subjOf(a).sequential ? 3 : 4; });
    behind.sort(function (x, y) { return x._tier - y._tier || (x.target < y.target ? -1 : x.target > y.target ? 1 : x.seq - y.seq); });
    // Round-robin par matière pour ne pas faire 5 h de la même chose.
    var queues = {}, order = [];
    behind.forEach(function (a) { if (!queues[a.subject]) { queues[a.subject] = []; order.push(a.subject); } queues[a.subject].push(a); });
    order.sort(function (x, y) { return queues[x][0]._tier - queues[y][0]._tier; });
    days.forEach(function (day) {
      // La prépa des cours est déjà placée : le rattrapage remplit le reste. Les jours qui ont
      // déjà des cours à préparer, il ne prend qu'une part de la capacité, pour garder de l'air.
      var hasCurrentSoon = day.load - day.catchLoad > 0;
      var progress = true;
      while (progress) {
        progress = false;
        for (var q = 0; q < order.length; q++) {
          var queue = queues[order[q]];
          // Garder l'ordre du syllabus : seul le premier élément non placé de chaque matière est candidat…
          for (var k = 0; k < queue.length; k++) {
            var a = queue[k];
            if (placedOn[a.id]) continue;
            if (!released(a, day.date) || !prereqReadyBy(a, day.date)) { if (subjOf(a).sequential) break; continue; }
            if (!fits(day, remainingMins(a, state), { catchup: true, subject: a.subject, limitShare: hasCurrentSoon })) break;
            put(a, day, 'catchup', a._tier, (a._tier === 3 ? 'Rattrapage — base nécessaire pour la suite (' : 'Rattrapage (') + labelOf(a) + ' semaine ' + a.week + ')');
            progress = true;
            break; // …une activité par matière et par tour.
          }
        }
      }
    });

    // 5) Facultatif : seulement s'il n'y a plus de rattrapage en attente et qu'il reste de la place.
    var backlogLeft = behind.some(function (a) { return !placedOn[a.id]; });
    var opts = backlogLeft ? [] : acts.filter(function (a) { return cls[a.id] === 'optional' && remainingMins(a, state) > 0 && !placedOn[a.id]; });
    days.forEach(function (day) {
      if (day.studyCap - day.load < 40) return;
      for (var i = 0; i < opts.length; i++) {
        var a = opts[i];
        if (placedOn[a.id] || !released(a, day.date)) continue;
        if (remainingMins(a, state) <= day.studyCap - day.load) { put(a, day, 'optional', 6, 'Facultatif — il te reste du temps ce jour-là'); break; }
      }
    });

    // Ordre d'affichage dans la journée : échéances, séminaire, cours, rattrapage, facultatif.
    var KORD = { deadline: 0, seminar: 1, current: 2, catchup: 3, optional: 4 };
    days.forEach(function (d) {
      d.items.sort(function (x, y) { return (KORD[x.kind] - KORD[y.kind]) || (x.tier - y.tier) || (byId[x.id].seq - byId[y.id].seq); });
      d.over = d.load > d.studyCap;
      delete d.catchBySubj;
    });

    var unscheduled = [];
    acts.forEach(function (a) {
      if (placedOn[a.id] || !isCandidate(a)) return;
      var c = cls[a.id];
      if (c === 'future') return; // pas encore d'actualité : normal
      var why = !released(a, horizonEnd) ? 'Pas encore disponible' :
        (!prereqReadyBy(a, horizonEnd) ? 'Attend un prérequis' : 'Plus de place sur les ' + H + ' prochains jours');
      unscheduled.push({ id: a.id, why: why, kind: c });
    });

    var missed = acts.filter(function (a) { return cls[a.id] === 'missed'; }).map(function (a) { return a.id; });
    var blocked = acts.filter(function (a) { return cls[a.id] === 'blocked'; }).map(function (a) { return a.id; });

    var snapshot = {};
    days.forEach(function (d) { snapshot[d.date] = d.items.map(function (it) { return { id: it.id, kind: it.kind, tier: it.tier, reason: it.reason, inClass: it.inClass }; }); });

    return { today: today, generatedAt: new Date().toISOString(), days: days, byDate: snapshot, unscheduled: unscheduled, conflicts: conflicts, missed: missed, blocked: blocked, acts: byId };
  }

  function shortTitle(a) { var t = a.title || ''; return t.length > 48 ? t.slice(0, 46) + '…' : t; }

  // Activités prévues un jour passé et pas faites : à journaliser comme « manquées » (sans duplication).
  function detectMissed(prevSnapshot, state, today) {
    var out = [];
    if (!prevSnapshot || !prevSnapshot.days) return out;
    Object.keys(prevSnapshot.days).forEach(function (date) {
      if (date >= today) return;
      prevSnapshot.days[date].forEach(function (it) {
        if (statusOf(state, it.id) !== 'done' && !it.inClass) out.push({ id: it.id, date: date });
      });
    });
    return out;
  }

  // ---------------------------------------------------------------- Progression
  function progress(cur, state, settings, today) {
    state = state || emptyState();
    var acts = activities(cur, state, settings);
    var res = {};
    cur.subjects.forEach(function (s) {
      res[s.id] = { subject: s.id, totalMins: 0, doneMins: 0, total: 0, done: 0, doing: 0, behind: 0, behindMins: 0, missed: 0,
        expectedMins: 0, expectedDoneMins: 0, classesPast: 0, classesDone: 0, weeks: {}, upcoming: [], mastery: null };
    });
    acts.forEach(function (a) {
      var r = res[a.subject]; if (!r) return;
      var c = classify(a, state, today), st = statusOf(state, a.id);
      if (a.type === 'class') {
        if (c === 'past-class' || (c === 'done' && a.target && a.target < today)) { r.classesPast++; if (st === 'done') r.classesDone++; }
        return;
      }
      if (a.optional || a.viaRoutine || a.week == null) {
        if (a.due && c !== 'done' && a.due >= today && diffDays(today, a.due) <= 14) r.upcoming.push(a);
        return;
      }
      var w = r.weeks[a.week] || (r.weeks[a.week] = { totalMins: 0, doneMins: 0, total: 0, done: 0 });
      var doneMins = a.mins - remainingMins(a, state);
      r.total++; w.total++;
      r.totalMins += a.mins; w.totalMins += a.mins;
      r.doneMins += doneMins; w.doneMins += doneMins;
      if (st === 'done') { r.done++; w.done++; }
      if (st === 'doing') r.doing++;
      if (c === 'behind') { r.behind++; r.behindMins += remainingMins(a, state); }
      if (c === 'missed') r.missed++;
      if ((a.target && a.target < today) || (a.due && a.due < today)) { r.expectedMins += a.mins; r.expectedDoneMins += doneMins; }
      if (a.due && c !== 'done' && a.due >= today && diffDays(today, a.due) <= 14) r.upcoming.push(a);
    });
    cur.subjects.forEach(function (s) {
      var r = res[s.id];
      r.pct = r.totalMins ? Math.round(100 * r.doneMins / r.totalMins) : 0;
      r.expectedPct = r.totalMins ? Math.round(100 * r.expectedMins / r.totalMins) : 0;
      r.gapMins = r.expectedMins - r.expectedDoneMins;
      r.status = s.noSyllabus ? 'routine' : (r.gapMins <= 30 ? 'on-track' : (r.gapMins <= 240 ? 'watch' : 'attention'));
      var ms = [];
      s.weeks.forEach(function (w) { var m = (state.mastery || {})[s.id + '-w' + pad(w.n)]; if (m != null) ms.push(m); });
      r.mastery = ms.length ? Math.round(10 * ms.reduce(function (x, y) { return x + y; }, 0) / ms.length) / 10 : null;
      r.masteryCount = ms.length;
      r.upcoming.sort(function (x, y) { return x.due < y.due ? -1 : 1; });
    });
    return res;
  }

  // ---------------------------------------------------------------- Mutations (pures : renvoient un nouvel état)
  function setStatus(state, id, s, p) {
    var next = JSON.parse(JSON.stringify(state || emptyState()));
    next.acts = next.acts || {};
    if (s === 'todo') delete next.acts[id];
    else next.acts[id] = { s: s, p: s === 'doing' ? (p || 0) : (s === 'done' ? 100 : 0), at: new Date().toISOString() };
    return next;
  }

  root.SchoolEngine = {
    dayStr: dayStr, parseDay: parseDay, addDays: addDays, weekday: weekday, diffDays: diffDays, niceDay: niceDay, WD: WD,
    defaultSettings: defaultSettings, withDefaults: withDefaults, emptyState: emptyState,
    weekStart: weekStart, academicWeekOf: academicWeekOf, subjectById: subjectById,
    activities: activities, statusOf: statusOf, remainingMins: remainingMins, classify: classify,
    routinesFor: routinesFor, nextInSequence: nextInSequence,
    buildPlan: buildPlan, detectMissed: detectMissed, progress: progress, setStatus: setStatus, TIER_LABEL: TIER_LABEL
  };
})(typeof window !== 'undefined' ? window : globalThis);
