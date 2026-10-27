# Layout Rules: Grid, Named Areas, Flexbox, display: contents, Logical Properties, Container Queries, Overflow, Units

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
- Never make a running-text container (a paragraph, a label, a heading with inline links/`<strong>`/`<code>`) a flex or grid container. Each text run and each inline element becomes a separate item: the spaces between them collapse, and the text stops wrapping as a paragraph. To align an icon with a label, wrap the text in its own element and flex the parent, then center the icon on the first line with an `lh` offset ([rules-color-typography.md](rules-color-typography.md) Line-Relative Sizing), or use `vertical-align`/`text-box-trim` on the icon.
- Prefer `gap` for spacing between siblings in any Grid/Flex context. Never simulate gap with child margins.
- Masonry layout (`grid-template-rows: masonry`, `grid-lanes`) — Stability: Experimental, single-engine. Never generate unless explicitly requested; when requested, pair with a documented fallback (`auto-fit`/`auto-fill` column grid) for the profile's other capability-`false` targets. Do not invent masonry as the default answer to "Pinterest-style" layout requests — that is `auto-fit`/`auto-fill` with `minmax()` today (see Intrinsic Sizing below).
- `flex-wrap: balance` and `flex-line-count` — Stability: Experimental, Chromium only (150+). Never generate unless explicitly requested. When requested, declare `flex-wrap: balance` after `flex-wrap: wrap` with no `@supports`: other engines ignore it and keep normal wrapping, which is a correct state. Never pair `flex-line-count` with `flex-direction: column` to fake masonry columns: the visual order then runs down the columns while reading and focus order run across them. The Stable answer to a lone item on the last wrapped row is `justify-content: center` on the container or a container query that changes the items' `flex-basis`.

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

### Named Grid Areas

Priority: MEDIUM

- Prefer `grid-template-areas` for a grid with three or more placed regions (page shells, cards with media, body and actions). Each item gets `grid-area: <name>` once; a container or media query then changes only the container's `grid-template-areas` and track sizes, never each item's placement.
- Never re-place the same items by line number in several queries (`grid-column: 2 / 4` overridden per breakpoint). Every layout change then edits one rule per item, and the line numbers drift apart silently.
- Name areas by content role (`media`, `body`, `actions`), never by position (`left`, `top`): the position is exactly what changes between layouts.
- Rearranging areas moves boxes, not the DOM. Never use it to put content in a visual order that contradicts reading and focus order ([rules-a11y-performance.md](rules-a11y-performance.md) Semantic HTML Compatibility).

```css
@layer components {
  .product-card {
    container-type: inline-size;
  }

  .product-card-layout {
    display: grid;
    grid-template-areas:
      "media"
      "body"
      "actions";
    gap: var(--space-m);
  }

  .product-card-media {
    grid-area: media;
  }

  .product-card-body {
    grid-area: body;
  }

  .product-card-actions {
    grid-area: actions;
  }

  @container (inline-size > 40rem) {
    .product-card-layout {
      grid-template-areas:
        "media body"
        "media actions";
      grid-template-columns: minmax(12rem, 1fr) 2fr;
    }
  }
}
```

### Flattening Wrappers: `display: contents`

Priority: MEDIUM

`display: contents` removes an element's box so its children take part in the parent's grid or flex layout.

- Prefer subgrid when the children must align to the parent's tracks and the wrapper still has a visual job (background, border, padding). Use `display: contents` only when the wrapper's box does nothing.
- Required: only on generic wrappers: `div`, `span`, or the `<p>` that Markdown wraps around a lone image. Never on interactive elements (`a`, `button`, `summary`), form labels and groups (`label`, `legend`, `fieldset`, `option`, `optgroup`, `output`), headings, lists (`ul`, `ol`, `li`, `dl`), table elements, landmarks (`nav`, `main`, `header`, `footer`, `aside`, `search`, `form`), `article`, `figure`, `details` or `dialog`. Engines have repeatedly dropped such elements' roles from the accessibility tree: Chrome and Firefox only fixed lists in 2021, and WebKit still hides `<details>` content from VoiceOver as of 2025. A `display: contents` button also has no box, so it has no focus ring and no hit area of its own.
- Never on replaced elements and form controls (`img`, `video`, `audio`, `iframe`, `canvas`, `embed`, `object`, `svg`, `input`, `select`, `textarea`, `meter`, `progress`). For these the spec makes `display: contents` behave as `display: none`: the element and its alt text disappear.
- A `section` with an accessible name (`aria-label`, `aria-labelledby`) is a region landmark, so the landmark rule applies to it too. The linter can't see the name and does not flag `section`; the reviewer does. The linter enforces the rest as `no-semantic-display-contents`, including through `:is()`/`:where()` and nested `&`.
- The wrapper's own box styles stop applying: its padding, border, background and `gap` disappear. Inherited properties (`color`, `font`) still reach the children.
- To ungroup only at some sizes, put `display: contents` inside the container query, so the grouped layout is the default.

```css
@layer components {
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));
    gap: var(--space-m);
  }

  .feature-grid > .feature-group {
    display: contents; /* the group div only exists for other layouts; its items join this grid */
  }
}
```

Avoid (the list stops being announced as a list in engines with the bug):

```css
.site-nav ul {
  display: contents;
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
- Prefer logical container units (`cqi`, `cqb`, `cqmin`) over their physical equivalents (`cqw`, `cqh`) for values that scale with the container — same reasoning as the Logical Properties table above. `cqw`/`cqh`/`cqmax` exist and are valid, but reach for them only for the same physical-anchoring exception (a value that must not flip with writing mode):

```css
.card-title {
  font-size: clamp(var(--text-m), 4cqi, var(--text-xl));
}
```

### Container Style Queries — Stability: Emerging

Priority: MEDIUM — direct on `modern`; unguarded progressive enhancement on `evergreen` (capability `optional*` — see [browser-profiles.md](browser-profiles.md)); unavailable on `enterprise`/`legacy`.

`@container style(--variant: featured)` queries a container's own custom-property value rather than its size — use it when a component has a token-driven variant (a `--variant` or `--density` custom property set by the page) that should change several descendant declarations at once. It is not a replacement for a modifier class where a class reads better: a one-off visual difference (`.card--featured`) stays a class; a variant that composes with container size queries, or that a parent sets without the component's own markup knowing about it, is what style queries are for.

Never wrap a style query in `@supports`. There is no valid `@supports` test for it — `@supports` accepts a declaration test, `selector()`, `font-tech()`, `font-format()`, and the not-yet-Baseline `at-rule()`/`named-feature()`, none of which can express a style query, so `@supports style(...)` is an unrecognized condition that evaluates false and drops the block in *every* engine, including ones where style queries work. Required instead: an unsupported engine simply ignores the `@container style()` block, so the un-queried state must be a usable default on its own. That is the progressive-enhancement contract for this feature on `evergreen` — carried by the base rule, not by a guard.

```css
@layer components {
  .card {
    container-type: inline-size;
    container-name: card;
    /* base state must stand alone — engines without style queries stop here */
  }

  @container card style(--variant: featured) {
    .card-title {
      font-size: var(--text-xl);
    }
  }
}
```

## Overflow

Priority: HIGH

- Required: `overflow: clip` (not `hidden`) when the intent is only "cut off what sticks out": decorative bleed, rounded-corner clipping of media, stopping a horizontal overflow at a section edge. `overflow: hidden` makes the element a scroll container, which:
  - silently breaks `position: sticky` on every descendant: they stick to this non-scrolling box instead of the viewport, so they never stick at all;
  - can still be scrolled programmatically and by focus moving into hidden content, shifting the layout for keyboard users.
- `overflow: hidden` is correct only when a scroll container is actually wanted, such as a scroller whose scrolling is driven by script. Say so in a comment. To contain floats or margins (a new block formatting context), use `display: flow-root`, not `overflow`.
- Prefer `overflow-inline`/`overflow-block` over `overflow-x`/`overflow-y` (Stable, [browser-profiles.md](browser-profiles.md)).
- Never put `overflow: hidden` on `html`/`body` to "fix" horizontal scroll. It hides the bug: the content still overflows, and it's now unreachable at narrow sizes and under zoom. Set on both `html` and `body`, it also turns `body` into the scroll container and breaks every sticky header. Find the overflowing element (usually unsized media or a fixed width) and fix that.
- `overflow-clip-margin` is not verified as Baseline. Don't depend on it; if a clipped edge needs room for a shadow or focus ring, add padding instead.

Preferred:

```css
@layer components {
  .hero {
    overflow: clip; /* trims the decorative bleed; .hero-nav below can still be sticky */
  }
}
```

Avoid:

```css
html,
body {
  overflow-x: hidden; /* hides the overflow bug; body becomes the scroller, sticky breaks */
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
- Required: apply inline safe-area insets with the *physical* properties (`padding-left`/`padding-right`), not `padding-inline`. `safe-area-inset-left/right` name physical device regions that do not flip with writing mode, but `padding-inline` resolves start/end against it — so in RTL a `padding-inline` shorthand pairs the left inset with the physical right edge. This is the documented physical-anchoring exception from Logical Properties above, not a violation of it.
- Note (outside CSS): `env()` safe-area values only resolve to non-zero on iOS Safari when the page's `<meta name="viewport">` includes `viewport-fit=cover`. Flag this as a dependency if reviewing/generating for a project targeting iOS, since CSS alone can't fix a missing viewport meta tag.

```css
@layer components {
  .bottom-nav {
    padding-block-end: max(env(safe-area-inset-bottom, 0px), 1rem);
    /* physical left/right on purpose: safe areas are physical device regions and
       must not flip with writing mode (see Logical Properties exception) */
    /* lint-ignore: no-physical-property */
    padding-left: max(env(safe-area-inset-left, 0px), 1rem);
    padding-right: max(env(safe-area-inset-right, 0px), 1rem);
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
