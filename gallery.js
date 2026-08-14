(function () {
  'use strict';

  var CONFIG = {
    dir: '/images/2026-08-09-bytom/',
    count: 151
  };

  // The gallery is embedded on the Polish landing page and on the English
  // recap page for partners, so every visible string is keyed off <html lang>.
  var STRINGS = {
    pl: {
      dialog: 'Galeria zdjęć',
      thumbs: 'Miniatury',
      close: 'Zamknij (Esc)',
      prev: 'Poprzednie zdjęcie',
      next: 'Następne zdjęcie',
      photo: 'Zdjęcie ',
      alt: 'FPV Silesia Poland 2026, edycja letnia w Bytomiu — zdjęcie ',
      of: ' z '
    },
    en: {
      dialog: 'Photo gallery',
      thumbs: 'Thumbnails',
      close: 'Close (Esc)',
      prev: 'Previous photo',
      next: 'Next photo',
      photo: 'Photo ',
      alt: 'FPV Silesia Poland 2026 Summer Edition in Bytom — photo ',
      of: ' of '
    }
  };

  var T = STRINGS.pl;
  var preview = CONFIG.count;

  function pad(n) { return ('00' + n).slice(-3); }
  function fullSrc(i) { return CONFIG.dir + pad(i + 1) + '.jpeg'; }
  function thumbSrc(i) { return CONFIG.dir + 'thumb/' + pad(i + 1) + '.jpeg'; }
  function altText(i) { return T.alt + (i + 1) + T.of + CONFIG.count; }

  var grid, moreBtn;
  var overlay = null, imgEl, counterEl, stripEl, stripThumbs = [];
  var currentIndex = 0, lastFocused = null;

  /* ---------- grid ---------- */

  function buildGrid() {
    var frag = document.createDocumentFragment();

    for (var i = 0; i < CONFIG.count; i++) {
      var a = document.createElement('a');
      a.href = fullSrc(i);
      a.className =
        'group relative block aspect-square overflow-hidden rounded-lg border border-black/10 bg-neutral-100 ' +
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2';
      if (i >= preview) a.classList.add('hidden');
      a.setAttribute('data-index', i);

      var img = document.createElement('img');
      img.src = thumbSrc(i);
      img.alt = altText(i);
      img.loading = 'lazy';
      img.decoding = 'async';
      img.className =
        'w-full h-full object-cover transition duration-300 group-hover:scale-[1.04] group-hover:brightness-105';

      a.appendChild(img);
      frag.appendChild(a);
    }

    grid.appendChild(frag);

    grid.addEventListener('click', function (e) {
      var link = e.target.closest('a[data-index]');
      if (!link) return;
      e.preventDefault();
      open(parseInt(link.getAttribute('data-index'), 10));
    });
  }

  function revealAll() {
    var hidden = grid.querySelectorAll('a.hidden');
    for (var i = 0; i < hidden.length; i++) hidden[i].classList.remove('hidden');
    if (moreBtn) moreBtn.parentNode.removeChild(moreBtn);
  }

  /* ---------- lightbox ---------- */

  function createOverlay() {
    var o = document.createElement('div');
    o.className = 'lb';
    o.setAttribute('role', 'dialog');
    o.setAttribute('aria-modal', 'true');
    o.setAttribute('aria-label', T.dialog);
    o.innerHTML =
      '<div class="lb-bar">' +
        '<span class="lb-counter" aria-live="polite"></span>' +
        '<button type="button" class="lb-btn lb-close" aria-label="' + T.close + '">&times;</button>' +
      '</div>' +
      '<div class="lb-stage">' +
        '<button type="button" class="lb-btn lb-nav lb-prev" aria-label="' + T.prev + '">&#8249;</button>' +
        '<img class="lb-img" alt="" />' +
        '<button type="button" class="lb-btn lb-nav lb-next" aria-label="' + T.next + '">&#8250;</button>' +
      '</div>' +
      '<div class="lb-strip" role="tablist" aria-label="' + T.thumbs + '"></div>';

    imgEl = o.querySelector('.lb-img');
    counterEl = o.querySelector('.lb-counter');
    stripEl = o.querySelector('.lb-strip');

    o.querySelector('.lb-close').addEventListener('click', close);
    o.querySelector('.lb-prev').addEventListener('click', function () { go(-1); });
    o.querySelector('.lb-next').addEventListener('click', function () { go(1); });
    o.querySelector('.lb-stage').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) close();
    });

    buildStrip();
    bindSwipe(o);
    return o;
  }

  function buildStrip() {
    var frag = document.createDocumentFragment();
    stripThumbs = [];

    for (var i = 0; i < CONFIG.count; i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lb-thumb';
      b.setAttribute('data-index', i);
      b.setAttribute('aria-label', T.photo + (i + 1));

      var img = document.createElement('img');
      img.src = thumbSrc(i);
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';

      b.appendChild(img);
      frag.appendChild(b);
      stripThumbs.push(b);
    }

    stripEl.appendChild(frag);
    stripEl.addEventListener('click', function (e) {
      var b = e.target.closest('.lb-thumb');
      if (b) show(parseInt(b.getAttribute('data-index'), 10));
    });
  }

  function bindSwipe(o) {
    var x0 = null, y0 = null;
    o.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    }, { passive: true });
    o.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      var dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      x0 = y0 = null;
    }, { passive: true });
  }

  function show(index) {
    currentIndex = (index + CONFIG.count) % CONFIG.count;

    imgEl.classList.add('is-loading');
    imgEl.src = fullSrc(currentIndex);
    imgEl.alt = altText(currentIndex);
    imgEl.onload = function () { imgEl.classList.remove('is-loading'); };

    counterEl.textContent = (currentIndex + 1) + ' / ' + CONFIG.count;

    for (var i = 0; i < stripThumbs.length; i++) {
      stripThumbs[i].classList.toggle('is-active', i === currentIndex);
    }
    var active = stripThumbs[currentIndex];
    if (active) {
      stripEl.scrollTo({
        left: active.offsetLeft - stripEl.clientWidth / 2 + active.clientWidth / 2,
        behavior: 'smooth'
      });
    }

    // preload neighbours so arrow-key browsing feels instant
    [1, -1].forEach(function (d) {
      var n = new Image();
      n.src = fullSrc((currentIndex + d + CONFIG.count) % CONFIG.count);
    });
  }

  function go(delta) { show(currentIndex + delta); }

  function open(index) {
    lastFocused = document.activeElement;
    if (!overlay) overlay = createOverlay();
    document.body.appendChild(overlay);
    document.documentElement.classList.add('lb-open');
    show(index);
    document.addEventListener('keydown', onKeyDown);
    overlay.querySelector('.lb-close').focus();
  }

  function close() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    document.documentElement.classList.remove('lb-open');
    document.removeEventListener('keydown', onKeyDown);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function onKeyDown(e) {
    switch (e.key) {
      case 'Escape': close(); break;
      case 'ArrowRight': go(1); break;
      case 'ArrowLeft': go(-1); break;
      case 'Home': e.preventDefault(); show(0); break;
      case 'End': e.preventDefault(); show(CONFIG.count - 1); break;
    }
  }

  /* ---------- styles ---------- */

  function injectStyles() {
    var s = document.createElement('style');
    s.id = 'lb-styles';
    s.textContent = [
      'html.lb-open { overflow: hidden; }',
      '.lb { position: fixed; inset: 0; z-index: 100; display: flex; flex-direction: column;',
      '  background: #0c0c0e; color: #fff; }',
      '.lb-bar { display: flex; align-items: center; justify-content: space-between;',
      '  padding: 0.75rem 1rem; flex: 0 0 auto; }',
      '.lb-counter { font-size: 0.8125rem; letter-spacing: 0.08em; color: rgba(255,255,255,0.65);',
      '  font-variant-numeric: tabular-nums; }',
      '.lb-btn { background: transparent; border: 0; color: rgba(255,255,255,0.85); cursor: pointer;',
      '  line-height: 1; transition: color .15s ease, background-color .15s ease; border-radius: 9999px; }',
      '.lb-btn:hover, .lb-btn:focus-visible { color: rgb(240,176,0); outline: none; }',
      '.lb-close { font-size: 2rem; padding: 0 .5rem .25rem; }',
      '.lb-stage { position: relative; flex: 1 1 auto; display: flex; align-items: center;',
      '  justify-content: center; min-height: 0; padding: 0 3.25rem; }',
      '.lb-img { max-width: 100%; max-height: 100%; object-fit: contain; opacity: 1;',
      '  transition: opacity .18s ease; border-radius: 4px; }',
      '.lb-img.is-loading { opacity: 0.25; }',
      '.lb-nav { position: absolute; top: 50%; transform: translateY(-50%); font-size: 2.5rem;',
      '  width: 2.75rem; height: 4rem; background: rgba(255,255,255,0.06); }',
      '.lb-nav:hover { background: rgba(255,255,255,0.12); }',
      '.lb-prev { left: 0.35rem; }',
      '.lb-next { right: 0.35rem; }',
      '.lb-strip { flex: 0 0 auto; display: flex; gap: .375rem; overflow-x: auto; overflow-y: hidden;',
      '  padding: .75rem 1rem 1rem; scrollbar-width: thin;',
      '  scrollbar-color: rgba(255,255,255,0.25) transparent; }',
      '.lb-strip::-webkit-scrollbar { height: 6px; }',
      '.lb-strip::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.25); border-radius: 3px; }',
      '.lb-thumb { flex: 0 0 auto; width: 4rem; height: 3rem; padding: 0; border: 0; cursor: pointer;',
      '  border-radius: 4px; overflow: hidden; background: rgba(255,255,255,0.08);',
      '  opacity: .45; transition: opacity .15s ease, box-shadow .15s ease; }',
      '.lb-thumb:hover, .lb-thumb:focus-visible { opacity: .85; outline: none; }',
      '.lb-thumb.is-active { opacity: 1; box-shadow: 0 0 0 2px rgb(240,176,0); }',
      '.lb-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }',
      '@media (max-width: 640px) {',
      '  .lb-stage { padding: 0 .5rem; }',
      '  .lb-nav { background: rgba(0,0,0,0.35); width: 2.25rem; height: 3.25rem; font-size: 2rem; }',
      '  .lb-thumb { width: 3rem; height: 2.25rem; }',
      '}'
    ].join('\n');
    document.head.appendChild(s);
  }

  /* ---------- init ---------- */

  function init() {
    grid = document.getElementById('galleryGrid');
    if (!grid) return;

    T = STRINGS[document.documentElement.lang === 'en' ? 'en' : 'pl'];

    // data-preview="18" shows a teaser behind a "show all" button;
    // without it every photo is rendered straight away.
    var wanted = parseInt(grid.getAttribute('data-preview'), 10);
    preview = wanted > 0 && wanted < CONFIG.count ? wanted : CONFIG.count;

    moreBtn = document.getElementById('galleryMore');
    injectStyles();
    buildGrid();

    if (moreBtn && preview >= CONFIG.count) {
      moreBtn.parentNode.removeChild(moreBtn);
      moreBtn = null;
    }
    if (moreBtn) moreBtn.addEventListener('click', revealAll);

    var countEls = document.querySelectorAll('[data-photo-count]');
    for (var i = 0; i < countEls.length; i++) countEls[i].textContent = CONFIG.count;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
