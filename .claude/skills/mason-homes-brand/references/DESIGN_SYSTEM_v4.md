# MASON DESIGN SYSTEM v4.0 — DRAFT (head-to-head candidate)

Philosophy: identity locked, execution freed. Everything that makes the brand recognizable stays hard-locked. The rules that merely banned modern UI craft are replaced with disciplined versions of those tools. The feeling targets are unchanged: relentless, expensive, earned, heavy. Boutique luxury hotel at midnight, now with dimension instead of cardboard.

## LOCKED (identical to v3.1, non-negotiable)

- The five anchors: Midnight #0B0B0D, Red #E20602, Gold #F5B800, Bone #F5F2EC, Steel #707176
- Color meaning: red = conviction/correction/destructive, gold = earned/insight/success, bone = base text, steel = meta
- Three font lanes: American Captain (display punch only, sparing), Montserrat (headings/nav/buttons), Inter (body/data)
- Proof treatment on real stats: bone number, Montserrat 900, 10-15% larger, 3-5px red underline under digits only
- No italics (tagline exception), no serifs, no fourth font
- Never pure black backgrounds, never pure white text
- Tagline usage rules

## FREED (new in v4.0)

### Surface ramp (derived from midnight only)
```
--surface-0: #0B0B0D   page
--surface-1: #121215   section wells
--surface-2: #16161A   cards
--surface-3: #1C1C21   raised cards, inputs, hover rows
--surface-4: #232329   popovers, sticky headers
--border-1: rgba(112,113,118,.14)
--border-2: rgba(112,113,118,.28)
```
Cards may sit on wells; two levels of nesting max.

### Elevation (allowed, midnight-tinted, never glow)
```
--shadow-1: 0 1px 2px rgba(0,0,0,.5)                          subtle lift: cards
--shadow-2: 0 4px 12px rgba(0,0,0,.45)                        hover lift, dropdowns
--shadow-3: 0 12px 32px rgba(0,0,0,.5), 0 2px 8px rgba(0,0,0,.4)   modals only
```
Shadows are depth cues, not decoration. If a shadow is visible from across the room it is wrong.

### Tint gradients (allowed, near-imperceptible)
- Surface tints: linear-gradient between two adjacent surface steps to give large panels life. Both stops from the ramp above.
- Data fills: gold or red at 18% opacity fading to 0% under sparklines/area charts.
- Red CTA may use linear-gradient(180deg, #EE1B17, #D40502) for press depth.
- Never hue-to-hue gradients. Never rainbow. Never on text.

### Accent ramps
```
Red:  hover #F71813, pressed #C90502, subtle bg rgba(226,6,2,.10), border rgba(226,6,2,.35)
Gold: bright #FFC81E, deep #C79500, subtle bg rgba(245,184,0,.10), border rgba(245,184,0,.30)
Text ramp: #F5F2EC primary, #C9C6BF secondary, #9B9C9F tertiary, #707176 muted, #4D4D52 faint
```

### Radius scale
6px controls, 10px cards, 14px modals/large panels, 999px pills for tags/status chips. Never above 16px on rectangles.

### Type refinements
- Montserrat 800 permitted for headings between Bold and Black
- All numeric/data cells: Inter with font-variant-numeric: tabular-nums
- Big KPI numbers: Montserrat 800/900 with tracking -0.03em
- Label spec unchanged: Inter 600, 11-12px, uppercase, 0.06em

### Data visualization (amended by Ryan, June 2026)
- Directional data speaks the universal financial language: **up/growing = Mason Green #1F8A4C**, **down/declining = Mason Red #E20602**, **flat/holding = Mason Gold #F5B800**, neutral/no-direction = steel
- Mason Green derived shades: soft background rgba(31,138,76,.12), border rgba(31,138,76,.35). Never neon green, never green outside product-UI data contexts
- Bars: 4px radius tops, surface-3 track behind
- Sparklines: 2px bone line (or green/red when the line itself encodes direction), tinted area fill below (see gradients)
- Margin/occupancy heat: the four v3.1 gold steps remain the heat ramp
- Deltas: ▲ green, ▼ red, ━ gold, with tabular nums
- Blue and purple remain banned everywhere

### Interaction states (required, not optional)
- Hover on interactive cards/rows: surface step up + shadow-1→2, translateY(-1px), 150ms ease-out
- Focus-visible: 2px red outline, 2px offset, everywhere
- Pressed: brightness .95, translateY(0)
- Disabled: 45% opacity, no pointer
- Skeletons: pulsing surface-2→3 opacity, no shimmer
- prefers-reduced-motion: all transforms and transitions off

### Layout license
- Bento-grid stat blocks, asymmetric where data warrants it
- Sticky table headers and sticky page header on surface-4 with --border-1 bottom; optional 8px backdrop-blur at 85% opacity (max blur in the system; no other glass anywhere)
- Generous whitespace: section padding 32-48px; density reserved for tables
- One red element and one gold element max per viewport as accents; the ratio discipline of v3.1 still governs

## STILL BANNED
Pastels, neon, blue/green/purple accents, glassmorphism beyond the sticky-header allowance, neumorphism, bounce/spring animation, emoji-forward UI, Material/iOS defaults, rounded-everything, shimmer effects, colored glows.
