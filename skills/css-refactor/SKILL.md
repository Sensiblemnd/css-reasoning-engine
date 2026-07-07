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
- [ ] Prohibited patterns eliminated or reported as follow-ups
- [ ] Change list covers every edit, each with a risk rating
