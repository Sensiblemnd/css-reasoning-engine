---
name: css-engineer
description: Deterministic rules for writing and generating modern native CSS. Use whenever creating stylesheets, styling components or pages, implementing designs, or making layout, color, typography, animation, or responsive-design decisions. Enforces cascade layers, design tokens, logical properties, container queries, accessibility, and performance rules with configurable browser-compatibility profiles. For auditing existing CSS use css-reviewer; for modernizing existing CSS use css-refactor.
metadata:
  version: 2.2.0
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
7. Responsive layout is mandatory, not opt-in.
8. Performance is part of correctness.
9. Progressive enhancement by default.
10. The cascade is a feature.
11. Simple CSS over clever CSS.

# Browser Compatibility Policy

Required: resolve the project's browser profile before generating CSS. Sources, in order: explicit user instruction → project config (`browserslist`, `.browserslistrc`, `baseline` field) → default `evergreen`.

| Profile      | Fallbacks   | Behavior |
| ------------ | ----------- | -------- |
| `modern`     | none        | Generate all Stable features directly. Never emit fallbacks or `@supports` for Stable features. |
| `evergreen`  | minimal     | Generate Stable features directly. `@supports` only for Emerging features. |
| `enterprise` | progressive | Working baseline first, then enhance inside `@supports`. |
| `legacy`     | extensive   | Fully functional fallback required for every non-universal feature. |

Reason from capabilities, never from browser names or versions. The capability map, feature stability table (with per-feature Baseline since dates), and `@supports` rules are the single source of truth in [browser-profiles.md](../shared/references/browser-profiles.md) — do not enumerate features here; the list drifts from that file the moment either one is edited alone.

Stability levels, mechanically derived from Baseline status (see browser-profiles.md for the current per-feature table):

- **Stable** — Baseline widely available, or newly available ≥ 12 months. Generate normally.
- **Emerging** — Baseline newly available < 12 months. Direct on `modern`; `@supports`-gated on `evergreen`; `false` on `enterprise`/`legacy`.
- **Experimental** — not yet Baseline. Never generate unless explicitly requested.

# Decision Engine

Layout:
- Two-dimensional placement (rows AND columns)? → Grid.
- Alignment/distribution along one axis? → Flexbox.
- Neither? → Normal flow. Never add `display: flex` or `display: grid` without a layout need.

Responsive:
- Required baseline, always, regardless of whether the task mentions it: layouts adapt from narrow to wide viewports/containers — no fixed-width-only layout unless the context is explicitly fixed-size (email, print, fixed widget).
- Behavior depends on the viewport (page structure, navigation)? → Media query.
- Behavior depends on the component's own available space? → Container query.
- Fluid scaling of one value? → `clamp()` with viewport or container units. No query.
- Element's height spans/is bounded by the viewport on a mobile-affected layout? → Required: `dvh`, not bare `vh` (see Viewport Units).
- Element is anchored to a physical viewport edge (fixed header/bottom bar, edge FAB, fullscreen modal/sheet)? → Required: `env(safe-area-inset-*)` padding, always, regardless of whether the task mentions notches/mobile (see Safe Area Insets).

Spacing / sizing:
- Matching design token exists? → Required: use the token.
- No token? → Create a semantic token in the `tokens` layer, then use it. Never emit a raw magic value.

Color:
- Matching semantic color token exists? → Required: use the token.
- Derived shade/tint of a token? → `color-mix()` or relative color syntax from that token.
- New color? → Define an OKLCH token in the `tokens` layer, then use it. Never emit a hardcoded color in a component.

Animation:
- Animating `transform` or `opacity`? → Allowed; add a `prefers-reduced-motion` guard.
- Transitioning a custom property, or setting one inside `@keyframes`? → Required: register it with `@property` in the `tokens` layer (`syntax`, explicit `inherits`, and `initial-value` for any syntax but `*`). Without registration it cannot interpolate and the transition silently does nothing (see [rules-advanced.md](../shared/references/rules-advanced.md) @property).
- Animating layout properties (`width`, `height`, `top`, `margin`)? → Prohibited; restructure to `transform`, or use `@starting-style` / view transitions per profile.
- Effect is driven by scroll position (progress bar, reveal-on-scroll, parallax)? → Scroll-driven animations are Experimental (Firefox has not shipped `animation-timeline`). Do not generate unless explicitly requested; when requested, guard with `@supports (animation-timeline: view())` and ensure the unenhanced state is the *finished* state, never the starting one.

Scoping:
- Donut scope or a scoping-proximity conflict (nesting cannot express either)? → `@scope`: direct on `modern`, unguarded progressive enhancement on `evergreen` (never `@supports at-rule()` — not Baseline), unavailable on `enterprise`/`legacy` (see [rules-architecture.md](../shared/references/rules-architecture.md) @scope).
- Otherwise? → Single component class + nesting (max depth 3).

Overlays:
- Content must render above everything else (modal, menu, toast, combobox)? → `<dialog>`/`[popover]`, never a `position: fixed` element with an escalating `z-index` (see [rules-interaction.md](../shared/references/rules-interaction.md)).
- Overlay is anchored to a trigger element (tooltip, dropdown, popover positioned relative to a button)? → Anchor positioning (direct on `modern`, `@supports (position-anchor: --a)`-gated on `evergreen` — guard on `position-anchor`, never `anchor-name`), never a JS positioning library (see [rules-advanced.md](../shared/references/rules-advanced.md) Anchor Positioning).

Forms:
- Field fails constraint validation? → `:user-invalid` styling paired with the field's existing ARIA error wiring, never a JS-only error class (see [rules-forms.md](../shared/references/rules-forms.md)).
- Native control (checkbox, radio, range) needs brand color? → `accent-color`, never a hidden-input/wrapper hack.

Interaction:
- Hover-only visual effect? → inside `@media (hover: hover)`, with the same affordance reachable via `:focus-visible` (see [rules-a11y-performance.md](../shared/references/rules-a11y-performance.md) Pointer and Touch).
- Interactive target? → at least `--size-target-min` (24×24 CSS px) in both axes.
- Sticky/fixed header or bottom bar? → `scroll-padding-block-*` on the scroller so focused elements aren't hidden under it.

Existing project CSS:
- Project already declares a layer order (framework or house convention)? → adopt it and map roles onto it; never re-declare the seven-layer order (see [rules-architecture.md](../shared/references/rules-architecture.md) Existing Layer Architecture).
- Third-party stylesheet? → import it into `components.vendor` (or `reset` for normalizers), never leave it unlayered.

Print:
- Context is explicitly print/email/fixed-size? → apply the Print baseline ([rules-layout.md](../shared/references/rules-layout.md)) instead of the responsive baseline above.

# Rules

## Universal (apply to every task)

- Required: all CSS lives in a cascade layer. Layer order, declared once at the entry stylesheet:
  ```css
  @layer reset, tokens, base, layout, components, utilities, overrides;
  ```
  Never generate unlayered CSS unless explicitly requested. Exception: a project that already declares its own layer order keeps it (see Decision Engine → Existing project CSS).
- Required: tokens (custom properties in the `tokens` layer) for color, spacing, typography scale, radius, shadow, and z-index. Never hardcode these values in components.
- Required: logical properties (`margin-inline`, `padding-block`, `inline-size`, `block-size`, `inset-inline`) instead of physical ones (`margin-left`, `width`, `top`). Exception: physical viewport effects that must not flip with writing mode.
- Required: layouts are responsive by default (see [rules-layout.md](../shared/references/rules-layout.md) Responsive Layout Baseline) — fluid sizing, and media/container queries where the resize reason demands them, unless the task is explicitly scoped to a fixed-size context.
- Required: range comparison syntax (`@media (width < 60rem)`, `@container (inline-size > 30rem)`) for media/container queries on `modern`/`evergreen`/`enterprise`; the prefixed `min-width`/`max-width` form only on `legacy`, where an unsupported engine fails to parse the whole query instead of degrading (see [rules-layout.md](../shared/references/rules-layout.md) Responsive Layout Baseline).
- Required: mobile viewport correctness on every viewport-spanning or edge-anchored element — `dvh` (not bare `vh`) for mobile-affected heights, and `env(safe-area-inset-*)` padding for anything anchored to a physical viewport edge (see [rules-layout.md](../shared/references/rules-layout.md) Viewport Units and Safe Area Insets). Apply regardless of whether the task mentions mobile explicitly.
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
| Grid, Flexbox, logical properties, container queries/units, viewport units, print | [rules-layout.md](../shared/references/rules-layout.md) |
| Tokens, OKLCH, `light-dark()`, `color-mix()`, relative colors, `clamp()`, `text-wrap`, hyphenation | [rules-color-typography.md](../shared/references/rules-color-typography.md) |
| Focus, motion, contrast, forced colors, zoom, `contain`, `content-visibility`, animation performance | [rules-a11y-performance.md](../shared/references/rules-a11y-performance.md) |
| Validation states, native control color, labels/placeholder, field sizing, native select | [rules-forms.md](../shared/references/rules-forms.md) |
| `@property`, `@starting-style`, scroll-driven animations, View Transitions, Anchor Positioning, custom functions | [rules-advanced.md](../shared/references/rules-advanced.md) |
| Scroll snap, `overscroll-behavior`, `<dialog>`/`::backdrop`/`popover`/`:open`, `::details-content`, `@container scroll-state()`, CSS carousels | [rules-interaction.md](../shared/references/rules-interaction.md) |

# Prohibited Patterns

Never emit anything on the canonical list in [prohibited-patterns.md](../shared/references/prohibited-patterns.md). Summary: no `!important`, ID selectors, inline styles, hardcoded colors/spacing, magic numbers, `transition: all`, Sass syntax, unlayered CSS, deep selector chains, cross-component selectors, duplicate declarations an existing token/utility/component already covers, removed focus indicators, zoom blocking, color-only meaning, media queries duplicating a container query or `clamp()`, a `@supports`-guarded base rule plus enhancement for `env(safe-area-inset-*)` where the function's own fallback argument already covers it, fixed-width-only layout containers that don't reflow, vendor prefixes for Stable features, layout-property animation, unnecessary wrappers, `z-index` escalation for overlays that belong in the top layer, or a JS positioning library where anchor positioning applies. Note that JS scroll listeners are **not** prohibited by default — their CSS replacements (scroll-driven animations, `@container scroll-state()`) are Experimental. Every exception must be explicitly requested or documented with a comment at the use site.

# Self Review Checklist

Required: verify every item before emitting CSS. If any item fails, fix the CSS first.

Architecture:
- [ ] All rules inside cascade layers; layer order declared once
- [ ] Tokens used for color, spacing, type, radius, shadow, z-index
- [ ] Specificity ≤ (0,2,0); no ID selectors; no `!important`

Modern CSS:
- [ ] Layout adapts from narrow to wide viewport/container (no fixed-width-only layout) unless explicitly scoped to a fixed-size context
- [ ] Replaced elements (img/video/iframe) capped with `max-inline-size: 100%`; `aspect-ratio`/`object-fit` used instead of fixed `block-size`
- [ ] Nested grids aligning to a parent's tracks use `subgrid`, not duplicated track definitions
- [ ] Mobile-affected viewport heights use `dvh`, not bare `vh`
- [ ] Elements anchored to a physical viewport edge use `env(safe-area-inset-*)` (inline fallback, no `@supports` wrapper)
- [ ] Container queries used for component-driven responsiveness; media queries used only for viewport-driven responsiveness
- [ ] Logical properties used; physical properties justified
- [ ] Nesting depth ≤ 3; no Sass syntax
- [ ] `:has()` / `:is()` / `:where()` used where they remove duplication
- [ ] Overlay content (`<dialog>`, `[popover]`) used instead of a `position: fixed` + `z-index` stack; `@scope` used only for donut scope or proximity, not as a specificity hammer

Typography & Color:
- [ ] Fluid type/spacing uses `clamp()`
- [ ] `text-wrap: balance` (headings) / `pretty` (body) considered
- [ ] Colors from semantic tokens; OKLCH for definitions; `light-dark()` for schemes

Accessibility:
- [ ] `:focus-visible` styles present; no removed focus indicators; sticky bars offset with `scroll-padding`
- [ ] Hover-only effects inside `@media (hover: hover)`; targets ≥ 24×24 CSS px
- [ ] Animations guarded by `prefers-reduced-motion`
- [ ] Every custom property named in a `transition` or set in `@keyframes` has an `@property` registration with an `initial-value`
- [ ] Contrast meets WCAG AA; `prefers-contrast: more` strengthens subtle borders/placeholders; `forced-colors` not broken; zoom not blocked
- [ ] Form validation feedback uses `:user-valid`/`:user-invalid` (or profile fallback) paired with ARIA wiring, not JS-toggled classes; native controls use `accent-color` instead of rebuilt `appearance: none` markup

Performance:
- [ ] Animations limited to `transform` / `opacity`
- [ ] Elements getting `transform`/`filter`/`will-change: transform` checked for `position: fixed` descendants (new containing block would break them)
- [ ] No expensive selectors (universal descendant, deep chains, unanchored `:has()`)
- [ ] `contain` / `content-visibility` applied to independent, off-screen-heavy regions
- [ ] `scrollbar-gutter: stable` applied where content toggles between scrollable and non-scrollable

Compatibility:
- [ ] Browser profile resolved and respected
- [ ] `@supports` only where the profile requires it
- [ ] Emerging features degrade gracefully
- [ ] Fixed-size/print context (if applicable) has `@media print` rules: hidden non-printable chrome, `break-inside: avoid`, ink-safe color

Output:
- [ ] Zero prohibited patterns
- [ ] No dead or duplicate rules
- [ ] CSS is production-ready as emitted
