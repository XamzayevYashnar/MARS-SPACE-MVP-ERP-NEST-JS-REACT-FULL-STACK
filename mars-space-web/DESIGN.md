# Mars Space — Design System

## Direction

**Mission control, not outer-space clipart.** Mars Space is named for the planet, but the visual world is a *telemetry console* — instrument panels, launch windows, readouts, and the rust-and-basalt palette of the Martian surface. No star fields, cartoon rockets, or purple/blue "AI gradient" backgrounds. The mood is **precise, technical, slightly industrial, confident** — an engineering dashboard that happens to be beautiful.

One place spends visual boldness: the **Mission Board** on the home page (a split-flap/launch-window readout of upcoming intakes). Everything around it stays quiet and disciplined.

## Colour tokens

Defined once as `R G B` triples in `src/app/styles/globals.css` (`:root` / `.dark` / `.light`) and exposed to Tailwind as `rgb(var(--x) / <alpha-value>)` so opacity utilities work (`border-oxide/40`). **Never write a raw hex in a component.**

| Token | Dark | Light | Role |
|---|---|---|---|
| `--void` | `#0A0D12` | `#F5F6F8` | Page background |
| `--basalt` | `#141922` | `#FFFFFF` | Cards, panels |
| `--basalt-raised` | `#1C222D` | `#EDEFF3` | Hover, inputs, elevated surfaces |
| `--hairline` | `#2A3240` | `#DDE2E9` | 1px borders, dividers, grid lines |
| `--oxide` | `#C1440E` | `#C1440E` | Primary accent — CTAs, key data |
| `--sol` | `#E8A33D` | `#E8A33D` | Secondary — warnings, highlights, focus ring |
| `--ice` | `#E6EDF5` | `#10141B` | Primary text |
| `--dust` | `#8A94A6` | `#5A6474` | Secondary text, labels |
| `--signal` | `#3FB950` | `#3FB950` | Success / seats available |
| `--alert` | `#E5484D` | `#E5484D` | Errors / group full |

Dark is the primary theme; light is provided and equally polished. Theme is set on `<html>` (`.dark`/`.light`) by `ThemeProvider` from a persisted Zustand store, and can follow the OS (`system`).

## Typography

Cyrillic subsets are mandatory; all three faces are on Google Fonts (preconnect + preload display face, `font-display: swap`).

| Role | Face | Usage |
|---|---|---|
| Display | **Unbounded** 600/700 | H1–H3, section titles, hero numerals. Tight tracking (`-0.02em`), never below 24px. |
| Body | **Onest** 400/500/600 | Prose, buttons, UI labels |
| Data | **JetBrains Mono** 400/500 | Prices, durations, dates, group codes, stats, eyebrow labels, admin numerals |

**Type scale** (mobile → desktop): `12/13`, `14`, `16`, `18/20`, `24/28`, `32/40`, `44/64`. Line height 1.15 for display, 1.6 for body. Eyebrow labels: JetBrains Mono, 12px, uppercase, `0.12em` tracking, `--dust` (`.eyebrow` utility).

## Layout & shape language

- Container max-width **1280px**, gutters 16/24/32px. 12-col desktop grid, 4-col mobile.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96.
- Radius: **2px** inputs/buttons, **4px** cards, **0** panel dividers. No pill buttons, no `rounded-2xl`.
- Elevation via **borders and background steps**, not blur shadows — the one exception is the sticky mobile CTA bar.
- A 1px `--hairline` grid motif (thin rules, corner ticks via `.corner-ticks`) is the connective tissue.

## Component states

Primitives live in `src/shared/ui`.

- **Button** — `primary` (oxide fill), `secondary` (hairline border), `ghost`, `danger`; sizes sm/md/lg/icon. Loading replaces the label with a spinner and **locks width**. `asChild` (Radix Slot) renders links as buttons.
- **Cards** — `--basalt` bg, 1px `--hairline` border; interactive cards shift the border to `--oxide/40` and lift 2px on hover (no scale).
- **Inputs / Select / Textarea** — hairline border, `--basalt-raised` fill; `invalid` swaps to `--alert`. Radix Select/Tabs/Dialog/Drawer for accessible overlays.
- **Status** — always **label + colour**, never colour alone (Badge with optional dot).
- **List views** — every one handles four states: **loading** (skeleton matching final dimensions), **error** (retry), **empty** (actionable), **success**.
- Every interactive element has a visible `focus-visible` ring in `--sol`.

## Motion

Purposeful only, ≤ 240 ms, `ease-out`, and **all disabled under `prefers-reduced-motion`** (global rule in `globals.css`):

1. Page transitions — 120 ms opacity fade.
2. Scroll/mount reveal — 16px rise + fade, staggered (`animate-rise-in`).
3. Hover micro-interactions on cards/buttons.
4. The Mission Board row reveal — the one "expensive" moment, done in CSS (no runtime animation library on the landing page).

## Accessibility

WCAG 2.1 AA target: semantic landmarks, one `<h1>` per page, skip-to-content link, keyboard-operable menus/modals/accordions/kanban (drag has a keyboard alternative — a status select on each card), focus trapped in overlays and restored on close (Radix), `aria-live` for async results and toasts, `--dust` on `--basalt` ≈ 5.3:1 contrast, images carry meaningful `alt` or `alt=""`.

## Rationale

The client rejected generic "startup template" proposals. The telemetry-console direction gives Mars Space a memorable, ownable identity that a teenager and a parent both read as *serious and modern* — while the instrument-panel discipline (hard edges, hairlines, mono data, border-based elevation) keeps a content-heavy catalogue legible on a mid-range Android phone. Boldness is concentrated in a single signature element so the rest of the UI stays fast, quiet, and trustworthy.
