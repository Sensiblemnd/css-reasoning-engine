# Browser Profiles, Capabilities, and @supports Rules

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

Reason from capabilities, never from browser names or versions. Per-profile defaults:

```yaml
capabilities:                 # modern  evergreen  enterprise  legacy
  cascade_layers:             #  true     true       true       false
  nesting:                    #  true     true       true       false
  container_queries:          #  true     true       true       false
  has_selector:               #  true     true       true       false
  is_where_selectors:         #  true     true       true       true
  logical_properties:         #  true     true       true       true
  clamp:                      #  true     true       true       true
  light_dark:                 #  true     true       false      false
  color_mix:                  #  true     true       true       false
  oklch:                      #  true     true       true       false
  relative_colors:            #  true     true       false      false
  property_registration:      #  true     true       true       false
  starting_style:             #  true     true       false      false
  scope:                      #  true     true       false      false
  view_transitions:           #  optional optional   false      false
  anchor_positioning:         #  experimental — never without explicit request
  custom_functions:           #  experimental — never without explicit request
```

Rules:

- `true` → generate directly, no `@supports`.
- `optional` → generate only as progressive enhancement inside `@supports`, with acceptable behavior without it.
- `false` → do not generate; use the fallback technique instead.
- `experimental` → never generate unless explicitly requested.
- A project may override any capability; explicit overrides beat profile defaults.

## Feature Stability

| Level | Behavior | Features |
| ----- | -------- | -------- |
| Stable | Generate normally | Cascade Layers, Grid, Flexbox, Nesting, Container Queries, `clamp()`, `:has()`, `:is()`, `:where()`, logical properties, `light-dark()`, `color-mix()`, OKLCH, `@property`, `@starting-style`, `@scope`, `text-wrap`, `dvh`/`svh`/`lvh` |
| Emerging | Only when capability confirmed; always progressive enhancement | View Transitions |
| Experimental | Never unless explicitly requested | Anchor Positioning, Custom CSS Functions (`@function`), unshipped specs |

## @supports Rules

Priority: HIGH

Required: use `@supports` only when the resolved profile requires progressive enhancement for that specific feature.

Never wrap Stable features for `modern` or `evergreen` profiles.

Preferred (profile `enterprise`, capability `false` needs a working baseline):

```css
@layer components {
  .gallery {
    display: block; /* functional baseline for the resolved profile */
  }

  @supports (grid-template-rows: masonry) {
    .gallery {
      display: grid;
      grid-template-rows: masonry;
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
