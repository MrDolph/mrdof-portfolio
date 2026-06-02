export function initScroll() {
  const scrollButton = document.getElementById('scrollTop');

  if (!scrollButton || !scrollButton.parentElement) {
    console.warn('Scroll button or its parent not found.');
    return; // Prevent errors if element is missing
  }

  function toggleScrollButton() {
    const scrollY = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollBottom = scrollY + window.innerHeight;
    const threshold = scrollHeight - 400;

    if (scrollY >= 100 || scrollBottom >= threshold) {
      scrollButton.parentElement.classList.add('show');
    } else {
      scrollButton.parentElement.classList.remove('show');
    }
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

    window.addEventListener('scroll', toggleScrollButton);
    scrollButton.addEventListener('click', scrollToTop);

    // Update scroll detection logic
    function toggleScrollButton() {
        const scrollPosition = window.scrollY + window.innerHeight;
        const bottomThreshold = document.documentElement.scrollHeight - 400;
        
        if (scrollPosition >= bottomThreshold) {
            scrollButton.parentElement.classList.add('show');
        } else {
            scrollButton.parentElement.classList.remove('show');
        }
    }
}
