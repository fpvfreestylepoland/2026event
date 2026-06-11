(function () {
  function init() {
    var items = Array.prototype.slice.call(
      document.querySelectorAll('[data-lightbox]')
    );
    if (!items.length) return;

    injectStyles();

    var currentIndex = 0;
    var overlay = null;
    var imgEl = null;
    var counterEl = null;

    function open(idx) {
      currentIndex = idx;
      if (!overlay) overlay = createOverlay();
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';
      update();
      document.addEventListener('keydown', onKeyDown);
    }

    function close() {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    }

    function next() {
      currentIndex = (currentIndex + 1) % items.length;
      update();
    }

    function prev() {
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      update();
    }

    function update() {
      var item = items[currentIndex];
      var src = item.getAttribute('href');
      imgEl.src = src;
      counterEl.textContent = currentIndex + 1 + ' / ' + items.length;
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
    }

    function createOverlay() {
      var o = document.createElement('div');
      o.className = 'lb-overlay';
      o.innerHTML =
        '<button class="lb-close" aria-label="Close">×</button>' +
        '<button class="lb-prev" aria-label="Previous">‹</button>' +
        '<button class="lb-next" aria-label="Next">›</button>' +
        '<div class="lb-counter"></div>' +
        '<img class="lb-image" alt="" />';
      imgEl = o.querySelector('.lb-image');
      counterEl = o.querySelector('.lb-counter');
      o.addEventListener('click', function (e) {
        if (e.target === o) close();
      });
      o.querySelector('.lb-close').addEventListener('click', close);
      o.querySelector('.lb-next').addEventListener('click', next);
      o.querySelector('.lb-prev').addEventListener('click', prev);
      return o;
    }

    function injectStyles() {
      if (document.getElementById('lb-styles')) return;
      var s = document.createElement('style');
      s.id = 'lb-styles';
      s.textContent =
        '.lb-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center; }' +
        '.lb-overlay button { background: transparent; border: none; color: #fff; cursor: pointer; line-height: 1; transition: color 0.2s; font-family: Inter, system-ui, sans-serif; }' +
        '.lb-overlay button:hover { color: rgb(189,255,0); }' +
        '.lb-close { position: absolute; top: 1rem; right: 1rem; font-size: 2.5rem; padding: 0.25rem 0.75rem; }' +
        '.lb-prev, .lb-next { position: absolute; top: 50%; transform: translateY(-50%); font-size: 3rem; padding: 0.5rem 1rem; }' +
        '.lb-prev { left: 0.5rem; }' +
        '.lb-next { right: 0.5rem; }' +
        '.lb-counter { position: absolute; top: 1rem; left: 1rem; color: rgba(255,255,255,0.7); font-size: 0.875rem; font-family: Inter, system-ui, sans-serif; }' +
        '.lb-image { max-width: 95vw; max-height: 90vh; object-fit: contain; }';
      document.head.appendChild(s);
    }

    items.forEach(function (item, idx) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        open(idx);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
