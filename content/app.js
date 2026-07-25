// Content OS — Application logic (navigation, rendering, CRUD, drag & drop, search)

function esc(s) { return (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function catColor(cat) { const colors = ['pill-pink', 'pill-orange', 'pill-blue']; return colors[hashStr(cat) % 3]; }
function hashStr(s) { let h = 0; for (const c of String(s || '')) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
function fmtDateShort(iso) { if (!iso) return ''; const d = new Date(iso + 'T00:00:00'); return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }); }
function todayISOLocal() { return isoDateLocal(new Date()); }
function isoDateLocal(d) { const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0'); return `${y}-${m}-${day}`; }
function addDays(d, n) { const dt = new Date(d); dt.setDate(dt.getDate() + n); return dt; }
function startOfWeek(d) { const dt = new Date(d); const day = (dt.getDay() + 6) % 7; dt.setDate(dt.getDate() - day); dt.setHours(0, 0, 0, 0); return dt; }
function categoryOptionsHtml(selected) { const s = coGetSettings(); return s.categories.map(c => `<option value="${esc(c)}" ${c === selected ? 'selected' : ''}>${esc(c)}</option>`).join(''); }
function emptyStateHtml(msg) { return `<div class="empty-state" style="grid-column:1/-1;"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="9" y1="9" x2="15" y2="15"/></svg><p>${esc(msg)}</p></div>`; }
function tagListHtml(tags, removeFnName) { return (tags || []).map((t, i) => `<span class="pill pill-neutral">${esc(t)} <span style="cursor:pointer;opacity:.6;" onclick="${removeFnName}(${i})">✕</span></span>`).join(''); }
function detailFieldBlock(label, value) { if (!value) return ''; return `<div class="doc-section"><div class="doc-section-title">${esc(label)}</div><div class="doc-section-body">${esc(value)}</div></div>`; }

// ---------------------------------------------------------------------------
// Workspaces ("comptes")
// ---------------------------------------------------------------------------
function renderWorkspaceSwitcher() {
  const sel = document.getElementById('workspace-select');
  if (!sel) return;
  const workspaces = coGetWorkspaces();
  const active = coGetActiveWorkspaceId();
  sel.innerHTML = workspaces.map(w => `<option value="${w.id}" ${w.id === active ? 'selected' : ''}>${w.emoji || '📁'} ${esc(w.name)}</option>`).join('') + `<option value="__new__">+ Nouveau compte</option>`;
}
function onWorkspaceSelectChange(value) {
  if (value === '__new__') {
    renderWorkspaceSwitcher(); // reset the dropdown's visible value while the modal is open
    openNewWorkspaceModal();
    return;
  }
  coSwitchWorkspace(value);
  location.reload();
}
function openNewWorkspaceModal() {
  document.getElementById('generic-modal-body').innerHTML = `<div class="modal-head"><h2>Nouveau compte</h2><button class="btn-ghost btn-icon" onclick="closeGenericModal()">✕</button></div>
  <div class="field"><label>Nom du compte</label><input class="input" id="modal-ws-name" placeholder="Business, Perso..."></div>
  <div class="field" style="margin-bottom:6px;"><label>Objectif abonnés</label><input type="number" class="input" id="modal-ws-goal" placeholder="Ex: 10000"></div>
  <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;"><button class="btn btn-secondary" onclick="closeGenericModal()">Annuler</button><button class="btn btn-primary" onclick="submitNewWorkspace()">Créer</button></div>`;
  openGenericModal();
}
function submitNewWorkspace() {
  const name = document.getElementById('modal-ws-name').value.trim();
  if (!name) { toast('Le nom est obligatoire'); return; }
  const goal = parseInt(document.getElementById('modal-ws-goal').value || '0', 10);
  const id = coAddWorkspace(name);
  coSwitchWorkspace(id);
  coSaveSettings({ projectName: name, subscriberGoal: goal });
  closeGenericModal();
  location.reload();
}
function renderWorkspacesSettings() {
  const el = document.getElementById('settings-workspaces-list');
  if (!el) return;
  const workspaces = coGetWorkspaces();
  const active = coGetActiveWorkspaceId();
  el.innerHTML = workspaces.map(w => `
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
      <input class="input" style="flex:1;" value="${esc(w.name)}" onchange="renameWorkspace('${w.id}', this.value)">
      ${w.id === active ? '<span class="pill pill-pink">Actif</span>' : `<button class="btn btn-secondary btn-sm" onclick="switchWorkspaceAndReload('${w.id}')">Ouvrir</button>`}
      ${workspaces.length > 1 ? `<button class="btn btn-danger btn-sm" onclick="deleteWorkspace('${w.id}')">Supprimer</button>` : ''}
    </div>`).join('');
}
function renameWorkspace(id, name) { coRenameWorkspace(id, name || 'Sans nom'); renderWorkspaceSwitcher(); toast('Compte renommé'); }
function switchWorkspaceAndReload(id) { coSwitchWorkspace(id); location.reload(); }
function deleteWorkspace(id) {
  if (!confirm('Supprimer ce compte et toutes ses données ? Cette action est irréversible.')) return;
  const ok = coDeleteWorkspace(id);
  if (!ok) { toast('Impossible de supprimer le dernier compte'); return; }
  if (coGetActiveWorkspaceId() !== id) { renderWorkspacesSettings(); renderWorkspaceSwitcher(); toast('Compte supprimé'); }
  else location.reload();
}
function addWorkspaceFromSettings() { openNewWorkspaceModal(); }

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
const TITLES = {
  dashboard: ['Dashboard', "Vue d'ensemble de ta création"],
  rapports: ['Rapports', 'Historique de tes performances hebdomadaires'],
  braindump: ['Brain Dump', 'Capture rapide de toutes tes idées'],
  idees: ["Bibliothèque d'idées", 'Organise et fais évoluer tes idées'],
  calendrier: ['Calendrier', 'Planifie tes publications'],
  pipeline: ['Pipeline', "L'avancement réel de chaque vidéo"],
  videos: ['Vidéos', "De l'idée à la publication"],
  hooks: ['Hooks', 'Ta base de hooks qui performent'],
  createurs: ['Créateurs', "Comprendre ce qui fonctionne"],
  experiences: ['Expériences', 'Teste, apprends, ajuste'],
  parametres: ['Paramètres', 'Réglages de Content OS'],
};

let currentView = 'dashboard';
const RENDERERS = {
  dashboard: renderDashboard, rapports: renderRapports, braindump: renderBrainDump,
  idees: renderIdees, calendrier: renderCalendrier, pipeline: renderPipeline,
  videos: renderVideos, hooks: renderHooks, createurs: renderCreateurs,
  experiences: renderExperiences, parametres: renderParametres,
};

function showView(name, navEl) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById('view-' + name);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = navEl || document.querySelector('.nav-item[data-view="' + name + '"]');
  if (nav) nav.classList.add('active');

  currentView = name;
  const meta = TITLES[name];
  if (meta) {
    document.getElementById('topbar-title').textContent = meta[0];
    document.getElementById('topbar-subtitle').textContent = meta[1];
  }
  if (RENDERERS[name]) RENDERERS[name]();
}
function refreshCurrentView() { if (RENDERERS[currentView]) RENDERERS[currentView](); }
// After a delete/duplicate: leave the full-page detail view (the record it showed may be gone), otherwise just re-render in place.
function afterListMutation(viewName) {
  closeGenericModal();
  if (currentView === 'detail-page') showView(viewName, document.querySelector('.nav-item[data-view="' + viewName + '"]'));
  else refreshCurrentView();
}
// After editing an existing record: if its full-page detail view is open, refresh it in place; otherwise re-render the current list.
function afterSave(type, id) {
  closeGenericModal();
  if (id && currentView === 'detail-page') DETAIL_PAGE_RENDERERS[type](id);
  else refreshCurrentView();
}

// ---------------------------------------------------------------------------
// Full-page "document" detail views (idée / hook / créateur / rapport / expérience)
// ---------------------------------------------------------------------------
const DETAIL_PAGE_RENDERERS = { idea: renderIdeaDetailPage, hook: renderHookDetailPage, creator: renderCreatorDetailPage, report: renderReportDetailPage, experiment: renderExperimentDetailPage };
const DETAIL_PAGE_LISTVIEW = { idea: 'idees', hook: 'hooks', creator: 'createurs', report: 'rapports', experiment: 'experiences' };
let detailReturnView = 'dashboard';
function openDetailPage(type, id) {
  detailReturnView = DETAIL_PAGE_LISTVIEW[type];
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-detail-page').classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.querySelector('.nav-item[data-view="' + detailReturnView + '"]');
  if (nav) nav.classList.add('active');
  currentView = 'detail-page';
  DETAIL_PAGE_RENDERERS[type](id);
}
function closeDetailPage() { showView(detailReturnView, document.querySelector('.nav-item[data-view="' + detailReturnView + '"]')); }

function openCreateForCurrentView() {
  const map = { braindump: () => openIdeaModal(), idees: () => openIdeaModal(), calendrier: () => openIdeaModal(), pipeline: () => openVideoQuickModal(), videos: () => openVideoQuickModal(), 'video-detail': () => openVideoQuickModal(), hooks: () => openHookModal(), createurs: () => openCreatorModal(), experiences: () => openExperimentModal(), rapports: () => openReportModal() };
  const fn = map[currentView];
  if (fn) fn(); else toast('Choisis une section pour créer un élément');
}

// Mobile-only "Plus" menu — clones whatever's tucked out of the bottom bar (and the sidebar footer)
// so the list always matches the real nav, nothing to keep in sync by hand.
function openMobileMoreMenu() {
  const hiddenItems = document.querySelectorAll('.sidebar-nav .nav-mobile-hidden');
  const footerItems = document.querySelectorAll('.sidebar-footer .nav-item');
  const rowStyle = 'padding:13px 10px;flex-direction:row!important;justify-content:flex-start;text-align:left;font-size:14px;gap:14px;border-radius:10px;';
  let html = '<div class="modal-head"><h2>Plus</h2><button class="btn-ghost btn-icon" onclick="closeGenericModal()">✕</button></div><div style="display:flex;flex-direction:column;gap:2px;">';
  hiddenItems.forEach(item => {
    html += `<div class="nav-item" style="${rowStyle}" onclick="closeGenericModal();${item.getAttribute('onclick')}">${item.innerHTML}</div>`;
  });
  html += '<div class="nav-divider" style="display:block;"></div>';
  footerItems.forEach(item => {
    html += `<div class="nav-item" style="${rowStyle}" onclick="closeGenericModal();${item.getAttribute('onclick')}">${item.innerHTML}</div>`;
  });
  html += '</div>';
  document.getElementById('generic-modal-body').innerHTML = html;
  openGenericModal();
}

// ---------------------------------------------------------------------------
// Generic modal
// ---------------------------------------------------------------------------
function openGenericModal() { document.getElementById('generic-modal-overlay').classList.add('active'); }
function closeGenericModal() { document.getElementById('generic-modal-overlay').classList.remove('active'); document.getElementById('generic-modal-body').innerHTML = ''; }

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
function openSearch() {
  document.getElementById('search-overlay').classList.add('active');
  const input = document.getElementById('search-input');
  if (input) { input.value = ''; renderSearchResults(''); setTimeout(() => input.focus(), 30); }
}
function closeSearch() { document.getElementById('search-overlay').classList.remove('active'); }

function renderSearchResults(query) {
  const q = (query || '').trim().toLowerCase();
  const container = document.getElementById('search-results-container');
  if (!q) { container.innerHTML = '<div class="empty-state" style="padding:30px;"><p>Commence à écrire pour chercher.</p></div>'; return; }
  const groups = [];
  const ideaMatches = IdeasStore.getAll().filter(i => (i.title + ' ' + (i.description || '')).toLowerCase().includes(q));
  if (ideaMatches.length) groups.push(['Idées', ideaMatches.map(i => ({ label: i.title, prio: i.priority, action: `closeSearch();openIdeaDetail('${i.id}')` }))]);
  const videoMatches = VideosStore.getAll().filter(v => v.title.toLowerCase().includes(q));
  if (videoMatches.length) groups.push(['Vidéos', videoMatches.map(v => ({ label: v.title, prio: v.priority, action: `closeSearch();showView('videos');openVideoDetail('${v.id}')` }))]);
  const hookMatches = HooksStore.getAll().filter(h => h.text.toLowerCase().includes(q));
  if (hookMatches.length) groups.push(['Hooks', hookMatches.map(h => ({ label: h.text, action: `closeSearch();openHookDetail('${h.id}')` }))]);
  const creatorMatches = CreatorsStore.getAll().filter(c => (c.name || '').toLowerCase().includes(q));
  if (creatorMatches.length) groups.push(['Créateurs', creatorMatches.map(c => ({ label: c.name, action: `closeSearch();openCreatorDetail('${c.id}')` }))]);
  const expMatches = ExperimentsStore.getAll().filter(e => e.title.toLowerCase().includes(q));
  if (expMatches.length) groups.push(['Expériences', expMatches.map(e => ({ label: e.title, action: `closeSearch();openExperimentDetail('${e.id}')` }))]);
  const reportMatches = ReportsStore.getAll().filter(r => ((r.week || '') + ' ' + (r.comment || '')).toLowerCase().includes(q));
  if (reportMatches.length) groups.push(['Rapports', reportMatches.map(r => ({ label: r.week, action: `closeSearch();openReportDetail('${r.id}')` }))]);

  if (!groups.length) { container.innerHTML = '<div class="empty-state" style="padding:30px;"><p>Aucun résultat.</p></div>'; return; }
  container.innerHTML = groups.map(([label, items]) => `
    <div class="search-group-label">${label}</div>
    ${items.slice(0, 6).map(it => `<div class="search-result-row" onclick="${it.action}">${it.prio ? `<span class="prio-dot ${it.prio}"></span>` : ''}${esc(it.label)}<span class="r-type">${label.slice(0, -1)}</span></div>`).join('')}
  `).join('');
}

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
  if (e.key === 'Escape') { closeSearch(); closeGenericModal(); }
});

function toast(message) {
  const stack = document.getElementById('toast-stack');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span>' + esc(message) + '</span>';
  stack.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// ---------------------------------------------------------------------------
// Drag & drop helpers
// ---------------------------------------------------------------------------
function onIdeaDragStart(e, id) { e.dataTransfer.setData('text/plain', id); }
function onVideoDragStart(e, id) { e.dataTransfer.setData('text/plain', id); }

// ---------------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------------
function renderDashboard() {
  const settings = coGetSettings();
  const reports = ReportsStore.getAll().slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = reports[reports.length - 1];
  const current = latest ? latest.subscribers : 0;
  const goal = settings.subscriberGoal || 0;
  const pct = goal ? Math.min(100, Math.round(current / goal * 100)) : 0;

  document.getElementById('dash-date').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('dash-current').textContent = current.toLocaleString('fr-FR');
  document.getElementById('dash-goal-text').textContent = '/ ' + goal.toLocaleString('fr-FR') + ' abonnés';
  document.getElementById('dash-progress-fill').style.width = pct + '%';
  document.getElementById('dash-progress-pct').textContent = pct + "% de l'objectif";
  document.getElementById('dash-week-delta').textContent = latest ? ((latest.subscriberDelta >= 0 ? '+' : '') + latest.subscriberDelta + ' cette semaine') : 'Ajoute un rapport';

  const goalReached = goal > 0 && current >= goal;
  document.getElementById('dash-goal-banner-wrap').innerHTML = goalReached
    ? `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--pink-50);border-radius:var(--radius-sm);padding:12px 14px;margin-top:14px;">
        <span style="font-size:12.5px;font-weight:600;color:var(--pink-text);">🎉 Objectif atteint !</span>
        <button class="btn btn-primary btn-sm" onclick="openNewGoalModal()">Définir un nouvel objectif</button>
      </div>`
    : '';

  document.getElementById('dash-stat-subscribers').textContent = current.toLocaleString('fr-FR');
  document.getElementById('dash-stat-videos').textContent = VideosStore.getAll().filter(v => v.stage === 'published').length;
  document.getElementById('dash-stat-ideas').textContent = IdeasStore.getAll().length;
  document.getElementById('dash-stat-scheduled').textContent = VideosStore.getAll().filter(v => v.stage === 'scheduled').length;
  document.getElementById('dash-stat-experiments').textContent = ExperimentsStore.getAll().length;

  renderChartBars('chart-subscribers', reports.map(r => r.subscribers));
  renderChartBars('chart-views', reports.map(r => r.views));
}
function openNewGoalModal() {
  const current = coGetSettings().subscriberGoal || 0;
  document.getElementById('generic-modal-body').innerHTML = `<div class="modal-head"><h2>Nouvel objectif</h2><button class="btn-ghost btn-icon" onclick="closeGenericModal()">✕</button></div>
  <div class="field" style="margin-bottom:14px;"><label>Nouvel objectif abonnés</label><input type="number" class="input" id="modal-new-goal" value="${current * 2 || 1000}"></div>
  <div style="display:flex;gap:10px;justify-content:flex-end;"><button class="btn btn-secondary" onclick="closeGenericModal()">Plus tard</button><button class="btn btn-primary" onclick="submitNewGoal()">Enregistrer</button></div>`;
  openGenericModal();
}
function submitNewGoal() {
  const val = parseInt(document.getElementById('modal-new-goal').value || '0', 10);
  if (val > 0) { coSaveSettings({ subscriberGoal: val }); toast('Nouvel objectif défini'); }
  closeGenericModal();
  renderDashboard();
}
function renderChartBars(containerId, values) {
  const el = document.getElementById(containerId);
  if (!values.length) { el.innerHTML = '<div class="empty-state" style="padding:20px;width:100%;"><p>Ajoute un rapport pour voir ce graphique.</p></div>'; return; }
  const max = Math.max(...values, 1);
  el.innerHTML = values.map(v => `<div class="chart-bar" style="height:${Math.max(6, Math.round(v / max * 100))}%;" title="${v}"></div>`).join('');
}

// ---------------------------------------------------------------------------
// IDEAS — Brain Dump & Bibliothèque (shared 3-column-by-priority layout)
// ---------------------------------------------------------------------------
let braindumpState = { search: '', category: '__all__' };
let ideesState = { search: '', category: '__all__', status: '__all__' };

function renderChips(containerId, keys, active, onclickFnName, labelFn) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = keys.map(k => `<div class="filter-chip ${k === active ? 'active' : ''}" onclick="${onclickFnName}('${k}')">${esc(labelFn(k))}</div>`).join('');
}

function ideaCardHtml(idea) {
  const subtasks = idea.subtasks || [];
  const done = subtasks.filter(s => s.done).length;
  return `<div class="card card-hover" draggable="true" ondragstart="onIdeaDragStart(event,'${idea.id}')" onclick="openIdeaDetail('${idea.id}')">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <span class="pill ${catColor(idea.category)}">${esc(idea.category || '—')}</span>
      <span class="status-badge status-${idea.status === 'in_progress' ? 'progress' : idea.status}">${(STATUSES.find(s => s.key === idea.status) || {}).label || ''}</span>
    </div>
    <div style="font-size:14px;font-weight:700;margin-bottom:6px;">${esc(idea.title)}</div>
    ${idea.description ? `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">${esc(idea.description)}</div>` : ''}
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div class="subtask-progress">${subtasks.length ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>${done}/${subtasks.length} sous-tâches` : ''}</div>
      ${idea.plannedDate ? `<span style="font-size:11px;color:var(--text-tertiary);">${fmtDateShort(idea.plannedDate)}</span>` : ''}
    </div>
  </div>`;
}

// Read-only "finished" full-page view of an idea — the default when clicking a card.
function openIdeaDetail(id) { openDetailPage('idea', id); }
function renderIdeaDetailPage(id) {
  const idea = IdeasStore.get(id);
  const root = document.getElementById('detail-page-root');
  if (!idea) { root.innerHTML = emptyStateHtml('Idée introuvable.'); return; }
  document.getElementById('topbar-title').textContent = idea.title;
  document.getElementById('topbar-subtitle').textContent = 'Idée';
  const subtasks = idea.subtasks || [];
  const done = subtasks.filter(s => s.done).length;
  root.innerHTML = `
    <div class="back-link" onclick="closeDetailPage()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>Retour</div>
    <div class="doc-shell">
      <div class="doc-title">${esc(idea.title)}</div>
      <div class="doc-meta">
        <span class="prio-dot ${idea.priority}"></span>
        <span class="pill ${catColor(idea.category)}">${esc(idea.category || '—')}</span>
        <span class="status-badge status-${idea.status === 'in_progress' ? 'progress' : idea.status}">${(STATUSES.find(s => s.key === idea.status) || {}).label || ''}</span>
        ${idea.plannedDate ? `<span class="pill pill-blue">📅 ${fmtDateShort(idea.plannedDate)}</span>` : ''}
      </div>
      ${idea.description ? `<div class="doc-section"><div class="doc-section-body">${esc(idea.description)}</div></div>` : ''}
      ${idea.link ? `<div class="doc-section"><a href="${esc(idea.link)}" target="_blank" class="pill pill-neutral">🔗 Ouvrir le lien</a></div>` : ''}
      ${subtasks.length ? `<div class="doc-section"><div class="doc-section-title">Sous-tâches (${done}/${subtasks.length})</div>${subtasks.map(s => `<div class="checkline"><input type="checkbox" ${s.done ? 'checked' : ''} onchange="toggleIdeaSubtaskLive('${idea.id}','${s.id}',this.checked)"><span class="${s.done ? 'done' : ''}">${esc(s.text)}</span></div>`).join('')}</div>` : ''}
      <div class="doc-section">
        <div class="doc-section-title">Historique</div>
        <div class="doc-section-body" style="font-size:12.5px;color:var(--text-tertiary);">${(idea.history || []).length ? idea.history.slice().reverse().map(h => `<div>${fmtDateShort(h.date.slice(0, 10))} — ${esc(h.event)}</div>`).join('') : 'Aucun historique.'}</div>
      </div>
      <div class="doc-section" style="display:flex;align-items:center;gap:8px;">
        <input type="date" class="input" id="idea-detail-move-date" style="width:150px;" value="${idea.plannedDate || ''}">
        <button class="btn btn-secondary btn-sm" onclick="moveIdeaToCalendarFromDetail('${idea.id}')">Planifier</button>
      </div>
      <div class="doc-actions">
        <button class="btn btn-danger btn-sm" onclick="deleteIdea('${idea.id}')">Supprimer</button>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-secondary btn-sm" onclick="duplicateIdea('${idea.id}')">Dupliquer</button>
          <button class="btn btn-secondary btn-sm" onclick="transformIdeaToVideo('${idea.id}')">${idea.videoId ? 'Voir la vidéo' : 'Transformer en vidéo'}</button>
          <button class="btn btn-primary btn-sm" onclick="openIdeaModal('${idea.id}')">Modifier</button>
        </div>
      </div>
    </div>`;
}
function toggleIdeaSubtaskLive(ideaId, subtaskId, done) {
  const idea = IdeasStore.get(ideaId);
  const subtasks = idea.subtasks.map(s => s.id === subtaskId ? { ...s, done } : s);
  IdeasStore.update(ideaId, { subtasks });
  renderIdeaDetailPage(ideaId);
}
function moveIdeaToCalendarFromDetail(id) {
  const val = document.getElementById('idea-detail-move-date').value;
  if (!val) { toast('Choisis une date'); return; }
  IdeasStore.update(id, { plannedDate: val, status: 'planned' });
  toast('Idée planifiée le ' + fmtDateShort(val));
  showView('calendrier', document.querySelector('.nav-item[data-view="calendrier"]'));
}

function renderIdeaColumns(containerId, opts) {
  let ideas = IdeasStore.getAll();
  const q = (opts.search || '').toLowerCase();
  if (q) ideas = ideas.filter(i => (i.title + ' ' + (i.description || '')).toLowerCase().includes(q));
  if (opts.category && opts.category !== '__all__') ideas = ideas.filter(i => i.category === opts.category);
  if (opts.status && opts.status !== '__all__') ideas = ideas.filter(i => i.status === opts.status);

  const cols = PRIORITIES.map(p => {
    const items = ideas.filter(i => i.priority === p.key).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return `<div class="priority-col">
      <div class="priority-col-head"><span class="prio-dot ${p.key}"></span><span>${p.short}</span><span class="count">${items.length}</span></div>
      <div class="priority-col-body">${items.map(ideaCardHtml).join('') || '<div class="empty-col-hint">Aucune idée ici.</div>'}</div>
    </div>`;
  }).join('');
  document.getElementById(containerId).innerHTML = `<div class="priority-columns">${cols}</div>`;
}

function setBraindumpCategory(c) { braindumpState.category = c; renderBrainDump(); }
function onBraindumpSearch(v) { braindumpState.search = v; renderBrainDump(); }
function renderBrainDump() {
  const settings = coGetSettings();
  renderChips('braindump-category-chips', ['__all__', ...settings.categories], braindumpState.category, 'setBraindumpCategory', k => k === '__all__' ? 'Toutes' : k);
  renderIdeaColumns('braindump-columns', braindumpState);
}

function setIdeesCategory(c) { ideesState.category = c; renderIdees(); }
function setIdeesStatus(s) { ideesState.status = s; renderIdees(); }
function onIdeesSearch(v) { ideesState.search = v; renderIdees(); }
function renderIdees() {
  const settings = coGetSettings();
  renderChips('idees-status-chips', ['__all__', ...STATUSES.map(s => s.key)], ideesState.status, 'setIdeesStatus', k => k === '__all__' ? 'Toutes' : STATUSES.find(s => s.key === k).label);
  renderChips('idees-category-chips', ['__all__', ...settings.categories], ideesState.category, 'setIdeesCategory', k => k === '__all__' ? 'Toutes catégories' : k);
  renderIdeaColumns('idees-columns', ideesState);
}

// Idea create/edit modal
let modalEditingIdeaId = null;
let modalSubtasks = [];
let modalPriority = 'green';

function openIdeaModal(id) {
  modalEditingIdeaId = id || null;
  const idea = id ? IdeasStore.get(id) : null;
  modalSubtasks = idea ? JSON.parse(JSON.stringify(idea.subtasks || [])) : [];
  modalPriority = idea ? idea.priority : 'green';
  document.getElementById('generic-modal-body').innerHTML = ideaModalTemplate(idea);
  renderModalSubtasks();
  openGenericModal();
}
function ideaModalTemplate(idea) {
  const isEdit = !!idea;
  return `<div class="modal-head"><h2>${isEdit ? "Modifier l'idée" : 'Nouvelle idée'}</h2><button class="btn-ghost btn-icon" onclick="closeGenericModal()">✕</button></div>
  <div class="field"><label>Titre</label><input class="input" id="modal-idea-title" value="${esc(idea ? idea.title : '')}" placeholder="Le titre de ton idée"></div>
  <div class="field"><label>Description</label><textarea class="textarea" id="modal-idea-desc" style="min-height:60px;">${esc(idea ? idea.description : '')}</textarea></div>
  <div class="field"><label>Lien</label><input class="input" id="modal-idea-link" value="${esc(idea ? idea.link : '')}" placeholder="TikTok, article, podcast..."></div>
  <div class="field-row">
    <div class="field"><label>Catégorie</label><select class="input" id="modal-idea-category">${categoryOptionsHtml(idea ? idea.category : null)}</select></div>
    <div class="field"><label>Date prévue</label><input type="date" class="input" id="modal-idea-date" value="${idea && idea.plannedDate ? idea.plannedDate : ''}"></div>
  </div>
  ${isEdit ? `<div class="field"><label>Statut</label><select class="input" id="modal-idea-status">${STATUSES.map(s => `<option value="${s.key}" ${idea.status === s.key ? 'selected' : ''}>${s.label}</option>`).join('')}</select></div>` : ''}
  <div class="field"><label>Priorité</label><div class="filter-bar" id="modal-priority-buttons" style="margin:0;">${PRIORITIES.map(p => `<div class="filter-chip ${p.key === modalPriority ? 'active' : ''}" data-p="${p.key}" onclick="setModalPriority('${p.key}')"><span class="prio-dot ${p.key}"></span>${p.short}</div>`).join('')}</div></div>
  <div class="field" style="margin-bottom:${isEdit ? '10px' : '4px'};"><label>Sous-tâches</label>
    <div id="modal-subtasks-list"></div>
    <div style="display:flex;gap:6px;margin-top:8px;"><input class="input" id="modal-subtask-input" placeholder="Ajouter une sous-tâche..." style="flex:1;" onkeydown="if(event.key==='Enter'){addModalSubtask();event.preventDefault();}"><button class="btn btn-secondary btn-sm" onclick="addModalSubtask()">Ajouter</button></div>
  </div>
  ${isEdit ? `
  <div class="field" style="border-top:1px solid var(--border);padding-top:16px;">
    <label>Actions</label>
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
      <button class="btn btn-secondary btn-sm" onclick="duplicateIdea('${idea.id}')">Dupliquer</button>
      <button class="btn btn-secondary btn-sm" onclick="transformIdeaToVideo('${idea.id}')">${idea.videoId ? 'Voir la vidéo' : 'Transformer en vidéo'}</button>
      <input type="date" class="input" id="modal-idea-move-date" style="width:150px;">
      <button class="btn btn-secondary btn-sm" onclick="moveIdeaToCalendar('${idea.id}')">Planifier</button>
    </div>
  </div>
  ${idea.history && idea.history.length ? `<div class="field" style="margin-bottom:0;"><label>Historique</label><div style="font-size:12px;color:var(--text-tertiary);">${idea.history.slice().reverse().map(h => `<div>${fmtDateShort(h.date.slice(0, 10))} — ${esc(h.event)}</div>`).join('')}</div></div>` : ''}
  ` : ''}
  <div style="display:flex;gap:10px;justify-content:${isEdit ? 'space-between' : 'flex-end'};margin-top:18px;">
    ${isEdit ? `<button class="btn btn-danger" onclick="deleteIdea('${idea.id}')">Supprimer</button>` : '<span></span>'}
    <div style="display:flex;gap:10px;"><button class="btn btn-secondary" onclick="closeGenericModal()">Annuler</button><button class="btn btn-primary" onclick="submitIdeaModal()">Enregistrer</button></div>
  </div>`;
}
function setModalPriority(p) { modalPriority = p; document.querySelectorAll('#modal-priority-buttons .filter-chip').forEach(b => b.classList.toggle('active', b.dataset.p === p)); }
function renderModalSubtasks() {
  const el = document.getElementById('modal-subtasks-list');
  if (!el) return;
  el.innerHTML = modalSubtasks.map(s => `<div class="checkline"><input type="checkbox" ${s.done ? 'checked' : ''} onchange="toggleModalSubtask('${s.id}', this.checked)"><span class="${s.done ? 'done' : ''}" style="flex:1;">${esc(s.text)}</span><button class="btn-ghost btn-sm" onclick="removeModalSubtask('${s.id}')">✕</button></div>`).join('') || '<div style="font-size:12px;color:var(--text-tertiary);padding:6px 0;">Aucune sous-tâche.</div>';
}
function addModalSubtask() { const input = document.getElementById('modal-subtask-input'); const text = input.value.trim(); if (!text) return; modalSubtasks.push({ id: coGenId(), text, done: false }); input.value = ''; renderModalSubtasks(); }
function toggleModalSubtask(id, done) { modalSubtasks = modalSubtasks.map(s => s.id === id ? { ...s, done } : s); renderModalSubtasks(); }
function removeModalSubtask(id) { modalSubtasks = modalSubtasks.filter(s => s.id !== id); renderModalSubtasks(); }

function submitIdeaModal() {
  const title = document.getElementById('modal-idea-title').value.trim();
  if (!title) { toast('Le titre est obligatoire'); return; }
  const payload = {
    title,
    description: document.getElementById('modal-idea-desc').value.trim(),
    link: document.getElementById('modal-idea-link').value.trim(),
    category: document.getElementById('modal-idea-category').value,
    priority: modalPriority,
    plannedDate: document.getElementById('modal-idea-date').value || null,
    subtasks: modalSubtasks,
  };
  if (modalEditingIdeaId) {
    const statusEl = document.getElementById('modal-idea-status');
    if (statusEl) payload.status = statusEl.value;
    IdeasStore.update(modalEditingIdeaId, payload);
    toast('Idée mise à jour');
  } else {
    payload.status = 'todo';
    payload.history = [{ date: new Date().toISOString(), event: 'Idée créée' }];
    payload.videoId = null;
    IdeasStore.add(payload);
    toast('Idée enregistrée');
  }
  afterSave('idea', modalEditingIdeaId);
}
function deleteIdea(id) { if (!confirm('Supprimer cette idée ?')) return; IdeasStore.remove(id); toast('Idée supprimée'); afterListMutation('idees'); }
function duplicateIdea(id) {
  const idea = IdeasStore.get(id); if (!idea) return;
  const copy = Object.assign({}, idea);
  delete copy.id; delete copy.createdAt; delete copy.updatedAt;
  copy.title = idea.title + ' (copie)';
  copy.subtasks = (idea.subtasks || []).map(s => ({ ...s, id: coGenId() }));
  copy.history = [{ date: new Date().toISOString(), event: 'Dupliquée' }];
  copy.videoId = null;
  IdeasStore.add(copy);
  toast('Idée dupliquée'); afterListMutation('idees');
}
function moveIdeaToCalendar(id) {
  const val = document.getElementById('modal-idea-move-date').value;
  if (!val) { toast('Choisis une date'); return; }
  IdeasStore.update(id, { plannedDate: val, status: 'planned' });
  closeGenericModal();
  toast('Idée planifiée le ' + fmtDateShort(val));
  showView('calendrier', document.querySelector('.nav-item[data-view="calendrier"]'));
}
function transformIdeaToVideo(ideaId) {
  const idea = IdeasStore.get(ideaId); if (!idea) return;
  if (idea.videoId) { closeGenericModal(); showView('videos', document.querySelector('.nav-item[data-view="videos"]')); openVideoDetail(idea.videoId); return; }
  const v = VideosStore.add({
    title: idea.title, category: idea.category, priority: idea.priority, plannedDate: idea.plannedDate, publishedDate: null, stage: 'idea', ideaId: idea.id,
    hook: '', script: idea.description || '', storyline: [],
    plans: (idea.subtasks || []).map(s => ({ id: coGenId(), text: s.text, done: s.done })),
    materiel: [], cta: '', notes: '',
    checklist: { hook: false, script: false, filmed: false, edited: false, subtitles: false, published: false },
  });
  IdeasStore.update(ideaId, { videoId: v.id, status: 'planned', history: [...(idea.history || []), { date: new Date().toISOString(), event: 'Transformée en vidéo' }] });
  closeGenericModal();
  toast('Vidéo créée à partir de l\'idée');
  showView('pipeline', document.querySelector('.nav-item[data-view="pipeline"]'));
}

// ---------------------------------------------------------------------------
// CALENDAR
// ---------------------------------------------------------------------------
let calState = { view: 'week', date: new Date() };

function renderCalendrier() {
  updateCalToolbarButtons();
  renderCalUnscheduled();
  renderCalAllIdeas();
  if (calState.view === 'week') renderCalWeek();
  else if (calState.view === 'day') renderCalDay();
  else renderCalMonth();
}
function updateCalToolbarButtons() { document.querySelectorAll('.cal-toolbar-views button').forEach(b => b.classList.toggle('active', b.dataset.view === calState.view)); }
function setCalView(v) { calState.view = v; renderCalendrier(); }
function calPrev() {
  if (calState.view === 'week') calState.date = addDays(calState.date, -7);
  else if (calState.view === 'day') calState.date = addDays(calState.date, -1);
  else calState.date = new Date(calState.date.getFullYear(), calState.date.getMonth() - 1, 1);
  renderCalendrier();
}
function calNext() {
  if (calState.view === 'week') calState.date = addDays(calState.date, 7);
  else if (calState.view === 'day') calState.date = addDays(calState.date, 1);
  else calState.date = new Date(calState.date.getFullYear(), calState.date.getMonth() + 1, 1);
  renderCalendrier();
}
function calToday() { calState.date = new Date(); renderCalendrier(); }
function calGoToDay(key) { calState.date = new Date(key + 'T00:00:00'); calState.view = 'day'; renderCalendrier(); }

function renderCalUnscheduled() {
  const list = IdeasStore.getAll().filter(i => !i.plannedDate);
  document.getElementById('cal-unscheduled-list').innerHTML = list.map(i => `<div class="mini-idea-card" draggable="true" ondragstart="onIdeaDragStart(event,'${i.id}')" onclick="openIdeaDetail('${i.id}')"><div class="title">${esc(i.title)}</div><div class="meta"><span class="prio-dot ${i.priority}"></span><span class="pill ${catColor(i.category)}">${esc(i.category || '—')}</span></div></div>`).join('') || '<div class="empty-col-hint">Toutes les idées sont planifiées.</div>';
}
function renderCalAllIdeas() {
  const list = IdeasStore.getAll();
  document.getElementById('cal-all-ideas-list').innerHTML = list.map(i => `<div class="mini-idea-card" draggable="true" ondragstart="onIdeaDragStart(event,'${i.id}')" onclick="openIdeaDetail('${i.id}')"><div class="title">${esc(i.title)}</div><div class="meta"><span class="prio-dot ${i.priority}"></span><span class="pill ${catColor(i.category)}">${esc(i.category || '—')}</span>${i.plannedDate ? `<span style="margin-left:auto;font-size:10px;color:var(--text-tertiary);">${fmtDateShort(i.plannedDate)}</span>` : ''}</div></div>`).join('') || '<div class="empty-col-hint">Aucune idée.</div>';
}
function onCalendarDayDrop(e, dateKey) {
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain'); if (!id) return;
  const idea = IdeasStore.get(id); if (!idea) return;
  IdeasStore.update(id, { plannedDate: dateKey, status: idea.status === 'todo' ? 'planned' : idea.status });
  toast('Idée planifiée le ' + fmtDateShort(dateKey));
  renderCalendrier();
}

function renderCalWeek() {
  const start = startOfWeek(calState.date);
  const days = [...Array(7)].map((_, i) => addDays(start, i));
  document.getElementById('cal-range-label').textContent = `${days[0].getDate()} – ${days[6].getDate()} ${days[6].toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
  const dayNames = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
  const todayStr = todayISOLocal();
  const ideas = IdeasStore.getAll();
  const html = `<div class="cal-week-grid">` + days.map((d, i) => {
    const key = isoDateLocal(d);
    const isToday = key === todayStr;
    const events = ideas.filter(idea => idea.plannedDate === key);
    return `<div class="cal-day ${isToday ? 'today' : ''}" ondragover="event.preventDefault()" ondrop="onCalendarDayDrop(event,'${key}')">
      <div class="cal-day-head">${dayNames[i]} ${d.getDate()}${isToday ? " · Aujourd'hui" : ''}</div>
      ${events.map(e => `<div class="cal-event" onclick="openIdeaDetail('${e.id}')">${esc(e.title)}</div>`).join('')}
    </div>`;
  }).join('') + `</div>`;
  document.getElementById('cal-grid').innerHTML = html;
}
function renderCalDay() {
  const d = calState.date;
  document.getElementById('cal-range-label').textContent = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const key = isoDateLocal(d);
  const events = IdeasStore.getAll().filter(i => i.plannedDate === key);
  document.getElementById('cal-grid').innerHTML = `<div class="card" ondragover="event.preventDefault()" ondrop="onCalendarDayDrop(event,'${key}')" style="min-height:300px;">
    <div style="font-size:12px;font-weight:700;color:var(--text-tertiary);margin-bottom:14px;text-transform:uppercase;">Prévu ce jour</div>
    ${events.length ? events.map(e => `<div class="list-row" style="cursor:pointer;" onclick="openIdeaDetail('${e.id}')"><span class="prio-dot ${e.priority}" style="margin-right:10px;"></span><div class="title">${esc(e.title)}</div><span class="pill ${catColor(e.category)}">${esc(e.category || '—')}</span></div>`).join('') : '<div class="empty-col-hint">Aucune idée prévue. Glisse une idée ici depuis la colonne Brain Dump.</div>'}
  </div>`;
}
function renderCalMonth() {
  const d = calState.date;
  const year = d.getFullYear(), month = d.getMonth();
  document.getElementById('cal-range-label').textContent = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const gridStart = startOfWeek(new Date(year, month, 1));
  const todayStr = todayISOLocal();
  const ideas = IdeasStore.getAll();
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const day = addDays(gridStart, i);
    const key = isoDateLocal(day);
    const inMonth = day.getMonth() === month;
    const isToday = key === todayStr;
    const events = ideas.filter(idea => idea.plannedDate === key);
    cells += `<div class="cal-day-cell-month ${inMonth ? '' : 'dim'} ${isToday ? 'today' : ''}" ondragover="event.preventDefault()" ondrop="onCalendarDayDrop(event,'${key}')" onclick="calGoToDay('${key}')">
      <div class="cal-month-daynum">${day.getDate()}</div>
      ${events.slice(0, 3).map(e => `<div class="cal-month-event" onclick="event.stopPropagation();openIdeaDetail('${e.id}')">${esc(e.title)}</div>`).join('')}
      ${events.length > 3 ? `<div style="font-size:10px;color:var(--text-tertiary);">+${events.length - 3} autres</div>` : ''}
    </div>`;
  }
  document.getElementById('cal-grid').innerHTML = `<div class="cal-month-grid">${cells}</div>`;
}


// ---------------------------------------------------------------------------
// PIPELINE
// ---------------------------------------------------------------------------
function renderPipeline() {
  const videos = VideosStore.getAll();
  document.getElementById('pipeline-board').innerHTML = STAGES.map(stage => {
    const items = videos.filter(v => v.stage === stage.key).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return `<div class="pipeline-col">
      <div class="pipeline-col-head"><span class="name">${stage.label}</span><span class="count">${items.length}</span></div>
      <div class="pipeline-col-body" ondragover="event.preventDefault()" ondrop="onPipelineDrop(event,'${stage.key}')">${items.map(pipelineCardHtml).join('')}</div>
    </div>`;
  }).join('');
}
function pipelineCardHtml(v) {
  return `<div class="pipeline-card" draggable="true" ondragstart="onVideoDragStart(event,'${v.id}')" onclick="openVideoDetail('${v.id}')">
    <div class="title">${esc(v.title)}</div>
    <div class="meta-row"><span class="prio-dot ${v.priority}"></span><span class="date">${v.plannedDate ? fmtDateShort(v.plannedDate) : (v.publishedDate ? fmtDateShort(v.publishedDate) : '—')}</span></div>
  </div>`;
}
function onPipelineDrop(e, stageKey) {
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain'); if (!id) return;
  const v = VideosStore.get(id); if (!v) return;
  const patch = { stage: stageKey };
  if (stageKey === 'published' && !v.publishedDate) patch.publishedDate = todayISOLocal();
  VideosStore.update(id, patch);
  toast('Déplacé vers « ' + STAGES.find(s => s.key === stageKey).label + ' »');
  renderPipeline();
}

// ---------------------------------------------------------------------------
// VIDEOS + FICHE VIDÉO
// ---------------------------------------------------------------------------
let videosState = { status: '__all__' };
function setVideosStatus(s) { videosState.status = s; renderVideos(); }
function stageBadgeClass(stage) { if (stage === 'published') return 'status-done'; if (stage === 'scheduled') return 'status-planned'; if (stage === 'idea') return 'status-todo'; return 'status-progress'; }
function renderVideos() {
  renderChips('videos-status-chips', ['__all__', ...STAGES.map(s => s.key)], videosState.status, 'setVideosStatus', k => k === '__all__' ? 'Toutes' : STAGES.find(s => s.key === k).label);
  let videos = VideosStore.getAll();
  if (videosState.status !== '__all__') videos = videos.filter(v => v.stage === videosState.status);
  document.getElementById('videos-grid').innerHTML = videos.map(videoCardHtml).join('') || emptyStateHtml('Aucune vidéo pour ce filtre.');
}
function videoCardHtml(v) {
  return `<div class="card card-hover" onclick="openVideoDetail('${v.id}')">
    <div class="status-badge ${stageBadgeClass(v.stage)}" style="margin-bottom:10px;display:inline-block;">${STAGES.find(s => s.key === v.stage).label}</div>
    <div style="font-size:13.5px;font-weight:700;margin-bottom:6px;">${esc(v.title)}</div>
    <div class="pill ${catColor(v.category)}" style="margin-bottom:10px;">${esc(v.category || '—')}</div>
    <div style="font-size:11.5px;color:var(--text-tertiary);">${v.publishedDate ? fmtDateShort(v.publishedDate) : (v.plannedDate ? fmtDateShort(v.plannedDate) : 'Pas encore planifiée')}</div>
  </div>`;
}

function openVideoQuickModal() {
  modalPriority = 'green';
  document.getElementById('generic-modal-body').innerHTML = `<div class="modal-head"><h2>Nouvelle vidéo</h2><button class="btn-ghost btn-icon" onclick="closeGenericModal()">✕</button></div>
  <div class="field"><label>Titre</label><input class="input" id="modal-video-title" placeholder="Le titre de ta vidéo"></div>
  <div class="field-row">
    <div class="field"><label>Catégorie</label><select class="input" id="modal-video-category">${categoryOptionsHtml(null)}</select></div>
    <div class="field"><label>Date prévue</label><input type="date" class="input" id="modal-video-date"></div>
  </div>
  <div class="field" style="margin-bottom:6px;"><label>Priorité</label><div class="filter-bar" id="modal-priority-buttons" style="margin:0;">${PRIORITIES.map(p => `<div class="filter-chip ${p.key === modalPriority ? 'active' : ''}" data-p="${p.key}" onclick="setModalPriority('${p.key}')"><span class="prio-dot ${p.key}"></span>${p.short}</div>`).join('')}</div></div>
  <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;"><button class="btn btn-secondary" onclick="closeGenericModal()">Annuler</button><button class="btn btn-primary" onclick="submitVideoQuickModal()">Créer</button></div>`;
  openGenericModal();
}
function submitVideoQuickModal() {
  const title = document.getElementById('modal-video-title').value.trim();
  if (!title) { toast('Le titre est obligatoire'); return; }
  const v = VideosStore.add({ title, category: document.getElementById('modal-video-category').value, priority: modalPriority, plannedDate: document.getElementById('modal-video-date').value || null, publishedDate: null, stage: 'idea', ideaId: null, hook: '', script: '', storyline: [], plans: [], materiel: [], cta: '', notes: '', checklist: { hook: false, script: false, filmed: false, edited: false, subtitles: false, published: false } });
  closeGenericModal();
  toast('Vidéo créée');
  showView('videos', document.querySelector('.nav-item[data-view="videos"]'));
  openVideoDetail(v.id);
}

let currentVideoDetailId = null;
RENDERERS['video-detail'] = renderVideoDetail;
function openVideoDetail(id) {
  currentVideoDetailId = id;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-video-detail').classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.querySelector('.nav-item[data-view="videos"]'); if (nav) nav.classList.add('active');
  currentView = 'video-detail';
  const v = VideosStore.get(id);
  document.getElementById('topbar-title').textContent = 'Fiche vidéo';
  document.getElementById('topbar-subtitle').textContent = v ? v.title : '';
  renderVideoDetail();
}
function backToVideos() { showView('videos', document.querySelector('.nav-item[data-view="videos"]')); }

function openVideoInfoModal(id) {
  const v = VideosStore.get(id);
  modalPriority = v.priority;
  document.getElementById('generic-modal-body').innerHTML = `<div class="modal-head"><h2>Modifier les infos</h2><button class="btn-ghost btn-icon" onclick="closeGenericModal()">✕</button></div>
  <div class="field"><label>Titre</label><input class="input" id="modal-video-info-title" value="${esc(v.title)}"></div>
  <div class="field-row">
    <div class="field"><label>Catégorie</label><select class="input" id="modal-video-info-category">${categoryOptionsHtml(v.category)}</select></div>
    <div class="field"><label>Étape</label><select class="input" id="modal-video-info-stage">${STAGES.map(s => `<option value="${s.key}" ${s.key === v.stage ? 'selected' : ''}>${s.label}</option>`).join('')}</select></div>
  </div>
  <div class="field"><label>Date prévue</label><input type="date" class="input" id="modal-video-info-date" value="${v.plannedDate || ''}"></div>
  <div class="field" style="margin-bottom:6px;"><label>Priorité</label><div class="filter-bar" id="modal-priority-buttons" style="margin:0;">${PRIORITIES.map(p => `<div class="filter-chip ${p.key === modalPriority ? 'active' : ''}" data-p="${p.key}" onclick="setModalPriority('${p.key}')"><span class="prio-dot ${p.key}"></span>${p.short}</div>`).join('')}</div></div>
  <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;"><button class="btn btn-secondary" onclick="closeGenericModal()">Annuler</button><button class="btn btn-primary" onclick="submitVideoInfoModal('${id}')">Enregistrer</button></div>`;
  openGenericModal();
}
function submitVideoInfoModal(id) {
  VideosStore.update(id, {
    title: document.getElementById('modal-video-info-title').value.trim() || 'Sans titre',
    category: document.getElementById('modal-video-info-category').value,
    stage: document.getElementById('modal-video-info-stage').value,
    plannedDate: document.getElementById('modal-video-info-date').value || null,
    priority: modalPriority,
  });
  closeGenericModal();
  toast('Infos mises à jour');
  renderVideoDetail();
}
function renderVideoDetail() {
  const v = VideosStore.get(currentVideoDetailId);
  const root = document.getElementById('video-detail-root');
  if (!v) { root.innerHTML = emptyStateHtml('Vidéo introuvable.'); return; }
  root.innerHTML = `
    <div class="back-link" onclick="backToVideos()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>Retour aux vidéos</div>
    <div class="doc-shell doc-wide">
      <div class="doc-title" style="margin-bottom:8px;">${esc(v.title)}</div>
      <div class="doc-meta">
        <span class="status-badge ${stageBadgeClass(v.stage)}">${STAGES.find(s => s.key === v.stage).label}</span>
        <span class="pill ${catColor(v.category)}">${esc(v.category || '—')}</span>
        <span class="prio-dot ${v.priority}"></span>
      </div>
      <div style="display:flex;gap:8px;margin:-14px 0 24px;">
        <button class="btn btn-secondary btn-sm" onclick="openVideoInfoModal('${v.id}')">Modifier les infos</button>
        <button class="btn btn-danger btn-sm" onclick="deleteVideoFromDetail('${v.id}')">Supprimer</button>
      </div>
      <div class="doc-paper">
        <div class="sheet-layout">
          <div>
            <div class="doc-section"><div class="doc-section-title">Hook</div><textarea class="textarea doc-input" style="min-height:50px;" oninput="updateVideoField('${v.id}','hook',this.value,false)">${esc(v.hook)}</textarea></div>
            <div class="doc-section"><div class="doc-section-title">Script</div><textarea class="textarea doc-input" style="min-height:160px;" oninput="updateVideoField('${v.id}','script',this.value,false)">${esc(v.script)}</textarea></div>
            <div class="doc-section"><div class="doc-section-title">Storyline</div>${storylineHtml(v)}</div>
            <div class="doc-section"><div class="doc-section-title">Plans</div>${plansHtml(v)}</div>
            <div class="doc-section"><div class="doc-section-title">CTA</div><input class="input doc-input" value="${esc(v.cta)}" oninput="updateVideoField('${v.id}','cta',this.value,false)"></div>
            <div class="doc-section"><div class="doc-section-title">Notes</div><textarea class="textarea doc-input" style="min-height:80px;" oninput="updateVideoField('${v.id}','notes',this.value,false)">${esc(v.notes)}</textarea></div>
          </div>
          <div>
            <div class="doc-section"><div class="doc-section-title">Checklist</div>${checklistHtml(v)}</div>
            <div class="doc-section"><div class="doc-section-title">Matériel</div>${materielHtml(v)}</div>
            <div class="doc-section"><div class="doc-section-title">Statistiques</div><div style="font-size:13px;color:var(--text-tertiary);">Disponible après publication (V2).</div></div>
          </div>
        </div>
      </div>
    </div>`;
}
function updateVideoField(id, field, value, needsFullRerender) {
  VideosStore.update(id, { [field]: value });
  if (field === 'title') document.getElementById('topbar-subtitle').textContent = value;
  if (needsFullRerender) renderVideoDetail();
}
function deleteVideoFromDetail(id) { if (!confirm('Supprimer cette vidéo ?')) return; VideosStore.remove(id); toast('Vidéo supprimée'); backToVideos(); }

function checklistHtml(v) {
  const items = [['hook', 'Hook validé'], ['script', 'Script terminé'], ['filmed', 'Vidéo tournée'], ['edited', 'Montage terminé'], ['subtitles', 'Sous-titres'], ['published', 'Publication']];
  return items.map(([k, label]) => `<div class="checkline"><input type="checkbox" ${v.checklist && v.checklist[k] ? 'checked' : ''} onchange="toggleVideoChecklist('${v.id}','${k}',this.checked)"><span class="${v.checklist && v.checklist[k] ? 'done' : ''}">${label}</span></div>`).join('');
}
function toggleVideoChecklist(id, key, checked) {
  const v = VideosStore.get(id);
  const cl = Object.assign({}, v.checklist, { [key]: checked });
  const patch = { checklist: cl };
  if (key === 'published' && checked) { patch.stage = 'published'; patch.publishedDate = v.publishedDate || todayISOLocal(); toast('Vidéo marquée comme publiée 🎉'); }
  VideosStore.update(id, patch);
  renderVideoDetail();
}
function plansHtml(v) {
  const rows = (v.plans || []).map(p => `<div class="checkline"><input type="checkbox" ${p.done ? 'checked' : ''} onchange="togglePlan('${v.id}','${p.id}',this.checked)"><span class="${p.done ? 'done' : ''}" style="flex:1;">${esc(p.text)}</span><button class="btn-ghost btn-sm" onclick="removePlan('${v.id}','${p.id}')">✕</button></div>`).join('');
  return rows + `<div style="display:flex;gap:6px;margin-top:10px;"><input class="input" id="new-plan-input" placeholder="Ajouter un plan..." style="flex:1;" onkeydown="if(event.key==='Enter'){addPlan('${v.id}');event.preventDefault();}"><button class="btn btn-secondary btn-sm" onclick="addPlan('${v.id}')">Ajouter</button></div>`;
}
function addPlan(id) { const input = document.getElementById('new-plan-input'); const text = input.value.trim(); if (!text) return; const v = VideosStore.get(id); VideosStore.update(id, { plans: [...(v.plans || []), { id: coGenId(), text, done: false }] }); renderVideoDetail(); }
function togglePlan(id, planId, done) { const v = VideosStore.get(id); VideosStore.update(id, { plans: v.plans.map(p => p.id === planId ? { ...p, done } : p) }); }
function removePlan(id, planId) { const v = VideosStore.get(id); VideosStore.update(id, { plans: v.plans.filter(p => p.id !== planId) }); renderVideoDetail(); }

function storylineHtml(v) {
  const rows = (v.storyline || []).map((s, i) => `<div class="plan-row"><span class="pill pill-neutral">${i + 1}</span><span style="flex:1;">${esc(s.text)}</span><button class="btn-ghost btn-sm" onclick="removeStoryline('${v.id}','${s.id}')">✕</button></div>`).join('');
  return rows + `<div style="display:flex;gap:6px;margin-top:10px;"><input class="input" id="new-storyline-input" placeholder="Ajouter une étape..." style="flex:1;" onkeydown="if(event.key==='Enter'){addStoryline('${v.id}');event.preventDefault();}"><button class="btn btn-secondary btn-sm" onclick="addStoryline('${v.id}')">Ajouter</button></div>`;
}
function addStoryline(id) { const input = document.getElementById('new-storyline-input'); const text = input.value.trim(); if (!text) return; const v = VideosStore.get(id); VideosStore.update(id, { storyline: [...(v.storyline || []), { id: coGenId(), text }] }); renderVideoDetail(); }
function removeStoryline(id, sid) { const v = VideosStore.get(id); VideosStore.update(id, { storyline: v.storyline.filter(s => s.id !== sid) }); renderVideoDetail(); }

function materielHtml(v) {
  return `<div class="tag-input-row">${tagListHtml(v.materiel, 'removeMateriel')}</div>
  <div style="display:flex;gap:6px;margin-top:10px;"><input class="input" id="new-materiel-input" placeholder="Ajouter..." style="flex:1;" onkeydown="if(event.key==='Enter'){addMateriel('${v.id}');event.preventDefault();}"><button class="btn btn-secondary btn-sm" onclick="addMateriel('${v.id}')">Ajouter</button></div>`;
}
function addMateriel(id) { const input = document.getElementById('new-materiel-input'); const val = input.value.trim(); if (!val) return; const v = VideosStore.get(id); VideosStore.update(id, { materiel: [...(v.materiel || []), val] }); renderVideoDetail(); }
function removeMateriel(idx) { const v = VideosStore.get(currentVideoDetailId); const materiel = v.materiel.filter((_, i) => i !== idx); VideosStore.update(currentVideoDetailId, { materiel }); renderVideoDetail(); }

// ---------------------------------------------------------------------------
// HOOKS
// ---------------------------------------------------------------------------
let hooksState = { category: '__all__' };
function setHooksCategory(c) { hooksState.category = c; renderHooks(); }
function renderHooks() {
  const hooks = HooksStore.getAll();
  const cats = ['__all__', ...Array.from(new Set(hooks.map(h => h.category).filter(Boolean)))];
  renderChips('hooks-category-chips', cats, hooksState.category, 'setHooksCategory', k => k === '__all__' ? 'Tous' : k);
  let list = hooks;
  if (hooksState.category !== '__all__') list = list.filter(h => h.category === hooksState.category);
  document.getElementById('hooks-grid').innerHTML = list.map(hookCardHtml).join('') || emptyStateHtml('Aucun hook pour le moment.');
}
function hookCardHtml(h) {
  return `<div class="card card-hover" onclick="openHookDetail('${h.id}')">
    <div class="pill ${catColor(h.category)}" style="margin-bottom:10px;">${esc(h.category || '—')}</div>
    <div style="font-size:13.5px;font-weight:700;margin-bottom:8px;">"${esc(h.text)}"</div>
    ${h.explanation ? `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">${esc(h.explanation)}</div>` : ''}
    <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();copyHook('${h.id}')">Copier le texte</button>
  </div>`;
}
function copyHook(id) { const h = HooksStore.get(id); if (!h) return; navigator.clipboard.writeText(h.text).then(() => toast('Hook copié')); }
function openHookDetail(id) { openDetailPage('hook', id); }
function renderHookDetailPage(id) {
  const h = HooksStore.get(id);
  const root = document.getElementById('detail-page-root');
  if (!h) { root.innerHTML = emptyStateHtml('Hook introuvable.'); return; }
  document.getElementById('topbar-title').textContent = 'Hook';
  document.getElementById('topbar-subtitle').textContent = h.category || '';
  root.innerHTML = `
    <div class="back-link" onclick="closeDetailPage()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>Retour</div>
    <div class="doc-shell">
      <div class="doc-meta">
        <span class="pill ${catColor(h.category)}">${esc(h.category || '—')}</span>
        ${h.type ? `<span class="pill pill-neutral">${esc(h.type)}</span>` : ''}
      </div>
      <div class="doc-title" style="font-style:italic;">"${esc(h.text)}"</div>
      ${detailFieldBlock('Explication', h.explanation)}
      ${detailFieldBlock('Exemple', h.example)}
      ${detailFieldBlock('Notes', h.notes)}
      <div class="doc-actions">
        <button class="btn btn-danger btn-sm" onclick="deleteHook('${h.id}')">Supprimer</button>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-secondary btn-sm" onclick="copyHook('${h.id}')">Copier</button>
          <button class="btn btn-primary btn-sm" onclick="openHookModal('${h.id}')">Modifier</button>
        </div>
      </div>
    </div>`;
}
function openHookModal(id) { const h = id ? HooksStore.get(id) : null; document.getElementById('generic-modal-body').innerHTML = hookModalTemplate(h); openGenericModal(); }
function hookModalTemplate(h) {
  return `<div class="modal-head"><h2>${h ? 'Modifier le hook' : 'Ajouter un hook'}</h2><button class="btn-ghost btn-icon" onclick="closeGenericModal()">✕</button></div>
  <div class="field"><label>Texte du hook</label><textarea class="textarea" id="modal-hook-text" style="min-height:60px;">${esc(h ? h.text : '')}</textarea></div>
  <div class="field-row">
    <div class="field"><label>Catégorie</label><input class="input" id="modal-hook-category" value="${esc(h ? h.category : '')}" placeholder="Question, Erreur, Curiosité..."></div>
    <div class="field"><label>Type</label><input class="input" id="modal-hook-type" value="${esc(h ? h.type : '')}"></div>
  </div>
  <div class="field"><label>Explication</label><textarea class="textarea" id="modal-hook-explanation" style="min-height:60px;">${esc(h ? h.explanation : '')}</textarea></div>
  <div class="field"><label>Exemple</label><input class="input" id="modal-hook-example" value="${esc(h ? h.example : '')}"></div>
  <div class="field" style="margin-bottom:6px;"><label>Notes</label><textarea class="textarea" id="modal-hook-notes" style="min-height:50px;">${esc(h ? h.notes : '')}</textarea></div>
  <div style="display:flex;gap:10px;justify-content:${h ? 'space-between' : 'flex-end'};margin-top:10px;">
    ${h ? `<button class="btn btn-danger" onclick="deleteHook('${h.id}')">Supprimer</button>` : ''}
    <div style="display:flex;gap:10px;"><button class="btn btn-secondary" onclick="closeGenericModal()">Annuler</button><button class="btn btn-primary" onclick="submitHookModal(${h ? `'${h.id}'` : 'null'})">Enregistrer</button></div>
  </div>`;
}
function submitHookModal(id) {
  const text = document.getElementById('modal-hook-text').value.trim();
  if (!text) { toast('Le texte est obligatoire'); return; }
  const payload = { text, category: document.getElementById('modal-hook-category').value.trim(), type: document.getElementById('modal-hook-type').value.trim(), explanation: document.getElementById('modal-hook-explanation').value.trim(), example: document.getElementById('modal-hook-example').value.trim(), notes: document.getElementById('modal-hook-notes').value.trim() };
  if (id) { HooksStore.update(id, payload); toast('Hook mis à jour'); } else { HooksStore.add(payload); toast('Hook ajouté'); }
  afterSave('hook', id);
}
function deleteHook(id) { if (!confirm('Supprimer ce hook ?')) return; HooksStore.remove(id); toast('Hook supprimé'); afterListMutation('hooks'); }

// ---------------------------------------------------------------------------
// CRÉATEURS
// ---------------------------------------------------------------------------
function renderCreateurs() { document.getElementById('creators-grid').innerHTML = CreatorsStore.getAll().map(creatorCardHtml).join('') || emptyStateHtml('Aucun créateur pour le moment.'); }
function creatorAvatarColor(name) { return ['var(--pink-400)', 'var(--blue-400)', 'var(--orange-400)'][hashStr(name) % 3]; }
function creatorCardHtml(c) {
  const initial = (c.name || '?').charAt(0).toUpperCase();
  return `<div class="card card-hover" onclick="openCreatorDetail('${c.id}')" style="padding:0;overflow:hidden;">
    <div style="height:70px;background:${c.bannerUrl ? `url('${c.bannerUrl}') center/cover` : 'linear-gradient(135deg,var(--pink-200),var(--blue-200))'};"></div>
    <div style="padding:0 20px 20px;">
      ${c.photoUrl ? `<img src="${c.photoUrl}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:3px solid var(--bg);margin-top:-24px;margin-bottom:10px;display:block;">` : `<div class="avatar-dot" style="background:${creatorAvatarColor(c.name)};border:3px solid var(--bg);margin-top:-24px;margin-bottom:10px;">${esc(initial)}</div>`}
      <div style="font-size:13.5px;font-weight:700;">${esc(c.name)}</div>
      <div style="font-size:11.5px;color:var(--text-tertiary);margin-bottom:8px;">${esc(c.platform || '—')} · ${esc(c.category || '—')}</div>
      <div style="font-size:12px;color:var(--text-secondary);">${esc(c.jaime || c.description || '')}</div>
    </div>
  </div>`;
}

// -- Read-only "belle fiche" full-page view --
function openCreatorDetail(id) { openDetailPage('creator', id); }
function renderCreatorDetailPage(id) {
  const c = CreatorsStore.get(id);
  const root = document.getElementById('detail-page-root');
  if (!c) { root.innerHTML = emptyStateHtml('Créateur introuvable.'); return; }
  document.getElementById('topbar-title').textContent = c.name;
  document.getElementById('topbar-subtitle').textContent = [c.platform, c.category].filter(Boolean).join(' · ');
  const initial = (c.name || '?').charAt(0).toUpperCase();
  root.innerHTML = `
    <div class="back-link" onclick="closeDetailPage()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>Retour</div>
    <div class="doc-shell doc-wide">
      <div class="doc-banner-full" style="border-radius:var(--radius-lg);background-image:${c.bannerUrl ? `url('${c.bannerUrl}')` : "linear-gradient(135deg,var(--pink-200),var(--blue-200))"};"></div>
      <div class="doc-avatar-overlap">
        ${c.photoUrl ? `<img src="${c.photoUrl}" style="width:92px;height:92px;border-radius:50%;object-fit:cover;border:4px solid var(--bg);">` : `<div class="avatar-dot" style="width:92px;height:92px;font-size:32px;border:4px solid var(--bg);background:${creatorAvatarColor(c.name)};">${esc(initial)}</div>`}
        <div style="padding-bottom:8px;">
          <div class="doc-title" style="margin-bottom:4px;">${esc(c.name)}</div>
          <div style="font-size:13px;color:var(--text-tertiary);">${esc(c.platform || '—')} · ${esc(c.category || '—')}</div>
        </div>
      </div>
      ${c.link ? `<div class="doc-section" style="margin-bottom:24px;"><a href="${esc(c.link)}" target="_blank" class="pill pill-blue">🔗 Voir le profil</a></div>` : ''}
      ${c.description ? `<div class="doc-section"><div class="doc-section-body">${esc(c.description)}</div></div>` : ''}
      ${detailFieldBlock("Ce que j'aime", c.jaime)}
      ${detailFieldBlock('Pourquoi il/elle fonctionne', c.pourquoi)}
      <div class="doc-stats-row">
        ${c.styleMontage ? `<div><div class="doc-section-title">Style de montage</div><div class="doc-section-body">${esc(c.styleMontage)}</div></div>` : ''}
        ${c.styleEcriture ? `<div><div class="doc-section-title">Style d'écriture</div><div class="doc-section-body">${esc(c.styleEcriture)}</div></div>` : ''}
      </div>
      ${detailFieldBlock('Hooks préférés', c.hooksPreferes)}
      ${c.feedUrl ? `<div class="doc-section"><div class="doc-section-title">Capture du feed</div><img src="${c.feedUrl}" style="width:100%;border-radius:12px;border:1px solid var(--border);"></div>` : ''}
      ${(c.gallery && c.gallery.length) ? `<div class="doc-section"><div class="doc-section-title">Galerie</div><div class="doc-gallery">${c.gallery.map(g => `<img src="${g}">`).join('')}</div></div>` : ''}
      ${detailFieldBlock('Ce que je veux reproduire', c.aReproduire)}
      ${detailFieldBlock('Ce que je ne veux pas reproduire', c.aPasReproduire)}
      ${detailFieldBlock('Notes personnelles', c.notes)}
      <div class="doc-actions">
        <button class="btn btn-danger btn-sm" onclick="deleteCreator('${c.id}')">Supprimer</button>
        <button class="btn btn-primary btn-sm" onclick="openCreatorModal('${c.id}')">Modifier</button>
      </div>
    </div>`;
}

// -- Image upload helpers (client-side resize, stored as data URLs) --
function readImageResized(file, maxDim, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
        else { width = Math.round(width * maxDim / height); height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
let modalCreatorImages = {};
let modalCreatorGallery = [];
function imageUploadFieldHtml(kind, label) {
  const url = modalCreatorImages[kind];
  return `<div class="field"><label>${esc(label)}</label><div id="imgfield-${kind}" style="display:flex;align-items:center;gap:10px;">
    ${url ? `<img src="${url}" style="width:52px;height:52px;object-fit:cover;border-radius:10px;border:1px solid var(--border);">` : `<div style="width:52px;height:52px;border-radius:10px;background:var(--bg-secondary);border:1px dashed var(--border);"></div>`}
    <input type="file" accept="image/*" id="file-${kind}" style="display:none;" onchange="onCreatorImageSelected(event,'${kind}')">
    <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('file-${kind}').click()">Choisir…</button>
    ${url ? `<button type="button" class="btn btn-ghost btn-sm" onclick="clearCreatorImage('${kind}')">Retirer</button>` : ''}
  </div></div>`;
}
function refreshImageField(kind, label) { document.getElementById('imgfield-' + kind).parentElement.outerHTML = imageUploadFieldHtml(kind, label); }
function onCreatorImageSelected(e, kind) {
  const file = e.target.files[0]; if (!file) return;
  const labels = { photo: 'Photo de profil', banner: 'Bannière', feed: 'Capture du feed' };
  readImageResized(file, kind === 'banner' ? 1200 : 600, (dataUrl) => { modalCreatorImages[kind] = dataUrl; refreshImageField(kind, labels[kind]); });
}
function clearCreatorImage(kind) {
  const labels = { photo: 'Photo de profil', banner: 'Bannière', feed: 'Capture du feed' };
  modalCreatorImages[kind] = null; refreshImageField(kind, labels[kind]);
}
function galleryFieldHtml() {
  return `<div id="gallery-field" style="display:flex;flex-wrap:wrap;gap:8px;">
    ${modalCreatorGallery.map((url, i) => `<div style="position:relative;"><img src="${url}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:1px solid var(--border);"><span style="position:absolute;top:-6px;right:-6px;background:var(--danger);color:white;width:18px;height:18px;border-radius:50%;font-size:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;" onclick="removeGalleryImage(${i})">✕</span></div>`).join('')}
    <label style="width:60px;height:60px;border-radius:8px;border:1px dashed var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--text-tertiary);font-size:20px;">+<input type="file" accept="image/*" multiple style="display:none;" onchange="onGalleryImagesSelected(event)"></label>
  </div>`;
}
function refreshGalleryField() { document.getElementById('gallery-field').outerHTML = galleryFieldHtml(); }
function onGalleryImagesSelected(e) {
  const files = Array.from(e.target.files || []);
  let remaining = files.length;
  files.forEach(f => readImageResized(f, 700, (dataUrl) => { modalCreatorGallery.push(dataUrl); remaining--; if (remaining === 0) refreshGalleryField(); }));
}
function removeGalleryImage(i) { modalCreatorGallery.splice(i, 1); refreshGalleryField(); }

function openCreatorModal(id) {
  const c = id ? CreatorsStore.get(id) : null;
  modalCreatorImages = { photo: (c && c.photoUrl) || null, banner: (c && c.bannerUrl) || null, feed: (c && c.feedUrl) || null };
  modalCreatorGallery = (c && c.gallery) ? [...c.gallery] : [];
  document.getElementById('generic-modal-body').innerHTML = creatorModalTemplate(c);
  openGenericModal();
}
function creatorModalTemplate(c) {
  return `<div class="modal-head"><h2>${c ? 'Modifier le créateur' : 'Ajouter un créateur'}</h2><button class="btn-ghost btn-icon" onclick="closeGenericModal()">✕</button></div>
  <div class="field-row"><div class="field"><label>Nom</label><input class="input" id="modal-creator-name" value="${esc(c ? c.name : '')}"></div><div class="field"><label>Plateforme</label><input class="input" id="modal-creator-platform" value="${esc(c ? c.platform : '')}" placeholder="TikTok, YouTube..."></div></div>
  <div class="field-row"><div class="field"><label>Catégorie</label><input class="input" id="modal-creator-category" value="${esc(c ? c.category : '')}"></div><div class="field"><label>Lien</label><input class="input" id="modal-creator-link" value="${esc(c ? c.link : '')}"></div></div>
  <div class="field-row">${imageUploadFieldHtml('photo', 'Photo de profil')}${imageUploadFieldHtml('banner', 'Bannière')}</div>
  ${imageUploadFieldHtml('feed', 'Capture du feed')}
  <div class="field"><label>Galerie (autres images)</label>${galleryFieldHtml()}</div>
  <div class="field"><label>Description</label><textarea class="textarea" id="modal-creator-description" style="min-height:50px;">${esc(c ? c.description : '')}</textarea></div>
  <div class="field"><label>Ce que j'aime</label><textarea class="textarea" id="modal-creator-jaime" style="min-height:50px;">${esc(c ? c.jaime : '')}</textarea></div>
  <div class="field"><label>Pourquoi il/elle fonctionne</label><textarea class="textarea" id="modal-creator-pourquoi" style="min-height:50px;">${esc(c ? c.pourquoi : '')}</textarea></div>
  <div class="field-row"><div class="field"><label>Style de montage</label><input class="input" id="modal-creator-montage" value="${esc(c ? c.styleMontage : '')}"></div><div class="field"><label>Style d'écriture</label><input class="input" id="modal-creator-ecriture" value="${esc(c ? c.styleEcriture : '')}"></div></div>
  <div class="field"><label>Hooks préférés</label><input class="input" id="modal-creator-hooks" value="${esc(c ? c.hooksPreferes : '')}"></div>
  <div class="field-row"><div class="field"><label>Ce que je veux reproduire</label><textarea class="textarea" id="modal-creator-reproduire" style="min-height:44px;">${esc(c ? c.aReproduire : '')}</textarea></div><div class="field"><label>Ce que je ne veux pas reproduire</label><textarea class="textarea" id="modal-creator-pasreproduire" style="min-height:44px;">${esc(c ? c.aPasReproduire : '')}</textarea></div></div>
  <div class="field" style="margin-bottom:6px;"><label>Notes personnelles</label><textarea class="textarea" id="modal-creator-notes" style="min-height:44px;">${esc(c ? c.notes : '')}</textarea></div>
  <div style="display:flex;gap:10px;justify-content:${c ? 'space-between' : 'flex-end'};margin-top:10px;">
    ${c ? `<button class="btn btn-danger" onclick="deleteCreator('${c.id}')">Supprimer</button>` : ''}
    <div style="display:flex;gap:10px;"><button class="btn btn-secondary" onclick="closeGenericModal()">Annuler</button><button class="btn btn-primary" onclick="submitCreatorModal(${c ? `'${c.id}'` : 'null'})">Enregistrer</button></div>
  </div>`;
}
function submitCreatorModal(id) {
  const name = document.getElementById('modal-creator-name').value.trim();
  if (!name) { toast('Le nom est obligatoire'); return; }
  const payload = { name, platform: document.getElementById('modal-creator-platform').value.trim(), category: document.getElementById('modal-creator-category').value.trim(), link: document.getElementById('modal-creator-link').value.trim(), description: document.getElementById('modal-creator-description').value.trim(), jaime: document.getElementById('modal-creator-jaime').value.trim(), pourquoi: document.getElementById('modal-creator-pourquoi').value.trim(), styleMontage: document.getElementById('modal-creator-montage').value.trim(), styleEcriture: document.getElementById('modal-creator-ecriture').value.trim(), hooksPreferes: document.getElementById('modal-creator-hooks').value.trim(), aReproduire: document.getElementById('modal-creator-reproduire').value.trim(), aPasReproduire: document.getElementById('modal-creator-pasreproduire').value.trim(), notes: document.getElementById('modal-creator-notes').value.trim(), photoUrl: modalCreatorImages.photo || null, bannerUrl: modalCreatorImages.banner || null, feedUrl: modalCreatorImages.feed || null, gallery: modalCreatorGallery };
  if (id) { CreatorsStore.update(id, payload); toast('Créateur mis à jour'); } else { CreatorsStore.add(payload); toast('Créateur ajouté'); }
  afterSave('creator', id);
}
function deleteCreator(id) { if (!confirm('Supprimer ce créateur ?')) return; CreatorsStore.remove(id); toast('Créateur supprimé'); afterListMutation('createurs'); }

// ---------------------------------------------------------------------------
// EXPÉRIENCES
// ---------------------------------------------------------------------------
function renderExperiences() { document.getElementById('experiences-list').innerHTML = ExperimentsStore.getAll().map(experimentRowHtml).join('') || emptyStateHtml('Aucune expérience pour le moment.'); }
function experimentDecisionMeta(e) {
  const label = { continuer: 'Continuer', abandonner: 'Abandonner', tester: 'Tester encore' }[e.decision] || '—';
  const cls = e.decision === 'continuer' ? 'status-done' : (e.decision === 'abandonner' ? 'status-todo' : 'status-progress');
  return { label, cls };
}
function experimentRowHtml(e) {
  const { label, cls } = experimentDecisionMeta(e);
  return `<div class="list-row" style="cursor:pointer;" onclick="openExperimentDetail('${e.id}')">
    <div><div class="title">${esc(e.title)}</div><div class="sub">Hypothèse : ${esc(e.hypothesis || '—')}</div></div>
    <span class="pill pill-blue">Résultat : ${esc(e.result || '—')}</span>
    <span class="status-badge ${cls}">${label}</span>
  </div>`;
}
function openExperimentDetail(id) { openDetailPage('experiment', id); }
function renderExperimentDetailPage(id) {
  const e = ExperimentsStore.get(id);
  const root = document.getElementById('detail-page-root');
  if (!e) { root.innerHTML = emptyStateHtml('Expérience introuvable.'); return; }
  document.getElementById('topbar-title').textContent = e.title;
  document.getElementById('topbar-subtitle').textContent = 'Expérience';
  const { label, cls } = experimentDecisionMeta(e);
  root.innerHTML = `
    <div class="back-link" onclick="closeDetailPage()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>Retour</div>
    <div class="doc-shell">
      <div class="doc-title">${esc(e.title)}</div>
      <div class="doc-meta"><span class="status-badge ${cls}">${label}</span></div>
      ${detailFieldBlock('Hypothèse', e.hypothesis)}
      ${detailFieldBlock('Test réalisé', e.test)}
      ${detailFieldBlock('Résultat', e.result)}
      ${detailFieldBlock('Conclusion', e.conclusion)}
      <div class="doc-actions">
        <button class="btn btn-danger btn-sm" onclick="deleteExperiment('${e.id}')">Supprimer</button>
        <button class="btn btn-primary btn-sm" onclick="openExperimentModal('${e.id}')">Modifier</button>
      </div>
    </div>`;
}
function openExperimentModal(id) { const e = id ? ExperimentsStore.get(id) : null; document.getElementById('generic-modal-body').innerHTML = experimentModalTemplate(e); openGenericModal(); }
function experimentModalTemplate(e) {
  return `<div class="modal-head"><h2>${e ? "Modifier l'expérience" : 'Nouvelle expérience'}</h2><button class="btn-ghost btn-icon" onclick="closeGenericModal()">✕</button></div>
  <div class="field"><label>Titre</label><input class="input" id="modal-exp-title" value="${esc(e ? e.title : '')}"></div>
  <div class="field"><label>Hypothèse</label><textarea class="textarea" id="modal-exp-hypothesis" style="min-height:50px;">${esc(e ? e.hypothesis : '')}</textarea></div>
  <div class="field"><label>Test réalisé</label><textarea class="textarea" id="modal-exp-test" style="min-height:50px;">${esc(e ? e.test : '')}</textarea></div>
  <div class="field"><label>Résultat</label><input class="input" id="modal-exp-result" value="${esc(e ? e.result : '')}"></div>
  <div class="field"><label>Conclusion</label><textarea class="textarea" id="modal-exp-conclusion" style="min-height:50px;">${esc(e ? e.conclusion : '')}</textarea></div>
  <div class="field" style="margin-bottom:6px;"><label>Décision</label><select class="input" id="modal-exp-decision">
    <option value="continuer" ${e && e.decision === 'continuer' ? 'selected' : ''}>Continuer</option>
    <option value="tester" ${e && e.decision === 'tester' ? 'selected' : ''}>Tester encore</option>
    <option value="abandonner" ${e && e.decision === 'abandonner' ? 'selected' : ''}>Abandonner</option>
  </select></div>
  <div style="display:flex;gap:10px;justify-content:${e ? 'space-between' : 'flex-end'};margin-top:10px;">
    ${e ? `<button class="btn btn-danger" onclick="deleteExperiment('${e.id}')">Supprimer</button>` : ''}
    <div style="display:flex;gap:10px;"><button class="btn btn-secondary" onclick="closeGenericModal()">Annuler</button><button class="btn btn-primary" onclick="submitExperimentModal(${e ? `'${e.id}'` : 'null'})">Enregistrer</button></div>
  </div>`;
}
function submitExperimentModal(id) {
  const title = document.getElementById('modal-exp-title').value.trim();
  if (!title) { toast('Le titre est obligatoire'); return; }
  const payload = { title, hypothesis: document.getElementById('modal-exp-hypothesis').value.trim(), test: document.getElementById('modal-exp-test').value.trim(), result: document.getElementById('modal-exp-result').value.trim(), conclusion: document.getElementById('modal-exp-conclusion').value.trim(), decision: document.getElementById('modal-exp-decision').value };
  if (id) { ExperimentsStore.update(id, payload); toast('Expérience mise à jour'); } else { ExperimentsStore.add(payload); toast('Expérience enregistrée'); }
  afterSave('experiment', id);
}
function deleteExperiment(id) { if (!confirm('Supprimer cette expérience ?')) return; ExperimentsStore.remove(id); toast('Expérience supprimée'); afterListMutation('experiences'); }

// ---------------------------------------------------------------------------
// RAPPORTS
// ---------------------------------------------------------------------------
function renderRapports() {
  const reports = ReportsStore.getAll().slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  document.getElementById('rapports-grid').innerHTML = reports.map(reportCardHtml).join('') || emptyStateHtml('Aucun rapport pour le moment.');
}
function reportCardHtml(r) {
  return `<div class="card card-hover" onclick="openReportDetail('${r.id}')">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
      <span class="pill pill-blue">${esc(r.week)}</span>
      <span style="font-size:11.5px;color:var(--text-tertiary);">${fmtDateShort(r.date)}</span>
    </div>
    <div style="font-size:20px;font-weight:800;margin-bottom:2px;">${r.subscriberDelta >= 0 ? '+' : ''}${r.subscriberDelta || 0} abonnés</div>
    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:14px;">${(r.views || 0).toLocaleString('fr-FR')} vues · ${r.videosPublished || 0} vidéo(s) publiée(s)</div>
    ${r.comment ? `<div style="font-size:12px;color:var(--text-tertiary);">"${esc(r.comment)}"</div>` : ''}
  </div>`;
}
function openReportDetail(id) { openDetailPage('report', id); }
function renderReportDetailPage(id) {
  const r = ReportsStore.get(id);
  const root = document.getElementById('detail-page-root');
  if (!r) { root.innerHTML = emptyStateHtml('Rapport introuvable.'); return; }
  document.getElementById('topbar-title').textContent = r.week;
  document.getElementById('topbar-subtitle').textContent = 'Rapport hebdomadaire';
  root.innerHTML = `
    <div class="back-link" onclick="closeDetailPage()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>Retour</div>
    <div class="doc-shell">
      <div class="doc-title">${esc(r.week)}</div>
      <div class="doc-meta"><span class="pill pill-blue">${fmtDateShort(r.date)}</span></div>
      <div class="doc-stats-row">
        <div class="doc-stat"><div class="num">${r.subscriberDelta >= 0 ? '+' : ''}${(r.subscriberDelta || 0).toLocaleString('fr-FR')}</div><div class="label">Nouveaux abonnés</div></div>
        <div class="doc-stat"><div class="num">${(r.subscribers || 0).toLocaleString('fr-FR')}</div><div class="label">Abonnés au total</div></div>
        <div class="doc-stat"><div class="num">${(r.views || 0).toLocaleString('fr-FR')}</div><div class="label">Vues</div></div>
        <div class="doc-stat"><div class="num">${r.videosPublished || 0}</div><div class="label">Vidéos publiées</div></div>
      </div>
      ${detailFieldBlock('Commentaire', r.comment)}
      ${detailFieldBlock('Rapport complet', r.fullText)}
      <div class="doc-actions">
        <button class="btn btn-danger btn-sm" onclick="deleteReport('${r.id}')">Supprimer</button>
        <button class="btn btn-primary btn-sm" onclick="openReportModal('${r.id}')">Modifier</button>
      </div>
    </div>`;
}
function openReportModal(id) { const r = id ? ReportsStore.get(id) : null; document.getElementById('generic-modal-body').innerHTML = reportModalTemplate(r); openGenericModal(); }
function reportModalTemplate(r) {
  return `<div class="modal-head"><h2>${r ? 'Modifier le rapport' : 'Ajouter un rapport'}</h2><button class="btn-ghost btn-icon" onclick="closeGenericModal()">✕</button></div>
  <div class="field"><label>Coller le rapport complet (optionnel — pré-remplit les champs ci-dessous si possible)</label><textarea class="textarea" id="modal-report-fulltext" placeholder="Colle ici ton rapport..." style="min-height:90px;" oninput="autofillFromReportText()">${esc(r ? r.fullText : '')}</textarea></div>
  <div class="field-row">
    <div class="field"><label>Date</label><input type="date" class="input" id="modal-report-date" value="${r ? r.date : todayISOLocal()}"></div>
    <div class="field"><label>Semaine</label><input class="input" id="modal-report-week" value="${esc(r ? r.week : '')}" placeholder="Semaine 31"></div>
  </div>
  <div class="field-row">
    <div class="field"><label>Abonnés (total)</label><input type="number" class="input" id="modal-report-subs" value="${r ? r.subscribers : ''}"></div>
    <div class="field"><label>Vues</label><input type="number" class="input" id="modal-report-views" value="${r ? r.views : ''}"></div>
    <div class="field"><label>Vidéos publiées</label><input type="number" class="input" id="modal-report-vids" value="${r ? r.videosPublished : ''}"></div>
  </div>
  <div class="field" style="margin-bottom:6px;"><label>Commentaire</label><textarea class="textarea" id="modal-report-comment" style="min-height:60px;">${esc(r ? r.comment : '')}</textarea></div>
  <div style="display:flex;gap:10px;justify-content:${r ? 'space-between' : 'flex-end'};margin-top:10px;">
    ${r ? `<button class="btn btn-danger" onclick="deleteReport('${r.id}')">Supprimer</button>` : ''}
    <div style="display:flex;gap:10px;"><button class="btn btn-secondary" onclick="closeGenericModal()">Annuler</button><button class="btn btn-primary" onclick="submitReportModal(${r ? `'${r.id}'` : 'null'})">Enregistrer</button></div>
  </div>`;
}
function autofillFromReportText() {
  const text = document.getElementById('modal-report-fulltext').value;
  const numMatch = (re) => { const m = text.match(re); return m ? m[1].replace(/[^\d]/g, '') : null; };
  const subs = numMatch(/(\d[\d\s.,]{2,})\s*(abonn[ée]s?|subscribers)/i);
  const views = numMatch(/(\d[\d\s.,]{2,})\s*(vues?|views)/i);
  const vids = numMatch(/(\d+)\s*(vid[ée]os?)/i);
  let filled = false;
  const subsEl = document.getElementById('modal-report-subs'), viewsEl = document.getElementById('modal-report-views'), vidsEl = document.getElementById('modal-report-vids');
  if (subs && !subsEl.value) { subsEl.value = subs; filled = true; }
  if (views && !viewsEl.value) { viewsEl.value = views; filled = true; }
  if (vids && !vidsEl.value) { vidsEl.value = vids; filled = true; }
  if (filled) toast('Champs pré-remplis depuis le texte — vérifie avant d\'enregistrer');
}
function submitReportModal(id) {
  const date = document.getElementById('modal-report-date').value || todayISOLocal();
  const week = document.getElementById('modal-report-week').value.trim() || ('Semaine du ' + fmtDateShort(date));
  const subs = parseInt(document.getElementById('modal-report-subs').value || '0', 10);
  const views = parseInt(document.getElementById('modal-report-views').value || '0', 10);
  const vids = parseInt(document.getElementById('modal-report-vids').value || '0', 10);
  const comment = document.getElementById('modal-report-comment').value.trim();
  const fullText = document.getElementById('modal-report-fulltext').value;
  const others = ReportsStore.getAll().filter(r => r.id !== id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const prev = others.find(r => new Date(r.date) < new Date(date));
  const subscriberDelta = prev ? subs - prev.subscribers : subs;
  const payload = { date, week, subscribers: subs, views, videosPublished: vids, comment, fullText, subscriberDelta };
  if (id) { ReportsStore.update(id, payload); toast('Rapport mis à jour'); } else { ReportsStore.add(payload); toast('Rapport ajouté'); }
  afterSave('report', id);
}
function deleteReport(id) { if (!confirm('Supprimer ce rapport ?')) return; ReportsStore.remove(id); toast('Rapport supprimé'); afterListMutation('rapports'); }

// ---------------------------------------------------------------------------
// PARAMÈTRES
// ---------------------------------------------------------------------------
function renderParametres() {
  const s = coGetSettings();
  document.getElementById('settings-project-name').value = s.projectName;
  document.getElementById('settings-goal').value = s.subscriberGoal;
  renderSettingsCategories();
  renderWorkspacesSettings();
}
function renderSettingsCategories() {
  const s = coGetSettings();
  document.getElementById('settings-categories-tags').innerHTML = tagListHtml(s.categories, 'removeSettingsCategory');
}
function saveProjectName(v) { coSaveSettings({ projectName: v || 'Content OS' }); document.querySelector('.sidebar-brand-name').textContent = v || 'Content OS'; toast('Enregistré'); }
function saveGoal(v) { coSaveSettings({ subscriberGoal: parseInt(v || '0', 10) }); toast('Objectif mis à jour'); }
function addSettingsCategory() {
  const input = document.getElementById('new-category-input'); const val = input.value.trim(); if (!val) return;
  const s = coGetSettings(); if (s.categories.includes(val)) { input.value = ''; return; }
  coSaveSettings({ categories: [...s.categories, val] }); input.value = ''; renderSettingsCategories();
}
function removeSettingsCategory(idx) { const s = coGetSettings(); coSaveSettings({ categories: s.categories.filter((_, i) => i !== idx) }); renderSettingsCategories(); }
function doExport() { coExportAllData(); toast('Export en cours de téléchargement'); }
function doImportClick() { document.getElementById('content-import-input').click(); }
function doImportFile(e) {
  const file = e.target.files[0]; if (!file) return;
  coImportDataFromFile(file, (ok) => {
    if (ok) { toast('Données importées'); refreshCurrentView(); } else { toast('Fichier invalide'); }
  });
  e.target.value = '';
}
function doReset() {
  if (!confirm('Réinitialiser Content OS ? Toutes les données seront supprimées définitivement.')) return;
  coResetAllData();
  toast('Application réinitialisée');
  location.reload();
}

// ---------------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------------
coSeedIfEmpty();
document.addEventListener('DOMContentLoaded', () => {
  const s = coGetSettings();
  document.querySelector('.sidebar-brand-name').textContent = s.projectName || 'Content OS';
  renderWorkspaceSwitcher();
  renderDashboard();
});
