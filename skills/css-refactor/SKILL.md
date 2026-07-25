---
name: css-refactor
description: Deterministic rules for modernizing existing CSS without changing visual behavior. Use whenever refactoring stylesheets, migrating Sass/Less to native CSS, converting hardcoded values to design tokens, adopting cascade layers or logical properties in legacy code, or cleaning up CSS. Preserves rendering and browser compatibility while reducing complexity. For writing new CSS use css-engineer; for audit-only findings use css-reviewer.
version: 2.1.0
priority: high
---

# CSS Refactor

This skill modernizes existing CSS. The contract: same rendering, same compatibility, less complexity.

# Prime Directives

1. Required: preserve visual behavior. Computed styles for every state (default, hover, focus, media/container conditions) must be identical after the refactor. Intentional visual changes are prohibited unless explicitly requested; if a refactor exposes a bug, report it — do not silently fix or preserve it without saying so.
2. Required: preserve browser compatibility. Resolve the profile first per [browser-profiles.md](../shared/references/browser-profiles.md); never introduce a feature the profile lacks, never remove a fallback the profile needs.
3. Required: reduce complexity. Every transformation must delete more complexity than it adds (fewer declarations, lower specificity, fewer duplicates). A rewrite that only changes style is not a refactor — skip it.
4. Required: load [prohibited-patterns.md](../shared/references/prohibited-patterns.md); eliminate every occurrence unless elimination changes behavior — then report it as a follow-up instead.

# Transformation Catalog

Apply per category; topic rules live in the routed reference file.

## Literals → Semantic tokens ([rules-color-typography.md](../shared/references/rules-color-typography.md))

```css
/* Before */
.button {
  margin-left: 20px;
  color: #333;
}

/* After */
.button {
  margin-inline-start: var(--space-m);
  color: var(--color-text);
}
```

- Required: map repeated literals to ONE token; near-duplicates (`#333`, `#343434`) consolidate to the closest existing token when visually identical, otherwise stay separate and get reported.
- New tokens are defined in the `tokens` layer in OKLCH; the token value equals the original literal's color exactly (converted), so rendering is unchanged.

## Physical → Logical properties ([rules-layout.md](../shared/references/rules-layout.md))

- `margin-left` → `margin-inline-start`, `width` → `inline-size`, `top` → `inset-block-start`, etc.
- Exception: effects anchored to a physical edge on purpose — keep physical and add a comment.
- In LTR-only projects this is rendering-identical; in RTL projects flag every conversion that changes rendering as an intentional fix requiring approval.

## Breakpoint chains → Fluid values / container queries ([rules-layout.md](../shared/references/rules-layout.md))

- A property stepped across ≥ 2 breakpoints → one `clamp()` whose endpoints match the original smallest/largest values.
- Media queries reacting to component space → container queries only when a container ancestor exists or can be added without layout change (`container-type: inline-size` can affect sizing — verify).

## Sass/Less → Native CSS ([rules-architecture.md](../shared/references/rules-architecture.md))

- `$var` → custom property token; `@mixin`/`@extend` → utility class, `:is()` group, or shared component rule.
- `&-suffix` concatenation → expanded full selectors (`.button { &-icon {} }` → `.button-icon { }` as a sibling rule); never leave `&-` in native CSS.
- Nesting deeper than 3 levels → flatten to component-scoped classes.

## Unlayered → Layered ([rules-architecture.md](../shared/references/rules-architecture.md))

- Move rules into the standard order: `reset, tokens, base, layout, components, utilities, overrides`.
- Required verification: layering changes cascade order — unlayered CSS beats layered CSS. Migrate ALL competing rules in the same pass, and re-check every override relationship (later-file overrides, specificity-based overrides) still resolves the same way. If any rule set cannot migrate yet, do not layer its competitors.

## Specificity reduction ([rules-architecture.md](../shared/references/rules-architecture.md))

- `!important` → resolve by moving the rule to the correct layer; ID selectors → classes.
- Required: a selector rewrite must match exactly the same elements and win exactly the same conflicts. Check every place the old selector competed before lowering specificity; compensate with layer placement, not with new hacks.

## Animation cleanup ([rules-a11y-performance.md](../shared/references/rules-a11y-performance.md))

- `transition: all` → explicit list of the properties that actually change.
- Add missing `prefers-reduced-motion` guards (behavior-preserving for `no-preference` users).
- Layout-property animations → `transform` equivalents only when rendering matches; otherwise report as follow-up.

## Fixed-width layouts → flagged, not silently changed ([rules-layout.md](../shared/references/rules-layout.md))

- Responsive behavior is a required baseline (see Responsive Layout Baseline). A layout that is fixed-width-only and doesn't reflow is a rendering bug, not a style choice — but converting it to fluid sizing changes computed layout at viewport/container sizes where it previously didn't adapt, which conflicts with Prime Directive 1 (preserve rendering exactly).
- Required: report missing responsive behavior as a `follow-up` in the change list; do not silently convert fixed widths to fluid sizing unless the user explicitly requests responsive fixes in this pass. This includes: replaced elements missing `max-inline-size: 100%`/`aspect-ratio`, and missing `scrollbar-gutter: stable` on toggling-scroll containers — each reserves/changes space that wasn't reserved/changed before.
- Exception: a fixed-width value that is purely a magic number with an equivalent fluid expression at the *same* rendered size (e.g., `width: 320px` → `max-inline-size: 320px` with no other behavior change) can be normalized directly — that's a literal-to-logical-property transform, not a responsiveness fix.

## Safe-area `@supports` guard → inline `env()` fallback ([rules-layout.md](../shared/references/rules-layout.md))

- A `@supports (padding: env(safe-area-inset-*))` block plus a separate pre-`@supports` base rule for the same property → collapse to one declaration using the function's own fallback argument (`env(safe-area-inset-bottom, 0px)`). Risk: `none` — the fallback argument resolves identically to the old base rule on unsupported engines, and identically to the `@supports`-enhanced rule on supported ones.
- Missing `dvh`/missing `env(safe-area-inset-*)` on a mobile-affected or edge-anchored element is a correctness bug like the fixed-width-layout case above, not a style choice — report as `follow-up`, don't add it silently (it changes rendering on collapsing mobile chrome / notched devices where it previously didn't adapt).

## Duplicated grid tracks → Subgrid ([rules-layout.md](../shared/references/rules-layout.md))

- A nested grid's explicit `grid-template-columns`/`rows` values are copy-pasted from the ancestor grid it aligns to → replace with `grid-template-columns: subgrid` (or `rows`) and the appropriate `grid-column`/`grid-row` span. Risk: `none` — only apply when the duplicated values are proven identical to the parent's resolved tracks, since that's the condition under which rendering is unchanged.
- If the child's tracks only *look* similar but diverge (different sizing intent), do not convert — report as a `follow-up` note instead.

## Containing-block conflicts surfaced during refactor ([rules-a11y-performance.md](../shared/references/rules-a11y-performance.md))

- If any transformation in this pass adds or already finds `transform`/`filter`/`will-change: transform` on an element with a `position: fixed` descendant, that is a latent bug (the descendant silently repositions relative to the new containing block), not something to fix inline. Required: report as `follow-up`, do not restructure the DOM or move the fixed element as part of an unrelated refactor pass.

## Duplication → Composition

- Identical declaration blocks → one rule with an `:is()` selector list, a utility class, or a shared token.
- Never merge blocks that merely look similar today — only exact duplicates or token-extractable values.

# Required Output

1. The refactored CSS.
2. A change list, one line per transformation: what changed / why / risk (`none` = provably identical rendering; `low` = identical under stated assumption, assumption named; `follow-up` = behavior-affecting issue found but not changed).

Never mix an unrequested behavior change into refactor output.

# Self-Check Before Emitting

- [ ] Every selector matches the same element set as before
- [ ] Every cascade conflict resolves to the same winner (layers, specificity, order)
- [ ] Token values equal the literals they replaced
- [ ] No feature exceeds the resolved browser profile
- [ ] Missing responsive behavior (fixed-width-only layouts, unsized replaced elements, missing scrollbar-gutter) reported as follow-up, not silently changed
- [ ] Duplicated grid tracks converted to `subgrid` only where values are proven identical to the parent
- [ ] Safe-area `@supports`-guard + base-rule pairs collapsed to inline `env(x, fallback)`; missing `dvh`/safe-area coverage reported as follow-up, not silently added
- [ ] Any `transform`/`filter`/`will-change` + `position: fixed` descendant conflict reported as follow-up, not restructured inline
- [ ] Prohibited patterns eliminated or reported as follow-ups
- [ ] Change list covers every edit, each with a risk rating
