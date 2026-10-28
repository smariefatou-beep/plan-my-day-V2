// École OS — curriculum structuré, extrait des syllabus officiels ESCP BIM B1 Fall 2026/2027.
// C'est la SOURCE DE VÉRITÉ de ce qu'il faut apprendre. On n'y stocke jamais de progression :
// la progression vit dans localStorage ('school_state'), le planning est recalculé par engine.js.
//
// Règles suivies :
//  - Chapitres et ordre repris des syllabus, intitulés traduits en français (titres de livres gardés).
//  - Aucune échéance inventée : `due` n'existe que si le syllabus (ou ta routine, quand tu l'as
//    explicitement donnée) la fixe. Sinon l'activité a seulement une semaine prévue.
//  - Les durées (`mins`) sont des estimations, sauf mention du syllabus (vidéo ~30 min, MyLab 30–60 min…).
//  - `flags` signale ce qui reste à confirmer (date, répartition, disponibilité).
(function (root) {
  'use strict';

  // ---------------------------------------------------------------- Calendrier
  // Seul le syllabus IR11 donne les dates des semaines (lundis). Tous les cours BIM B1 Fall
  // suivent la même grille de 11 semaines ; on réutilise donc ces dates pour toutes les matières.
  // Entre S6 (12/10) et S7 (02/11) : deux semaines sans cours (midterms / vacances).
  var CALENDAR = {
    source: 'Syllabus IR11 (dates des semaines 1 à 11)',
    weeks: {
      1: '2026-09-07', 2: '2026-09-14', 3: '2026-09-21', 4: '2026-09-28', 5: '2026-10-05',
      6: '2026-10-12', 7: '2026-11-02', 8: '2026-11-09', 9: '2026-11-16', 10: '2026-11-23', 11: '2026-11-30'
    },
    breaks: [{ from: '2026-10-19', to: '2026-11-01', label: 'Pause entre S6 et S7 (partiels / vacances)' }]
  };

  // ---------------------------------------------------------------- Helpers
  var acts;
  function A(id, type, title, mins, extra) {
    var a = { id: id, type: type, title: title, mins: mins };
    if (extra) for (var k in extra) a[k] = extra[k];
    return a;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function wid(code, w) { return code + '-w' + pad(w); }

  // Ta méthode, la même pour chaque cours (dans cet ordre) :
  //  1 comprendre le sujet avec ChatGPT · 2 vidéo · 3 écrire le cours · 4 lire le cours · 5 discuter avec ChatGPT
  //  6 quiz avec l'IA · 7 NotebookLM · 8 fiches · 9 exercices en séance de suivi · 10 exercices en séminaire
  //  11 test hebdomadaire en ligne (seulement si le syllabus en prévoit un) · 12 exercices d'entraînement.
  // opts.videos : liste de vidéos (SK11) au lieu d'une seule vidéo ; opts.video === false : pas de vidéo.
  // opts.inClass : séances en classe ('followup', 'seminar', 'workshop') ; opts.test : activité de test.
  function workflow(p, opts) {
    var list = [], prev;
    function step(id, type, title, mins, extra) {
      var x = A(p + '-' + id, type, title, mins, extra || {});
      if (!x.prereq && prev) x.prereq = [prev];
      list.push(x); prev = x.id; return x;
    }
    step('understand', 'understand', 'Comprendre le sujet — chercher avec ChatGPT', 15, { step: 1, prereq: [] });
    var videoIds = [];
    if (opts.videos) opts.videos.forEach(function (v, i) { videoIds.push(step('v' + (i + 1), 'video', 'Vidéo ' + v, 9, { step: 2, group: 'Vidéos à regarder' }).id); });
    else if (opts.video !== false) videoIds.push(step('video', 'video', 'Regarder le cours préenregistré (~30 min)', 35, { step: 2, src: 'Syllabus : cours préenregistré à voir avant la séance' }).id);
    step('write', 'write', 'Écrire le cours', 45, { step: 3 });
    var readId = step('read', 'read', 'Lire le cours (relire ce que tu as écrit)', 15, { step: 4 }).id;
    step('chat', 'chat', 'Discuter du cours avec ChatGPT pour bien comprendre', 15, { step: 5 });
    step('aiquiz', 'aiquiz', 'Quiz — mettre le cours dans l’IA et faire le quiz', 15, { step: 6 });
    step('nlm', 'notebooklm', 'Mettre le cours dans NotebookLM et travailler avec', 20, { step: 7 });
    var fichesId = step('fiches', 'fiches', 'Faire les fiches', 25, { step: 8 }).id;
    var lastVideo = videoIds[videoIds.length - 1];
    (opts.inClass || []).forEach(function (k) {
      var t = k === 'followup' ? 'Exercices pendant la séance de suivi' : k === 'seminar' ? 'Exercices pendant le séminaire' : 'Atelier en classe — exercices';
      list.push(A(p + '-' + k, 'inclass', t, 45, { step: k === 'followup' ? 9 : 10, session: k, inClass: true, prereq: lastVideo ? [lastVideo] : [], src: 'Fait en classe. Si tu l’as manqué, refais les exercices chez toi.' }));
    });
    if (opts.test) { var t = opts.test; t.step = 11; t.prereq = t.prereq || [readId]; list.push(t); }
    list.push(A(p + '-practice', 'practice', 'Exercices d’entraînement pendant la semaine', 25, { step: 12, prereq: [fichesId] }));
    return list;
  }
  // Lecture du manuel demandée par le syllabus (hors méthode : affichée à part).
  function reading(id, title, mins, extra) {
    var x = A(id, 'reading', title, mins, extra || {});
    x.syllabus = true;
    return x;
  }

  // ================================================================ EC11 — Microéconomie
  var EC11_WEEKS = [
    { n: 1, part: 'Partie 1 : les fondamentaux de la microéconomie', title: 'Introduction à la microéconomie',
      topics: ['Définir la microéconomie', 'Les grands principes', 'Applications de la microéconomie à l’entreprise'],
      readings: [['intro-ch1', 'Krugman & Wells — introduction et chapitre 1 (en entier)', 60]],
      project: 'Projet de groupe : consignes' },
    { n: 2, title: 'Offre et demande, équilibre du marché et formation des prix',
      topics: ['Barèmes d’offre et de demande', 'Courbes d’offre et de demande', 'Déplacements le long des courbes d’offre et de demande', 'Déplacements des courbes d’offre et de demande', 'Offre, demande et équilibre du marché', 'Variations de l’offre et de la demande, nouvel équilibre'],
      readings: [['ch3', 'Krugman & Wells — chapitre 3, p. 65–95', 60]] },
    { n: 3, title: 'Équilibre du marché et formation des prix (suite)',
      topics: ['Surplus du consommateur et courbe de demande', 'Surplus du producteur et courbe d’offre', 'Contrôle des prix : prix plafonds et prix planchers'],
      readings: [['ch4', 'Krugman & Wells — chapitre 4 (en entier)', 50], ['ch5', 'Krugman & Wells — chapitre 5, p. 127–141', 30]],
      project: 'Projet de groupe : début des recherches' },
    { n: 4, title: 'L’élasticité',
      topics: ['Définir, mesurer et interpréter l’élasticité-prix de la demande', 'Les facteurs qui déterminent l’élasticité-prix', 'Élasticité-prix et stratégie de prix de l’entreprise', 'Élasticité-revenu, élasticité croisée, élasticité de l’offre : conséquences pour l’entreprise'],
      readings: [['ch6', 'Krugman & Wells — chapitre 6 (en entier)', 50]] },
    { n: 5, title: 'Les coûts',
      topics: ['Coûts explicites et coûts implicites', 'De la fonction de production aux courbes de coûts', 'Coût marginal et coût moyen', 'Coûts à court terme et à long terme', 'Rendements d’échelle'],
      readings: [['ch9a', 'Krugman & Wells — chapitre 9, p. 244–245', 10], ['ch11', 'Krugman & Wells — chapitre 11 (en entier)', 50]],
      project: 'Projet de groupe : consultations n° 1' },
    { n: 6, part: 'Partie 2 : théorie du producteur', title: 'Les décisions de l’entreprise',
      topics: ['Coûts, bénéfices et profits', 'Profit comptable et profit économique', 'Les décisions « l’un ou l’autre »', 'Les décisions « combien » : le rôle de l’analyse marginale', 'Le principe de maximisation du profit par l’analyse marginale'],
      readings: [['ch9b', 'Krugman & Wells — chapitre 9, p. 243–258', 40]],
      project: 'Projet de groupe : consultations n° 2' },
    { n: 7, title: 'La concurrence parfaite',
      topics: ['Définir la concurrence parfaite', 'Production et profits en concurrence parfaite', 'Choisir par l’analyse marginale la quantité qui maximise le profit', 'Décision de production (seuil de fermeture)', 'Équilibre de long terme'],
      readings: [['ch12', 'Krugman & Wells — chapitre 12 (en entier)', 50]] },
    { n: 8, title: 'Le monopole',
      topics: ['Ce qu’est un monopole', 'Courbe de demande et recette marginale du monopoleur', 'Quantité et prix qui maximisent le profit du monopoleur', 'Monopole et concurrence parfaite : l’inefficacité du monopole', 'Monopole et politiques publiques', 'Résoudre le problème du monopole', 'La discrimination par les prix'],
      readings: [['ch13', 'Krugman & Wells — chapitre 13 (en entier)', 50]],
      project: 'Projet de groupe : présentations (groupes 1 à 3)' },
    { n: 9, title: 'L’oligopole',
      topics: ['La fréquence des oligopoles', 'Comprendre l’oligopole', 'Collusion et concurrence', 'Les jeux des oligopoles : le dilemme du prisonnier', 'La courbe de demande coudée', 'L’oligopole en pratique'],
      readings: [['ch14', 'Krugman & Wells — chapitre 14 (en entier)', 50]],
      project: 'Projet de groupe : présentations (groupes 4 à 6)' },
    { n: 10, title: 'Théorie des jeux et stratégie concurrentielle',
      topics: ['Jeux non coopératifs et jeux coopératifs', 'Stratégies dominantes', 'L’équilibre de Nash', 'Jeux répétés et cartels', 'Jeux séquentiels (si le temps le permet)'],
      readings: [['ch14b', 'Krugman & Wells — chapitre 14, p. 414–420', 20], ['extra', 'Lecture complémentaire (sera fournie)', 30, { blocked: 'Pas encore fourni par le prof' }]] },
    { n: 11, title: 'Se préparer à l’examen final : révisions', topics: ['Révision des semaines 1 à 11'], readings: [], revision: true }
  ];

  function buildEC11() {
    return EC11_WEEKS.map(function (w) {
      var p = wid('EC11', w.n), list = [];
      if (!w.revision) {
        list = workflow(p, { inClass: ['followup', 'seminar'], test: A(p + '-test', 'test', 'Test hebdomadaire en ligne (Blackboard)', 20, { dueOffset: 5, dueTime: '23:59', dueSrc: 'Syllabus : « chaque semaine, avant samedi soir »', weight: '15 % (tous les tests)' }) });
      } else {
        list.push(A(p + '-rev', 'revision', 'Séance de révision — semaines 1 à 11', 90, { src: 'Syllabus : séance de révision la semaine avant l’examen' }));
      }
      w.readings.forEach(function (r) {
        list.push(reading(p + '-read-' + r[0], 'Lire dans le manuel : ' + r[1].replace(/^Krugman & Wells — /, ''), r[2], r[3] || {}));
      });
      if (w.project) list.push(A(p + '-proj', 'project', w.project, 30, { syllabus: true, src: 'Syllabus EC11 — projet de groupe (20 %)' }));
      return { n: w.n, part: w.part, title: w.title, topics: w.topics, activities: list };
    });
  }

  // ================================================================ MA11 — Fondamentaux des mathématiques 1
  var MA11_WEEKS = [
    { n: 1, title: 'Séance 1 : rappels d’algèbre', chapter: 'Chapitre 0',
      sections: [['0.1–0.2 Ensembles et propriétés des nombres réels (révision en autonomie)', 20], ['0.3 Exposants et radicaux', 20], ['0.4 Opérations sur les expressions algébriques', 20], ['0.5 Factorisation', 20], ['0.6 Fractions', 20]] },
    { n: 2, title: 'Séance 2 : équations et inéquations', chapter: 'Chapitres 0 et 1',
      sections: [['0.7 Équations, en particulier linéaires', 20], ['0.8 Équations du second degré', 20], ['1.1 Applications des équations', 20], ['1.2 Inéquations linéaires', 15], ['1.3 Applications des inéquations', 15], ['1.4 Valeur absolue', 15]] },
    { n: 3, title: 'Séances 3 et 4 : fonctions et graphiques (partie 1 — chapitre 2)', chapter: 'Chapitre 2', split: 'Le syllabus regroupe les séances 3 et 4 ; répartition proposée : ch. 2 en S3, ch. 3 en S4.',
      sections: [['2.1 Fonctions', 15], ['2.2 Fonctions particulières', 15], ['2.3 Combinaisons de fonctions', 15], ['2.4 Fonctions réciproques', 15], ['2.5 Graphiques dans un repère orthonormé', 15], ['2.6 Symétrie', 15], ['2.7 Translations et réflexions', 15]] },
    { n: 4, title: 'Séances 3 et 4 : fonctions et graphiques (partie 2 — chapitre 3)', chapter: 'Chapitre 3', split: 'Répartition proposée (voir S3).',
      sections: [['3.1 Droites', 15], ['3.2 Applications et fonctions affines', 15], ['3.3 Fonctions du second degré', 15], ['3.4 Systèmes d’équations linéaires', 20], ['3.5 Systèmes non linéaires', 15], ['3.6 Applications des systèmes d’équations', 20]] },
    { n: 5, title: 'Séance 5 : fonctions exponentielles et logarithmes', chapter: 'Chapitre 4',
      sections: [['4.1 Fonctions exponentielles', 20], ['4.2 Fonctions logarithmes', 20], ['4.3 Propriétés des logarithmes', 20], ['4.4 Équations logarithmiques et exponentielles', 20]] },
    { n: 6, title: 'Séance 6 : limites et continuité', chapter: 'Chapitre 10', note: 'Partiel de mi-semestre après cette séance (semaine 6 ou 7)',
      sections: [['10.1 Limites', 20], ['10.2 Limites (suite)', 20], ['10.3 Continuité', 15], ['10.4 Continuité appliquée aux inéquations', 15]] },
    { n: 7, title: 'Séances 7 et 8 : dérivation (partie 1)', chapter: 'Chapitre 11', split: 'Le syllabus regroupe les séances 7 et 8 ; répartition proposée.',
      sections: [['11.1 La dérivée', 25], ['11.2 Règles de dérivation', 25], ['11.3 La dérivée comme taux de variation', 20]] },
    { n: 8, title: 'Séances 7 et 8 : dérivation (partie 2)', chapter: 'Chapitres 11 et 12', split: 'Répartition proposée (voir S7).',
      sections: [['11.4 Dérivée d’un produit et d’un quotient', 25], ['11.5 Dérivée d’une fonction composée', 25], ['12.7 Dérivées d’ordre supérieur (introduction)', 15]] },
    { n: 9, title: 'Séance 9 : extremums et étude de courbes', chapter: 'Chapitre 13', note: 'La section 13.6 est importante pour les applications à l’entreprise.',
      sections: [['13.1 Extremums relatifs', 20], ['13.2 Extremums absolus sur un intervalle fermé', 15], ['13.3 Concavité', 15], ['13.4 Test de la dérivée seconde', 15], ['13.5 Asymptotes', 15], ['13.6 Maximums et minimums appliqués', 25]] },
    { n: 10, title: 'Séances 10 et 11 : calcul matriciel (partie 1)', chapter: 'Chapitre 6', split: 'Le syllabus regroupe les séances 10 et 11 ; répartition proposée.',
      sections: [['6.1 Matrices', 15], ['6.2 Addition de matrices et multiplication par un scalaire', 15], ['6.3 Produit de matrices', 20]] },
    { n: 11, title: 'Séances 10 et 11 : calcul matriciel (partie 2) + séance de révision', chapter: 'Chapitre 6', split: 'Répartition proposée (voir S10).',
      sections: [['6.4 Résoudre des systèmes par réduction de matrices', 25], ['6.5 Résoudre des systèmes par réduction de matrices (suite)', 20], ['6.6 Matrices inverses', 25]], revision: true }
  ];

  function buildMA11() {
    return MA11_WEEKS.map(function (w) {
      var p = wid('MA11', w.n);
      var list = workflow(p, { inClass: ['followup', 'seminar'], test: A(p + '-mylab', 'test', 'Devoir hebdomadaire MyLab ' + w.n + '/11 (5 à 10 questions)', 45, { dueOffset: 7, dueTime: '08:00', dueSrc: 'Ta routine : MyLab à rendre le lundi — vérifie l’heure exacte sur MyLab', weight: '10 % (les 11 devoirs)' }) });
      w.sections.forEach(function (s, i) {
        list.push(reading(p + '-sec' + (i + 1), 'Lire dans le manuel : section ' + s[0], s[1], { prereq: i === 0 ? [] : [p + '-sec' + i] }));
      });
      if (w.revision) list.push(A(p + '-rev', 'revision', 'Séance de révision (avant l’examen final)', 90, { syllabus: true, src: 'Syllabus : séance de révision puis examen final' }));
      return { n: w.n, title: w.title, chapter: w.chapter, note: w.note, flags: w.split ? [w.split] : [], topics: w.sections.map(function (s) { return s[0]; }), activities: list };
    });
  }

  // ================================================================ IR11 — Relations internationales
  // Les chapitres de Best et al. reviennent sur plusieurs semaines : une seule activité par
  // chapitre (à sa première apparition) ; les semaines suivantes y renvoient (`refs`).
  var IR11_WEEKS = [
    { n: 1, title: 'Introduction et notions clés des relations internationales', ch: [1], seminar: ['Attribution des sujets de présentation'] },
    { n: 2, title: 'Du Concert européen au système de paix de Paris (1900–1919)', ch: [1, 2], seminar: ['Qu’était le Concert européen avant la Première Guerre mondiale ?', 'Comment l’essor de nouvelles grandes puissances (Allemagne, Japon, États-Unis) a-t-il modifié le système international avant la Première Guerre mondiale ?', 'Comparer les approches réaliste et libérale des relations internationales'] },
    { n: 3, title: 'L’échec de la Société des Nations (1919–1945)', ch: [2, 3, 4, 6, 7], seminar: ['Qu’était la question d’Orient avant la Première Guerre mondiale ?', 'Après avoir résolu tant de crises depuis 1905, pourquoi les grandes puissances n’ont-elles pas su résoudre la crise de 1914 ?', 'Quelles étaient les faiblesses du système de paix de Paris ?'] },
    { n: 4, title: 'Le système bipolaire de la guerre froide (1945–1962)', ch: [8, 9, 12], seminar: ['Les réussites et les échecs de la Société des Nations', 'Quelles ont été les conséquences de la Grande Dépression sur la politique internationale ?', 'Expliquer en quoi la guerre d’Espagne et les conflits en Mandchourie et en Chine ont préparé la Seconde Guerre mondiale'] },
    { n: 5, title: 'Décolonisation, tiers-monde, économie internationale, développement durable', ch: [12], seminar: ['Comment les leçons de l’échec de la Société des Nations ont-elles influencé la création de l’ONU ?', 'Les origines de la guerre froide entre les États-Unis et l’URSS étaient-elles avant tout idéologiques ?', 'Comment les États-Unis et l’URSS ont-ils évité le conflit nucléaire jusqu’à la crise des missiles de Cuba ?'] },
    { n: 6, title: 'La détente et la fin de la guerre froide (1962–1991)', ch: [10, 11, 12, 14, 19], seminar: ['Comment l’environnement est-il devenu un enjeu des relations internationales ?', 'Expliquer les causes et les conséquences de l’effondrement du système de Bretton Woods', '« La guerre froide s’est jouée dans le tiers-monde » : discuter'] },
    { n: 7, title: 'Le système international après la guerre froide : stabilité ou désordre ?', ch: [19, 21, 22], seminar: ['La détente a-t-elle prolongé la « coexistence pacifique » ou avait-elle sa propre logique ?', 'Qu’est-ce qui explique le retour des tensions Est-Ouest après 1975 ?', 'Pourquoi l’URSS a-t-elle perdu la guerre froide ?'] },
    { n: 8, title: 'La construction européenne', ch: [20], seminar: ['L’ONU a-t-elle été à la hauteur des attentes de ses fondateurs ?', 'Les États-Unis et la Chine vont-ils vers une nouvelle guerre froide ?', 'Le rôle des armes nucléaires dans la stabilité internationale depuis la fin de la guerre froide'] },
    { n: 9, title: 'L’essor de l’Asie', ch: [9, 11, 13, 14], seminar: ['En quoi la construction européenne rompt-elle avec les anciens systèmes d’États en Europe ?', 'Que représente la relation franco-allemande pour le projet européen ?', 'Comment la Russie est-elle devenue le principal défi pour la sécurité européenne après la guerre froide ?'] },
    { n: 10, title: 'Les divisions de l’Afrique et du Moyen-Orient', ch: [4, 12, 16, 17, 18], seminar: ['Pourquoi l’Asie s’est-elle décolonisée avant l’Afrique ?', 'Quels sont les obstacles à l’intégration régionale en Asie ?', 'Quel est le rôle de l’Inde dans l’équilibre international des puissances ?'] },
    { n: 11, title: 'L’Amérique latine sur la scène internationale', ch: [5, 15], seminar: ['Dans quelle mesure les conflits israélo-arabes ont-ils été provoqués par des forces extérieures ?', 'Quelles sont les puissances régionales en Afrique ?', 'Quels obstacles ont freiné l’intégration des États africains dans l’économie mondiale ?'] }
  ];

  function buildIR11() {
    var seen = {};
    var weeks = [{
      n: 0, title: 'Avant le cours — lectures obligatoires',
      topics: ['Lectures obligatoires avant le début du cours (avancées via ta routine « Lecture du livre de RI »)'],
      activities: [
        reading('IR11-pre-allison', 'Graham Allison — « Destined for War » : l’Amérique et la Chine peuvent-elles échapper au piège de Thucydide ? (2017)', 0, { viaRoutine: 'ir-book', src: 'Syllabus : à lire avant le début du cours' }),
        reading('IR11-pre-ambrose', 'Ambrose & Brinkley — « Rise to Globalism » : la politique étrangère américaine depuis 1938 (2012)', 0, { viaRoutine: 'ir-book', src: 'Syllabus : à lire avant le début du cours' }),
        reading('IR11-pre-toft', 'Monica Duffy Toft — « Le retour des sphères d’influence », Foreign Affairs (13 mars 2025)', 30, { src: 'Syllabus : à lire avant le début du cours' })
      ]
    }];
    IR11_WEEKS.forEach(function (w) {
      var p = wid('IR11', w.n), refs = [];
      var list = workflow(p, { inClass: ['followup', 'seminar'] });
      w.ch.forEach(function (c) {
        var id = 'IR11-best-ch' + pad(c);
        if (seen[id]) { refs.push({ id: id, week: seen[id] }); return; }
        seen[id] = w.n;
        list.push(reading(id, 'Lire dans le manuel : chapitre ' + c, 45));
      });
      list.push(A(p + '-semprep', 'prep', w.n === 1 ? 'Séminaire : attribution des sujets de présentation' : 'Préparer le séminaire — réfléchir aux 3 questions de présentation', w.n === 1 ? 10 : 30, { syllabus: true, prereq: [p + '-video'], questions: w.n === 1 ? null : w.seminar, src: 'Syllabus : sujets de présentation en séminaire' }));
      weeks.push({ n: w.n, title: w.title, topics: w.n === 1 ? w.seminar : w.seminar.map(function (q, i) { return 'Question de séminaire ' + (i + 1) + ' — ' + q; }), refs: refs, activities: list });
    });
    return weeks;
  }

  // ================================================================ MG11 — Entreprise et stratégie
  var MG11_WEEKS = [
    { n: 1, lecture: 'Introduction aux modèles économiques', seminar: 'De ton équipe à des idées à impact durable (les 17 objectifs de l’ONU)', readings: [] },
    { n: 2, lecture: 'Entrepreneuriat et start-up', extra: 'Conférence avec l’incubateur Blue Factory de l’ESCP', seminar: 'Tes ressources et ton environnement', readings: [['bia-p2', '« Business in Action » — partie 2', 90]] },
    { n: 3, lecture: 'Analyser un secteur : structure, 5 forces et environnement concurrentiel', seminar: 'De l’idée au projet', readings: [['es-ch3', '« Exploring Strategy » — chapitre 3', 50], ['es-ch4', '« Exploring Strategy » — chapitre 4', 50]] },
    { n: 4, lecture: 'Ressources et compétences : introduction à l’approche par les ressources', seminar: 'Des utilisateurs à la proposition de valeur', readings: [['es-ch5', '« Exploring Strategy » — chapitre 5', 50]] },
    { n: 5, lecture: 'Développer des avantages concurrentiels', seminar: 'De la proposition de valeur au test de ton idée', readings: [['es-ch8', '« Exploring Strategy » — chapitre 8, sections 8.1 et 8.2', 35], ['htts-4-7', '« How to Think Strategically » — chapitres 4 à 7', 80]] },
    { n: 6, lecture: 'Développer une entreprise grâce à un bon portefeuille de produits (matrices BCG, Ansoff et McKinsey)', seminar: 'Pensée stratégique : construire ton modèle économique en pensant durabilité', readings: [['es-ch9', '« Exploring Strategy » — chapitre 9', 50]] },
    { n: 7, lecture: 'Types de marchés, différenciation et (re)positionnement', seminar: 'Construire ton mix marketing', readings: [['bia-ch12', '« Business in Action » — chapitre 12', 45]] },
    { n: 8, lecture: 'L’innovation dans l’organisation', seminar: 'Estimer les coûts et trouver des financements', readings: [['es-ch11', '« Exploring Strategy » — chapitre 11, sections 11.3 à 11.5', 40], ['bia-ch13', '« Business in Action » — chapitre 13', 45]] },
    { n: 9, lecture: 'Conception, structure et dynamique des organisations ; conduire le changement', seminar: 'Estimer les revenus', readings: [['bia-ch7', '« Business in Action » — chapitre 7', 45], ['bia-ch8', '« Business in Action » — chapitre 8', 45]] },
    { n: 10, lecture: 'Gérer le capital humain dans et hors de l’organisation', seminar: 'Construire ta stratégie', readings: [['bia-ch10', '« Business in Action » — chapitre 10', 45], ['bia-ch11', '« Business in Action » — chapitre 11', 45]] },
    { n: 11, lecture: 'Le développement à l’international', seminar: 'Présentation du business plan', readings: [['es-ch10', '« Exploring Strategy » — chapitre 10', 50]] }
  ];

  function buildMG11() {
    return MG11_WEEKS.map(function (w) {
      var p = wid('MG11', w.n);
      var list = workflow(p, { inClass: ['followup', 'seminar'] });
      list.forEach(function (a) { if (a.type === 'video') a.title = 'Regarder le cours préenregistré : ' + w.lecture; if (a.session === 'seminar') a.title = 'Exercices pendant le séminaire : ' + w.seminar; });
      list.push(A(p + '-parents', 'film', 'Faire une vidéo pour les parents', 30, { step: 13, prereq: [p + '-fiches'], src: 'Ta demande : une vidéo chaque semaine de stratégie' }));
      w.readings.forEach(function (r) { list.push(reading(p + '-read-' + r[0], 'Lire : ' + r[1], r[2])); });
      list.push(A(p + '-proj', 'project', w.n === 11 ? 'Plan d’affaires — présentation finale prête' : 'Plan d’affaires — point de groupe après « ' + w.seminar + ' »', w.n === 11 ? 90 : 30, { syllabus: true, src: 'Syllabus MG11 — projet de groupe (40 %)' }));
      return { n: w.n, title: 'Séance ' + w.n + ' — ' + w.lecture, topics: ['Cours | ' + w.lecture].concat(w.extra ? [w.extra] : []).concat(['Séminaire | ' + w.seminar]), activities: list };
    });
  }

  // ================================================================ SK11 — Présentation, débat et rhétorique
  var SK11_SESSIONS = [
    { n: 1, title: 'Introduction à la rhétorique — l’importance de bien cibler', videos: ['1.1 Présentation du module', '1.2 Qu’est-ce que la rhétorique ?', '1.3 Le triangle de la communication', '1.4 Syllogismes et enthymèmes', '1.5 Le discours délibératif', '1.6 Trouver un angle'] },
    { n: 2, title: 'Trouver des arguments — la découverte des sujets', videos: ['2.1 Rationnel, émotionnel ou éthique', '2.2 Le discours judiciaire', '2.3 Définition et comparaison', '2.4 Relation', '2.5 Circonstances et témoignage'] },
    { n: 3, title: 'Faits et opinions — le besoin de rigueur · l’usage de l’IA', videos: [], prep: 'Préparer la comparaison entre arguments écrits par l’IA et par un humain (limites et biais)' },
    { n: 4, title: 'Mettre en ordre — organiser son contenu', videos: ['4.1 Identifier les éléments', '4.2 L’arc narratif', '4.3 Introduction et description', '4.4 Argumentation et conclusion', '4.5 Répondre aux objections'], note: 'Travail d’équipe donné pendant cette séance' },
    { n: 5, title: 'Choisir un style — produire le bon effet', videos: ['5.1 Choisir un style', '5.2 Le discours de cérémonie', '5.3 Développer ton propre style', '5.4 2 500 ans de rhétorique', '5.5 Le travail d’équipe'] },
    { n: 6, title: 'Structurer une présentation — construire son argumentaire', videos: ['6.1 Ce qui fait une réunion', '6.2 Raconter l’histoire', '6.3 Les fils conducteurs', '6.4 Préparer la présentation', '6.5 Le principe de la pyramide', '6.6 Des diapositives réussies', '6.7 La présentation finale'], note: 'Dissertation individuelle (examen sans documents) à mi-parcours — séances 1 à 6' },
    { n: 7, title: 'La pratique du débat — discuter d’idées et de choix', videos: ['7.1 La pratique du débat', '7.2 Construire des arguments', '7.3 Conseils rapides', '7.4 Le débat formel', '7.5 La structure', '7.6 Tactiques de débat', '7.7 Savoir négocier', '7.8 Répondre aux objections'] },
    { n: 8, title: 'Prise de parole individuelle — les bases', videos: ['8.1 Les bases de la prise de parole', '8.2 Les clés de la confiance', '8.3 Maîtriser le langage corporel', '8.4 Créer de l’empathie'] },
    { n: 9, title: 'Prise de parole en équipe — travailler en groupe', videos: ['9.1 Travailler en groupe', '9.2 La force du travail d’équipe', '9.3 Répondre aux questions', '9.4 Présenter à partir de graphiques'] },
    { n: 10, title: 'Dialoguer à distance — penser et préparer', videos: ['10.1 Communiquer à distance', '10.2 Choisir le canal', '10.3 Au téléphone', '10.4 Le bilan après coup', '10.5 Les bonnes manières en visio'] },
    { n: 11, title: 'Séances 11 et 12 — présentations finales en équipe', videos: [], prep: 'Présentation d’équipe préparée avant la séance', project: true }
  ];

  function buildSK11() {
    return SK11_SESSIONS.map(function (s) {
      var p = wid('SK11', s.n), list;
      if (s.videos.length) list = workflow(p, { videos: s.videos, inClass: ['workshop'] });
      else list = [A(p + '-workshop', 'inclass', 'Atelier en classe', 45, { session: 'workshop', inClass: true, step: 10 })];
      if (s.prep) list.push(A(p + '-prep', s.project ? 'project' : 'prep', s.prep, s.project ? 120 : 45, { syllabus: true, src: 'Syllabus SK11' }));
      return { n: s.n, title: 'Séance ' + s.n + ' — ' + s.title, note: s.note, topics: s.videos.length ? s.videos : [s.prep], activities: list };
    });
  }

  // ================================================================ LE11 — Méthodologie
  // Le syllabus ne donne pas de semaine pour chaque atelier : on suit l'ordre officiel
  // (séance d'intro, puis vidéo k + atelier k) et on le marque « semaine estimée ».
  var LE11_UNITS = [
    { n: 1, title: 'Séance d’introduction — apprendre à l’université et ce qu’on attend de toi', readings: [['ch1', 'Cottrell — chapitre 1', 40]] },
    { n: 2, lecture: 'Cours 1 (vidéo) : tirer le meilleur de tes études', workshop: 'Atelier 1 — Efficacité personnelle : organiser ses études et stratégies d’apprentissage', readings: [['ch2', 'Cottrell — chapitre 2', 35], ['ch6', 'Cottrell — chapitre 6', 35]] },
    { n: 3, lecture: 'Cours 2 (vidéo) : gérer un projet de groupe', workshop: 'Atelier 2 — Relations : communication et retours dans le travail de groupe', readings: [['ch8', 'Cottrell — chapitre 8', 35], ['ch9', 'Cottrell — chapitre 9', 35]], optional: 'Hartley et al. (2022), « Success in Groupwork »' },
    { n: 4, lecture: 'Cours 3 (vidéo) : travailler avec les autres et compétence interculturelle', workshop: 'Atelier 3 — Relations : travail d’équipe, négociation et gestion des conflits', readings: [], refs: ['Cottrell ch. 8 et 9 (déjà en S3)'], optional: 'Hartley et al. (2022), « Success in Groupwork »' },
    { n: 5, lecture: 'Cours 4 (vidéo) : chercher et gérer l’information pour étudier', workshop: 'Atelier 4 — Compétences académiques : chercher et gérer l’information académique', readings: [['ch10', 'Cottrell — chapitre 10', 35], ['ch11', 'Cottrell — chapitre 11', 35]] },
    { n: 6, lecture: 'Cours 5 (vidéo) : travailler avec des sources académiques', workshop: 'Atelier 5 — Compétences académiques : utiliser les sources académiques', readings: [['ch13', 'Cottrell — chapitre 13', 35]], optional: 'Greetham (2018), « How to Write Better Essays »' },
    { n: 7, lecture: 'Cours 6 (vidéo) : écriture académique et esprit critique', workshop: 'Atelier 6 — Compétences académiques : écriture académique et esprit critique', readings: [['ch14', 'Cottrell — chapitre 14', 35], ['ch15', 'Cottrell — chapitre 15', 35]], refs: ['Cottrell ch. 13 (déjà en S6)'], optional: 'Cottrell (2017), « Critical Thinking Skills »' }
  ];

  function buildLE11() {
    var weeks = LE11_UNITS.map(function (u) {
      var p = wid('LE11', u.n), list;
      if (u.lecture) {
        list = workflow(p, { inClass: ['workshop'] });
        list.forEach(function (a) { if (a.type === 'video') { a.title = 'Regarder le ' + u.lecture.charAt(0).toLowerCase() + u.lecture.slice(1); a.src = 'Syllabus : vidéo à voir avant l’atelier — dès qu’elle est disponible'; } });
      } else list = [A(p + '-workshop', 'inclass', 'Séance d’introduction (en classe)', 45, { session: 'workshop', inClass: true, step: 10 })];
      u.readings.forEach(function (r) { list.push(reading(p + '-read-' + r[0], 'Lire : ' + r[1], r[2])); });
      if (u.optional) list.push(reading(p + '-opt', 'Facultatif : ' + u.optional, 30, { optional: true }));
      return { n: u.n, title: u.workshop || u.title, flags: ['Semaine estimée : le syllabus donne l’ordre des ateliers, pas leurs dates.'], refsText: u.refs, topics: [u.lecture, u.workshop].filter(Boolean), activities: list };
    });
    weeks.push({
      n: 12, title: 'Contenus en ligne — travail personnel à ton rythme', flags: ['Contenu à ton rythme, selon ton bilan de compétences personnel : facultatif dans le planning.'],
      topics: ['Selon les priorités de ton bilan de compétences personnel'],
      activities: [
        A('LE11-dig-exams', 'video', 'Préparer les examens — stratégies et éthique', 30, { optional: true }),
        A('LE11-dig-feedback', 'video', 'Les retours des profs à l’université', 20, { optional: true }),
        A('LE11-dig-memory', 'video', 'Apprendre efficacement et mémoriser', 30, { optional: true }),
        A('LE11-dig-reading', 'video', 'Lire efficacement, prendre des notes et comprendre', 30, { optional: true }),
        A('LE11-dig-library', 'video', 'Utiliser la bibliothèque et les ressources académiques', 20, { optional: true }),
        A('LE11-dig-resilience', 'video', 'Résilience, état d’esprit de progression, motivation et difficultés', 30, { optional: true }),
        A('LE11-dig-stress', 'video', 'Gérer le stress et le bien-être pendant les études et les examens', 30, { optional: true }),
        A('LE11-test', 'test', 'Test en ligne : intégrité académique et fraude (20 %)', 40, { syllabus: true, src: 'Syllabus : test individuel en ligne — date non précisée', needsDate: true })
      ]
    });
    return weeks;
  }

  // ================================================================ Matières
  // Couleurs reprises de tes dossiers ESCP B1. `prepOffset` = jour (après le lundi de la semaine)
  // avant lequel la préparation de la semaine est visée — un objectif, jamais une deadline.
  var SUBJECTS = [
    // color = pastel principal, soft = fond très clair, ink = texte lisible sur ces fonds.
    { id: 'MA11', name: 'Fondamentaux des mathématiques 1', short: 'Maths', color: '#EBA3BA', soft: '#F9DDE6', ink: '#9E4F6B', sequential: true, prepOffset: 6, prepDays: [4, 6, 0, 1, 2, 3, 5], ects: 6,
      books: ['Haeussler, Paul & Wood — « Introductory Mathematical Analysis » (14e éd.) : le manuel officiel du cours'],
      prepNote: 'Objectif : semaine bouclée avant le MyLab du lundi suivant.' },
    { id: 'EC11', name: 'Microéconomie', short: 'Micro', color: '#C4ADE0', soft: '#ECE3F6', ink: '#76579B', sequential: true, prepOffset: 5, prepDays: [5, 1, 3, 6], ects: 6,
      books: ['Krugman & Wells — « Microeconomics » (3e éd.) : le manuel officiel du cours'],
      prepNote: 'Objectif : cours étudié avant le test hebdomadaire en ligne du samedi.' },
    { id: 'IR11', name: 'Relations internationales et histoire européenne et mondiale', short: 'RI', color: '#F4C095', soft: '#FCE8D6', ink: '#A2653A', prepOffset: 0, prepDays: [4, 0], ects: 6,
      books: ['Best, Hanhimäki, Maiolo & Schulze — « International History of the Twentieth Century and Beyond » (4e éd.) : le manuel officiel du cours'],
      prepNote: 'Objectif : préparation finie avant le cours du lundi.' },
    { id: 'MG11', name: 'Introduction aux organisations et à la stratégie d’entreprise', short: 'Stratégie', color: '#F2B8C9', soft: '#FCE6EC', ink: '#A0566F', prepOffset: 0, prepDays: [5, 4, 0], ects: 6,
      books: ['Johnson et al. — « Exploring Strategy » (13e éd.)', 'Bovee, Paul & Thill — « Business in Action » (10e éd.)', 'Sola & Couturier — « How to Think Strategically »'],
      prepNote: 'Objectif : préparation finie avant le cours du lundi.' },
    { id: 'SK11', name: 'Présentation, débat et rhétorique', short: 'Rhétorique', color: '#EDD38A', soft: '#FAF0CF', ink: '#8E7024', prepOffset: 2, prepDays: [2, 1, 0], ects: 3,
      books: ['Pas de manuel obligatoire : tout est dans les vidéos Blackboard'],
      prepNote: 'Objectif : vidéos vues avant l’atelier du mercredi. L’examen final a eu lieu en octobre.' },
    { id: 'LE11', name: 'Méthodologie universitaire', short: 'Méthodo', color: '#B6D39A', soft: '#E5F0D8', ink: '#5B7C42', prepOffset: 5, prepDays: [6, 0], ects: 3, weeksEstimated: true,
      books: ['Cottrell — « The Study Skills Handbook » (5e éd.) : le manuel officiel du cours'],
      prepNote: 'Vidéos à faire le samedi, dès qu’elles sont disponibles.',
      finished: 'Examen final passé en octobre : ce qui reste devient facultatif, sans rattrapage.' },
    { id: 'ZH', name: 'Chinois mandarin', short: 'Chinois', color: '#EFAE9C', soft: '#FBE2DA', ink: '#9E5A47', noSyllabus: true,
      prepNote: 'Pas de syllabus fourni : suivi par tes routines (cours du mardi, pratique et vocabulaire quotidiens).' },
    { id: 'IT', name: 'Italien', short: 'Italien', color: '#A9CCE8', soft: '#E0EEF8', ink: '#4D7A9C', noSyllabus: true,
      prepNote: 'Pas de syllabus fourni : suivi par tes routines (fiche du lundi, révision du dimanche).' }
  ];

  var BUILDERS = { EC11: buildEC11, MA11: buildMA11, IR11: buildIR11, MG11: buildMG11, SK11: buildSK11, LE11: buildLE11 };
  SUBJECTS.forEach(function (s) { s.weeks = BUILDERS[s.id] ? BUILDERS[s.id]() : []; });

  // ================================================================ Évaluations
  // Dates des finals : calendrier « Fall final exams – B1 ». Les autres ne sont pas encore datées.
  var ASSESSMENTS = [
    { id: 'EC11-mid', subject: 'EC11', title: 'Partiel de mi-semestre (QCM, 45 min) — semaines 1 à 6', weight: 15, when: 'Après la semaine 6', date: null },
    { id: 'EC11-proj', subject: 'EC11', title: 'Présentation du projet de groupe', weight: 20, when: 'Semaines 8 et 9 (groupes 1 à 3 / 4 à 6)', date: null },
    { id: 'EC11-final', subject: 'EC11', title: 'Examen final (semaines 1 à 11)', weight: 50, when: 'Mercredi 9 décembre · 9 h 30 · 1 h 30', date: '2026-12-09', time: '09:30' },
    { id: 'MA11-mid', subject: 'MA11', title: 'Partiel de mi-semestre (1 h 30, QCM)', weight: 30, when: 'Vers la semaine 6 ou 7', date: null },
    { id: 'MA11-final', subject: 'MA11', title: 'Examen final (2 h, QCM, toutes les séances)', weight: 60, when: 'Lundi 14 décembre · 14 h · 2 h', date: '2026-12-14', time: '14:00' },
    { id: 'IR11-pres', subject: 'IR11', title: 'Présentation de groupe (15 min)', weight: 20, when: 'Sujet attribué en semaine 1', date: null },
    { id: 'IR11-mid', subject: 'IR11', title: 'Partiel de mi-semestre (2 h, 2 dissertations sur 3)', weight: 20, when: 'Mi-semestre', date: null },
    { id: 'IR11-final', subject: 'IR11', title: 'Examen final (2 h, 2 dissertations sur 3)', weight: 50, when: 'Jeudi 10 décembre · 10 h · 2 h', date: '2026-12-10', time: '10:00' },
    { id: 'MG11-proj', subject: 'MG11', title: 'Présentation du plan d’affaires (projet de groupe)', weight: 40, when: 'Séance 11', date: null },
    { id: 'MG11-final', subject: 'MG11', title: 'Examen final (sans documents)', weight: 50, when: 'Vendredi 11 décembre · 10 h · 2 h', date: '2026-12-11', time: '10:00' },
    { id: 'SK11-essay', subject: 'SK11', title: 'Dissertation individuelle (sans documents, séances 1 à 6)', weight: 40, when: 'Mi-parcours', date: null },
    { id: 'SK11-team', subject: 'SK11', title: 'Présentation finale en équipe', weight: 40, when: 'Séances 11 et 12', date: null },
    { id: 'LE11-final', subject: 'LE11', title: 'Examen final — dissertation académique individuelle', weight: 50, when: 'Passé en octobre', date: null, past: true }
  ];

  // ================================================================ Routines (ta structure hebdo)
  // days : 0 = dimanche … 6 = samedi. `mins` compte dans ta charge du jour. `kind: 'class'` = cours,
  // affiché mais sans temps d'étude. Les blocs « principaux » (IR jeudi, Micro vendredi…) ne sont
  // pas des routines : ce sont des préférences de jour par matière (`prepDays`) utilisées par le moteur.
  var ROUTINES = [
    { id: 'math-practice', title: 'Pratique de maths du jour', subject: 'MA11', mins: 30, days: [0, 1, 2, 3, 5, 6], daily: true, adaptive: 'MA11' },
    { id: 'math-practice-thu', title: 'Grosse séance de maths', subject: 'MA11', mins: 60, days: [4], daily: true, adaptive: 'MA11' },
    { id: 'zh-practice', title: 'Pratique du mandarin', subject: 'ZH', mins: 20, days: [0, 1, 2, 3, 4, 5, 6], daily: true },
    { id: 'ir-book', title: 'Lecture du livre de RI', subject: 'IR11', mins: 20, days: [0, 1, 2, 3, 4, 5, 6], daily: true },
    { id: 'it-class', title: 'Cours d’italien', subject: 'IT', kind: 'class', mins: 0, days: [1] },
    { id: 'it-sheet', title: 'Fiche de leçon d’italien (après le cours)', subject: 'IT', mins: 30, days: [1] },
    { id: 'class-flash', title: 'Pendant les cours de RI et de stratégie : cartes mémoire ou exercices si un moment s’y prête', subject: 'IR11', kind: 'class', mins: 0, days: [1] },
    { id: 'zh-homework', title: 'Devoirs de mandarin', subject: 'ZH', mins: 30, days: [1] },
    { id: 'micro-review', title: 'Révision micro : cartes mémoire, notes ou un petit exercice', subject: 'EC11', mins: 20, days: [1] },
    { id: 'zh-prep-tue', title: 'Préparer le mandarin pour mardi (si besoin)', subject: 'ZH', mins: 15, days: [1], optional: true },
    { id: 'zh-class', title: 'Cours de mandarin', subject: 'ZH', kind: 'class', mins: 0, days: [2] },
    { id: 'zh-notes', title: 'Mettre au propre les notes de mandarin', subject: 'ZH', mins: 20, days: [2] },
    { id: 'check-new', title: 'Vérifier Blackboard / MyLab : nouveaux contenus et échéances', mins: 10, days: [3] },
    { id: 'mylab-check', title: 'Vérifier les devoirs MyLab de la semaine', subject: 'MA11', mins: 10, days: [6] },
    { id: 'biz-monday', title: 'Vérifier les devoirs de stratégie dus lundi matin', subject: 'MG11', mins: 15, days: [0] },
    { id: 'it-review', title: 'Réviser l’italien + exercices pour lundi', subject: 'IT', mins: 30, days: [0] },
    { id: 'zh-prep-sun', title: 'Préparer le mandarin (si besoin)', subject: 'ZH', mins: 15, days: [0], optional: true },
    { id: 'week-review', title: 'Revue de la semaine qui arrive : charge et priorités', mins: 15, days: [0] }
  ];

  // Emploi du temps : repris de ton calendrier ESCP (semaine du 2 novembre 2026).
  // Amphithéâtre = follow-up session (1 h), salle de cours = séminaire (1 h 30).
  var TIMETABLE = [
    { id: 'tt-it', subject: 'IT', kind: 'language', day: 1, start: '08:15', end: '10:15' },
    { id: 'tt-mg-fu', subject: 'MG11', kind: 'followup', day: 1, start: '13:00', end: '14:00' },
    { id: 'tt-ir-fu', subject: 'IR11', kind: 'followup', day: 1, start: '14:15', end: '15:15' },
    { id: 'tt-ma-fu', subject: 'MA11', kind: 'followup', day: 2, start: '09:15', end: '10:15' },
    { id: 'tt-ec-fu', subject: 'EC11', kind: 'followup', day: 2, start: '11:45', end: '12:45' },
    { id: 'tt-zh', subject: 'ZH', kind: 'language', day: 2, start: '13:30', end: '15:30' },
    { id: 'tt-ec-sem', subject: 'EC11', kind: 'seminar', day: 3, start: '08:30', end: '10:00' },
    { id: 'tt-sk-ws', subject: 'SK11', kind: 'workshop', day: 3, start: '13:00', end: '14:30' },
    { id: 'tt-ir-sem', subject: 'IR11', kind: 'seminar', day: 3, start: '14:45', end: '16:15' },
    { id: 'tt-ma-sem', subject: 'MA11', kind: 'seminar', day: 4, start: '08:30', end: '10:00' },
    { id: 'tt-mg-sem', subject: 'MG11', kind: 'seminar', day: 4, start: '10:15', end: '11:45' }
  ];
  // Ancien emploi du temps de départ (jours seulement) : remplacé une fois chez toi par le vrai.
  var TIMETABLE_V1_IDS = ['tt-it', 'tt-ir', 'tt-mg', 'tt-zh'];

  root.SCHOOL_CURRICULUM = {
    version: 1,
    calendar: CALENDAR,
    subjects: SUBJECTS,
    assessments: ASSESSMENTS,
    routines: ROUTINES,
    timetable: TIMETABLE,
    timetableVersion: 2,
    timetableV1Ids: TIMETABLE_V1_IDS
  };
})(typeof window !== 'undefined' ? window : globalThis);
