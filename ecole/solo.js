// École OS — Mon planning de révision : la page (liste à cocher + calendrier jusqu'aux examens).
// app.js l'affiche dans la vue « revsolo » et lui passe ses outils (ctx). Les tâches se glissent
// d'un jour à l'autre (souris) ou se placent avec le bouton ⋯ (téléphone).
(function (root) {
  'use strict';

  var P = root.SoloPlan;
  var DAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
  var DAYS_L = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  var MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  var ui = { subject: 'all', todoOnly: false, open: { g: true } };
  var ctx = null;

  function esc(s) { return ctx.esc(s); }
  function subj(id) { return ctx.C.subjects.filter(function (s) { return s.id === id; })[0]; }
  function solo() { return ctx.state.solo || {}; }
  function save(next) { ctx.S.updateState(function (st) { st.solo = next; }); ctx.rerender(); }
  function pay(t) { return ctx.E.rewardMins(t.mins); }
  function short(d) { var x = P.parseDay(d); return DAYS[x.getDay()] + ' ' + x.getDate(); }
  function longDay(d) { var x = P.parseDay(d); return DAYS_L[x.getDay()].toLowerCase() + ' ' + x.getDate() + ' ' + MONTHS[x.getMonth()]; }
  function hm(m) { return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60 < 10 ? '0' : '') + (m % 60) : ''); }
  function exams() { return P.examsOf(ctx.C, ctx.settings); }
  function examOn(d) { return exams().filter(function (x) { return x.date === d; }); }
  function hour(t) { var p = String(t).split(':'); return +p[0] + ' h' + (p[1] !== '00' ? ' ' + p[1] : ''); }

  // ---------------------------------------------------------------- Rendu
  function row(t, inDay) {
    var s = subj(t.subject);
    return '<div class="rs-task' + (t.done ? ' done' : '') + '" draggable="true" data-solo-drag="' + esc(t.id) + '" style="' + ctx.vars(s) + '">' +
      '<button class="stone inline' + (t.done ? ' on' : '') + '" data-a="solo-toggle" data-id="' + esc(t.id) + '" aria-label="' + (t.done ? 'Décocher' : 'Cocher') + '">' + ctx.CHECK + '</button>' +
      '<span class="rs-body">' + (inDay ? '<span class="t-subj">' + esc(s.short) + (t.unitLabel ? ' · ' + esc(t.unitLabel) : '') + '</span>' : '') +
      '<span class="rs-title">' + esc(t.title) + '</span>' +
      '<span class="rs-meta">' + hm(t.mins) + ' · +' + pay(t) + ' $' + (inDay ? '' : ' · ' + (t.date ? '<b>' + short(t.date) + '</b>' : 'à planifier')) + '</span></span>' +
      '<button class="more" data-a="solo-open" data-id="' + esc(t.id) + '" aria-label="Options">⋯</button></div>';
  }

  function listPanel(all) {
    var h = '<div class="rs-filters"><button class="chip-btn' + (ui.subject === 'all' ? ' on' : '') + '" data-a="solo-filter" data-id="all">Tout</button>' +
      P.SUBJECTS.map(function (id) { var s = subj(id); return '<button class="chip-btn' + (ui.subject === id ? ' on' : '') + '" style="' + ctx.vars(s) + '" data-a="solo-filter" data-id="' + id + '"><i class="dot-c"></i>' + esc(s.short) + '</button>'; }).join('') +
      '<button class="chip-btn' + (ui.todoOnly ? ' on' : '') + '" data-a="solo-todo">Seulement à planifier</button></div>';
    h += '<p class="soft-note">Glisse une tâche sur un jour du calendrier, ou touche ⋯ pour choisir son jour.</p>';
    P.SUBJECTS.filter(function (id) { return ui.subject === 'all' || ui.subject === id; }).forEach(function (sid) {
      var s = subj(sid), mine = all.filter(function (t) { return t.subject === sid; });
      var nDone = mine.filter(function (t) { return t.done; }).length;
      h += '<div class="card rs-subj" style="' + ctx.vars(s) + '"><div class="rs-subj-h">' + ctx.ART.symbol(sid, s.color, 26) + '<b>' + esc(s.short) + '</b><span>' + nDone + '/' + mine.length + ' faites</span></div>';
      P.units(ctx.C, sid).concat([{ key: null, label: 'Mes ajouts', title: '' }]).forEach(function (u) {
        var list = mine.filter(function (t) { return t.unit === u.key; });
        if (!list.length) return;
        var shown = ui.todoOnly ? list.filter(function (t) { return !t.date && !t.done; }) : list;
        if (!shown.length) return;
        var k = sid + ':' + u.key, open = ui.open[k] != null ? ui.open[k] : u.key === 'g';
        h += '<details class="rs-unit"' + (open ? ' open' : '') + ' data-solo-unit="' + esc(k) + '"><summary><b>' + esc(u.label) + '</b><span class="rs-ut">' + esc(u.title) + '</span><span class="rs-n">' + list.filter(function (t) { return t.done; }).length + '/' + list.length + '</span></summary>' +
          '<div class="rs-zone">' + shown.map(function (t) { return row(t, false); }).join('') + '</div></details>';
      });
      h += '</div>';
    });
    return h;
  }

  function calendar() {
    var h = '<div class="rs-days">';
    P.days(ctx.C, ctx.settings, ctx.today).forEach(function (d) {
      var list = P.dayTasks(ctx.C, solo(), d), mins = list.reduce(function (n, t) { return n + (t.done ? 0 : t.mins); }, 0);
      var ex = examOn(d), x = P.parseDay(d);
      h += '<div class="wday rs-day' + (d === ctx.today ? ' today' : '') + (ex.length ? ' exam' : '') + '" data-solo-day="' + d + '">' +
        '<div class="wday-h"><b>' + DAYS_L[x.getDay()].toLowerCase() + ' ' + x.getDate() + '</b><span>' + MONTHS[x.getMonth()] + (d === ctx.today ? ' · aujourd’hui' : '') + (list.length ? ' · ' + (mins ? hm(mins) + ' à faire' : 'tout est fait ✿') : '') + '</span></div>' +
        ex.map(function (e) { var s = subj(e.subject); return '<div class="rs-exam" style="' + ctx.vars(s) + '">Examen de ' + esc(s.short) + (e.time ? ' · ' + hour(e.time) : '') + '</div>'; }).join('') +
        '<div class="rs-zone">' + (list.length ? list.map(function (t) { return row(t, true); }).join('') : '<div class="rs-empty">Glisse des tâches ici</div>') + '</div>' +
        '<button class="add-day rs-add" data-a="solo-add" data-date="' + d + '">+ Ajouter</button></div>';
    });
    return h + '</div>';
  }

  // Quand la page se redessine (après un clic ou un déplacement), on garde l'endroit où tu étais :
  // la position de la page et celle de la liste « À cocher » (qui défile à part sur ordinateur).
  var keep = null;
  function render(c) {
    ctx = c;
    var oldList = document.querySelector('.rs-list');
    keep = oldList ? { list: oldList.scrollTop, page: window.scrollY } : null;
    var all = P.tasks(ctx.C, solo()), done = all.filter(function (t) { return t.done; }).length, planned = all.filter(function (t) { return t.date; }).length;
    var h = '<button class="chip-btn" data-a="go" data-view="subjects">' + ctx.ART.icon('back', null, 14) + ' La carte</button>' +
      '<h2 class="title" style="margin-top:12px;">Mon planning de révision</h2>' +
      '<div class="subtitle">Rien que pour toi, privé. Coche ce que tu as fait, puis organise tes journées jusqu’aux examens : chaque tâche cochée rapporte des dollars à ta tirelire.</div>' +
      '<div class="rs-exams">' + exams().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).map(function (e) { var s = subj(e.subject); return '<span class="t-subj" style="' + ctx.vars(s) + '">' + esc(s.short) + ' · ' + longDay(e.date) + (e.time ? ' · ' + hour(e.time) : '') + '</span>'; }).join('') + '</div>' +
      '<div class="rs-stats"><div><b>' + done + '/' + all.length + '</b>tâches faites</div><div><b>' + planned + '</b>placées sur un jour</div><div><b>' + ctx.money(P.earned(solo())) + '</b>gagnés en révision</div></div>';
    h += '<div class="rs-layout"><section class="rs-list" data-solo-day="">' + '<div class="section-h"><h3>À cocher</h3></div>' + listPanel(all) + '</section>' +
      '<section class="rs-cal"><div class="section-h"><h3>Mon calendrier</h3><span class="aside">jusqu’au ' + longDay(P.days(ctx.C, ctx.settings, ctx.today).slice(-1)[0]) + '</span></div>' + calendar() + '</section></div>';
    if (Object.keys(P.norm(solo()).removed).length) h += '<p class="soft-note" style="margin-top:14px;">' + Object.keys(P.norm(solo()).removed).length + ' tâche(s) supprimée(s). <a href="#" class="btn-link" data-a="solo-restore">Les remettre</a></p>';
    return h;
  }

  // ---------------------------------------------------------------- Fenêtres
  function dayChips(sel) {
    return '<div class="rs-pick"><button data-day="" class="' + (!sel ? 'on' : '') + '">Pas de jour</button>' +
      P.days(ctx.C, ctx.settings, ctx.today).map(function (d) { return '<button data-day="' + d + '" class="' + (sel === d ? 'on' : '') + '">' + (d === ctx.today ? 'Aujourd’hui' : short(d)) + '</button>'; }).join('') + '</div>';
  }
  function openTask(id) {
    var t = P.tasks(ctx.C, solo()).filter(function (x) { return x.id === id; })[0]; if (!t) return;
    var s = subj(t.subject), day = t.date;
    var h = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;' + ctx.vars(s) + '"><span class="pill subj">' + esc(s.short) + (t.unitLabel ? ' · ' + esc(t.unitLabel) : '') + '</span><span class="pill money">+' + pay(t) + ' $</span></div>' +
      '<h3>' + esc(t.title) + '</h3>' + (t.unitTitle ? '<div class="s-sub">' + esc(t.unitTitle) + '</div>' : '') +
      '<div class="field"><label>Nom de la tâche</label><input class="inp" id="rstitle" value="' + esc(t.title) + '">' + (t.originalTitle ? '<small>Nom d’origine : ' + esc(t.originalTitle) + '. Vide la case pour le retrouver.</small>' : '') + '</div>' +
      '<div class="field"><label>Quel jour ?</label>' + dayChips(day) + '</div>' +
      '<div class="sheet-actions"><button class="btn soft" data-x="del" style="margin-right:auto;color:#B35A6E;">Supprimer</button><button class="btn soft" data-x="close">Annuler</button><button class="btn" data-x="save">Enregistrer</button></div>';
    ctx.sheet(h, function (r) {
      r.querySelectorAll('[data-day]').forEach(function (b) { b.onclick = function () { day = b.dataset.day || null; r.querySelectorAll('[data-day]').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
      r.querySelector('[data-x="close"]').onclick = ctx.closeSheet;
      r.querySelector('[data-x="del"]').onclick = function () {
        var before = solo(); ctx.closeSheet(); save(P.remove(solo(), id));
        ctx.toast('Tâche supprimée', function () { save(before); });
      };
      r.querySelector('[data-x="save"]').onclick = function () {
        var next = P.rename(ctx.C, solo(), id, r.querySelector('#rstitle').value.trim());
        if (day !== t.date) next = P.move(ctx.C, next, id, day);
        ctx.closeSheet(); save(next); ctx.toast(day && day !== t.date ? 'Placée ' + longDay(day) : 'Enregistré');
      };
    });
  }
  function openAdd(date) {
    var first = ui.subject !== 'all' ? ui.subject : P.SUBJECTS[0];
    function unitOpts(sid) { return '<option value="">Aucune semaine en particulier</option>' + P.units(ctx.C, sid).map(function (u) { return '<option value="' + u.key + '">' + esc(u.label) + (u.title && u.key !== 'g' ? ' — ' + esc(u.title.slice(0, 40)) : '') + '</option>'; }).join(''); }
    var h = '<div class="s-title">Ajouter une tâche</div><div class="s-sub">' + (date ? longDay(date) : 'Dans ta liste') + '</div>' +
      '<div class="field"><label>Ce que je fais</label><input class="inp" id="rsnew" placeholder="ex. Refaire le midterm 2025"></div>' +
      '<div class="field"><label>Matière</label><select class="inp" id="rssub">' + P.SUBJECTS.map(function (id) { return '<option value="' + id + '"' + (id === first ? ' selected' : '') + '>' + esc(subj(id).short) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>Semaine</label><select class="inp" id="rsunit">' + unitOpts(first) + '</select></div>' +
      '<div class="field"><label>Durée (minutes)</label><input class="inp" id="rsmins" type="number" min="5" step="5" value="30"><small>5 $ jusqu’à 20 min, 7 $ jusqu’à 40 min, 10 $ au-delà.</small></div>' +
      '<div class="sheet-actions"><button class="btn soft" data-x="close">Annuler</button><button class="btn" data-x="save">Ajouter</button></div>';
    ctx.sheet(h, function (r) {
      r.querySelector('#rssub').onchange = function () { r.querySelector('#rsunit').innerHTML = unitOpts(this.value); };
      r.querySelector('[data-x="close"]').onclick = ctx.closeSheet;
      r.querySelector('[data-x="save"]').onclick = function () {
        var title = r.querySelector('#rsnew').value.trim();
        if (!title) { r.querySelector('#rsnew').focus(); return; }
        var next = P.add(ctx.C, solo(), { subject: r.querySelector('#rssub').value, unit: r.querySelector('#rsunit').value || null, title: title, mins: +r.querySelector('#rsmins').value || 30 }, date);
        ctx.closeSheet(); save(next); ctx.toast('Ajoutée' + (date ? ' · ' + longDay(date) : ''));
      };
    });
  }

  // ---------------------------------------------------------------- Clics
  function click(a, t, c) {
    ctx = c;
    var id = t.dataset.id;
    switch (a) {
      case 'solo-toggle': {
        var x = P.tasks(ctx.C, solo()).filter(function (y) { return y.id === id; })[0]; if (!x) return true;
        if (!x.done) { ctx.petals(t); ctx.toast('+' + pay(x) + ' $ dans ta tirelire'); }
        var next = P.toggle(solo(), id, ctx.today, pay(x));
        setTimeout(function () { save(next); }, x.done ? 0 : 280);
        return true;
      }
      case 'solo-open': openTask(id); return true;
      case 'solo-add': openAdd(t.dataset.date || null); return true;
      case 'solo-filter': ui.subject = id; ctx.render(); return true;
      case 'solo-todo': ui.todoOnly = !ui.todoOnly; ctx.render(); return true;
      case 'solo-restore': save(P.restoreAll(solo())); ctx.toast('Tâches remises dans ta liste'); return true;
    }
    return false;
  }

  // ---------------------------------------------------------------- Glisser-déposer (une seule fois)
  var dragId = null, bound = false;
  function zoneOf(el) { return el && el.closest ? el.closest('[data-solo-day]') : null; }
  function indexIn(zone, y) {
    var rows = [].slice.call(zone.querySelectorAll('[data-solo-drag]')).filter(function (r) { return r.dataset.soloDrag !== dragId && zoneOf(r) === zone; });
    for (var i = 0; i < rows.length; i++) { var b = rows[i].getBoundingClientRect(); if (y < b.top + b.height / 2) return i; }
    return rows.length;
  }
  function mount(c) {
    ctx = c;
    if (keep) {
      var list = document.querySelector('.rs-list');
      if (list) list.scrollTop = keep.list;
      window.scrollTo(0, keep.page);
      keep = null;
    }
    document.querySelectorAll('[data-solo-unit]').forEach(function (d) { d.addEventListener('toggle', function () { ui.open[d.dataset.soloUnit] = d.open; }); });
    if (bound) return;
    bound = true;
    document.addEventListener('dragstart', function (e) {
      var r = e.target.closest && e.target.closest('[data-solo-drag]'); if (!r) return;
      dragId = r.dataset.soloDrag; r.classList.add('dragging');
      try { e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed = 'move'; } catch (x) {}
    });
    document.addEventListener('dragend', function () {
      dragId = null;
      document.querySelectorAll('.dragging, .drop-on').forEach(function (x) { x.classList.remove('dragging', 'drop-on'); });
    });
    document.addEventListener('dragover', function (e) {
      if (!dragId) return;
      var z = zoneOf(e.target); if (!z) return;
      e.preventDefault();
      document.querySelectorAll('.drop-on').forEach(function (x) { if (x !== z) x.classList.remove('drop-on'); });
      z.classList.add('drop-on');
    });
    document.addEventListener('drop', function (e) {
      if (!dragId) return;
      var z = zoneOf(e.target); if (!z) return;
      e.preventDefault();
      var date = z.dataset.soloDay || null, id = dragId, cur = P.tasks(ctx.C, solo()).filter(function (t) { return t.id === id; })[0];
      if (!date && cur && !cur.date) return;   // déjà dans la liste
      save(P.move(ctx.C, solo(), id, date, date ? indexIn(z, e.clientY) : null));
      if (cur && date !== cur.date) ctx.toast(date ? 'Placée ' + longDay(date) : 'Remise dans la liste');
    });
  }

  // Résumé pour la carte : ce qui est prévu aujourd'hui.
  function summary(c) {
    ctx = c;
    var all = P.tasks(ctx.C, solo()), d = all.filter(function (t) { return t.date === ctx.today; });
    return { today: d.length, todayDone: d.filter(function (t) { return t.done; }).length, done: all.filter(function (t) { return t.done; }).length, total: all.length };
  }

  root.SoloView = { render: render, click: click, mount: mount, summary: summary };
})(typeof window !== 'undefined' ? window : globalThis);
