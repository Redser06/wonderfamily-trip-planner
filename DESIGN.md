---
name: Calm Family Journey
colors:
  surface: '#eefcfd'
  surface-dim: '#cfddde'
  surface-bright: '#eefcfd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#e8f6f7'
  surface-container: '#e3f1f1'
  surface-container-high: '#ddebec'
  surface-container-highest: '#d7e5e6'
  on-surface: '#111e1f'
  on-surface-variant: '#3f4849'
  inverse-surface: '#263334'
  inverse-on-surface: '#e6f3f4'
  outline: '#6f7979'
  outline-variant: '#bfc8c9'
  surface-tint: '#26676b'
  primary: '#0d575a'
  on-primary: '#ffffff'
  primary-container: '#2f6f73'
  on-primary-container: '#b0f0f4'
  inverse-primary: '#93d1d5'
  secondary: '#835400'
  on-secondary: '#ffffff'
  secondary-container: '#feb64e'
  on-secondary-container: '#714800'
  tertiary: '#4e4587'
  on-tertiary: '#ffffff'
  tertiary-container: '#665da1'
  on-tertiary-container: '#e7e1ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#aeeef2'
  primary-fixed-dim: '#93d1d5'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f53'
  secondary-fixed: '#ffddb5'
  secondary-fixed-dim: '#ffb956'
  on-secondary-fixed: '#2a1800'
  on-secondary-fixed-variant: '#643f00'
  tertiary-fixed: '#e5deff'
  tertiary-fixed-dim: '#c8bfff'
  on-tertiary-fixed: '#1a0d52'
  on-tertiary-fixed-variant: '#463d80'
  background: '#eefcfd'
  on-background: '#111e1f'
  surface-variant: '#d7e5e6'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 2rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system is engineered to alleviate the cognitive load and stress inherent in family travel planning. The aesthetic is anchored in an ethos of calm, generous whitespace, structured legibility, and quiet reliability. Rather than energetic, gamified, or commercial travel motifs, the interface behaves as a dependable itinerary steward.

### Visual Style
The system employs an airy, minimal-tactile aesthetic:
- **Tone:** Reassuring, grounded, lucid, and protective.
- **Visual Restraint:** Avoid literal resort imagery, brand mascots, theme-park motifs, or character graphics. If visual abstractions are needed, rely on geometric, line-based glyphs and silhouettes (e.g., rising sun, gentle tidal lines, stroller silhouette).
- **Interface Structure:** Flat, low-noise card surfaces set against soft, tinted canvases. High visual clarity ensures multi-generational legibility, with a strict rule of a single primary action per view to prevent decision paralysis.

## Colors

The palette uses chromatic segregation to convey semantic purpose without visual clutter.

### Semantic Rules for Color Roles
- **Primary Teal (`#2F6F73`):** The primary brand anchor. Used for confirmed statuses, primary navigation, passed rule validation states, active progress indicators, and the solitary primary action button.
- **Secondary Amber (`#E8A33D`):** Strictly functional. Reserved exclusively for actionable warnings, conflicting time blocks, and pending co-parent/guardian approvals. Never used for general branding or decorative accents.
- **Tertiary Violet (`#6C63A8`):** Restricted solely to AI-generated suggestions, automated itinerary drafts, and intelligent packing tips. 
- **Neutral Charcoal & Canvas (`#536061`, with canvas tones):** Cool, slate-tinted neutrals ensure high contrast text accessibility (WCAG AAA compliant for critical informational copy) while softening the starkness of pure black-on-white.
- **Status Alert Red (`#BA1A1A`):** Used exclusively for failed planning constraints (e.g., flight overlap, venue closure, expired travel document).

## Typography

The typographic hierarchy balances friendly readability with functional utility:
- **Headings (Plus Jakarta Sans):** Generous apertures and rounded geometries offer an approachable, human welcome at the top of planning flows.
- **Body & Continuous Copy (Atkinson Hyperlegible Next):** High-distinction glyph shapes ensure quick legibility under daylight travel conditions or high stress. 
- **Labels, Rules, & Meta Details (Inter):** Systematic and neutral. Inter provides reliable, compact rendering for chips, tags, and status trackers.
- **Numeric Data:** All times, costs, gate numbers, and dates must be rendered using tabular lining figures (`font-variant-numeric: tabular-nums`) to allow instant scanning across budget tables and daily timelines.

## Layout & Spacing

The layout model emphasizes breathing room to reduce decision fatigue:
- **Comfortable Density:** The grid adheres to an 8px base rhythm with a default minimum component interior/gap unit of 16px (`space-md`).
- **Touch Ergonomics:** All interactive targets (buttons, list rows, toggles, chips) enforce a strict minimum touch target of 48px × 48px to accommodate one-handed phone use while managing children or luggage.
- **Breakpoints and Reflow:**
  - **Mobile (< 768px):** Single-column stacked cards. Sticky bottom action bar containing exactly one primary call-to-action (CTA). 16px gutters and margins.
  - **Tablet (768px – 1024px):** 8-column layout. Timeline and contextual cards side-by-side or stacked with 24px margins.
  - **Desktop (> 1024px):** 12-column layout max-width 1200px centered canvas, 32px gutters. Unfolds itinerary timeline on the primary panel (8 cols) and real-time rule/inspection sidebar on the secondary panel (4 cols).

## Elevation & Depth

To avoid optical fatigue, the design system minimizes heavy drop shadows in favor of tonal layering and soft hairline boundaries:
- **Base Canvas:** Soft ambient tint (`#F7FAF9`), providing a gentle backdrop that prevents stark white glare.
- **Cards & Surfaces:** Pure white (`#FFFFFF`) with a subtle 1px border using 12% opacity neutral (`rgba(83, 96, 97, 0.12)`).
- **Elevation Layers:**
  - **Resting Cards:** Flat with subtle 1px borders; zero shadow.
  - **Hover/Active Cards:** Single soft elevation: `0 4px 16px -2px rgba(47, 111, 115, 0.08)`.
  - **Overlays / Bottom Sheets:** `0 -8px 24px -4px rgba(47, 111, 115, 0.12)`.
- **Pinned Bottom Mobile Dock:** Surface container elevated with a diffused top shadow (`0 -4px 12px rgba(0, 0, 0, 0.04)`) and a delicate separator line to mark separation from scrollable itinerary content.

## Shapes

The design uses balanced, gentle corner radii to reinforce comfort and safety:
- **Standard Cards & Modules:** 12px (`0.75rem` / `rounded-xl`) corner radius.
- **Buttons & Input Fields:** 12px radius, aligning with the container boundary language.
- **Pills & Status Chips:** Full pill radius (`9999px`) for quick visual identification against squared structural cards.
- **Modals & Bottom Drawers:** 24px top radius on mobile drawers for an inviting, tactile enclosure.

## Components

### Buttons
- **Primary Button:** Solid teal background (`#2F6F73`), white text, 48px height, 12px radius. Only **one** primary button is permitted per view. On mobile viewports, this button is anchored to the bottom sticky bar.
- **Secondary Button:** Outlined with a 1.5px border of `#2F6F73`, transparent background, and `#2F6F73` label. 48px minimum touch target.
- **Destructive/Tertiary Actions:** Plain text link or low-contrast ghost button to prevent accidental presses.

### Chips & Semantic Tags
- **Suggested Chip (AI):** Violet tinted background (`rgba(108, 99, 168, 0.12)`), solid violet label (`#6C63A8`), accompanied by the label "Suggested". Height: 28px, pill-shaped.
- **Rule Validation Chips:**
  - **Pass:** Soft teal wash (`rgba(47, 111, 115, 0.12)`), `#2F6F73` text, labeled "Rule: Pass".
  - **Warn:** Soft amber wash (`rgba(232, 163, 61, 0.16)`), `#A6680A` high-contrast text, labeled "Rule: Review".
  - **Fail:** Soft red wash (`rgba(186, 26, 26, 0.12)`), `#BA1A1A` text, labeled "Rule: Conflict".

### Input Fields & Controls
- **Text Inputs:** 48px minimum height, 12px corner radius, 16px internal padding. Neutral border expands to a 2px `#2F6F73` outline on focus. Labels use Inter SemiBold positioned clearly above the input.
- **Checkboxes & Radios:** Minimum touch target container of 48px × 48px with a 24px visible glyph. Selected state fills with primary teal (`#2F6F73`).

### Cards & Itinerary Items
- **Structure:** White surface on soft canvas, 16px internal padding, 12px radius.
- **Timeline Items:** Segmented cards grouped by time-of-day (Morning, Afternoon, Evening). 
- **Rule Breakdown Card:** Embedded block with soft tinted borders indicating luggage compatibility, nap times, or meal requirements, tagged with the required Rule Chips.