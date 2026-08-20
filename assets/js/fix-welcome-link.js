(function () {
  function fixWelcomeLink() {
    var links = document.querySelectorAll('.sidebar-nav a');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var title = (a.querySelector('.nav-item-title') || a).textContent.trim();
      if (title === 'Welcome' && (!a.getAttribute('href') || a.getAttribute('href') === '')) {
        var depth = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean).length;
        a.setAttribute('href', depth > 0 ? '../'.repeat(depth) : './');
      }
    }
  }
  fixWelcomeLink();
  document.addEventListener('docmd:page-mounted', fixWelcomeLink);
})();
