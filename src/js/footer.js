
export function initFooter() {
  const yearSpan = document.querySelector('.copyright');
  if (!yearSpan) return; // exit early if element not found

  yearSpan.textContent = `© ${new Date().getFullYear()} Fatai Dawodu. All rights reserved.`;
}
