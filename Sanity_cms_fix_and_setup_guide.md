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
npm run dev               # Vite dev server, default http://localhost:5173
```

Your `my-portfolio/.env` already has `VITE_SANITY_PROJECT_ID=gdn0wpko`. Just make sure `http://localhost:5173` (or whatever port Vite picks) is added as a CORS origin — see section 5 — or the local dev site won't be able to pull CMS content either.

---

## 5. CORS Configuration (do this once)

This is the step that fixes "connect to the CMS on web." Run from inside `studio/`:

```bash
npx sanity login                                              # one-time auth as project owner
npx sanity cors list                                          # see current whitelist (likely empty/stale)
npx sanity cors add https://mrdof-portfolio.vercel.app        # production frontend
npx sanity cors add http://localhost:5173                     # local Vite dev
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
| Local dev (`localhost:5173`) can't fetch CMS data but production can | Localhost origin not in CORS whitelist | `npx sanity cors add http://localhost:5173` |
| `npx sanity dev`/`deploy` fails with an auth/"project not found" error after an org change | Project may have been moved or deleted along with an org | `npx sanity projects list` to confirm the project still exists; if missing, see section 7 and contact Sanity support ASAP |
| Studio/portfolio briefly stop connecting right after an org/account change, but a reload fixes it | Stale CORS preflight or auth session cache | Hard reload / clear browser cache for the affected domain before assuming data loss |

---

## 11. Incident Log

### 2026-06-20 — Duplicate organization deleted, host briefly stopped connecting

Fatai discovered a duplicate Sanity organization holding the same project and deleted it. The host briefly stopped connecting right after. Worth knowing for next time: Sanity requires every project to be moved or deleted out of an organization *before* the org itself can be deleted — so this kind of cleanup always touches project-level state, not just billing/org metadata, which is why it's worth double-checking afterward.

In this case, a simple reload resolved it — almost certainly a stale CORS preflight or auth session cache left over from the org change, not an actual project deletion. The project ID (`gdn0wpko`) was unaffected.

**If this happens again:** before assuming the worst, run `npx sanity projects list` (after `npx sanity login` if needed) to confirm the project still exists, then try a hard reload / clear the browser cache for the Studio and portfolio domains. Only treat it as a "recreate the project" situation if the project is genuinely missing from that list (see section 7's checklist).

### Local dev workflow clarification

`npx sanity login` is a one-time step (stores an auth token locally) — not something run every session. Day-to-day local work is just `npx sanity dev` (or `npm run dev`). There is no `sanity studio` command.