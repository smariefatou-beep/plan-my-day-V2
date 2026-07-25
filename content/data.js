// Content OS — Data layer. localStorage-backed, same export/import philosophy as Plan the Day.

const CO_PREFIX = 'contentos_';
const CO_KEYS = ['ideas', 'videos', 'hooks', 'creators', 'experiments', 'reports', 'inspirations', 'settings'];

const STAGES = [
  { key: 'idea', label: 'Idée' },
  { key: 'research', label: 'Recherche' },
  { key: 'script', label: 'Script' },
  { key: 'filming', label: 'À filmer' },
  { key: 'editing', label: 'Montage' },
  { key: 'scheduled', label: 'Programmée' },
  { key: 'published', label: 'Publiée' },
];

const PRIORITIES = [
  { key: 'green', label: 'Vert · 3 jours', short: 'Urgent' },
  { key: 'yellow', label: 'Jaune · cette semaine', short: 'Cette semaine' },
  { key: 'red', label: 'Rouge · plus tard', short: 'Plus tard' },
];

const STATUSES = [
  { key: 'todo', label: 'À faire' },
  { key: 'planned', label: 'Planifiée' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'done', label: 'Terminée' },
];

function coGenId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------------------------------------------------------------------------
// Workspaces ("comptes") — every data key below is scoped to the active
// workspace. Workspace metadata itself lives outside that scope.
// ---------------------------------------------------------------------------
function coRawLoad(key, def) {
  try { const v = localStorage.getItem(CO_PREFIX + key); return v ? JSON.parse(v) : def; } catch (e) { return def; }
}
function coRawSave(key, val) {
  try { localStorage.setItem(CO_PREFIX + key, JSON.stringify(val)); } catch (e) {}
}
function coGetWorkspaces() { return coRawLoad('workspaces', []); }
function coGetActiveWorkspaceId() { return coRawLoad('active_workspace', null); }
function coSwitchWorkspace(id) { coRawSave('active_workspace', id); }
function coAddWorkspace(name, emoji) {
  const workspaces = coGetWorkspaces();
  const id = coGenId();
  workspaces.push({ id, name: name || 'Nouveau compte', emoji: emoji || '📁' });
  coRawSave('workspaces', workspaces);
  // a fresh workspace starts empty — mark it seeded so the demo content never runs into it
  localStorage.setItem(CO_PREFIX + 'ws_' + id + '_' + '_seeded', JSON.stringify(true));
  return id;
}
function coRenameWorkspace(id, name) {
  coRawSave('workspaces', coGetWorkspaces().map(w => w.id === id ? { ...w, name } : w));
}
function coDeleteWorkspace(id) {
  const workspaces = coGetWorkspaces();
  if (workspaces.length <= 1) return false;
  [...CO_KEYS, '_seeded'].forEach(k => localStorage.removeItem(CO_PREFIX + 'ws_' + id + '_' + k));
  const remaining = workspaces.filter(w => w.id !== id);
  coRawSave('workspaces', remaining);
  if (coGetActiveWorkspaceId() === id) coSwitchWorkspace(remaining[0].id);
  return true;
}
// First-ever load: create a default workspace, migrating any pre-workspace
// data (from before this feature existed) so nothing already saved is lost.
function coEnsureWorkspace() {
  const existing = coRawLoad('workspaces', null);
  if (existing && existing.length) return;
  const id = coGenId();
  let hadLegacyData = false;
  CO_KEYS.forEach(k => {
    const legacy = localStorage.getItem(CO_PREFIX + k);
    if (legacy !== null) {
      hadLegacyData = true;
      localStorage.setItem(CO_PREFIX + 'ws_' + id + '_' + k, legacy);
      localStorage.removeItem(CO_PREFIX + k);
    }
  });
  localStorage.removeItem(CO_PREFIX + '_seeded');
  // content already exists (demo seed or real edits) — never seed on top of it
  if (hadLegacyData) localStorage.setItem(CO_PREFIX + 'ws_' + id + '_' + '_seeded', JSON.stringify(true));
  coRawSave('workspaces', [{ id, name: 'Personnel', emoji: '👤' }]);
  coRawSave('active_workspace', id);
}

function coStorageKey(key) { return CO_PREFIX + 'ws_' + coGetActiveWorkspaceId() + '_' + key; }
function coLoad(key, def) {
  try {
    const v = localStorage.getItem(coStorageKey(key));
    return v ? JSON.parse(v) : def;
  } catch (e) { return def; }
}
function coSave(key, val) {
  try { localStorage.setItem(coStorageKey(key), JSON.stringify(val)); } catch (e) {}
}

function coStore(key) {
  return {
    getAll() { return coLoad(key, []); },
    get(id) { return coLoad(key, []).find(x => x.id === id) || null; },
    add(obj) {
      const all = coLoad(key, []);
      const item = Object.assign({ id: coGenId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, obj);
      all.unshift(item);
      coSave(key, all);
      return item;
    },
    update(id, patch) {
      const all = coLoad(key, []);
      const idx = all.findIndex(x => x.id === id);
      if (idx === -1) return null;
      all[idx] = Object.assign({}, all[idx], patch, { updatedAt: new Date().toISOString() });
      coSave(key, all);
      return all[idx];
    },
    remove(id) {
      const all = coLoad(key, []).filter(x => x.id !== id);
      coSave(key, all);
    },
  };
}

const IdeasStore = coStore('ideas');
const VideosStore = coStore('videos');
const HooksStore = coStore('hooks');
const CreatorsStore = coStore('creators');
const ExperimentsStore = coStore('experiments');
const ReportsStore = coStore('reports');
const InspirationsStore = coStore('inspirations');

function coGetSettings() {
  return coLoad('settings', {
    projectName: 'Content OS',
    subscriberGoal: 11000,
    categories: ['Business', 'Lifestyle', 'Podcast', 'Mindset', 'Voyage', 'Productivité', 'Études', 'Personnel'],
  });
}
function coSaveSettings(patch) {
  const s = Object.assign({}, coGetSettings(), patch);
  coSave('settings', s);
  return s;
}

// ---------------------------------------------------------------------------
// Seed data — realistic starter content so the app doesn't feel empty.
// Only runs once, on first load (checked via a marker key).
// ---------------------------------------------------------------------------
function coSeedIfEmpty() {
  if (coLoad('_seeded', false)) return;

  IdeasStore.add({ title: '3 erreurs que je faisais en freelance', description: "Retour d'expérience sur mes débuts, format storytime + leçons.", link: '', category: 'Business', priority: 'green', plannedDate: null, subtasks: [{ id: coGenId(), text: 'Écrire le hook', done: true }, { id: coGenId(), text: 'Lister les 3 erreurs', done: true }, { id: coGenId(), text: 'Tourner', done: false }, { id: coGenId(), text: 'Monter', done: false }, { id: coGenId(), text: 'Sous-titrer', done: false }], status: 'planned', history: [{ date: new Date().toISOString(), event: 'Idée créée' }], videoId: null });
  IdeasStore.add({ title: 'Une journée dans ma vie à Paris', description: 'Vlog rythmé, focus sur le matin productif.', link: '', category: 'Lifestyle', priority: 'yellow', plannedDate: null, subtasks: [{ id: coGenId(), text: 'Repérer les lieux', done: false }, { id: coGenId(), text: 'Planifier les plans', done: false }], status: 'todo', history: [{ date: new Date().toISOString(), event: 'Idée créée' }], videoId: null });
  IdeasStore.add({ title: 'Extrait podcast sur la discipline', description: "Découper le meilleur passage de l'épisode #12.", link: '', category: 'Podcast', priority: 'red', plannedDate: null, subtasks: [{ id: coGenId(), text: 'Réécouter épisode', done: true }, { id: coGenId(), text: 'Choisir extrait', done: false }, { id: coGenId(), text: 'Sous-titrer', done: false }], status: 'todo', history: [{ date: new Date().toISOString(), event: 'Idée créée' }], videoId: null });
  const ideaMethode = IdeasStore.add({ title: 'Ma méthode de planification hebdo', description: 'Screen recording + voix off, montrer Content OS en action.', link: '', category: 'Productivité', priority: 'green', plannedDate: null, subtasks: [{ id: coGenId(), text: 'Script', done: true }, { id: coGenId(), text: 'Screen recording', done: true }, { id: coGenId(), text: 'Voix off', done: true }, { id: coGenId(), text: 'Montage', done: false }, { id: coGenId(), text: 'Sous-titres', done: false }, { id: coGenId(), text: 'Miniature', done: false }], status: 'in_progress', history: [{ date: new Date().toISOString(), event: 'Idée créée' }], videoId: null });
  IdeasStore.add({ title: "Pourquoi j'ai arrêté de me comparer", description: 'Face caméra, ton vulnérable, hook question.', link: '', category: 'Mindset', priority: 'yellow', plannedDate: null, subtasks: [], status: 'todo', history: [{ date: new Date().toISOString(), event: 'Idée créée' }], videoId: null });
  IdeasStore.add({ title: 'Routine du matin en 5 étapes', description: 'Format tuto rapide.', link: '', category: 'Études', priority: 'red', plannedDate: null, subtasks: [], status: 'done', history: [{ date: new Date().toISOString(), event: 'Idée créée' }], videoId: null });

  const vid1 = VideosStore.add({
    title: 'Ma vraie routine productive', category: 'Productivité', priority: 'green',
    plannedDate: null, publishedDate: null, stage: 'scheduled', ideaId: null,
    hook: '"Personne ne te dit ça sur la productivité..."',
    script: 'Intro (0-3s) : Hook question caméra proche.\nPartie 1 : Ma routine à 6h — pourquoi ça change tout.\nPartie 2 : L\'erreur que je faisais avant.\nOutro : CTA vers Content OS / abonnement.',
    storyline: [{ id: coGenId(), text: 'Réveil 6h, lumière naturelle' }, { id: coGenId(), text: 'Préparation café + carnet' }, { id: coGenId(), text: 'Bloc de travail profond' }],
    plans: [{ id: coGenId(), text: 'Plan 1 — réveil, lumière', done: true }, { id: coGenId(), text: 'Plan 2 — préparation café', done: true }, { id: coGenId(), text: 'Plan 3 — bureau, écriture', done: false }, { id: coGenId(), text: 'Plan 4 — face caméra CTA', done: false }],
    materiel: ['Téléphone', 'Micro cravate', 'Trépied', 'Lumière annulaire'],
    cta: "Abonne-toi pour la suite de ma méthode.", notes: 'Tourner tôt le matin pour la lumière. Prévoir un plan large du bureau.',
    checklist: { hook: true, script: true, filmed: false, edited: false, subtitles: false, published: false },
  });
  VideosStore.add({ title: 'Routine du matin en 5 étapes', category: 'Études', priority: 'red', plannedDate: null, publishedDate: null, stage: 'editing', ideaId: null, hook: '', script: '', storyline: [], plans: [], materiel: [], cta: '', notes: '', checklist: { hook: true, script: true, filmed: true, edited: false, subtitles: false, published: false } });
  VideosStore.add({ title: "Comment j'organise ma semaine", category: 'Productivité', priority: 'green', plannedDate: null, publishedDate: '2026-07-18', stage: 'published', ideaId: null, hook: '', script: '', storyline: [], plans: [], materiel: [], cta: '', notes: '', checklist: { hook: true, script: true, filmed: true, edited: true, subtitles: true, published: true } });
  VideosStore.add({ title: 'Mon setup de tournage', category: 'Matériel', priority: 'yellow', plannedDate: null, publishedDate: '2026-07-14', stage: 'published', ideaId: null, hook: '', script: '', storyline: [], plans: [], materiel: [], cta: '', notes: '', checklist: { hook: true, script: true, filmed: true, edited: true, subtitles: true, published: true } });
  IdeasStore.update(ideaMethode.id, { videoId: vid1.id });

  HooksStore.add({ text: "Et si tout ce qu'on t'a appris sur X était faux ?", category: 'Question', type: 'Question', explanation: 'Crée une tension immédiate en remettant en question une croyance commune.', example: '', notes: '' });
  HooksStore.add({ text: "J'ai perdu 2 ans à cause de cette erreur.", category: 'Erreur', type: 'Erreur', explanation: 'Fonctionne bien pour le format retour d\'expérience / storytime.', example: '', notes: '' });
  HooksStore.add({ text: 'Personne ne te dit ça sur...', category: 'Curiosité', type: 'Curiosité', explanation: 'Excellent taux de rétention sur les 3 premières secondes.', example: '', notes: '' });

  CreatorsStore.add({ name: 'Ava Martin', link: '', platform: 'TikTok', category: 'Lifestyle', description: 'Storytelling très personnel.', jaime: 'Montage minimaliste, hooks toujours en question directe.', pourquoi: 'Proximité avec sa communauté.', styleMontage: 'Minimaliste', styleEcriture: 'Direct', hooksPreferes: 'Question directe', aReproduire: '', aPasReproduire: '', notes: '' });
  CreatorsStore.add({ name: 'Lucas Perrin', link: '', platform: 'YouTube', category: 'Business', description: 'Structure en 3 actes.', jaime: 'Très bon rythme de montage, écriture directe.', pourquoi: '', styleMontage: 'Dynamique', styleEcriture: 'Direct', hooksPreferes: '', aReproduire: '', aPasReproduire: '', notes: '' });
  CreatorsStore.add({ name: 'Sofia Renard', link: '', platform: 'Instagram', category: 'Mindset', description: 'Ton chaleureux.', jaime: 'Très proche de sa communauté, publie à heure fixe.', pourquoi: '', styleMontage: '', styleEcriture: 'Chaleureux', hooksPreferes: '', aReproduire: '', aPasReproduire: '', notes: '' });

  ExperimentsStore.add({ title: 'Publier à 18h au lieu de 12h', hypothesis: "Plus d'engagement en fin de journée", test: 'Publication à 18h pendant 2 semaines', result: '+40% commentaires', conclusion: 'Le soir capte mieux mon audience', decision: 'continuer' });
  ExperimentsStore.add({ title: 'Sous-titres animés vs statiques', hypothesis: 'La rétention augmente avec des sous-titres animés', test: '5 vidéos avec chaque style', result: 'Peu de différence', conclusion: "Le style de sous-titres n'est pas le facteur clé", decision: 'abandonner' });
  ExperimentsStore.add({ title: 'Hook question vs hook statistique', hypothesis: 'La question retient mieux dans les 3 premières secondes', test: '10 vidéos, 5 de chaque', result: '+18% rétention', conclusion: 'Les questions créent plus de tension', decision: 'continuer' });

  ReportsStore.add({ date: '2026-07-26', week: 'Semaine 30', subscribers: 3482, subscriberDelta: 248, views: 18420, videosPublished: 4, comment: 'Le format storytime a beaucoup mieux performé cette semaine.', fullText: '' });
  ReportsStore.add({ date: '2026-07-19', week: 'Semaine 29', subscribers: 3234, subscriberDelta: 190, views: 14900, videosPublished: 3, comment: 'Moins de constance cette semaine, à corriger.', fullText: '' });
  ReportsStore.add({ date: '2026-07-12', week: 'Semaine 28', subscribers: 3044, subscriberDelta: 312, views: 21100, videosPublished: 5, comment: 'Meilleure semaine du mois grâce au hook question.', fullText: '' });

  InspirationsStore.add({ link: '', description: 'Format "POV" très partagé', category: 'Storytelling' });
  InspirationsStore.add({ link: '', description: 'Transition texte → visage', category: 'Montage' });
  InspirationsStore.add({ link: '', description: 'Hook "Personne ne te dit ça"', category: 'Hook' });

  coSave('_seeded', true);
}

// ---------------------------------------------------------------------------
// Export / Import / Reset — same UX as Plan the Day.
// ---------------------------------------------------------------------------
function coExportAllData() {
  const snapshot = { _app: 'ContentOS', _version: 1, _exported: new Date().toISOString() };
  CO_KEYS.forEach(k => { snapshot[k] = coLoad(k, k === 'settings' ? {} : []); });
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'content-os-export-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function coImportDataFromFile(file, onDone) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      CO_KEYS.forEach(k => { if (k in data) coSave(k, data[k]); });
      if (onDone) onDone(true);
    } catch (e) {
      if (onDone) onDone(false);
    }
  };
  reader.readAsText(file);
}

function coResetAllData() {
  CO_KEYS.forEach(k => localStorage.removeItem(coStorageKey(k)));
  coSave('_seeded', true); // wipe to genuinely empty — do not re-seed demo content
}

coEnsureWorkspace();
