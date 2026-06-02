// initApp.js

import { initTab } from './tab.js';
import { initTheme } from './theme.js';
import { initModal } from './modal.js';
import { initTypeWriterEffect } from './typewriter.js';
import { initFooter } from './footer.js';
import { initGitHubProjects } from './github.js';

export function initApp() {
  const app = document.getElementById("root");
  if (!app) {
    console.error("Root element with ID 'root' not found.");
    return;
  }

  // Initialize all parts of the app
  initTab();
  initTheme();
  initModal();
  initTypeWriterEffect();
  initFooter();

  // Fetch and render GitHub pinned repos
  initGitHubProjects();

  document.body.style.visibility = 'visible';
}
