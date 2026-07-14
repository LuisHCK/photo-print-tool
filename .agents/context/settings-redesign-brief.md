# Design Brief: Settings Panel Redesign — Progressive Flow

## 1. Feature Summary

Redesign the main app surface from a static three-panel layout (where all settings are collapsed by default) into a progressive flow that reveals controls as the user advances through the natural workflow: Import → Review → Refine → Print. The quick-print path requires zero interaction beyond uploading photos — mirroring the simplicity of the Windows classic print tool. The custom path reveals deeper controls exactly when they're relevant, not all at once. This IS the Windows image print wizard, rebuilt for modern browsers with real precision.

## 2. Primary User Action

Import photos, see a usable auto-layout immediately, and print — with the confidence that any detail (margins, gaps, alignment, per-photo adjustments) is one click away when needed.

## 3. Design Direction

**Color strategy:** Restrained — the existing clay-and-paper palette carries through. No per-surface overrides.

**Theme scene sentence:** A parent at a home desk on a weekend afternoon, importing phone photos to print for a family album — just like the Windows print wizard they've used for years, but with actual control over the result.

**Anchor references:**
- **Windows classic print wizard** — the simplicity baseline. Right-click → Print → pick layout → done. That same instant gratification, but with real precision underneath.
- macOS print dialog (simple summary by default → "Show Details" expands the full panel)
- Linear's quick-issue modal (minimal input → progressive reveal of advanced fields)

## 4. Scope

- **Fidelity:** Production-ready
- **Breadth:** Full surface — header, photos panel, preview panel, settings panel, and the interaction between them
- **Interactivity:** Shipped-quality interactive components
- **Time intent:** Polish until it ships

## 5. Layout Strategy

**Current layout (unchanged):** Three columns — Photos (320px) | Preview (1fr) | Settings (360px) at xl+. Single-column stack below.

**Progressive disclosure model** replaces the "all collapsed" default:

| State | Photos Panel | Preview Panel | Settings Panel |
|-------|-------------|---------------|----------------|
| **Entry (no photos)** | Upload area prominent, dashed drop zone | Placeholder: "Your layout will appear here" with illustration | Minimal — only "Layout" header visible, collapsed. Show a hint: "Upload photos to get started" |
| **After upload** | Photo thumbnails, first photo auto-selected | Live preview renders with auto-chosen layout | **"Layout & copies" auto-opens** (paper size, layout preset, copies). Other sections collapsed |
| **Size/spacing opened** | Unchanged | Preview updates live | Margin, gap, cell size controls visible |
| **Photo selected** | Active photo highlighted | Active photo highlighted in preview | **"Selected Photo" section appears** (fit mode, rotation, position nudges) |
| **Guides/alignment opened** | Unchanged | Crop guides appear | Alignment grid, crop toggle, show-crop-guides |
| **Print-ready** | Unchanged | Final preview | All sections collapsed except "Layout" showing a summary. Print button prominent |

**Smart defaults:**
- **Photo print size:** Auto-detect from the first uploaded photo's aspect ratio, defaulting to 4×6" (the most common print size). Options: 4×6, 5×7, 8×10, 3.5×5, wallet, or custom.
- **Paper size:** Auto-detect from locale (Letter for US, A4 elsewhere)
- **Layout goal:** Fit all photos on the fewest pages possible — minimize paper use
- **Margin strategy:** Start with minimal margins (e.g., 0.5" / 12mm) and auto-calculate the grid that maximizes photos per page. Users can increase margins if they want breathing room, but the default prioritizes paper savings.
- **Grid alignment:** Center (the common default)
- **Auto-layout algorithm:** Given N photos, photo print size, and paper size, compute the rows×cols grid with minimal margins that fits the photos. If photos don't fit on one page, overflow to additional pages with the same tight-margin layout.

**State persistence (localStorage):**
- `print-panel.openSections` — remember which sections the user had open
- `print-panel.lastActiveTab` — restore their last view
- Restore on page load, with smart overrides when context changes (e.g., if they deleted all photos, reset to entry state)

## 6. Key States

| State | What the user sees | What they should feel |
|-------|-------------------|----------------------|
| **Empty entry** | Upload area, placeholder preview, collapsed settings with hint text | Welcomed, clear what to do next |
| **Photos loading** | Skeleton/spinner in photos panel, "Processing N photos..." | Informed, patient |
| **Auto-layout shown** | Active preview showing tight-margin grid, page count displayed ("3 photos — fits on 1 page"). Photo size shown in header | Satisfied, trust the defaults |
| **No photo selected (but photos exist)** | Preview hidden or showing a "click a photo to preview" state | Guided, not confused |
| **Overflow detected** | Red warning: "X photos won't fit — photos will span N pages." Suggested fix: reduce margins, use smaller print size, or accept multi-page | Informed, not anxious |
| **Low PPI detected** | Yellow warning with actionable text ("~72 PPI — may appear blurry when printed") | Informed, can decide |
| **Print triggered** | Print review dialog: page count, paper size, PPI summary per page | Confident, reassured |
| **Error** (unsupported file, corrupted image) | Inline error in photos panel, other panels unaffected | Unblocked, not stuck |

## 7. Interaction Model

- **Upload → Auto-layout:** Uploading triggers auto-layout. The algorithm: given paper size and target photo print size (default 4×6"), compute the rows×cols grid with minimal margins that fits the most photos per page. Display page count prominently. No manual "apply layout" step needed.
- **Print size change:** Changing the print size (e.g., 4×6" → 5×7") recalculates the entire grid — rows, cols, margins — to maintain paper efficiency. The preview updates immediately with the new arrangement.
- **Section expansion:** Click an accordion header to expand/collapse. Multiple can be open at once (current behavior preserved).
- **Photo selection:** Clicking a photo thumbnail or the preview slot selects it. The Selected Photo section appears if hidden, or stays open with updated controls.
- **Preview updates:** Every setting change updates the preview debounced at 150ms. Immediate for direct manipulation (clicking alignment, toggling guides).
- **Print review:** Print button opens a brief dialog showing "N photos · M pages · Paper size · Estimated PPI range" with a large "Print" button and a "Cancel" fallback.
- **Navigation persistence:** `localStorage` saves open sections and restores them on return.

## 8. Content Requirements

### New/updated copy
- Upload area: "Drop photos here or click to browse" (current: "Import photos" label + file input)
- Empty preview placeholder: "Your layout will appear here" with a subtle icon (not a dashed border with "No photos selected yet.")
- Layout section header: "Layout & copies" (unchanged)
- Size & spacing section header: "Size & spacing" (unchanged)
- Selected Photo section header: "Selected photo" (unchanged)
- Print review header: "Print preview"
- Print review summary: "N photos across M pages on PaperSize" (e.g., "8 photos across 2 pages on Letter")
- Print review PPI line: "Estimated quality: ~240 PPI (good)" or "~90 PPI (may appear blurry)"
- Print review button: Large "Print" primary, "Cancel" secondary

### Image/media roles
- Empty preview state: Simple SVG illustration (a photo frame icon, 64×64px, in muted-foreground). No sketchy/hand-drawn style.
- Print review dialog: No additional images needed — uses the existing preview rendering.
- Upload drop zone: The existing dashed border region with updated copy.

## 9. Recommended References

- `$impeccable layout` — spacing and rhythm of the progressive disclosure layout
- `$impeccable harden` — print review dialog, confirmations, error states
- `$impeccable clarify` — updated copy throughout
- `$impeccable polish` — final pass after all changes

## 10. Open Questions

All major decisions asserted above. No unresolved questions.
