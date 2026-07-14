---
name: Photo Print Tool
description: Precise, repeatable photo print layouts — nothing uploaded, nothing installed.
colors:
  primary: "#ce7e4f"
  primary-foreground: "#ffffff"
  ring: "#c96442"
  background: "#faf9f5"
  foreground: "#3d3929"
  card: "#faf9f5"
  card-foreground: "#141413"
  muted: "#ede9de"
  muted-foreground: "#83827d"
  secondary: "#e9e6dc"
  secondary-foreground: "#535146"
  accent: "#e9e6dc"
  accent-foreground: "#28261b"
  border: "#dad9d4"
  input: "#b4b2a7"
  destructive: "#141413"
  destructive-foreground: "#ffffff"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0"
rounded:
  md: "0.5rem"
  lg: "0.75rem"
  xl: "0.5rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
components:
  button-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.25rem"
    border: "1px solid {colors.border}"
  card-default:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
  input-default:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
    height: "2.25rem"
    border: "1px solid {colors.input}"
  select-trigger:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
    height: "2.25rem"
    border: "1px solid {colors.input}"
  switch-on:
    backgroundColor: "{colors.primary}"
    rounded: "{rounded.full}"
  switch-off:
    backgroundColor: "{colors.input}"
    rounded: "{rounded.full}"
---

# Design System: Photo Print Tool

## 1. Overview

**Creative North Star: "The Lab Bench"**

A clean, well-organized workbench for print layout. The interface feels like a physical countertop where precision tools are laid out within easy reach — accurate enough for a print-shop operator, approachable enough for someone printing family photos.

The system uses a warm clay-and-paper palette: a terracotta primary against creamy off-whites and warm stone neutrals. Inter provides a clean, legible single-family typography throughout. Surfaces are layered softly — subtle shadows separate panels from the page without simulating a floating card aesthetic. Components feel tactile and confident: buttons have clear hover states, inputs have defined focus rings, and every control responds deliberately.

**Key Characteristics:**
- Warm but not "cozy" — precision is the primary signal, warmth is the secondary comfort
- Clay-and-paper palette: terracotta accent, warm off-white body, stone neutrals
- Border-forward: containers use hairline borders and soft shadows to establish hierarchy
- Single sans-serif family (Inter) keeps the tool calm and legible
- Dark mode inverts to cool deep grays with a slightly lighter terracotta primary

## 2. Colors

The palette is anchored by a warm clay primary against a warm paper background. Neutrals live in the cream-to-stone range. Dark mode inverts to cool deep grays.

### Primary
- **Clay** (#ce7e4f): Primary interactive elements — buttons, active states, switches, focus rings. Used sparingly and deliberately; it's the one warm accent against the neutral palette.
- **Burnt Sienna** (#c96442): Focus rings and hover intensity. Slightly redder than the primary, used only for ring/outline states.

### Neutral
- **Warm Paper** (#faf9f5): Body and card background. The dominant surface color.
- **Ink** (#3d3929): Primary body text. A dark warm brown, not pure black — avoids the sterile "true black on white" contrast.
- **Near-Black Ink** (#141413): Card titles and high-emphasis text.
- **Warm Stone** (#ede9de): Muted surfaces, secondary backgrounds, accent fills.
- **Warm Stone** (#e9e6dc): Secondary and accent backgrounds. Subtly lighter than muted.
- **Warm Gray** (#83827d): Muted and placeholder text. Low-emphasis information.
- **Hairline** (#dad9d4): Borders and separators. Thin, unobtrusive.
- **Input Stroke** (#b4b2a7): Input borders and select triggers. Readable but quiet.

### Destructive
- **Near-Black** (#141413): Destructive actions background (keeps destructive restrained).
- **White** (#ffffff): Text on destructive and primary surfaces.

### The Paper-Not-Cream Rule
The body background is a warm off-white (oklch ~96% lightness, trace chroma toward the 80° yellow-green quadrant). It reads as uncoated paper stock, not as painted cream or beige. The warmth is carried by the clay primary, not by a tinted body background.

## 3. Typography

**Body Font:** Inter (with ui-sans-serif, system-ui, sans-serif fallback)

The system uses a single sans-serif family. Inter was chosen for its legibility at small sizes (common in tool UIs), its generous x-height, and its neutral-but-warm character.

### Hierarchy
- **Display** (600 weight, 1rem / 16px, 1.5 line-height): App title in the header. The tool has no hero headings; "display" here means the highest-emphasis text in the UI.
- **Title** (500 weight, 0.875rem / 14px, 1.5 line-height): Card titles, section headings.
- **Body** (400 weight, 0.875rem / 14px, 1.5 line-height): Most UI text — descriptions, labels alongside controls, photo names.
- **Label** (500 weight, 0.875rem / 14px, 1 line-height): Form labels, switch labels, select items. Medium weight distinguishes labels from body text.

### The Single-Family Rule
One family, one voice. Inter serves all roles. No display font, no serif pairing — a utility tool doesn't need typographic ceremony.

## 4. Elevation

The system uses a layered approach: surfaces are separated by a combination of hairline borders and subtle shadows. Depth is gentle — enough to distinguish panels from the page backdrop, not enough to suggest floating cards.

### Shadow Vocabulary
- **shadow-xs** (`0 1px 3px 0px hsl(0 0% 0% / 0.05)`): Inputs, select triggers, subtle surface separation. Barely visible; it prevents the "flat-on-flat" ambiguity.
- **shadow-sm** (`0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px`): Cards. A gentle lift off the page.
- **shadow-md** (`0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px`): Dropdown menus, popovers. The highest floating elements.

### The Layered-Not-Lifted Rule
No dramatic shadows, no floating card effect. Elevation communicates hierarchy (a dropdown sits above the page) but never simulates physical depth. Tonal layering (background: muted vs background: card) does the structural work; shadows are a secondary cue.

## 5. Components

### Buttons
- **Shape:** Gently rounded corners (rounded-md, 8px). Flat, not pill-shaped.
- **Primary** (Clay #ce7e4f background, white text, 9px height, 16px 8px padding): The single call to action. Hover darkens to 90% opacity (handled by Tailwind `hover:bg-primary/90`). Focus gets a 3px ring at ring color.
- **Outline** (Transparent background, Ink text, 1px border at Hairline): Secondary actions. Hover fills with accent/stone.
- **Ghost** (No background or border): Tertiary actions like "remove" in a list. Hover fills with accent.
- **Size variants:** xs (24px), sm (32px), default (36px), lg (40px), icon (36px square).

### Cards / Containers
- **Corner Style:** rounded-xl (12px) — slightly more rounded than buttons to distinguish containers from controls.
- **Background:** Warm Paper (#faf9f5) matching body background. Cards don't float on a different surface; they're outlined containers on the same plane.
- **Border:** 1px solid Hairline (#dad9d4). The border defines the container, not a shadow.
- **Shadow:** shadow-sm for a subtle lift.
- **Internal Padding:** 24px (px-6, py-6 header / px-6 content).

### Inputs / Fields
- **Style:** 1px solid Input Stroke border (#b4b2a7) on Warm Paper background. 8px radius matching buttons.
- **Focus:** Border shifts to ring color (#c96442) with a 3px focus ring at ring/50 opacity.
- **Height:** 36px (h-9) default, matching button default size.
- **Placeholder:** Warm Gray (#83827d). Meets 4.5:1 contrast against Warm Paper.

### Select / Dropdown
- **Trigger:** Matches input styling identically (same border, height, radius, background).
- **Dropdown Content:** Popover (#ffffff) background, shadow-md, standard Radix animation (fade + zoom + slide).
- **Items:** 14px body text, accent background on hover/focus, check icon for selected state.

### Switch
- **Track:** 18px wide, rounded-full. Filled Clay when on, Input Stroke when off.
- **Thumb:** White circle, 16px diameter. Translates horizontally on toggle.
- **Focus:** 3px ring at ring/50 on focus-visible.

### Tabs
- **List Container:** Pilled background (rounded-lg, 8px) at Warm Stone (#ede9de) with 3px padding.
- **Trigger:** Inactive triggers at 60% foreground opacity. Active trigger gets white background (shadow-sm) and full opacity.
- **Line Variant:** Active trigger gets a thin underline indicator instead of fill.

### Separator
- **Style:** 1px Hairline (#dad9d4), full width. Used between sections, never as a colored accent stripe.

## 6. Do's and Don'ts

### Do:
- **Do** use the clay primary sparingly — it's the single accent. Applying it to >10% of a screen surface dilutes its impact.
- **Do** use border-radius consistently (8px for controls, 12px for containers).
- **Do** use the Paper-Not-Cream Rule: the body background reads as uncoated paper, not painted beige.
- **Do** keep destructive actions in near-black, not red. Red is reserved for error messages and validation.

### Don't:
- **Don't** use the generic SaaS dashboard look — no sidebar-heavy layouts, no striped headers, no data-table chrome. This is a focused utility.
- **Don't** pair Inter with another geometric sans-serif. One family is the rule.
- **Don't** use border-left/right thicker than 1px as a colored accent stripe. Use background tints or full borders instead.
- **Don't** use shadows larger than shadow-md (4px blur) on cards. Dramatic shadows simulate floating surfaces, which isn't this system's elevation philosophy.
- **Don't** use rounded corners larger than 12px on containers or 8px on controls. Full-pill radius is only for switches and tags.
- **Don't** disable reduced-motion support. All Radix transitions have reduced-motion fallbacks via `prefers-reduced-motion`.
