# Photo Print Tool

Photo Print Tool is a React app for creating precise, repeatable photo print layouts.
It’s built for real print workflows where dimensions, spacing, and consistency matter.

![Photo-Print-Tool-Precise-Print-Layouts-02-27-2026_01_37_PM](https://github.com/user-attachments/assets/09866340-b85f-4395-ad63-969f820d0d07)

## Try it in your browser

You can try the app instantly without installing anything and without creating an account:

[Try it now](https://photoprint.memoriasdevidafoto.com/)

Everything runs client-side in your browser.

## Highlights

- Exact print sizing with unit support (`mm`, `cm`, `in`)
- Built-in paper and layout presets (single, multi-photo, contact sheet, passport/ID)
- Manual photo controls (fit/fill, rotate, optional manual position nudges)
- User-controlled copies per page (custom rows/columns)
- Custom presets saved locally
- Zoom in/out on the preview canvas
- Multi-language UI (English + Spanish LATAM)
- Print-friendly output with browser `window.print()`
- PWA — works offline with automatic updates
- Custom event tracking (Umami)

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- i18next + react-i18next
- Bun

## Run the project

### 1) Install dependencies

```bash
bun install
```

### 2) Start development server

```bash
bun run dev
```

### 3) Build for production

```bash
bun run build
```

### 4) Run lint

```bash
bun run lint
```

### 5) Check translations

```bash
bun run scripts/check-translations.ts
```

## Environment variables

| Variable | Description |
|---|---|
| `VITE_UMAMI_URL` | Umami analytics script URL (optional) |
| `VITE_UMAMI_WEBSITE_ID` | Umami website ID (optional) |

Create a `.env` file in the project root to enable analytics tracking.

## Docker

### Development image

Build:

```bash
docker build --target dev -t photo-print:dev .
```

Run:

```bash
docker run --rm -p 5173:5173 photo-print:dev
```

### Production image (Nginx)

Build:

```bash
docker build --target production -t photo-print:prod .
```

Run:

```bash
docker run --rm -p 8080:8080 photo-print:prod
```

Then open http://localhost:8080.

## PWA

The app is a Progressive Web App. It registers a service worker on the first visit that precaches all built assets for offline use. Updates are applied automatically when detected — the page reloads to activate the latest version.

## Print note

For accurate physical output, disable print scaling in the browser dialog (use options like `Actual size` / `100%`).
