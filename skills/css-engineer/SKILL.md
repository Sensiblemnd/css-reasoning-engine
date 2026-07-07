---
name: css-engineer
description: Deterministic rules for writing and generating modern native CSS. Use whenever creating stylesheets, styling components or pages, implementing designs, or making layout, color, typography, animation, or responsive-design decisions. Enforces cascade layers, design tokens, logical properties, container queries, accessibility, and performance rules with configurable browser-compatibility profiles. For auditing existing CSS use css-reviewer; for modernizing existing CSS use css-refactor.
version: 2.1.0
priority: high
---

# CSS Engineer

This skill is a rule system, not a tutorial. Apply every rule below to all generated CSS. Load reference files from `../shared/references/` only for the topics the current task touches (see Rule Routing). Code examples in reference files are minimal fragments illustrating one rule; emitted CSS must still satisfy every universal rule (layers, tokens, logical properties).

# Philosophy

1. Native CSS over JavaScript.
2. Browser features over preprocessors.
3. Composition over specificity.
4. Semantic tokens over literal values.
5. Components over global selectors.
6. Accessibility is mandatory.
7. Performance is part of correctness.
8. Progressive enhancement by default.
9. The cascade is a feature.
10. Simple CSS over clever CSS.

# Browser Compatibility Policy

Required: resolve the project's browser profile before generating CSS. Sources, in order: explicit user instruction → project config (`browserslist`, `.browserslistrc`, `baseline` field) → default `evergreen`.

| Profile      | Fallbacks   | Behavior |
| ------------ | ----------- | -------- |
| `modern`     | none        | Generate all Stable features directly. Never emit fallbacks or `@supports` for Stable features. |
| `evergreen`  | minimal     | Generate Stable features directly. `@supports` only for Emerging features. |
| `enterprise` | progressive | Working baseline first, then enhance inside `@supports`. |
| `legacy`     | extensive   | Fully functional fallback required for every non-universal feature. |

Reason from capabilities, never from browser names or versions. The capability map, feature stability table, and `@supports` rules are defined in [browser-profiles.md](../shared/references/browser-profiles.md).

Stability levels:

- **Stable** — generate normally (Grid, Flexbox, `clamp()`, Cascade Layers, Nesting, Container Queries, `:has()`, `:is()`, `:where()`, `light-dark()`, `color-mix()`, OKLCH, `@property`, logical properties, `@starting-style`, `@scope`).
- **Emerging** — generate only when the capability is confirmed for the profile; always behind progressive enhancement (View Transitions).
- **Experimental** — never generate unless explicitly requested (Anchor Positioning, Custom CSS Functions `@function`, unshipped specs).

# Decision Engine

Layout:
- Two-dimensional placement (rows AND columns)? → Grid.
- Alignment/distribution along one axis? → Flexbox.
- Neither? → Normal flow. Never add `display: flex` or `display: grid` without a layout need.

Responsive:
- Behavior depends on the viewport (page structure, navigation)? → Media query.
- Behavior depends on the component's own available space? → Container query.
- Fluid scaling of one value? → `clamp()` with viewport or container units. No query.

Spacing / sizing:
- Matching design token exists? → Required: use the token.
- No token? → Create a semantic token in the `tokens` layer, then use it. Never emit a raw magic value.

Color:
- Matching semantic color token exists? → Required: use the token.
- Derived shade/tint of a token? → `color-mix()` or relative color syntax from that token.
- New color? → Define an OKLCH token in the `tokens` layer, then use it. Never emit a hardcoded color in a component.

Animation:
- Animating `transform` or `opacity`? → Allowed; add a `prefers-reduced-motion` guard.
- Animating layout properties (`width`, `height`, `top`, `margin`)? → Prohibited; restructure to `transform`, or use `@starting-style` / view transitions per profile.

Scoping:
- Donut scope needed (root-to-boundary styling nesting cannot express)? → `@scope` when the profile capability is `true`.
- Otherwise? → Single component class + nesting (max depth 3).

# Rules

## Universal (apply to every task)

- Required: all CSS lives in a cascade layer. Layer order, declared once at the entry stylesheet:
  ```css
  @layer reset, tokens, base, layout, components, utilities, overrides;
  ```
  Never generate unlayered CSS unless explicitly requested.
- Required: tokens (custom properties in the `tokens` layer) for color, spacing, typography scale, radius, shadow, and z-index. Never hardcode these values in components.
- Required: logical properties (`margin-inline`, `padding-block`, `inline-size`, `block-size`, `inset-inline`) instead of physical ones (`margin-left`, `width`, `top`). Exception: physical viewport effects that must not flip with writing mode.
- Required: native CSS nesting, maximum depth 3. Never use Sass-style `&-suffix` string concatenation — it is invalid native CSS.
- Required: selector specificity ≤ (0,2,0) inside components. Use `:where()` to zero out specificity in shared/base selectors.
- Required: `@supports` only when the profile demands progressive enhancement for that feature. Never wrap Stable features for `modern`/`evergreen` profiles.
- Prefer editing existing tokens/layers/components over adding parallel new ones.

## Rule Routing

Load the reference file when the task touches its topic:

| Topic | File |
| ----- | ---- |
| Prohibited patterns (Required: load for every task) | [prohibited-patterns.md](../shared/references/prohibited-patterns.md) |
| Browser profiles, capability map, feature stability, `@supports` | [browser-profiles.md](../shared/references/browser-profiles.md) |
| Cascade layers, imports, component boundaries, specificity, nesting, `@scope` | [rules-architecture.md](../shared/references/rules-architecture.md) |
| Grid, Flexbox, logical properties, container queries/units, viewport units | [rules-layout.md](../shared/references/rules-layout.md) |
| Tokens, OKLCH, `light-dark()`, `color-mix()`, relative colors, `clamp()`, `text-wrap`, hyphenation | [rules-color-typography.md](../shared/references/rules-color-typography.md) |
| Focus, motion, contrast, forced colors, zoom, `contain`, `content-visibility`, animation performance | [rules-a11y-performance.md](../shared/references/rules-a11y-performance.md) |
| `@property`, `@starting-style`, View Transitions, Anchor Positioning, custom functions | [rules-advanced.md](../shared/references/rules-advanced.md) |

# Prohibited Patterns

Never emit anything on the canonical list in [prohibited-patterns.md](../shared/references/prohibited-patterns.md). Summary: no `!important`, ID selectors, inline styles, hardcoded colors/spacing, magic numbers, `transition: all`, Sass syntax, unlayered CSS, deep selector chains, cross-component selectors, removed focus indicators, zoom blocking, color-only meaning, layout-property animation, or unnecessary wrappers. Every exception must be explicitly requested or documented with a comment at the use site.

# Self Review Checklist

Required: verify every item before emitting CSS. If any item fails, fix the CSS first.

Architecture:
- [ ] All rules inside cascade layers; layer order declared once
- [ ] Tokens used for color, spacing, type, radius, shadow, z-index
- [ ] Specificity ≤ (0,2,0); no ID selectors; no `!important`

Modern CSS:
- [ ] Container queries used for component-driven responsiveness
- [ ] Logical properties used; physical properties justified
- [ ] Nesting depth ≤ 3; no Sass syntax
- [ ] `:has()` / `:is()` / `:where()` used where they remove duplication

Typography & Color:
- [ ] Fluid type/spacing uses `clamp()`
- [ ] `text-wrap: balance` (headings) / `pretty` (body) considered
- [ ] Colors from semantic tokens; OKLCH for definitions; `light-dark()` for schemes

Accessibility:
- [ ] `:focus-visible` styles present; no removed focus indicators
- [ ] Animations guarded by `prefers-reduced-motion`
- [ ] Contrast meets WCAG AA; `forced-colors` not broken; zoom not blocked

Performance:
- [ ] Animations limited to `transform` / `opacity`
- [ ] No expensive selectors (universal descendant, deep chains, unanchored `:has()`)
- [ ] `contain` / `content-visibility` applied to independent, off-screen-heavy regions

Compatibility:
- [ ] Browser profile resolved and respected
- [ ] `@supports` only where the profile requires it
- [ ] Emerging features degrade gracefully

Output:
- [ ] Zero prohibited patterns
- [ ] No dead or duplicate rules
- [ ] CSS is production-ready as emitted
