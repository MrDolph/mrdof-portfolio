// scroll.js — scroll to top button

export function initScroll() {
  var scrollButton = document.getElementById('scrollTop');
  if (!scrollButton) return;

  var container = scrollButton.parentElement;

  function toggleScrollButton() {
    if (window.scrollY > 300) {
      container.classList.add('show');
    } else {
      container.classList.remove('show');
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.addEventListener('scroll', toggleScrollButton);
  scrollButton.addEventListener('click', scrollToTop);
}