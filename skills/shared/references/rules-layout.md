# Layout Rules: Grid, Flexbox, Logical Properties, Container Queries, Units

## Responsive Layout Baseline

Priority: HIGH

Responsive behavior is a default requirement of every layout, not an opt-in feature requested separately. Apply this section whether or not the task mentions "responsive," "mobile," or breakpoints.

- Required: every layout (page-level or component-level) must remain usable and legible from narrow viewports (~320px inline size) through wide viewports/containers, unless the user explicitly scopes the task to a fixed-size context (e.g., an email client, a print stylesheet, a fixed-size widget).
- Never hardcode a layout container to a fixed pixel `width`/`inline-size` as its only sizing rule. Use fluid tracks (`fr`, `minmax()`, `auto-fit`/`auto-fill`), percentage/`%`-based or `min()`/`max()`-clamped sizing, or an explicit `max-inline-size` paired with fluid inline sizing below it.
- Required: pick the correct responsive tool for the reason the layout changes — do not default to media queries out of habit:
  - Viewport-driven change (page structure, nav pattern, `prefers-*`) → media query.
  - Component's own available space drives the change → container query.
  - A single value should scale smoothly with no discrete step → `clamp()` — no query needed.
- Required: write media and container queries with range comparison syntax (`@media (width < 60rem)`, `@container (inline-size > 30rem)`), not the `min-width`/`max-width` prefixed form — Baseline since 2023, no fallback needed for `modern`/`evergreen`/`enterprise`. Exception: `legacy` profile — an unsupported engine fails to parse the whole query rather than degrading, so use the prefixed `min-width`/`max-width` form there instead.
- Content must reflow (wrap, stack, resize) rather than overflow, clip, or force horizontal scrolling at any viewport/container size in scope.
- Touch targets and interactive elements must remain usable at narrow inline sizes (no reliance on hover-only affordances for core functionality).

### Responsive Media (img, video, iframe, embed)

- Required: replaced elements get `max-inline-size: 100%; block-size: auto` (or equivalent) so they never force a container wider than its track — the most common source of horizontal overflow on narrow viewports.
- Required: `aspect-ratio` on images/video/embeds with known intrinsic dimensions, instead of a fixed `block-size`, so the box reserves correct space at every inline size without distorting the content.
- Prefer `object-fit: cover`/`contain` (with `object-position` as needed) over stretching when a replaced element must fill a fixed-aspect box that doesn't match its intrinsic ratio.

```css
@layer base {
  :is(img, video, iframe) {
    max-inline-size: 100%;
    block-size: auto;
  }
}

@layer components {
  .card-media {
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }
}
```

## Grid vs Flexbox vs Flow

Priority: HIGH

- Two-dimensional placement (rows AND columns, overlap, explicit areas) → Required: Grid.
- One-axis alignment or distribution → Required: Flexbox.
- Plain stacked content → normal flow. Never add `display: grid`/`flex` without a layout need.
- Prefer `gap` for spacing between siblings in any Grid/Flex context. Never simulate gap with child margins.

Preferred:

```css
@layer components {
  .media-object {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-m);
  }
}
```

Avoid:

```css
.media-object > * + * {
  margin-left: 16px; /* physical property + magic number + fake gap */
}
```

## Subgrid

Priority: MEDIUM

- A nested grid's items must align to the parent grid's tracks (shared column/row rhythm across cards, form rows, table-like layouts) → Required: `subgrid`, not a redefinition of matching track sizes on the child.
- Never duplicate a parent's `grid-template-columns`/`rows` values on a descendant grid to fake alignment — track sizes drift the moment either grid changes. `subgrid` inherits the parent's resolved tracks instead.

Preferred:

```css
@layer components {
  .card-list {
    display: grid;
    grid-template-columns: auto 1fr auto;
  }

  .card {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
  }
}
```

Avoid:

```css
.card {
  display: grid;
  grid-template-columns: auto 1fr auto; /* duplicated from .card-list; drifts on change */
}
```

## Intrinsic Sizing

Priority: MEDIUM

- Prefer `minmax()`, `min()`, `max()`, `fit-content`, and `auto-fit`/`auto-fill` over fixed track sizes.
- Prefer content-driven wrapping over breakpoint-driven column counts:

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(20rem, 100%), 1fr));
  gap: var(--space-m);
}
```

## Logical Properties

Priority: HIGH

Required mappings (use left column; right column is prohibited unless the effect must not flip with writing mode):

| Use | Instead of |
| --- | ---------- |
| `margin-inline` / `margin-block` | `margin-left/right` / `margin-top/bottom` |
| `padding-inline` / `padding-block` | `padding-left/right` / `padding-top/bottom` |
| `inline-size` / `block-size` | `width` / `height` |
| `min-inline-size` / `max-block-size` | `min-width` / `max-height` |
| `inset-inline` / `inset-block` | `left/right` / `top/bottom` |
| `border-inline-start` | `border-left` |
| `text-align: start/end` | `text-align: left/right` |

Exception: viewport-anchored effects (e.g., a shadow that must stay on the physical right edge) — document the exception with a comment.

## Container Queries

Priority: HIGH

- Component responds to its own available space → Required: container query, not media query.
- Media queries are reserved for viewport concerns: page structure, navigation patterns, user preferences (`prefers-*`), print.

Preferred:

```css
@layer components {
  .card {
    container-type: inline-size;
    container-name: card;
  }

  @container card (inline-size > 30rem) {
    .card-body {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: var(--space-m);
    }
  }
}
```

Rules:

- Required: name containers (`container-name`) when more than one ancestor container can exist.
- Never make an element query its own size — the container must be an ancestor.
- Prefer container units (`cqi`, `cqb`, `cqmin`) for values that scale with the container:

```css
.card-title {
  font-size: clamp(var(--text-m), 4cqi, var(--text-xl));
}
```

## Viewport Units

Priority: HIGH

- Required: `dvh` for any block-size/height rule that spans (or is bounded by) the viewport on mobile-affected layouts — app shells, full-screen modals/sheets, `min-height`/`max-height` clamps. Never bare `100vh` for these; mobile browser chrome (address bar, toolbar) collapsing/expanding changes `vh` but not `dvh`, so `100vh` content gets clipped or leaves a dead gap.
- Use `svh` when the layout must never resize as browser chrome collapses (avoids a jump/reflow); `lvh` for background/decorative sizing where overflow is acceptable.
- `dvw`/`svw`/`lvw` exist but rarely matter in practice — the dynamic-viewport problem is a *height* problem (collapsing browser chrome), not a width problem. Do not reach for `dvw` by default; plain `vw`/`%` is fine for widths unless a specific horizontal chrome element (e.g. a resizable side panel) is identified.
- Required: pair every mobile-affected `100vh`/`50vh`/etc. with its `dvh` counterpart. If the profile requires a fallback (`enterprise`/`legacy`, capability `false`), keep `vh` as the pre-enhancement value and upgrade inside `@supports (height: 100dvh)`; for `modern`/`evergreen` (`dvh` capability `true`), emit `dvh` directly with no `vh` fallback and no `@supports` wrapper.

Preferred:

```css
.app-shell {
  min-block-size: 100dvh;
}
```

Avoid:

```css
.app-shell {
  height: 100vh; /* clipped under mobile browser chrome */
}
```

## Safe Area Insets

Priority: HIGH

Mobile viewports can be obscured by device notches, camera cutouts, rounded corners, and the home-indicator bar. Apply this section to any element that touches or is anchored to a physical viewport edge — fixed/sticky headers and bottom bars, edge-anchored FABs, fullscreen modals/sheets/drawers — regardless of whether the task mentions "mobile" or "notch" explicitly.

- Required: pad the edge-anchored side with `env(safe-area-inset-*)` using the function's own fallback argument — `env(safe-area-inset-bottom, 0px)` — rather than wrapping it in `@supports`. The fallback argument is always valid CSS and resolves to `0px` on engines/devices without the constant, so the `@supports` query adds nothing.
- Required: combine with `max()` when a minimum edge padding must exist even where there's no inset (e.g. desktop, non-notched devices): `padding-block-end: max(env(safe-area-inset-bottom), 1rem);`
- Never mix the two fallback strategies (a `@supports`-guarded base rule vs. an inline `env(x, fallback)`) for the same property inside one component — pick the inline-fallback form; it's simpler and covers the same cases.
- Note (outside CSS): `env()` safe-area values only resolve to non-zero on iOS Safari when the page's `<meta name="viewport">` includes `viewport-fit=cover`. Flag this as a dependency if reviewing/generating for a project targeting iOS, since CSS alone can't fix a missing viewport meta tag.

```css
@layer components {
  .bottom-nav {
    padding-block-end: max(env(safe-area-inset-bottom, 0px), 1rem);
    padding-inline: max(env(safe-area-inset-left, 0px), 1rem) max(env(safe-area-inset-right, 0px), 1rem);
  }
}
```

## Print

Priority: LOW

Print is one of the explicit fixed-size contexts exempted from the Responsive Layout Baseline above — exempted from fluid sizing, not from having any rules at all.

- Required: `@media print` rules for anything that shouldn't appear on paper — navigation, buttons, video/audio embeds, decorative backgrounds. Hide with `display: none`, not `visibility: hidden` (the latter still reserves the page space).
- Prefer `break-inside: avoid` on cards, table rows, and figures so a printed page doesn't split one unit across two sheets; `break-before: page` for sections that should always start a fresh page.
- Required: `print-color-adjust: exact` (`color-adjust: exact` for older engines) on elements whose background or color IS the content (charts, swatches, status badges) — browsers strip backgrounds by default to save ink, which silently breaks color-coded meaning.
- Never assume dark-mode tokens apply on paper — resolve `light-dark()` tokens to their light value inside `@media print` regardless of the user's `prefers-color-scheme`; printed output has no "dark mode."

```css
@media print {
  :is(.site-header, .side-nav, .cta-row, [data-print-hide]) {
    display: none;
  }

  .status-badge {
    print-color-adjust: exact;
  }

  :root {
    color-scheme: light;
  }
}
```

## Selectors in Layout

Priority: MEDIUM

- Prefer `:has()` for parent/state-dependent layout over JavaScript class toggling:

```css
.form-field:has(input:user-invalid) {
  border-color: var(--color-danger);
}
```

- Required: anchor `:has()` to a specific selector. Never `*:has(...)` or bare `:has()` on a universal ancestor.
- Prefer `:is()` to flatten selector lists; prefer `:where()` when the group must add zero specificity.
- Prefer `:not()` with a simple argument; never stack `:not()` chains deeper than 2.
