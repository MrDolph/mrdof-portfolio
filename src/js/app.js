import { initTab } from './tab.js';
import { initTheme } from './theme.js';
import { initModal } from './modal.js';
import { initTypeWriterEffect } from './typewriter.js';
import { initFooter } from './footer.js';
import { initScroll } from './scroll.js';
import { initGitHubProjects } from './github.js';
import { initPaystack, initCalendar } from './paystack.js';
import {
  initParticles,
  initGradientMesh,
  initScrollReveal,
  init3DTilt,
  initMagneticButtons,
  initGlitchText,
  initEnhancedTypewriter
} from './animations.js';

export function initApp() {
  var app = document.getElementById('root');
  if (!app) return;

  initTab();
  initTheme();
  initModal();
  initFooter();
  initScroll();

  // Animations (before content loads)
  initGradientMesh();
  initParticles();
  initGlitchText();
  initEnhancedTypewriter();
  initMagneticButtons();
  init3DTilt();

  // Async content
  initGitHubProjects();
  initPaystack();
  initCalendar();

  // Scroll reveal after a tick so DOM is ready
  setTimeout(initScrollReveal, 50);

  document.body.style.visibility = 'visible';
}
