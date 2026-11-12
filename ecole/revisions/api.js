// Révisions à deux — accès aux tables partagées Supabase (rev_plans, rev_members, rev_progress).
// Le client vient de ../../sync.js (même connexion que Plan My Life). Avec ?demo=1, tout reste
// en mémoire sur cet appareil (pour essayer l'interface sans compte).
(function (root) {
  'use strict';
  var P = root.RevPlan;
  var DEMO = /[?&]demo=1/.test(location.search);

  function ready() {
    if (DEMO) return Promise.resolve({ user: { id: 'me', email: 'demo' } });
    return new Promise(function (resolve) {
      function go() { resolve({ user: root.__coUser }); }
      if (root.__coUser && root.__coClient) go();
      else document.addEventListener('co-ready', function () { setTimeout(go, 0); }, { once: true });
    });
  }
  function db() { return root.__coClient; }
  function unwrap(res) { if (res.error) throw res.error; return res.data; }

  // ------------------------------------------------------------ vrai backend
  var real = {
    myPlans: function (uid) {
      return db().from('rev_members').select('plan_id,name').eq('user_id', uid).then(unwrap);
    },
    load: function (planId) {
      return Promise.all([
        db().from('rev_plans').select('id,owner,invite_code,data,updated_at').eq('id', planId).single().then(unwrap),
        db().from('rev_members').select('user_id,name,joined_at').eq('plan_id', planId).order('joined_at').then(unwrap),
        db().from('rev_progress').select('user_id,data,updated_at').eq('plan_id', planId).then(unwrap)
      ]).then(function (r) {
        var prog = {};
        r[2].forEach(function (row) { prog[row.user_id] = row.data; });
        return { plan: r[0], members: r[1], progress: prog };
      });
    },
    create: function (data, name) {
      return db().rpc('create_rev_plan', { plan_data: data, display_name: name }).then(unwrap).then(function (rows) { return rows[0]; });
    },
    join: function (code, name) { return db().rpc('join_rev_plan', { code: code, display_name: name }).then(unwrap); },
    // Relit la version la plus récente avant de modifier, pour ne pas écraser ce que l'autre vient d'ajouter.
    applyOp: function (planId, op, uid) {
      return db().from('rev_plans').select('data').eq('id', planId).single().then(unwrap).then(function (row) {
        var next = P.apply(row.data, op);
        return db().from('rev_plans').update({ data: next, updated_at: new Date().toISOString(), updated_by: uid }).eq('id', planId).then(unwrap).then(function () { return next; });
      });
    },
    saveProgress: function (planId, uid, data) {
      return db().from('rev_progress').upsert({ plan_id: planId, user_id: uid, data: data, updated_at: new Date().toISOString() }).then(unwrap);
    },
    rename: function (planId, uid, name) {
      return db().from('rev_members').update({ name: name }).eq('plan_id', planId).eq('user_id', uid).then(unwrap);
    },
    leave: function (planId, uid) {
      return db().from('rev_members').delete().eq('plan_id', planId).eq('user_id', uid).then(unwrap);
    }
  };

  // ------------------------------------------------------------ démo en mémoire
  var mem = { plan: null, members: [], progress: {} };
  var demo = {
    myPlans: function () { return Promise.resolve(mem.plan ? [{ plan_id: 'demo', name: 'Moi' }] : []); },
    load: function () { return Promise.resolve(JSON.parse(JSON.stringify(mem))); },
    create: function (data, name) {
      mem.plan = { id: 'demo', owner: /[?&]guest=1/.test(location.search) ? 'friend' : 'me', invite_code: 'DEMO42', data: data };
      mem.members = [{ user_id: 'me', name: name }, { user_id: 'friend', name: 'Ta copine' }];
      var fp = P.emptyProgress();
      data.tasks.slice(0, 3).forEach(function (t) { fp.done[t.id] = 1; });
      var td = (/[?&]today=(\d{4}-\d{2}-\d{2})/.exec(location.search) || [0, P.dayStr(new Date())])[1];
      fp.routines[td] = { maths20: 1 };
      fp.notes[td] = { text: 'Maths faites pour moi, à toi !', at: new Date().toISOString() };
      mem.progress = { friend: fp };
      return Promise.resolve({ id: 'demo', invite_code: 'DEMO42' });
    },
    join: function () { return Promise.reject(new Error('pas en démo')); },
    applyOp: function (id, op) { mem.plan.data = P.apply(mem.plan.data, op); return Promise.resolve(mem.plan.data); },
    saveProgress: function (id, uid, data) { mem.progress[uid] = JSON.parse(JSON.stringify(data)); return Promise.resolve(); },
    rename: function (id, uid, name) { mem.members.forEach(function (m) { if (m.user_id === uid) m.name = name; }); return Promise.resolve(); },
    leave: function () { mem = { plan: null, members: [], progress: {} }; return Promise.resolve(); }
  };

  var api = DEMO ? demo : real;
  api.ready = ready;
  api.DEMO = DEMO;
  root.RevApi = api;
})(window);
