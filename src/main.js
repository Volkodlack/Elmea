/* ==========================================================
   Élméa Solutions – scripts du site (aucune dépendance)
   ========================================================== */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  /* ---------- Menu mobile ---------- */
  var menuBtn = $('#menuBtn'), mobileMenu = $('#mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('hidden') === false;
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.add('hidden'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus();
      }
    });
  }

  /* ---------- Apparition au défilement ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Mesure d'audience (interne, sans cookie) ---------- */
  var send = function () {};
  (function () {
    var off = false;
    try { off = localStorage.getItem('elmea_notrack') === '1'; } catch (e) {}
    if (off || location.pathname.indexOf('/admin') === 0 || location.protocol === 'file:') return;
    send = function (o) {
      var body = JSON.stringify(o);
      try {
        if (navigator.sendBeacon && navigator.sendBeacon('/api/track', body)) return;
        fetch('/api/track', { method: 'POST', body: body, keepalive: true }).catch(function () {});
      } catch (e) {}
    };
    var q = new URLSearchParams(location.search);
    send({ t: 'pv', p: location.pathname, r: document.referrer, w: window.innerWidth, s: q.get('utm_source') || '' });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var h = a.getAttribute('href') || '';
      var n = h.indexOf('https://wa.me') === 0 ? 'whatsapp'
        : h.indexOf('tel:') === 0 ? 'telephone'
        : h.indexOf('mailto:') === 0 ? 'email'
        : /facebook\.com/.test(h) ? 'facebook'
        : /instagram\.com/.test(h) ? 'instagram' : '';
      if (n) send({ t: 'ev', n: n, p: location.pathname });
    });
  })();

  /* ---------- Fil Facebook (chargé uniquement avec l'accord du visiteur) ---------- */
  var fb = $('#fbFeed');
  if (fb) {
    var loadFb = function () {
      if (fb.getAttribute('data-loaded')) return;
      fb.setAttribute('data-loaded', '1');
      var w = Math.max(280, Math.min(500, Math.floor(fb.clientWidth)));
      var src = 'https://www.facebook.com/plugins/page.php?href=' + encodeURIComponent(fb.getAttribute('data-href')) +
        '&tabs=timeline&width=' + w + '&height=640&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=false&locale=fr_FR';
      fb.innerHTML = '';
      var f = document.createElement('iframe');
      f.src = src; f.width = w; f.height = 640; f.title = 'Publications Facebook d’Élméa Solutions';
      f.style.border = 'none'; f.style.overflow = 'hidden'; f.style.display = 'block'; f.style.margin = '0 auto';
      f.setAttribute('scrolling', 'no'); f.setAttribute('allow', 'encrypted-media; clipboard-write; web-share'); f.loading = 'lazy';
      fb.appendChild(f);
    };
    var btnFb = $('#fbLoad');
    if (btnFb) btnFb.addEventListener('click', function () {
      try { localStorage.setItem('elmea_fb', '1'); } catch (e) {}
      loadFb();
    });
    var ok = false;
    try { ok = localStorage.getItem('elmea_fb') === '1'; } catch (e) {}
    if (ok) {
      if ('IntersectionObserver' in window) {
        var fio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { fio.disconnect(); loadFb(); } }, { rootMargin: '300px' });
        fio.observe(fb);
      } else loadFb();
    }
  }

  /* ---------- Filtres du blog ---------- */
  var filters = $('#blogFilters');
  if (filters) {
    var cards = $$('[data-cat]', $('#blogGrid'));
    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      var cat = btn.getAttribute('data-filter');
      $$('button[data-filter]', filters).forEach(function (b) {
        var on = b === btn;
        b.setAttribute('aria-pressed', String(on));
        b.className = 'px-4 py-2 rounded-full text-sm border transition ' +
          (on ? 'bg-forest text-cream border-forest' : 'border-forest/15 text-forest hover:border-terra hover:text-terra');
      });
      cards.forEach(function (c) { c.hidden = !(cat === 'Tous' || c.getAttribute('data-cat') === cat); });
    });
  }

  /* ---------- Formulaire de contact ---------- */
  var form = $('#contactForm');
  if (form) {
    // Pré-sélection du service via ?service=...
    var params = new URLSearchParams(location.search);
    var svc = params.get('service');
    if (svc) {
      var sel = $('#service');
      $$('option', sel).forEach(function (o) { if (o.value === svc) sel.value = svc; });
    }

    var validators = {
      nom: function (v) { return v.trim().length >= 2; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      telephone: function (v) { return /^(?:(?:\+|00)33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/.test(v.trim()); },
      service: function (v) { return v !== ''; },
      message: function (v) { return v.trim().length >= 10; }
    };
    var check = function (name) {
      var el = form.elements[name], ok = validators[name](el.value);
      var err = $('#err-' + name);
      el.classList.toggle('border-red-400', !ok);
      el.setAttribute('aria-invalid', String(!ok));
      if (err) err.classList.toggle('hidden', ok);
      return ok;
    };
    Object.keys(validators).forEach(function (n) {
      form.elements[n].addEventListener('blur', function () { check(n); });
    });

    var status = $('#formStatus');
    var showStatus = function (type, html) {
      status.className = 'rounded-xl p-4 text-sm ' + (type === 'ok' ? 'bg-sage-light text-forest' : 'bg-red-50 text-red-700');
      status.innerHTML = html;
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.elements.botcheck && form.elements.botcheck.value) return; // robot
      var valid = Object.keys(validators).map(check).every(Boolean);
      var rgpd = form.elements.rgpd.checked;
      $('#err-rgpd').classList.toggle('hidden', rgpd);
      if (!valid || !rgpd) {
        showStatus('err', 'Merci de vérifier les champs indiqués.');
        var firstBad = $('[aria-invalid="true"]', form); if (firstBad) firstBad.focus();
        return;
      }

      send({ t: 'ev', n: 'formulaire', p: location.pathname });
      var endpoint = form.getAttribute('data-endpoint');
      var email = form.getAttribute('data-email');
      var data = {};
      ['nom', 'societe', 'email', 'telephone', 'service', 'message'].forEach(function (n) { data[n] = form.elements[n].value.trim(); });
      var subject = 'Demande de devis – ' + data.service;

      if (!endpoint) {
        // Repli : ouverture de la messagerie avec la demande pré-remplie
        var body = 'Nom : ' + data.nom + '\nEntreprise : ' + (data.societe || '-') + '\nEmail : ' + data.email +
          '\nTéléphone : ' + data.telephone + '\nService : ' + data.service + '\n\nMessage :\n' + data.message;
        location.href = 'mailto:' + email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        showStatus('ok', '<strong>Votre messagerie s’est ouverte</strong> avec votre demande pré-remplie : il ne reste qu’à cliquer sur Envoyer.');
        return;
      }

      var btn = $('#submitBtn'), label = $('span', btn);
      btn.disabled = true; label.textContent = 'Envoi en cours…';
      var payload = Object.assign({}, data, { subject: subject, from_name: 'Site Élméa Solutions' });
      var key = form.elements.access_key; if (key) payload.access_key = key.value;

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        location.href = form.getAttribute('data-success') || '/merci/';
      }).catch(function () {
        showStatus('err', 'Oups, l’envoi a échoué. Appelez-moi au <a class="underline" href="tel:+33632246311">06 32 24 63 11</a> ou écrivez à <a class="underline" href="mailto:' + email + '">' + email + '</a>.');
        btn.disabled = false; label.textContent = 'Envoyer ma demande';
      });
    });
  }

  /* ---------- Retour en haut ---------- */
  var toTop = $('#toTop');
  if (toTop) {
    window.addEventListener('scroll', function () {
      var show = window.scrollY > 700;
      toTop.classList.toggle('hidden', !show);
      toTop.classList.toggle('flex', show);
    }, { passive: true });
    toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }
})();
