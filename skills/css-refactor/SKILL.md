---
name: css-refactor
description: Deterministic rules for modernizing existing CSS without changing visual behavior. Use whenever refactoring stylesheets, migrating Sass/Less to native CSS, converting hardcoded values to design tokens, adopting cascade layers or logical properties in legacy code, or cleaning up CSS. Preserves rendering and browser compatibility while reducing complexity. For writing new CSS use css-engineer; for audit-only findings use css-reviewer.
metadata:
  version: 2.2.0
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

Before:

```css
.button {
  margin-left: 20px;
  color: #333;
}
```

After:

```css
.button {
  margin-inline-start: var(--space-m);
  color: var(--color-text);
}
```

- Required: map repeated literals to ONE token only when they are the same color (`#333`, `#333333`, `rgb(51 51 51)`). Near-duplicates that merely look close (`#333` vs `#343434`) are a rendering change if merged — keep them separate and report the pair, letting the user decide whether the difference was intentional.
- New tokens are defined in the `tokens` layer in OKLCH; the token value equals the original literal's color exactly (converted), so rendering is unchanged.

## Physical → Logical properties ([rules-layout.md](../shared/references/rules-layout.md))

- `margin-left` → `margin-inline-start`, `width` → `inline-size`, `top` → `inset-block-start`, etc.
- Exception: effects anchored to a physical edge on purpose — keep physical and add a comment.
- In LTR-only projects this is rendering-identical; in RTL projects flag every conversion that changes rendering as an intentional fix requiring approval.

## Breakpoint chains → Fluid values / container queries ([rules-layout.md](../shared/references/rules-layout.md))

- A property stepped across ≥ 2 breakpoints → one `clamp()` whose endpoints match the original smallest/largest values.
- Media queries reacting to component space → container queries only when a container ancestor exists or can be added without layout change (`container-type: inline-size` can affect sizing — verify).

## `min-width`/`max-width` → Range comparison syntax ([rules-layout.md](../shared/references/rules-layout.md))

- `@media (min-width: 768px)` / `@container (max-inline-size: 30rem)` → `@media (width >= 768px)` / `@container (inline-size <= 30rem)`. Risk: `none` for `modern`/`evergreen`/`enterprise` profiles — Baseline since 2023, identical matching behavior. Skip for `legacy` — an unsupported engine fails to parse the query at all rather than degrading.

## Sass/Less → Native CSS ([rules-architecture.md](../shared/references/rules-architecture.md))

- `$var` → custom property token; `@mixin`/`@extend` → utility class, `:is()` group, or shared component rule.
- `&-suffix` concatenation → expanded full selectors (`.button { &-icon {} }` → `.button-icon { }` as a sibling rule); never leave `&-` in native CSS.
- Nesting deeper than 3 levels → flatten to component-scoped classes.

## Unlayered → Layered ([rules-architecture.md](../shared/references/rules-architecture.md))

- Move rules into the standard order: `reset, tokens, base, layout, components, utilities, overrides` — or, if the project already declares a layer order (framework or house convention), into that order; never add a second one.
- Unlayered third-party stylesheets currently beat all layered rules. Moving them into `components.vendor` flips every conflict with project styles, so it is `follow-up` unless each conflict is proven to resolve the same way.
- Required verification: layering changes cascade order — unlayered CSS beats layered CSS. Migrate ALL competing rules in the same pass, and re-check every override relationship (later-file overrides, specificity-based overrides) still resolves the same way. If any rule set cannot migrate yet, do not layer its competitors.

## Specificity reduction ([rules-architecture.md](../shared/references/rules-architecture.md))

- `!important` → resolve by moving the rule to the correct layer; ID selectors → classes.
- Required: a selector rewrite must match exactly the same elements and win exactly the same conflicts. Check every place the old selector competed before lowering specificity; compensate with layer placement, not with new hacks.

## Animation cleanup ([rules-a11y-performance.md](../shared/references/rules-a11y-performance.md))

- `transition: all` → explicit list of the properties that actually change.
- Add missing `prefers-reduced-motion` guards (behavior-preserving for `no-preference` users).
- Layout-property animations → `transform` equivalents only when rendering matches; otherwise report as follow-up.
- An animation flashing more than 3 times per second, or parallax that is only slowed under `prefers-reduced-motion: reduce` → report as `follow-up`. Fixing either changes what users see; never slow or remove it silently.
- Auto-playing motion over 5 seconds with no hover/focus pause → `follow-up`. Adding `animation-play-state: paused` changes behavior.
- Identical `linear()`/`cubic-bezier()` values repeated across components → one easing token. Risk: `none`. Converting keyframe-faked overshoot or a JS spring to `linear()` → `follow-up`: the sampled curve never matches the original exactly.

## Legacy font sources → `woff2` only ([rules-a11y-performance.md](../shared/references/rules-a11y-performance.md))

- Remove `eot`, `svg`, and `truetype`/`opentype` entries from an `@font-face` `src` list that already has a `woff2` entry; remove `woff` too unless the profile is `legacy` and targets need it. Risk: `none` — every engine in the profile already picks `woff2`, so the removed entries were never downloaded. A `src` with no `woff2` entry is a `follow-up` (the font file has to be converted; CSS alone can't fix it).
- Never drop the `local()` entry or change `font-display` as part of this pass.

## Masks and clipping ([rules-advanced.md](../shared/references/rules-advanced.md) Shapes and Clipping)

- `-webkit-mask-*` next to the same unprefixed declaration → delete the prefixed one. Risk: `none` on every profile where `mask_unprefixed` is `true`.
- `-webkit-mask-*` with no unprefixed twin → rename to the unprefixed property. Risk: `low` for `mask-image`, `mask-size`, `mask-position`, `mask-repeat`, which take the same values. `-webkit-mask-composite` uses different keywords (`source-in` → `intersect`, `source-out` → `subtract`, `xor` → `exclude`, `source-over` → `add`): map them exactly or report as `follow-up`.
- `clip-path: path()` → basic shape only when the shape is exactly expressible (a rounded rectangle → `inset(0 round …)`, a circle → `circle()`) at the element's current size. Risk: `low`, assumption: the element's size is fixed. If the element resizes, the old `path()` didn't scale and the new shape does, so report as `follow-up`.
- `clip-path`/`mask` on a focusable element whose clip isn't lifted on focus → `follow-up`. Moving the clip to a child or wrapper changes the DOM and the rendering.
- Never introduce `corner-shape` or `border-shape` in a refactor. Both are Experimental. Swapping a `clip-path` corner for `corner-shape` changes rendering in every engine: where it is supported the border and shadow now follow the shape, and where it isn't the corners fall back to round.

## Overflow, line height, clamping, scrollbars ([rules-layout.md](../shared/references/rules-layout.md), [rules-color-typography.md](../shared/references/rules-color-typography.md), [rules-interaction.md](../shared/references/rules-interaction.md))

- `overflow: hidden` → `overflow: clip`. Risk: `low`, and only when all of these hold (name them): no `position: sticky` descendant (it would start sticking), no floated children or child margins collapsing through the edge (`hidden` creates a block formatting context, `clip` doesn't), and no script scrolling the element. Otherwise `follow-up`.
- `overflow-x: hidden` on `html`/`body` → `follow-up`. Removing it exposes the overflow it was hiding; the fix is the overflowing element, which is out of scope for a refactor.
- `overflow-x`/`overflow-y` → `overflow-inline`/`overflow-block` in horizontal writing modes. Risk: `none` on profiles where both are Stable.
- Unit `line-height` → unitless ratio (`24px` at `font-size: 16px` → `1.5`). Risk: `none` only when no descendant sets a different `font-size`; otherwise `follow-up`, because those descendants' line spacing changes (that change is the fix, but it is a rendering change).
- `-webkit-line-clamp` missing `display: -webkit-box` / `-webkit-box-orient: vertical`, or unprefixed `line-clamp` alone → `follow-up`. Completing the triplet makes a clamp that never worked start working.
- `::-webkit-scrollbar` styling → `scrollbar-width`/`scrollbar-color` → `follow-up`. The standard properties can't reproduce custom widths, radii, or buttons, so rendering changes in every engine.
- `@supports selector(::-webkit-scrollbar)` / `not selector(::-webkit-scrollbar)` guard → `follow-up`. Since Firefox 156 the guard picks a different branch in Firefox than before, so removing or rewriting it changes rendering there; report it, don't rewrite it.
- `display: flex`/`grid` on a running-text container → `follow-up`. Removing it re-flows the text.

## Text-size and control-zoom fixes → follow-up ([rules-forms.md](../shared/references/rules-forms.md))

- `text-size-adjust: none` → `100%`. Risk: `low` — rendering at default text size is unchanged; it only stops overriding the user's text-size setting. Assumption: the user hasn't asked for pixel-identical output at enlarged text settings.
- Missing `font: inherit` on form controls, or text-entry fields below `1rem` → report as `follow-up`. Both change rendered control text size.

## Fixed-width layouts → flagged, not silently changed ([rules-layout.md](../shared/references/rules-layout.md))

- Responsive behavior is a required baseline (see Responsive Layout Baseline). A layout that is fixed-width-only and doesn't reflow is a rendering bug, not a style choice — but converting it to fluid sizing changes computed layout at viewport/container sizes where it previously didn't adapt, which conflicts with Prime Directive 1 (preserve rendering exactly).
- Required: report missing responsive behavior as a `follow-up` in the change list; do not silently convert fixed widths to fluid sizing unless the user explicitly requests responsive fixes in this pass. This includes: replaced elements missing `max-inline-size: 100%`/`aspect-ratio`, and missing `scrollbar-gutter: stable` on toggling-scroll containers — each reserves/changes space that wasn't reserved/changed before.
- Exception: converting a fixed-width declaration to its logical equivalent at the *same* rendered size (`width: 320px` → `inline-size: 320px`) can be normalized directly — that's a physical-to-logical-property transform, not a responsiveness fix. Never swap `width` for `max-inline-size` as part of it: `width` pins the box, `max-inline-size` lets it shrink below the value, so they differ at exactly the narrow sizes this section is about. That swap is the responsiveness fix, and it goes in the change list as a `follow-up`.

## Safe-area `@supports` guard → inline `env()` fallback ([rules-layout.md](../shared/references/rules-layout.md))

- A `@supports (padding: env(safe-area-inset-*))` block plus a separate pre-`@supports` base rule for the same property → collapse to one declaration using the function's own fallback argument (`env(safe-area-inset-bottom, 0px)`). Risk: `none` — the fallback argument resolves identically to the old base rule on unsupported engines, and identically to the `@supports`-enhanced rule on supported ones.
- Missing `dvh`/missing `env(safe-area-inset-*)` on a mobile-affected or edge-anchored element is a correctness bug like the fixed-width-layout case above, not a style choice — report as `follow-up`, don't add it silently (it changes rendering on collapsing mobile chrome / notched devices where it previously didn't adapt).

## Duplicated grid tracks → Subgrid ([rules-layout.md](../shared/references/rules-layout.md))

- A nested grid's explicit `grid-template-columns`/`rows` values are copy-pasted from the ancestor grid it aligns to → replace with `grid-template-columns: subgrid` (or `rows`) and the appropriate `grid-column`/`grid-row` span. Risk: `none` — only apply when the duplicated values are proven identical to the parent's resolved tracks, since that's the condition under which rendering is unchanged.
- If the child's tracks only *look* similar but diverge (different sizing intent), do not convert — report as a `follow-up` note instead.

## Containing-block conflicts surfaced during refactor ([rules-a11y-performance.md](../shared/references/rules-a11y-performance.md))

- If any transformation in this pass adds or already finds `transform`/`filter`/`will-change: transform` on an element with a `position: fixed` descendant, that is a latent bug (the descendant silently repositions relative to the new containing block), not something to fix inline. Required: report as `follow-up`, do not restructure the DOM or move the fixed element as part of an unrelated refactor pass.

## Non-native validation UI → Native validation states ([rules-forms.md](../shared/references/rules-forms.md))

- JS-toggled error classes on form fields → `:user-invalid`/`:user-valid` (or `:invalid`/`:valid` gated with `:not(:placeholder-shown)` when the profile capability is `false`).
- Risk: `low` — behavior-preserving only when the existing JS validation triggers on the same timing the pseudo-class covers (after interaction/on submit attempt). If the JS validation fires on custom logic beyond native constraint validation, report as a follow-up instead of converting.
- Never remove existing `aria-invalid`/`aria-describedby` wiring during the conversion; CSS-only pseudo-classes don't announce anything to assistive technology on their own.

## Duplication → Composition ([rules-architecture.md](../shared/references/rules-architecture.md))

- Identical declaration blocks → one rule with an `:is()` selector list, a utility class, or a shared token.
- Never merge blocks that merely look similar today — only exact duplicates or token-extractable values.
- A hand-rolled donut-scope workaround (duplicated selectors or extra wrapper/modifier classes existing only to fake nested-component precedence) → `@scope` around the shared root, relying on scoping proximity instead of the duplication. Risk: `low` — behavior-preserving only when the duplicated rule set is proven to resolve the same nested-component conflict `@scope` proximity resolves; if the duplication exists for an unrelated reason, report as a `follow-up` instead of converting.

## JS Effects → Native CSS ([rules-advanced.md](../shared/references/rules-advanced.md), [rules-interaction.md](../shared/references/rules-interaction.md))

- JS scroll listener recalculating styles on every frame (progress bars, reveal-on-scroll, parallax, sticky-state classes) → `animation-timeline`/`animation-range` (scroll-driven animation) or `@container scroll-state()`. **Skip by default.** Both targets are Experimental — Firefox has shipped neither — so this conversion removes working behavior in a shipping engine. Perform it only when the project has explicitly opted into the feature, and then only behind `@supports (animation-timeline: view())` with the JS retained or the unenhanced state proven usable. Risk: `follow-up` in every case; never `low`.
- JS positioning library (Popper-style) computing an anchored overlay's position → native anchor positioning (`anchor-name`, `position-anchor`, `position-area`, `position-try-fallbacks`) on a profile where `anchor_positioning` is `true`/`optional`. Risk: `follow-up` by default — collision/flip logic in the JS library rarely maps 1:1 onto `position-try-fallbacks`; convert directly only when the library's fallback behavior is a simple flip the CSS reproduces exactly, and name the assumption. Guard on `position-anchor`, not `anchor-name` — the latter is Baseline and detects nothing.
- JS-authored autosize `<textarea>`/`<input>` (input listener measuring `scrollHeight`, writing it back as inline height) → `field-sizing: content` plus a `max-block-size` cap. Risk: `low` — behavior-preserving only when the existing JS has no custom min/max logic beyond a simple cap; otherwise report as `follow-up`.
- `z-index` overlay stack (`position: fixed` + escalating `z-index` per component) → `<dialog>`/`[popover]` and the top layer. Risk: `follow-up` — moving an element into the top layer can change its stacking relative to siblings that were relying on the old `z-index` order; verify every sibling relationship before converting, don't convert silently.

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
- [ ] JS-toggled validation classes converted to `:user-valid`/`:user-invalid` only when trigger timing matches exactly, else reported as follow-up; existing ARIA wiring left intact
- [ ] Hand-rolled donut-scope duplication converted to `@scope` only where the proximity conflict is proven identical, else reported as follow-up
- [ ] JS scroll listeners, positioning libraries, autosize textareas, and `z-index` overlay stacks converted per the JS Effects → Native CSS catalog, each risk-rated (`low` conversions named with their assumption, `follow-up` left unconverted)
- [ ] Legacy `@font-face` sources removed only where a `woff2` entry already exists; flashing animations, slowed-only parallax, and sub-`1rem` / non-inheriting form controls reported as follow-up
- [ ] `-webkit-mask-*` removed or renamed with `mask-composite` keywords mapped exactly; `path()` → basic shape only at proven-identical geometry; clipped focusable elements reported as follow-up; no `corner-shape`/`border-shape` introduced
- [ ] `overflow: hidden` → `clip` only with sticky/BFC/script-scroll assumptions named; unit `line-height` → unitless only where no descendant font-size differs; clamp, scrollbar, flex-on-text, and missing-pause fixes reported as follow-up
- [ ] Prohibited patterns eliminated or reported as follow-ups
- [ ] Change list covers every edit, each with a risk rating
