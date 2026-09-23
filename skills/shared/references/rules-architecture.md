# Architecture Rules: Layers, Imports, Boundaries, Specificity, Nesting, @scope, Project Scaffold

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

### Existing Layer Architecture

Priority: HIGH

- Required: if the project already declares a layer order (a framework such as Tailwind v4's `@layer theme, base, components, utilities`, or a house convention), adopt it. Never prepend or re-declare the seven-layer order on top of it. Map roles onto the existing names (`theme` → `tokens`; missing `layout`/`overrides` → nested layers such as `components.layout`, or a single appended layer declared once alongside the existing order) and state the mapping once.
- The seven-layer order is the default for projects with no layer declaration, not a replacement for one that works.

### Third-Party CSS

Priority: HIGH

- Required: import every third-party stylesheet into a layer. Unlayered CSS beats all layered CSS regardless of specificity, so a single unlayered vendor file silently overrides the whole design system.
- Required: import third-party component CSS into `components.vendor`, declared before any other `components` sub-layer. Rules written directly in `components` beat every nested sub-layer, so project components and utilities win over vendor styles without specificity hacks. Third-party resets/normalizers go in `reset`.
- Where a vendor stylesheet cannot be imported (injected by a script at runtime), document that at the use site; its rules are unlayered and will win — fix conflicts in the vendor's configuration, not by escalating specificity.

```css
@layer reset, tokens, base, layout, components, utilities, overrides;
@layer components.vendor;

@import url("vendor/datepicker.css") layer(components.vendor);
```

### `!important` Reverses Layer Order

- `!important` declarations cascade in **reverse** layer order: an important declaration in `reset` beats an important declaration in `overrides`. This is why the `overrides`-layer `!important` exception ([prohibited-patterns.md](prohibited-patterns.md)) only works against third-party *inline* styles and unlayered `!important` code — never use `!important` to win against another layer of this project.

### Nested Layers

Priority: MEDIUM

- Prefer nested layers (`@layer components.card { }`) to sub-order rules inside one top-level layer without touching the layer order declared at the entry stylesheet. A nested layer is ordered by first appearance within its parent, same rule as top-level layers.
- Prohibited: anonymous `@layer { }` blocks. An unnamed layer cannot be targeted again from another file — later code can't extend it or override it by name, so it is effectively unreachable except where it was first declared.
- Required: `revert-layer` to roll a declaration back to the value it would have had from the previous layer, instead of duplicating that layer's value or deleting the override and losing the intent.

```css
@layer components {
  @layer card, card.actions;

  @layer card {
    .card {
      padding-block: var(--space-m);
    }
  }

  @layer card.actions {
    .card :where(.actions) {
      gap: var(--space-s);
    }
  }
}

@layer overrides {
  .card {
    padding-block: revert-layer; /* rolls back to the components-layer value, not the UA default */
  }
}
```

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
- Prefer `supports(...)` on `@import` to load a stylesheet only when the features it depends on are supported, instead of shipping the file unconditionally and gating individual rules inside it.
- A media condition on `@import` scopes the whole file to that condition — equivalent to wrapping its entire contents in that media query, without editing the file itself.

```css
@import url("components/card-anchored.css") layer(components) supports(position-anchor: --a);
@import url("print.css") layer(overrides) print;
```

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
- ID exception: only where the platform keys behavior to the id itself — `:target` matches against the URL fragment, so `:has(#section:target)` has no class-based equivalent. Never for a hook that could be a class; if the element carries one, match that instead.

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

## @scope — Stability: Emerging

Priority: MEDIUM — direct on `modern` (capability `true`); unguarded progressive enhancement on `evergreen` (capability `optional*`); unavailable on `enterprise`/`legacy` (capability `false`) — see [browser-profiles.md](browser-profiles.md).

Never wrap `@scope` in `@supports at-rule(@scope)`: `at-rule()` is not Baseline, so the guard drops the block in engines that support `@scope`. An engine without `@scope` drops the block by itself. On `evergreen`, keep an unscoped rule at equal or lower specificity (`:where(.card) a`) as the usable default, and let the scoped rule win by proximity where supported.

Prefer a component root class with nesting whenever nesting can express the relationship. Reach for `@scope` only when nesting cannot: a donut scope, or a genuine scoping-proximity conflict (below). `@scope` is a scoping tool, not a specificity tool — never reach for it to win a cascade fight.

### Scoping proximity — the reason to use it

When two scoped rule blocks of equal specificity both match the same element, the cascade does not fall back to source order. It picks the rule whose scope root is the **nearest ancestor** of the matched element. This is a real cascade step — distinct from layers and specificity, both of which are global tiebreakers blind to DOM position — and it is what `@scope` is actually for.

Concretely: a `.card` nested inside another `.card` (a featured card wrapping a related item, a comment nesting a reply) has two candidate rules for its own `a` — the outer card's and the inner card's — at identical specificity. Without `@scope`, source order decides, so the wrong rule can win depending on write order, and fixing it means adding a modifier class to every nested instance. With `@scope`, the inner card's `@scope (.card)` root is nearer to its own `a`, so the inner rule wins regardless of source order — the conflict resolves structurally instead of by convention.

```css
@layer components {
  @scope (.card) {
    a {
      color: var(--color-link-on-surface);
    }
  }
}
```

### Forms

Donut scope — style everything between a root and a lower boundary, excluding the boundary element's own subtree:

```css
@layer components {
  @scope (.card) to (.card-slot) {
    a {
      color: var(--color-link-on-surface);
    }
  }
}
```

No-limit form — a root with no boundary, when the donut's exclusion isn't needed but proximity still is (the nested-card case above is the no-limit form):

```css
@scope (.card) {
  a {
    color: var(--color-link-on-surface);
  }
}
```

Prefer the no-limit form over the donut form whenever there is no inner boundary to exclude — adding `to (...)` when nothing needs excluding is noise.

### :scope and &

`:scope` inside a scoped block targets the scope root element itself. `&` refers to the scope root as a compound selector, usable anywhere a selector can appear inside the block — including combined with other selectors, which `:scope` alone cannot do.

```css
@scope (.card) {
  :scope {
    border-radius: var(--radius-card);
  }

  &:hover {
    box-shadow: var(--shadow-raised);
  }
}
```

### Specificity

The scope root's own selector (`.card` in `@scope (.card)`) contributes **zero** specificity to the rules written inside the block — only the selectors inside count. `@scope (#sidebar) { a { color: var(--color-link-on-surface); } }` still specifies `a` at (0,0,1), not (1,0,1), even though the root is an ID selector. `:scope` and `&`, when written explicitly inside the block, do contribute their own specificity. Do not use `@scope` as a way to make a heavy root selector "free" — it changes what wins by proximity, not by weight.

## Project Scaffold

Priority: LOW

The layer contract above implies a canonical file layout. State it once so generated projects land on it consistently rather than re-deriving it per task:

```
styles/
├── reset.css           # @layer reset
├── tokens.css          # @layer tokens
├── base.css            # @layer base
├── layout.css          # @layer layout
├── components/         # @layer components — one file per component
│   ├── card.css
│   └── button.css
├── utilities.css       # @layer utilities
└── overrides.css       # @layer overrides
```

Entry stylesheet declares the order once, then imports each file into its layer:

```css
@layer reset, tokens, base, layout, components, utilities, overrides;

@import url("reset.css") layer(reset);
@import url("tokens.css") layer(tokens);
@import url("base.css") layer(base);
@import url("layout.css") layer(layout);
@import url("components/card.css") layer(components);
@import url("components/button.css") layer(components);
@import url("utilities.css") layer(utilities);
@import url("overrides.css") layer(overrides);
```

One file per component under `components/`, matching Component Boundaries (one root class per component).
