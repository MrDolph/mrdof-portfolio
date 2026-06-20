# Sanity CMS — Debug Report & Setup Guide
**Project:** mrdof-portfolio (Studio project ID: `gdn0wpko`)
**Date:** June 20, 2026
**Repos involved:** `studio/` (Sanity Studio CMS) and `my-portfolio/` (Vite frontend that consumes it)

---

## 1. Summary

The Studio's production build (`sanity build` / `sanity deploy`) was failing silently every time it ran, which is why the `dist` folder you sent over only contained favicon/static assets with no `index.html` or app bundle — that's the "upside down" Studio. On top of that, even once the Studio itself builds correctly, the portfolio frontend couldn't talk to the Sanity Content API from the browser because no CORS origins had been whitelisted for your project. Both are now fixed locally and verified. This document covers exactly what was wrong, what changed, and how to run/deploy everything going forward.

---

## 2. Root Cause Analysis

### 2.1 Bug 1 — Broken Studio build (`structureTool` import)

`studio/sanity.config.js` had:

```js
import {structureTool} from 'sanity'
```

This is wrong on two counts:

1. **Wrong import path.** `structureTool` is exported from `sanity/structure`, not from the root `sanity` package.
2. **Wrong package version.** `structureTool` didn't exist at all until `sanity@3.24.1` (it's the renamed successor to the old `deskTool`). Your `studio/package.json` had `"sanity": "^3.22.0"` pinned — a version that predates the rename entirely.

Meanwhile `@sanity/vision` was already pinned to `^3.99.0` in the same file, so the two packages were badly out of sync with each other.

**Result:** every `sanity build` (and therefore every `sanity deploy`) failed immediately after the "Clean output folder" step with:

```
RollupError: "structureTool" is not exported by "node_modules/sanity/lib/index.esm.js"
```

Because the build crashed mid-way, only the static files that get copied early (favicons, manifest) ended up in `dist/` — never the actual `index.html` or JS bundle. That's exactly what you uploaded, and I reproduced the identical failure locally before fixing it.

### 2.2 Bug 2 — Missing CORS origins (the actual "can't connect to the CMS on web" issue)

Your frontend code in `my-portfolio/src/js/sanity.js` is correct — it queries `https://gdn0wpko.api.sanity.io/...` properly. But Sanity's Content API only allows browser requests (fetch/XHR) from origins you've explicitly whitelisted in the project's CORS settings. If your portfolio's domain(s) were never added there, the browser blocks every response with a CORS error in the console — even though the query itself is fine and would work from a server, curl, or Postman. This is almost certainly what you were experiencing as "Sanity isn't working / can't connect to the CMS on web."

### 2.3 Cleanup — invalid config key removed

`sanity.config.js` also had:

```js
__experimental_omnibus: false,
```

This isn't a real Sanity configuration option (confirmed against Sanity's docs/source) — it was a no-op left over from an earlier troubleshooting attempt. It wasn't causing harm, but it wasn't fixing anything either, so it's been removed for clarity.

---

## 3. Files Changed

### 3.1 `studio/sanity.config.js`

**Before:**
```js
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'

export default defineConfig({
  name: 'mrdof-portfolio',
  title: 'MrDOF Portfolio CMS',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'gdn0wpko',
  dataset: 'production',
  plugins: [
    structureTool({ /* ...structure config... */ }),
    visionTool(),
  ],
  schema: { types: schemaTypes },

  // Disable auto schema deployment to avoid the /@vite/env worker error
  __experimental_omnibus: false,
})
```

**After:**
```js
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'

export default defineConfig({
  name: 'mrdof-portfolio',
  title: 'MrDOF Portfolio CMS',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'gdn0wpko',
  dataset: 'production',
  plugins: [
    structureTool({ /* ...structure config... unchanged... */ }),
    visionTool(),
  ],
  schema: { types: schemaTypes },
})
```

Changes: import path corrected, invalid config key removed. Your custom structure (Blog Posts / Testimonials / Experience / Research / Credentials panes) is untouched.

### 3.2 `studio/package.json`

**Before:** `"sanity": "^3.22.0"`
**After:** `"sanity": "^3.99.0"`

This aligns `sanity` with the `@sanity/vision` version you already had pinned, and lands on the last stable 3.x release (deliberately *not* jumping to v4 — see section 8 below — to keep this a low-risk, same-major-version fix).

### 3.3 `studio/package-lock.json`

Regenerated automatically by `npm install` after the `package.json` change. You don't need a file from me for this — just run `npm install` in your `studio/` folder and it'll rebuild correctly (it's a ~700KB file, not practical to paste/attach).

### 3.4 `studio/sanity.cli.js`

**Before:**
```js
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'gdn0wpko',
    dataset: 'production'
  },
  deployment: {
    autoUpdates: false,
  }
})
```

**After:**
```js
import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'gdn0wpko',
    dataset: 'production'
  },
  studioHost: 'mrdof-portfolio',
  deployment: {
    autoUpdates: false,
  }
})
```

Added `studioHost: 'mrdof-portfolio'` after a hostname typo (`mrdof-porfolio.sanity.studio`, missing the "t") got deployed during an earlier `sanity deploy` run where the hostname was typed interactively. Locking it into config means `sanity deploy` never prompts for — and therefore can never typo — the hostname again. See section 11 for the recovery steps used to fix the live typo'd deployment.

---

## 4. Local Development Setup

You can absolutely still work locally — nothing about these fixes changes that workflow, they just make it work again.

### 4.1 Sanity Studio (the CMS admin)

```bash
cd studio
npm install              # picks up the corrected package.json/lock
npx sanity dev            # starts the Studio at http://localhost:3333
```

Your `studio/.env` already has `SANITY_STUDIO_PROJECT_ID=gdn0wpko`, so no extra env setup is needed for local dev.

**Note on `sanity login`:** this is a one-time step, not something you run on every session. It stores an auth token locally on your machine. You only need to run `npx sanity login` again if you get logged out, switch Sanity accounts, or are setting up on a new machine. Day-to-day, `npx sanity dev` is all you need — if your CLI session isn't authenticated, the Studio will prompt you to log in through the browser the first time.

**`package.json` script aliases** (run from inside `studio/`):

| Command | Maps to | Use for |
|---|---|---|
| `npm run dev` | `sanity dev` | Local Studio for editing content |
| `npm run build` | `sanity build` | Production build only (no deploy) |
| `npm run deploy` | `sanity deploy` | Build + push to your hosted Studio URL |
| `npm run start` | `sanity start` | Preview a production build locally |

There is no `sanity studio` command — that was a typo/mix-up; `sanity dev` is the one you want.

### 4.2 Portfolio frontend

```bash
cd my-portfolio
npm install
npm run dev               # Vite dev server — runs at http://localhost:3000 (pinned in vite.config.js, not Vite's 5173 default)
```

Your `my-portfolio/.env` already has `VITE_SANITY_PROJECT_ID=gdn0wpko`. Just make sure `http://localhost:3000` is added as a CORS origin — see section 5 — or the local dev site won't be able to pull CMS content either.

### 4.3 Stale/broken Vite install (`node_modules` out of sync with `package.json`)

**Symptom:** browser console shows `Uncaught TypeError: Cannot read properties of undefined (reading 'VITE_SANITY_PROJECT_ID')` at `sanity.js:5`, and the `npm run dev` terminal output prints something like:
```
vite v0.10.3
Dev server running at:
  > http://172.25.160.1:3000
  > http://169.254.81.72:3000
  ...
  > http://localhost:3000
```
**What this actually means:** `import.meta.env` is a feature Vite injects at dev-server/build time — it doesn't exist natively in the browser. If it's `undefined`, the file isn't being processed by Vite's dev pipeline at all. The giveaway is the version number and banner style: `vite v0.10.3` is a pre-1.0 release from years before `import.meta.env` or the `server.port`/`server.open` options in this project's `vite.config.js` even existed — printing every network interface on the machine instead of a single clean `Local:` line is also classic old-Vite behavior. This means `node_modules` had gotten badly out of sync with `package.json` (which correctly declares `"vite": "^8.0.16"`), not anything wrong with the Sanity/CORS setup.

**Fix — clean reinstall:**
```powershell
cd my-portfolio
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npm run dev
```
After this, the terminal should print a single clean line like `➜  Local:   http://localhost:3000/` and the `vite v8.x.x` version banner — confirming the real, current Vite is now running.

### 4.4 Static assets — the `public/` folder rule

Vite has a special rule: anything placed inside `public/` is served at the site **root**, and the `public/` part of the path is never included in the URL you reference it by. On disk: `my-portfolio/public/mrdof-logo.svg`. In code: `/mrdof-logo.svg` — never `public/mrdof-logo.svg` or `/public/mrdof-logo.svg`.

`index.html` originally had:
```html
<link rel="icon" type="image/svg+xml" href="public/mrdof-logo.svg" />
```
which triggers a Vite dev warning. The fix is **only** the reference, not the file location:
```html
<link rel="icon" type="image/svg+xml" href="/mrdof-logo.svg" />
```
Important: the file itself must stay inside `public/`. Files placed loose in the project root (outside `public/`) are not automatically copied into `dist/` during `vite build` — they might still happen to load in local dev by coincidence, but they will 404 on the live Vercel build. `public/` is the only place static assets like favicons/logos are guaranteed to survive the production build untouched.

---

## 5. CORS Configuration (do this once)

This is the step that fixes "connect to the CMS on web." Run from inside `studio/`:

```bash
npx sanity login                                              # one-time auth as project owner
npx sanity cors list                                          # see current whitelist (likely empty/stale)
npx sanity cors add https://mrdof-portfolio.vercel.app        # production frontend
npx sanity cors add http://localhost:3000                     # local Vite dev — vite.config.js pins port to 3000, NOT Vite's 5173 default
```

Add `--credentials` to any of those only if you start sending an auth token from the frontend (e.g. to preview drafts). For plain public reads (what `sanity.js` currently does), it's not needed.

If you ever attach a custom domain to the portfolio, add that origin too. You can manage all of this visually instead at **sanity.io/manage → your project → API → CORS Origins**.

---

## 6. Deployment

### 6.1 Deploy the Studio (admin CMS UI)

```bash
cd studio
npx sanity deploy
```

First time you run this you'll be asked to choose/confirm a studio hostname (e.g. `mrdof-portfolio.sanity.studio`). This command builds *and* pushes — it'll fail the same way `sanity build` did if the fix isn't in place, so if you ever see this fail again, check `sanity.config.js` imports first.

**Correcting a typo'd hostname after deployment.** `sanity deploy` doesn't let you rename a hostname in place — you have to undeploy the wrong one first, then deploy fresh to the correct one. `sanity undeploy` reads whichever hostname is currently set as `studioHost` in `sanity.cli.js`, so to remove a wrong deployment you have to point that field at the wrong name *temporarily*, undeploy, then switch it back:

1. Set `studioHost` in `sanity.cli.js` to the wrong/typo'd name → `npx sanity undeploy` (removes it)
2. Set `studioHost` back to the correct name (`mrdof-portfolio`, already the case in the current file — see section 3.4) → `npx sanity deploy` (deploys fresh, no prompt since it's locked in config)

If `npx sanity undeploy` ever responds with *"Your project has not been assigned a studio hostname or the `studioHost` provided does not exist. Nothing to undeploy"* — that means `sanity.cli.js` is currently pointed at a name that was never deployed (often because it's already been switched to the correct one). Repoint it at whichever hostname is actually live, then undeploy again.

### 6.2 Deploy the portfolio frontend

No change to your existing workflow — push to `main` and Vercel auto-deploys as before:

```bash
git add .
git commit -m "Fix Sanity Studio config + CORS"
git push origin main
```

---

## 7. Verifying Everything Works — Checklist

- [ ] `cd studio && npm install && npx sanity build` completes with no Rollup errors and produces `dist/index.html` + JS bundles
- [ ] `npx sanity deploy` succeeds and gives you a live studio URL
- [ ] Visiting the deployed studio URL loads the editor (not a blank page)
- [ ] `npx sanity cors list` shows your production domain and localhost
- [ ] Opening the deployed portfolio site, browser console shows no CORS/network errors from `sanity.js`
- [ ] Testimonials/blog/experience/research/credentials sections populate with real CMS content (or gracefully show "no content yet" if datasets are empty — not an error)
- [ ] `npm run dev` in `my-portfolio` prints a single clean `Local:` line with `vite v8.x.x` (not multiple network IPs or an old version number)
- [ ] Deployed Studio URL is `mrdof-portfolio.sanity.studio` (not the typo'd `mrdof-porfolio`)
- [ ] Favicon (`/mrdof-logo.svg`) loads correctly on both local dev and the live Vercel site
- [ ] Certificates/Projects/GitHub/YouTube/Testimonials/Experience/Research sections cap their height and become scrollable once they have enough items to overflow (test by temporarily adding extra dummy items if needed); nav arrows and fade hints appear on desktop, disappear on mobile
- [ ] Footer sits flush against the bottom of the viewport on every tab (About Me, Portfolio, Blog), even when a tab's content is short — not just on Blog

If you share the live Studio URL once you've deployed, I can check it loads correctly from my end too.

---

## 8. Heads-Up: Sanity v4 is coming

The CLI itself is now warning on every run:

> The `sanity` package is moving to v4 on July 15 and will require Node.js 20+.

Not urgent today — current fix deliberately stays on the 3.x line to minimize risk — but before July 15, double check that both your local machine and your deploy environment (Vercel build settings, if Studio is ever built there) are on Node 20 or newer, since the next `sanity` major bump will require it.

---

## 9. Quick Reference — Environment Variables

| File | Variable | Value | Used for |
|---|---|---|---|
| `studio/.env` | `SANITY_STUDIO_PROJECT_ID` | `gdn0wpko` | Studio config fallback |
| `my-portfolio/.env` | `VITE_SANITY_PROJECT_ID` | `gdn0wpko` | Frontend GROQ queries |

Both already match — no changes needed here. Project IDs are not secret and are safe in frontend code, unlike the Paystack secret key / GitHub token incident from before — keep that rule going forward.

---

## 10. Troubleshooting Reference

| Symptom | Likely cause | Fix |
|---|---|---|
| `sanity build`/`deploy` fails with `RollupError ... not exported` | Plugin imported from wrong path, or package version too old | Check `sanity.config.js` imports match installed `sanity` version's export paths |
| Studio `dist/` missing `index.html` | Build crashed partway (see above) | Re-run `sanity build` after fixing config; check terminal output for the real error |
| Browser console shows CORS/network errors when loading portfolio | Origin not whitelisted | `npx sanity cors add <your-origin>` |
| `groqFetch` resolves to empty arrays everywhere, no console errors | CORS is fine, but dataset has no published documents of that type | Add/publish content in the Studio |
| Local dev (`localhost:3000`) can't fetch CMS data but production can | Localhost origin not in CORS whitelist (note: this project's Vite dev server is pinned to port 3000, not the 5173 default) | `npx sanity cors add http://localhost:3000` |
| Page looks correct up top but everything below a certain point (Certificates, Hire Me, Calendar, Footer) is blank | Scroll-reveal animation (`checkReveal` in `animations.js`) only fires on real browser `scroll` events plus one check 100ms after load — it doesn't account for content below the initial viewport on page-load alone | Scroll down manually in the live browser tab to confirm content appears; this is expected behavior, not a bug, unless content still doesn't appear after manual scrolling |
| `npx sanity dev`/`deploy` fails with an auth/"project not found" error after an org change | Project may have been moved or deleted along with an org | `npx sanity projects list` to confirm the project still exists; if missing, see section 7 and contact Sanity support ASAP |
| Studio/portfolio briefly stop connecting right after an org/account change, but a reload fixes it | Stale CORS preflight or auth session cache | Hard reload / clear browser cache for the affected domain before assuming data loss |
| `npx sanity undeploy` says "studioHost provided does not exist. Nothing to undeploy" | `sanity.cli.js`'s `studioHost` is pointed at a name that isn't actually the live one (often because it was already corrected) | Temporarily set `studioHost` to whichever hostname is actually deployed, undeploy, then set it back |
| Browser console: `Uncaught TypeError: Cannot read properties of undefined (reading 'VITE_SANITY_PROJECT_ID')`, terminal shows `vite v0.x.x` and prints multiple network IPs instead of one `Local:` line | `node_modules` badly out of sync with `package.json` — an ancient pre-1.0 Vite is actually running, not the `^8.0.16` declared | Clean reinstall: delete `node_modules` and `package-lock.json`, `npm install`, restart `npm run dev` |
| Vite dev warning: "Files in the public directory are served at the root path. Instead of `/public/x`, use `/x`" | Asset reference includes the `public/` prefix in the path | Fix the reference only (drop `public/` from the `href`/`src`) — do NOT move the file out of `public/`, or it won't be included in the production build |

---

## 11. Incident Log

### 2026-06-20 — Duplicate organization deleted, host briefly stopped connecting

Fatai discovered a duplicate Sanity organization holding the same project and deleted it. The host briefly stopped connecting right after. Worth knowing for next time: Sanity requires every project to be moved or deleted out of an organization *before* the org itself can be deleted — so this kind of cleanup always touches project-level state, not just billing/org metadata, which is why it's worth double-checking afterward.

In this case, a simple reload resolved it — almost certainly a stale CORS preflight or auth session cache left over from the org change, not an actual project deletion. The project ID (`gdn0wpko`) was unaffected.

**If this happens again:** before assuming the worst, run `npx sanity projects list` (after `npx sanity login` if needed) to confirm the project still exists, then try a hard reload / clear the browser cache for the Studio and portfolio domains. Only treat it as a "recreate the project" situation if the project is genuinely missing from that list (see section 7's checklist).

### Local dev workflow clarification

`npx sanity login` is a one-time step (stores an auth token locally) — not something run every session. Day-to-day local work is just `npx sanity dev` (or `npm run dev`). There is no `sanity studio` command.

### 2026-06-20 (cont.) — Studio hostname typo'd during deploy

A `sanity deploy` run had the hostname typed interactively as `mrdof-porfolio` (missing the "t") instead of `mrdof-portfolio`, so the live Studio briefly sat at the wrong `.sanity.studio` address. Fixed by temporarily pointing `studioHost` in `sanity.cli.js` at the typo'd name, running `npx sanity undeploy` to remove it, then switching `studioHost` back to `mrdof-portfolio` and running `npx sanity deploy` fresh. `studioHost` is now permanently locked into `sanity.cli.js` (see section 3.4) so the hostname is never prompted for — and can't be mistyped — again.

### 2026-06-20 (cont.) — Local CORS fix appeared not to work; actual cause was a broken Vite install

After correctly adding `http://localhost:3000` to the CORS allow-list, local dev still failed — but with a completely different error than CORS (`Cannot read properties of undefined (reading 'VITE_SANITY_PROJECT_ID')`). Traced to `node_modules` in `my-portfolio` being badly out of sync with `package.json`: the terminal showed `vite v0.10.3` actually running, a pre-1.0 release with no `import.meta.env` support, despite `package.json` declaring `^8.0.16`. None of the CORS/Sanity work was at fault. Fixed with a clean reinstall (`Remove-Item -Recurse -Force node_modules`, `Remove-Item package-lock.json`, `npm install`). See section 4.3.

**Lesson:** when local dev breaks right after working on something unrelated (CORS, deploy, etc.), check the dev server's own startup banner for anomalies before assuming the most recent change is the cause — version/environment drift in `node_modules` is invisible until something like this surfaces it.

### 2026-06-20 (cont.) — Favicon moved out of `public/` by mistake

A Vite warning ("Files in the public directory are served at the root path... use `/mrdof-logo.svg`") was initially misread as an instruction to move the file out of `public/`. The warning is actually about the *reference path* in `index.html`, not the file's location. Corrected: file stays in `public/mrdof-logo.svg`; the `href` in `index.html` changed from `"public/mrdof-logo.svg"` to `"/mrdof-logo.svg"`. See section 4.4 for why moving the file itself would have broken the Vercel production build.

---

## 12. Feature: Scroll Panels (bounded-height growing sections)

### 12.1 Why

Several sections accumulate content indefinitely over time — certificates, featured projects, GitHub repos, YouTube videos, testimonials, experience entries, research papers. Left as plain CSS grids, each new item just makes the page taller, which on the About Me and Portfolio tabs means multiple growing sections stacking on top of each other and cramping the page, especially on mobile.

### 12.2 What changed

A reusable `.scroll-panel` component was added: it wraps an existing grid/list element without altering the element itself (same ID, same class, same content). While a section has few items it looks and behaves exactly as before — no visible cap, no scrollbar. Once content height exceeds a max-height threshold, that section becomes its own contained, vertically scrollable box instead of pushing the rest of the page down.

**Visual behavior once a section overflows:**
- Thin scrollbar styled in the site's gold accent (`var(--secondary)`)
- Soft fade gradient at the top and/or bottom edge — only visible when there's actually more content in that direction (not shown if you're already at the top/bottom, or if the section doesn't overflow at all)
- Small circular up/down arrow buttons (desktop only) for click-to-scroll, same visibility logic as the fades
- Smooth scroll behavior, respecting `prefers-reduced-motion`

**Mobile (≤768px):**
- Max-height shrinks to 420px (480px for the larger image-card sections), so panels don't dominate a small screen
- The click arrows are hidden — touch scrolling is the natural gesture there, so they'd just be clutter
- Fade hints stay, as a visual cue there's more to swipe through

**Async content handling:** several of these sections (Testimonials, Experience, Research, GitHub Projects) populate after page load via API calls. The scroll behavior uses a `MutationObserver` on each panel's content, so it correctly activates/updates whenever that content actually arrives — not dependent on guessing a fixed delay.

### 12.3 Files changed

**`src/css/main.css`** — new component block appended at the end of the file (`SCROLL PANELS` section): `.scroll-panel`, `.scroll-panel-viewport`, `.scroll-panel--lg` (the 680px preset for image-heavy cards), `.scroll-fade` / `.scroll-fade-top` / `.scroll-fade-bottom`, `.scroll-nav` / `.scroll-nav-up` / `.scroll-nav-down`, plus the `prefers-reduced-motion` and `max-width: 768px` overrides. Nothing existing in the file was modified, only appended to.

**`src/js/scrollPanels.js`** (new file) — exports `initScrollPanels()`. Finds every `.scroll-panel` on the page, wires up its nav buttons, and uses a `MutationObserver` + scroll/resize listeners to toggle the `is-scrolled` / `has-more-below` classes that drive fade and button visibility.

**`src/js/app.js`** — added `import { initScrollPanels } from './scrollPanels.js'` and a single `initScrollPanels();` call inside `initApp()`, alongside the other init calls.

**`index.html`** — seven sections had their existing grid element wrapped in the new markup pattern (existing `id`/`class` on the grid itself untouched, just wrapped):
```html
<div class="scroll-panel">   <!-- or "scroll-panel scroll-panel--lg" for image-heavy ones -->
  <div class="scroll-fade scroll-fade-top" aria-hidden="true"></div>
  <button class="scroll-nav scroll-nav-up" type="button" aria-label="Scroll up"><i class="fas fa-chevron-up"></i></button>
  <div class="[original-class] scroll-panel-viewport" id="[original-id]">
    <!-- original content, completely unchanged -->
  </div>
  <button class="scroll-nav scroll-nav-down" type="button" aria-label="Scroll down"><i class="fas fa-chevron-down"></i></button>
  <div class="scroll-fade scroll-fade-bottom" aria-hidden="true"></div>
</div>
```
Also fixed the favicon `href` while in this file (see section 4.4 / incident log — file stays in `public/`, reference changed from `"public/mrdof-logo.svg"` to `"/mrdof-logo.svg"`).

### 12.4 Settings — which sections got which preset

| Section | Element | Preset | Why |
|---|---|---|---|
| Featured Projects | `.featured-grid` | `scroll-panel--lg` (680px) | Tall image-led cards |
| GitHub Projects | `#gh-projects-grid` | default (560px) | Medium-density cards |
| YouTube Videos | `#youtube-grid` | default (560px) | Medium thumbnail cards |
| Certificates & Badges | `#certs-grid` | `scroll-panel--lg` (680px) | Tall image-led cards |
| Testimonials | `#testimonials-grid` | default (560px) | Medium-density cards |
| Experience | `#experience-timeline` | default (560px) | Compact list, shows ~3-4 entries |
| Research | `#research-grid` | default (560px) | Medium-density cards |

**Deliberately left unbounded:**
- **Blog grid** (`#blog-grid`) — sits alone on its own dedicated tab rather than stacked against other sections, so it isn't competing for page space the way About Me / Portfolio tab content is.
- **Credentials strip** (`#credentials-strip`) — small pills that already wrap gracefully onto new lines; capping that one would create an oddly tiny scrollbox for lightweight content.

Both can be added to the pattern later if that changes — just wrap them the same way.

### 12.5 Side note: unused CSS files

While working in `src/css/`, noticed `github.css`, `hire.css`, and `style.css` aren't referenced anywhere — `index.html` only links `main.css` and `cms.css`. `main.css` already has its own complete (and more current) versions of everything those three files contain, so they're dead leftovers from before the CSS got consolidated, not a missing dependency. Safe to delete; not done automatically since deleting files wasn't asked for.

---

## 13. Incident Log (cont.)

### 2026-06-20 (cont.) — Added bounded-height scroll panels to growing sections

Certificates, Featured Projects, GitHub Projects, YouTube Videos, Testimonials, Experience, and Research were all uncapped grids that would make the page progressively longer/more cramped as content is added over time (mobile especially). Added a reusable `.scroll-panel` wrapper component (CSS in `main.css`, behavior in new `src/js/scrollPanels.js`) that caps each section's height once it overflows, with a styled scrollbar, edge fade hints, and click-to-scroll buttons on desktop. See section 12 for full details. Verified with `npx vite build` — compiles clean, no structural HTML issues (checked with a tag-balance parse across the whole file).

---

## 14. Bug Fix: Footer not pinned to viewport bottom on short tabs

### 14.1 Symptom

Footer only appeared "stuck" to the bottom of the screen on the Blog tab. On About Me and Portfolio, when their content was short, the footer ended up floating partway up the page with empty background visible beneath it instead of sitting flush against the bottom edge.

### 14.2 Why this happened

Two separate things combined to cause it:

1. **No sticky-footer layout existed at all.** `#root` had zero CSS rules, and `.footer` was a plain block element with `margin-top: 2rem`. Nothing tied the page to at least the viewport's height — the footer just sat wherever the content above it happened to end.

2. **Page height varies by active tab, by design.** The tab-switching CSS (`.content` / `.content.active`) uses `position: absolute` for inactive tabs and `position: relative` for the active one, so `.wrap`'s rendered height is only ever the *active* tab's content height — the other two tabs contribute nothing to page height while hidden. So whichever tab is shortest makes the whole page shortest in that moment.

Put together: Blog only ever "looked right" by coincidence, because its content (or even its empty "no posts yet" state) happened to push total page height past the viewport, landing the footer at the genuine end of a tall page. It was never actually pinned to anything — there was no mechanism that would have made it behave consistently across tabs.

### 14.3 The fix

Standard flexbox sticky-footer pattern, three small edits in `src/css/main.css`:

```css
/* before */
html { scroll-behavior: smooth; scroll-padding-top: 80px; }
body { font-family: 'Inter', sans-serif; /* ...existing properties... */ }

/* after */
html { scroll-behavior: smooth; scroll-padding-top: 80px; height: 100%; }
body { font-family: 'Inter', sans-serif; /* ...existing properties... */ min-height: 100%; }

/* new rule, didn't exist before */
#root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}
```

And the existing `.footer` rule:
```css
/* before */
.footer { background: var(--primary); color: #fff; text-align: center; padding: 2.5rem 1rem; margin-top: 2rem; }

/* after */
.footer { background: var(--primary); color: #fff; text-align: center; padding: 2.5rem 1rem; margin-top: auto; }
```

**Why `margin-top: auto` is the actual fix:** inside a flex column, a child with `margin-top: auto` absorbs all the leftover space above itself and gets pushed to the very end of the container. On a short tab, that leftover space exists (because `#root` is guaranteed at least `100vh` tall), so the footer's margin expands to fill it, pinning the footer to the viewport bottom. On a tall tab (lots of blog posts, lots of CMS content once populated), there's no leftover space to absorb, so the footer just flows naturally after the content — identical to how it already behaved before this fix. This is why Blog's appearance doesn't change at all; only the previously-broken short-tab cases do.

**Checked for regressions:** changing `margin-top` from a fixed `2rem` to `auto` could in theory remove breathing room above the footer on tall pages (where the auto margin resolves to 0 instead of 2rem). Not an issue here — `.calendar-section` (the element directly above the footer) already has `padding: 3rem 2rem 4rem` baked in independently, so there's still a solid visual gap before the footer regardless of what the footer's own margin resolves to.

Verified with `npx vite build` — compiles clean.

### 14.4 Why this needed fixing now specifically

This bug existed before the scroll-panel work, but capping the growing sections (section 12) makes content height *more* likely to fall short of the viewport going forward — meaning this bug would have surfaced more and more often as those sections filled up and stopped pushing the page taller indefinitely. Fixing it now closes that gap properly rather than leaving it to resurface unpredictably later.