// Cloud sync for Plan the Day + Content OS — transparent Supabase-backed mirror of localStorage.
// Loaded before any app code. Blocks behind #sync-gate (already in the HTML, no flash) until
// the user is authenticated and their data has been hydrated into localStorage, then reveals the app.
(function () {
  var SUPABASE_URL = 'https://zvffibgkikllmkpfarh.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2ZmZpYmdraWtrbGxta3BmYXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMDc4NjcsImV4cCI6MjEwMDU4Mzg2N30.Uyr9CQT3FBUwFTwh5DfzQLGjg_Pwl4zlCMUwMTFfBUc';
  var HYDRATED_FLAG = '__co_sync_hydrated__';

  function gate() { return document.getElementById('sync-gate'); }
  function setGateHtml(html) { var g = gate(); if (g) g.innerHTML = html; }
  function hideGate() { var g = gate(); if (g) g.remove(); }
  function skipKey(key) { return key.indexOf('sb-') === 0 || key === HYDRATED_FLAG; }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function loadingHtml(msg) {
    return '<div style="text-align:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">' +
      '<div style="width:28px;height:28px;border:3px solid #EAEAEA;border-top-color:#E37DA6;border-radius:50%;margin:0 auto 16px;animation:co-spin 0.8s linear infinite;"></div>' +
      '<div style="font-size:13px;color:#666;">' + (msg || 'Chargement…') + '</div>' +
      '</div><style>@keyframes co-spin{to{transform:rotate(360deg)}}</style>';
  }

  function errorHtml(msg) {
    return '<div style="max-width:340px;text-align:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">' +
      '<div style="font-size:14px;font-weight:700;color:#111;margin-bottom:8px;">Connexion impossible</div>' +
      '<div style="font-size:12.5px;color:#666;line-height:1.6;margin-bottom:16px;">' + msg + '</div>' +
      '<button onclick="location.reload()" style="background:#111;color:#fff;border:none;border-radius:10px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer;">Réessayer</button>' +
      '</div>';
  }

  function loginHtml(mode, errorMsg, notice) {
    var isSignup = mode === 'signup';
    return '<div style="width:320px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">' +
      '<div style="font-size:17px;font-weight:800;color:#111;margin-bottom:4px;">' + (isSignup ? 'Créer un compte' : 'Connexion') + '</div>' +
      '<div style="font-size:12.5px;color:#666;margin-bottom:20px;">Tes données te suivent sur tous tes appareils.</div>' +
      (errorMsg ? '<div style="background:#FCEBEB;color:#B33;font-size:12px;padding:9px 12px;border-radius:8px;margin-bottom:14px;">' + errorMsg + '</div>' : '') +
      (notice ? '<div style="background:#EEF4FC;color:#2F5FA0;font-size:12px;padding:9px 12px;border-radius:8px;margin-bottom:14px;">' + notice + '</div>' : '') +
      '<input id="sync-email" type="email" placeholder="Email" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #DEDEDE;border-radius:9px;font-size:13.5px;margin-bottom:10px;outline:none;">' +
      '<input id="sync-password" type="password" placeholder="Mot de passe" style="width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #DEDEDE;border-radius:9px;font-size:13.5px;margin-bottom:16px;outline:none;">' +
      '<button id="sync-submit" style="width:100%;background:#E37DA6;color:#fff;border:none;border-radius:9px;padding:11px;font-size:13.5px;font-weight:700;cursor:pointer;margin-bottom:12px;">' + (isSignup ? 'Créer mon compte' : 'Se connecter') + '</button>' +
      '<div style="text-align:center;font-size:12.5px;color:#666;">' +
      (isSignup ? 'Déjà un compte ? ' : "Pas encore de compte ? ") +
      '<a id="sync-toggle" href="#" style="color:#E37DA6;font-weight:600;text-decoration:none;">' + (isSignup ? 'Se connecter' : 'Créer un compte') + '</a>' +
      '</div></div>';
  }

  function wireLoginForm(client, mode) {
    setGateHtml(loginHtml(mode));
    document.getElementById('sync-toggle').onclick = function (e) {
      e.preventDefault();
      wireLoginForm(client, mode === 'signup' ? 'signin' : 'signup');
    };
    document.getElementById('sync-submit').onclick = function () { submit(client, mode); };
    document.getElementById('sync-password').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submit(client, mode);
    });
  }

  function submit(client, mode) {
    var email = document.getElementById('sync-email').value.trim();
    var password = document.getElementById('sync-password').value;
    if (!email || !password) { setGateHtml(loginHtml(mode, 'Email et mot de passe obligatoires.')); wireLoginForm(client, mode); return; }
    setGateHtml(loadingHtml('Un instant…'));

    var action = mode === 'signup'
      ? client.auth.signUp({ email: email, password: password })
      : client.auth.signInWithPassword({ email: email, password: password });

    action.then(function (res) {
      if (res.error) { setGateHtml(loginHtml(mode, res.error.message)); wireLoginForm(client, mode); return; }
      if (mode === 'signup' && !res.data.session) {
        // Email confirmation is required on the Supabase project — no session yet.
        setGateHtml(loginHtml('signin', null, 'Compte créé ! Vérifie ta boîte mail pour confirmer, puis connecte-toi.'));
        wireLoginForm(client, 'signin');
        return;
      }
      afterAuth(client, res.data.session);
    });
  }

  function pullAll(client, userId) {
    return client.from('kv_store').select('key,value').eq('user_id', userId).then(function (res) {
      if (res.error) throw res.error;
      (res.data || []).forEach(function (row) {
        try { localStorage.setItem(row.key, JSON.stringify(row.value)); } catch (e) {}
      });
    });
  }

  function pushAllLocal(client, userId) {
    var rows = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (skipKey(key)) continue;
      var raw = localStorage.getItem(key), value;
      try { value = JSON.parse(raw); } catch (e) { value = raw; }
      rows.push({ user_id: userId, key: key, value: value, updated_at: new Date().toISOString() });
    }
    if (!rows.length) return Promise.resolve();
    return client.from('kv_store').upsert(rows).then(function (res) { if (res.error) throw res.error; });
  }

  function afterAuth(client, session) {
    var hydrated = sessionStorage.getItem(HYDRATED_FLAG) === '1';
    if (!hydrated) {
      setGateHtml(loadingHtml('Synchronisation de tes données…'));
      client.from('kv_store').select('key', { count: 'exact', head: true }).eq('user_id', session.user.id)
        .then(function (res) {
          if (res.error) throw res.error;
          var hasCloudData = (res.count || 0) > 0;
          return hasCloudData ? pullAll(client, session.user.id) : pushAllLocal(client, session.user.id);
        })
        .then(function () {
          sessionStorage.setItem(HYDRATED_FLAG, '1');
          location.reload();
        })
        .catch(function (err) {
          setGateHtml(errorHtml('Impossible de joindre la base de données. Vérifie que la table "kv_store" existe bien dans ton projet Supabase (voir supabase-setup.sql).<br><br><span style="color:#999;">' + (err && err.message ? err.message : '') + '</span>'));
        });
      return;
    }
    hideGate();
    enableWritePatch(client, session.user.id);
    addAccountBadge(client, session.user.email);
  }

  function enableWritePatch(client, userId) {
    var origSet = localStorage.setItem.bind(localStorage);
    var origRemove = localStorage.removeItem.bind(localStorage);
    var pending = {};
    var timer = null;

    function flush() {
      var keys = Object.keys(pending);
      if (!keys.length) return;
      var toUpsert = [], toDelete = [];
      keys.forEach(function (key) {
        var action = pending[key];
        if (action.type === 'remove') toDelete.push(key);
        else {
          var value; try { value = JSON.parse(action.raw); } catch (e) { value = action.raw; }
          toUpsert.push({ user_id: userId, key: key, value: value, updated_at: new Date().toISOString() });
        }
      });
      pending = {};
      if (toUpsert.length) client.from('kv_store').upsert(toUpsert).then(function (res) { if (res.error) console.error('sync push failed', res.error); });
      toDelete.forEach(function (key) {
        client.from('kv_store').delete().eq('user_id', userId).eq('key', key).then(function (res) { if (res.error) console.error('sync delete failed', res.error); });
      });
    }
    function scheduleFlush() { clearTimeout(timer); timer = setTimeout(flush, 1200); }

    localStorage.setItem = function (key, val) {
      origSet(key, val);
      if (skipKey(key)) return;
      pending[key] = { type: 'set', raw: val };
      scheduleFlush();
    };
    localStorage.removeItem = function (key) {
      origRemove(key);
      if (skipKey(key)) return;
      pending[key] = { type: 'remove' };
      scheduleFlush();
    };
    window.addEventListener('beforeunload', flush);

    window.__coSignOut = function () {
      flush();
      client.auth.signOut().then(function () {
        sessionStorage.removeItem(HYDRATED_FLAG);
        location.reload();
      });
    };
  }

  function addAccountBadge(client, email) {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:14px;right:14px;z-index:99998;background:rgba(17,17,17,0.85);color:#fff;font-family:-apple-system,sans-serif;font-size:11px;padding:7px 12px;border-radius:999px;display:flex;align-items:center;gap:8px;backdrop-filter:blur(4px);';
    el.innerHTML = '<span style="opacity:0.85;">' + email + '</span><a href="#" id="co-signout-link" style="color:#F0A9C6;text-decoration:none;font-weight:600;">Déconnexion</a>';
    document.body.appendChild(el);
    document.getElementById('co-signout-link').onclick = function (e) { e.preventDefault(); window.__coSignOut(); };
  }

  function main() {
    if (!gate()) return; // safety: no-op if the host page forgot the gate div
    setGateHtml(loadingHtml());
    loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2')
      .then(function () {
        var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return client.auth.getSession().then(function (res) {
          if (res.error) throw res.error;
          if (!res.data.session) { wireLoginForm(client, 'signin'); return; }
          afterAuth(client, res.data.session);
        });
      })
      .catch(function (err) {
        setGateHtml(errorHtml('La connexion au service a échoué.<br><br><span style="color:#999;">' + (err && err.message ? err.message : '') + '</span>'));
      });
  }

  main();
})();
