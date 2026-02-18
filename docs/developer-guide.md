# Developer Guide

## Purpose
Photo Print Tool is a web app for preparing photo print jobs with predictable physical dimensions.

Primary MVP capabilities:
- Multi-photo selection
- Layout presets
- Custom presets (paper + layout)
- Precise print size control
- Unit switching (`mm`, `cm`, `in`)
- Common paper sizes
- Browser print output

## Stack
- **Runtime**: React 19 + TypeScript
- **Build**: Vite 7
- **Package manager**: Bun
- **UI**: Tailwind CSS v4 + shadcn/ui (Radix primitives)
- **Linting**: ESLint 9

## Why these decisions
- **Web-only print workflow**: Keeps deployment simple and cross-platform.
- **Canonical unit = millimeters**: All geometry is stored/computed in `mm` to avoid conversion drift.
- **Preset-driven layouts**: Fast daily operation and fewer invalid states.
- **Single-screen workflow**: Import → configure → preview → print, optimized for speed.

## Quick start
```bash
bun install
bun run dev
```

Checks:
```bash
bun run lint
bun run build
```

## Project structure
- `src/App.tsx` — Thin composition layer for page shell and feature panels
- `src/hooks/use-print-job.ts` — Central print-job state + domain actions
- `src/types/print.ts` — Print domain types (`PhotoItem`, `LayoutPreset`, etc.)
- `src/lib/units.ts` — Unit conversion/parsing helpers
- `src/lib/print-layout.ts` — Pure layout/page math and PPI calculations
- `src/lib/paper-presets.ts` — Common paper definitions
- `src/lib/layout-presets.ts` — Layout templates and defaults
- `src/components/panels/*` — Photos, preview, and settings panels
- `src/components/print/print-pages.tsx` — Print-only page rendering
- `src/print.css` — Print-specific CSS (`@media print`, page behavior)
- `src/components/ui/*` — shadcn UI components

## Core architecture
1. **Input layer**
   - Photos are loaded from local files.
   - Image dimensions are read with `Image.decode()`.
   - Object URLs are used for rendering and revoked on removal.

2. **Domain state**
   - `photos`, `paper`, `layout`, `orientation`, `unit`, spacing, and slot size are managed in `usePrintJob`.
   - Custom paper/layout presets are merged with built-ins at runtime.
   - User-facing values are converted from/to `mm`.

3. **Layout engine**
   - Layout presets define rows/columns and default slot sizes.
   - Selected photos are mapped into page slots (`PageAssignment`).
   - Passport mode repeats the first selected photo across slots.

4. **Preview + print pipeline**
   - Screen preview and print rendering consume the same geometry values from shared state.
   - Print output uses physical CSS units (`mm`) and dedicated print styles.
   - `window.print()` delegates final output to browser/driver.

## Adding features safely
When adding a new feature, keep this pattern:
1. Extend domain types in `src/types/print.ts`.
2. Add pure helper logic in `src/lib/*` (no UI dependencies).
3. Extend state/actions in `src/hooks/use-print-job.ts`.
4. Wire controls in `src/components/panels/*`.
5. Ensure both preview and print paths use the same geometry source.

### Example feature slices
- **New paper size**: add entry to `src/lib/paper-presets.ts`.
- **New layout**: add preset to `src/lib/layout-presets.ts`.
- **New unit behavior**: update conversion/parsing in `src/lib/units.ts`.
- **Quality rules**: add checks near effective PPI calculations and show warnings in settings/preview.

## Coding conventions
- Keep geometry logic deterministic and pure.
- Avoid hardcoding visual values outside Tailwind/shadcn tokens.
- Keep output behavior identical between preview and print whenever possible.
- Use strict TypeScript types for all new print-related state.

## Known constraints
- Browser printing cannot fully control printer hardware settings.
- Final physical output may vary by printer driver scaling.
- Users should print with scaling disabled (`Actual size` / `100%`) for best accuracy.
- Custom presets are stored in browser `localStorage` (device/browser specific).

## Suggested next refactor
If features continue to grow, introduce `features/*` modules around current panels/hooks while keeping `src/lib/*` as the source of truth for print math.
