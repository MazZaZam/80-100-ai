/* eightyhundred.ai - app.js (no inline scripts; CSP script-src 'self') */
(function () {
  'use strict';

  var CFG = window.EH_CONFIG || {};
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'dataset') Object.keys(attrs[k]).forEach(function (d) { e.dataset[d] = attrs[k][d]; });
      else e.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c == null) return; e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function toast(text, ms) {
    var t = el('div', { class: 'toast', role: 'status', text: text });
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, ms || 2800);
  }
  function fmtInt(n) { return Number(n || 0).toLocaleString('en-IE'); }
  function isoDay(d) { return new Date(d).toISOString().slice(0, 10); }
  function daysBetween(a, b) { return Math.max(0, Math.floor((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 86400000)); }
  function daysSince(d) { return daysBetween(d, isoDay(Date.now())); }
  function daysLabel(n) { if (n < 1) return 'today'; if (n === 1) return '1 day'; if (n < 60) return n + ' days'; var m = Math.round(n / 30); if (m < 24) return m + (m === 1 ? ' month' : ' months'); var y = Math.round(m / 12); return y + (y === 1 ? ' year' : ' years'); }
  function setText(sel, v) { var n = $(sel); if (n) n.textContent = v; }
  function empty(node, text) { if (!node) return; node.textContent = ''; if (text) node.appendChild(el('p', { class: 'empty', text: text })); }

  var TYPES = {
    app: 'App', saas: 'SaaS (has a landing page)', novel: 'Novel', podcast: 'Podcast', shed: 'Shed',
    board_game: 'Board game', napkin: 'Business idea (napkin)', home_gym: 'Home gym', second_brain: 'Second brain', other: 'Other, it’s hard to explain'
  };
  var SINCE = { weeks: 21, months: 120, lastyear: 365, y2019: null, anniversary: 1000 };
  function sinceDate(key) {
    if (key === 'y2019') return '2019-06-01';
    return isoDay(Date.now() - (SINCE[key] || 120) * 86400000);
  }
  function errText(e) { return (e && (e.message || e.error_description || e.msg)) || 'Something went wrong. Not your fault. Probably.'; }

  /* ================= landing interactions ================= */
  (function landing() {
    var tape = $('#tape');
    if (tape) {
      var line = '';
      for (var i = 0; i < 10; i++) line += '<span>Finish a project you ADHD bastard <span>·</span></span>';
      tape.innerHTML = line + line; /* static string, no user content */
    }
    var range = $('#howFar'), out = $('#howFarOut'), fill = $('#wallFill'), lads = $('#wallLads'),
        you = $('#wallYou'), pct = $('#wallPct'), msg = $('#wallMsg'), hand = $('#handover');
    if (range) {
      var tries = 0;
      var nopes = ['Nope. That’s as far as you go.', 'Still no. Interesting how it stops there, isn’t it.', 'Third time. The bar isn’t the problem.',
        'You could have finished something in the time you’ve spent on this slider.', 'Right. Hand it to the lads.'];
      var lows = ['That’s not a project, that’s a domain purchase.', 'Come back at 80. We have a ruler.', 'Promising. Keep going. Actually keep going this time.', 'Nearly. One more evening. Not a new project, the same one.'];
      function paint(v) { fill.style.width = v + '%'; pct.textContent = v + '%'; out.value = v + '%'; }
      range.addEventListener('input', function () {
        var v = parseInt(range.value, 10);
        if (v > 80) { range.value = 80; v = 80; msg.textContent = nopes[Math.min(tries, nopes.length - 1)]; msg.classList.add('warn'); tries++; }
        else if (v < 80) { msg.textContent = lows[Math.min(Math.floor((80 - v) / 20), lows.length - 1)]; msg.classList.remove('warn'); }
        else { msg.textContent = 'Drag it past 80. Go on. We’ll wait.'; msg.classList.remove('warn'); }
        paint(v);
      });
      hand.addEventListener('click', function () {
        var v = parseInt(range.value, 10);
        if (v < 80) { msg.textContent = 'It’s at ' + v + '%. Bring it back at 80. That’s the deal.'; msg.classList.add('warn'); return; }
        range.disabled = true; hand.disabled = true; lads.classList.add('gone'); you.hidden = true; fill.classList.add('done'); paint(100);
        msg.textContent = 'Shipped. Invoice sent. Go and start something else, we’ll see you in fourteen months.'; msg.classList.add('warn');
        hand.textContent = 'Done. Not your problem.';
        setTimeout(function () {
          var r = el('button', { type: 'button', class: 'btn ghost', text: 'Start another one', style: 'margin-left:.6rem' });
          r.addEventListener('click', function () {
            range.disabled = false; hand.disabled = false; tries = 0; lads.classList.remove('gone'); you.hidden = false; fill.classList.remove('done');
            range.value = 80; paint(80); hand.textContent = 'Hand it to the lads'; msg.textContent = 'Back at 80. Naturally.'; msg.classList.remove('warn'); r.remove();
          });
          hand.parentNode.appendChild(r);
        }, 900);
      });
    }
    var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var root = document.documentElement.getAttribute('data-theme');
    if (root === 'dark') dark = true; if (root === 'light') dark = false;
    $$('.lad canvas').forEach(function (c) {
      var seed = parseInt(c.getAttribute('data-seed'), 10) || 1, size = 24; c.width = size; c.height = size;
      var ctx = c.getContext('2d'), s = seed * 9301 + 49297;
      function rnd() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
      ctx.fillStyle = dark ? '#1E1D17' : '#F1EFE6'; ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = dark ? '#F1EFE6' : '#15140F';
      for (var y = 0; y < size; y++) for (var x = 0; x < size / 2; x++) {
        var dx = x - size / 2, dy = y - size / 2, d = Math.sqrt(dx * dx + dy * dy) / (size / 2);
        if (0.72 - d * 0.9 + (rnd() - 0.5) * 0.35 > 0.5) { ctx.fillRect(x, y, 1, 1); ctx.fillRect(size - 1 - x, y, 1, 1); }
      }
      c.style.imageRendering = 'pixelated'; c.style.opacity = '.18';
    });
    var dlg = $('#waiver');
    $$('[data-open-waiver]').forEach(function (b) { b.addEventListener('click', function () { dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', ''); }); });
    $$('[data-close-waiver]').forEach(function (b) { b.addEventListener('click', function () { dlg.close ? dlg.close() : dlg.removeAttribute('open'); }); });
  })();

  /* ================= data layer: Supabase or demo ================= */
  var SELECT = '*, owner:profiles!projects_owner_id_fkey(id,handle,display_name,avatar_url), lad:profiles!projects_lad_id_fkey(id,handle,display_name,avatar_url), nopes(count)';
  var LIVE = !!(CFG.url && CFG.key && window.supabase && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(CFG.url));
  var api;

  function supabaseApi() {
    var sb = window.supabase.createClient(CFG.url, CFG.key, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    function redirectTarget() { return location.origin + location.pathname; }
    function fail(r) { if (r.error) throw r.error; return r.data; }
    return {
      live: true,
      onAuth: function (cb) { sb.auth.onAuthStateChange(function (event, s) { cb(event, s ? s.user.id : null); }); },
      session: function () { return sb.auth.getSession().then(function (r) { return r.data && r.data.session ? r.data.session.user.id : null; }); },
      signIn: function (provider) {
        if (provider === 'apple') return Promise.reject({ message: 'Apple sign-in is coming. It needs a developer account and the lads are deciding if you’re worth 99 dollars.' });
        return sb.auth.signInWithOAuth({ provider: provider, options: { redirectTo: redirectTarget() } }).then(fail);
      },
      magic: function (email) { return sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: redirectTarget() } }).then(fail); },
      signOut: function () { return sb.auth.signOut(); },
      me: function (uid) {
        return Promise.all([
          sb.from('profiles').select('id,handle,display_name,avatar_url').eq('id', uid).maybeSingle(),
          sb.from('nopes').select('project_id').eq('voter_id', uid)
        ]).then(function (rs) { return { profile: rs[0].data || null, nopes: (rs[1].data || []).map(function (n) { return n.project_id; }) }; });
      },
      stats: function () { return sb.from('stats').select('*').maybeSingle().then(fail); },
      daycare: function () {
        return Promise.all([
          sb.from('projects').select(SELECT).in('status', ['daycare', 'claimed']).order('created_at', { ascending: false }).limit(100),
          sb.from('projects').select(SELECT).eq('status', 'finished').order('finished_at', { ascending: false }).limit(12)
        ]).then(function (rs) { return { active: fail(rs[0]), finished: fail(rs[1]) }; });
      },
      boards: function () {
        return Promise.all([sb.from('leaderboard_bastards').select('*').limit(50), sb.from('leaderboard_lads').select('*').limit(50)])
          .then(function (rs) { return { bastards: fail(rs[0]), lads: fail(rs[1]) }; });
      },
      mine: function (uid) {
        return Promise.all([
          sb.from('projects').select(SELECT).eq('owner_id', uid).order('created_at', { ascending: false }),
          sb.from('projects').select(SELECT).eq('lad_id', uid).order('claimed_at', { ascending: false })
        ]).then(function (rs) { return { mine: fail(rs[0]), claims: fail(rs[1]) }; });
      },
      updateProfile: function (uid, handle, name) { return sb.from('profiles').update({ handle: handle, display_name: name }).eq('id', uid).select().maybeSingle().then(fail); },
      insert: function (uid, f) { return sb.from('projects').insert({ owner_id: uid, name: f.name, type: f.type, pct: f.pct, distraction: f.distraction, since_date: f.since_date }).select(SELECT).single().then(fail); },
      remove: function (id) { return sb.from('projects').delete().eq('id', id).then(fail); },
      rpc: function (name, args) { return sb.rpc(name, args).then(fail); },
      nope: function (uid, id, on) {
        return (on ? sb.from('nopes').insert({ project_id: id, voter_id: uid }) : sb.from('nopes').delete().eq('project_id', id).eq('voter_id', uid)).then(fail);
      },
      dropCount: function (uid) { return sb.from('leaderboard_bastards').select('dropped_off').eq('profile_id', uid).maybeSingle().then(function (r) { return (r.data && r.data.dropped_off) || 1; }); }
    };
  }

  /* Demo store: same shapes, same rules, lives in this browser until the backend is live. */
  function demoApi() {
    var KEY = 'eh_demo_v2';
    var D;
    function seed() {
      var P = {};
      [['ciaran', 'Ciarán', 'Founder'], ['aoife', 'Aoife'], ['gerry', 'Gerry'], ['dave_m', 'Dave'], ['niamh', 'Niamh'], ['scarf', 'Scarf'],
       ['paudie', 'Paudie'], ['roisin', 'Róisín'], ['deco', 'Deco'], ['bigtony', 'Big Tony'], ['marek', 'Marek'], ['sharon', 'Sharon']]
        .forEach(function (r) { P[r[0]] = { id: 'u_' + r[0], handle: r[0], display_name: r[1], avatar_url: null }; });
      function d(n) { return isoDay(Date.now() - n * 86400000); }
      function ts(n, h) { return new Date(Date.now() - n * 86400000 - (h || 0) * 3600000).toISOString(); }
      var projects = [
        { id: 'p1', owner: 'ciaran', name: 'Kombucha SaaS', type: 'saas', pct: 80, distraction: 'Bought a domain for a new idea', since_date: '2019-06-01', status: 'daycare', created_at: ts(40) },
        { id: 'p2', owner: 'aoife', name: 'The Novel (working title: The Novel)', type: 'novel', pct: 80, distraction: 'A better version of this project', since_date: '2024-01-10', status: 'finished', lad: 'marek', claimed_at: ts(15), finished_at: ts(6), proof_url: 'https://example.com/the-novel', note: 'Chapter 12 was one word. It is now a chapter.', created_at: ts(38) },
        { id: 'p3', owner: 'gerry', name: 'Shed (v2)', type: 'shed', pct: 80, distraction: 'Researching tools for this project', since_date: '2025-03-15', status: 'finished', lad: 'bigtony', claimed_at: ts(34), finished_at: ts(33, 6), proof_url: 'https://example.com/gerrys-shed', note: 'It has a roof. Gerry has a shed.', created_at: ts(36) },
        { id: 'p4', owner: 'niamh', name: 'Two Lads One Mic (podcast)', type: 'podcast', pct: 80, distraction: 'Made a logo instead', since_date: '2025-11-01', status: 'finished', lad: 'deco', claimed_at: ts(11), finished_at: ts(10), proof_url: 'https://example.com/two-lads-one-mic', note: 'One episode. It’s out. That’s more than you’ve done.', created_at: ts(30) },
        { id: 'p5', owner: 'dave_m', name: 'Home gym', type: 'home_gym', pct: 80, distraction: 'A completely different project', since_date: '2024-09-01', status: 'claimed', lad: 'sharon', claimed_at: ts(4), created_at: ts(29) },
        { id: 'p6', owner: 'scarf', name: 'Settlers of Carlow', type: 'board_game', pct: 80, distraction: 'Sorry, what?', since_date: '2023-05-20', status: 'daycare', created_at: ts(27) },
        { id: 'p7', owner: 'dave_m', name: 'Second brain', type: 'second_brain', pct: 80, distraction: 'Read a book about finishing things', since_date: '2022-02-02', status: 'daycare', created_at: ts(25) },
        { id: 'p8', owner: 'paudie', name: 'Splitwise but for lads', type: 'app', pct: 80, distraction: 'A better version of this project', since_date: '2025-06-06', status: 'claimed', lad: 'marek', claimed_at: ts(7), created_at: ts(22) },
        { id: 'p9', owner: 'gerry', name: 'Uber for sheds', type: 'napkin', pct: 80, distraction: 'Bought a domain for a new idea', since_date: '2026-07-01', status: 'reclaimed', created_at: ts(20) },
        { id: 'p10', owner: 'ciaran', name: 'Notion but for Notion', type: 'saas', pct: 80, distraction: 'Researching tools for this project', since_date: '2025-01-15', status: 'daycare', created_at: ts(18) },
        { id: 'p11', owner: 'aoife', name: 'Novel #2 (it’s different)', type: 'novel', pct: 80, distraction: 'A completely different project', since_date: '2026-03-03', status: 'daycare', created_at: ts(14) },
        { id: 'p12', owner: 'roisin', name: 'Fantasy GAA', type: 'app', pct: 80, distraction: 'Made a logo instead', since_date: '2024-04-04', status: 'claimed', lad: 'deco', claimed_at: ts(21), created_at: ts(24) },
        { id: 'p13', owner: 'dave_m', name: 'Shed (v3)', type: 'shed', pct: 80, distraction: 'Researching tools for this project', since_date: '2025-08-08', status: 'daycare', created_at: ts(9) },
        { id: 'p14', owner: 'scarf', name: 'The Finishing Line (podcast)', type: 'podcast', pct: 80, distraction: 'Sorry, what?', since_date: '2026-01-01', status: 'finished', lad: 'sharon', claimed_at: ts(26), finished_at: ts(24), proof_url: 'https://example.com/the-finishing-line', note: 'Sharon didn’t reply. She just shipped.', created_at: ts(28) },
        { id: 'p15', owner: 'paudie', name: 'Sourdough starter (business)', type: 'napkin', pct: 80, distraction: 'Bought a domain for a new idea', since_date: '2025-10-10', status: 'daycare', created_at: ts(3) }
      ].map(function (p) {
        return { id: p.id, owner_id: 'u_' + p.owner, lad_id: p.lad ? 'u_' + p.lad : null, name: p.name, type: p.type, pct: p.pct, distraction: p.distraction,
          since_date: p.since_date, status: p.status, claimed_at: p.claimed_at || null, finished_at: p.finished_at || null, proof_url: p.proof_url || null, note: p.note || null, created_at: p.created_at };
      });
      var nopes = [['p1', 'u_gerry'], ['p1', 'u_scarf'], ['p1', 'u_niamh'], ['p6', 'u_dave_m'], ['p7', 'u_ciaran'], ['p7', 'u_aoife'], ['p7', 'u_gerry'], ['p7', 'u_scarf'], ['p7', 'u_paudie'], ['p10', 'u_aoife'], ['p10', 'u_roisin'], ['p13', 'u_gerry']]
        .map(function (n) { return { project_id: n[0], voter_id: n[1] }; });
      var releases = [{ project_id: 'p7', lad_id: 'u_deco', reason: 'released', created_at: ts(31) }];
      return { profiles: P, projects: projects, nopes: nopes, releases: releases, uid: null, seq: 100 };
    }
    function load() { try { var s = localStorage.getItem(KEY); if (s) { D = JSON.parse(s); return; } } catch (e) {} D = seed(); }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }
    load();
    var listeners = [];
    function prof(id) { return D.profiles[Object.keys(D.profiles).filter(function (k) { return D.profiles[k].id === id; })[0]] || null; }
    function hydrate(p) {
      return Object.assign({}, p, { owner: prof(p.owner_id), lad: p.lad_id ? prof(p.lad_id) : null, nopes: [{ count: D.nopes.filter(function (n) { return n.project_id === p.id; }).length }] });
    }
    function byId(id) { return D.projects.filter(function (p) { return p.id === id; })[0]; }
    function ok(v) { return Promise.resolve(v); }
    function no(m) { return Promise.reject({ message: m }); }
    function boards() {
      var today = isoDay(Date.now());
      var bast = {}, lads = {};
      D.projects.forEach(function (p) {
        var b = bast[p.owner_id] || (bast[p.owner_id] = { dropped_off: 0, reclaimed: 0, longest: 0, total: 0, nopes: 0 });
        var end = p.finished_at ? isoDay(p.finished_at) : today;
        var days = daysBetween(p.since_date, end);
        b.dropped_off++; if (p.status === 'reclaimed') b.reclaimed++; b.longest = Math.max(b.longest, days); b.total += days;
        b.nopes += D.nopes.filter(function (n) { return n.project_id === p.id; }).length;
        if (p.lad_id) {
          var l = lads[p.lad_id] || (lads[p.lad_id] = { finished: 0, open_claims: 0, hours: [] });
          if (p.status === 'finished') { l.finished++; l.hours.push((new Date(p.finished_at) - new Date(p.claimed_at)) / 3600000); }
          if (p.status === 'claimed') l.open_claims++;
        }
      });
      D.releases.forEach(function (r) { var l = lads[r.lad_id] || (lads[r.lad_id] = { finished: 0, open_claims: 0, hours: [] }); l.released = (l.released || 0) + 1; });
      function who(id) { var p = prof(id) || { id: id, handle: '?', display_name: '?' }; return { profile_id: p.id, handle: p.handle, display_name: p.display_name, avatar_url: p.avatar_url }; }
      var bRows = Object.keys(bast).map(function (id) { var b = bast[id]; return Object.assign(who(id), { dropped_off: b.dropped_off, reclaimed: b.reclaimed, longest_days_at_80: b.longest, total_days_at_80: b.total, nopes_received: b.nopes, bastard_points: b.dropped_off * 10 + b.reclaimed * 30 + b.nopes * 5 + Math.floor(b.total / 30) }); })
        .sort(function (a, b) { return b.bastard_points - a.bastard_points || b.dropped_off - a.dropped_off; });
      var lRows = Object.keys(lads).map(function (id) { var l = lads[id]; var rel = l.released || 0; return Object.assign(who(id), { finished: l.finished, open_claims: l.open_claims, released: rel, avg_hours_to_finish: l.hours.length ? Math.round(l.hours.reduce(function (a, b) { return a + b; }, 0) / l.hours.length) : null, lad_points: l.finished * 100 - rel * 20 }); })
        .sort(function (a, b) { return b.lad_points - a.lad_points || b.finished - a.finished; });
      return { bastards: bRows, lads: lRows };
    }
    return {
      live: false,
      onAuth: function (cb) { listeners.push(cb); },
      session: function () { return ok(D.uid); },
      signIn: function (provider) {
        if (provider === 'apple') return no('Apple sign-in is coming. It needs a developer account and the lads are deciding if you’re worth 99 dollars.');
        if (!D.uid) {
          var h = 'you_' + Math.random().toString(36).slice(2, 6);
          D.profiles[h] = { id: 'u_' + h, handle: h, display_name: 'You', avatar_url: null };
          D.uid = 'u_' + h; save();
        }
        listeners.forEach(function (cb) { cb('SIGNED_IN', D.uid); });
        return ok(true);
      },
      magic: function () { return no('Email sign-in goes live with the backend. Use Google or GitHub.'); },
      signOut: function () { D.uid = null; save(); listeners.forEach(function (cb) { cb('SIGNED_OUT', null); }); return ok(true); },
      me: function (uid) { return ok({ profile: prof(uid), nopes: D.nopes.filter(function (n) { return n.voter_id === uid; }).map(function (n) { return n.project_id; }) }); },
      stats: function () {
        var today = isoDay(Date.now());
        var ps = D.projects, months = ps.length ? ps.reduce(function (a, p) { return a + daysBetween(p.since_date, p.finished_at ? isoDay(p.finished_at) : today); }, 0) / ps.length / 30 : 0;
        return ok({ dropped_off: ps.length, finished: ps.filter(function (p) { return p.status === 'finished'; }).length, in_daycare: ps.filter(function (p) { return p.status === 'daycare' || p.status === 'claimed'; }).length, reclaimed: ps.filter(function (p) { return p.status === 'reclaimed'; }).length, avg_months_at_80: Math.round(months * 10) / 10 });
      },
      daycare: function () {
        var act = D.projects.filter(function (p) { return p.status === 'daycare' || p.status === 'claimed'; }).sort(function (a, b) { return a.created_at < b.created_at ? 1 : -1; }).map(hydrate);
        var fin = D.projects.filter(function (p) { return p.status === 'finished'; }).sort(function (a, b) { return a.finished_at < b.finished_at ? 1 : -1; }).map(hydrate);
        return ok({ active: act, finished: fin });
      },
      boards: function () { return ok(boards()); },
      mine: function (uid) {
        return ok({ mine: D.projects.filter(function (p) { return p.owner_id === uid; }).map(hydrate), claims: D.projects.filter(function (p) { return p.lad_id === uid; }).map(hydrate) });
      },
      updateProfile: function (uid, handle, name) {
        var taken = Object.keys(D.profiles).some(function (k) { return D.profiles[k].handle === handle && D.profiles[k].id !== uid; });
        if (taken) return no('duplicate key value violates unique constraint');
        var p = prof(uid); var oldKey = Object.keys(D.profiles).filter(function (k) { return D.profiles[k].id === uid; })[0];
        p.handle = handle; p.display_name = name; delete D.profiles[oldKey]; D.profiles[handle] = p; save(); return ok(p);
      },
      insert: function (uid, f) {
        var today = D.projects.filter(function (p) { return p.owner_id === uid && p.created_at.slice(0, 10) === isoDay(Date.now()); }).length;
        if (today >= 10) return no('Ten drop-offs today. Go and finish one.');
        var p = { id: 'p' + (++D.seq), owner_id: uid, lad_id: null, name: f.name, type: f.type, pct: f.pct, distraction: f.distraction, since_date: f.since_date, status: 'daycare', claimed_at: null, finished_at: null, proof_url: null, note: null, created_at: new Date().toISOString() };
        D.projects.push(p); save(); return ok(hydrate(p));
      },
      remove: function (id) { var p = byId(id); if (!p || p.owner_id !== D.uid || p.status !== 'daycare') return no('Not yours, or not in daycare.'); D.projects = D.projects.filter(function (x) { return x.id !== id; }); D.nopes = D.nopes.filter(function (n) { return n.project_id !== id; }); save(); return ok(true); },
      rpc: function (name, args) {
        var me = D.uid, p = byId(args.p_id);
        if (!me) return no('Sign in first.');
        if (!p) return no('No such project.');
        if (name === 'claim_project') {
          if (p.owner_id === me) return no('You cannot claim your own project. That is called finishing it.');
          if (p.status !== 'daycare') return no('Not in daycare.');
          if (D.projects.filter(function (x) { return x.lad_id === me && x.status === 'claimed'; }).length >= 3) return no('Three open claims already. Finish one. Lads finish things.');
          p.status = 'claimed'; p.lad_id = me; p.claimed_at = new Date().toISOString();
        } else if (name === 'finish_project') {
          if (p.status !== 'claimed' || p.lad_id !== me) return no('Not your claim.');
          if (!/^https?:\/\//.test(args.p_proof_url || '')) return no('Proof must be a link. Shipped, published, standing, or in a customer’s hands.');
          p.status = 'finished'; p.finished_at = new Date().toISOString(); p.proof_url = args.p_proof_url.slice(0, 500); p.note = (args.p_note || '').slice(0, 280) || null;
        } else if (name === 'release_project') {
          if (p.status !== 'claimed' || p.lad_id !== me) return no('Not your claim.');
          D.releases.push({ project_id: p.id, lad_id: me, reason: 'released', created_at: new Date().toISOString() });
          p.status = 'daycare'; p.lad_id = null; p.claimed_at = null;
        } else if (name === 'reclaim_project') {
          if (p.owner_id !== me) return no('Not yours.');
          if (p.status !== 'daycare' && p.status !== 'claimed') return no('Too late. It is finished. Leave it.');
          p.status = 'reclaimed'; p.lad_id = null; p.claimed_at = null;
        } else if (name === 'unclaim_stale') {
          if (p.owner_id !== me) return no('Not yours.');
          if (p.status !== 'claimed') return no('Nobody has claimed it.');
          if (Date.now() - new Date(p.claimed_at).getTime() < 14 * 86400000) return no('Give the lad 14 days. Tinkering by omission takes time.');
          D.releases.push({ project_id: p.id, lad_id: p.lad_id, reason: 'stale', created_at: new Date().toISOString() });
          p.status = 'daycare'; p.lad_id = null; p.claimed_at = null;
        } else return no('Unknown action.');
        save(); return ok(hydrate(p));
      },
      nope: function (uid, id, on) {
        var p = byId(id); if (!p) return no('No such project.');
        if (p.owner_id === uid) return no('You cannot nope your own project. Everyone else already has.');
        D.nopes = D.nopes.filter(function (n) { return !(n.project_id === id && n.voter_id === uid); });
        if (on) D.nopes.push({ project_id: id, voter_id: uid });
        save(); return ok(true);
      },
      dropCount: function (uid) { return ok(D.projects.filter(function (p) { return p.owner_id === uid; }).length || 1); },
      reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} D = seed(); listeners.forEach(function (cb) { cb('SIGNED_OUT', null); }); }
    };
  }

  api = LIVE ? supabaseApi() : demoApi();

  /* ================= state ================= */
  var uid = null, me = null, myNopes = {};
  function loadMe() {
    if (!uid) { me = null; myNopes = {}; return Promise.resolve(); }
    return api.me(uid).then(function (r) { me = r.profile; myNopes = {}; r.nopes.forEach(function (id) { myNopes[id] = true; }); });
  }
  function needAuth() { if (!uid) { openAuth(); return false; } return true; }

  /* ================= auth UI ================= */
  var authDlg = $('#authDlg');
  function openAuth() { authDlg.showModal ? authDlg.showModal() : authDlg.setAttribute('open', ''); }
  function closeAuth() { if (authDlg.open) { authDlg.close ? authDlg.close() : authDlg.removeAttribute('open'); } }
  $$('[data-open-auth]').forEach(function (b) { b.addEventListener('click', openAuth); });
  $$('[data-close-auth]').forEach(function (b) { b.addEventListener('click', closeAuth); });
  $$('[data-oauth]').forEach(function (b) {
    b.addEventListener('click', function () {
      api.signIn(b.dataset.oauth).then(function () { if (!api.live) toast('Signed in. Demo account, this browser only, until the real sign-in is live.', 3600); })
        .catch(function (e) { toast(errText(e), 4200); });
    });
  });
  var emailLogin = !!CFG.emailLogin;
  var magicForm = $('#magicForm');
  if (magicForm && !emailLogin) magicForm.hidden = true;
  if (magicForm) magicForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = $('#magicEmail').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast('That is not an email address.'); return; }
    var btn = $('#magicBtn'); btn.disabled = true;
    api.magic(email).then(function () { $('#magicSent').hidden = false; $('#magicSent').textContent = 'Link sent to ' + email + '. Check spam. Check it twice.'; })
      .catch(function (e) { toast(errText(e)); }).then(function () { btn.disabled = false; });
  });
  $$('[data-signout]').forEach(function (b) { b.addEventListener('click', function () { api.signOut().then(function () { toast('Signed out. The projects stay.'); }); }); });
  var demoNote = $('#demoNote');
  if (demoNote) demoNote.hidden = api.live;
  var resetBtn = $('#demoReset');
  if (resetBtn) { resetBtn.hidden = api.live; resetBtn.addEventListener('click', function () { if (api.reset) { api.reset(); toast('Demo reset. Everyone is back at 80%.'); } }); }

  function avatar(p, size) {
    var s = size || 28;
    if (p && p.avatar_url) return el('img', { class: 'avatar', alt: '', width: s, height: s, src: p.avatar_url, referrerpolicy: 'no-referrer' });
    var name = (p && (p.display_name || p.handle)) || '??';
    var ini = name.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    return el('span', { class: 'avatar mono', text: ini, style: 'width:' + s + 'px;height:' + s + 'px;font-size:' + Math.round(s * .38) + 'px' });
  }
  function renderNav() {
    var slot = $('#navUser');
    if (!slot) return;
    slot.textContent = '';
    if (!uid || !me) { slot.appendChild(el('button', { type: 'button', class: 'btn yellow', text: 'Sign in', onclick: openAuth })); return; }
    slot.appendChild(el('a', { class: 'navme', href: '#/me', title: 'Your file' }, [avatar(me, 28), el('span', { text: '@' + me.handle })]));
  }

  /* ================= router ================= */
  var VIEWS = ['home', 'daycare', 'boards', 'me'];
  function currentRoute() {
    var h = location.hash || '';
    if (h.indexOf('#/') !== 0) return 'home';
    var name = h.slice(2).split(/[?/]/)[0];
    return VIEWS.indexOf(name) >= 0 ? name : 'home';
  }
  function route() {
    var r = currentRoute();
    VIEWS.forEach(function (v) { var n = $('[data-view="' + v + '"]'); if (n) n.hidden = (v !== r); });
    $$('.nav [data-route]').forEach(function (a) { a.classList.toggle('active', a.dataset.route === r); });
    if (r === 'home') {
      var id = location.hash.replace(/^#\/?/, '');
      var target = id && !/^(access_token|error|code)=/.test(id) ? document.getElementById(id) : null;
      if (target) target.scrollIntoView({ block: 'start', behavior: 'instant' });
      else if (!id) window.scrollTo({ top: 0, behavior: 'instant' });
    } else window.scrollTo({ top: 0, behavior: 'instant' });
    if (r === 'daycare') loadDaycare();
    if (r === 'boards') loadBoards();
    if (r === 'me') loadMine();
  }
  window.addEventListener('hashchange', route);

  /* ================= views ================= */
  function loadStats() {
    api.stats().then(function (d) {
      if (!d) return;
      setText('#stDropped', fmtInt(d.dropped_off)); setText('#stFinished', fmtInt(d.finished)); setText('#inCare', fmtInt(d.in_daycare));
      setText('#stReclaimed', fmtInt(d.reclaimed)); setText('#stAvg', (d.avg_months_at_80 || 0) + ' mo');
      var note = $('#statsNote');
      if (note) note.textContent = api.live ? (Number(d.dropped_off) === 0 ? 'Live figures. Nobody has dropped anything off yet. Be the first bastard.' : 'Live figures.') : 'Sample figures. Real ones take over when sign-in goes live.';
    }).catch(function () {});
  }
  function loadDaycare() {
    var list = $('#daycareList'), done = $('#doneList');
    if (!list) return;
    api.daycare().then(function (r) {
      list.textContent = ''; done.textContent = '';
      if (!r.active.length) empty(list, 'Daycare is empty. Either everyone finished everything, or nobody has signed in yet. It’s the second one.');
      r.active.forEach(function (p) { list.appendChild(card(p)); });
      if (!r.finished.length) empty(done, 'Nothing finished yet. The lads are still lacing up.');
      r.finished.forEach(function (p) { done.appendChild(card(p)); });
    }).catch(function (e) { empty(list, errText(e)); });
  }
  function loadBoards() {
    var b = $('#boardBastards'), l = $('#boardLads');
    if (!b) return;
    api.boards().then(function (r) {
      renderBoard(b, r.bastards, [
        ['#', null], ['Bastard', 'who'], ['Dropped off', 'dropped_off'], ['Longest at 80%', function (x) { return daysLabel(x.longest_days_at_80); }],
        ['Took back', 'reclaimed'], ['Nopes', 'nopes_received'], ['Points', 'bastard_points']
      ], 'Nobody on the board. Suspicious. Drop something off.');
      renderBoard(l, r.lads, [
        ['#', null], ['Lad', 'who'], ['Finished', 'finished'], ['Open', 'open_claims'], ['Released', 'released'],
        ['Avg finish', function (x) { return x.avg_hours_to_finish == null ? '-' : (x.avg_hours_to_finish < 48 ? x.avg_hours_to_finish + ' h' : Math.round(x.avg_hours_to_finish / 24) + ' d'); }],
        ['Points', 'lad_points']
      ], 'No lads yet. Claim something in Daycare and mean it.');
    }).catch(function (e) { empty(b, errText(e)); });
  }
  function renderBoard(node, rows, cols, emptyText) {
    node.textContent = '';
    if (!rows.length) { node.appendChild(el('p', { class: 'empty', text: emptyText })); return; }
    var table = el('table', { class: 'board' }), thead = el('thead'), trh = el('tr');
    cols.forEach(function (c) { trh.appendChild(el('th', { text: c[0] })); });
    thead.appendChild(trh); table.appendChild(thead);
    var tbody = el('tbody');
    rows.forEach(function (r, i) {
      var tr = el('tr', { class: (me && r.profile_id === me.id) ? 'isme' : '' });
      cols.forEach(function (c) {
        var key = c[1], td;
        if (key === null) td = el('td', { class: 'num', text: String(i + 1) });
        else if (key === 'who') td = el('td', {}, [el('span', { class: 'who' }, [avatar(r, 22), el('b', { text: r.display_name || r.handle }), el('span', { class: 'muted', text: ' @' + r.handle })])]);
        else if (typeof key === 'function') td = el('td', { class: 'num', text: key(r) });
        else td = el('td', { class: 'num', text: fmtInt(r[key]) });
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    node.appendChild(el('div', { class: 'tablewrap' }, [table]));
  }
  function loadMine() {
    var mine = $('#mineList'), claims = $('#claimsList'), pf = $('#profileForm');
    if (!mine) return;
    if (!uid) { empty(mine, 'Sign in to see your file.'); empty(claims, ''); pf.hidden = true; return; }
    pf.hidden = false;
    if (me) { $('#pfHandle').value = me.handle; $('#pfName').value = me.display_name; }
    api.mine(uid).then(function (r) {
      mine.textContent = ''; claims.textContent = '';
      if (!r.mine.length) empty(mine, 'No drop-offs. Either you finish things or you’re lying. Drop one off.');
      r.mine.forEach(function (p) { mine.appendChild(card(p)); });
      if (!r.claims.length) empty(claims, 'No claims. Go to Daycare and take something off someone’s hands.');
      r.claims.forEach(function (p) { claims.appendChild(card(p)); });
    });
  }
  var profileForm = $('#profileForm');
  if (profileForm) profileForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!needAuth()) return;
    var handle = $('#pfHandle').value.trim().toLowerCase(), name = $('#pfName').value.trim();
    if (!/^[a-z0-9_]{2,24}$/.test(handle)) { toast('Handle: 2-24 chars, a-z, 0-9, underscore.'); return; }
    if (!name || name.length > 40) { toast('Name: 1-40 characters.'); return; }
    api.updateProfile(uid, handle, name).then(function (p) { me = p; renderNav(); toast('Saved. That’s one thing finished today.'); })
      .catch(function (err) { toast(/unique|duplicate/i.test(errText(err)) ? 'Handle taken. Like all the good ideas.' : errText(err)); });
  });

  /* ================= cards + actions ================= */
  function card(p) {
    var isOwner = !!(me && p.owner_id === me.id), isLad = !!(me && p.lad_id === me.id);
    var nopeCount = (p.nopes && p.nopes[0] && p.nopes[0].count) || 0;
    var end = p.finished_at ? isoDay(p.finished_at) : isoDay(Date.now());
    var days = daysBetween(p.since_date, end);
    var c = el('article', { class: 'pcard status-' + p.status, dataset: { id: p.id } });
    c.appendChild(el('div', { class: 'phead' }, [
      el('a', { class: 'who', href: '#/boards' }, [avatar(p.owner, 22), el('span', { text: '@' + (p.owner ? p.owner.handle : 'someone') })]),
      el('span', { class: 'mono muted', text: TYPES[p.type] || p.type })
    ]));
    c.appendChild(el('h3', { text: p.name }));
    c.appendChild(el('p', { class: 'pdistr' }, [el('span', { class: 'muted', text: 'Distracted by: ' }), el('span', { text: p.distraction })]));
    c.appendChild(el('div', { class: 'pbar' }, [el('i', { style: 'width:' + (p.status === 'finished' ? 100 : p.pct) + '%' })]));
    c.appendChild(el('div', { class: 'pmeta mono' }, [
      el('span', { text: (p.status === 'finished' ? '100%' : p.pct + '%') }),
      el('span', { text: (p.status === 'finished' ? 'sat at 80% for ' : 'at 80% for ') + daysLabel(days) })
    ]));
    var chip;
    if (p.status === 'daycare') chip = el('span', { class: 'chip', text: 'IN DAYCARE' });
    else if (p.status === 'claimed') chip = el('span', { class: 'chip claimed', text: 'CLAIMED BY @' + (p.lad ? p.lad.handle : '?') });
    else if (p.status === 'finished') chip = el('span', { class: 'chip done', text: p.lad ? 'FINISHED BY @' + p.lad.handle : 'FINISHED BY A LAD WHO LEFT' });
    else chip = el('span', { class: 'chip shame', text: 'TAKEN BACK. SHAME.' });
    var chips = el('div', { class: 'pchips' }, [chip]);
    if (nopeCount) chips.appendChild(el('span', { class: 'chip nope', text: nopeCount + (nopeCount === 1 ? ' NOPE' : ' NOPES') }));
    c.appendChild(chips);
    if (p.status === 'finished' && p.proof_url) {
      c.appendChild(el('p', { class: 'proof' }, [
        el('a', { href: p.proof_url, rel: 'noopener noreferrer nofollow ugc', target: '_blank', text: 'Proof of finish' }),
        p.note ? el('span', { class: 'muted', text: ' - ' }) : null,
        p.note ? el('span', { text: p.note }) : null
      ]));
    }
    var actions = el('div', { class: 'pactions' });
    if (p.status === 'daycare') {
      if (!isOwner) actions.appendChild(el('button', { type: 'button', class: 'btn yellow small', text: 'I’ll finish it', onclick: function () { act('claim_project', p.id, 'Claimed. It’s yours now. Don’t tinker.'); } }));
      if (isOwner) actions.appendChild(el('button', { type: 'button', class: 'btn ghost small', text: 'Take it back', onclick: function () { act('reclaim_project', p.id, 'Taken back. Everyone saw.'); } }));
      if (isOwner) actions.appendChild(el('button', { type: 'button', class: 'btn ghost small', text: 'Delete', onclick: function () { delProject(p.id); } }));
    }
    if (p.status === 'claimed') {
      if (isLad) actions.appendChild(el('button', { type: 'button', class: 'btn small', text: 'Mark finished', onclick: function () { finishForm(c, p); } }));
      if (isLad) actions.appendChild(el('button', { type: 'button', class: 'btn ghost small', text: 'Give it back (-20)', onclick: function () { act('release_project', p.id, 'Released. That cost you 20 points. Lads finish things.'); } }));
      if (isOwner) actions.appendChild(el('button', { type: 'button', class: 'btn ghost small', text: 'Take it back', onclick: function () { act('reclaim_project', p.id, 'Taken back mid-claim. Big Tony has been informed.'); } }));
      if (isOwner && p.claimed_at && (Date.now() - new Date(p.claimed_at).getTime()) > 14 * 86400000)
        actions.appendChild(el('button', { type: 'button', class: 'btn ghost small', text: 'Lad’s gone quiet (14d+)', onclick: function () { act('unclaim_stale', p.id, 'Back in daycare. The lad eats the 20. Tinkering by omission.'); } }));
    }
    if (!isOwner && p.status !== 'reclaimed') {
      var noped = !!myNopes[p.id];
      actions.appendChild(el('button', { type: 'button', class: 'btn ghost small' + (noped ? ' on' : ''), text: noped ? 'Un-nope' : 'Nope, that’s not 80%', onclick: function () { toggleNope(p.id, noped); } }));
    }
    if (actions.childNodes.length) c.appendChild(actions);
    return c;
  }
  function refreshView() { loadMe().then(function () { renderNav(); route(); loadStats(); }); }
  function act(fn, id, okText) {
    if (!needAuth()) return;
    api.rpc(fn, { p_id: id }).then(function () { toast(okText); refreshView(); }).catch(function (e) { toast(errText(e), 3800); });
  }
  function delProject(id) {
    if (!needAuth()) return;
    api.remove(id).then(function () { toast('Deleted. It never happened. It did, though.'); refreshView(); }).catch(function (e) { toast(errText(e)); });
  }
  function toggleNope(id, noped) {
    if (!needAuth()) return;
    api.nope(uid, id, !noped).then(function () { toast(noped ? 'Nope withdrawn. Generous.' : 'Noped. Five points to them. Worse points.'); refreshView(); })
      .catch(function (e) { toast(errText(e), 3800); });
  }
  function finishForm(cardNode, p) {
    if ($('.finishform', cardNode)) return;
    var url = el('input', { type: 'url', placeholder: 'https://link-to-the-finished-thing', required: 'required', maxlength: '500' });
    var note = el('input', { type: 'text', placeholder: 'One line. Optional. No tinkering notes.', maxlength: '280' });
    var f = el('form', { class: 'finishform' }, [
      el('label', { text: 'Proof it’s finished. Shipped, published, standing, or in a customer’s hands.' }), url, note,
      el('div', { class: 'row' }, [el('button', { type: 'submit', class: 'btn small', text: 'It’s done' }), el('button', { type: 'button', class: 'btn ghost small', text: 'Cancel', onclick: function () { f.remove(); } })])
    ]);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var u = url.value.trim();
      if (!/^https?:\/\//.test(u)) { toast('Proof must be a link.'); return; }
      api.rpc('finish_project', { p_id: p.id, p_proof_url: u, p_note: note.value.trim() || null })
        .then(function () { toast('Finished. Invoice sent. 100 points. Go and start something else.'); refreshView(); })
        .catch(function (err) { toast(errText(err), 3800); });
    });
    cardNode.appendChild(f);
  }

  /* ================= drop-off form ================= */
  var ppct = $('#ppct'), ppctOut = $('#ppctOut'), ppctHint = $('#ppctHint'), ptries = 0;
  if (ppct) ppct.addEventListener('input', function () {
    var v = parseInt(ppct.value, 10);
    if (v > 80) { ppct.value = 80; v = 80; ppctHint.textContent = ptries === 0 ? 'Liar.' : (ptries === 1 ? 'Still a liar.' : 'We both know it’s 80.'); ppctHint.classList.add('warn'); ptries++; }
    else if (v < 80) { ppctHint.textContent = 'Below 80. We won’t take it. Do one more evening on it.'; ppctHint.classList.add('warn'); }
    else { ppctHint.textContent = '80% is the minimum. 80% is also the maximum. Interesting.'; ppctHint.classList.remove('warn'); }
    ppctOut.value = v + '%';
  });
  var form = $('#dropForm');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#pname').value.trim(), type = $('#ptype').value, since = $('#psince').value, why = $('#pwhy').value,
        v = parseInt(ppct.value, 10), waiver = $('#pwaiver').checked;
    if (!waiver) { toast('Sign the waiver. Big Tony is watching.'); return; }
    if (!name || name.length > 80) { toast('Give it its current name. 1-80 characters.'); return; }
    if (v < 80) { toast('It’s at ' + v + '%. Bring it back at 80.'); ppctHint.textContent = 'Not yet. 80.'; ppctHint.classList.add('warn'); return; }
    if (!needAuth()) return;
    var btn = $('#dropBtn'); btn.disabled = true;
    api.insert(uid, { name: name, type: type, pct: v, distraction: why, since_date: sinceDate(since) })
      .then(function (p) { return api.dropCount(uid).then(function (n) { printReceipt(p, n); }); })
      .then(function () { toast('Dropped off. It’s in Daycare. Walk away.'); loadStats(); })
      .catch(function (err) { toast(errText(err), 4200); })
      .then(function () { btn.disabled = false; });
  });
  function printReceipt(p, count) {
    var n = count || 1;
    var cut = n <= 1 ? '20% of the whole thing' : (n <= 5 ? '30% of the whole thing' : '40% of the whole thing + admin password');
    setText('#rNo', 'No. 80-' + String(p.id).replace(/[^a-z0-9]/gi, '').slice(-4).toUpperCase() + ' · ' + new Date().toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric' }));
    setText('#rName', p.name); setText('#rType', TYPES[p.type] || p.type); setText('#rPct', p.pct + '%');
    setText('#rSince', daysLabel(daysSince(p.since_date)) + ' at 80%'); setText('#rWhy', p.distraction);
    setText('#rLad', 'Whoever claims it in Daycare. Not you.'); setText('#rCut', cut);
    setText('#rStamp', n >= 6 ? 'FOUNDER MODE. GOD HELP US.' : 'NOT YOUR PROBLEM ANY MORE');
    setText('#rFoot', n >= 6 ? 'A lad is on his way to sit beside you. Do not buy a domain while you wait.' : 'Retain for your records. We won’t be in touch. Sharon has your email. She will not use it.');
    var note = $('.receipt-note'); if (note) note.textContent = 'Printed. It’s in Daycare now. Go and start something else.';
    var r = $('#receipt'); if (r && r.animate) r.animate([{ transform: 'translateY(-6px)', opacity: .4 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 350, easing: 'ease-out' });
  }

  /* ================= boot ================= */
  api.onAuth(function (event, id) {
    uid = id || null;
    if (event === 'SIGNED_IN') closeAuth();
    loadMe().then(function () { renderNav(); route(); if (currentRoute() === 'home') loadStats(); });
  });
  api.session().then(function (id) {
    uid = id || null;
    return loadMe();
  }).then(function () { renderNav(); route(); loadStats(); });
})();
