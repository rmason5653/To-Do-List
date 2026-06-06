---
name: mason-homes-brand
description: "The Mason Homes / Ryan Mason brand system. Use this skill for ANY content or visual work for Ryan or Mason Homes: writing social media captions, video titles, thumbnails, Instagram content, listing descriptions, guest messages, marketing emails, newsletters, pitch decks, proposals, investor documents, business cards, websites, landing pages, dashboards, app UIs, or anything carrying the Mason Homes name. Also use when choosing colors, fonts, logos, or styling for anything Mason. Trigger on phrases like 'write captions', 'make it on-brand', 'Mason Homes style', 'use my brand', 'brand colors', 'design a page for me', or whenever output will be published, sent, or shown under the Mason Homes or @thegreat_mason identity, even if the user never says the word brand."
---

# Mason Homes Brand System

Ryan Mason's brand, encoded. Everything produced under the Mason Homes name follows this system. Identity v3.1, design execution v4.0 (ratified by Ryan June 2026 after a head-to-head test).

## The Mason design doctrine (Ryan's standing order)

**Protect the feeling absolutely. Hold the mechanics loosely. The brand styles the tool; it never redefines the tool.**

Every kind of artifact has a native language users already speak: a dashboard reads like an instrument panel (glanceable, dense, green up / red down, alarms that look like alarms), an invoice reads like an invoice, a form behaves like forms users know. Those learned instincts are the product's speed, the signal IS the function. The brand dresses that native language in Mason (midnight, heavy type, restrained, expensive); it never rewires what the signals mean. When brand and the tool's native language conflict, the tool wins.

The brand has a soul and it has mechanics. The soul is the feeling every output must deliver: relentless, expensive, earned, heavy. That is non-negotiable everywhere, always. The mechanics — the specific hexes, font sizes, flat-or-shadow rules — are the current best guess at how to produce that feeling, and they evolve as Ryan learns (v3.1 became v4.0 in one night). A brand that protects its mechanics at the expense of its soul ends up with neither. The brand exists to make Mason products recognizable, not to make them worse.

**Scope ruling (Ryan, June 2026): this flexibility applies to product UI only.** Apps, dashboards, websites-as-tools, and internal software get function-beats-brand. Social content, video, thumbnails, captions, and marketing stay strictly on-kit — there, repetition IS the function; consistency is what compounds recognition. Do not deviate on social/marketing without Ryan's explicit say-so.

**In product UI, function wins.** If a chart, heatmap, status system, map, or data display needs distinctions the five-color palette can't carry, add what the data needs. If text fails contrast on a brand surface, fix the contrast. If a logo or emblem is illegible at the required size or context, use the treatment that reads. If a platform convention (iOS patterns, accessibility standards, form patterns users already know) conflicts with a kit rule, the convention wins. A user who can't read the dashboard doesn't care that every hex was correct.

**Deviation protocol (Ryan's ruling): deviate, note it, keep moving.** Make the call, leave a short code comment at the deviation explaining the functional reason (so future sessions don't "fix" it backward), and mention it in the work summary so Ryan can veto. Do not stop to ask permission for functionally justified deviations.

**Two guardrails so this never becomes a loophole:** (1) deviation must be justified by function, not taste — "it would look nicer in blue" is not function; "these seven data series are indistinguishable in five colors" is. (2) When deviating, stay in the brand's gravity: dark, restrained, heavy, expensive. Deviate like a designer who knows the brand, not like the brand doesn't exist. Stale and compliant loses to alive and Mason, every time.

## Identity

Brand: Mason Homes. Founder: Ryan Mason. Handle: @thegreat_mason.
Story facts (use in copy when proof is needed): started from a spare bedroom in Pleasant Grove, Alabama. 65+ short-term rentals across Birmingham and Atlanta. $200,000+ per month gross revenue. Lost $50K on the first flip (the Norwood Flip: budgeted $95K, cost $145K, sold at break-even) and rebuilt how he underwrites. Built on systems, not luck.

Every frame and every sentence should feel: **relentless, expensive, earned, heavy**.
Never: bright, loud, generic, consumer, content-creator.
Tagline (sparingly, small, Inter, steel): *Built loud. Built heavy. Built to last.*

## The five colors — hard locked

```
Midnight  #0B0B0D  anchor, all backgrounds, 55%
Red       #E20602  conviction, correction, hard truth, 12%
Gold      #F5B800  opportunity, insight, teaching reveal, 8%
Bone      #F5F2EC  base text, 20%
Steel     #707176  utility, meta, captions, 5%
```

Banned: pure black #000000, pure white #FFFFFF for text, charcoal #2A2A2E, bright yellow #FFD60A, gray #A6A6A6, any blue/purple accent, any neon, pastel, or muted earth tone. Midnight dominates; red and gold never outweigh midnight or bone. For UI work, derived ramps of these five anchors (surfaces, text hierarchy, accent hover/pressed states) are sanctioned per `references/DESIGN_SYSTEM_v4.md`; no foreign hues except Mason Green below.

### Data semantics (Ryan's ruling, June 2026): brand colors carry feeling, data colors carry meaning

Directional data in product UI speaks the universal financial language, not a private brand dialect:

- **Growing / up / improving** → Mason Green `#1F8A4C` (the only sanctioned green; deep and muted, never neon)
- **Declining / down / worsening** → Mason Red `#E20602`
- **Flat / holding / unchanged** → Mason Gold `#F5B800`

This applies to deltas, trends, P&L, occupancy movement, comparisons, any number with a direction. Non-directional success states (saved, complete, done) may use green or gold by context. The proof treatment is unaffected: hard stats stay bone with the red underline, that is identity, not direction. Mason Green is for product UI data only, never for social captions, marketing, or brand surfaces.

## The three fonts — strict lanes

| Font | Role | Where |
|------|------|-------|
| American Captain | Punch (1-10 words) | Social captions, video titles, thumbnails, splash/empty/milestone screens. ALL CAPS, 0.02em tracking. |
| Montserrat Black/Bold | Introduction (10-30 words) | Web/doc/deck headings, nav, buttons, card titles. Sentence case. |
| Inter 400-700 | Explanation | All body copy, email, long-form, UI text, fine print. |

No italics (exception: the tagline), no serifs, no scripts, no fourth font. American Captain never appears in documents, websites' body areas, or anything someone reads rather than feels; in apps it is capped at 5 uses total. When unsure between American Captain and Montserrat Black, use Montserrat Black. Fonts bundled at `assets/fonts/American_Captain.otf|.ttf`; Montserrat and Inter load from Google Fonts.

## Proof treatment — the signature

Any real, verifiable stat (doors, dollars, years): render the number in bone, Montserrat 900, 10-15% larger than surrounding text, with a 3-5px solid red underline under the digits only. Never red or gold text for proof numbers. Never underline non-proof words. Never decorate meaningless numbers. Implementation snippets are in `references/BRAND.md`.

## Caption system — 5 treatments (social/video)

All social caption text is American Captain, ALL CAPS, bone base, centered, lower third (70-75% from top), 10% safe margins.

1. **Bone base, no emphasis** — `I STARTED FROM A SPARE BEDROOM`
2. **Bone + red on the key word — correction/conviction** — `STR IS NOT PASSIVE INCOME` (NOT in red)
3. **Bone + gold on the key word — reveal/insight** — `THE REAL LEVER IS OPERATIONS` (REAL in gold)
4. **Proof — hard stat** — `I RUN 65 DOORS` (65 in bone, red underline)
5. **Title case, vulnerable** — `God is good.` (the only non-caps treatment)

Hard rules: one highlight color per block, never red and gold in the same block (mixing across a video is fine). Proof numbers never take a highlight color. Video: 45-60s target, 90s hard cap, cuts every 1.5-3s never over 4s. Logo only on the end card (Vertical_DarkBG default, 1.5-2s); never watermark the video body.

## Writing voice

Write like the palette PDF reads: short declarative sentences. Receipts over adjectives. Specific numbers over vague claims ("65 doors", not "dozens of properties"). Losses stated plainly as lessons, not confessions. No hype words, no emoji-forward copy, no exclamation marks doing the work a fact should do. Sentence case for body, never Title Case headers in documents. If a sentence would sound at home in a generic hustle account, cut it or replace it with a number.

## Routing — read before you build

- **Building any app, website, dashboard, or UI** → read `references/DESIGN_SYSTEM_v4.md` first. It is the execution rule book: surface ramp, midnight-tinted elevation, tint gradients, accent ramps, radius scale, data-viz semantics, interaction states, layout license. Then consult `references/BRAND.md` for component specs, dark/light mode, and spacing (8px grid) where v4 doesn't supersede it. On any conflict (shadows, gradients, radius, surfaces), v4 WINS — Ryan ratified v4 over the old flat-only rules.
- **Documents, decks, emails, long-form** → read `references/Typography_Guide.md`. Montserrat Black headings + Inter body; American Captain stays out.
- **Placing or choosing a logo** → read `references/Logo_Usage_Guide.md`. Clear space = M height; minimums 120px horizontal / 80px vertical; never stretch, recolor, add effects, or place on pure black.
- **Favicon** → use `assets/favicon.ico` as-is (multi-resolution, pre-built). Never regenerate it.
- **Logo image files** → expected in `assets/logos/` (see `assets/logos/README.md`). If a needed variant is not present, ask Ryan for the file; never redraw or recolor a logo.

## What this brand is not

Not Silicon Valley pastel. Not glassmorphism (one sanctioned exception: the v4 sticky-header blur), not neumorphism, not hue-to-hue gradient-heavy. Not emoji-forward. Not rounded-everything (radius capped per v4 scale). Not Material, not iOS-default, not startup-generic. It feels like the lobby of a boutique luxury hotel at midnight, with dimension. If output feels friendly, playful, or flat-cardboard, rebuild it.
