/* ============================================================================
 * sections.js — page behaviour
 * ----------------------------------------------------------------------------
 * Every section, the menu, the modals and the footer are plain markup in
 * index.html now. This file no longer builds anything; it only makes the page
 * behave:
 *
 *   1. phone menu      open / close the menu button
 *   2. logo            click to return to the top
 *   3. anchors         ease a menu click down to its section
 *   4. modals          a link to #project-x opens #modal-project-x
 *   5. news rail       arrow buttons, and hiding them when nothing overflows
 *   6. blog            fill the blog list from /content/blog.json
 *   7. footer video    retry playback where autoplay is blocked
 *   8. reveal          drift elements in the first time they scroll into view
 *
 * To change wording or add a card, edit index.html — not this file.
 * ========================================================================== */

(function () {
  'use strict';

  /* How long an in-page jump takes, in milliseconds. Lower is snappier. */
  var SCROLL_MS = 480;
  /* The fixed header covers the top of the page, so a section is parked below
     the viewport top rather than flush against it. The bar is shorter on a
     phone, so the gap follows its height instead of being fixed. */
  var HEADER_OFFSET_MAX = 90;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function reduceMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ------------------------------------------------------------------ *
   * 3. Anchor scrolling
   * ------------------------------------------------------------------ *
   * Native `behavior: smooth` cannot be tuned, and on a page this tall it
   * crawls. This runs the scroll itself so the jump stays smooth but lands
   * quickly, and it gives way entirely to prefers-reduced-motion.
   * ------------------------------------------------------------------ */

  var scrollRAF = 0;

  /* Fast at the start, settling gently at the end. */
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function clamp(y) {
    var max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.min(Math.max(0, y), max);
  }

  /* `aim` is a function rather than a number because images further down the
     page are still loading while the scroll runs. Re-asking for the target on
     every frame means the landing stays correct even when the page grows
     underneath it. */
  function scrollToY(aim) {
    if (scrollRAF) { cancelAnimationFrame(scrollRAF); scrollRAF = 0; }
    if (typeof aim !== 'function') { var fixed = aim; aim = function () { return fixed; }; }

    var start = window.pageYOffset;
    var end = clamp(aim());
    var dist = end - start;

    if (reduceMotion() || Math.abs(dist) < 2) { window.scrollTo(0, end); return; }

    var t0 = performance.now();
    /* A short hop should not take as long as a full-page one, so the duration
       grows with the distance up to the cap. */
    var ms = Math.min(SCROLL_MS, 180 + Math.abs(dist) * 0.12);

    (function step(now) {
      var t = Math.min(1, (now - t0) / ms);
      var target = clamp(aim());
      window.scrollTo(0, start + (target - start) * easeOut(t));
      scrollRAF = t < 1 ? requestAnimationFrame(step) : 0;
    })(t0);

    /* A wheel or touch during the animation means the visitor took over. */
    var stop = function () {
      if (scrollRAF) { cancelAnimationFrame(scrollRAF); scrollRAF = 0; }
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
    };
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
  }

  function headerOffset() {
    var header = $('.header-main');
    if (!header) return 24;
    return Math.min(header.offsetHeight * 0.45, HEADER_OFFSET_MAX);
  }

  function scrollToId(id) {
    if (id === 'top') { scrollToY(0); return true; }
    var target = document.getElementById(id);
    if (!target) return false;
    scrollToY(function () {
      return target.getBoundingClientRect().top + window.pageYOffset - headerOffset();
    });
    return true;
  }

  /* ------------------------------------------------------------------ *
   * 1. Phone menu
   * ------------------------------------------------------------------ */

  function closeMenu() {
    var header = $('.header-main');
    if (!header || !header.classList.contains('x-nav-open')) return;
    header.classList.remove('x-nav-open');
    var toggle = $('.x-nav-toggle', header);
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
    }
  }

  function wireMenu() {
    var header = $('.header-main');
    var toggle = header && $('.x-nav-toggle', header);
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var open = header.classList.toggle('x-nav-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
  }

  /* ------------------------------------------------------------------ *
   * 2. Logo returns to the top
   * ------------------------------------------------------------------ */

  function wireLogo() {
    var logo = $('.header-main .header-logo');
    if (!logo) return;
    logo.addEventListener('click', function () { scrollToY(0); });
    logo.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollToY(0); }
    });
  }

  /* ------------------------------------------------------------------ *
   * 4. Project modals
   * ------------------------------------------------------------------ */

  var openModalId = null;
  var lastFocus = null;

  function openModal(id) {
    var overlay = document.getElementById('modal-' + id);
    if (!overlay) return false;
    lastFocus = document.activeElement;
    openModalId = id;
    overlay.hidden = false;
    document.documentElement.classList.add('x-modal-lock');
    requestAnimationFrame(function () {
      overlay.classList.add('is-open');
      var dialog = $('.x-modal-dialog', overlay);
      if (dialog) { dialog.scrollTop = 0; dialog.focus(); }
    });
    return true;
  }

  function closeModal() {
    if (!openModalId) return;
    var overlay = document.getElementById('modal-' + openModalId);
    openModalId = null;
    document.documentElement.classList.remove('x-modal-lock');
    if (!overlay) return;
    overlay.classList.remove('is-open');
    window.setTimeout(function () { overlay.hidden = true; }, 220);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function wireModals() {
    $$('.x-modal').forEach(function (overlay) {
      var close = $('.x-modal-close', overlay);
      if (close) close.addEventListener('click', closeModal);
      /* mousedown, not click: a drag that starts inside the dialog and ends on
         the backdrop should not count as clicking away. */
      overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) closeModal(); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && openModalId) closeModal();
    });
  }

  /* ------------------------------------------------------------------ *
   * One handler for every in-page link
   * ------------------------------------------------------------------ *
   * A link whose href is #something either opens the matching modal or eases
   * down to the matching section. #token is the odd one out: the token page
   * is its own file.
   * ------------------------------------------------------------------ */

  function wireAnchors() {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var link = e.target.closest ? e.target.closest('a[href]') : null;
      if (!link) return;

      var href = link.getAttribute('href') || '';
      if (href.charAt(0) !== '#' || href === '#') return;
      var id = href.slice(1);

      closeMenu();

      if (id === 'token') { e.preventDefault(); location.href = 'token.html'; return; }

      if (document.getElementById('modal-' + id)) {
        e.preventDefault();
        openModal(id);
        return;
      }

      if (scrollToId(id)) {
        e.preventDefault();
        /* Keep the address bar in step without letting it re-jump the page. */
        if (window.history && window.history.replaceState) window.history.replaceState(null, '', href);
      }
    });
  }

  /* A link arriving from another page (token.html#news) lands before the
     fonts settle, so re-aim once the layout has stopped moving. */
  function openingHash() {
    var id = (location.hash || '').slice(1);
    if (!id) return;
    if (id === 'token') { location.replace('token.html'); return; }
    window.setTimeout(function () { scrollToId(id); }, 120);
  }

  /* ------------------------------------------------------------------ *
   * 5. News rail
   * ------------------------------------------------------------------ */

  function wireNews() {
    var rail = $('.x-news-rail');
    if (!rail) return;
    var track = $('.x-news-track', rail);
    var prev = $('.x-news-prev', rail);
    var next = $('.x-news-next', rail);
    if (!track || !prev || !next) return;

    /* One card plus the gap between cards. */
    function step() {
      var card = track.firstElementChild;
      if (!card) return track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
      return card.getBoundingClientRect().width + gap;
    }

    /* Park the arrows level with the middle of the thumbnails, and hide them
       altogether when every card already fits. */
    function sync() {
      var thumb = $('.x-news-thumb', track);
      if (thumb) rail.style.setProperty('--news-arrow-y', (thumb.getBoundingClientRect().height / 2) + 'px');
      var max = track.scrollWidth - track.clientWidth - 2;
      var fits = max <= 0;
      rail.classList.toggle('x-news-static', fits);
      prev.disabled = fits || track.scrollLeft <= 2;
      next.disabled = fits || track.scrollLeft >= max;
    }

    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    /* Thumbnails change the card height as they load, so measure again then. */
    $$('img', track).forEach(function (im) { im.addEventListener('load', sync); });
    sync();
  }

  /* ------------------------------------------------------------------ *
   * 6. Blog list
   * ------------------------------------------------------------------ *
   * content/blog.json is refreshed from Medium by the scheduled job, so the
   * list is filled here rather than written into index.html.
   * ------------------------------------------------------------------ */

  function blogRow(post) {
    var url;
    try { url = new URL(post.url); } catch (err) { return null; }
    if (url.protocol !== 'https:' || url.hostname !== 'medium.com') return null;

    var row = document.createElement('a');
    row.className = 'x-blog-row';
    row.href = url.href;
    row.target = '_blank';
    row.rel = 'noopener noreferrer';
    row.setAttribute('data-external', '1');

    var date = document.createElement('p');
    date.className = 'x-blog-date';
    date.textContent = String(post.date || '').slice(0, 7);

    var title = document.createElement('h3');
    title.className = 'x-blog-title';
    title.textContent = post.title;

    var more = document.createElement('span');
    more.className = 'x-blog-read';
    more.textContent = 'Read the story ↗';

    row.appendChild(date);
    row.appendChild(title);
    row.appendChild(more);
    return row;
  }

  function fillBlog() {
    var list = $('.x-blog-list');
    if (!list) return;
    fetch('/content/blog.json')
      .then(function (r) { if (!r.ok) throw new Error('Blog unavailable'); return r.json(); })
      .then(function (data) {
        (data.posts || []).slice(0, 3).forEach(function (post) {
          var row = blogRow(post);
          if (row) list.appendChild(row);
        });
        watchReveal();
      })
      .catch(function () {
        var note = document.createElement('p');
        note.textContent = 'Read the latest stories on Medium.';
        list.appendChild(note);
      });
  }

  /* ------------------------------------------------------------------ *
   * 7. Footer video
   * ------------------------------------------------------------------ *
   * The markup already asks for autoplay. Some browsers refuse until the
   * element is on screen or the visitor has interacted, so retry on both and
   * let the poster stand in meanwhile.
   * ------------------------------------------------------------------ */

  function wireFooterVideo() {
    var video = $('.x-footer-video');
    if (!video) return;
    video.muted = true;
    var tryPlay = function () { var r = video.play(); if (r && r.catch) r.catch(function () {}); };
    tryPlay();
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) tryPlay(); });
      }, { threshold: 0.05 }).observe(video);
    }
    document.addEventListener('pointerdown', tryPlay, { once: true });
  }

  /* ------------------------------------------------------------------ *
   * 8. Reveal on scroll
   * ------------------------------------------------------------------ *
   * Elements drift up into place the first time they scroll into view. The
   * classes are only ever added by this file, so with scripting off the page
   * simply shows everything.
   * ------------------------------------------------------------------ */

  var REVEAL_TARGETS = [
    '.section-logoCards-card', '.x-head', '.x-eco-card', '.x-partner-role',
    '.x-partner-note', '.x-marquee-wrap', '.x-team-card', '.x-road-year', '.x-news-card',
    '.x-app-card', '.x-community-links', '.x-footer-grid', '.x-footer-bar',
    'main h1', 'main h2', 'main p'
  ].join(', ');

  var revealObserver = null;

  function watchReveal() {
    if (!window.IntersectionObserver) return;
    /* phones get the page as it is: no drift-in on scroll */
    if (reduceMotion()) return;
    if (window.matchMedia('(max-width: 767px)').matches) return;

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('x-revealed');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    }

    $$(REVEAL_TARGETS).forEach(function (node) {
      if (node.classList.contains('x-reveal') || node.closest('.x-reveal')) return;
      node.classList.add('x-reveal');
      revealObserver.observe(node);
    });
  }

  /* Safety net: nothing stays hidden if an observer callback never arrives. */
  function revealFallback() {
    window.setTimeout(function () {
      $$('.x-reveal:not(.x-revealed)').forEach(function (node) {
        if (node.getBoundingClientRect().top < window.innerHeight) node.classList.add('x-revealed');
      });
    }, 2500);
  }

  /* ------------------------------------------------------------------ *
   * Start
   * ------------------------------------------------------------------ */

  function boot() {
    wireMenu();
    wireLogo();
    wireAnchors();
    wireModals();
    wireNews();
    wireFooterVideo();
    fillBlog();
    watchReveal();
    revealFallback();
    openingHash();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
