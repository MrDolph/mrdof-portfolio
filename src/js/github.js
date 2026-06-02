// github.js — fetches pinned repos for MrDolph and renders project cards

const GITHUB_USERNAME = 'MrDolph';

// GitHub GraphQL API — pinned repos (no auth needed for public data)
// Falls back to REST top-repos if GraphQL is unavailable
async function fetchPinnedRepos() {
  const query = `{
    user(login: "${GITHUB_USERNAME}") {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            url
            homepageUrl
            stargazerCount
            forkCount
            primaryLanguage { name color }
            repositoryTopics(first: 6) {
              nodes { topic { name } }
            }
            updatedAt
            openGraphImageUrl
            isPrivate
            licenseInfo { name }
            defaultBranchRef { name }
          }
        }
      }
    }
  }`;

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    // GraphQL requires auth — fall back to REST if blocked
    if (!res.ok) throw new Error('GraphQL needs auth');
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0].message);
    return json.data.user.pinnedItems.nodes;
  } catch {
    // Fallback: REST API — sorted by stars, skip forks
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=30`
    );
    if (!res.ok) throw new Error('GitHub API unavailable');
    const repos = await res.json();
    return repos
      .filter(r => !r.fork && !r.private)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 6)
      .map(r => ({
        name: r.name,
        description: r.description,
        url: r.html_url,
        homepageUrl: r.homepage,
        stargazerCount: r.stargazers_count,
        forkCount: r.forks_count,
        primaryLanguage: r.language ? { name: r.language, color: null } : null,
        repositoryTopics: { nodes: (r.topics || []).map(t => ({ topic: { name: t } })) },
        updatedAt: r.updated_at,
        openGraphImageUrl: null,
        licenseInfo: r.license ? { name: r.license.name } : null
      }));
  }
}

// Language → color map for common languages (fallback when GraphQL color unavailable)
const LANG_COLORS = {
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
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return 'today';
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

function formatName(name) {
  return name.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function buildCard(repo, index) {
  const topics = (repo.repositoryTopics?.nodes || [])
    .map(n => n.topic.name)
    .slice(0, 4);

  const topicsHtml = topics.length
    ? `<div class="gh-topics">${topics.map(t => `<span class="gh-topic">${t}</span>`).join('')}</div>`
    : '';

  const liveLink = repo.homepageUrl
    ? `<a href="${repo.homepageUrl}" class="gh-btn gh-btn-live" target="_blank" rel="noopener">
         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
         Live demo
       </a>`
    : '';

  const langHtml = repo.primaryLanguage
    ? `<span class="gh-lang">
         <span class="gh-lang-dot" style="background:${langColor(repo.primaryLanguage)}"></span>
         ${repo.primaryLanguage.name}
       </span>`
    : '';

  const desc = repo.description || 'No description provided.';

  return `
    <article class="gh-card" style="animation-delay:${index * 80}ms">
      <div class="gh-card-body">
        <div class="gh-card-header">
          <svg class="gh-repo-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z"/></svg>
          <a class="gh-card-title" href="${repo.url}" target="_blank" rel="noopener">${formatName(repo.name)}</a>
          <span class="gh-badge">Public</span>
        </div>
        <p class="gh-card-desc">${desc}</p>
        ${topicsHtml}
      </div>
      <div class="gh-card-footer">
        <div class="gh-meta">
          ${langHtml}
          <span class="gh-stat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ${repo.stargazerCount}
          </span>
          <span class="gh-stat">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
            ${repo.forkCount}
          </span>
          <span class="gh-updated">Updated ${timeAgo(repo.updatedAt)}</span>
        </div>
        <div class="gh-actions">
          ${liveLink}
          <a href="${repo.url}" class="gh-btn gh-btn-code" target="_blank" rel="noopener">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            Source
          </a>
        </div>
      </div>
    </article>`;
}

function buildSkeletons(count = 3) {
  return Array.from({ length: count }, (_, i) => `
    <div class="gh-card gh-skeleton" style="animation-delay:${i * 80}ms">
      <div class="gh-card-body">
        <div class="gh-skel gh-skel-title"></div>
        <div class="gh-skel gh-skel-line"></div>
        <div class="gh-skel gh-skel-line gh-skel-short"></div>
        <div style="display:flex;gap:6px;margin-top:12px">
          <div class="gh-skel gh-skel-tag"></div>
          <div class="gh-skel gh-skel-tag"></div>
        </div>
      </div>
    </div>`).join('');
}

export async function initGitHubProjects() {
  const container = document.getElementById('gh-projects-grid');
  const statusEl = document.getElementById('gh-status');
  if (!container) return;

  // Show skeletons while loading
  container.innerHTML = buildSkeletons(3);

  try {
    const repos = await fetchPinnedRepos();

    if (!repos || repos.length === 0) {
      container.innerHTML = `
        <div class="gh-empty">
          <p>No pinned repositories found.</p>
          <a href="https://github.com/${GITHUB_USERNAME}" target="_blank" rel="noopener">Pin repos on GitHub →</a>
        </div>`;
      return;
    }

    if (statusEl) {
      statusEl.textContent = `${repos.length} project${repos.length !== 1 ? 's' : ''} · auto-synced from GitHub`;
    }

    container.innerHTML = repos.map((r, i) => buildCard(r, i)).join('');

  } catch (err) {
    console.error('GitHub fetch failed:', err);
    container.innerHTML = `
      <div class="gh-empty">
        <p>Couldn't load projects right now.</p>
        <a href="https://github.com/${GITHUB_USERNAME}" target="_blank" rel="noopener">View on GitHub →</a>
      </div>`;
  }
}
