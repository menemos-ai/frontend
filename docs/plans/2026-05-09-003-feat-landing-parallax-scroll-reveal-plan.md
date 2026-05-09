---
title: "feat: Landing Page Parallax and Scroll Reveal Effects"
type: feat
status: active
date: 2026-05-09
origin: docs/brainstorms/landing-parallax-requirements.md
---

# feat: Landing Page Parallax and Scroll Reveal Effects

## Overview

Add two coordinated scroll-driven effects to the Mnemos landing page (`src/app/page.tsx`):

1. **Hero parallax** — the `<h1>` headline translates at 0.3× scroll speed via a `requestAnimationFrame`-throttled scroll listener, creating a subtle depth separation from the rest of the hero content.
2. **Section reveal** — each of the five sections below the hero fades in and slides up 16 px as it enters the viewport, driven by an `IntersectionObserver`.

Both effects are implemented with zero new dependencies (pure browser APIs, no library). The landing page remains a server component; only two small co-located client components are introduced. All motion is skipped for `prefers-reduced-motion: reduce` users.

---

## Problem Frame

The landing page is static — every section is visible on load without any sense of progressive disclosure or depth. Adding subtle scroll-driven motion creates editorial polish appropriate to the "archive / provenance" aesthetic, and makes the page feel crafted rather than generated. (See origin: `docs/brainstorms/landing-parallax-requirements.md`)

---

## Requirements Trace

- R1. Hero `<h1>` translates at 0.3× scroll speed (negative direction: slower apparent movement than page).
- R2. Five sections below the hero reveal with fade + slide-up (16 px, 700 ms, ease-out) when 15% of the section enters the viewport.
- R3. Both effects respect `prefers-reduced-motion: reduce` — motion is entirely skipped; sections remain fully visible.
- R4. `src/app/page.tsx` stays a server component — no `"use client"` on the page file.
- R5. No animation library is added to `package.json`.
- R6. Existing content, links, and visual structure are unchanged.

---

## Scope Boundaries

- Only the `<h1>` element in the hero gets parallax. The tagline `<p>`, subtitle, and CTA links are not affected.
- The `border-t` dividers between sections are not wrapped or animated.
- The five background blobs in `layout.tsx` are `position: fixed` and are not modified.
- No staggered reveal per card within the 3-column grid sections.
- No mobile-specific parallax tuning (desktop-first per CLAUDE.md).

---

## Context & Research

### Relevant Code and Patterns

- `src/app/page.tsx` — six `<section>` blocks inside `<div className="flex flex-col">`. Pure server component, no imports.
- `src/app/listing/[id]/_listing-detail.tsx` — established pattern: underscore-prefixed `'use client'` co-located component extracted from its page shell.
- `src/app/layout.tsx` — fixed background layer (`-z-10`, `pointer-events-none`), sticky header (`z-40`). No `overflow: hidden` on any ancestor; scroll happens on `<html>`. No interference with `translateY` or `opacity` on `<main>` content.
- `src/app/globals.css` — `.glass`, `.glass-card`, `.glass-strong`, `.gradient-text`, `.btn-glow`. Only transition defined is `box-shadow / opacity` on `.btn-glow`. No `@keyframes`, no `will-change`.
- `src/test/setup.ts` — Vitest setup; imports `jest-dom`, starts MSW server. No browser API mocks yet.
- `src/test/render.tsx` — `renderWithProviders()` wraps in Wagmi + QueryClient. Not needed for the new pure-DOM client components; use `render` from `@testing-library/react` directly.
- `src/app/marketplace/__tests__/page.test.tsx` — example test structure to follow.

### Institutional Learnings

- No `docs/solutions/` directory exists yet. No prior learnings on these patterns.

### Key Browser API Notes

- `IntersectionObserver` is not implemented in jsdom — must be mocked globally in `src/test/setup.ts`.
- `window.matchMedia` is not implemented in jsdom — must be mocked globally in `src/test/setup.ts`.
- `requestAnimationFrame` is available in jsdom (fires synchronously in test runs — no special setup needed; React Testing Library's `act()` flushes it).
- `window.scrollY` is always `0` in jsdom and is read-only — override with `Object.defineProperty` in scroll tests.

---

## Key Technical Decisions

- **Client components use underscore prefix and live in `src/app/`** — matches `_listing-detail.tsx` pattern; marks them as non-route private modules co-located with their page.
- **RevealSection renders a `<div>` wrapper** — the simplest way to hold the `ref` for IntersectionObserver without touching the inner `<section>` element. The wrapper carries the `reveal` / `visible` CSS classes. Its presence in the `flex-col` parent is harmless since the inner `<section>` controls its own layout.
- **CSS classes in `globals.css` rather than inline styles for the reveal** — the transition is declarative, GPU-composited, and does not require JavaScript on every frame. JS only toggles the class name.
- **`will-change: transform` on `<h1>` via inline style** — hints GPU compositing for the headline. Applied at the JSX level rather than in `globals.css` to keep it scoped to this element only.
- **`{ passive: true }` on the scroll listener** — tells the browser the handler will not call `preventDefault()`, enabling scroll-thread optimization.
- **`prefers-reduced-motion` checked once at mount** — both components read `window.matchMedia('(prefers-reduced-motion: reduce)').matches` inside their `useEffect` and early-return if true. Checked once (not reactive) because media query changes mid-session are negligible edge cases. Not abstracted into a shared util — two inline checks are less indirection than a shared helper for this scale (see CLAUDE.md: "Three similar lines is better than a premature abstraction").
- **One-shot IntersectionObserver** — observer is disconnected immediately after a section becomes visible. Sections do not re-hide on scroll-up.
- **`useRef` for the scroll offset, not `useState`** — `useState` would cause a re-render on every animation frame (60/s). The transform is applied directly to the DOM node via `ref.current.style.transform`.

---

## Open Questions

### Resolved During Planning

- **Which hero elements get parallax?** Strictly the `<h1>` only. The tagline `<p>` above and the CTA links below are not affected.
- **Do sections already in the viewport on load flash invisible?** Yes, briefly (~1 frame). The `useEffect` adds the `reveal` class, then IntersectionObserver fires asynchronously. For sections in the initial viewport, this is imperceptible (<50 ms). Accepted as the standard behavior for this pattern.
- **Do the `border-t` dividers between sections get animated?** No — they remain always visible. Only the `<section>` blocks are wrapped.

### Deferred to Implementation

- **Exact rAF timing behavior in specific browsers** — may need micro-tuning of the 0.3× multiplier for perceived smoothness. Adjust in `_hero-parallax.tsx` without plan changes.
- **Whether `threshold: 0.15` feels right for tall sections** — if sections are taller than the viewport, 15% may feel late. Tune without plan changes.

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
src/app/page.tsx  (server component — no change to "use client" status)
  │
  ├─ <HeroParallax />          (src/app/_hero-parallax.tsx — "use client")
  │     Renders: <section> hero content
  │     useEffect: passive scroll listener → rAF → h1Ref.current.style.transform
  │     ref attached to: <h1> only
  │
  ├─ <div className="border-t..." />   (unchanged)
  │
  ├─ <RevealSection>           (src/app/_reveal-section.tsx — "use client")
  │     <section> The Problem  (unchanged JSX, moved inside wrapper)
  │   </RevealSection>
  │
  ├─ <div className="border-t..." />   (unchanged)
  │
  ├─ <RevealSection> <section> Why On-Chain </section> </RevealSection>
  ├─ <div className="border-t..." />
  ├─ <RevealSection> <section> How It Works </section> </RevealSection>
  ├─ <div className="border-t..." />
  ├─ <RevealSection> <section> Who Is This For </section> </RevealSection>
  ├─ <div className="border-t..." />
  └─ <RevealSection> <section> Protocol Callout </section> </RevealSection>

globals.css — adds:
  .reveal       { opacity: 0; transform: translateY(16px); transition: ... }
  .reveal.visible { opacity: 1; transform: translateY(0); }

src/test/setup.ts — adds:
  IntersectionObserver global mock
  window.matchMedia global mock
```

---

## Implementation Units

- U1. **CSS utilities and test environment mocks**

**Goal:** Provide the CSS classes that the reveal animation relies on, and add the browser API mocks that prevent all subsequent tests from crashing in jsdom.

**Requirements:** R2, R3, R5

**Dependencies:** None

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/test/setup.ts`

**Approach:**
- In `globals.css`, add two utility classes inside `@layer utilities`:
  - `.reveal` — `opacity: 0`, `transform: translateY(16px)`, `transition: opacity 0.7s ease-out, transform 0.7s ease-out`
  - `.reveal.visible` — `opacity: 1`, `transform: translateY(0)`
- In `src/test/setup.ts`, add a global `IntersectionObserver` stub (`observe`, `unobserve`, `disconnect` as `vi.fn()`). Capture the constructor callback so tests can trigger it manually (store last-created instance on the stub).
- In `src/test/setup.ts`, add a global `window.matchMedia` stub that returns `{ matches: false }` by default.

**Test scenarios:**
- Test expectation: none — infrastructure only. Existing test suite must continue to pass after these additions (`pnpm test`).

**Verification:**
- `pnpm test` passes with zero regressions.
- `.reveal` class produces `opacity: 0` in a browser (manual check).
- `.reveal.visible` class produces `opacity: 1` with transition (manual check).

---

- U2. **HeroParallax client component**

**Goal:** Render the hero section as a self-contained `'use client'` component that applies a `translateY` parallax to its `<h1>` element on scroll.

**Requirements:** R1, R3, R4, R5, R6

**Dependencies:** U1 (matchMedia mock available in test env)

**Files:**
- Create: `src/app/_hero-parallax.tsx`
- Create: `src/app/__tests__/hero-parallax.test.tsx`

**Approach:**
- The component renders the complete hero section JSX (migrated verbatim from `page.tsx`), making no changes to class names, text, or Link hrefs.
- A `useRef<HTMLHeadingElement>(null)` is attached to the `<h1>`.
- In `useEffect` (runs once on mount):
  1. Check `window.matchMedia('(prefers-reduced-motion: reduce)').matches` — if true, return immediately.
  2. Apply `will-change: transform` to `h1Ref.current.style`.
  3. Declare a `rafId: number` variable to hold the pending animation frame.
  4. Define `onScroll`: cancel any pending `rafId`, then schedule a new `requestAnimationFrame` that sets `h1Ref.current.style.transform = \`translateY(\${window.scrollY * -0.3}px)\``.
  5. Call `window.addEventListener('scroll', onScroll, { passive: true })`.
  6. Return cleanup: `window.removeEventListener('scroll', onScroll)` + `cancelAnimationFrame(rafId)`.

**Patterns to follow:**
- `src/app/listing/[id]/_listing-detail.tsx` — `'use client'` co-located component structure.
- `useEffect` cleanup pattern: `return () => { ... }` from `src/app/dashboard/page.tsx`.

**Test scenarios:**
- Happy path: Component renders; `screen.getByRole('heading', { level: 1 })` contains "AI agents have memory".
- Happy path: CTA links render — "Browse marketplace", "API docs", "NPM SDK" are present in DOM.
- Happy path: Scroll listener fires transform — mock `window.scrollY = 100`, dispatch `fireEvent.scroll(window)`, flush with `act()`, assert `h1.style.transform` equals `translateY(-30px)`.
- Edge case: `prefers-reduced-motion: reduce` — mock `matchMedia` to return `{ matches: true }`, render, scroll, assert `h1.style.transform` is empty string or not set.
- Edge case: Scroll listener removed on unmount — render, unmount, assert `removeEventListener` was called (spy on `window.removeEventListener`).

**Verification:**
- `pnpm test src/app/__tests__/hero-parallax.test.tsx` passes.
- In browser: headline visibly lags behind the page scroll speed when scrolling the landing page.

---

- U3. **RevealSection client component**

**Goal:** Provide a thin `'use client'` wrapper that triggers a CSS fade + slide reveal when the wrapped element enters the viewport.

**Requirements:** R2, R3, R4, R5

**Dependencies:** U1 (CSS classes and IntersectionObserver mock available)

**Files:**
- Create: `src/app/_reveal-section.tsx`
- Create: `src/app/__tests__/reveal-section.test.tsx`

**Approach:**
- The component accepts `children: React.ReactNode` and renders `<div ref={wrapperRef}>{children}</div>`.
- In `useEffect` (runs once on mount):
  1. Check `prefers-reduced-motion` — if true, return immediately (element stays visible, no class added).
  2. Add `reveal` class to `wrapperRef.current` (starts the CSS transition from opacity 0 / translate 16px).
  3. Create `new IntersectionObserver(callback, { threshold: 0.15 })`.
  4. Callback: if `entry.isIntersecting`, add `visible` class + `observer.disconnect()` (one-shot).
  5. Call `observer.observe(wrapperRef.current)`.
  6. Return cleanup: `observer.disconnect()`.
- No `className` prop — the component owns its own reveal styling.

**Patterns to follow:**
- Same `useEffect` + cleanup structure as HeroParallax (U2).
- `_listing-detail.tsx` for the `'use client'` + `useRef` + `useEffect` combination.

**Test scenarios:**
- Happy path: Renders children — a child `<p>` inside `<RevealSection>` is visible in DOM.
- Happy path: Adds `reveal` class after mount — after `act()`, `wrapperRef.current` has class `reveal`.
- Integration: IntersectionObserver fires with `isIntersecting: true` — trigger the captured IO callback with `[{ isIntersecting: true }]`, assert element now has both `reveal` and `visible` classes.
- Integration: Observer disconnects after first intersection — `disconnect` was called exactly once after `visible` is added.
- Edge case: `isIntersecting: false` in callback — class `visible` is NOT added.
- Edge case: `prefers-reduced-motion: reduce` — `reveal` class is never added; element stays at natural opacity.
- Edge case: Cleanup on unmount — `disconnect` is called when component unmounts.

**Verification:**
- `pnpm test src/app/__tests__/reveal-section.test.tsx` passes.
- In browser: sections below the hero are invisible on page load and fade in as scrolled to.

---

- U4. **Wire page.tsx and integration test**

**Goal:** Replace the hero `<section>` with `<HeroParallax>`, wrap each of the five below-hero sections with `<RevealSection>`, and verify the full page structure is intact.

**Requirements:** R1, R2, R4, R6

**Dependencies:** U2, U3

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/__tests__/landing-page.test.tsx`

**Approach:**
- Remove the hero `<section>` block from `LandingPage`; replace with `<HeroParallax />` (no props needed — component is self-contained with static data).
- Import `RevealSection` and wrap each of the five `<section>` elements below the hero in a `<RevealSection>` tag.
- The five `<div className="border-t border-white/10" />` dividers between sections remain unchanged and outside any wrapper.
- The file keeps no `"use client"` directive — it remains a server component that composes client islands.
- The three static data arrays (`steps`, `whyOnChain`, `whoFor`) stay in `page.tsx` and are used by the now-inline section JSX (they are not moved into `HeroParallax`).

**Patterns to follow:**
- `src/app/listing/[id]/page.tsx` — server shell that imports and renders a `'use client'` detail component.

**Test scenarios (integration):**
- Happy path: Full page renders without errors — `render(<LandingPage />)` does not throw.
- Happy path: Hero heading present — `screen.getByRole('heading', { level: 1 })` found.
- Happy path: All five below-hero sections present — "The problem", "Why on-chain", "How it works", "Who builds with Mnemos", and "Open protocol" headings / text detectable via `screen.getByText` or `screen.getAllByRole`.
- Happy path: CTA links intact — "Browse marketplace" links to `/marketplace`.
- Integration: `RevealSection` wrappers present — five elements with class `reveal` exist in the DOM after `act()`.

**Verification:**
- `pnpm test` (full suite) passes with zero regressions.
- In browser with devtools: `page.tsx` has no `"use client"` directive; Network tab shows it pre-rendered in server HTML.
- Visual check: hero parallax + section reveals work on a full scroll-through of the landing page.
- Visual check (reduced motion): opening the page with OS-level "Reduce Motion" enabled shows all sections fully visible with no animation.

---

## System-Wide Impact

- **Interaction graph:** Only `src/app/page.tsx` and `src/app/layout.tsx` are affected. No middleware, no API routes, no chain reads.
- **Error propagation:** Both client components contain no async operations. Errors would surface as React render errors (crash with error boundary or blank section). No silent failure modes.
- **State lifecycle risks:** None. Both components use `useRef` (not `useState`) for mutable DOM state. No React re-renders triggered by scroll or intersection events.
- **API surface parity:** No public API, no exported types changed.
- **Integration coverage:** The integration test in U4 verifies the server component correctly imports and renders both client islands.
- **Unchanged invariants:** `/marketplace`, `/dashboard`, and `/listing/[id]` pages are not touched. The header, footer, and layout background are unchanged.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `backdrop-filter` interaction with ancestor `transform` | The `transform` is on the `RevealSection` wrapper `<div>`, not on the `.glass-card` elements inside it. `backdrop-filter` and `transform` interacting on the *same* element is the known issue — here they are on different elements (wrapper vs. inner card). No conflict expected. |
| Flash of invisible content on hydration | Accepted: IntersectionObserver is async so sections in the initial viewport briefly flash opacity 0 → 1. Window is < 50 ms in practice. Per hackathon scope, acceptable. |
| jsdom scroll test flakiness | `window.scrollY` must be mocked via `Object.defineProperty` before each relevant test. Test teardown should reset it. Document this in test file comments. |
| Hero data arrays duplicated in new component | **Do not move the data arrays into `_hero-parallax.tsx`.** The hero JSX is self-contained static data — keep `steps`, `whyOnChain`, `whoFor` in `page.tsx` where they belong. HeroParallax does not need them. |

---

## Sources & References

- **Origin document:** `docs/brainstorms/landing-parallax-requirements.md`
- Hero section source: `src/app/page.tsx` (lines 60–103)
- Layout background: `src/app/layout.tsx` (lines 27–52)
- Existing client component pattern: `src/app/listing/[id]/_listing-detail.tsx`
- Test setup: `src/test/setup.ts`, `src/test/render.tsx`
- Vitest config: `vitest.config.ts`
