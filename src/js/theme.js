export function initTheme() {
  const themeButton = document.getElementById('themeButton')
  const body = document.documentElement

  const toggleTheme = () => {
    const isDark = body.getAttribute('data-theme') === 'dark'
    body.setAttribute('data-theme', isDark ? 'light' : 'dark')
    themeButton.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>'
    localStorage.setItem('theme', isDark ? 'light' : 'dark')
  }

  // Initialize theme
  const savedTheme = localStorage.getItem('theme') || 'light'
  body.setAttribute('data-theme', savedTheme)
  themeButton.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>'

  themeButton.addEventListener('click', toggleTheme)
}