# Browser Profiles, Capabilities, and @supports Rules

> Baseline data verified: 2026-11-07 (date-driven flips and new rows: 2026-11-21, see below), against webstatus.dev (every Emerging and Experimental row and every
> dated Stable row) and the MDN Baseline banner (rows whose tier or date changed). Re-verify
> before promoting or demoting any feature; recompute tiers from the Baseline since column in
> Feature Stability rather than hand-editing a tier.
>
> Where MDN's Baseline banner gives only a month, the exact day comes from the last engine's
> release note (e.g. `text-box-trim` → Firefox 154, 2026-08-18). Prefer that over rounding, and
> never date a longhand from a grouped webstatus entry that tracks its shorthand.
>
> Partial re-check 2026-10-12 (MDN Baseline banners): `linear()`, `scrollbar-width`, `scrollbar-color`,
> `sibling-index()`, `line-clamp`, `mask-image`, `corner-shape`, `border-shape`. Emerging ages recomputed
> to that date; `::details-content` and `overflow-inline`/`-block` promoted to Stable by the 12-month rule.
> Every other row still carries the 2026-09-09 verification.
>
> 2026-10-20: same-document View Transitions promoted to Stable (12 months since 2025-10-14).
> Re-checked the same day: `position-anchor` is Baseline newly available since 2026-09 (the anchor
> split note is updated); `border-shape` now ships in Chromium; scroll-driven animations are still
> blocked by Firefox.
>
> 2026-10-26: Emerging ages recomputed to this date; no feature crossed the 12-month line. Added
> `light-dark()` with images (Baseline 2026-09-14, Emerging; the color form stays Stable) and
> `::highlight()` (MDN "newly available since March 2026"; the day is not verified, and the banner conflicts with
> Firefox 140's 2025 support, so re-check it). `mask` and `linear()` reached widely available in 2026-06.
> Firefox 156 now reports `selector(::-webkit-scrollbar)` as unsupported on every site (see rules-interaction.md).
>
> 2026-10-26, later: added `lh`/`rlh` (widely available; Firefox 120, 2023-11-21, was last), `round()` (MDN
> "Baseline 2024, newly available since May 2024"), `display: contents` (rendering in every engine; the
> accessibility bugs are not part of Baseline, see rules-layout.md), and `flex-wrap: balance`/`flex-line-count`
> (Chromium 150+ only, Experimental).
>
> 2026-11-07, full re-check: scroll-driven animations promoted from Experimental to **Emerging**. Firefox 159
> (2026-10-27) enabled them by default, and MDN now shows "Baseline 2026, newly available since October 2026"
> for `animation-timeline`, `animation-range` and `timeline-scope` (the last marked "some parts vary"). Exact
> days filled in from webstatus.dev: `::highlight()` 2026-03-24 (Firefox 149 was last, so the earlier
> Firefox 140 date was wrong); `scrollbar-color` 2025-12-12 (Safari 26.2); `sibling-index()`/`sibling-count()`
> 2026-08-18 (Firefox 154); `scrollbar-width` 2024-12-11; `round()`/`mod()`/`rem()` 2024-05-17 (Edge 125 was
> last, three days after Chrome 125). `light-dark()` with images is confirmed at 2026-09-14 (Safari 27).
> `text-wrap: pretty` was checked and is not Baseline because Firefox lacks it, so it moved to Experimental with a
> safe-degrading exception. `@supports at-rule()` now ships in Firefox 157 too, but is still not Baseline. Chrome 157 renamed
> `position-visibility: anchors-visible` to `anchor-visible`. webstatus.dev lists `border-shape` at Chrome 147,
> while the 2026-10-20 note said 155+; the two are not reconciled, but either way it is Chromium only. Browsers now
> ship stable releases every two weeks (Chrome 155/156/157 on 10-06/10-20/11-03, Firefox 156–159 from 09-15 to
> 10-27), so re-check releases more often. No date-driven flip was due on this date.
>
> 2026-11-21: date-driven flips applied. `light-dark()` and `text-wrap: balance` reached widely available on 2026-11-13
> (`light_dark` is now `true` on `enterprise`), and `round()`/`mod()`/`rem()` on 2026-11-17 (`stepped_value_functions`
> likewise). New rows checked against the webstatus.dev API: `:dir()` (widely 2026-06-07), `:state()` (widely
> 2026-11-17), `:host` (widely 2022-07-15), `::part()` (widely 2023-01-28), `text-overflow` (widely), invoker commands
> (newly 2025-12-12, Emerging). The API has no entry for `:defined` or `::slotted()`, so neither has a row, and
> `::slotted()` is described in rules-architecture.md without a tier. Non-Baseline features taught by Chrome's Modern
> Web Guidance were added to Experimental. Emerging ages recomputed to this date. Every row now names its
> webstatus.dev feature ids in an HTML comment, and `node tests/baseline-check.mjs` reports drift. Its first run
> moved `accent-color` from Stable to Experimental (webstatus.dev: limited), keeping it generated as safe-degrading.
> Next crossings to Stable: `scrollbar-color` and invoker commands 2026-12-12, `:active-view-transition` 2027-01-13,
> `shape()` 2027-02-24, `::highlight()` and `@scope` 2027-03-24, scroll-driven animations 2027-10-27.
> Next crossings to widely available: `@property` 2027-01 (flips `property_registration` on `enterprise`),
> `@starting-style` 2027-02 (`starting_style`), relative color syntax 2027-03 (`relative_colors`),
> `scrollbar-gutter`/`scrollbar-width` 2027-06.

## Profile Resolution

Priority: HIGH

Required order of resolution:

1. Explicit user instruction ("support Safari 15", "modern browsers only").
2. Project configuration: `browserslist` in `package.json`, `.browserslistrc`, or a `baseline` target.
3. Default: `evergreen`.

Never ask the user for a profile when a source above resolves it. State the resolved profile once when it changes generated output.

### Mapping project config to a profile

Profiles are defined by the age of the *oldest* engine release the project supports, because Baseline tiers are date-based. Resolve the config, find the oldest targeted release of each major engine (Chromium, Firefox, Safari), and take the strictest matching row:

| Oldest targeted engine release | Typical config | Profile |
| ------------------------------ | -------------- | ------- |
| Current stable only | `last 1 chrome version, last 1 firefox version, last 1 safari version`; `baseline: newly` with no year | `modern` |
| ≤ 12 months old | `defaults`, `last 2 versions, not dead`, `Firefox ESR` | `evergreen` |
| ≤ 30 months old (the Baseline *widely available* window) | `baseline widely available`; `baseline: widely`; a `baseline <year>` within 30 months | `enterprise` |
| Older than 30 months, or any IE / pre-Chromium Edge / Opera Mini target | `> 0.1%` without `not dead`, `safari >= 13`, `ie 11`, a `baseline <year>` older than 30 months | `legacy` |

- Required: when Node is available, resolve the query mechanically (`npx browserslist "<query>"` in the project) instead of guessing from the query text; the rows above are for when it isn't.
- A config that names no versions at all (`not dead` alone, an empty `browserslist` field) does not resolve anything — fall through to the default.

## Profiles

```yaml
browser_profiles:
  modern:
    fallbacks: none        # latest engines; ship all Stable features directly
  evergreen:
    fallbacks: minimal     # auto-updating browsers; @supports for Emerging only
  enterprise:
    fallbacks: progressive # slow-updating fleets; baseline first, enhance up
  legacy:
    fallbacks: extensive   # every non-universal feature needs a working fallback
```

## Capability Map

Reason from capabilities, never from browser names or versions. Per-profile defaults, grouped by topic:

```yaml
capabilities:                    # modern  evergreen  enterprise  legacy

  # Architecture
  cascade_layers:                #  true     true       true       false
  nesting:                       #  true     true       true       false
  scope:                         #  true     optional*   false      false
  has_selector:                  #  true     true       true       false
  is_where_selectors:            #  true     true       true       true
  shadow_dom_styling:            #  true     true       true       false   (:host, :host(), ::part(); never :host-context(), see rules-architecture.md)
  custom_states:                 #  true     true       true       false   (:state())

  # Layout
  container_queries:             #  true     true       true       false
  container_style_queries:       #  true     optional*   false      false
  subgrid:                       #  true     true       true       false
  scrollbar_gutter:              #  true     true       false      false
  scrollbar_width:               #  true     true       false      false
  scrollbar_color:               #  true     true       false      false   (Emerging but safe-degrading: unguarded on evergreen)
  overflow_clip:                 #  true     true       true       false
  line_clamp_unprefixed:         #  experimental — use the -webkit-line-clamp triplet (rules-color-typography.md)
  logical_properties:            #  true     true       true       true
  dir_pseudo:                    #  true     true       true       false   (:dir())
  clamp:                         #  true     true       true       true
  stepped_value_functions:       #  true     true       true       false   (round(), mod(), rem())
  lh_units:                      #  true     true       true       false
  display_contents:              #  true     true       true       false   (generic wrappers only; see rules-layout.md)
  flex_wrap_balance:             #  experimental — only on explicit request; no @supports (safe-degrading to flex-wrap: wrap)
  anchor_positioning:            #  true     optional    false      false

  # Color and Typography
  light_dark:                    #  true     true       true       false   (color arguments)
  light_dark_images:             #  true     optional    false      false
  color_mix:                     #  true     true       true       false
  oklch:                         #  true     true       true       false
  relative_colors:               #  true     true       false      false
  contrast_color:                #  true     optional    false      false
  text_box_trim:                 #  true     optional    false      false

  # Interaction
  scroll_snap:                   #  true     true       true       false
  dialog:                        #  true     true       true       false
  popover:                       #  true     true       false      false
  open_pseudo:                   #  true     optional    false      false
  details_content:               #  true     true       false      false
  custom_highlights:             #  true     true       false      false   (Emerging but safe-degrading: unguarded on evergreen)
  overscroll_behavior:           #  experimental — never without explicit request
  scroll_state_queries:          #  experimental — never without explicit request
  reduced_transparency:          #  true     true       true       true   (safe-degrading; see Experimental table)
  prefers_reduced_motion:        #  true     true       true       true   (inert where unsupported; never @supports)
  prefers_color_scheme:          #  true     true       true       true   (inert where unsupported; never @supports)
  prefers_contrast:              #  true     true       true       true   (inert where unsupported; never @supports)

  # Advanced
  property_registration:         #  true     true       false      false
  linear_easing:                 #  true     true       true       false
  starting_style:                #  true     true       false      false
  scroll_driven_animations:      #  true     optional    false      false   (unenhanced state must be the finished state)
  view_transitions:              #  true     true       false      false
  active_view_transition:        #  true     optional    false      false
  view_transitions_cross_doc:    #  experimental — never without explicit request
  field_sizing:                  #  true     optional    false      false
  shape_function:                #  true     optional    false      false
  clip_path_basic_shapes:        #  true     true       true       false
  mask_unprefixed:               #  true     true       true       false
  corner_shape:                  #  experimental — only on explicit request; no @supports (safe-degrading to border-radius)
  border_shape:                  #  experimental — never without explicit request
  sibling_index_count:           #  true     optional    false      false
  custom_functions:              #  experimental — never without explicit request
  user_valid_invalid:            #  true     true       true       false
  accent_color:                  #  true     true       true       false   (not Baseline per webstatus.dev, but safe-degrading; see Experimental table)
```

Rules:

- `true` → generate directly, no `@supports`.
- `optional` → generate only as progressive enhancement inside `@supports`, with acceptable behavior without it.
- `optional*` → progressive enhancement **without** an `@supports` guard. These features (`@scope`, `@container style()`) have no Baseline `@supports` test: `style()` is not a valid condition at all, and `at-rule()` is not Baseline, so a guard evaluates false and drops the block even in engines that support the feature. An engine without the feature drops the whole at-rule block by itself, so emit it unguarded and make the rules outside it a usable default on their own.
- `false` → do not generate; use the fallback technique instead.
- `experimental` → never generate unless explicitly requested.
- User-preference media queries (`prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast`, `prefers-reduced-transparency`, `forced-colors`) are never wrapped in `@supports` and never need a fallback on any profile. An engine that doesn't know a media feature evaluates the query as false, so the base styles outside it must be the safe state. A reviewer must not flag a missing guard on them.
- A project may override any capability; explicit overrides beat profile defaults.

## Feature Stability

Priority: HIGH

Tiers are derived mechanically from Baseline status, not maintained by hand:

- **Stable** — Baseline *widely available*, or Baseline *newly available* for ≥ 12 months as of the verification date above. Generate normally.
- **Emerging** — Baseline *newly available* for < 12 months. Direct on `modern`; `@supports`-gated progressive enhancement on `evergreen`; `false` for `enterprise`/`legacy`.
- **Experimental** — not yet Baseline (at least one major engine missing). Never generate unless explicitly requested.

Re-tiering is arithmetic: take a feature's Baseline since date, compare it to the verification date above, apply the 12-month cutoff. A feature crossing the cutoff moves tiers on the next verification pass; it does not require rewriting the rule that describes it.

The `enterprise` column is arithmetic too: a capability is `true` on `enterprise` only when the feature is Baseline *widely available* (newly available + 30 months) as of the verification date; otherwise `false`. Stable-but-not-widely features (the dated rows below) are therefore `false` on `enterprise`. `legacy` is `true` only for features that predate every engine the profile may target (effectively the universal set).

### Stable

| Feature | Baseline since |
| ------- | --------------- |
| Cascade Layers, Grid, Subgrid, Flexbox, Nesting, Container Queries (size), `clamp()`, `:has()`, `:is()`, `:where()`, logical properties, `color-mix()`, OKLCH, `dvh`/`svh`/`lvh`, `aspect-ratio`, `:user-valid`/`:user-invalid` <!-- ws: cascade-layers grid subgrid flexbox nesting container-queries min-max-clamp has is where logical-properties color-mix oklab viewport-unit-variants aspect-ratio user-pseudos --> | widely available |
| `light-dark()` (color arguments), `text-wrap: balance` <!-- ws: light-dark text-wrap-balance --> | widely available (2026-11-13; newly available 2024-05-13). Image arguments are Emerging, below |
| `@property` <!-- ws: registered-custom-properties --> | 2024-07-09 (newly available; widely 2027-01) |
| `@starting-style` <!-- ws: starting-style --> | 2024-08-06 (newly available; widely 2027-02) |
| Relative color syntax (`oklch(from …)`) <!-- ws: relative-color --> | 2024-09-16 (newly available; widely 2027-03) |
| `scrollbar-gutter` <!-- ws: scrollbar-gutter --> | 2024-12-11 (newly available; widely 2027-06) |
| Scroll snap (`scroll-snap-type`/`-align`, `scroll-padding`/`scroll-margin`) <!-- ws: scroll-snap --> | widely available since 2020–2022 |
| `<dialog>`, `::backdrop` <!-- ws: dialog --> | widely available since 2022–2024 |
| `popover`, `:popover-open` <!-- ws: popover --> | 2025-01-27 (newly available, > 12mo — Stable) |
| `clip-path` basic shapes (`inset()`, `circle()`, `ellipse()`, `polygon()`, `path()`) <!-- ws: clip-path --> | widely available since 2020 |
| `prefers-reduced-motion`, `prefers-color-scheme` <!-- ws: prefers-reduced-motion prefers-color-scheme --> | widely available (2022-07-15) |
| `prefers-contrast` <!-- ws: prefers-contrast --> | widely available (2024-11-30) |
| `mask`, `mask-image` (unprefixed) <!-- ws: masks --> | widely available (2026-06; newly available 2023-12) |
| `linear()` easing <!-- ws: linear-easing --> | widely available (2026-06; newly available 2023-12) |
| `overflow: clip` <!-- ws: overflow-clip --> | widely available (Safari 16, 2022-09) |
| `lh` / `rlh` units <!-- ws: lh rlh --> | widely available (2026-05; newly available 2023-11-21, Firefox 120) |
| `round()`, `mod()`, `rem()` <!-- ws: round-mod-rem --> | widely available (2026-11-17; newly available 2024-05-17, Edge 125) |
| `:dir()` <!-- ws: dir-pseudo --> | widely available (2026-06-07; newly available 2023-12-07, Edge 120) |
| `:state()` (custom element states) <!-- ws: state --> | widely available (2026-11-17; newly available 2024-05-17, Edge 125) |
| `:host` / `:host()`, `::part()` (shadow parts) <!-- ws: host shadow-parts --> | widely available (`:host` 2022-07-15; `::part()` 2023-01-28) |
| `text-overflow` <!-- ws: text-overflow --> | widely available (2018-01-29) |
| `display: contents` <!-- ws-skip: webstatus.dev display-contents is limited because of the accessibility bugs; rendering is interoperable, which is what this row tiers --> | rendering supported in every engine for years; Baseline does not cover its accessibility-tree bugs, so it is restricted to generic wrappers (rules-layout.md) |
| `grid-template-areas` / `grid-area` <!-- ws: grid --> | widely available (part of Grid) |
| `scrollbar-width` <!-- ws: scrollbar-width --> | 2024-12-11 (newly available; widely 2027-06) |
| `::details-content` <!-- ws: details-content --> | 2025-09-16 (Firefox 143; newly available, > 12mo — Stable as of 2026-09-16) |
| `overflow-inline` / `overflow-block` <!-- ws-skip: no webstatus.dev feature; dated from the MDN Baseline banner --> | 2025-09 (Safari 26; newly available, > 12mo — Stable) |
| View Transitions, same-document (`view-transition-name`, `view-transition-class`, `::view-transition-*`) <!-- ws: view-transitions view-transition-class --> | 2025-10-14 (Firefox 144; newly available, > 12mo — Stable as of 2026-10-14) |

### Emerging

| Feature | Baseline since (last engine) | Age as of 2026-11-21 |
| ------- | --------------- | --------------------- |
| Anchor Positioning (`anchor-name`, `position-anchor`, `position-area`, `position-try-fallbacks`, `@position-try`, `anchor()`) <!-- ws-skip: grouped anchor-positioning entry reports limited while position-anchor is newly available; see the split note --> | 2026-09-14 (Safari 27, the last engine to ship `position-anchor`) — see the split note below | ~2.2 months |
| `@scope`, `:scope` inside `@scope`, `&` inside `@scope` <!-- ws: scope --> | 2026-03-24 (Safari 26.4) | ~8.0 months |
| `:active-view-transition` <!-- ws: active-view-transition --> | 2026-01-13 | ~10.2 months |
| `@container style()` <!-- ws: container-style-queries --> | 2026-05-19 (Firefox 151) | ~6.1 months |
| `field-sizing` <!-- ws: field-sizing --> | 2026-06-16 (Firefox 152) | ~5.2 months |
| `text-box-trim` / `text-box-edge` <!-- ws-skip: webstatus.dev text-box groups the longhands with the non-Baseline shorthand; dated from Firefox 154's release note --> | 2026-08-18 (Firefox 154 — longhands only; the `text-box` shorthand is **not** Baseline) | ~3.1 months |
| `contrast-color()` <!-- ws: contrast-color --> | 2026-04-10 | ~7.4 months |
| `shape()` <!-- ws: shape-function --> | 2026-02-24 | ~8.9 months |
| `sibling-index()` / `sibling-count()` <!-- ws: sibling-count --> | 2026-08-18 (Firefox 154) | ~3.1 months |
| `:open` <!-- ws: open-pseudo --> | 2026-05-11 | ~6.4 months |
| `scrollbar-color` <!-- ws: scrollbar-color --> | 2025-12-12 (Safari 26.2) | ~11.3 months |
| `light-dark()` with `<image>` arguments <!-- ws: light-dark-image --> | 2026-09-14 (Safari 27) | ~2.2 months |
| `::highlight()` (CSS Custom Highlight API) <!-- ws: highlight --> | 2026-03-24 (Firefox 149) | ~8.0 months |
| Scroll-driven animations (`animation-timeline: scroll()`/`view()`, `animation-range`, `view-timeline-name`, `timeline-scope`) <!-- ws: scroll-driven-animations --> | 2026-10-27 (Firefox 159; Chrome 115 and Safari 26 shipped earlier). MDN marks parts of `timeline-scope` as varying | ~0.8 months |
| Invoker commands (HTML `commandfor` / `command`) <!-- ws: invoker-commands --> | 2025-12-12 (Safari 26.2; Firefox 144) | ~11.3 months |

**Anchor Positioning shipped in pieces and must be feature-detected on the last one.** `anchor-name`, `position-area` and `position-try-fallbacks` reached Baseline early in 2026; `position-anchor` only became Baseline newly available in September 2026 (Safari 27, 2026-09-14; MDN banner re-checked 2026-10-20). Grouped Baseline data (webstatus.dev `anchor-positioning`) still reports the whole feature as Limited availability (caniuse marks Chrome, Edge and Firefox as partial), so treat it as Emerging. Key the `@supports` guard to `position-anchor`, never to `anchor-name`: Safari 26 and other engines from before September 2026 have `anchor-name` but cannot position the element, so a guard on it detects nothing. The 12-month Stable crossing is 2026-09-14 + 12 months = 2027-09-14, assuming the grouped status catches up.

### Experimental

| Feature | Why |
| ------- | --- |
| View Transitions, cross-document (`@view-transition`, `navigation: auto`) <!-- ws: cross-document-view-transitions --> | Not Baseline — Firefox has not shipped it |
| `@container scroll-state()` (`stuck`, `snapped`, `scrollable`) <!-- ws: container-scroll-state-queries --> | Not Baseline — Chromium only (144+); Firefox and Safari have not shipped it |
| `overscroll-behavior` <!-- ws: overscroll-behavior --> | Not Baseline — Safari has not shipped it |
| `prefers-reduced-transparency` <!-- ws: prefers-reduced-transparency --> | Not Baseline — Firefox has not shipped it. **Exception: generate on every profile anyway.** An unsupported engine never matches the query, leaving the base styling untouched, so there is no broken state to guard against and no fallback to write. See rules-a11y-performance.md, Transparency. |
| `corner-shape` (and `superellipse()`) <!-- ws: corner-shape --> | Not Baseline — Chromium only (139+); Firefox and Safari have not shipped it. **Safe-degrading:** an unsupported engine draws the plain `border-radius`, so when explicitly requested it needs no `@supports` guard. See rules-advanced.md, Shapes and Clipping. |
| `border-shape` <!-- ws: border-shape --> | Not Baseline — Chromium only; Firefox and Safari have not shipped it |
| `text-wrap: pretty` <!-- ws: text-wrap-pretty --> | Not Baseline — Chromium 117 and Safari 26; Firefox has not shipped it. **Exception: generate on every profile anyway** (rules-color-typography.md, Text Wrapping). An engine that doesn't support the value ignores it and wraps text normally, so there is nothing to guard against. Never depend on it for layout. |
| `flex-wrap: balance`, `flex-line-count` <!-- ws: flexbox-flex-wrap-balance --> | Not Baseline — Chromium only (Chrome/Edge 150+); caniuse lists Firefox and Safari as unsupported as of 2026-10. **Safe-degrading:** declared after `flex-wrap: wrap`, other engines keep normal wrapping, so when explicitly requested it needs no `@supports` guard. See rules-layout.md, Grid vs Flexbox vs Flow. |
| Anchored container queries (`@container anchored(fallback: …)`), scroll-triggered animations (`animation-trigger`), CSS `inherit()` <!-- ws: scroll-triggered-animations --> | Not Baseline — the first two are Chromium only; `inherit()` is unshipped. All three are Interop 2027 proposals as of 2026-10; re-check when the Interop 2027 list is final. |
| `if()`, `@function`, `@mixin`, customizable select (`appearance: base-select`), `reading-flow`/`reading-order`, masonry/`grid-lanes`, gap decorations, `interpolate-size`/`calc-size()` <!-- ws: if function mixin customizable-select reading-flow grid-lanes gap-decorations interpolate-size calc-size --> | Single-engine or unshipped specs. The exception is customizable select, which ships in Chromium 135 and Safari 27 but not in Firefox. Firefox 159 removed the legacy `grid-template-*: masonry` syntax |
| `random()`, `text-fit`, `background-clip: border-area`, typed `attr()` (`attr(data-x type(<number>))`, or `attr()` in any property other than `content`) <!-- ws: random-function text-fit background-clip-border-area attr --> | Not Baseline. These drive much of the current demo content (css-tip, css-articles), which is exactly where they get copied from. Never generate unless requested. |
| `accent-color` <!-- ws: accent-color --> | Not Baseline: webstatus.dev reports limited availability, although it lists every engine as shipping it (Safari since 26.2). It was listed as widely available here until 2026-11-21. **Exception: keep generating it per its capability.** An engine without it draws the default control color, so nothing breaks and no fallback is needed (rules-forms.md). |
| Unprefixed `line-clamp` <!-- ws: line-clamp --> | Not Baseline (MDN: limited availability). Alone it does nothing in most engines; use the `-webkit-line-clamp` triplet, which every engine supports and the spec keeps as a legacy alias. |
| Features Chrome's Modern Web Guidance recommends that are not Baseline (webstatus.dev, 2026-11-21): interest invokers (`interestfor`, `interest-delay`, `:interest-source`/`:interest-target`; Chromium 149 only), `popover="hint"` (Chromium 151, Firefox 153; no Safari), `<dialog closedby>` (Chromium 134, Firefox 141; no Safari), `scroll-target-group` / `:target-current` (Chromium only), `scroll-initial-target` (Chromium only), `scroll-axis-lock` (Chrome 153 only), element-scoped view transitions (Chromium 147 only), `text-decoration-inset` (Chromium 157, Firefox 146; no Safari), `overflow-clip-margin` (webstatus lists Firefox 148 only), `:autofill` (webstatus lists no Firefox implementation), `:host-context()` (Chromium only; Firefox and Safari declined) <!-- ws: interest-invokers popover-hint dialog-closedby scroll-target-group scroll-initial-target scroll-axis-lock view-transitions-element-scoped text-decoration-inset overflow-clip-margin autofill host-context --> | Not Baseline. Their guides teach these, so an agent that also has that skill installed will see them. Never generate unless explicitly requested, whatever the resolved profile. |
| `@supports at-rule()` <!-- ws: supports-at-rule --> | Not Baseline — Chromium 148 and Firefox 157 (2026-09-29); Safari has not shipped it. Never use it as a guard: engines without it evaluate the condition false and drop the block even when they support the at-rule being tested. |

## @supports Rules

Priority: HIGH

Required: use `@supports` only when the resolved profile requires progressive enhancement for that specific feature.

Never wrap Stable features for `modern` or `evergreen` profiles.

Preferred (profile `legacy`, capability `false` needs a working baseline — no `@layer` wrapper, since `cascade_layers` is also `false` there):

```css
.card {
  display: grid;
  grid-template-columns: auto 1fr auto; /* functional baseline: repeats the parent's tracks by value */
}

@supports (grid-template-columns: subgrid) {
  .card {
    grid-template-columns: subgrid; /* enhancement: inherits the parent's tracks exactly, no drift */
  }
}
```

Preferred (Emerging at-rule feature, capability `optional*` on `evergreen` — no guard; an engine without `@scope` drops the block and the unscoped rule stands alone):

```css
@layer components {
  :where(.card) a {
    color: var(--color-link); /* usable default everywhere; (0,0,1) so the scoped rule can win by proximity */
  }

  @scope (.card) {
    a {
      color: var(--color-link-on-surface); /* enhancement: nearest-root wins */
    }
  }
}
```

Avoid (feature is guaranteed by the profile — the query is dead weight):

```css
@supports (display: flex) {
  .button {
    display: flex;
  }
}
```

Agent behavior:

- Never add a feature query the profile does not require.
- Never wrap universally supported features.
- Prefer graceful degradation: the unenhanced state must be usable, not broken.
- When a fallback exists in normal flow, put only the enhancement inside `@supports` — never duplicate the whole rule set.
- Use `@supports not (...)` only when the fallback cannot precede the enhancement in source order.
