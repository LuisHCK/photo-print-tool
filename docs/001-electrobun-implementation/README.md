# 001 — Basic Electrobun Implementation

Wrap the existing Vite + React PWA in Electrobun with minimal changes to the frontend codebase. Keep Vite as the frontend build tool; Electrobun loads the compiled output.

---

## Goals

- Launch the existing app as a native desktop window via Electrobun
- Keep `bun run dev` working for both Vite and Electrobun
- Preserve the PWA as a deployment option (shared source)
- Add minimal native shell (window menu, app icon, standard window chrome)

---

## Architecture

```
src/
├── bun/                    # NEW — Bun main process (Electrobun entrypoint)
│   └── index.ts
├── mainview/               # NEW — Electrobun view wrapper (optional preload)
│   └── preload.ts
├── ... (existing src/)
└── (rest of Vite app unchanged)

electrobun.config.ts        # NEW — Electrobun build config
package.json                # MODIFIED — add electrobun deps + scripts
vite.config.ts              # MODIFIED — update build output path
```

---

## Steps

### 1. Install ElectroBun

```bash
bun add electrobun
```

Add `@types/bun` to devDependencies if not present.

### 2. Create the main process entrypoint

`src/bun/index.ts` — the Electrobun Bun process that opens the window:

```ts
import { BrowserWindow, ApplicationMenu } from "electrobun/bun"

const menu = new ApplicationMenu([
  {
    label: "Photo Print",
    submenu: [
      { role: "about" },
      { type: "separator" },
      { role: "quit" },
    ],
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
    ],
  },
  {
    label: "View",
    submenu: [
      { role: "reload" },
      { role: "toggleDevTools" },
      { type: "separator" },
      { role: "zoomIn" },
      { role: "zoomOut" },
    ],
  },
])

const win = new BrowserWindow({
  title: "Photo Print Tool",
  url: "views://mainview/index.html",
  frame: {
    width: 1400,
    height: 900,
  },
  titleBarStyle: "default",
})
```

### 3. Configure Electrobun

`electrobun.config.ts` at project root:

```ts
import { defineConfig } from "electrobun/config"

export default defineConfig({
  app: {
    name: "Photo Print Tool",
    identifier: "com.photo-print.app",
    version: "0.1.0",
  },
  build: {
    bun: {
      entrypoint: "src/bun/index.ts",
    },
    views: {
      mainview: {
        entrypoint: "dist/index.html",
      },
    },
  },
})
```

Note: `views.mainview.entrypoint` points to the Vite `dist/` folder. Electrobun bundles these static assets under the `views://` scheme.

### 4. Update Vite config

`vite.config.ts` — set `base` to relative paths so the built files work under `views://`:

```ts
export default defineConfig({
  base: "./",  // ADD this — required for views:// scheme
  plugins: [/* ... */],
  // ...
})
```

### 5. Update package.json

Add scripts:

```json
{
  "scripts": {
    "dev": "vite build --watch & electrobun dev --watch",
    "dev:vite": "vite",
    "dev:electrobun": "electrobun dev --watch",
    "build": "vite build && electrobun build",
    "start": "electrobun dev"
  }
}
```

Note: The `dev` script runs Vite build in watch mode and Electrobun in dev mode concurrently. Use `concurrently` or `npm-run-all` for cleaner parallel execution.

### 6. Create a preload script (optional)

`src/mainview/preload.ts` — runs before app JS, useful for exposing native APIs later:

```ts
// Expose native APIs to the webview
// This will be expanded in step 2 (printer bridge)
```

### 7. Dev workflow

```bash
# Terminal 1 — build frontend on changes
bun run dev:vite

# Terminal 2 — run Electrobun (hot-reloads on dist/ changes)
bun run dev:electrobun
```

Or with a tool like `concurrently`:

```bash
bun add -D concurrently
```

```json
{
  "scripts": {
    "dev": "concurrently \"bun run dev:vite\" \"bun run dev:electrobun\""
  }
}
```

### 8. Production build

```bash
bun run build
```

This runs `vite build` then `electrobun build`, producing a distributable app bundle under `artifacts/`.

---

## Files changed

| File | Action |
|------|--------|
| `src/bun/index.ts` | Create |
| `electrobun.config.ts` | Create |
| `vite.config.ts` | Modify (add `base: './'`) |
| `package.json` | Modify (add deps + scripts) |
| `tsconfig.json` | Modify (add `src/bun` to include if needed) |
| `.gitignore` | Modify (add `artifacts/`, `dist/`) |

---

## What stays the same

- All React components, hooks, types, and libs — untouched
- PWA manifest and service worker — still served when deployed as web app
- CSS, i18n, analytics — unaffected
- `window.print()` — still works as fallback (replaced in step 2)

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| `window` / `document` access in main process code | Main process runs in Bun, not a browser — no DOM. Keep browser-specific code in `src/` only. |
| `localStorage` / `indexedDB` in main process | These are web APIs — only used in the frontend. Main process uses Bun's `node:fs` or `SQLite` if needed. |
| Path resolution changes with `base: './'` | Test that all asset imports (images, fonts, favicon) work with relative paths. |
| ElectroBun API instability | Pin exact version in `package.json`. Monitor changelog for breaking changes. |

---

## Next steps after this plan is implemented

- Verify the app opens in a native window
- Confirm that print preview and `window.print()` still works
- Migrate to the printer bridge (see `/docs/002-electrobun-printer-bridge/`)
