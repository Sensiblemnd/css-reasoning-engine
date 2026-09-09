# Browser Profiles, Capabilities, and @supports Rules

> Baseline data verified: 2026-09-09, against webstatus.dev and the MDN Baseline banner. Re-verify
> before promoting or demoting any feature; recompute tiers from the Baseline since column in
> Feature Stability rather than hand-editing a tier.
>
> Where MDN's Baseline banner gives only a month, the exact day comes from the last engine's
> release note (e.g. `text-box-trim` → Firefox 154, 2026-08-18). Prefer that over rounding, and
> never date a longhand from a grouped webstatus entry that tracks its shorthand.

## Profile Resolution

Priority: HIGH

Required order of resolution:

1. Explicit user instruction ("support Safari 15", "modern browsers only").
2. Project configuration: `browserslist` in `package.json`, `.browserslistrc`, or a `baseline` target.
3. Default: `evergreen`.

Never ask the user for a profile when a source above resolves it. State the resolved profile once when it changes generated output.

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
  scope:                         #  true     optional    false      false
  has_selector:                  #  true     true       true       false
  is_where_selectors:            #  true     true       true       true

  # Layout
  container_queries:             #  true     true       true       false
  container_style_queries:       #  true     optional    false      false
  subgrid:                       #  true     true       false      false
  scrollbar_gutter:              #  true     true       false      false
  logical_properties:            #  true     true       true       true
  clamp:                         #  true     true       true       true
  anchor_positioning:            #  true     optional    false      false

  # Color and Typography
  light_dark:                    #  true     true       false      false
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
  details_content:               #  true     optional    false      false
  overscroll_behavior:           #  experimental — never without explicit request
  scroll_state_queries:          #  experimental — never without explicit request
  reduced_transparency:          #  true     true       true       true   (safe-degrading; see Experimental table)

  # Advanced
  property_registration:         #  true     true       true       false
  starting_style:                #  true     true       false      false
  scroll_driven_animations:      #  experimental — never without explicit request
  view_transitions:              #  true     optional    false      false
  active_view_transition:        #  true     optional    false      false
  view_transitions_cross_doc:    #  experimental — never without explicit request
  field_sizing:                  #  true     optional    false      false
  shape_function:                #  true     optional    false      false
  sibling_index_count:           #  true     optional    false      false
  custom_functions:              #  experimental — never without explicit request
  user_valid_invalid:            #  true     true       true       false
  accent_color:                  #  true     true       true       false
```

Rules:

- `true` → generate directly, no `@supports`.
- `optional` → generate only as progressive enhancement inside `@supports`, with acceptable behavior without it.
- `false` → do not generate; use the fallback technique instead.
- `experimental` → never generate unless explicitly requested.
- A project may override any capability; explicit overrides beat profile defaults.

## Feature Stability

Priority: HIGH

Tiers are derived mechanically from Baseline status, not maintained by hand:

- **Stable** — Baseline *widely available*, or Baseline *newly available* for ≥ 12 months as of the verification date above. Generate normally.
- **Emerging** — Baseline *newly available* for < 12 months. Direct on `modern`; `@supports`-gated progressive enhancement on `evergreen`; `false` for `enterprise`/`legacy`.
- **Experimental** — not yet Baseline (at least one major engine missing). Never generate unless explicitly requested.

Re-tiering is arithmetic: take a feature's Baseline since date, compare it to the verification date above, apply the 12-month cutoff. A feature crossing the cutoff moves tiers on the next verification pass; it does not require rewriting the rule that describes it.

### Stable

| Feature | Baseline since |
| ------- | --------------- |
| Cascade Layers, Grid, Subgrid, Flexbox, Nesting, Container Queries (size), `clamp()`, `:has()`, `:is()`, `:where()`, logical properties, `light-dark()`, `color-mix()`, OKLCH, `@property`, `@starting-style`, `text-wrap`, `dvh`/`svh`/`lvh`, `aspect-ratio`, `scrollbar-gutter`, `:user-valid`/`:user-invalid`, `accent-color` | widely available |
| Scroll snap (`scroll-snap-type`/`-align`, `scroll-padding`/`scroll-margin`) | widely available since 2020–2022 |
| `<dialog>`, `::backdrop` | widely available since 2022–2024 |
| `popover`, `:popover-open` | 2025-01-27 (newly available, > 12mo — Stable) |

### Emerging

| Feature | Baseline since (last engine) | Age as of 2026-09-09 |
| ------- | --------------- | --------------------- |
| Anchor Positioning (`anchor-name`, `position-area`, `position-try-fallbacks`, `@position-try`, `anchor()`) | 2026 — but see the split note below | partial |
| `@scope`, `:scope` inside `@scope`, `&` inside `@scope` | 2026-03-24 (Safari 26.4) | ~5.5 months |
| View Transitions, same-document (`view-transition-name`, `view-transition-class`, `::view-transition-*`) | 2025-10-14 (Firefox 144) | ~11 months |
| `:active-view-transition` | 2026-01-13 | ~8 months |
| `@container style()` | 2026-05-19 (Firefox 151) | ~3.7 months |
| `field-sizing` | 2026-06-16 (Firefox 152) | ~2.8 months |
| `text-box-trim` / `text-box-edge` | 2026-08-18 (Firefox 154 — longhands only; the `text-box` shorthand is **not** Baseline) | ~0.7 months |
| `contrast-color()` | 2026-04-10 | ~5 months |
| `shape()` | 2026-02-24 | ~6.5 months |
| `sibling-index()` / `sibling-count()` | 2026-08-18 | ~0.7 months |
| `:open` | 2026-05-11 | ~4 months |
| `::details-content` | 2025-09-16 (Firefox 143) | ~11.8 months — crosses to Stable within weeks; re-verify before relying on this row |

**Anchor Positioning is split and must be feature-detected on its weakest part.** `anchor-name`, `position-area` and `position-try-fallbacks` are Baseline 2026 newly available, but `position-anchor` is still Limited availability, and grouped Baseline data (webstatus.dev `anchor-positioning`) therefore reports the whole feature as not Baseline. Treat it as Emerging and key the `@supports` guard to `position-anchor`, never to `anchor-name` — guarding on the part that already shipped everywhere detects nothing. Re-check this split on the next verification pass; it is the row most likely to have moved.

### Experimental

| Feature | Why |
| ------- | --- |
| Scroll-driven animations (`animation-timeline: scroll()`/`view()`, `animation-range`, `view-timeline-name`, `timeline-scope`) | Not Baseline — Chrome 115 (2023-07), Safari 26 (2025-09), **Firefox has not shipped it**. Previously mis-tiered as Stable in this file; corrected 2026-09-09. |
| View Transitions, cross-document (`@view-transition`, `navigation: auto`) | Not Baseline — Firefox has not shipped it |
| `@container scroll-state()` (`stuck`, `snapped`, `scrollable`) | Not Baseline — Firefox has not shipped it |
| `overscroll-behavior` | Not Baseline — Safari has not shipped it |
| `prefers-reduced-transparency` | Not Baseline — Firefox has not shipped it. **Exception: generate on every profile anyway.** An unsupported engine never matches the query, leaving the base styling untouched, so there is no broken state to guard against and no fallback to write. See rules-a11y-performance.md, Transparency. |
| `if()`, `@function`, `@mixin`, `corner-shape`, customizable select (`appearance: base-select`), `reading-flow`/`reading-order`, masonry/`grid-lanes`, gap decorations, `interpolate-size`/`calc-size()` | Single-engine or unshipped specs |

## @supports Rules

Priority: HIGH

Required: use `@supports` only when the resolved profile requires progressive enhancement for that specific feature.

Never wrap Stable features for `modern` or `evergreen` profiles.

Preferred (profile `enterprise`, capability `false` needs a working baseline):

```css
@layer components {
  .card {
    display: grid;
    grid-template-columns: auto 1fr auto; /* functional baseline: repeats the parent's tracks by value */
  }

  @supports (grid-template-columns: subgrid) {
    .card {
      grid-template-columns: subgrid; /* enhancement: inherits the parent's tracks exactly, no drift */
    }
  }
}
```

Preferred (Emerging at-rule feature, capability `optional` on `evergreen` — feature-detect the at-rule itself, not a property inside it):

```css
@supports at-rule(@scope) {
  @layer components {
    @scope (.card) {
      a {
        color: var(--color-link-on-surface);
      }
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
