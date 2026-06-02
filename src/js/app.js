// app.js

import { initTab } from './tab.js';
import { initTheme } from './theme.js';
import { initModal } from './modal.js';
import { initTypeWriterEffect } from './typewriter.js';
import { initFooter } from './footer.js';
import { initGitHubProjects } from './github.js';
import { initPaystack, initCalendar } from './paystack.js';

export function initApp() {
  var app = document.getElementById('root');
  if (!app) {
    console.error("Root element with ID 'root' not found.");
    return;
  }

  initTab();
  initTheme();
  initModal();
  initTypeWriterEffect();
  initFooter();
  initGitHubProjects();
  initPaystack();
  initCalendar();

  document.body.style.visibility = 'visible';
}
