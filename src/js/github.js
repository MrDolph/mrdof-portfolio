// github.js — fetches pinned + starred repos for MrDolph
// Uses VITE_GITHUB_TOKEN env var (set in Vercel) for GraphQL pinned repos
// Falls back to REST starred repos if token unavailable

var GITHUB_USERNAME = 'MrDolph';
var GH_TOKEN = (typeof import.meta !== 'undefined' && import.meta.env)
  ? import.meta.env.VITE_GITHUB_TOKEN
  : '';

var LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  HTML: '#e34c26', CSS: '#563d7c', Rust: '#dea584', Go: '#00ADD8',
  Java: '#b07219', 'C++': '#f34b7d', C: '#555555', Ruby: '#701516',
  PHP: '#4F5D95', Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB',
  Vue: '#41b883', SCSS: '#c6538c', Shell: '#89e051'
};

function langColor(lang) {
  if (!lang) return '#888';
  return LANG_COLORS[lang.name] || lang.color || '#888';
}

function timeAgo(dateStr) {
  var diff = Date.now() - new Date(dateStr).getTime();
  var d = Math.floor(diff / 86400000);
  if (d < 1) return 'today';
  if (d < 7) return d + 'd ago';
  if (d < 30) return Math.floor(d / 7) + 'w ago';
  if (d < 365) return Math.floor(d / 30) + 'mo ago';
  return Math.floor(d / 365) + 'y ago';
}

function formatName(name) {
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
}

function getTopics(repo) {
  if (!repo.repositoryTopics) return [];
  if (!repo.repositoryTopics.nodes) return [];
  return repo.repositoryTopics.nodes.map(function(n) { return n.topic.name; }).slice(0, 4);
}

function buildCard(repo, index, badge) {
  var topics = getTopics(repo);
  var desc = repo.description || 'No description provided.';
  var delay = index * 80;

  var topicsHtml = topics.length
    ? '<div class="gh-topics">' + topics.map(function(t) { return '<span class="gh-topic">' + t + '</span>'; }).join('') + '</div>'
    : '';

  var liveLink = repo.homepageUrl
    ? '<a href="' + repo.homepageUrl + '" class="gh-btn gh-btn-live" target="_blank" rel="noopener">'
      + '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
      + ' Live</a>'
    : '';

  var langHtml = repo.primaryLanguage
    ? '<span class="gh-lang"><span class="gh-lang-dot" style="background:' + langColor(repo.primaryLanguage) + '"></span>' + repo.primaryLanguage.name + '</span>'
    : '';

  var badgeHtml = badge
    ? '<span class="gh-badge gh-badge-' + badge.type + '">' + badge.label + '</span>'
    : '<span class="gh-badge">Public</span>';

  return '<article class="gh-card" style="animation-delay:' + delay + 'ms">'
    + '<div class="gh-card-body">'
      + '<div class="gh-card-header">'
        + '<svg class="gh-repo-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z"/></svg>'
        + '<a class="gh-card-title" href="' + repo.url + '" target="_blank" rel="noopener">' + formatName(repo.name) + '</a>'
        + badgeHtml
      + '</div>'
      + '<p class="gh-card-desc">' + desc + '</p>'
      + topicsHtml
    + '</div>'
    + '<div class="gh-card-footer">'
      + '<div class="gh-meta">'
        + langHtml
        + '<span class="gh-stat"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' + repo.stargazerCount + '</span>'
        + '<span class="gh-stat"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>' + repo.forkCount + '</span>'
        + '<span class="gh-updated">Updated ' + timeAgo(repo.updatedAt) + '</span>'
      + '</div>'
      + '<div class="gh-actions">'
        + liveLink
        + '<a href="' + repo.url + '" class="gh-btn gh-btn-code" target="_blank" rel="noopener">'
          + '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
          + ' Source</a>'
      + '</div>'
    + '</div>'
  + '</article>';
}

function buildSkeletons(count) {
  var html = '';
  for (var i = 0; i < count; i++) {
    html += '<div class="gh-card gh-skeleton" style="animation-delay:' + (i * 80) + 'ms">'
      + '<div class="gh-card-body">'
        + '<div class="gh-skel gh-skel-title"></div>'
        + '<div class="gh-skel gh-skel-line"></div>'
        + '<div class="gh-skel gh-skel-line gh-skel-short"></div>'
        + '<div style="display:flex;gap:6px;margin-top:12px">'
          + '<div class="gh-skel gh-skel-tag"></div>'
          + '<div class="gh-skel gh-skel-tag"></div>'
        + '</div>'
      + '</div>'
    + '</div>';
  }
  return html;
}

function normaliseRest(repos, isFork) {
  return repos
    .filter(function(r) { return !r.private && (isFork ? true : !r.fork); })
    .map(function(r) {
      var topics = (r.topics || []).map(function(t) { return { topic: { name: t } }; });
      return {
        name: r.name,
        description: r.description,
        url: r.html_url,
        homepageUrl: r.homepage,
        stargazerCount: r.stargazers_count,
        forkCount: r.forks_count,
        primaryLanguage: r.language ? { name: r.language, color: null } : null,
        repositoryTopics: { nodes: topics },
        updatedAt: r.updated_at,
      };
    });
}

function fetchPinnedGraphQL() {
  if (!GH_TOKEN) return Promise.reject(new Error('No token'));
  var query = '{ user(login: "' + GITHUB_USERNAME + '") { pinnedItems(first: 6, types: REPOSITORY) { nodes { ... on Repository { name description url homepageUrl stargazerCount forkCount primaryLanguage { name color } repositoryTopics(first: 6) { nodes { topic { name } } } updatedAt } } } } }';
  return fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'bearer ' + GH_TOKEN },
    body: JSON.stringify({ query: query })
  })
  .then(function(res) {
    if (!res.ok) throw new Error('GraphQL failed');
    return res.json();
  })
  .then(function(json) {
    if (json.errors) throw new Error(json.errors[0].message);
    return json.data.user.pinnedItems.nodes;
  });
}

function fetchStarred() {
  return fetch('https://api.github.com/users/' + GITHUB_USERNAME + '/starred?per_page=30', {
    headers: GH_TOKEN ? { 'Authorization': 'bearer ' + GH_TOKEN } : {}
  })
  .then(function(res) {
    if (!res.ok) throw new Error('Starred fetch failed');
    return res.json();
  })
  .then(function(repos) { return normaliseRest(repos, false); });
}

function dedupeByName(pinned, starred) {
  var pinnedNames = {};
  pinned.forEach(function(r) { pinnedNames[r.name] = true; });
  return starred.filter(function(r) { return !pinnedNames[r.name]; });
}

function buildSection(title, repos, badgeType, badgeLabel, startIndex) {
  if (!repos || repos.length === 0) return '';
  var header = '<div class="gh-subsection-header"><span class="gh-subsection-title">' + title + '</span></div>';
  var cards = repos.map(function(r, i) {
    return buildCard(r, startIndex + i, { type: badgeType, label: badgeLabel });
  }).join('');
  return header + '<div class="gh-subgrid">' + cards + '</div>';
}

export function initGitHubProjects() {
  var container = document.getElementById('gh-projects-grid');
  var statusEl = document.getElementById('gh-status');
  if (!container) return;

  container.innerHTML = buildSkeletons(3);

  fetchPinnedGraphQL()
    .then(function(pinned) {
      return fetchStarred().then(function(starred) {
        var uniqueStarred = dedupeByName(pinned, starred).slice(0, 6);
        var total = pinned.length + uniqueStarred.length;

        if (statusEl) {
          statusEl.textContent = total + ' repos · pinned + starred · auto-synced';
        }

        var html = buildSection('📌 Pinned', pinned, 'pinned', 'Pinned', 0);
        html += buildSection('⭐ Starred', uniqueStarred, 'starred', 'Starred', pinned.length);
        container.innerHTML = html || '<div class="gh-empty"><p>No public repos found.</p></div>';
      });
    })
    .catch(function() {
      // No token — just show starred
      fetchStarred()
        .then(function(starred) {
          var repos = starred.slice(0, 6);
          if (statusEl) statusEl.textContent = repos.length + ' repos · auto-synced from GitHub';
          var html = buildSection('⭐ Starred', repos, 'starred', 'Starred', 0);
          container.innerHTML = html || '<div class="gh-empty"><p>No public repos found.</p></div>';
        })
        .catch(function() {
          container.innerHTML = '<div class="gh-empty"><p>Could not load repos.</p><a href="https://github.com/' + GITHUB_USERNAME + '" target="_blank" rel="noopener">View on GitHub →</a></div>';
        });
    });
}