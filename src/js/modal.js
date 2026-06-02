// modal.js — handles portfolio modal only (slider removed)

export function initModal() {
  var modal = document.querySelector('.portfolio-modal');
  var closeBtn = document.querySelector('.close-modal');

  if (!modal || !closeBtn) return;

  // Close on X button
  closeBtn.addEventListener('click', function() {
    modal.style.display = 'none';
  });

  // Close when clicking backdrop
  window.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Close with ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      modal.style.display = 'none';
    }
  });
}
