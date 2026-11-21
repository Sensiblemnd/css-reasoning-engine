# Gap analysis: Chrome's Modern Web Guidance vs these skills

Date: 2026-11-21. Compared against [GoogleChrome/modern-web-guidance](https://github.com/GoogleChrome/modern-web-guidance) at commit `64a6d70` (2026-11-16). Baseline data comes from the webstatus.dev API, checked the same day.

## Summary

Modern Web Guidance (MWG) is a broad web-platform skill: about 205 guides, from the Chrome, Edge, Firefox and MDN teams. These skills are a narrower CSS rule system with three roles and a linter. The two overlap less than expected. Of the 340 distinct CSS features used in MWG's code examples, these skills already covered 222. Most of the other 118 are basic properties or examples written with physical properties; only a few clusters were real gaps.

The comparison found:

- **Two bugs in our own rules**, now fixed:
  - Our `*` margin reset un-centered modal dialogs and popovers.
  - Our focus rule and linter accepted a `box-shadow`-only focus ring, which forced-colors mode removes.
- **One prose rule of ours that was wrong**: it said "plain `vw` is fine for widths".
- **One real topic gap**: styling web components.
- **Two places where MWG gives risky advice**:
  - It suggests `100dvw` as a fix for `100vw` overflow.
  - It recommends `overflow-clip-margin`, which is not Baseline.

Recommendation: keep these skills for CSS. Installing MWG alongside them is fine for HTML, JS, performance and security. The new "Other Installed Guidance" rule in `prohibited-patterns.md` decides any CSS conflicts.

## Adopted in this pass

| Change | Where | Lint rule |
| ------ | ----- | --------- |
| Reset Scope: only `box-sizing` on a page-wide `*`; margin resets go per element type. A `*` margin reset pins modal `<dialog>` and `[popover]` to the top-left corner, and overrides every web component's `:host` margin. Both were verified in Chromium. | `rules-architecture.md`, `prohibited-patterns.md`, `rules-interaction.md`, `css-refactor` transformation, `docs/styles.css` | `no-universal-reset` (new) |
| A focus ring drawn only with `box-shadow` is prohibited, because forced-colors mode removes it. Keep `outline: … solid transparent` under the shadow. | `rules-a11y-performance.md`, `prohibited-patterns.md` | `no-outline-none` (tightened) |
| `100vw`/`100dvw`/`100svw`/`100lvw` widths are prohibited. All of them ignore the classic scrollbar. Measured in Chromium 156 with a 17px scrollbar: every variant was 1280px against a 1263px content box, and the page scrolled sideways. | `rules-layout.md` (also corrects the old "plain `vw` is fine" line), `prohibited-patterns.md` | `no-viewport-full-width` (new) |
| `:has()` cannot contain `:has()` or a pseudo-element; the rule is dropped. | `rules-layout.md` | `no-invalid-has` (new) |
| Web Components (Shadow DOM) section: `:host { display: block }`, theming through custom properties with private aliases, `:state()`, `::part()`, `::slotted()` limits, never `:host-context()`, and layers and resets scoped to the shadow root. | `rules-architecture.md`, capabilities `shadow_dom_styling` and `custom_states` | — |
| `:dir()` for direction-dependent styling (mirrored icons) instead of `[dir="rtl"]`. | `rules-layout.md`, capability `dir_pseudo` | — |
| Single-line truncation with `text-overflow: ellipsis`, including the `min-inline-size: 0` trap in flex and grid items. | `rules-color-typography.md` | — |
| `grid-auto-flow: dense` added to the rule against visual reordering. | `rules-a11y-performance.md` | — |
| Invoker commands (`commandfor`/`command`) for declarative dialog opening. Emerging, Baseline 2025-12-12. | `rules-interaction.md`, `browser-profiles.md` | — |
| Non-Baseline features that MWG teaches are listed as Experimental, so an agent with both skills installed won't generate them. | `browser-profiles.md` | — |
| Precedence rule for when another skill is installed. | `prohibited-patterns.md`, all three SKILL.md files | — |

Found while doing this work, not from MWG:

- `max-selector-depth` counted a spaced child or sibling combinator twice, so `.a > .b > .c` was reported as 5 levels. The bug is fixed, with a compliant fixture.
- The date-driven flips that were due on 2026-11-13 and 2026-11-17 had not been applied. `light-dark()`, `text-wrap: balance` and `round()`/`mod()`/`rem()` are now widely available, so `light_dark` and `stepped_value_functions` are now `true` on `enterprise`.
- `css-reviewer` said the linter has 18 rules. It has 27.

## Where MWG's advice is weaker or riskier

| MWG says | Problem | Our rule |
| -------- | ------- | -------- |
| Replace `100vw` with "`100%`, `100dvw`, or `100svw`" (`css-layout`) | `dvw`/`svw` overflow exactly like `vw` when a classic scrollbar is present (measured above). | `100%`, or a full-bleed grid |
| Use `overflow: clip` "with `overflow-clip-margin`" (`css-layout`) | webstatus.dev lists `overflow-clip-margin` as limited availability (Firefox 148 only). | Not Baseline; pad instead |
| `:autofill` styling (`autofill-highlight-inputs`) | webstatus.dev lists `:autofill` as limited availability (no Firefox implementation listed). | Experimental |
| Interest invokers, `popover="hint"`, `<dialog closedby>`, `scroll-target-group`, `scroll-initial-target`, `scroll-axis-lock`, element-scoped view transitions, `text-decoration-inset` | All limited availability, mostly Chromium only. They're taught as patterns, with fallbacks described in each guide's own words. | Experimental, never generated unless requested |
| Default target: Baseline widely available | It is stricter than our `evergreen` default. That is not wrong, but the two skills will disagree about Emerging features. | Our profile resolution wins for CSS |
| Example code uses literal colors (`white`, `navy`, `#111`), literal timings, unlayered rules, and occasional physical properties (`margin-bottom`, `border-left-color`) | Examples get copied. | Tokens, layers and logical properties still apply to anything adapted from MWG |

## Where we agree

Most overlapping advice matches ours:
- cascade layers declared up front, `:where()` inside layers, and `:has()` instead of JavaScript-toggled classes
- logical properties, with a "would this flip in RTL?" exception
- container queries over media queries for components, and `dvh` for heights
- `@starting-style` with `transition-behavior: allow-discrete` for entry and exit animations
- opt-in `prefers-reduced-motion` with no global `0.01ms` kill switch
- `outline` for focus rings, and the `-webkit-line-clamp` triplet
- `text-wrap: balance` for headings and `pretty` for body text
- `overflow: clip` over `hidden`
- no `order`/`*-reverse` reordering of interactive content

## Not adopted yet: candidates

| Feature | Baseline (webstatus.dev, 2026-11-21) | Why it's a candidate |
| ------- | ------------------------------------ | -------------------- |
| `font-size-adjust` | Newly available 2024-07-25, so Stable under our 12-month rule | Keeps mixed and fallback fonts at the same x-height. Complements our `size-adjust` `@font-face` rule. |
| `image-set()` | Widely available 2026-03-18 | Resolution and format switching for CSS background images. |
| `sin()`/`cos()`/`tan()` | Widely available 2025-09-13 | Radial layouts with `sibling-index()`. Low priority. |
| `::view-transition-*` pseudo-element detail, `view-transition-class` usage, `active-view-transition-type()` | Same-document View Transitions are Stable | Our View Transitions section names the pseudo-elements but doesn't teach animating them. MWG has eight guides on it. |
| Customizable select details (`::checkmark`, `::picker-icon`) | Not Baseline (no Firefox) | Already Experimental for us. Add detail only if `base-select` lands in Firefox. |
| `:defined`, `::slotted()` | The webstatus.dev API has no entry for either | Needs a Baseline source before either gets a tier. `::slotted()` is described without a tier. |
| `anchor-size()` | No separate webstatus.dev entry; part of anchor positioning | Check whether it is covered by the `position-anchor` guard. |

## Method and limits

- The 340/118 feature counts come from a script that pulled properties, at-rules, functions and pseudo-classes out of every ```` ```css ```` block and `<style>` element in MWG's CSS-related categories. It then searched our skill files for each name. It catches missing features, but not conflicting advice.
- Conflicting advice was checked by reading the imperative lines (DO, DO NOT, Avoid, Prefer, MUST) of nine overlapping guides: `css`, `css-layout`, `responsive-design`, `fluid-scaling`, `color`, `dark-mode`, `typography`, `motion` and `accessibility`. `styling-web-components` was read in full. The other ~190 guides were only checked through the feature script, so subtler disagreements in the UI, forms and visual-design guides may remain.
- The `*` reset, shadow-host and viewport-unit claims were verified in Chromium only. Firefox and Safari were not tested.

## Benchmark: ours vs MWG vs both (done)

The product-card refactor benchmark was run once per arm (no guidance, MWG only, ours only, both). Full table in `tests/benchmarks/README.md`. All four arms got the seven planted traps right, including the unguided control. Only the arms using our `css-refactor` also made the legitimate changes: narrowing `transition: all` and converting to logical properties. The control and MWG arms declined almost everything as risky. The run exposed two `css-refactor` gaps, both fixed:
- removing `!important` from rules that stay unlayered was rated `low`, and is now `follow-up`
- generic token names in a layer can be overridden by a host page, so standalone components now get prefixed names

With both skills installed, the agent followed our precedence rule and declined MWG's non-Baseline suggestions.

## Baseline drift check (done)

`tests/baseline-check.mjs` compares every Feature Stability row with the webstatus.dev API and reports tier, date and widely-available drift. It reports and never rewrites, so the prose and exceptions stay hand-written. Each row names its feature ids in an HTML comment, and `run.sh` fails on an unannotated row. Its first run found one more error: `accent-color` was listed as widely available, but webstatus.dev reports it as limited. It moved to Experimental with a safe-degrading exception, so generated CSS is unchanged. See `tests/README.md`.
