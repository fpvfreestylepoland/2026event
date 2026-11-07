/*
 * EN/PL language switching for the static pages (index.html, rules.html).
 *
 * Both languages live in the HTML: translated elements carry lang="en" or
 * lang="pl", and each page's inline CSS hides whichever one doesn't match
 * <html lang>. This script only picks the language (before first paint, so
 * load it synchronously in <head>), swaps the few translated attributes and
 * wires up the EN | PL switcher.
 *
 * Language priority: ?lang= in the URL > visitor's saved choice > browser
 * language > English. So https://fpvsilesia2026.pl/?lang=en always opens in
 * English, and a link with ?lang=pl always opens in Polish.
 *
 * Translated attributes: put data-en-<attr> / data-pl-<attr> next to the
 * attribute (alt, title, aria-label, content). For an element's text (used for
 * <title>) use data-en-text / data-pl-text.
 *
 * Fires a "langchange" event on document after switching (gallery.js uses it).
 */
(function () {
  'use strict';

  var LANGS = ['en', 'pl'];
  var FALLBACK = 'en';
  var STORAGE_KEY = 'fpvs-lang';
  var ATTRS = ['alt', 'title', 'aria-label', 'content'];

  function valid(l) { return LANGS.indexOf(l) !== -1 ? l : null; }

  function fromUrl() {
    try { return valid(new URLSearchParams(location.search).get('lang')); } catch (e) { return null; }
  }
  function fromStorage() {
    try { return valid(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
  }
  function save(l) {
    try { localStorage.setItem(STORAGE_KEY, l); } catch (e) { /* private mode etc. */ }
  }
  function fromBrowser() {
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < list.length; i++) {
      var code = valid(String(list[i]).toLowerCase().slice(0, 2));
      if (code) return code;
    }
    return null;
  }

  function applyAttrs(l) {
    ATTRS.forEach(function (a) {
      var els = document.querySelectorAll('[data-' + l + '-' + a + ']');
      for (var i = 0; i < els.length; i++) els[i].setAttribute(a, els[i].getAttribute('data-' + l + '-' + a));
    });
    var texts = document.querySelectorAll('[data-' + l + '-text]');
    for (var j = 0; j < texts.length; j++) texts[j].textContent = texts[j].getAttribute('data-' + l + '-text');

    var links = document.querySelectorAll('[data-set-lang]');
    for (var k = 0; k < links.length; k++) {
      if (links[k].getAttribute('data-set-lang') === l) links[k].setAttribute('aria-current', 'true');
      else links[k].removeAttribute('aria-current');
    }
  }

  function setLang(l) {
    document.documentElement.lang = l;
    applyAttrs(l);
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: l } }));
  }

  // Pick the language now, before <body> renders.
  var urlLang = fromUrl();
  if (urlLang) save(urlLang);
  document.documentElement.lang = urlLang || fromStorage() || fromBrowser() || FALLBACK;

  function init() {
    applyAttrs(document.documentElement.lang);

    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('[data-set-lang]');
      if (!link) return;
      e.preventDefault();
      var l = valid(link.getAttribute('data-set-lang'));
      if (!l || l === document.documentElement.lang) return;
      save(l);
      setLang(l);
      // Keep ?lang= in the address bar so a copied link opens in the same language.
      try {
        var url = new URL(location.href);
        url.searchParams.set('lang', l);
        history.replaceState(history.state, '', url);
      } catch (err) { /* old browsers: the switch still works, the URL just doesn't change */ }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
