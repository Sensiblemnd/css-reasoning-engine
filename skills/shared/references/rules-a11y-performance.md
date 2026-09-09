# Accessibility and Performance Rules

# Accessibility

## Focus

Priority: HIGH

- Required: visible focus styles via `:focus-visible` for every interactive element.
- Prohibited: `outline: none` / `outline: 0` without a `:focus-visible` replacement in the same change.

Preferred:

```css
@layer base {
  :where(a, button, input, select, textarea, [tabindex]):focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }
}
```

Avoid:

```css
button:focus {
  outline: none;
}
```

## Motion

Priority: HIGH

- Required: every animation and non-trivial transition is guarded for `prefers-reduced-motion`.
- Prefer the opt-in pattern — motion only when the user allows it:

```css
@media (prefers-reduced-motion: no-preference) {
  .card {
    transition: transform 200ms ease-out;
  }
}
```

- For essential motion (loading indicators), reduce rather than remove: shorten duration, drop travel distance, keep opacity cues.

## Contrast and Forced Colors

Priority: HIGH

- Required: respect `prefers-contrast: more` when styles reduce contrast (subtle borders, low-contrast placeholders) — strengthen them under the query.
- Required: do not break `forced-colors: active`. Never disable it (`forced-color-adjust: none`) except for color swatches whose color IS the content.
- In forced-colors mode, boundaries drawn with `background` or `box-shadow` disappear — Required: `border` (can be `transparent` normally) on elements whose shape must survive:

```css
.button {
  border: 1px solid transparent; /* becomes visible in forced-colors */
}
```

## Transparency

Priority: MEDIUM

- Required: respect `prefers-reduced-transparency` on any element whose background relies on transparency or `backdrop-filter` for legibility (glass/frosted panels, translucent overlays) — raise the background's opacity or fall back to a solid token under the query instead of leaving low-vision users to fight reduced contrast the OS already told the page they don't want.

```css
@media (prefers-reduced-transparency: reduce) {
  @layer components {
    .glass-panel {
      background: var(--color-surface);
      backdrop-filter: none;
    }
  }
}
```

## Zoom and Scaling

Priority: HIGH

- Prohibited: any zoom-blocking technique (`user-scalable=no`, `maximum-scale=1` guidance, `touch-action` abuse).
- Required: layouts survive 200% zoom and 400% reflow — no fixed pixel heights on text containers; prefer `min-block-size` over `block-size` for text-bearing boxes.
- Required: `rem` for font sizes and type-related tokens so user font-size preferences apply.

## Semantic HTML Compatibility

Priority: MEDIUM

- Never use CSS to fake semantics (a styled `div` where `button` belongs). Flag the HTML instead.
- Never reorder meaningfully with `order` / `flex-direction: *-reverse` when the visual order must match focus/reading order.
- `reading-flow`/`reading-order` — Stability: Experimental, single-engine. Never generate unless explicitly requested; the underlying rule above (visual order must not diverge from focus/reading order) applies regardless of whether `reading-flow` is available — it is a future tool for stating the intended order explicitly, not a license to reorder with `order` in the meantime.
- Never remove content from the accessibility tree for styling reasons (`display: none` on content that should remain readable) — use a visually-hidden utility in `utilities`.

# Performance

## Selectors

Priority: MEDIUM

- Prohibited: universal descendant patterns (`.app * `), selector chains > 3 compounds, unanchored `:has()`.
- Prefer a single class per rule; prefer `:is()`/`:where()` grouping over repeated long selectors.

## Animation Cost

Priority: HIGH

- Required: animate only `transform` and `opacity`.
- Prohibited: animating layout properties (`width`, `height`, `top`, `left`, `margin`, `padding`, `font-size`) and `transition: all`.
- Required: list transitioned properties explicitly:

```css
.card {
  transition: transform 200ms ease-out, opacity 200ms ease-out;
}
```

- Prefer `will-change` never as a default; only for a measured problem, applied just before the animation and removed after.

### Containing Block Side Effect

- Required: before adding `transform`, `filter`, `backdrop-filter`, `perspective`, or `will-change: transform` (any of these, even at `1`/`none` idle values) to an element, check for `position: fixed` descendants anywhere inside it — these properties create a new containing block, so the descendant resolves `fixed` positioning against the transformed/filtered ancestor instead of the viewport, breaking modals, tooltips, and sticky overlays nested inside animated cards/lists.
- Required: when this conflict exists, either animate on a wrapper that has no `position: fixed` descendants, or render the fixed-position element outside the animated ancestor (portal/late-DOM placement) instead of removing the animation.

## Rendering Containment

Priority: MEDIUM

- Prefer `contain: layout style` (or `content`) on self-contained, repeated components (cards, list items) whose internals cannot affect outside layout.
- Prefer `content-visibility: auto` with `contain-intrinsic-block-size` on long off-screen sections:

```css
.feed-section {
  content-visibility: auto;
  contain-intrinsic-block-size: auto 40rem;
}
```

- Never apply containment to elements with overflowing children (popovers, tooltips) — it clips them.

## Reflow Discipline

Priority: MEDIUM

- Prefer `aspect-ratio` + reserved space (`contain-intrinsic-size`, explicit grid tracks) so async content (images, embeds, fonts) does not shift layout.
- Required: `font-display: swap` or `optional` on `@font-face`; prefer `size-adjust` metrics overrides on fallback fonts for zero-CLS font loading.
- Prefer `scrollbar-gutter: stable` on containers whose content can toggle between scrollable and non-scrollable (e.g. a panel that grows past its viewport on some states) — reserves the scrollbar's space up front so its appearance doesn't shift adjacent layout.

```css
@layer components {
  .panel-body {
    scrollbar-gutter: stable;
  }
}
```
