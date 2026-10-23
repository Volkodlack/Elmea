/* ==========================================================
   Élméa Solutions – espace d'administration (/admin/)
   Statistiques de fréquentation + gestion des articles du blog.
   Aucune dépendance : tout passe par l'API /api/admin/*.
   ========================================================== */
(function () {
  'use strict';

  var CFG = { icons: {}, photos: [], categories: [], pages: {}, site: {} };
  try { CFG = JSON.parse(document.getElementById('adminConfig').textContent); } catch (e) {}
  document.addEventListener('error', function (e) { if (e.target && e.target.tagName === 'IMG' && e.target.hasAttribute('data-fallback')) e.target.remove(); }, true);
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var icon = function (n, cls) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' + (cls || 'w-4 h-4') + '" aria-hidden="true">' + (CFG.icons[n] || '') + '</svg>';
  };
  var nf = new Intl.NumberFormat('fr-FR');
  var fmtDay = function (d, opts) { return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', opts || { day: 'numeric', month: 'long', year: 'numeric' }); };
  var todayStr = function () { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

  var view = $('#view');
  var state = { days: 30, posts: null, dirty: false };

  /* ---------------------------------------------------------- API */
  function api(path, opts) {
    opts = opts || {};
    var init = { method: opts.method || 'GET', credentials: 'same-origin', headers: {} };
    if (opts.blob) { init.body = opts.blob; init.headers['Content-Type'] = opts.blob.type; }
    else if (opts.body) { init.body = JSON.stringify(opts.body); init.headers['Content-Type'] = 'application/json'; }
    return fetch('/api/admin' + path, init).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.status === 401 && path !== '/login') { showLogin(data.message); }
        if (!res.ok) {
          var e = new Error(data.message || (res.status === 404 ? 'API introuvable' : 'Erreur ' + res.status));
          e.status = res.status; e.code = data.error; throw e;
        }
        return data;
      });
    });
  }

  /* ---------------------------------------------------------- Toast */
  var toastTimer;
  function toast(msg, type) {
    var t = $('#toast');
    t.textContent = msg;
    t.className = 'fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full shadow-soft text-sm font-medium ' +
      (type === 'err' ? 'bg-red-600 text-white' : 'bg-forest text-cream');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.add('hidden'); }, 3500);
  }

  /* ---------------------------------------------------------- Écrans */
  function show(id) {
    ['boot', 'login', 'app'].forEach(function (x) { $('#' + x).classList.toggle('hidden', x !== id); });
  }

  function showLogin(msg) {
    show('login');
    var err = $('#loginErr');
    err.textContent = msg || '';
    err.classList.toggle('hidden', !msg);
    setTimeout(function () { $('#pwd').focus(); }, 50);
  }

  function showSetup(e) {
    show('app');
    $('#tabs').classList.add('hidden');
    var nodb = e && e.code === 'nodb';
    view.innerHTML =
      '<div class="max-w-2xl mx-auto card p-8 sm:p-10">' +
      '<span class="w-14 h-14 rounded-full bg-terra-soft text-terra flex items-center justify-center">' + icon('database', 'w-7 h-7') + '</span>' +
      '<h1 class="font-serif text-3xl text-forest font-semibold mt-5">' + (nodb ? 'Encore une étape : brancher la base de données' : 'L’espace admin n’est pas encore actif') + '</h1>' +
      (nodb
        ? '<p class="mt-4 text-ink/75 leading-relaxed">Les statistiques et les articles sont enregistrés dans une base Cloudflare D1 gratuite. Elle n’est pas encore reliée au site :</p>' +
          '<ol class="mt-5 space-y-3 text-[15px] text-ink/80 list-decimal pl-5">' +
          '<li>Dans Cloudflare : <strong>Storage &amp; Databases → D1 SQL Database → Create</strong>, nommez-la <code class="bg-cream px-1.5 py-0.5 rounded">elmea-db</code>.</li>' +
          '<li>Projet Pages <strong>elmea → Settings → Bindings → Add → D1 database</strong> : nom de variable <code class="bg-cream px-1.5 py-0.5 rounded">DB</code>, base <code class="bg-cream px-1.5 py-0.5 rounded">elmea-db</code>.</li>' +
          '<li>Onglet <strong>Deployments</strong> → dernier déploiement → <strong>Retry deployment</strong>.</li></ol>' +
          '<p class="mt-5 text-sm text-ink/60">Les tables se créent toutes seules et les 6 articles existants y sont recopiés automatiquement.</p>'
        : '<p class="mt-4 text-ink/75 leading-relaxed">L’API du site ne répond pas (' + esc(e && e.message) + '). L’espace admin fonctionne uniquement une fois le site déployé sur Cloudflare Pages.</p>') +
      '<button type="button" class="btn-primary mt-8" data-reload>' + icon('refresh-cw') + ' Réessayer</button></div>';
    $('[data-reload]', view).addEventListener('click', function () { location.reload(); });
  }

  function boot() {
    api('/me').then(function () { startApp(); }).catch(function (e) {
      if (e.status === 401) showLogin();
      else showSetup(e);
    });
  }

  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('button[type=submit]', this);
    btn.disabled = true;
    api('/login', { method: 'POST', body: { password: $('#pwd').value } }).then(function () {
      $('#pwd').value = '';
      try { localStorage.setItem('elmea_notrack', '1'); } catch (err) {}
      startApp();
    }).catch(function (err) {
      if (err.code === 'nodb' || err.status === 404) return showSetup(err);
      showLogin(err.message);
    }).then(function () { btn.disabled = false; });
  });

  $('#logout').addEventListener('click', function () {
    if (state.dirty && !window.confirm('Des modifications ne sont pas enregistrées. Se déconnecter quand même ?')) return;
    state.dirty = false;
    api('/logout', { method: 'POST' }).catch(function () {}).then(function () { showLogin(); });
  });

  function startApp() {
    show('app');
    $('#tabs').classList.remove('hidden');
    route();
  }

  /* ---------------------------------------------------------- Routage */
  function route() {
    if ($('#app').classList.contains('hidden')) return;
    var h = location.hash.replace(/^#\/?/, '');
    var tab = h.indexOf('articles') === 0 ? 'posts' : 'stats';
    $$('#tabs button').forEach(function (b) {
      var on = b.getAttribute('data-tab') === tab;
      b.className = 'flex-1 sm:flex-none px-4 py-2 rounded-full text-sm font-medium transition inline-flex items-center justify-center gap-2 ' + (on ? 'bg-cream text-forest' : 'text-cream/80 hover:text-cream');
      b.setAttribute('aria-current', on ? 'page' : 'false');
    });
    window.scrollTo(0, 0);
    if (h === 'articles/nouveau') return renderEditor(null);
    if (h.indexOf('articles/modifier/') === 0) return renderEditor(decodeURIComponent(h.split('/')[2] || ''));
    if (tab === 'posts') return renderPosts();
    renderStats();
  }
  window.addEventListener('hashchange', function () {
    if (state.dirty && !window.confirm('Des modifications ne sont pas enregistrées. Quitter l’éditeur ?')) {
      history.replaceState(null, '', state.editHash); return;
    }
    state.dirty = false;
    route();
  });
  window.addEventListener('beforeunload', function (e) { if (state.dirty) { e.preventDefault(); e.returnValue = ''; } });
  $$('#tabs button').forEach(function (b) {
    b.addEventListener('click', function () { location.hash = b.getAttribute('data-tab') === 'posts' ? '#articles' : '#stats'; });
  });

  /* ==========================================================
     STATISTIQUES
     ========================================================== */
  var EVENT_LABELS = {
    whatsapp: ['WhatsApp', 'message-circle'], telephone: ['Appels téléphoniques', 'phone'], email: ['Emails', 'mail'],
    formulaire: ['Formulaire de devis', 'send'], facebook: ['Clics vers Facebook', 'facebook'], instagram: ['Clics vers Instagram', 'instagram']
  };
  var DEVICE_LABELS = { mobile: ['Mobile', 'smartphone'], tablette: ['Tablette', 'tablet'], ordinateur: ['Ordinateur', 'monitor'] };
  var countryName = (function () {
    var dn = null;
    try { dn = new Intl.DisplayNames(['fr'], { type: 'region' }); } catch (e) {}
    return function (c) { if (!c || c === 'XX' || c === 'T1') return 'Inconnu'; try { return dn ? dn.of(c) : c; } catch (e) { return c; } };
  })();

  function pageLabel(path) {
    if (CFG.pages[path]) return CFG.pages[path];
    var m = path.match(/^\/blog\/([^/]+)\/$/);
    if (m && state.posts) {
      var p = state.posts.filter(function (x) { return x.slug === m[1]; })[0];
      if (p) return p.title;
    }
    return path;
  }

  function delta(cur, prev) {
    if (!prev) return '<span class="text-xs text-ink/45">Pas de comparaison</span>';
    var pct = Math.round((cur - prev) / prev * 100);
    if (pct === 0) return '<span class="inline-flex items-center gap-1 text-xs text-ink/60">' + icon('minus', 'w-3.5 h-3.5') + 'Stable</span>';
    var up = pct > 0;
    return '<span class="inline-flex items-center gap-1 text-xs font-semibold ' + (up ? 'text-forest' : 'text-terra') + '">' +
      icon(up ? 'arrow-up-right' : 'arrow-down-right', 'w-3.5 h-3.5') + (up ? '+' : '') + pct + ' %</span> <span class="text-xs text-ink/45">vs période précédente</span>';
  }

  function kpi(label, value, sub, ic) {
    return '<div class="card p-5 sm:p-6">' +
      '<div class="flex items-center justify-between text-ink/60 text-sm"><span>' + label + '</span><span class="text-terra">' + icon(ic, 'w-5 h-5') + '</span></div>' +
      '<p class="font-serif text-4xl sm:text-5xl text-forest font-semibold mt-2 tabular-nums">' + value + '</p>' +
      '<p class="mt-2">' + sub + '</p></div>';
  }

  function listCard(title, ic, rows, emptyMsg) {
    var max = rows.reduce(function (m, r) { return Math.max(m, r.value); }, 0) || 1;
    return '<section class="card p-6 min-w-0">' +
      '<h2 class="font-semibold text-forest flex items-center gap-2">' + icon(ic, 'w-4 h-4 text-terra') + title + '</h2>' +
      (rows.length
        ? '<ul class="mt-4 space-y-1.5">' + rows.map(function (r) {
            return '<li class="relative rounded-lg overflow-hidden">' +
              '<span class="absolute inset-y-0 left-0 bg-terra-soft rounded-lg" style="width:' + Math.max(2, r.value / max * 100) + '%"></span>' +
              '<span class="relative flex items-center justify-between gap-3 px-3 py-2 text-sm">' +
              '<span class="min-w-0 flex items-center gap-2">' + (r.icon ? icon(r.icon, 'w-4 h-4 text-forest shrink-0') : '') +
              '<span class="truncate text-ink" title="' + esc(r.title || r.label) + '">' + esc(r.label) + '</span>' + (r.sub ? '<span class="hidden sm:inline truncate text-ink/45 text-xs">' + esc(r.sub) + '</span>' : '') + '</span>' +
              '<span class="font-semibold text-forest tabular-nums shrink-0">' + nf.format(r.value) + (r.extra ? '<span class="font-normal text-ink/45 text-xs"> ' + r.extra + '</span>' : '') + '</span></span></li>';
          }).join('') + '</ul>'
        : '<p class="mt-4 text-sm text-ink/50">' + (emptyMsg || 'Pas encore de données.') + '</p>') +
      '</section>';
  }

  function renderStats() {
    var periods = [[7, '7 jours'], [30, '30 jours'], [90, '3 mois'], [365, '12 mois']];
    var notrack = false;
    try { notrack = localStorage.getItem('elmea_notrack') === '1'; } catch (e) {}
    view.innerHTML =
      '<div class="flex flex-wrap items-end justify-between gap-4">' +
      '<div><h1 class="font-serif text-4xl text-forest font-semibold">Statistiques</h1>' +
      '<p id="statsToday" class="text-sm text-ink/60 mt-1">Fréquentation du site, sans cookie ni donnée personnelle.</p></div>' +
      '<div class="flex items-center gap-2"><div class="flex bg-white rounded-full p-1 shadow-soft" role="group" aria-label="Période">' +
      periods.map(function (p) {
        var on = p[0] === state.days;
        return '<button type="button" data-days="' + p[0] + '" aria-pressed="' + on + '" class="px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition ' + (on ? 'bg-forest text-cream' : 'text-forest hover:text-terra') + '">' + p[1] + '</button>';
      }).join('') + '</div>' +
      '<button type="button" id="statsRefresh" class="w-10 h-10 rounded-full bg-white shadow-soft text-forest hover:text-terra flex items-center justify-center" aria-label="Actualiser">' + icon('refresh-cw') + '</button></div></div>' +
      '<div id="statsBody" class="mt-8 transition-opacity"><p class="text-ink/50 text-sm">Chargement des statistiques…</p></div>' +
      '<label class="mt-10 flex items-start gap-3 text-sm text-ink/65 max-w-xl"><input type="checkbox" id="notrack" class="mt-0.5 w-4 h-4 accent-[#B5634B]"' + (notrack ? ' checked' : '') + '>' +
      '<span>Ne pas compter mes propres visites depuis cet appareil (activé automatiquement à la connexion).</span></label>';

    $$('[data-days]', view).forEach(function (b) {
      b.addEventListener('click', function () { state.days = Number(b.getAttribute('data-days')); renderStats(); });
    });
    $('#statsRefresh').addEventListener('click', loadStats);
    $('#notrack').addEventListener('change', function () {
      try { this.checked ? localStorage.setItem('elmea_notrack', '1') : localStorage.removeItem('elmea_notrack'); } catch (e) {}
      toast(this.checked ? 'Vos visites ne seront plus comptées sur cet appareil.' : 'Vos visites seront de nouveau comptées.');
    });
    if (!state.posts) api('/posts').then(function (d) { state.posts = d.posts; }).catch(function () {});
    loadStats();
  }

  function loadStats() {
    var body = $('#statsBody');
    if (!body) return;
    body.style.opacity = '.5';
    api('/stats?days=' + state.days).then(function (s) {
      if (!$('#statsBody')) return;
      body.style.opacity = '1';
      $('#statsToday').innerHTML = 'Aujourd’hui : <strong class="text-forest">' + nf.format(s.todayStats.v) + '</strong> visite' + (s.todayStats.v > 1 ? 's' : '') +
        ' · <strong class="text-forest">' + nf.format(s.todayStats.pv) + '</strong> page' + (s.todayStats.pv > 1 ? 's' : '') + ' vue' + (s.todayStats.pv > 1 ? 's' : '') + '. Mesure sans cookie ni donnée personnelle.';
      var t = s.totals, p = s.previous;
      var ppv = t.v ? (t.pv / t.v).toFixed(1).replace('.', ',') : '0';
      var pppv = p.v ? p.pv / p.v : 0;
      var empty = !t.pv;

      var events = Object.keys(EVENT_LABELS).map(function (k) {
        return { label: EVENT_LABELS[k][0], icon: EVENT_LABELS[k][1], value: s.events[k] || 0 };
      }).filter(function (r) { return r.value; });

      body.innerHTML =
        (empty ? '<div class="card p-6 mb-6 flex gap-4 items-start bg-terra-soft/40">' + icon('circle-alert', 'w-5 h-5 text-terra shrink-0 mt-0.5') +
          '<p class="text-sm text-ink/75">Aucune visite enregistrée sur cette période pour l’instant. Les chiffres apparaîtront dès les premières visites du site (vos propres visites ne sont pas comptées).</p></div>' : '') +
        '<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">' +
        kpi('Visites', nf.format(t.v), delta(t.v, p.v), 'users') +
        kpi('Pages vues', nf.format(t.pv), delta(t.pv, p.pv), 'file-text') +
        kpi('Pages par visite', ppv, delta(t.v ? t.pv / t.v : 0, pppv), 'layers') +
        kpi('Prises de contact', nf.format(t.contacts), delta(t.contacts, p.contacts), 'mouse-pointer-click') +
        '</div>' +
        '<section class="card p-6 mt-6"><div class="flex flex-wrap items-baseline justify-between gap-2">' +
        '<h2 class="font-semibold text-forest">' + (state.days > 90 ? 'Visites par semaine' : 'Visites par jour') + '</h2>' +
        '<p class="text-xs text-ink/50">Survolez une barre pour le détail</p></div>' +
        '<div id="chart" class="relative mt-4 h-64 select-none"></div>' +
        '<details class="mt-4 text-sm"><summary class="text-terra font-medium">Voir les données en tableau</summary><div id="chartTable" class="mt-3 max-h-72 overflow-auto"></div></details>' +
        '</section>' +
        '<div class="grid lg:grid-cols-2 gap-6 mt-6">' +
        listCard('Pages les plus consultées', 'file-text', s.pages.map(function (r) { return { label: pageLabel(r.path), sub: r.path, title: r.path, value: r.pv, extra: 'vues' }; })) +
        listCard('Prises de contact & réseaux', 'mouse-pointer-click', events, 'Aucun clic sur WhatsApp, téléphone, email ou formulaire pour l’instant.') +
        listCard('Provenance des visiteurs', 'globe', s.sources.map(function (r) { return { label: r.ref || 'Accès direct', value: r.v, extra: 'visites' }; })) +
        listCard('Appareils', 'smartphone', s.devices.map(function (r) { var d = DEVICE_LABELS[r.device] || [r.device, 'monitor']; return { label: d[0], icon: d[1], value: r.v, extra: 'visites' }; })) +
        listCard('Pays', 'globe', s.countries.map(function (r) { return { label: countryName(r.country), value: r.v, extra: 'visites' }; })) +
        '</div>';

      var series = s.series;
      if (state.days > 90) series = weekly(series);
      drawChart(series, state.days > 90);
    }).catch(function (e) {
      if (e.status === 401) return;
      body.style.opacity = '1';
      body.innerHTML = '<div class="card p-6 text-sm text-red-700">Impossible de charger les statistiques : ' + esc(e.message) + '</div>';
    });
  }

  function weekly(series) {
    var out = [];
    for (var i = 0; i < series.length; i += 7) {
      var chunk = series.slice(i, i + 7);
      out.push({
        day: chunk[0].day, end: chunk[chunk.length - 1].day,
        v: chunk.reduce(function (a, b) { return a + b.v; }, 0), pv: chunk.reduce(function (a, b) { return a + b.pv; }, 0)
      });
    }
    return out;
  }

  /* Histogramme SVG : une série (visites), info-bulle au survol / au clavier */
  var chartData = null;
  function drawChart(series, isWeekly) {
    chartData = { series: series, weekly: isWeekly };
    var el = $('#chart');
    if (!el) return;
    var W = el.clientWidth || 600, H = el.clientHeight || 256;
    var padL = 36, padB = 26, padT = 8;
    var max = Math.max.apply(null, series.map(function (d) { return d.v; }).concat([1]));
    var step = Math.pow(10, Math.floor(Math.log10(max)));
    var nice = [1, 2, 2.5, 5, 10].map(function (m) { return m * step; }).filter(function (v) { return v * 4 >= max; })[0] || max;
    var top = Math.ceil(max / nice) * nice;
    if (top < 4) top = 4;
    var ticks = 4;
    var plotW = W - padL, plotH = H - padB - padT;
    var n = series.length;
    var slot = plotW / n;
    var gap = Math.min(4, Math.max(1, slot * 0.25));
    var bw = Math.max(1, slot - gap);
    var y = function (v) { return padT + plotH - v / top * plotH; };
    var svg = '<svg width="' + W + '" height="' + H + '" role="img" aria-label="Histogramme des visites">';
    for (var i = 0; i <= ticks; i++) {
      var v = Math.round(top / ticks * i), yy = Math.round(y(v)) + 0.5;
      svg += '<line x1="' + padL + '" x2="' + W + '" y1="' + yy + '" y2="' + yy + '" stroke="#1F3A2E" stroke-opacity="' + (i === 0 ? '.25' : '.08') + '"/>' +
        '<text x="' + (padL - 8) + '" y="' + (yy + 4) + '" text-anchor="end" font-size="11" fill="#2E3330" fill-opacity=".55">' + nf.format(v) + '</text>';
    }
    var every = Math.ceil(n / Math.max(2, Math.floor(plotW / 70)));
    series.forEach(function (d, i) {
      var x = padL + i * slot + gap / 2, h = Math.max(0, y(0) - y(d.v));
      var r = Math.min(4, bw / 2, h);
      if (h > 0) {
        svg += '<path data-i="' + i + '" class="bar" fill="#B5634B" d="M' + x + ',' + y(0) + 'V' + (y(d.v) + r) + 'Q' + x + ',' + y(d.v) + ' ' + (x + r) + ',' + y(d.v) +
          'H' + (x + bw - r) + 'Q' + (x + bw) + ',' + y(d.v) + ' ' + (x + bw) + ',' + (y(d.v) + r) + 'V' + y(0) + 'Z"/>';
      }
      if (i % every === 0 || i === n - 1 && n < 15) {
        svg += '<text x="' + (x + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="11" fill="#2E3330" fill-opacity=".55">' +
          fmtDay(d.day, { day: 'numeric', month: 'short' }) + '</text>';
      }
    });
    svg += '<rect id="chartHit" x="' + padL + '" y="0" width="' + plotW + '" height="' + (H - padB) + '" fill="transparent" tabindex="0" aria-label="Parcourir les valeurs avec les flèches"/>';
    svg += '</svg><div id="chartTip" class="hidden absolute pointer-events-none bg-white rounded-xl shadow-soft border border-forest/10 px-3 py-2 text-xs whitespace-nowrap"></div>';
    el.innerHTML = svg;

    var tip = $('#chartTip'), hit = $('#chartHit'), cur = -1;
    var label = function (d) {
      return isWeekly ? 'Semaine du ' + fmtDay(d.day, { day: 'numeric', month: 'short' }) + ' au ' + fmtDay(d.end, { day: 'numeric', month: 'short' }) : fmtDay(d.day, { weekday: 'long', day: 'numeric', month: 'long' });
    };
    var showTip = function (i) {
      cur = Math.max(0, Math.min(n - 1, i));
      var d = series[cur];
      $$('.bar', el).forEach(function (b) { b.setAttribute('fill', Number(b.getAttribute('data-i')) === cur ? '#D08B73' : '#B5634B'); });
      tip.innerHTML = '<p class="text-ink/55">' + esc(label(d)) + '</p><p class="mt-1"><strong class="text-forest text-sm">' + nf.format(d.v) + '</strong> visite' + (d.v > 1 ? 's' : '') + '</p><p class="text-ink/60">' + nf.format(d.pv) + ' page' + (d.pv > 1 ? 's' : '') + ' vue' + (d.pv > 1 ? 's' : '') + '</p>';
      tip.classList.remove('hidden');
      var cx = padL + cur * slot + slot / 2;
      var tw = tip.offsetWidth;
      tip.style.left = Math.max(0, Math.min(W - tw, cx - tw / 2)) + 'px';
      tip.style.top = Math.max(0, y(d.v) - tip.offsetHeight - 10) + 'px';
    };
    var hideTip = function () { tip.classList.add('hidden'); $$('.bar', el).forEach(function (b) { b.setAttribute('fill', '#B5634B'); }); };
    hit.addEventListener('pointermove', function (e) {
      var rect = el.getBoundingClientRect();
      showTip(Math.floor((e.clientX - rect.left - padL) / slot));
    });
    hit.addEventListener('pointerleave', hideTip);
    hit.addEventListener('blur', hideTip);
    hit.addEventListener('focus', function () { showTip(cur < 0 ? n - 1 : cur); });
    hit.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); showTip(cur - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); showTip(cur + 1); }
    });

    var tbl = $('#chartTable');
    if (tbl) {
      tbl.innerHTML = '<table class="w-full text-left"><thead class="text-ink/55"><tr><th class="py-1.5 font-medium">' + (isWeekly ? 'Semaine du' : 'Jour') + '</th><th class="py-1.5 font-medium text-right">Visites</th><th class="py-1.5 font-medium text-right">Pages vues</th></tr></thead><tbody>' +
        series.slice().reverse().map(function (d) {
          return '<tr class="border-t border-forest/5"><td class="py-1.5">' + esc(fmtDay(d.day)) + '</td><td class="py-1.5 text-right tabular-nums">' + nf.format(d.v) + '</td><td class="py-1.5 text-right tabular-nums">' + nf.format(d.pv) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }
  }
  var rz;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () { if (chartData && $('#chart')) drawChart(chartData.series, chartData.weekly); }, 150);
  });

  /* ==========================================================
     ARTICLES – liste
     ========================================================== */
  function renderPosts() {
    view.innerHTML =
      '<div class="flex flex-wrap items-end justify-between gap-4">' +
      '<div><h1 class="font-serif text-4xl text-forest font-semibold">Articles du blog</h1><p id="postsCount" class="text-sm text-ink/60 mt-1">&nbsp;</p></div>' +
      '<a href="#articles/nouveau" class="btn-primary !py-3">' + icon('plus') + ' Nouvel article</a></div>' +
      '<div class="mt-6 relative max-w-md"><span class="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40">' + icon('search') + '</span>' +
      '<input id="postSearch" type="search" placeholder="Rechercher un article…" class="field !pl-11 bg-white"></div>' +
      '<div id="postsList" class="mt-6 space-y-3"><p class="text-sm text-ink/50">Chargement…</p></div>';

    var draw = function () {
      var q = ($('#postSearch').value || '').toLowerCase();
      var list = state.posts.filter(function (p) { return !q || (p.title + ' ' + p.cat).toLowerCase().indexOf(q) >= 0; });
      var pub = state.posts.filter(function (p) { return p.status === 'published'; }).length;
      $('#postsCount').textContent = pub + ' publié' + (pub > 1 ? 's' : '') + ' · ' + (state.posts.length - pub) + ' brouillon' + (state.posts.length - pub > 1 ? 's' : '');
      $('#postsList').innerHTML = list.length ? list.map(function (p) {
        var draft = p.status !== 'published';
        return '<article class="card p-4 sm:p-5 flex gap-4 items-center">' +
          '<div class="hidden sm:block w-28 h-20 rounded-xl overflow-hidden img-fallback shrink-0">' + (p.image ? '<img src="' + esc(thumbUrl(p.image)) + '" alt="" class="w-full h-full object-cover" loading="lazy" data-fallback>' : '') + '</div>' +
          '<div class="min-w-0 flex-1">' +
          '<div class="flex flex-wrap items-center gap-2 text-xs text-ink/55">' +
          '<span class="px-2 py-0.5 rounded-full font-semibold ' + (draft ? 'bg-cream-dark text-ink/70' : 'bg-sage-light text-forest') + '">' + (draft ? 'Brouillon' : 'Publié') + '</span>' +
          '<span>' + esc(p.cat) + '</span><span>·</span><time>' + esc(fmtDay(p.date)) + '</time></div>' +
          '<h2 class="font-serif text-xl sm:text-2xl text-forest font-semibold mt-1 leading-snug"><a href="#articles/modifier/' + encodeURIComponent(p.slug) + '" class="hover:text-terra">' + esc(p.title) + '</a></h2></div>' +
          '<div class="flex items-center gap-1 shrink-0">' +
          (draft ? '' : '<a href="/blog/' + encodeURIComponent(p.slug) + '/" target="_blank" rel="noopener" class="w-10 h-10 rounded-full hover:bg-cream text-forest flex items-center justify-center" title="Voir sur le site" aria-label="Voir sur le site">' + icon('eye') + '</a>') +
          '<a href="#articles/modifier/' + encodeURIComponent(p.slug) + '" class="w-10 h-10 rounded-full hover:bg-cream text-forest flex items-center justify-center" title="Modifier" aria-label="Modifier">' + icon('pencil') + '</a>' +
          '<button type="button" data-del="' + esc(p.slug) + '" class="h-10 min-w-10 px-2.5 rounded-full hover:bg-red-50 text-red-600 flex items-center justify-center gap-1 text-sm" title="Supprimer" aria-label="Supprimer">' + icon('trash-2') + '</button>' +
          '</div></article>';
      }).join('') : '<div class="card p-10 text-center text-ink/60">Aucun article ne correspond.</div>';

      $$('[data-del]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (!b.getAttribute('data-confirm')) {
            b.setAttribute('data-confirm', '1');
            b.innerHTML = icon('trash-2') + '<span class="font-semibold">Confirmer ?</span>';
            b.className += ' bg-red-50';
            setTimeout(function () { if (b.isConnected && b.getAttribute('data-confirm')) { b.removeAttribute('data-confirm'); draw(); } }, 4000);
            return;
          }
          var slug = b.getAttribute('data-del');
          b.disabled = true;
          api('/posts/' + encodeURIComponent(slug), { method: 'DELETE' }).then(function () {
            state.posts = state.posts.filter(function (p) { return p.slug !== slug; });
            toast('Article supprimé.');
            draw();
          }).catch(function (e) { toast(e.message, 'err'); b.disabled = false; });
        });
      });
    };

    api('/posts').then(function (d) {
      state.posts = d.posts;
      if (!$('#postsList')) return;
      draw();
      $('#postSearch').addEventListener('input', draw);
    }).catch(function (e) {
      if (e.status !== 401 && $('#postsList')) $('#postsList').innerHTML = '<div class="card p-6 text-sm text-red-700">' + esc(e.message) + '</div>';
    });
  }

  function thumbUrl(u) { return /images\.unsplash\.com/.test(u) ? u.replace(/([?&])w=\d+/, '$1w=300') : u; }

  /* ==========================================================
     ARTICLES – éditeur
     ========================================================== */
  function slugify(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’'"]/g, '-')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/g, '');
  }

  function renderEditor(slug) {
    state.editHash = location.hash;
    view.innerHTML = '<p class="text-sm text-ink/50">Chargement…</p>';
    var load = slug ? api('/posts/' + encodeURIComponent(slug)).then(function (d) { return d.post; }) : Promise.resolve(null);
    var loadList = state.posts ? Promise.resolve() : api('/posts').then(function (d) { state.posts = d.posts; });
    Promise.all([load, loadList]).then(function (r) { buildEditor(r[0]); }).catch(function (e) {
      if (e.status !== 401) view.innerHTML = '<div class="card p-6 text-sm text-red-700">' + esc(e.message) + ' <a href="#articles" class="underline">Retour</a></div>';
    });
  }

  function buildEditor(post) {
    var isNew = !post;
    post = post || { title: '', slug: '', cat: '', date: todayStr(), image: '', excerpt: '', description: '', body: '', status: 'draft' };
    var original = post.slug;
    var slugTouched = !isNew;
    var cats = CFG.categories.concat((state.posts || []).map(function (p) { return p.cat; }))
      .filter(function (c, i, a) { return c && a.indexOf(c) === i; });

    var tb = function (cmd, ic, label, arg) {
      return '<button type="button" data-cmd="' + cmd + '"' + (arg ? ' data-arg="' + arg + '"' : '') + ' title="' + label + '" aria-label="' + label + '" class="w-9 h-9 rounded-lg text-forest hover:bg-cream flex items-center justify-center">' + icon(ic) + '</button>';
    };

    view.innerHTML =
      '<div class="flex flex-wrap items-center justify-between gap-3">' +
      '<a href="#articles" class="inline-flex items-center gap-2 text-sm text-forest hover:text-terra">' + icon('arrow-left') + ' Tous les articles</a>' +
      '<div class="flex flex-wrap items-center gap-2">' +
      '<span id="saveState" class="text-xs text-ink/50 mr-1"></span>' +
      '<button type="button" id="btnPreview" class="btn-outline !px-4 !py-2.5 text-sm">' + icon('eye') + ' Aperçu</button>' +
      '<button type="button" id="btnDraft" class="btn-outline !px-4 !py-2.5 text-sm">' + icon('save') + ' ' + (post.status === 'published' ? 'Repasser en brouillon' : 'Enregistrer le brouillon') + '</button>' +
      '<button type="button" id="btnPublish" class="btn-primary !px-5 !py-2.5 text-sm">' + icon('send') + ' ' + (post.status === 'published' ? 'Mettre à jour' : 'Publier') + '</button>' +
      '</div></div>' +

      '<div class="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 mt-6 items-start">' +
      '<div class="card p-5 sm:p-8">' +
      '<label for="fTitle" class="sr-only">Titre</label>' +
      '<textarea id="fTitle" rows="1" placeholder="Titre de l’article" class="w-full resize-none overflow-hidden font-serif text-3xl sm:text-4xl text-forest font-semibold bg-transparent border-0 p-0 focus:outline-none focus:ring-0 placeholder:text-ink/30">' + esc(post.title) + '</textarea>' +
      '<div class="mt-2 flex flex-wrap items-center gap-1 text-sm text-ink/55"><span>Adresse :</span><span>/blog/</span>' +
      '<input id="fSlug" value="' + esc(post.slug) + '" class="min-w-0 flex-1 max-w-sm bg-cream/60 rounded-md px-2 py-0.5 text-forest focus:outline-none focus:ring-2 focus:ring-terra/30" aria-label="Adresse de l’article"><span>/</span></div>' +
      '<div id="toolbar" class="sticky top-[76px] sm:top-[68px] z-10 mt-6 -mx-2 px-2 py-1.5 bg-white/95 backdrop-blur border-y border-forest/10 flex flex-wrap items-center gap-0.5" role="toolbar" aria-label="Mise en forme">' +
      tb('formatBlock', 'pilcrow', 'Paragraphe', 'p') + tb('formatBlock', 'heading-2', 'Titre de section', 'h2') + tb('formatBlock', 'heading-3', 'Sous-titre', 'h3') +
      '<span class="w-px h-6 bg-forest/10 mx-1"></span>' +
      tb('bold', 'bold', 'Gras') + tb('italic', 'italic', 'Italique') + tb('link', 'link', 'Lien') +
      '<span class="w-px h-6 bg-forest/10 mx-1"></span>' +
      tb('insertUnorderedList', 'list', 'Liste à puces') + tb('insertOrderedList', 'list-ordered', 'Liste numérotée') + tb('formatBlock', 'quote', 'Encadré / citation', 'blockquote') +
      '<span class="w-px h-6 bg-forest/10 mx-1"></span>' +
      tb('image', 'image', 'Insérer une image') + tb('removeFormat', 'remove-formatting', 'Effacer la mise en forme') +
      '</div>' +
      '<div id="editor" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Contenu de l’article" data-placeholder="Écrivez votre article ici… Utilisez « Titre de section » pour structurer le texte (bon pour Google)." class="prose-elmea editor mt-5 min-h-[420px] focus:outline-none">' + (post.body || '') + '</div>' +
      '<p id="wordCount" class="mt-6 pt-4 border-t border-forest/10 text-xs text-ink/50"></p>' +
      '</div>' +

      '<aside class="space-y-5">' +
      '<section class="card p-5"><h2 class="font-semibold text-forest text-sm">Publication</h2>' +
      '<p class="mt-2 text-sm">Statut : <strong id="statusLabel" class="' + (post.status === 'published' ? 'text-forest' : 'text-terra') + '">' + (post.status === 'published' ? 'Publié' : 'Brouillon') + '</strong></p>' +
      '<label for="fDate" class="block text-sm text-ink/70 mt-4 mb-1.5">Date de publication</label><input id="fDate" type="date" value="' + esc(post.date) + '" class="field !py-2">' +
      '<label for="fCat" class="block text-sm text-ink/70 mt-4 mb-1.5">Catégorie</label><input id="fCat" list="catList" value="' + esc(post.cat) + '" placeholder="Ex. Appels d’offres" class="field !py-2">' +
      '<datalist id="catList">' + cats.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>' +
      (post.status === 'published' && !isNew ? '<a href="/blog/' + encodeURIComponent(original) + '/" target="_blank" rel="noopener" class="mt-4 inline-flex items-center gap-1.5 text-sm text-terra hover:underline">' + icon('external-link') + ' Voir l’article en ligne</a>' : '') +
      '</section>' +

      '<section class="card p-5"><h2 class="font-semibold text-forest text-sm">Image à la une</h2>' +
      '<div id="imgPreview" class="mt-3 aspect-[16/9] rounded-xl overflow-hidden img-fallback flex items-center justify-center text-xs text-ink/50"></div>' +
      '<div class="mt-3 flex gap-2"><label class="btn-outline !px-3 !py-2 text-sm cursor-pointer flex-1">' + icon('upload') + ' Importer<input id="imgFile" type="file" accept="image/*" class="sr-only"></label>' +
      '<button type="button" id="imgRemove" class="btn-outline !px-3 !py-2 text-sm">' + icon('x') + '<span class="sr-only">Retirer l’image</span></button></div>' +
      '<p class="mt-3 text-xs text-ink/55">Ou choisissez une photo d’illustration :</p>' +
      '<div class="mt-2 grid grid-cols-4 gap-1.5">' + CFG.photos.map(function (p) {
        return '<button type="button" data-photo="' + esc(p.url) + '" title="' + esc(p.label) + '" class="aspect-square rounded-lg overflow-hidden img-fallback ring-offset-2 hover:ring-2 hover:ring-terra/50"><img src="' + esc(p.thumb) + '" alt="' + esc(p.label) + '" class="w-full h-full object-cover" loading="lazy" data-fallback></button>';
      }).join('') + '</div></section>' +

      '<section class="card p-5"><div class="flex items-baseline justify-between"><label for="fExcerpt" class="font-semibold text-forest text-sm">Résumé</label><span id="cExcerpt" class="text-xs text-ink/45"></span></div>' +
      '<p class="text-xs text-ink/55 mt-1">Affiché sur les cartes du blog et en introduction. Laissez vide pour le générer automatiquement.</p>' +
      '<textarea id="fExcerpt" rows="4" maxlength="300" class="field mt-2 text-sm">' + esc(post.excerpt) + '</textarea></section>' +

      '<section class="card p-5"><div class="flex items-baseline justify-between"><label for="fDesc" class="font-semibold text-forest text-sm">Référencement Google</label><span id="cDesc" class="text-xs text-ink/45"></span></div>' +
      '<p class="text-xs text-ink/55 mt-1">Description affichée dans les résultats de recherche (idéalement 120 à 160 caractères).</p>' +
      '<textarea id="fDesc" rows="3" maxlength="170" class="field mt-2 text-sm">' + esc(post.description) + '</textarea>' +
      '<div class="mt-3 rounded-xl border border-forest/10 p-3 bg-white"><p class="text-[11px] text-ink/50 truncate" id="gUrl"></p><p class="text-[15px] text-[#1a0dab] leading-snug mt-0.5 line-clamp-2" id="gTitle"></p><p class="text-xs text-ink/70 mt-1 line-clamp-3" id="gDesc"></p></div>' +
      '</section>' +
      '</aside></div>';

    var ed = $('#editor'), fTitle = $('#fTitle'), fSlug = $('#fSlug'), fExcerpt = $('#fExcerpt'), fDesc = $('#fDesc');
    var image = post.image || '';
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) {}
    if (!ed.innerHTML.trim()) ed.innerHTML = '<p><br></p>';

    var setDirty = function (v) { state.dirty = v; $('#saveState').textContent = v ? 'Modifications non enregistrées' : ''; };
    var autoSize = function () { fTitle.style.height = 'auto'; fTitle.style.height = fTitle.scrollHeight + 'px'; };
    var plain = function () { return ed.innerText.replace(/\s+/g, ' ').trim(); };
    var refresh = function () {
      ed.setAttribute('data-empty', plain() || ed.querySelector('img,li') ? 'false' : 'true');
      var words = plain().split(' ').filter(Boolean).length;
      $('#wordCount').textContent = nf.format(words) + ' mot' + (words > 1 ? 's' : '') + ' · environ ' + Math.max(1, Math.round(words / 200)) + ' min de lecture';
      $('#cExcerpt').textContent = fExcerpt.value.length + ' / 300';
      var dl = fDesc.value.length;
      $('#cDesc').textContent = dl + ' / 160';
      $('#cDesc').className = 'text-xs ' + (dl > 160 ? 'text-red-600' : dl >= 120 ? 'text-forest' : 'text-ink/45');
      $('#gUrl').textContent = CFG.site.url.replace(/^https?:\/\//, '') + ' › blog › ' + (fSlug.value || slugify(fTitle.value) || '…');
      $('#gTitle').textContent = (fTitle.value || 'Titre de l’article') + ' | Élméa Solutions';
      $('#gDesc').textContent = fDesc.value || fExcerpt.value || plain().slice(0, 160) || 'La description apparaîtra ici.';
    };
    var drawImage = function () {
      $('#imgPreview').innerHTML = image ? '<img src="' + esc(image) + '" alt="" class="w-full h-full object-cover" data-fallback>' : 'Aucune image';
      $$('[data-photo]').forEach(function (b) { b.classList.toggle('ring-2', b.getAttribute('data-photo') === image); b.classList.toggle('ring-terra', b.getAttribute('data-photo') === image); });
    };
    autoSize(); refresh(); drawImage();

    fTitle.addEventListener('input', function () {
      autoSize();
      if (!slugTouched) fSlug.value = slugify(fTitle.value);
      setDirty(true); refresh();
    });
    fTitle.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); ed.focus(); } });
    fSlug.addEventListener('input', function () { slugTouched = true; setDirty(true); refresh(); });
    fSlug.addEventListener('blur', function () { fSlug.value = slugify(fSlug.value) || slugify(fTitle.value); refresh(); });
    [fExcerpt, fDesc, $('#fDate'), $('#fCat')].forEach(function (f) { f.addEventListener('input', function () { setDirty(true); refresh(); }); });
    ed.addEventListener('input', function () { setDirty(true); refresh(); });

    /* Collage : texte brut converti en paragraphes (évite la mise en forme de Word) */
    ed.addEventListener('paste', function (e) {
      var text = (e.clipboardData || window.clipboardData).getData('text/plain');
      if (!text) return;
      e.preventDefault();
      var parts = text.replace(/\r/g, '').split(/\n{2,}/).map(function (p) { return p.trim(); }).filter(Boolean);
      var htmlStr = parts.length > 1
        ? parts.map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; }).join('')
        : esc(text).replace(/\n/g, '<br>');
      document.execCommand('insertHTML', false, htmlStr);
    });

    /* Barre d'outils */
    $('#toolbar').addEventListener('mousedown', function (e) { if (e.target.closest('button')) e.preventDefault(); });
    $('#toolbar').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-cmd]');
      if (!b) return;
      var cmd = b.getAttribute('data-cmd'), arg = b.getAttribute('data-arg');
      ed.focus();
      if (cmd === 'link') {
        var url = window.prompt('Adresse du lien (https://…, ou /contact/ pour une page du site) :', 'https://');
        if (url && url !== 'https://') document.execCommand('createLink', false, url.trim());
      } else if (cmd === 'image') {
        pickFile(function (file) {
          uploadImage(file).then(function (u) { ed.focus(); document.execCommand('insertImage', false, u); setDirty(true); }).catch(function (err) { toast(err.message, 'err'); });
        });
      } else if (cmd === 'formatBlock') {
        document.execCommand('formatBlock', false, '<' + arg + '>');
      } else {
        document.execCommand(cmd, false, null);
      }
      setDirty(true); refresh();
    });

    /* Image à la une */
    $$('[data-photo]').forEach(function (b) { b.addEventListener('click', function () { image = b.getAttribute('data-photo'); drawImage(); setDirty(true); }); });
    $('#imgRemove').addEventListener('click', function () { image = ''; drawImage(); setDirty(true); });
    $('#imgFile').addEventListener('change', function () {
      var f = this.files[0]; this.value = '';
      if (!f) return;
      $('#imgPreview').innerHTML = 'Envoi en cours…';
      uploadImage(f).then(function (u) { image = u; drawImage(); setDirty(true); }).catch(function (err) { drawImage(); toast(err.message, 'err'); });
    });

    /* Enregistrement */
    var collect = function (status) {
      return {
        title: fTitle.value.trim(), slug: slugify(fSlug.value) || slugify(fTitle.value), cat: $('#fCat').value.trim(), date: $('#fDate').value,
        image: image, excerpt: fExcerpt.value.trim(), description: fDesc.value.trim(), body: ed.innerHTML, status: status
      };
    };
    var save = function (status) {
      var data = collect(status);
      if (data.title.length < 5) { toast('Ajoutez un titre (5 caractères minimum).', 'err'); fTitle.focus(); return; }
      if (plain().length < 30) { toast('Le contenu de l’article est trop court.', 'err'); ed.focus(); return; }
      var btns = [$('#btnDraft'), $('#btnPublish')];
      btns.forEach(function (b) { b.disabled = true; });
      var req = isNew ? api('/posts', { method: 'POST', body: data }) : api('/posts/' + encodeURIComponent(original), { method: 'PUT', body: data });
      req.then(function (d) {
        setDirty(false);
        state.posts = null;
        toast(status === 'published' ? 'Article publié sur le site.' : 'Brouillon enregistré.');
        var hash = '#articles/modifier/' + encodeURIComponent(d.post.slug);
        if (location.hash !== hash) { state.dirty = false; location.hash = hash; }
        else renderEditor(d.post.slug);
      }).catch(function (err) {
        toast(err.message, 'err');
        btns.forEach(function (b) { b.disabled = false; });
      });
    };
    $('#btnDraft').addEventListener('click', function () { save('draft'); });
    $('#btnPublish').addEventListener('click', function () { save('published'); });
    $('#btnPreview').addEventListener('click', function () { preview(collect(post.status)); });
    document.addEventListener('keydown', function onKey(e) {
      if (!$('#editor')) { document.removeEventListener('keydown', onKey); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(post.status === 'published' ? 'published' : 'draft'); }
    });
    setDirty(false);
    if (isNew) fTitle.focus();
  }

  function pickFile(cb) {
    var i = document.createElement('input');
    i.type = 'file'; i.accept = 'image/*';
    i.addEventListener('change', function () { if (i.files[0]) cb(i.files[0]); });
    i.click();
  }

  /* Redimensionne (1600 px max) et compresse l'image avant l'envoi */
  function uploadImage(file) {
    if (!/^image\//.test(file.type)) return Promise.reject(new Error('Ce fichier n’est pas une image.'));
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var max = 1600, r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        var c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * r); c.height = Math.round(img.naturalHeight * r);
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        var qs = [0.85, 0.75, 0.65, 0.5];
        (function next(i) {
          c.toBlob(function (blob) {
            if (!blob) return reject(new Error('Impossible de lire cette image.'));
            if (blob.size > 1300 * 1024 && i < qs.length - 1) return next(i + 1);
            resolve(blob);
          }, 'image/jpeg', qs[i]);
        })(0);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Format d’image non pris en charge (utilisez JPEG ou PNG).')); };
      img.src = url;
    }).then(function (blob) {
      toast('Envoi de l’image…');
      return api('/media', { method: 'POST', blob: blob });
    }).then(function (d) { toast('Image ajoutée.'); return d.url; });
  }

  /* Aperçu fidèle à la mise en page du site */
  function preview(d) {
    var wrap = document.createElement('div');
    wrap.className = 'fixed inset-0 z-50 bg-cream overflow-y-auto';
    wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', 'Aperçu de l’article');
    wrap.innerHTML =
      '<div class="sticky top-0 z-10 bg-forest text-cream"><div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">' +
      '<p class="text-sm flex items-center gap-2">' + icon('eye') + ' Aperçu – voici l’article tel qu’il apparaîtra sur le site</p>' +
      '<button type="button" class="px-4 py-2 rounded-full bg-cream text-forest text-sm font-medium inline-flex items-center gap-1.5" data-close>' + icon('x') + ' Fermer</button></div></div>' +
      '<article class="pb-20"><header class="max-w-3xl mx-auto px-4 sm:px-6 pt-10">' +
      '<div class="flex flex-wrap items-center gap-3 text-sm text-ink/60"><span class="px-3 py-1 rounded-full bg-terra-soft text-terra font-medium">' + esc(d.cat || 'Actualités') + '</span><span>' + esc(fmtDay(d.date || todayStr())) + '</span></div>' +
      '<h1 class="font-serif text-4xl sm:text-5xl text-forest font-semibold mt-4 leading-tight">' + esc(d.title || 'Titre de l’article') + '</h1>' +
      (d.excerpt ? '<p class="mt-5 text-lg text-ink/75 leading-relaxed">' + esc(d.excerpt) + '</p>' : '') + '</header>' +
      (d.image ? '<div class="max-w-5xl mx-auto px-4 sm:px-6 mt-10"><div class="aspect-[16/8] rounded-[2rem] overflow-hidden shadow-soft img-fallback"><img src="' + esc(d.image) + '" alt="" class="w-full h-full object-cover"></div></div>' : '') +
      '<div class="max-w-3xl mx-auto px-4 sm:px-6 py-14"><div class="prose-elmea" id="pvBody"></div></div></article>';
    document.body.appendChild(wrap);
    $('#pvBody', wrap).innerHTML = d.body;
    $$('#pvBody script, #pvBody iframe', wrap).forEach(function (n) { n.remove(); });
    document.body.style.overflow = 'hidden';
    var close = function () { wrap.remove(); document.body.style.overflow = ''; document.removeEventListener('keydown', onEsc); };
    var onEsc = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onEsc);
    $('[data-close]', wrap).addEventListener('click', close);
    $('[data-close]', wrap).focus();
  }

  boot();
})();
