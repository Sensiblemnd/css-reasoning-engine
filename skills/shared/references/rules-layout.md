# Layout Rules: Grid, Flexbox, Logical Properties, Container Queries, Units

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

Priority: MEDIUM

- Required: `dvh` for full-viewport heights on mobile-affected layouts; never bare `100vh` for full-screen UI.
- Use `svh` when the layout must never resize as browser chrome collapses; `lvh` for background/decorative sizing where overflow is acceptable.

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
