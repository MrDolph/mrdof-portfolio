// scrollPanels.js — generic bounded-height scroll behavior for any
// .scroll-panel block (certs, projects, testimonials, experience,
// research, GitHub repos, videos). Wraps the existing grid/list
// element; only adds nav buttons + fade hints, doesn't touch content.
//
// Works with content that loads in asynchronously (CMS fetches,
// GitHub API) via MutationObserver — no need to coordinate timing
// with sanity.js / github.js.

export function initScrollPanels() {
  var panels = document.querySelectorAll('.scroll-panel');
  if (!panels.length) return;

  panels.forEach(function (panel) {
    var viewport = panel.querySelector('.scroll-panel-viewport');
    if (!viewport) return;

    var upBtn = panel.querySelector('.scroll-nav-up');
    var downBtn = panel.querySelector('.scroll-nav-down');

    function update() {
      var atTop = viewport.scrollTop <= 4;
      var atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 4;
      var overflowing = viewport.scrollHeight > viewport.clientHeight + 4;

      panel.classList.toggle('is-scrolled', overflowing && !atTop);
      panel.classList.toggle('has-more-below', overflowing && !atBottom);
    }

    viewport.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });

    if (upBtn) {
      upBtn.addEventListener('click', function () {
        viewport.scrollBy({ top: -Math.round(viewport.clientHeight * 0.7), behavior: 'smooth' });
      });
    }
    if (downBtn) {
      downBtn.addEventListener('click', function () {
        viewport.scrollBy({ top: Math.round(viewport.clientHeight * 0.7), behavior: 'smooth' });
      });
    }

    // Re-check whenever content inside the viewport changes — covers
    // CMS sections (sanity.js) and GitHub repos (github.js), both of
    // which populate their grids after this script has already run.
    var mo = new MutationObserver(update);
    mo.observe(viewport, { childList: true, subtree: false });

    // Initial check, plus a couple of follow-ups to catch images/fonts
    // settling shortly after load (affects scrollHeight).
    update();
    setTimeout(update, 300);
    setTimeout(update, 1200);
  });
}