// École OS — curriculum structuré, extrait des syllabus officiels ESCP BIM B1 Fall 2026/2027.
// C'est la SOURCE DE VÉRITÉ de ce qu'il faut apprendre. On n'y stocke jamais de progression :
// la progression vit dans localStorage ('school_state'), le planning est recalculé par engine.js.
//
// Règles suivies :
//  - Intitulés, chapitres et ordre repris tels quels des syllabus (en anglais, comme les PDF).
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
    breaks: [{ from: '2026-10-19', to: '2026-11-01', label: 'Pause entre S6 et S7 (midterms / vacances)' }]
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

  // ================================================================ EC11 — Microeconomics
  var EC11_WEEKS = [
    { n: 1, part: 'Part 1: Fundamentals of Microeconomics', title: 'Introduction to Microeconomics',
      topics: ['Defining microeconomics', 'Main principles', 'Applications of microeconomics to business'],
      readings: [['intro-ch1', 'Krugman & Wells — Introduction and Chapter 1 (all pages)', 60]],
      project: 'Group Project: Guidelines' },
    { n: 2, title: 'Supply and Demand, Market Equilibrium and Price Discovery',
      topics: ['Supply and demand schedule', 'Supply and demand curve', 'Movements along the supply and demand curve', 'Shifts of the supply and demand curve', 'Supply, demand and market equilibrium', 'Changes in supply and demand, new market equilibrium'],
      readings: [['ch3', 'Krugman & Wells — Chapter 3, p. 65–95', 60]] },
    { n: 3, title: 'Market Equilibrium and Price Discovery (cont.)',
      topics: ['Consumer surplus and the demand curve', 'Producer surplus and the supply curve', 'Price controls: price ceilings and price floors'],
      readings: [['ch4', 'Krugman & Wells — Chapter 4 (all pages)', 50], ['ch5', 'Krugman & Wells — Chapter 5, p. 127–141', 30]],
      project: 'Group Project: Start of research' },
    { n: 4, title: 'Elasticity',
      topics: ['Defining, measuring and interpreting the price elasticity of demand (PED)', 'Factors determining PED', 'PED and pricing strategy for business', 'YED, XED, PES; implications for business'],
      readings: [['ch6', 'Krugman & Wells — Chapter 6 (all pages)', 50]] },
    { n: 5, title: 'Costs',
      topics: ['Explicit versus implicit costs', 'From the production function to costs curves', 'Marginal cost and average cost', 'Short run versus long run costs', 'Returns to scale'],
      readings: [['ch9a', 'Krugman & Wells — Chapter 9, p. 244–245', 10], ['ch11', 'Krugman & Wells — Chapter 11 (all pages)', 50]],
      project: 'Group Project: Consultations #1' },
    { n: 6, part: 'Part 2: Producer Theory', title: 'Decision Making by Firms',
      topics: ['Costs, benefits, and profits', 'Accounting profit versus economic profit', 'Making "either-or" decisions', 'Making "how much" decisions: the role of marginal analysis', 'Profit maximizing principle of marginal analysis'],
      readings: [['ch9b', 'Krugman & Wells — Chapter 9, p. 243–258', 40]],
      project: 'Group Project: Consultations #2' },
    { n: 7, title: 'Perfect Competition',
      topics: ['Defining perfect competition', 'Production and profits in perfect competition', 'Using marginal analysis to choose the profit-maximizing quantity of output', 'Production decision (shut down criteria)', 'Long run equilibrium'],
      readings: [['ch12', 'Krugman & Wells — Chapter 12 (all pages)', 50]] },
    { n: 8, title: 'Monopoly',
      topics: ['Meaning of monopoly', "Monopolist's demand curve and marginal revenue", "Monopolist's profit-maximizing output and price", 'Monopoly versus perfect competition: inefficiency of monopoly', 'Monopoly and public policy', 'Solving for the monopoly problem', 'Price discrimination'],
      readings: [['ch13', 'Krugman & Wells — Chapter 13 (all pages)', 50]],
      project: 'Group Project: Presentations (groups 1 to 3)' },
    { n: 9, title: 'Oligopoly',
      topics: ['Prevalence of oligopoly', 'Understanding oligopoly', 'Collusion and competition', "Games oligopolists play: the prisoners' dilemma", 'Kinked demand curve in oligopoly', 'Oligopoly in practice'],
      readings: [['ch14', 'Krugman & Wells — Chapter 14 (all practice)', 50]],
      project: 'Group Project: Presentations (groups 4 to 6)' },
    { n: 10, title: 'Game Theory and Competitive Strategy',
      topics: ['Noncooperative versus cooperative games', 'Dominant strategies', 'The Nash Equilibrium', 'Repeated games and cartels', 'Sequential games (if time permits)'],
      readings: [['ch14b', 'Krugman & Wells — Chapter 14, p. 414–420', 20], ['extra', 'Additional reading material (will be provided)', 30, { blocked: 'Pas encore fourni par le prof' }]] },
    { n: 11, title: 'Get Ready for the Final Exam: Revision', topics: ['Revision of weeks 1–11'], readings: [], revision: true }
  ];

  function buildEC11() {
    return EC11_WEEKS.map(function (w) {
      var p = wid('EC11', w.n), list = [];
      if (!w.revision) {
        list.push(A(p + '-video', 'video', 'Watch the pre-recorded lecture (~30 min)', 35, { src: 'Syllabus : lectures prerecorded, ~30 min — à voir avant le follow-up' }));
      }
      var readIds = [];
      w.readings.forEach(function (r) {
        var x = A(p + '-read-' + r[0], 'reading', r[1], r[2], r[3] || {});
        list.push(x); readIds.push(x.id);
      });
      if (!w.revision) {
        list.push(A(p + '-notes', 'notes', 'Course notes / flashcards for this chapter', 25, { prereq: [p + '-video'], src: 'Ta routine (révision micro : flashcards, notes)' }));
        list.push(A(p + '-class', 'class', 'Follow-up session (60 min) — attended', 60, { src: 'Syllabus : follow-up classroom session' }));
        list.push(A(p + '-sem', 'exercise', 'Seminar exercises (90 min seminar)', 45, { seminar: true, prereq: [p + '-video'].concat(readIds), src: 'Syllabus : seminars = exercises + group project' }));
        list.push(A(p + '-quiz', 'quiz', 'Weekly online test on Blackboard', 20, { dueOffset: 5, dueTime: '23:59', dueSrc: 'Syllabus : « each week by Saturday evening »', prereq: [p + '-video'].concat(readIds), weight: '15 % (tous les tests)' }));
      } else {
        list.push(A(p + '-rev', 'revision', 'Revision session — all weeks 1–11', 90, { src: 'Syllabus : revision session the week before the exam' }));
      }
      if (w.project) list.push(A(p + '-proj', 'project', w.project, 30, { src: 'Syllabus EC11 — group project (20 %)' }));
      return { n: w.n, part: w.part, title: w.title, topics: w.topics, activities: list };
    });
  }

  // ================================================================ MA11 — Fundamentals of Mathematics 1
  var MA11_WEEKS = [
    { n: 1, title: 'Session 1: Review of basic algebra', chapter: 'Chapter 0',
      sections: [['0.1–0.2 Sets & properties of real numbers (self-study revision)', 20], ['0.3 Exponents and radicals', 20], ['0.4 Operations with algebraic expressions', 20], ['0.5 Factoring', 20], ['0.6 Fractions', 20]] },
    { n: 2, title: 'Session 2: Equations and inequalities', chapter: 'Chapters 0 & 1',
      sections: [['0.7 Equations, in particular Linear Equations', 20], ['0.8 Quadratic Equations', 20], ['1.1 Applications of equations', 20], ['1.2 Linear Inequalities', 15], ['1.3 Applications of inequalities', 15], ['1.4 Absolute Value', 15]] },
    { n: 3, title: 'Sessions 3&4: Functions and graphs (part 1 — Chapter 2)', chapter: 'Chapter 2', split: 'Le syllabus regroupe les séances 3 & 4 ; répartition proposée : ch. 2 en S3, ch. 3 en S4.',
      sections: [['2.1 Functions', 15], ['2.2 Special Functions', 15], ['2.3 Combinations of functions', 15], ['2.4 Inverse functions', 15], ['2.5 Graphs in rectangular coordinates', 15], ['2.6 Symmetry', 15], ['2.7 Translations and reflections', 15]] },
    { n: 4, title: 'Sessions 3&4: Functions and graphs (part 2 — Chapter 3)', chapter: 'Chapter 3', split: 'Répartition proposée (voir S3).',
      sections: [['3.1 Lines', 15], ['3.2 Applications and linear functions', 15], ['3.3 Quadratic Functions', 15], ['3.4 Systems of linear equations', 20], ['3.5 Nonlinear Systems', 15], ['3.6 Applications of systems of equations', 20]] },
    { n: 5, title: 'Session 5: Exponential and logarithmic functions', chapter: 'Chapter 4',
      sections: [['4.1 Exponential functions', 20], ['4.2 Logarithmic functions', 20], ['4.3 Properties of logarithms', 20], ['4.4 Logarithmic and exponential equations', 20]] },
    { n: 6, title: 'Session 6: Limits and continuity', chapter: 'Chapter 10', note: 'Midterm exam after this session (week 6 or 7)',
      sections: [['10.1 Limits', 20], ['10.2 Limits (continued)', 20], ['10.3 Continuity', 15], ['10.4 Continuity applied to inequalities', 15]] },
    { n: 7, title: 'Sessions 7&8: Differentiation (part 1)', chapter: 'Chapter 11', split: 'Le syllabus regroupe les séances 7 & 8 ; répartition proposée.',
      sections: [['11.1 The derivative', 25], ['11.2 Rules for differentiation', 25], ['11.3 The derivative as a rate of change', 20]] },
    { n: 8, title: 'Sessions 7&8: Differentiation (part 2)', chapter: 'Chapters 11 & 12', split: 'Répartition proposée (voir S7).',
      sections: [['11.4 The product rule and the quotient rule', 25], ['11.5 The chain rule', 25], ['12.7 Higher order derivatives (introduction)', 15]] },
    { n: 9, title: 'Session 9: Extrema and Curve sketching', chapter: 'Chapter 13', note: 'Section 13.6 is important in terms of business applications.',
      sections: [['13.1 Relative extrema', 20], ['13.2 Absolute extrema on a closed interval', 15], ['13.3 Concavity', 15], ['13.4 Second order derivative test', 15], ['13.5 Asymptotes', 15], ['13.6 Applied maxima and minima', 25]] },
    { n: 10, title: 'Sessions 10&11: Matrix algebra (part 1)', chapter: 'Chapter 6', split: 'Le syllabus regroupe les séances 10 & 11 ; répartition proposée.',
      sections: [['6.1 Matrices', 15], ['6.2 Matrix addition and scalar multiplication', 15], ['6.3 Matrix multiplication', 20]] },
    { n: 11, title: 'Sessions 10&11: Matrix algebra (part 2) + Revision session', chapter: 'Chapter 6', split: 'Répartition proposée (voir S10).',
      sections: [['6.4 Solving systems by reducing matrices', 25], ['6.5 Solving systems by reducing matrices (continued)', 20], ['6.6 Inverses', 25]], revision: true }
  ];

  function buildMA11() {
    return MA11_WEEKS.map(function (w) {
      var p = wid('MA11', w.n), list = [];
      list.push(A(p + '-video', 'video', 'Watch the pre-recorded lecture (~30 min)', 35, { src: 'Syllabus : lectures prerecorded (~30 min)' }));
      var secIds = [];
      w.sections.forEach(function (s, i) {
        var x = A(p + '-sec' + (i + 1), 'reading', 'Haeussler — ' + s[0], s[1], { group: 'Sections du manuel', prereq: i === 0 ? [] : [p + '-sec' + i] });
        list.push(x); secIds.push(x.id);
      });
      list.push(A(p + '-class', 'class', 'Follow-up session (60 min) — attended', 60, { src: 'Syllabus : follow-up session' }));
      list.push(A(p + '-sem', 'exercise', 'Seminar exercises (90 min seminar)', 45, { seminar: true, prereq: [p + '-video'], src: 'Syllabus : seminars = practical exercises' }));
      list.push(A(p + '-mylab', 'assignment', 'MyLab weekly assessment ' + w.n + '/11 (5–10 questions)', 45, { dueOffset: 7, dueTime: '08:00', dueSrc: 'Ta routine : deadline MyLab le lundi — vérifie l’heure exacte sur MyLab', prereq: [p + '-video'], weight: '10 % (les 11 devoirs)' }));
      if (w.revision) list.push(A(p + '-rev', 'revision', 'Revision session (before the final exam)', 90, { src: 'Syllabus : revision session followed by final exam' }));
      return { n: w.n, title: w.title, chapter: w.chapter, note: w.note, flags: w.split ? [w.split] : [], topics: w.sections.map(function (s) { return s[0]; }), activities: list };
    });
  }

  // ================================================================ IR11 — International Relations
  // Les chapitres de Best et al. reviennent sur plusieurs semaines : une seule activité par
  // chapitre (à sa première apparition) ; les semaines suivantes y renvoient (`refs`).
  var IR11_WEEKS = [
    { n: 1, title: 'Introduction and core concepts in International Relations (IR)', ch: [1], seminar: ['Allocation of presentation topics'] },
    { n: 2, title: 'From the Concert of Europe to the Paris Peace System (1900–1919)', ch: [1, 2], seminar: ['What was the Concert of Europe before WWI?', 'How did the rise of new Great Powers (Germany, Japan, US) alter the international system before WWI?', 'Discuss the realistic vs. the liberal approach to international relations'] },
    { n: 3, title: 'The Failure of the League of Nations (1919–1945)', ch: [2, 3, 4, 6, 7], seminar: ['What was the Eastern Question before WWI?', 'Having solved so many crises since 1905, why were the Great Powers unable to solve the crisis of 1914?', 'What were the weaknesses of the Paris Peace System?'] },
    { n: 4, title: 'The bipolar Cold War System (1945–1962)', ch: [8, 9, 12], seminar: ['Discuss the successes and the failures of the League of Nations', 'What were the consequences of the Great Depression for international politics?', 'Explain how the Spanish Civil War and the conflicts in Manchuria and China were important precursors to WWII'] },
    { n: 5, title: 'Decolonization, Third World, International Economy, Sustainable Development', ch: [12], seminar: ['How did the lessons learnt from the failure of the League of Nations influence the establishment of the United Nations Organization?', 'Were the origins of the Cold War between the United States and the Soviet Union primarily ideological?', 'How did the US and the USSR avoid nuclear conflict until the Cuba missile crisis?'] },
    { n: 6, title: 'Détente and the End of the Cold War (1962–1991)', ch: [10, 11, 12, 14, 19], seminar: ['How did environment become an issue in international relations?', 'Explain the causes and the consequences of the collapse of the Bretton Woods System', "'The Cold War was fought in the Third World'. Discuss"] },
    { n: 7, title: 'The International System after the End of the Cold War: Stability or Disorder?', ch: [19, 21, 22], seminar: ["Was 'Détente' a prolongation of 'peaceful coexistence' or did it have its own logic?", 'What accounted for the resurgence of East-West tensions after 1975?', 'Why did the USSR lose the Cold War?'] },
    { n: 8, title: 'European Integration', ch: [20], seminar: ['Did the UNO live up to the expectations of its founders?', 'Are the US and China moving towards a new Cold War?', 'Explain the role of nuclear weapons in contemporary international stability since the end of the Cold War'] },
    { n: 9, title: 'The Rise of Asia', ch: [9, 11, 13, 14], seminar: ['How does the European integration represent a break with past forms of states systems in Europe?', 'What does the Franco-German relationship mean for the European project?', 'How did Russia become the main challenge for European security after the Cold War?'] },
    { n: 10, title: 'The divisions in Africa and the Middle East', ch: [4, 12, 16, 17, 18], seminar: ['Why did Asia decolonize before Africa?', 'What are the obstacles to regional integration in Asia?', 'What is the role of India in the international balance of power?'] },
    { n: 11, title: 'Latin America in the international Arena', ch: [5, 15], seminar: ['To what extent have Israeli Arab conflicts been driven by outside forces?', 'What are the regional powers in Africa?', 'What have been the obstacles to the integration of African states into the international economic system?'] }
  ];

  function buildIR11() {
    var seen = {};
    var weeks = [{
      n: 0, title: 'Before the course — required readings',
      topics: ['Lectures obligatoires avant le début du cours (avancées via ta routine « Lecture du livre d’IR »)'],
      activities: [
        A('IR11-pre-allison', 'reading', 'Graham Allison — Destined for War. Can America and China escape Thucydides’s trap? (2017)', 0, { viaRoutine: 'ir-book', src: 'Syllabus : required before the beginning of the course' }),
        A('IR11-pre-ambrose', 'reading', 'Ambrose & Brinkley — Rise to globalism: US American Foreign Policy since 1938 (2012)', 0, { viaRoutine: 'ir-book', src: 'Syllabus : required before the beginning of the course' }),
        A('IR11-pre-toft', 'reading', "Monica Duffy Toft — 'The return of Spheres of Influence', Foreign Affairs (13 March 2025)", 30, { src: 'Syllabus : required before the beginning of the course' })
      ]
    }];
    IR11_WEEKS.forEach(function (w) {
      var p = wid('IR11', w.n), list = [], refs = [];
      list.push(A(p + '-video', 'video', 'Watch the pre-recorded lecture (~30 min)', 35, { src: 'Syllabus : lectures prerecorded — à voir avant le follow-up' }));
      var readIds = [];
      w.ch.forEach(function (c) {
        var id = 'IR11-best-ch' + pad(c);
        if (seen[id]) { refs.push({ id: id, week: seen[id] }); return; }
        seen[id] = w.n;
        list.push(A(id, 'reading', 'Best et al. (2024) — Chapter ' + c, 45, { group: 'Required reading' }));
        readIds.push(id);
      });
      list.push(A(p + '-notes', 'notes', 'Notes on the lecture & readings', 25, { prereq: [p + '-video'], src: 'Ta routine (préparation IR : lectures, vidéos, notes)' }));
      list.push(A(p + '-class', 'class', 'Follow-up session — attended', 60, { src: 'Syllabus : follow-up session' }));
      list.push(A(p + '-sem', 'prep', w.n === 1 ? 'Seminar: allocation of presentation topics' : 'Seminar preparation — think through the 3 presentation questions', w.n === 1 ? 10 : 30, { seminar: true, prereq: [p + '-video'], questions: w.n === 1 ? null : w.seminar, src: 'Syllabus : presentation topics in seminars' }));
      weeks.push({ n: w.n, title: w.title, topics: w.n === 1 ? w.seminar : w.seminar.map(function (q, i) { return 'Seminar Q' + (i + 1) + ' — ' + q; }), refs: refs, activities: list });
    });
    return weeks;
  }

  // ================================================================ MG11 — Business Organisations & Strategy
  var MG11_WEEKS = [
    { n: 1, lecture: 'Introduction to Business Models', seminar: 'From Your Team to ideas with a sustainable impact (UN 17 goals)', readings: [] },
    { n: 2, lecture: 'Entrepreneurship and start-ups', extra: 'Conference with the ESCP Blue Factory', seminar: 'Your resources and your environment', readings: [['bia-p2', 'Business in Action — Part 2', 90]] },
    { n: 3, lecture: 'Conducting an Industry Analysis: Structure, 5-forces, and Competitive environment', seminar: 'From ideas to project', readings: [['es-ch3', 'Exploring Strategy — Chapter 3', 50], ['es-ch4', 'Exploring Strategy — Chapter 4', 50]] },
    { n: 4, lecture: 'Resources and Capabilities, introduction to the Resource-based view of organisations', seminar: 'From Users to Value Proposition', readings: [['es-ch5', 'Exploring Strategy — Chapter 5', 50]] },
    { n: 5, lecture: 'Developing Competitive Advantages', seminar: 'From Value Proposition to testing your idea', readings: [['es-ch8', 'Exploring Strategy — Chapter 8, sections 8.1 and 8.2', 35], ['htts-4-7', 'How to Think Strategically — Chapters 4–7', 80]] },
    { n: 6, lecture: 'Developing a business through a successful product portfolio strategy (BCG, Ansoff and McKinsey Matrix)', seminar: 'Strategic Thinking: Building your Business Model with sustainability in mind', readings: [['es-ch9', 'Exploring Strategy — Chapter 9', 50]] },
    { n: 7, lecture: 'Market types, differentiations, and (re)positioning', seminar: 'Designing your Marketing Mix', readings: [['bia-ch12', 'Business in Action — Chapter 12', 45]] },
    { n: 8, lecture: 'Innovation in the organisation', seminar: 'Costs Estimation and Finance Sources', readings: [['es-ch11', 'Exploring Strategy — Chapter 11, sections 11.3 to 11.5', 40], ['bia-ch13', 'Business in Action — Chapter 13', 45]] },
    { n: 9, lecture: 'Organisational Design, structure, and dynamics; Leading the organisation through organisational change', seminar: 'Evaluate Revenue', readings: [['bia-ch7', 'Business in Action — Chapter 7', 45], ['bia-ch8', 'Business in Action — Chapter 8', 45]] },
    { n: 10, lecture: 'Managing the Human Capital within and outside of the organisation', seminar: 'Building your Strategy', readings: [['bia-ch10', 'Business in Action — Chapter 10', 45], ['bia-ch11', 'Business in Action — Chapter 11', 45]] },
    { n: 11, lecture: 'Global market expansion', seminar: 'Presentation of the business plan', readings: [['es-ch10', 'Exploring Strategy — Chapter 10', 50]] }
  ];

  function buildMG11() {
    return MG11_WEEKS.map(function (w) {
      var p = wid('MG11', w.n), list = [];
      list.push(A(p + '-video', 'video', 'Lecture: ' + w.lecture + ' (~30 min video)', 35, { src: 'Syllabus : lectures prerecorded' }));
      var readIds = [];
      w.readings.forEach(function (r) { var x = A(p + '-read-' + r[0], 'reading', r[1], r[2]); list.push(x); readIds.push(x.id); });
      list.push(A(p + '-notes', 'notes', 'Notes on the lecture & readings', 25, { prereq: [p + '-video'], src: 'Ta routine (préparation Business : lectures, supports de cours)' }));
      list.push(A(p + '-class', 'class', 'Follow-up session — attended' + (w.extra ? ' (+ ' + w.extra + ')' : ''), 60, { src: 'Syllabus : follow-up session' }));
      list.push(A(p + '-sem', 'exercise', 'Seminar: ' + w.seminar, 45, { seminar: true, prereq: [p + '-video'], src: 'Syllabus : seminar = étape du business plan de groupe' }));
      list.push(A(p + '-proj', 'project', w.n === 11 ? 'Business plan — final presentation ready' : 'Business plan — group follow-up after “' + w.seminar + '”', w.n === 11 ? 90 : 30, { src: 'Syllabus MG11 — group project (40 %)' }));
      return { n: w.n, title: 'Session ' + w.n + ' — ' + w.lecture, topics: ['Lecture | ' + w.lecture].concat(w.extra ? [w.extra] : []).concat(['Seminar | ' + w.seminar]), activities: list };
    });
  }

  // ================================================================ SK11 — Presentation, Discussion and Rhetoric Skills
  var SK11_SESSIONS = [
    { n: 1, title: 'Introduction to Rhetoric — The importance of focus', videos: ['1.1 Introduction to Module', '1.2 What is Rhetoric?', '1.3 The Communications Triangle', '1.4 Syllogisms and Enthymemes', '1.5 Deliberative Discourse', '1.6 Finding a Focus'] },
    { n: 2, title: 'Finding Arguments — The discovery of topics', videos: ['2.1 Rational, Emotional or Ethical', '2.2 Judicial Discourse', '2.3 Definition and Comparison', '2.4 Relationship', '2.5 Circumstance and Testimony'] },
    { n: 3, title: 'Facts vs Opinions — The need for rigour · The use of AI', videos: [], prep: 'Prepare the comparison of AI-generated and human-written arguments (limitations & biases)' },
    { n: 4, title: 'Setting the Order — Arranging the material', videos: ['4.1 Identifying the Elements', '4.2 The Arc of Storytelling', '4.3 Introduction and Description', '4.4 Argument and Conclusion', '4.5 Dealing with Opposition'], note: 'Team assignment set during this session' },
    { n: 5, title: 'Choosing a style — Delivering the right effect', videos: ['5.1 Choosing a Style', '5.2 Ceremonial Discourse', '5.3 Developing your own Style', '5.4 2,500 Years of Rhetoric', '5.5 Team Assignment'] },
    { n: 6, title: 'Presentation structure — Building your case', videos: ['6.1 What Makes a Meeting?', '6.2 Telling the Story', '6.3 Key Storylines', '6.4 Planning the Presentation', '6.5 The Pyramid Principle', '6.6 Successful Slides', '6.7 The Final Presentation'], note: 'Individual essay (closed-book exam) at the mid-term point — Sessions 1–6' },
    { n: 7, title: 'The Practice of Debate — Discussing ideas and choices', videos: ['7.1 The practice of Debate', '7.2 Making Arguments', '7.3 Quick Tips', '7.4 The Formal Debate', '7.5 The Structure', '7.6 Debating Tactics', '7.7 Negotiation Skills', '7.8 Dealing with Objections'] },
    { n: 8, title: 'Individual Speaking Skills — The Basics', videos: ['8.1 Public Speaking Basics', '8.2 The Keys to Confidence', '8.3 Mastering Body Language', '8.4 Creating Empathy'] },
    { n: 9, title: 'Team Speaking Skills — Working as a Group', videos: ['9.1 Working in Groups', '9.2 The Power of Teamwork', '9.3 Handling Questions', '9.4 Presenting from Charts'] },
    { n: 10, title: 'Dialogue at a Distance — The need to think and plan', videos: ['10.1 Distance Communications', '10.2 Choosing the Channel', '10.3 Telephone Tactics', '10.4 The Post-mortem', '10.5 Video Etiquette'] },
    { n: 11, title: 'Sessions 11 & 12 — Final team presentations', videos: [], prep: 'Team presentation prepared in advance of this session', project: true }
  ];

  function buildSK11() {
    return SK11_SESSIONS.map(function (s) {
      var p = wid('SK11', s.n), list = [], vids = [];
      s.videos.forEach(function (v, i) {
        var x = A(p + '-v' + (i + 1), 'video', 'Video ' + v, 9, { group: 'Videos to watch before class', src: 'Syllabus : vidéos de 5–10 min, ~1 h de préparation par atelier' });
        list.push(x); vids.push(x.id);
      });
      if (s.prep) list.push(A(p + '-prep', s.project ? 'project' : 'prep', s.prep, s.project ? 120 : 45, { src: 'Syllabus SK11' }));
      list.push(A(p + '-class', 'class', 'Classroom workshop — attended & participated', 90, { src: 'Syllabus : participation 20 %' }));
      return { n: s.n, title: 'Session ' + s.n + ' — ' + s.title, note: s.note, topics: s.videos.length ? s.videos : [s.prep], activities: list };
    });
  }

  // ================================================================ LE11 — Study Skills
  // Le syllabus ne donne pas de semaine pour chaque atelier : on suit l'ordre officiel
  // (séance d'intro, puis vidéo k + atelier k) et on le marque « semaine estimée ».
  var LE11_UNITS = [
    { n: 1, title: 'Introductory Session — Introduction to University Learning and Academic Expectations', readings: [['ch1', 'Cottrell (2019) The study skills handbook — chapter 1', 40]] },
    { n: 2, lecture: 'Lecture 1 (video): Gaining the Most from Your Studies', workshop: 'Workshop 1 — Self-Efficacy Skills: Study Organisation and Learning Strategies', readings: [['ch2', 'Cottrell — chapter 2', 35], ['ch6', 'Cottrell — chapter 6', 35]] },
    { n: 3, lecture: 'Lecture 2 (video): Managing Group Projects', workshop: 'Workshop 2 — People Skills: Communication and Feedback in Group Work', readings: [['ch8', 'Cottrell — chapter 8', 35], ['ch9', 'Cottrell — chapter 9', 35]], optional: 'Hartley et al. (2022) Success in groupwork' },
    { n: 4, lecture: 'Lecture 3 (video): Working with Others and Cultural Competence', workshop: 'Workshop 3 — People Skills: Teamwork, Negotiation, and Conflict Resolution', readings: [], refs: ['Cottrell ch. 8 & 9 (déjà en S3)'], optional: 'Hartley et al. (2022) Success in groupwork' },
    { n: 5, lecture: 'Lecture 4 (video): Searching and Managing Information for Study', workshop: 'Workshop 4 — Academic Skills: Searching for and Managing Academic Information', readings: [['ch10', 'Cottrell — chapter 10', 35], ['ch11', 'Cottrell — chapter 11', 35]] },
    { n: 6, lecture: 'Lecture 5 (video): Working with Academic Sources', workshop: 'Workshop 5 — Academic Skills: Working with Academic Sources', readings: [['ch13', 'Cottrell — chapter 13', 35]], optional: 'Greetham (2018) How to write better essays' },
    { n: 7, lecture: 'Lecture 6 (video): Developing Academic Writing and Critical Thinking', workshop: 'Workshop 6 — Academic Skills: Academic Writing and Critical Thinking', readings: [['ch14', 'Cottrell — chapter 14', 35], ['ch15', 'Cottrell — chapter 15', 35]], refs: ['Cottrell ch. 13 (déjà en S6)'], optional: 'Cottrell (2017) Critical thinking skills' }
  ];

  function buildLE11() {
    var weeks = LE11_UNITS.map(function (u) {
      var p = wid('LE11', u.n), list = [];
      if (u.lecture) list.push(A(p + '-video', 'video', u.lecture, 30, { releaseUnknown: true, src: 'Syllabus : vidéo à voir avant l’atelier — dès qu’elle est disponible' }));
      u.readings.forEach(function (r) { list.push(A(p + '-read-' + r[0], 'reading', r[1], r[2])); });
      if (u.optional) list.push(A(p + '-opt', 'reading', 'Optional: ' + u.optional, 30, { optional: true }));
      list.push(A(p + '-class', 'class', (u.workshop || 'Introductory session') + ' — attended', 90, { src: 'Syllabus : collaborative work 30 % (évaluée en atelier)' }));
      return { n: u.n, title: u.workshop || u.title, flags: ['Semaine estimée : le syllabus donne l’ordre des ateliers, pas leurs dates.'], refsText: u.refs, topics: [u.lecture, u.workshop].filter(Boolean), activities: list };
    });
    weeks.push({
      n: 12, title: 'Digital content — personalised independent study', flags: ['Contenu à ton rythme, selon ton Personal Skills Inventory : facultatif dans le planning.'],
      topics: ['Selon les priorités de ton Personal Skills Inventory'],
      activities: [
        A('LE11-dig-exams', 'video', 'Preparation for exams — strategies and ethics', 30, { optional: true }),
        A('LE11-dig-feedback', 'video', 'Feedback at university', 20, { optional: true }),
        A('LE11-dig-memory', 'video', 'Effective learning and memory', 30, { optional: true }),
        A('LE11-dig-reading', 'video', 'Effective reading, note-making and comprehension', 30, { optional: true }),
        A('LE11-dig-library', 'video', 'Using the school library and academic resources', 20, { optional: true }),
        A('LE11-dig-resilience', 'video', 'Resilience, growth mindset; motivation and managing academic challenges', 30, { optional: true }),
        A('LE11-dig-stress', 'video', 'Managing stress and well-being during studies and exams', 30, { optional: true }),
        A('LE11-test', 'quiz', 'Online test: Academic Integrity and Academic Misconduct (20 %)', 40, { src: 'Syllabus : test individuel en ligne — date non précisée', needsDate: true })
      ]
    });
    return weeks;
  }

  // ================================================================ Matières
  // Couleurs reprises de tes dossiers ESCP B1. `prepOffset` = jour (après le lundi de la semaine)
  // avant lequel la préparation de la semaine est visée — un objectif, jamais une deadline.
  var SUBJECTS = [
    { id: 'MA11', name: 'Fundamentals of Mathematics 1', short: 'Maths', emoji: '📐', color: '#E2577F', soft: '#FBE1E9', sequential: true, prepOffset: 6, prepDays: [4, 6, 0, 1, 2, 3, 5], ects: 6,
      prepNote: 'Objectif : semaine bouclée avant le MyLab du lundi suivant.', place: 'L’Observatoire' },
    { id: 'EC11', name: 'Microeconomics', short: 'Micro', emoji: '📈', color: '#9B7BC4', soft: '#EEE6F7', sequential: true, prepOffset: 5, prepDays: [5, 1, 3, 6], ects: 6,
      prepNote: 'Objectif : vidéo + lecture avant le test en ligne du samedi.', place: 'Le Marché' },
    { id: 'IR11', name: 'International Relations & European/World History', short: 'IR', emoji: '🌍', color: '#F28C28', soft: '#FDEBD8', prepOffset: 0, prepDays: [4, 0], ects: 6,
      prepNote: 'Objectif : préparation finie avant le cours du lundi.', place: 'L’Ambassade' },
    { id: 'MG11', name: 'Introduction to Business Organisations & Strategy', short: 'Business', emoji: '💼', color: '#E888AC', soft: '#FCE7EF', prepOffset: 0, prepDays: [5, 4, 0], ects: 6,
      prepNote: 'Objectif : préparation finie avant le cours du lundi.', place: 'La Tour Business' },
    { id: 'SK11', name: 'Presentation, Discussion and Rhetoric Skills', short: 'Rhétorique', emoji: '🎤', color: '#E3A92B', soft: '#FBF0D6', prepOffset: 2, prepDays: [2, 1, 0], ects: 3,
      prepNote: 'Objectif : vidéos vues avant l’atelier (jour à confirmer dans Réglages).', place: 'Le Théâtre' },
    { id: 'LE11', name: 'Study Skills', short: 'Study Skills', emoji: '📚', color: '#7FA84A', soft: '#E9F2DC', prepOffset: 5, prepDays: [6, 0], ects: 3, weeksEstimated: true,
      prepNote: 'Vidéos à faire le samedi, dès qu’elles sont disponibles.', place: 'La Bibliothèque' },
    { id: 'ZH', name: 'Mandarin Chinese', short: 'Chinois', emoji: '🀄', color: '#EF7A63', soft: '#FDE5DF', noSyllabus: true, place: 'Le Salon de thé',
      prepNote: 'Pas de syllabus fourni : suivi par tes routines (cours du mardi, pratique et vocabulaire quotidiens).' },
    { id: 'IT', name: 'Italiano', short: 'Italien', emoji: '🍋', color: '#5FA3D9', soft: '#E1EFFA', noSyllabus: true, place: 'La Piazza',
      prepNote: 'Pas de syllabus fourni : suivi par tes routines (fiche du lundi, révision du dimanche).' }
  ];

  var BUILDERS = { EC11: buildEC11, MA11: buildMA11, IR11: buildIR11, MG11: buildMG11, SK11: buildSK11, LE11: buildLE11 };
  SUBJECTS.forEach(function (s) { s.weeks = BUILDERS[s.id] ? BUILDERS[s.id]() : []; });

  // ================================================================ Évaluations (dates à saisir)
  var ASSESSMENTS = [
    { id: 'EC11-mid', subject: 'EC11', title: 'Midterm test (MCQ, 45 min) — weeks 1–6', weight: 15, when: 'After week 6', date: null },
    { id: 'EC11-proj', subject: 'EC11', title: 'Group project presentation', weight: 20, when: 'Weeks 8–9 (groups 1–3 / 4–6)', date: null },
    { id: 'EC11-final', subject: 'EC11', title: 'Final exam (weeks 1–11)', weight: 50, when: 'End of semester', date: null },
    { id: 'MA11-mid', subject: 'MA11', title: 'Mid-term exam (1.5 h, MCQ)', weight: 30, when: 'Around week 6 or 7', date: null },
    { id: 'MA11-final', subject: 'MA11', title: 'Final exam (2 h, MCQ, all sessions)', weight: 60, when: 'End of semester', date: null },
    { id: 'IR11-pres', subject: 'IR11', title: 'Group presentation (15 min)', weight: 20, when: 'Topic allocated in week 1', date: null },
    { id: 'IR11-mid', subject: 'IR11', title: 'Mid-term exam (2 h, 2 essays out of 3)', weight: 20, when: 'Mid-semester', date: null },
    { id: 'IR11-final', subject: 'IR11', title: 'Final exam (2 h, 2 essays out of 3)', weight: 50, when: 'End of semester', date: null },
    { id: 'MG11-proj', subject: 'MG11', title: 'Business plan presentation (group project)', weight: 40, when: 'Session 11', date: null },
    { id: 'MG11-final', subject: 'MG11', title: 'Final exam (closed book)', weight: 50, when: 'End of semester', date: null },
    { id: 'SK11-essay', subject: 'SK11', title: 'Individual essay (closed-book, sessions 1–6)', weight: 40, when: 'Mid-term point', date: null },
    { id: 'SK11-team', subject: 'SK11', title: 'Final team presentation', weight: 40, when: 'Sessions 11 & 12', date: null },
    { id: 'LE11-final', subject: 'LE11', title: 'Final exam — individual academic essay', weight: 50, when: 'End of term', date: null }
  ];

  // ================================================================ Routines (ta structure hebdo)
  // days : 0 = dimanche … 6 = samedi. `mins` compte dans ta charge du jour. `kind: 'class'` = cours,
  // affiché mais sans temps d'étude. Les blocs « principaux » (IR jeudi, Micro vendredi…) ne sont
  // pas des routines : ce sont des préférences de jour par matière (`prepDays`) utilisées par le moteur.
  var ROUTINES = [
    { id: 'math-practice', title: 'Pratique de maths du jour', subject: 'MA11', mins: 30, days: [0, 1, 2, 3, 5, 6], daily: true, adaptive: 'MA11' },
    { id: 'math-practice-thu', title: 'Grosse séance de maths', subject: 'MA11', mins: 60, days: [4], daily: true, adaptive: 'MA11' },
    { id: 'zh-practice', title: 'Pratique du mandarin', subject: 'ZH', mins: 20, days: [0, 1, 2, 3, 4, 5, 6], daily: true },
    { id: 'zh-vocab', title: 'Vocabulaire chinois', subject: 'ZH', mins: 15, days: [0, 1, 2, 3, 4, 5, 6], daily: true },
    { id: 'ir-book', title: 'Lecture du livre d’IR', subject: 'IR11', mins: 20, days: [0, 1, 2, 3, 4, 5, 6], daily: true },
    { id: 'it-class', title: 'Cours d’italien', subject: 'IT', kind: 'class', mins: 0, days: [1] },
    { id: 'it-sheet', title: 'Fiche de leçon d’italien (après le cours)', subject: 'IT', mins: 30, days: [1] },
    { id: 'class-flash', title: 'Pendant les cours d’IR et de Business : flashcards ou exercices si un moment s’y prête', subject: 'IR11', kind: 'class', mins: 0, days: [1] },
    { id: 'zh-homework', title: 'Devoirs de mandarin', subject: 'ZH', mins: 30, days: [1] },
    { id: 'micro-review', title: 'Révision micro : flashcards, notes ou un petit exercice', subject: 'EC11', mins: 20, days: [1] },
    { id: 'zh-prep-tue', title: 'Préparer le mandarin pour mardi (si besoin)', subject: 'ZH', mins: 15, days: [1], optional: true },
    { id: 'zh-class', title: 'Cours de mandarin', subject: 'ZH', kind: 'class', mins: 0, days: [2] },
    { id: 'zh-notes', title: 'Mettre au propre les notes de mandarin', subject: 'ZH', mins: 20, days: [2] },
    { id: 'sem-consolidate', title: 'Consolider les notions difficiles vues en séminaire', mins: 20, days: [3] },
    { id: 'group-update', title: 'Projets de groupe : où on en est + prochaine action', mins: 15, days: [3] },
    { id: 'check-new', title: 'Vérifier Blackboard / MyLab : nouveaux contenus et échéances', mins: 10, days: [3] },
    { id: 'mylab-check', title: 'Vérifier les devoirs MyLab de la semaine', subject: 'MA11', mins: 10, days: [6] },
    { id: 'biz-monday', title: 'Vérifier les devoirs Business dus lundi matin', subject: 'MG11', mins: 15, days: [0] },
    { id: 'it-review', title: 'Réviser l’italien + exercices pour lundi', subject: 'IT', mins: 30, days: [0] },
    { id: 'zh-prep-sun', title: 'Préparer le mandarin (si besoin)', subject: 'ZH', mins: 15, days: [0], optional: true },
    { id: 'week-review', title: 'Revue de la semaine qui arrive : charge et priorités', mins: 15, days: [0] }
  ];

  // Emploi du temps de départ : uniquement ce que tu as donné (jours), sans horaires inventés.
  var TIMETABLE = [
    { id: 'tt-it', subject: 'IT', kind: 'language', day: 1, start: '', end: '' },
    { id: 'tt-ir', subject: 'IR11', kind: 'followup', day: 1, start: '', end: '' },
    { id: 'tt-mg', subject: 'MG11', kind: 'followup', day: 1, start: '', end: '' },
    { id: 'tt-zh', subject: 'ZH', kind: 'language', day: 2, start: '', end: '' }
  ];

  root.SCHOOL_CURRICULUM = {
    version: 1,
    calendar: CALENDAR,
    subjects: SUBJECTS,
    assessments: ASSESSMENTS,
    routines: ROUTINES,
    timetable: TIMETABLE
  };
})(typeof window !== 'undefined' ? window : globalThis);
