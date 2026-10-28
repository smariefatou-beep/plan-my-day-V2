// Bloc « École » du Daily Planning de Plan the Day. Il affiche les mêmes fiches que École OS
// (aucune copie dans planner_events) : cocher ici coche partout.
(function () {
  'use strict';
  var S = window.SchoolStore, E = window.SchoolEngine, C = window.SCHOOL_CURRICULUM;
  if (!S || !E || !C) return;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var KIND = { deadline: 'Échéance', current: 'Cours', catchup: 'Rattrapage', seminar: 'En classe', optional: 'Facultatif' };

  window.renderSchoolToday = function (dateObj) {
    var el = document.getElementById('myday-school-wrap');
    if (!el) return;
    var date = E.dayStr(dateObj || new Date());
    var plan = S.recompute(), state = S.getState();
    var day = plan.days.filter(function (d) { return d.date === date; })[0];
    if (!day) { el.innerHTML = ''; return; }
    var items = day.items.filter(function (it) { return plan.acts[it.id]; });
    var mins = items.reduce(function (s, it) { return s + (it.inClass ? 0 : it.mins); }, 0);
    var rlog = (state.routineLog || {})[date] || {};
    var routines = day.routines.filter(function (r) { return r.kind !== 'class'; });

    var h = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
      '<div class="section-title" style="margin-bottom:0;">École · ' + items.length + ' tâche' + (items.length > 1 ? 's' : '') + (mins ? ' · ' + mins + ' min' : '') + '</div>' +
      '<a href="ecole/index.html" style="color:var(--navy);font-size:12px;font-weight:700;text-decoration:none;">Ouvrir École OS →</a></div>';
    if (!items.length && !(day.extras || []).length) h += '<div style="font-size:12px;color:var(--gray-light);padding:6px 0;">Rien de prévu pour l’école ce jour-là.</div>';
    (day.extras || []).forEach(function (x) {
      var s = E.subjectById(C, x.subject) || {};
      h += '<div class="check-item ' + (x.done ? 'checked' : '') + '" data-school-extra="' + esc(x.id) + '" style="border-left:3px solid ' + (s.color || '#B6D39A') + ';padding-left:10px;">' +
        '<div class="check-box"><svg fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div>' +
        '<div style="flex:1;min-width:0;"><div class="check-label">' + esc(x.title) + '</div><div style="font-size:11px;color:var(--gray);margin-top:2px;">' + (s.short ? esc(s.short) + ' · ' : '') + x.mins + ' min · Mon ajout</div></div></div>';
    });
    items.forEach(function (it) {
      var a = plan.acts[it.id], s = E.subjectById(C, a.subject) || {}, done = E.statusOf(state, a.id) === 'done';
      h += '<div class="check-item ' + (done ? 'checked' : '') + '" data-school-act="' + esc(a.id) + '" style="border-left:3px solid ' + (s.color || '#1D2A62') + ';padding-left:10px;">' +
        '<div class="check-box"><svg fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div>' +
        '<div style="flex:1;min-width:0;"><div class="check-label">' + esc(a.title) + '</div>' +
        '<div style="font-size:11px;color:var(--gray);margin-top:2px;">' + esc(s.short || a.subject) + (a.week && a.week < 12 ? ' · S' + a.week : '') + ' · ' + it.mins + ' min · ' + (it.pinned ? 'Choisi par toi' : KIND[it.kind]) + '</div>' +
        '<div style="font-size:11px;color:var(--gray-light);margin-top:1px;">' + esc(it.reason) + '</div></div></div>';
    });
    if (routines.length) {
      // Repliées par défaut pour ne pas repousser la grille horaire du Daily.
      var rDone = routines.filter(function (r) { return rlog[r.id]; }).length;
      h += '<details' + (window.__schoolRoutinesOpen ? ' open' : '') + ' ontoggle="window.__schoolRoutinesOpen=this.open"><summary style="cursor:pointer;font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:0.8px;margin:10px 0 4px;">Routines d’étude · ' + rDone + '/' + routines.length + '</summary>';
      routines.forEach(function (r) {
        var done = !!rlog[r.id];
        h += '<div class="check-item ' + (done ? 'checked' : '') + '" data-school-routine="' + r.id + '">' +
          '<div class="check-box"><svg fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg></div>' +
          '<div style="flex:1;min-width:0;"><div class="check-label">' + esc(r.title) + '</div><div style="font-size:11px;color:var(--gray);margin-top:2px;">' + r.mins + ' min</div></div></div>';
      });
      h += '</details>';
    }
    el.innerHTML = h;
    el.querySelectorAll('[data-school-act]').forEach(function (n) {
      n.onclick = function () {
        var id = n.getAttribute('data-school-act');
        S.setActivity(id, E.statusOf(S.getState(), id) === 'done' ? 'todo' : 'done');
        window.renderSchoolToday(dateObj);
      };
    });
    el.querySelectorAll('[data-school-extra]').forEach(function (n) {
      n.onclick = function () {
        var id = n.getAttribute('data-school-extra');
        S.updateState(function (st) { (st.extras || []).forEach(function (x) { if (x.id === id) x.done = !x.done; }); });
        window.renderSchoolToday(dateObj);
      };
    });
    el.querySelectorAll('[data-school-routine]').forEach(function (n) {
      n.onclick = function () { S.toggleRoutine(date, n.getAttribute('data-school-routine')); window.renderSchoolToday(dateObj); };
    });
  };
})();
