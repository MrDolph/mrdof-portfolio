// sanity.js — Fetches all CMS content for the portfolio
// Add to src/js/ in your portfolio project

// ─── CONFIG ────────────────────────────────────────────────
// Replace these with your actual values from sanity.io/manage
const PROJECT_ID = import.meta.env.VITE_SANITY_PROJECT_ID;
const DATASET    = 'production';
const API_VER    = '2024-01-01';

// Builds the Sanity CDN URL for a given GROQ query
function sanityUrl(query) {
  var encoded = encodeURIComponent(query);
  return 'https://' + PROJECT_ID + '.api.sanity.io/v' + API_VER
    + '/data/query/' + DATASET + '?query=' + encoded;
}

// Converts a Sanity image reference to a usable URL
function imageUrl(ref) {
  if (!ref) return '';
  // ref looks like: image-abc123-800x600-jpg
  var parts = ref.split('-');
  var id   = parts[1];
  var dims = parts[2];
  var ext  = parts[3];
  return 'https://cdn.sanity.io/images/' + PROJECT_ID + '/' + DATASET
    + '/' + id + '-' + dims + '.' + ext;
}

// Generic GROQ fetch
function groqFetch(query) {
  return fetch(sanityUrl(query))
    .then(function(res) { return res.json(); })
    .then(function(data) { return data.result || []; });
}

// ─── CREDENTIALS / HIGHLIGHTS ──────────────────────────────
export function initCredentials() {
  var el = document.getElementById('credentials-strip');
  if (!el) return;

  groqFetch('*[_type == "credential"] | order(order asc)')
    .then(function(items) {
      if (!items.length) return;
      el.innerHTML = items.map(function(c) {
        return '<span class="credential-pill">'
          + (c.icon ? '<span>' + c.icon + '</span>' : '')
          + c.label
          + '</span>';
      }).join('');
    })
    .catch(function() { el.style.display = 'none'; });
}

// ─── TESTIMONIALS ──────────────────────────────────────────
export function initTestimonials() {
  var grid = document.getElementById('testimonials-grid');
  if (!grid) return;

  groqFetch('*[_type == "testimonial"] | order(order asc) { name, role, organisation, quote, category, rating, photo }')
    .then(function(items) {
      if (!items.length) {
        grid.style.display = 'none';
        return;
      }
      grid.innerHTML = items.map(function(t, i) {
        var stars = '';
        for (var s = 0; s < (t.rating || 5); s++) stars += '★';
        var photoHtml = t.photo
          ? '<img src="' + imageUrl(t.photo.asset._ref) + '" alt="' + t.name + '" class="testi-photo">'
          : '<div class="testi-initials">' + t.name.charAt(0) + '</div>';

        return '<div class="testi-card reveal-item" style="animation-delay:' + (i * 100) + 'ms">'
          + '<div class="testi-stars">' + stars + '</div>'
          + '<p class="testi-quote">"' + t.quote + '"</p>'
          + '<div class="testi-author">'
          +   photoHtml
          +   '<div>'
          +     '<strong>' + t.name + '</strong>'
          +     '<span>' + t.role + (t.organisation ? ' · ' + t.organisation : '') + '</span>'
          +   '</div>'
          + '</div>'
          + '</div>';
      }).join('');
    })
    .catch(function() { grid.innerHTML = '<p class="cms-empty">No testimonials yet.</p>'; });
}

// ─── EXPERIENCE ────────────────────────────────────────────
export function initExperience() {
  var timeline = document.getElementById('experience-timeline');
  if (!timeline) return;

  groqFetch('*[_type == "experience"] | order(order asc) { role, organisation, type, startDate, endDate, current, location, description, highlights }')
    .then(function(items) {
      if (!items.length) {
        timeline.style.display = 'none';
        return;
      }
      timeline.innerHTML = items.map(function(e, i) {
        var start = e.startDate ? e.startDate.substring(0, 7).replace('-', '/') : '';
        var end   = e.current ? 'Present' : (e.endDate ? e.endDate.substring(0, 7).replace('-', '/') : '');
        var period = start + (end ? ' — ' + end : '');

        var highlightsHtml = '';
        if (e.highlights && e.highlights.length) {
          highlightsHtml = '<ul class="exp-highlights">'
            + e.highlights.map(function(h) { return '<li>' + h + '</li>'; }).join('')
            + '</ul>';
        }

        var typeBadge = e.type
          ? '<span class="exp-type exp-type-' + e.type + '">' + e.type + '</span>'
          : '';

        return '<div class="exp-item reveal-item" style="animation-delay:' + (i * 80) + 'ms">'
          + '<div class="exp-dot' + (e.current ? ' exp-dot-active' : '') + '"></div>'
          + '<div class="exp-content">'
          +   '<div class="exp-header">'
          +     '<div>'
          +       '<h3 class="exp-role">' + e.role + '</h3>'
          +       '<p class="exp-org">' + e.organisation + (e.location ? ' · ' + e.location : '') + '</p>'
          +     '</div>'
          +     '<div class="exp-meta">'
          +       typeBadge
          +       '<span class="exp-period">' + period + '</span>'
          +     '</div>'
          +   '</div>'
          +   (e.description ? '<p class="exp-desc">' + e.description + '</p>' : '')
          +   highlightsHtml
          + '</div>'
          + '</div>';
      }).join('');
    })
    .catch(function() { timeline.innerHTML = '<p class="cms-empty">No experience entries yet.</p>'; });
}

// ─── RESEARCH ──────────────────────────────────────────────
export function initResearch() {
  var grid = document.getElementById('research-grid');
  if (!grid) return;

  groqFetch('*[_type == "research"] | order(order asc) { title, type, institution, year, abstract, tags, link, featured }')
    .then(function(items) {
      if (!items.length) {
        grid.style.display = 'none';
        return;
      }
      grid.innerHTML = items.map(function(r, i) {
        var tagsHtml = (r.tags || []).map(function(t) {
          return '<span class="research-tag">' + t + '</span>';
        }).join('');

        var linkHtml = r.link
          ? '<a href="' + r.link + '" target="_blank" rel="noopener" class="research-link">'
            + 'View Paper <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'
            + '</a>'
          : '';

        var typeLabels = {
          thesis: 'MSc Thesis', paper: 'Research Paper',
          conference: 'Conference Paper', dft: 'DFT Simulation',
          iot: 'IoT Research', edtech: 'EdTech Research'
        };

        return '<div class="research-card reveal-item" style="animation-delay:' + (i * 80) + 'ms">'
          + (r.featured ? '<div class="research-featured-badge">Featured</div>' : '')
          + '<div class="research-type">' + (typeLabels[r.type] || r.type) + '</div>'
          + '<h3 class="research-title">' + r.title + '</h3>'
          + (r.institution ? '<p class="research-inst">' + r.institution + (r.year ? ' · ' + r.year : '') + '</p>' : '')
          + (r.abstract ? '<p class="research-abstract">' + r.abstract + '</p>' : '')
          + (tagsHtml ? '<div class="research-tags">' + tagsHtml + '</div>' : '')
          + linkHtml
          + '</div>';
      }).join('');
    })
    .catch(function() { grid.innerHTML = '<p class="cms-empty">No research entries yet.</p>'; });
}

// ─── BLOG — list page ──────────────────────────────────────
export function initBlogList() {
  var grid = document.getElementById('blog-grid');
  if (!grid) return;

  groqFetch('*[_type == "post"] | order(publishedAt desc) { title, slug, excerpt, category, publishedAt, readTime, featured, coverImage }')
    .then(function(posts) {
      if (!posts.length) {
        grid.innerHTML = '<div class="blog-empty"><p>No posts yet. Check back soon!</p></div>';
        return;
      }

      var catLabels = {
        physics: 'Physics & Science', edtech: 'EdTech', dev: 'Web Dev',
        afacsims: 'AfacSIMS', 'nigerian-tech': 'Nigerian Tech',
        va: 'Virtual Assistant', career: 'Career'
      };

      grid.innerHTML = posts.map(function(p, i) {
        var date = p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        var imgHtml = p.coverImage
          ? '<img src="' + imageUrl(p.coverImage.asset._ref) + '" alt="' + p.title + '" class="blog-thumb">'
          : '<div class="blog-thumb-placeholder"></div>';

        return '<article class="blog-card reveal-item' + (p.featured ? ' blog-card-featured' : '') + '" style="animation-delay:' + (i * 80) + 'ms" onclick="window.location.href=\'#blog-post-' + p.slug.current + '\'">'
          + imgHtml
          + '<div class="blog-card-body">'
          +   '<div class="blog-meta">'
          +     (p.category ? '<span class="blog-cat">' + (catLabels[p.category] || p.category) + '</span>' : '')
          +     '<span class="blog-date">' + date + '</span>'
          +     (p.readTime ? '<span class="blog-read">' + p.readTime + ' min read</span>' : '')
          +   '</div>'
          +   '<h3 class="blog-title">' + p.title + '</h3>'
          +   '<p class="blog-excerpt">' + p.excerpt + '</p>'
          +   '<span class="blog-more">Read more →</span>'
          + '</div>'
          + '</article>';
      }).join('');
    })
    .catch(function() {
      grid.innerHTML = '<div class="blog-empty"><p>Could not load posts right now.</p></div>';
    });
}
