# Photo Print Tool

Web app for daily customer photo printing with precise layout control.

## Stack

- Vite
- React + TypeScript
- Tailwind CSS
- shadcn/ui
- Bun

## Features (MVP)

- Select multiple photos
- Choose layout presets (1, 2, 4, contact sheet, passport/ID)
- Set precise print size per slot
- Switch units (`mm`, `cm`, `in`)
- Use common paper presets (A4, A5, Letter, Legal, 4x6, 5x7, 8x10)
- Browser print output with print-optimized layout

## Run locally

```bash
bun install
bun run dev
```

## Quality checks

```bash
bun run lint
bun run build
```

## Notes on print accuracy

- The app computes sizes using real units and renders print pages in `mm`.
- Final physical output can still vary based on printer and driver settings.
- For best accuracy, disable print scaling options like “Fit to page” in the browser print dialog.

## Calibration test page (quick check)

Use this routine when setting up a new printer or browser profile:

1. Open the app and select `A4` or `Letter` paper.
2. Choose the `1 photo per page` layout.
3. Set exact size to `100 mm x 100 mm`.
4. Print with scaling disabled (`Actual size` / `100%`).
5. Measure the printed square with a ruler.

If measurement is off, review print dialog settings and disable any auto-fit options before printing customer jobs.
