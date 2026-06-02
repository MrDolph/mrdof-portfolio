import { initTab } from './tab.js';
import { initTheme } from './theme.js';
import { initModal } from './modal.js';
import { initTypeWriterEffect } from './typewriter.js';
import { initFooter } from './footer.js';
import { initScroll } from './scroll.js';
import { initGitHubProjects } from './github.js';
import { initPaystack, initCalendar } from './paystack.js';

export function initApp() {
  var app = document.getElementById('root');
  if (!app) return;

  initTab();
  initTheme();
  initModal();
  initTypeWriterEffect();
  initFooter();
  initScroll();
  initGitHubProjects();
  initPaystack();
  initCalendar();

  document.body.style.visibility = 'visible';
}