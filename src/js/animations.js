// animations.js — particles, scroll reveal, 3D tilt, magnetic buttons, glitch

// ============================================
// 1. FLOATING PARTICLES — header background
// ============================================
export function initParticles() {
  var header = document.querySelector('.header');
  if (!header) return;

  var canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  header.style.position = 'relative';
  header.style.overflow = 'hidden';
  header.insertBefore(canvas, header.firstChild);

  // Make header content sit above canvas
  var inner = header.querySelector('.header-inner');
  var toggle = header.querySelector('.theme-toggle');
  if (inner) inner.style.position = 'relative';
  if (toggle) toggle.style.position = 'absolute';

  var ctx = canvas.getContext('2d');
  var particles = [];
  var W, H;

  function resize() {
    W = canvas.width = header.offsetWidth;
    H = canvas.height = header.offsetHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: H + 10,
      size: Math.random() * 2.5 + 1,
      speedY: Math.random() * 0.6 + 0.3,
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.5 ? '#FFD700' : '#ffffff'
    };
  }

  function init() {
    resize();
    particles = [];
    for (var i = 0; i < 55; i++) {
      var p = createParticle();
      p.y = Math.random() * H; // spread initially
      particles.push(p);
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(function(p, i) {
      p.y -= p.speedY;
      p.x += p.speedX;
      p.opacity -= 0.0008;

      if (p.y < -10 || p.opacity <= 0) {
        particles[i] = createParticle();
        return;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    requestAnimationFrame(animate);
  }

  init();
  animate();
  window.addEventListener('resize', init);
}

// ============================================
// 2. ANIMATED GRADIENT MESH — header
// ============================================
export function initGradientMesh() {
  var header = document.querySelector('.header');
  if (!header) return;

  var mesh = document.createElement('div');
  mesh.className = 'mesh-bg';
  mesh.innerHTML =
    '<div class="mesh-blob b1"></div>' +
    '<div class="mesh-blob b2"></div>' +
    '<div class="mesh-blob b3"></div>';
  header.insertBefore(mesh, header.firstChild);
}

// ============================================
// 3. SCROLL REVEAL — all key elements
// ============================================
export function initScrollReveal() {
  var selectors = [
    '.project-card',
    '.gh-card',
    '.yt-card',
    '.about-content',
    '.bio h2',
    '.skill',
    '.featured-section-header',
    '.github-section-header',
    '.youtube-section-header',
    '.section-heading',
    '.payment-box',
    '#calendar',
    '.gh-subsection-header'
  ];

  var elements = [];
  selectors.forEach(function(sel) {
    document.querySelectorAll(sel).forEach(function(el) {
      elements.push(el);
    });
  });

  // Stagger siblings in grids
  document.querySelectorAll('.featured-grid .project-card').forEach(function(el, i) {
    el.dataset.revealDelay = i * 80;
  });

  document.querySelectorAll('.gh-subgrid .gh-card').forEach(function(el, i) {
    el.dataset.revealDelay = i * 60;
  });

  document.querySelectorAll('.expertise .skill').forEach(function(el, i) {
    el.dataset.revealDelay = i * 40;
  });

  elements.forEach(function(el) {
    el.classList.add('reveal');
  });

  function checkReveal() {
    var windowH = window.innerHeight;
    document.querySelectorAll('.reveal:not(.revealed)').forEach(function(el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < windowH - 60) {
        var delay = el.dataset.revealDelay || 0;
        setTimeout(function() {
          el.classList.add('revealed');
        }, parseInt(delay));
      }
    });
  }

  window.addEventListener('scroll', checkReveal, { passive: true });
  // Initial check
  setTimeout(checkReveal, 100);
}

// ============================================
// 4. 3D TILT — project cards
// ============================================
export function init3DTilt() {
  function applyTilt(card) {
    card.addEventListener('mousemove', function(e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var centerX = rect.width / 2;
      var centerY = rect.height / 2;
      var rotateX = ((y - centerY) / centerY) * -8;
      var rotateY = ((x - centerX) / centerX) * 8;
      card.style.transform =
        'perspective(600px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateZ(8px)';
      card.style.transition = 'transform 0.05s linear';
    });

    card.addEventListener('mouseleave', function() {
      card.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) translateZ(0)';
      card.style.transition = 'transform 0.4s ease';
    });
  }

  document.querySelectorAll('.project-card, .gh-card').forEach(applyTilt);

  // Also apply to dynamically loaded gh-cards
  var grid = document.getElementById('gh-projects-grid');
  if (grid) {
    var observer = new MutationObserver(function() {
      grid.querySelectorAll('.gh-card:not([data-tilt])').forEach(function(card) {
        card.setAttribute('data-tilt', '1');
        applyTilt(card);
      });
    });
    observer.observe(grid, { childList: true, subtree: true });
  }
}

// ============================================
// 5. MAGNETIC BUTTONS
// ============================================
export function initMagneticButtons() {
  var selectors = [
    '.pay-btn',
    '.gh-view-all a',
    '#payButton',
    '.main',
    '.yt-channel-link'
  ];

  selectors.forEach(function(sel) {
    document.querySelectorAll(sel).forEach(function(btn) {
      btn.addEventListener('mousemove', function(e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + x * 0.25 + 'px, ' + y * 0.25 + 'px)';
        btn.style.transition = 'transform 0.15s ease';
      });

      btn.addEventListener('mouseleave', function() {
        btn.style.transform = 'translate(0, 0)';
        btn.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      });
    });
  });
}

// ============================================
// 6. GLITCH TEXT — name in header
// ============================================
export function initGlitchText() {
  var h1 = document.querySelector('.header h1');
  if (!h1) return;

  var text = h1.textContent;
  h1.classList.add('glitch');
  h1.setAttribute('data-text', text);
}

// ============================================
// 7. ENHANCED TYPEWRITER — cycling roles
// ============================================
export function initEnhancedTypewriter() {
  var tagline = document.querySelector('.tagline');
  if (!tagline) return;

  var roles = [
    'Physicist · Educator · Software Developer · Virtual Assistant',
    'Building EdTech solutions for Nigerian schools',
    'Full Stack Developer · MERN · React Native',
    'Physics Teacher · Content Creator · VA',
    'Turning ideas into scalable digital products'
  ];

  var roleIndex = 0;
  var charIndex = 0;
  var deleting = false;
  var pauseTimer = null;

  function type() {
    var current = roles[roleIndex];

    if (!deleting) {
      tagline.textContent = current.substring(0, charIndex + 1);
      charIndex++;
      if (charIndex === current.length) {
        deleting = true;
        pauseTimer = setTimeout(type, 2200);
        return;
      }
    } else {
      tagline.textContent = current.substring(0, charIndex - 1);
      charIndex--;
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        pauseTimer = setTimeout(type, 400);
        return;
      }
    }

    setTimeout(type, deleting ? 28 : 55);
  }

  setTimeout(type, 1200);
}
