export function initTab() {
  var tabAbout     = document.getElementById('tabAboutMe');
  var tabPortfolio = document.getElementById('tabPortfolio');
  var tabBlog      = document.getElementById('tabBlog');

  var sectionAbout     = document.getElementById('sectionAboutMe');
  var sectionPortfolio = document.getElementById('sectionPortfolio');
  var sectionBlog      = document.getElementById('sectionBlog');

  if (!tabAbout || !tabPortfolio || !sectionAbout || !sectionPortfolio) {
    console.warn('Tab elements not found. Skipping tab initialization.');
    return;
  }

  var tabs = [tabAbout, tabPortfolio];
  var sections = [sectionAbout, sectionPortfolio];

  if (tabBlog && sectionBlog) {
    tabs.push(tabBlog);
    sections.push(sectionBlog);
  }

  function switchTab(targetTab, targetSection) {
    // Deactivate all
    tabs.forEach(function(tab) { tab.classList.remove('active'); });
    sections.forEach(function(sec) { sec.classList.remove('active'); });

    // Activate chosen
    targetTab.classList.add('active');
    targetSection.classList.add('active');
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  tabAbout.addEventListener('click', function() {
    switchTab(tabAbout, sectionAbout);
  });

  tabPortfolio.addEventListener('click', function() {
    switchTab(tabPortfolio, sectionPortfolio);
  });

  if (tabBlog && sectionBlog) {
    tabBlog.addEventListener('click', function() {
      switchTab(tabBlog, sectionBlog);
    });
  }

  // Start on About Me
  switchTab(tabAbout, sectionAbout);
}