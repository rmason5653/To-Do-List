# BRAND.md

Mason brand system for Claude Code. Read this file in full before writing any UI code. Re-check it before styling any new component. Every visual decision in this codebase must match this file. If this file conflicts with another source, this file wins.

---

## IDENTITY

**Brand:** Mason Homes
**Founder:** Ryan Mason
**Handle:** @thegreat_mason
**Feeling to deliver:** relentless, expensive, earned, heavy
**Feelings to avoid:** bright, loud, generic, consumer, content-creator

---

## COLORS — HARD LOCKED

Use these hex values exactly. No variants, no shades of these outside what is listed. No Tailwind defaults. No Material defaults. Define them as CSS custom properties or a theme object once, then reference them everywhere.

```
--color-midnight:   #0B0B0D   /* anchor — all backgrounds, 55% of surface */
--color-red:        #E20602   /* signature — conviction, correction, 12% */
--color-gold:       #F5B800   /* earned — opportunity, insight, 8% */
--color-bone:       #F5F2EC   /* base text, 20% */
--color-steel:      #707176   /* utility, meta, 5% */
```

### Banned colors

- `#000000` pure black (use midnight instead)
- `#FFFFFF` pure white for text (use bone instead)
- `#2A2A2E` charcoal (legacy v2.x, retired)
- `#FFD60A` bright yellow (legacy v2.x, retired)
- `#A6A6A6` gray (legacy v2.x, retired)
- Any shade of green, blue, or purple for UI accents
- Any neon, pastel, or muted earth tone

### Semantic usage

- **Backgrounds:** always midnight for dark mode, bone for light mode. Never straight white or black.
- **Body text on midnight:** bone
- **Body text on bone:** midnight
- **Muted / secondary text:** steel (works on both backgrounds)
- **Primary CTA buttons:** red background, bone text
- **Secondary CTA buttons:** transparent background, bone text, 1px bone border
- **Destructive actions:** red (never a separate "danger red" — red is red)
- **Success states:** gold
- **Error states:** red with a short underline accent (see proof treatment)
- **Disabled states:** steel at 50% opacity
- **Links:** red, no underline, 10% brightness increase on hover

### The 60/25/10/4/1 ratio — soft rule

Roughly: midnight 55%, bone 20%, red 12%, gold 8%, steel 5%. Break it when the app genuinely needs more white space (data tables, long-form reading) but never flip dominance. Red and gold never exceed midnight or bone in visual weight.

---

## TYPOGRAPHY — THREE FONTS, STRICT ROLES

Three fonts. Each has one job. Discipline is the whole game — American Captain used surgically in the right places makes the app feel like Mason. Used in the wrong places it looks cheap.

### 1. American Captain — display moments ONLY

**Use in exactly these places, nowhere else:**

1. **Splash screen / app loading screen** — the 1-2 second moment when the app opens. One word or one short line. Examples: "MASON", "LOADING", "BUILT LOUD. BUILT HEAVY."
2. **Empty states** — the hero line when a screen has no data yet. Examples: "NO DEALS YET", "START YOUR FIRST PROPERTY", "NOTHING TO SEE HERE"
3. **Celebration / milestone screens** — moments where the user should feel something. Examples: "PROPERTY SOLD", "$10K HIT", "GOAL REACHED"
4. **Marketing pages inside the app** — landing pages, pricing pages, upgrade screens, onboarding intros. Hero headlines only, 1-10 words.

**Maximum 5 uses across the entire app.** If you find yourself reaching for American Captain a 6th time, you are using it wrong — switch to Montserrat Black.

**Always pair with:**
- `letter-spacing: 0.02em`
- `text-transform: uppercase`
- Large size only (minimum 48px, ideal 72-120px for splash)
- Bone or red color (never gold for American Captain)

**Never use for:** body text, paragraphs, labels, buttons, form inputs, tables, navigation, card headers, modal titles, section headings, anything under 48px, anything the user reads rather than feels.

**Load locally from:** `American_Captain.otf` or `American_Captain.ttf` (included in this bundle).

```css
@font-face {
  font-family: 'American Captain';
  src: url('American_Captain.otf') format('opentype'),
       url('American_Captain.ttf') format('truetype');
  font-weight: 900;
  font-display: swap;
}

.display-punch {
  font-family: 'American Captain', 'Arial Black', Impact, sans-serif;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  font-size: 72px;
  line-height: 1;
  color: var(--color-bone);
}
```

### 2. Montserrat — all headings, navigation, buttons, and non-display large text

**Use for:** every heading in the app. H1, H2, H3, H4, section titles, modal titles, card titles, navigation labels, tab labels, button text, large numbers in stat callouts, any display-adjacent moment that is NOT one of the four American Captain scenarios above.

**Weights to use:**
- `900` Black for H1 and the largest hero headings (when not using American Captain)
- `700` Bold for H2, H3, navigation active states, button text
- `500` Medium for H4, small section labels, breadcrumbs

**Never use weights 100, 200, 300, 400 of Montserrat for headings.** Those are too light to carry the brand.

**Load from:** Google Fonts `https://fonts.googleapis.com/css2?family=Montserrat:wght@500;700;900&display=swap`

### 3. Inter — all body text

**Use for:** paragraphs, descriptions, form labels, form inputs, table cells, footer text, tooltips, helper text, microcopy, error messages, placeholder text, metadata.

**Weights to use:**
- `400` Regular for body copy (default)
- `500` Medium for emphasized body copy
- `600` SemiBold for inline labels, small caps moments
- `700` Bold for inline emphasis within paragraphs (rare)

**Load from:** Google Fonts `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap`

### How to decide which heading font — American Captain or Montserrat Black?

Ask: is this a **functional heading** (tells the user what section they are in) or a **display moment** (makes the user feel something)?

- Functional heading: "Your Properties", "Recent Transactions", "Settings", "Add New Deal" → **Montserrat Black or Bold**
- Display moment: first thing on screen after app opens, empty state hero, milestone celebration, marketing hero → **American Captain**

If you are unsure, default to Montserrat Black. American Captain is the rare reward, not the default.

### Type scale (reference — adjust to app context)

```
Display punch  American Captain 900    72-120px   line-height 1     tracking 0.02em  UPPERCASE
H1 hero        Montserrat 900          56-72px    line-height 1.05  tracking -0.02em
H1             Montserrat 900          36-44px    line-height 1.1   tracking -0.02em
H2             Montserrat 900          28-32px    line-height 1.15  tracking -0.015em
H3             Montserrat 700          20-24px    line-height 1.2   tracking -0.01em
H4             Montserrat 700          16-18px    line-height 1.3
Body large     Inter 400               16-18px    line-height 1.6
Body           Inter 400               14-16px    line-height 1.6
Body small     Inter 400               13px       line-height 1.5
Label          Inter 600               11-12px    line-height 1.4   letter-spacing 0.06em uppercase
Caption        Inter 400               11-12px    line-height 1.4   color steel
```

### Typography rules

- No italic anywhere. No script. No serif. No other fonts.
- American Captain is restricted to the four display scenarios listed above. Maximum 5 uses across the app.
- All caps on: American Captain display moments, and Inter labels (11-12px SemiBold with 0.06em tracking). Never on Montserrat headings.
- Body copy is sentence case. Montserrat headings are sentence case (not Title Case).
- Never use `font-weight: 400` on Montserrat — it reads wrong.
- Never use `font-weight: 800` or `900` on Inter — Montserrat handles that role.
- When in doubt between American Captain and Montserrat Black, default to Montserrat Black. American Captain is the exception, not the rule.

---

## PROOF TREATMENT — THE SIGNATURE

When the app displays a hard stat, receipt, or number that matters (revenue, count, years, any verifiable metric), apply the proof treatment. This is Mason's signature visual element. It is not a decoration; it is a recognition pattern that trains users to know "this is real."

### Rules

1. **Color:** the number is bone, the surrounding text is bone. Never red, never gold.
2. **Weight:** the number renders at Montserrat 900, 10-15% larger than surrounding text.
3. **Underline:** a 3-5px solid red bar sits directly under the digits only. Not under surrounding words.
4. **Scope:** only on real verifiable stats. Never on decorative numbers, page numbers, pagination, or counts that don't carry weight.

### Implementation (HTML/CSS example)

```html
<p class="stat-line">
  I run <span class="proof">65</span> doors across two markets.
</p>

<style>
.stat-line { font-family: Inter; font-weight: 400; font-size: 16px; color: var(--color-bone); }
.proof {
  font-family: Montserrat, sans-serif;
  font-weight: 900;
  font-size: 1.15em;
  display: inline-block;
  position: relative;
  padding-bottom: 2px;
  color: var(--color-bone);
}
.proof::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 3px;
  background: var(--color-red);
}
</style>
```

### Implementation (React/Tailwind example)

```jsx
const Proof = ({ children }) => (
  <span className="relative inline-block font-[Montserrat] font-black text-[1.15em] pb-[2px] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[3px] after:bg-[#E20602]">
    {children}
  </span>
);

// Usage:
<p>I run <Proof>65</Proof> doors across two markets.</p>
```

---

## LOGO USAGE IN APP

### Available files (in this bundle)

- `MasonM_Red_on_Midnight_1024.png` — primary app icon, splash screen, dark nav
- `MasonM_White_on_Midnight_1024.png` — alt dark nav
- `MasonM_Red_Transparent_1024.png` — use on any light background
- `MasonM_White_Transparent_1024.png` — use on any dark background, watermarks
- `MasonM_Red_on_Bone_1024.png` — light-mode headers
- `MasonHomes_Vertical_DarkBG.png` — splash screens, full-brand moments
- `MasonHomes_Vertical_WhiteBG.png` — light-mode splash, documents
- `MasonHomes_Horizontal_DarkBG.png` — wide navigation headers, emails
- `MasonHomes_Horizontal_WhiteBG.png` — light-mode wide headers

### Logo rules

- **App icon / favicon:** use the M emblem (never the full lockup). Start from `MasonM_Red_on_Midnight_1024.png`.
- **Nav bar / header:** use the horizontal lockup matching the nav background.
- **Splash / onboarding:** use the vertical lockup matching the screen background.
- **Minimum size:** 32px digital, 48px for a profile/avatar context, 24px for a favicon.
- **Never:** stretch, skew, rotate, recolor, add shadows/glows, place on busy photos without a solid overlay.
- **Clear space:** margin on all sides equal to the height of the M letter in the wordmark.

---

## COMPONENT SPECS

These are default rules. Use them unless the app has a specific reason not to. If you deviate, leave a code comment explaining why.

### Buttons

```
Primary button
  background: red
  text: bone, Montserrat 700, 14px
  padding: 12px 24px
  border-radius: 6px
  border: none
  hover: brightness 110%
  active: brightness 95%
  no transition on box-shadow (keep it flat)

Secondary button
  background: transparent
  text: bone (on dark) or midnight (on light), Montserrat 700, 14px
  padding: 12px 24px
  border: 1px solid bone (on dark) or midnight (on light)
  border-radius: 6px
  hover: background bone/midnight at 10% opacity

Tertiary (link-style)
  background: none
  text: red, Montserrat 700, 14px
  padding: 8px 0
  hover: underline

Disabled
  opacity: 0.5
  cursor: not-allowed
```

### Cards

```
background: slightly lighter than midnight (try #16161A) OR pure midnight with 1px steel border at 20% opacity
border-radius: 8px
padding: 20-24px
no drop shadows (the brand is flat, not layered)
```

### Form inputs

```
background: transparent OR #16161A on midnight pages
border: 1px solid steel
border-radius: 6px
padding: 10px 12px
text: bone, Inter 400, 14px
placeholder: steel, Inter 400, 14px
focus: border red, no glow
label above input: Inter 600, 12px, uppercase, 0.06em tracking, color steel
helper text below: Inter 400, 12px, color steel
error state: border red, helper text red
```

### Navigation

```
background: midnight
logo: horizontal lockup DarkBG, 32-40px tall
nav links: Montserrat 700, 14px, color bone
active link: color red OR gold accent bar under it
hover: brightness 120%
```

### Tables

```
background: midnight
header row: Inter 600, 12px, uppercase, 0.06em tracking, color steel
body rows: Inter 400, 14px, color bone
row divider: 1px steel at 20% opacity
hover row: background #16161A
```

---

## DARK/LIGHT MODE

Default to **dark mode** (midnight background). Light mode is acceptable when the app needs it (data-heavy dashboards, long-form reading) but dark mode is the brand default.

### Light mode overrides

When the app is in light mode, flip these values only:
- Background: bone (#F5F2EC)
- Body text: midnight
- Borders / dividers: steel at 30% opacity
- Cards: pure white (#FFFFFF) or bone, with 1px steel border

**Keep these unchanged in both modes:**
- Red is always red
- Gold is always gold
- Primary CTA is always red background / bone text

---

## SPACING SCALE

Use an 8px grid. Every margin, padding, and gap should be a multiple of 4.

```
4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px
```

Do not use 5px, 7px, 13px, 21px, etc. If you find yourself reaching for a non-grid value, the layout is wrong.

---

## MOTION

- Transitions: 150-200ms, `ease-out` only (never `ease-in`, never bounce, never spring).
- Hover transitions on buttons, links: 120ms opacity or brightness change.
- Page transitions: instant or a quick fade (80ms). No slides, no 3D, no flourish.
- Loading states: simple pulsing opacity on a midnight skeleton block. No shimmer. No spinner with a color gradient.
- Respect `prefers-reduced-motion: reduce` — disable all motion when set.

---

## WHAT THIS BRAND IS NOT

When in doubt, check against this negative list:

- Not Silicon Valley pastel
- Not glassmorphism or neumorphism
- Not gradient-heavy
- Not emoji-forward
- Not rounded-everything (use 6-8px radius, not 24px+)
- Not Material Design
- Not iOS default
- Not "startup generic"

The Mason brand feels like the lobby of a boutique luxury hotel at midnight, not a consumer app store splash. If a component feels "friendly" or "playful," rebuild it.

---

## TAGLINE

Use sparingly. Only in splash screens, marketing pages, or onboarding conclusion screens.

> Built loud. Built heavy. Built to last.

Render it in Inter 400, italic, color steel, on the bottom of the screen. Never larger than 14px.

---

*If you are reading this file, you are building Mason. Every pixel earns its place.*
