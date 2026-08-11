(function () {
  var TARGET = 'https://www.bulletinbored.net';
  function apply() {
    var links = document.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (a.classList.contains('logo-link') || /logo/i.test(a.className)) {
        if (a.getAttribute('href') !== TARGET) {
          a.setAttribute('href', TARGET);
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener noreferrer');
        }
      }
    }
  }
  function start() {
    apply();
    if (window.MutationObserver) {
      var obs = new MutationObserver(apply);
      obs.observe(document.documentElement, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
