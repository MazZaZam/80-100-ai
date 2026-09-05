/* eightyhundred.ai - app.js (no inline scripts; CSP script-src 'self' + jsdelivr) */
(function () {
  'use strict';

  var CFG = window.EH_CONFIG || null;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k === 'html') { /* never used - textContent only */ }
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
  function daysSince(d) { return Math.max(0, Math.floor((Date.now() - new Date(d + 'T00:00:00Z').getTime()) / 86400000)); }
  function daysLabel(n) { if (n < 1) return 'today'; if (n === 1) return '1 day'; if (n < 60) return n + ' days'; var m = Math.round(n / 30); return m + (m === 1 ? ' month' : ' months'); }

  var TYPES = {
    app: 'App', saas: 'SaaS (has a landing page)', novel: 'Novel', podcast: 'Podcast', shed: 'Shed',
    board_game: 'Board game', napkin: 'Business idea (napkin)', home_gym: 'Home gym', second_brain: 'Second brain', other: 'Other, it’s hard to explain'
  };
  var SINCE = {
    weeks: { label: 'A few weeks', days: 21 }, months: { label: 'A few months', days: 120 }, lastyear: { label: 'Last year', days: 365 },
    y2019: { label: '2019', date: '2019-06-01' }, anniversary: { label: 'It has its own anniversary', days: 1000 }
  };
  function sinceDate(key) {
    var s = SINCE[key] || SINCE.months;
    if (s.date) return s.date;
    var d = new Date(Date.now() - s.days * 86400000);
    return d.toISOString().slice(0, 10);
  }

  /* ---------------- landing interactions ---------------- */
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

  /* ---------------- backend ---------------- */
  var sb = null, session = null, me = null, myNopes = {};
  var backendOk = !!(CFG && CFG.url && CFG.key && window.supabase && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(CFG.url));
  if (backendOk) {
    sb = window.supabase.createClient(CFG.url, CFG.key, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }
  function redirectTarget() { return location.origin + location.pathname; }
  function requireBackend() { if (!backendOk) { toast('Backend not wired up yet. The lads are on it.'); return false; } return true; }
  function needAuth() { if (!session) { openAuth(); return false; } return true; }
  function errText(e) { return (e && (e.message || e.error_description || e.msg)) || 'Something went wrong. Not your fault. Probably.'; }

  /* ---------------- auth ---------------- */
  var authDlg = $('#authDlg');
  function openAuth() { if (!requireBackend()) return; authDlg.showModal ? authDlg.showModal() : authDlg.setAttribute('open', ''); }
  function closeAuth() { authDlg.close ? authDlg.close() : authDlg.removeAttribute('open'); }
  $$('[data-open-auth]').forEach(function (b) { b.addEventListener('click', openAuth); });
  $$('[data-close-auth]').forEach(function (b) { b.addEventListener('click', closeAuth); });
  $$('[data-oauth]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!requireBackend()) return;
      sb.auth.signInWithOAuth({ provider: b.dataset.oauth, options: { redirectTo: redirectTarget() } })
        .then(function (r) { if (r.error) toast(errText(r.error)); });
    });
  });
  var emailLogin = !!(CFG && CFG.emailLogin);
  var magicForm = $('#magicForm');
  if (magicForm && !emailLogin) magicForm.hidden = true;
  if (magicForm) magicForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!requireBackend()) return;
    if (!emailLogin) { toast('Email sign-in is off. Use Google or GitHub.'); return; }
    var email = $('#magicEmail').value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast('That is not an email address.'); return; }
    var btn = $('#magicBtn'); btn.disabled = true;
    sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: redirectTarget(), shouldCreateUser: true } })
      .then(function (r) {
        btn.disabled = false;
        if (r.error) { toast(errText(r.error)); return; }
        $('#magicSent').hidden = false; $('#magicSent').textContent = 'Link sent to ' + email + '. Check spam. Check it twice.';
      });
  });
  $$('[data-signout]').forEach(function (b) { b.addEventListener('click', function () { if (sb) sb.auth.signOut().then(function () { toast('Signed out. The projects stay.'); }); }); });

  function loadMe() {
    if (!session) { me = null; myNopes = {}; return Promise.resolve(); }
    return Promise.all([
      sb.from('profiles').select('id,handle,display_name,avatar_url').eq('id', session.user.id).maybeSingle(),
      sb.from('nopes').select('project_id').eq('voter_id', session.user.id)
    ]).then(function (rs) {
      me = rs[0].data || null;
      myNopes = {};
      (rs[1].data || []).forEach(function (n) { myNopes[n.project_id] = true; });
    });
  }

  function renderNav() {
    var slot = $('#navUser');
    if (!slot) return;
    slot.textContent = '';
    if (!backendOk) { slot.appendChild(el('a', { class: 'btn', href: '#dropoff', text: 'Drop off a project' })); return; }
    if (!session || !me) {
      slot.appendChild(el('button', { type: 'button', class: 'btn', text: 'Sign in', onclick: openAuth }));
      return;
    }
    var a = el('a', { class: 'navme', href: '#/me', title: 'Your file' }, [avatar(me, 28), el('span', { text: '@' + me.handle })]);
    slot.appendChild(a);
  }
  function avatar(p, size) {
    var s = size || 28;
    if (p && p.avatar_url) { var img = el('img', { class: 'avatar', alt: '', width: s, height: s, src: p.avatar_url, referrerpolicy: 'no-referrer' }); return img; }
    return el('span', { class: 'avatar mono', text: (p && p.handle ? p.handle.slice(0, 2) : '??').toUpperCase(), style: 'width:' + s + 'px;height:' + s + 'px;font-size:' + Math.round(s * .38) + 'px' });
  }

  /* ---------------- router ---------------- */
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
      var target = id ? document.getElementById(id) : null;
      if (target) target.scrollIntoView({ block: 'start' });
      else if (!id) window.scrollTo({ top: 0, behavior: 'instant' });
    } else window.scrollTo({ top: 0, behavior: 'instant' });
    if (r === 'daycare') loadDaycare();
    if (r === 'boards') loadBoards();
    if (r === 'me') loadMine();
  }
  window.addEventListener('hashchange', route);

  /* ---------------- data ---------------- */
  var SELECT = '*, owner:profiles!projects_owner_id_fkey(id,handle,display_name,avatar_url), lad:profiles!projects_lad_id_fkey(id,handle,display_name,avatar_url), nopes(count)';

  function loadStats() {
    if (!backendOk) return;
    sb.from('stats').select('*').maybeSingle().then(function (r) {
      if (r.error || !r.data) return;
      var d = r.data;
      setText('#stDropped', fmtInt(d.dropped_off)); setText('#stFinished', fmtInt(d.finished));
      setText('#inCare', fmtInt(d.in_daycare)); setText('#stReclaimed', fmtInt(d.reclaimed));
      setText('#stAvg', (d.avg_months_at_80 || 0) + ' mo');
      var note = $('#statsNote'); if (note) note.textContent = Number(d.dropped_off) === 0 ? 'Live figures. Nobody has dropped anything off yet. Be the first bastard.' : 'Live figures.';
    });
  }
  function setText(sel, v) { var n = $(sel); if (n) n.textContent = v; }

  function loadDaycare() {
    var list = $('#daycareList'), done = $('#doneList');
    if (!list) return;
    if (!backendOk) { empty(list, 'Daycare opens when the backend is wired up. Until then, it’s just you and the shed.'); empty(done, ''); return; }
    list.textContent = ''; list.appendChild(el('p', { class: 'muted mono', text: 'Loading…' }));
    Promise.all([
      sb.from('projects').select(SELECT).in('status', ['daycare', 'claimed']).order('created_at', { ascending: false }).limit(100),
      sb.from('projects').select(SELECT).eq('status', 'finished').order('finished_at', { ascending: false }).limit(12)
    ]).then(function (rs) {
      if (rs[0].error) { empty(list, errText(rs[0].error)); return; }
      var rows = rs[0].data || [];
      list.textContent = '';
      if (!rows.length) { empty(list, 'Daycare is empty. Either everyone finished everything, or nobody has signed in yet. It’s the second one.'); }
      rows.forEach(function (p) { list.appendChild(card(p)); });
      done.textContent = '';
      var fin = rs[1].data || [];
      if (!fin.length) { empty(done, 'Nothing finished yet. The lads are still lacing up.'); }
      fin.forEach(function (p) { done.appendChild(card(p)); });
    });
  }
  function empty(node, text) { if (!node) return; node.textContent = ''; if (text) node.appendChild(el('p', { class: 'empty', text: text })); }

  function loadBoards() {
    var b = $('#boardBastards'), l = $('#boardLads');
    if (!b) return;
    if (!backendOk) { empty(b, 'Boards go live with the backend.'); empty(l, ''); return; }
    Promise.all([
      sb.from('leaderboard_bastards').select('*').limit(50),
      sb.from('leaderboard_lads').select('*').limit(50)
    ]).then(function (rs) {
      renderBoard(b, rs[0].data || [], [
        ['#', null], ['Bastard', 'who'], ['Dropped off', 'dropped_off'], ['Longest at 80%', function (r) { return daysLabel(r.longest_days_at_80); }],
        ['Took back', 'reclaimed'], ['Nopes', 'nopes_received'], ['Points', 'bastard_points']
      ], 'Nobody on the board. Suspicious. Drop something off.');
      renderBoard(l, rs[1].data || [], [
        ['#', null], ['Lad', 'who'], ['Finished', 'finished'], ['Open claims', 'open_claims'], ['Released', 'released'],
        ['Avg time to finish', function (r) { return r.avg_hours_to_finish == null ? '-' : (r.avg_hours_to_finish < 48 ? r.avg_hours_to_finish + ' h' : Math.round(r.avg_hours_to_finish / 24) + ' d'); }],
        ['Points', 'lad_points']
      ], 'No lads yet. Claim something in Daycare and mean it.');
    });
  }
  function renderBoard(node, rows, cols, emptyText) {
    node.textContent = '';
    if (!rows.length) { node.appendChild(el('p', { class: 'empty', text: emptyText })); return; }
    var table = el('table', { class: 'board' });
    var thead = el('thead'); var trh = el('tr');
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
    var mine = $('#mineList'), claims = $('#claimsList');
    if (!mine) return;
    if (!backendOk) { empty(mine, 'Your file opens with the backend.'); empty(claims, ''); return; }
    if (!session) { empty(mine, 'Sign in to see your file.'); empty(claims, ''); $('#profileForm').hidden = true; return; }
    $('#profileForm').hidden = false;
    if (me) { $('#pfHandle').value = me.handle; $('#pfName').value = me.display_name; }
    Promise.all([
      sb.from('projects').select(SELECT).eq('owner_id', session.user.id).order('created_at', { ascending: false }),
      sb.from('projects').select(SELECT).eq('lad_id', session.user.id).order('claimed_at', { ascending: false })
    ]).then(function (rs) {
      mine.textContent = ''; claims.textContent = '';
      var a = rs[0].data || [], b = rs[1].data || [];
      if (!a.length) empty(mine, 'No drop-offs. Either you finish things or you’re lying. Drop one off.');
      a.forEach(function (p) { mine.appendChild(card(p)); });
      if (!b.length) empty(claims, 'No claims. Go to Daycare and take something off someone’s hands.');
      b.forEach(function (p) { claims.appendChild(card(p)); });
    });
  }
  var profileForm = $('#profileForm');
  if (profileForm) profileForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!needAuth()) return;
    var handle = $('#pfHandle').value.trim().toLowerCase(), name = $('#pfName').value.trim();
    if (!/^[a-z0-9_]{2,24}$/.test(handle)) { toast('Handle: 2-24 chars, a-z, 0-9, underscore.'); return; }
    if (!name || name.length > 40) { toast('Name: 1-40 characters.'); return; }
    sb.from('profiles').update({ handle: handle, display_name: name }).eq('id', session.user.id).select().maybeSingle().then(function (r) {
      if (r.error) { toast(/unique|duplicate/i.test(r.error.message) ? 'Handle taken. Like all the good ideas.' : errText(r.error)); return; }
      me = r.data; renderNav(); toast('Saved. That’s one thing finished today.');
    });
  });

  /* ---------------- cards + actions ---------------- */
  function card(p) {
    var isOwner = me && p.owner_id === me.id, isLad = me && p.lad_id === me.id;
    var nopeCount = (p.nopes && p.nopes[0] && p.nopes[0].count) || 0;
    var days = daysSince(p.since_date);
    var c = el('article', { class: 'pcard status-' + p.status, dataset: { id: p.id } });

    var head = el('div', { class: 'phead' }, [
      el('a', { class: 'who', href: '#/boards' }, [avatar(p.owner, 22), el('span', { text: '@' + (p.owner ? p.owner.handle : 'someone') })]),
      el('span', { class: 'mono muted', text: TYPES[p.type] || p.type })
    ]);
    c.appendChild(head);
    c.appendChild(el('h3', { text: p.name }));
    c.appendChild(el('p', { class: 'pdistr' }, [el('span', { class: 'muted', text: 'Distracted by: ' }), el('span', { text: p.distraction })]));

    var bar = el('div', { class: 'pbar' }, [el('i', { style: 'width:' + (p.status === 'finished' ? 100 : p.pct) + '%' })]);
    var meta = el('div', { class: 'pmeta mono' }, [
      el('span', { text: (p.status === 'finished' ? '100%' : p.pct + '%') }),
      el('span', { text: 'at 80% for ' + daysLabel(days) })
    ]);
    c.appendChild(bar); c.appendChild(meta);

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
    if (backendOk) {
      if (p.status === 'daycare') {
        if (!isOwner) actions.appendChild(el('button', { type: 'button', class: 'btn yellow small', text: 'I’ll finish it', onclick: function () { act('claim_project', p.id, 'Claimed. It’s yours now. Don’t tinker.'); } }));
        if (isOwner) actions.appendChild(el('button', { type: 'button', class: 'btn ghost small', text: 'Take it back', onclick: function () { if (confirmShame()) act('reclaim_project', p.id, 'Taken back. Everyone saw.'); } }));
        if (isOwner) actions.appendChild(el('button', { type: 'button', class: 'btn ghost small', text: 'Delete', onclick: function () { delProject(p.id); } }));
      }
      if (p.status === 'claimed') {
        if (isLad) actions.appendChild(el('button', { type: 'button', class: 'btn small', text: 'Mark finished', onclick: function () { finishForm(c, p); } }));
        if (isLad) actions.appendChild(el('button', { type: 'button', class: 'btn ghost small', text: 'Give it back (-20)', onclick: function () { act('release_project', p.id, 'Released. That cost you 20 points. Lads finish things.'); } }));
        if (isOwner) actions.appendChild(el('button', { type: 'button', class: 'btn ghost small', text: 'Take it back', onclick: function () { if (confirmShame()) act('reclaim_project', p.id, 'Taken back mid-claim. Big Tony has been informed.'); } }));
        if (isOwner && p.claimed_at && (Date.now() - new Date(p.claimed_at).getTime()) > 14 * 86400000)
          actions.appendChild(el('button', { type: 'button', class: 'btn ghost small', text: 'Lad’s gone quiet (14d+)', onclick: function () { act('unclaim_stale', p.id, 'Back in daycare. The lad eats the 20. Tinkering by omission.'); } }));
      }
      if (!isOwner && p.status !== 'reclaimed') {
        var noped = !!myNopes[p.id];
        actions.appendChild(el('button', { type: 'button', class: 'btn ghost small' + (noped ? ' on' : ''), text: noped ? 'Un-nope' : 'Nope, that’s not 80%', onclick: function () { toggleNope(p.id, noped); } }));
      }
    }
    if (actions.childNodes.length) c.appendChild(actions);
    return c;
  }
  function confirmShame() { return true; }
  function refreshView() { loadMe().then(function () { renderNav(); route(); loadStats(); }); }
  function act(fn, id, okText) {
    if (!needAuth()) return;
    sb.rpc(fn, { p_id: id }).then(function (r) {
      if (r.error) { toast(errText(r.error), 3800); return; }
      toast(okText); refreshView();
    });
  }
  function delProject(id) {
    if (!needAuth()) return;
    sb.from('projects').delete().eq('id', id).then(function (r) {
      if (r.error) { toast(errText(r.error)); return; }
      toast('Deleted. It never happened. It did, though.'); refreshView();
    });
  }
  function toggleNope(id, noped) {
    if (!needAuth()) return;
    var q = noped ? sb.from('nopes').delete().eq('project_id', id).eq('voter_id', session.user.id)
                  : sb.from('nopes').insert({ project_id: id, voter_id: session.user.id });
    q.then(function (r) {
      if (r.error) { toast(errText(r.error), 3800); return; }
      toast(noped ? 'Nope withdrawn. Generous.' : 'Noped. Five points to them. Worse points.'); refreshView();
    });
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
      sb.rpc('finish_project', { p_id: p.id, p_proof_url: u, p_note: note.value.trim() || null }).then(function (r) {
        if (r.error) { toast(errText(r.error), 3800); return; }
        toast('Finished. Invoice sent. 100 points. Go and start something else.'); refreshView();
      });
    });
    cardNode.appendChild(f);
  }

  /* ---------------- drop-off form ---------------- */
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
    if (!backendOk) { printReceipt({ name: name, type: type, pct: v, since_date: sinceDate(since), distraction: why }, null, true); return; }
    if (!needAuth()) return;
    var btn = $('#dropBtn'); btn.disabled = true;
    sb.from('projects').insert({ owner_id: session.user.id, name: name, type: type, pct: v, distraction: why, since_date: sinceDate(since) })
      .select(SELECT).single()
      .then(function (r) {
        btn.disabled = false;
        if (r.error) { toast(errText(r.error), 4200); return; }
        return sb.from('leaderboard_bastards').select('dropped_off').eq('profile_id', session.user.id).maybeSingle().then(function (b) {
          printReceipt(r.data, (b.data && b.data.dropped_off) || 1, false);
          toast('Dropped off. It’s in Daycare. Walk away.');
          loadStats();
        });
      });
  });
  function printReceipt(p, count, example) {
    var n = count || 1;
    var cut = n <= 1 ? '20% of the whole thing' : (n <= 5 ? '30% of the whole thing' : '40% of the whole thing + admin password');
    setText('#rNo', 'No. 80-' + (p.id ? p.id.slice(0, 4).toUpperCase() : '0000') + ' · ' + new Date().toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric' }) + (example ? ' · example' : ''));
    setText('#rName', p.name); setText('#rType', TYPES[p.type] || p.type); setText('#rPct', p.pct + '%');
    setText('#rSince', daysLabel(daysSince(p.since_date)) + ' at 80%'); setText('#rWhy', p.distraction);
    setText('#rLad', example ? 'Whoever claims it. Not you.' : 'Whoever claims it in Daycare. Not you.');
    setText('#rCut', cut);
    setText('#rStamp', n >= 6 ? 'FOUNDER MODE. GOD HELP US.' : 'NOT YOUR PROBLEM ANY MORE');
    setText('#rFoot', n >= 6 ? 'A lad is on his way to sit beside you. Do not buy a domain while you wait.' : 'Retain for your records. We won’t be in touch. Sharon has your email. She will not use it.');
    var note = $('.receipt-note'); if (note) note.textContent = example ? 'Example receipt. Sign in and the real one prints here.' : 'Printed. It’s in Daycare now. Go and start something else.';
    var r = $('#receipt'); if (r && r.animate) r.animate([{ transform: 'translateY(-6px)', opacity: .4 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 350, easing: 'ease-out' });
  }

  /* ---------------- boot ---------------- */
  if (backendOk) {
    sb.auth.onAuthStateChange(function (event, s) {
      session = s || null;
      if (event === 'SIGNED_IN') closeAuth();
      loadMe().then(function () { renderNav(); route(); });
    });
    sb.auth.getSession().then(function (r) {
      session = (r.data && r.data.session) || null;
      loadMe().then(function () { renderNav(); route(); loadStats(); });
    });
  } else {
    renderNav(); route();
    var bn = $('#backendNote'); if (bn) bn.hidden = false;
  }
})();
