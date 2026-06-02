export function initTab() {
  const tabAbout = document.getElementById('tabAboutMe');
  const tabPortfolio = document.getElementById('tabPortfolio');
  const sectionAbout = document.getElementById('sectionAboutMe');
  const sectionPortfolio = document.getElementById('sectionPortfolio');

  if (!tabAbout || !tabPortfolio || !sectionAbout || !sectionPortfolio) {
    console.warn("Tab elements not found. Skipping tab initialization.");
    return;
  }

  const tabs = [tabAbout, tabPortfolio];
  const sections = {
    about: sectionAbout,
    portfolio: sectionPortfolio
  };

  function switchTab(target) {
    tabs.forEach(tab => tab.classList.remove('active'));
    Object.values(sections).forEach(section => section.classList.remove('active'));

    if (target === 'about') {
      tabAbout.classList.add('active');
      sectionAbout.classList.add('active');
      sectionAbout.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      tabPortfolio.classList.add('active');
      sectionPortfolio.classList.add('active');
      sectionPortfolio.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  tabAbout.addEventListener('click', () => switchTab('about'));
  tabPortfolio.addEventListener('click', () => switchTab('portfolio'));

  // Start with About Me
  switchTab('about');
}
