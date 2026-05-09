---
title: Landing Page Parallax Effects
date: 2026-05-09
status: ready-for-planning
---

# Landing Page Parallax Effects

## Goal

Add scroll-driven motion to `src/app/page.tsx` to make the landing page feel alive and editorial — without adding an animation library, breaking the server component architecture, or conflicting with the dark glassmorphism aesthetic.

## User Story

When a visitor scrolls through the landing page, the hero headline moves slightly slower than the page (creating depth), and each section below fades in with a subtle upward slide as it enters the viewport — making the page feel crafted rather than static.

## Scope

### In scope

1. **Hero parallax depth** — the `<h1>` headline in the hero section translates vertically at 0.3× scroll speed (moves -30px when page scrolls -100px). Subtitle and CTA buttons are not affected.
2. **Section reveal on scroll** — every section below the hero (The Problem, Why On-Chain, How It Works, Who Is This For, Protocol Callout) fades in and slides up `16px → 0` as it enters the viewport.
3. **Reduced motion respect** — all motion is skipped for users with `prefers-reduced-motion: reduce`.
4. **`page.tsx` stays a server component** — parallax logic lives in two small client components.

### Out of scope

- Floating decorative elements (dots, particles, grid lines)
- Card-level parallax (individual glass-cards moving on scroll)
- Mobile-specific adjustments (desktop-first per CLAUDE.md)
- Animation library of any kind (CLAUDE.md constraint)
- Parallax on background blobs — they are in `layout.tsx` and already `position: fixed`

## Behavior

### Hero headline parallax

- Attach a single `scroll` event listener in a `useEffect`
- On each scroll event, read `window.scrollY` and apply `transform: translateY(scrollY * -0.3px)` to the headline element
- Use `requestAnimationFrame` to throttle the handler
- Remove listener on component unmount
- Apply `will-change: transform` to the headline element for GPU compositing

### Section reveal

- Use `IntersectionObserver` with `threshold: 0.15` (trigger when 15% of section is visible)
- Initial state: `opacity: 0; transform: translateY(16px)`
- On intersection: transition to `opacity: 1; transform: translateY(0)` via CSS transition (`duration: 700ms, easing: ease-out`)
- Once revealed, disconnect the observer for that element (one-shot)
- Apply `will-change: opacity, transform` during the transition, remove after

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  /* skip all transforms — reveal still fires but instantly */
}
```

Both client components check `window.matchMedia('(prefers-reduced-motion: reduce)')` at mount and skip motion setup if true. Sections still become visible (opacity 1) instantly.

## Architecture

| File | Change |
|---|---|
| `src/components/parallax-hero.tsx` | New client component. Wraps the hero `<section>`, attaches scroll listener to `<h1>`. |
| `src/components/reveal-section.tsx` | New client component. Thin wrapper that attaches IntersectionObserver to its child `<section>`. |
| `src/app/page.tsx` | Import and use the two new components. Stays server component. |
| `src/app/globals.css` | Add CSS transition class for the reveal state (or use inline style — planner decides). |

## Success Criteria

- Hero headline visibly moves at a slower rate than the page on scroll
- Each section below hero fades in as it enters the viewport during a normal scroll-down
- Zero layout shift — content dimensions are not affected by parallax transforms
- All existing content and links continue to work unchanged
- Page passes a visual check with `prefers-reduced-motion` enabled (no motion, no hidden content)
- No animation library is added to `package.json`

## Constraints

- No animation library (CLAUDE.md)
- No Tailwind `animate-*` classes — use CSS transitions with utility classes
- `page.tsx` must remain a server component
- Aesthetic stays editorial / dark glassmorphism — no bounce, no spring, no overshoot

## Assumptions

- Hero parallax applies only to the `<h1>` element, not the entire hero section
- Reveal threshold of 15% (`threshold: 0.15`) is appropriate — planner may adjust
- CSS transition values (700ms, ease-out, 16px) are starting points — planner may tune
