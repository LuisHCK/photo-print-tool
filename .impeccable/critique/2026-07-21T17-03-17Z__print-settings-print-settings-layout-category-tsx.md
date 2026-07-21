---
target: Copies per page control (columns/rows/max copies inputs)
total_score: 13
p0_count: 2
p1_count: 2
timestamp: 2026-07-21T17-03-17Z
slug: print-settings-print-settings-layout-category-tsx
---
# Critique: Copies per Page Control

## Report header provenance
Method: dual-agent (A: ses_07a61262dffe6cC5r3V4vzn5aX · B: ses_07a611d67ffeaze5S9M8VmeC19)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 1 | Changing columns silently updates third field's max — no feedback anywhere |
| 2 | Match System / Real World | 1 | "Max copies used" is jargon. "Copies per page" describes output, not inputs |
| 3 | User Control and Freedom | 4 | Basic number inputs; undo is trivial |
| 4 | Consistency and Standards | 1 | Zero inline labels on any field — violates every multi-field input convention |
| 5 | Error Prevention | 2 | min/max constraints exist but invisible; no guidance before error |
| 6 | Recognition Rather Than Recall | 0 | User must remember field ordering every visit. No labels, icons, affordance |
| 7 | Flexibility and Efficiency | 2 | Keyboard-navigable in correct tab order. No shortcuts |
| 8 | Aesthetic and Minimalist Design | 3 | Clean look, but minimalism removed meaning |
| 9 | Error Recovery | 0 | Silent clamping on out-of-range values. No validation messages |
| 10 | Help and Documentation | 0 | None. The gray hint is orientation, not documentation |
| **Total** | | **13/40** | **Poor** |

## Anti-Patterns Verdict

**Starts here: this control looks AI-generated.**

Three identical bare `<Input type="number">` elements in a `grid-cols-3` with no individual labels, no placeholders, and a low-contrast hint below is the textbook "generate a form with 3 number inputs." The same unlabeled-3-grid pattern appears verbatim in the spacing control, confirming a systemic copy-paste rather than thoughtful design.

**Deterministic scan**: CLI detector returned clean (no findings) — the detector is CSS/markup-pattern based and this is a structural/IA issue it can't catch. The absence of automated findings does not mean the control is clean.

## Overall Impression

The Copies per Page control is the weakest point in the settings panel. It asks the user to do translation work — decode three identical-looking boxes, remember which order they're in, and infer the relationship between columns/rows and the cap. For a tool whose brand promise is "precise results without learning design software," this is the exact opposite. The control works technically but fails cognitively.

## What's Working

1. **Computed max on max copies** — `max={state.selectedLayoutColumns * state.selectedLayoutRows}` prevents impossible values.
2. **Clean baseline aesthetic** — the grid is responsive; the inputs are properly sized and spaced.
3. **Hint text exists** — the `columnsRowsMaxCopies` translation clarifies, even if placed wrong.

## Priority Issues

### [P0] Three identical inputs with no individual labels
**What**: Columns, rows, and max copies each use a bare `<Input>` with no `id`, no `aria-label`, no visible label. Screen readers announce "edit text" three times. Sighted users must guess the order.
**Why it matters**: Forces recall over recognition (heuristic 6). First-timers enter numbers in wrong order. Power users re-decipher each session.
**Fix**: Give each input its own inline label. Use `<Label>` with `htmlFor` or `aria-label` on each.
**Suggested command**: $impeccable clarify

### [P0] No accessible names on any input (a11y)
**What**: None of the three `<Input>` elements have an `id`, so the group label on line 240 cannot associate. `type="number"` has poor screen-reader support.
**Why it matters**: Screen reader users (Sam persona) cannot distinguish the fields. WCAG 4.1.2 failure.
**Fix**: Add `id` + `htmlFor` pairing on each, or switch to `type="text" inputmode="numeric"` with `aria-label`.
**Suggested command**: $impeccable audit

### [P1] Group label is semantically wrong
**What**: "Copies per page" describes the output (how many photos print on one page), but the three inputs control grid structure (columns, rows) and a constraint (max copies used).
**Why it matters**: Mismatch between label and function forces users to reverse-engineer what the inputs do. The "Copies of this photo" input in the same panel compounds the confusion.
**Fix**: Rename to "Grid layout" or "Grid columns/rows". Move max copies into a visually subordinate position or inline help.
**Suggested command**: $impeccable clarify

### [P1] Hint text is too weak and misplaced
**What**: `columnsRowsMaxCopies: "Columns / Rows / Max copies used"` renders as `text-muted-foreground text-xs` below the inputs.
**Why it matters**: Users see blank boxes first, have to hunt below for meaning. The hint is the only way to learn field order.
**Fix**: Promote the hint to inline labels above/beside each input. The hint becomes redundant when labels exist.
**Suggested command**: $impeccable layout

### [P2] Silent side effects with no feedback
**What**: Changing columns silently updates max copies' `max` attribute and the actual page layout. No panel-level notification.
**Why it matters**: User enters 4 cols × 4 rows, then changes cols to 3 — max silently adjusts from 16 to 9. If user entered 15 in max, it silently clamps with no warning.
**Fix**: Add inline feedback or keep max visible/adjustable independently with a clear indicator when it's capped.
**Suggested command**: $impeccable harden

## Persona Red Flags

**Alex (Power User)**: Understands the fields but resents re-deciphering ordering every session. Wants to tab through and type fast — forced visual parsing breaks flow. No keyboard shortcuts to jump between columns/rows.

**Jordan (First-Timer)**: Reads "Copies per page" and expects to type a single number (e.g., "4"). Instead finds three empty boxes. Has no idea which is which. The gray hint below is easy to miss. Likely enters values in wrong order, gets unexpected results, and feels the tool is "for professionals."

**Carmen (Home User, project-specific)**: Wants 8 wallet photos on one page. Doesn't know or care what columns and rows are. Needs to translate "8 photos" into "2 columns × 4 rows" (or 4×2) with no translation help. The abstraction leaks.

## Minor Observations

- The same unlabeled-3-grid pattern appears in the spacing control (margin / h-gap / v-gap) — systemic, not one-off.
- `gap-3` (12px) will feel cramped once inline labels are added.
- No `onBlur` clamping: if a user types a value below `min` or above `max`, the invalid value is silently passed to state.
- The third input uses `max={state.selectedLayoutColumns * state.selectedLayoutRows}` as a React prop — dynamic but invisible to the user.

## Questions to Consider

1. **Does a home user need to see columns and rows at all?** If Carmen wants "8 photos per page," could she just type 8 and let the grid compute? Right now the implementation detail is forced into the user's face.
2. **Why do three fundamentally different parameters (grid width, grid height, usage cap) share identical visual weight?** Distinct roles should look distinct.
3. **If three unlabeled inputs passed multiple review rounds, what else in this panel is held together by gray 11px text?** The spacing control suggests a systemic blind spot.

## Run Notes

- Target slug: `print-settings-print-settings-layout-category-tsx`
- Ignore list: none (ignore.md not found)
- Assessment independence: dual-agent (A: design review sub-agent, B: detector sub-agent)
- CLI detector: clean (exit 0, no findings)
- Browser visualization: skipped (static code review; target is a form control, not a visual page)
- Live server: not started
- Temp file: `/tmp/impeccable-critique-body.md`
