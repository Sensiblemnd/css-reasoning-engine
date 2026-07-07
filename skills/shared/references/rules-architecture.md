# Architecture Rules: Layers, Imports, Boundaries, Specificity, Nesting, @scope

## Cascade Layers

Priority: HIGH

Required: declare the layer order exactly once, first in the entry stylesheet:

```css
@layer reset, tokens, base, layout, components, utilities, overrides;
```

Layer contract:

| Layer | Contains | Never contains |
| ----- | -------- | -------------- |
| `reset` | Normalization, box-sizing | Component styles |
| `tokens` | `:root` custom properties, `@property` registrations | Selectors other than `:root` / `::backdrop` |
| `base` | Element defaults (`body`, `a`, `h1`–`h6`) | Class selectors |
| `layout` | Page-level scaffolding (shells, grids, regions) | Component internals |
| `components` | Component classes | Page-specific overrides |
| `utilities` | Single-purpose helpers | Multi-declaration rule blocks |
| `overrides` | Third-party fixes, documented exceptions | New design decisions |

Rules:

- Never emit a style rule outside `@layer` unless explicitly requested.
- Never re-declare the layer order in another file; `@layer components { }` blocks append, order stays fixed.
- Never fight layer order with specificity — move the rule to the correct layer instead.

## Imports

Priority: MEDIUM

Preferred:

```css
@layer reset, tokens, base, layout, components, utilities, overrides;

@import url("reset.css") layer(reset);
@import url("tokens.css") layer(tokens);
@import url("components/card.css") layer(components);
```

Rules:

- Required: every `@import` targets a layer via `layer(name)`.
- Never nest `@import` chains more than 2 levels deep.
- Prefer one file per component, imported into `components`.

## Component Boundaries

Priority: HIGH

- Required: one root class per component; all internal selectors nest under it.
- Never style another component's internals from outside it. Cross-component spacing belongs to the parent `layout` context (gap, grid), not to the child.
- Never use tag-only selectors inside `components` except for intrinsic children (`img`, `svg`, `::marker`) of the component root.

Preferred:

```css
@layer components {
  .card {
    display: grid;
    gap: var(--space-m);

    img {
      inline-size: 100%;
      block-size: auto;
    }
  }
}
```

Avoid:

```css
.sidebar .card .card-title a {
  color: var(--color-accent);
}
```

## Specificity Control

Priority: HIGH

- Required: component selectors stay at specificity ≤ (0,2,0).
- Required: `:where()` for shared/base selector groups so they are trivially overridable.
- Prohibited: ID selectors, `!important` (exception: `overrides` layer against third-party inline styles, with a comment), specificity hacks (`.card.card`).

Preferred:

```css
@layer base {
  :where(a, button) {
    color: var(--color-interactive);
  }
}
```

## Native Nesting

Priority: HIGH

- Required: native CSS nesting only. Maximum depth: 3 levels.
- Never use Sass-style concatenation — `&-suffix` is invalid in native CSS.
- Avoid nesting that does not encode a real structural or state relationship.

Preferred:

```css
.card {
  &:hover {
    box-shadow: var(--shadow-raised);
  }

  img {
    border-radius: var(--radius-s);
  }
}
```

Never:

```css
.button {
  &-icon { /* invalid: does not compile to .button-icon */ }
}
```

## @scope

Priority: MEDIUM — Stable feature: generate directly when the profile capability is `true` (`modern`, `evergreen`).

Use `@scope` only when a donut scope (styling between a root and a lower boundary) is needed and nesting cannot express it:

```css
@scope (.card) to (.card-slot) {
  a {
    color: var(--color-link-on-surface);
  }
}
```

Otherwise, prefer a component root class with nesting.
