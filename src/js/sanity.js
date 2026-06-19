// sanity.js — Fetches all CMS content for the portfolio
// Place in: src/js/sanity.js

// ─── CONFIG ────────────────────────────────────────────────
var PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID || '';
var DATASET    = 'production';
var API_VER    = '2024-01-01';

console.log('[Sanity] Project ID:', PROJECT_ID ? PROJECT_ID : '⚠️ MISSING — check VITE_SANITY_PROJECT_ID');

// ─── HELPERS ───────────────────────────────────────────────
function sanityUrl(query) {
  var encoded = encodeURIComponent(query);
  return 'https://' + PROJECT_ID + '.api.sanity.io/v' + API_VER
    + '/data/query/' + DATASET + '?query=' + encoded;
}

function imageUrl(asset) {
  if (!asset || !asset._ref) return '';
  var ref   = asset._ref;
  var parts = ref.replace('image-', '').split('-');
  var ext   = parts.pop();
  var id    = parts.join('-');
  return 'https://cdn.sanity.io/images/' + PROJECT_ID + '/' + DATASET + '/' + id + '.' + ext;
}

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function groqFetch(query) {
  if (!PROJECT_ID) {
    console.error('[Sanity] No project ID — set VITE_SANITY_PROJECT_ID in .env');
    return Promise.resolve([]);
  }
  return fetch(sanityUrl(query))
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function(data) { return data.result || []; })
    .catch(function(err) {
      console.error('[Sanity] Fetch error:', err);
      return [];
    });
}

function observeReveal(container) {
  var els = container.querySelectorAll('.reveal-item');
  if (!els.length) return;
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  els.forEach(function(el) { io.observe(el); });
}

// ─── CREDENTIALS ───────────────────────────────────────────
export function initCredentials() {
  var el = document.getElementById('credentials-strip');
  if (!el) return;
  groqFetch('*[_type == "credential"] | order(order asc)')
    .then(function(items) {
      if (!items.length) { el.style.display = 'none'; return; }
      el.innerHTML = items.map(function(c) {
        return '<span class="credential-pill">' + (c.icon ? c.icon + ' ' : '') + c.label + '</span>';
      }).join('');
    });
}

// ─── TESTIMONIALS ──────────────────────────────────────────
export function initTestimonials() {
  var grid = document.getElementById('testimonials-grid');
  if (!grid) return;
  groqFetch('*[_type == "testimonial"] | order(order asc) { name, role, organisation, quote, rating, photo }')
    .then(function(items) {
      if (!items.length) { grid.style.display = 'none'; return; }
      grid.innerHTML = items.map(function(t, i) {
        var stars = '★'.repeat(t.rating || 5);
        var photo = (t.photo && t.photo.asset)
          ? '<img src="' + imageUrl(t.photo.asset) + '" alt="' + t.name + '" class="testi-photo">'
          : '<div class="testi-initials">' + t.name.charAt(0) + '</div>';
        return '<div class="testi-card reveal-item" style="transition-delay:' + (i * 80) + 'ms">'
          + '<div class="testi-stars">' + stars + '</div>'
          + '<p class="testi-quote">\u201C' + t.quote + '\u201D</p>'
          + '<div class="testi-author">' + photo
          + '<div><strong>' + t.name + '</strong>'
          + '<span>' + t.role + (t.organisation ? ' · ' + t.organisation : '') + '</span>'
          + '</div></div></div>';
      }).join('');
      observeReveal(grid);
    });
}

// ─── EXPERIENCE ────────────────────────────────────────────
export function initExperience() {
  var timeline = document.getElementById('experience-timeline');
  if (!timeline) return;
  groqFetch('*[_type == "experience"] | order(order asc) { role, organisation, type, startDate, endDate, current, location, description, highlights }')
    .then(function(items) {
      if (!items.length) { timeline.style.display = 'none'; return; }
      timeline.innerHTML = items.map(function(e, i) {
        var start  = (e.startDate || '').substring(0, 7).replace('-', '/');
        var end    = e.current ? 'Present' : (e.endDate || '').substring(0, 7).replace('-', '/');
        var period = start + (end ? ' — ' + end : '');
        var hl = (e.highlights || []).map(function(h) { return '<li>' + h + '</li>'; }).join('');
        return '<div class="exp-item reveal-item" style="transition-delay:' + (i * 80) + 'ms">'
          + '<div class="exp-dot' + (e.current ? ' exp-dot-active' : '') + '"></div>'
          + '<div class="exp-content">'
          + '<div class="exp-header">'
          + '<div><h3 class="exp-role">' + e.role + '</h3>'
          + '<p class="exp-org">' + e.organisation + (e.location ? ' · ' + e.location : '') + '</p></div>'
          + '<div class="exp-meta">'
          + (e.type ? '<span class="exp-type">' + e.type + '</span>' : '')
          + '<span class="exp-period">' + period + '</span>'
          + '</div></div>'
          + (e.description ? '<p class="exp-desc">' + e.description + '</p>' : '')
          + (hl ? '<ul class="exp-highlights">' + hl + '</ul>' : '')
          + '</div></div>';
      }).join('');
      observeReveal(timeline);
    });
}

// ─── RESEARCH ──────────────────────────────────────────────
export function initResearch() {
  var grid = document.getElementById('research-grid');
  if (!grid) return;
  groqFetch('*[_type == "research"] | order(order asc) { title, type, institution, year, abstract, tags, link, featured }')
    .then(function(items) {
      if (!items.length) { grid.style.display = 'none'; return; }
      var labels = { thesis: 'MSc Thesis', paper: 'Research Paper', conference: 'Conference', dft: 'DFT Simulation', iot: 'IoT Research', edtech: 'EdTech Research' };
      grid.innerHTML = items.map(function(r, i) {
        var tags = (r.tags || []).map(function(t) { return '<span class="research-tag">' + t + '</span>'; }).join('');
        return '<div class="research-card reveal-item" style="transition-delay:' + (i * 80) + 'ms">'
          + (r.featured ? '<div class="research-featured-badge">Featured</div>' : '')
          + '<div class="research-type">' + (labels[r.type] || r.type) + '</div>'
          + '<h3 class="research-title">' + r.title + '</h3>'
          + (r.institution ? '<p class="research-inst">' + r.institution + (r.year ? ' · ' + r.year : '') + '</p>' : '')
          + (r.abstract ? '<p class="research-abstract">' + r.abstract + '</p>' : '')
          + (tags ? '<div class="research-tags">' + tags + '</div>' : '')
          + (r.link ? '<a href="' + r.link + '" target="_blank" rel="noopener" class="research-link">View Paper →</a>' : '')
          + '</div>';
      }).join('');
      observeReveal(grid);
    });
}

// ─── BLOG LIST ─────────────────────────────────────────────
export function initBlogList() {
  var grid   = document.getElementById('blog-grid');
  var reader = document.getElementById('blog-reader');
  if (!grid) return;

  // Loading state
  grid.innerHTML = '<div class="blog-loading"><div class="blog-loading-spinner"></div><p>Loading posts…</p></div>';

  groqFetch('*[_type == "post"] | order(publishedAt desc) { title, slug, excerpt, category, publishedAt, readTime, featured, coverImage }')
    .then(function(posts) {
      console.log('[Sanity] Blog posts:', posts.length, posts);

      if (!posts.length) {
        grid.innerHTML = '<div class="blog-empty">'
          + '<div class="blog-empty-icon">✍️</div>'
          + '<h3>No posts yet</h3>'
          + '<p>Check back soon — content is coming!</p>'
          + '</div>';
        return;
      }

      var catLabels = {
        physics: 'Physics & Science', edtech: 'EdTech', dev: 'Web Dev',
        afacsims: 'AfacSIMS', 'nigerian-tech': 'Nigerian Tech',
        va: 'Virtual Assistant', career: 'Career'
      };

      grid.innerHTML = posts.map(function(p, i) {
        var cat    = catLabels[p.category] || p.category || '';
        var imgSrc = (p.coverImage && p.coverImage.asset) ? imageUrl(p.coverImage.asset) : '';
        var imgHtml = imgSrc
          ? '<div class="blog-thumb-wrap"><img src="' + imgSrc + '" alt="' + p.title + '" class="blog-thumb"></div>'
          : '<div class="blog-thumb-wrap blog-thumb-placeholder"><span class="blog-cat-watermark">' + cat + '</span></div>';
        var slug = (p.slug && p.slug.current) ? p.slug.current : '';

        return '<article class="blog-card reveal-item' + (p.featured ? ' blog-card-featured' : '')
          + '" style="transition-delay:' + (i * 80) + 'ms" data-slug="' + slug + '">'
          + imgHtml
          + '<div class="blog-card-body">'
          + '<div class="blog-meta">'
          + (cat ? '<span class="blog-cat">' + cat + '</span>' : '')
          + (p.publishedAt ? '<span class="blog-date">' + formatDate(p.publishedAt) + '</span>' : '')
          + (p.readTime ? '<span class="blog-read">' + p.readTime + ' min</span>' : '')
          + '</div>'
          + '<h3 class="blog-title">' + p.title + '</h3>'
          + '<p class="blog-excerpt">' + (p.excerpt || '') + '</p>'
          + '<span class="blog-more">Read more →</span>'
          + '</div></article>';
      }).join('');

      observeReveal(grid);

      grid.querySelectorAll('.blog-card').forEach(function(card) {
        card.addEventListener('click', function() {
          openBlogPost(card.getAttribute('data-slug'), grid, reader);
        });
      });
    });
}

// ─── BLOG POST READER ──────────────────────────────────────
function openBlogPost(slug, grid, reader) {
  if (!slug || !reader) return;

  grid.style.display = 'none';
  reader.style.display = 'block';
  reader.innerHTML = '<div class="blog-loading"><div class="blog-loading-spinner"></div><p>Loading…</p></div>';
  reader.scrollIntoView({ behavior: 'smooth', block: 'start' });

  groqFetch('*[_type == "post" && slug.current == "' + slug + '"][0]{ title, excerpt, category, publishedAt, readTime, coverImage, body, tags }')
    .then(function(post) {
      if (!post || !post.title) {
        reader.innerHTML = '<p class="cms-empty">Post not found.</p>';
        return;
      }

      var imgHtml = (post.coverImage && post.coverImage.asset)
        ? '<img src="' + imageUrl(post.coverImage.asset) + '" alt="' + post.title + '" class="reader-cover">'
        : '';

      reader.innerHTML = '<div class="blog-reader-inner">'
        + '<button class="reader-back" id="readerBack">← Back to Blog</button>'
        + imgHtml
        + '<div class="reader-meta">'
        + (post.category ? '<span class="blog-cat">' + post.category + '</span>' : '')
        + '<span class="blog-date">' + formatDate(post.publishedAt) + '</span>'
        + (post.readTime ? '<span class="blog-read">' + post.readTime + ' min read</span>' : '')
        + '</div>'
        + '<h1 class="reader-title">' + post.title + '</h1>'
        + '<div class="reader-body">' + renderBody(post.body || []) + '</div>'
        + '</div>';

      document.getElementById('readerBack').addEventListener('click', function() {
        reader.style.display = 'none';
        reader.innerHTML = '';
        grid.style.display = 'grid';
      });
    });
}

function renderBody(blocks) {
  return blocks.map(function(block) {
    if (block._type === 'image' && block.asset) {
      return '<figure class="reader-img"><img src="' + imageUrl(block.asset) + '" alt="' + (block.caption || '') + '">'
        + (block.caption ? '<figcaption>' + block.caption + '</figcaption>' : '') + '</figure>';
    }
    if (block._type === 'code') {
      return '<pre class="reader-code"><code>' + (block.code || '') + '</code></pre>';
    }
    if (block._type !== 'block') return '';
    var text = (block.children || []).map(function(span) {
      var t = (span.text || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      (span.marks || []).forEach(function(m) {
        if (m === 'strong') t = '<strong>' + t + '</strong>';
        else if (m === 'em') t = '<em>' + t + '</em>';
        else if (m === 'code') t = '<code>' + t + '</code>';
      });
      return t;
    }).join('');
    var s = block.style || 'normal';
    if (s === 'h2') return '<h2>' + text + '</h2>';
    if (s === 'h3') return '<h3>' + text + '</h3>';
    if (s === 'blockquote') return '<blockquote>' + text + '</blockquote>';
    return text ? '<p>' + text + '</p>' : '';
  }).join('\n');
}