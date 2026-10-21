# Advanced Rules: @property, @starting-style, Scroll-Driven Animations, Shapes and Clipping, View Transitions, Anchor Positioning, Custom Functions

## @property — Stability: Stable

Priority: MEDIUM — direct on `modern`/`evergreen`; capability `false` on `enterprise`/`legacy` (not yet Baseline widely available). Where it is `false`, never transition or animate a custom property — transition the concrete property it feeds instead (`background-color`, `transform`), since the unregistered transition would snap.

### When to register

Register a custom property when any of these is true. Otherwise do not.

- **It is interpolated** — named in a `transition`/`transition-property`, or assigned inside `@keyframes`. This is a correctness requirement, not a preference: an unregistered custom property has no type, so the browser cannot interpolate it and the transition silently degrades to a discrete jump at the halfway point. Nothing errors, nothing warns in devtools, and the declaration looks correct. A `transition: --x` with no matching `@property` is dead code.
- **It is driven by a query and read by descendants** — a `--state`/`--density` value set by `@container` or `@media` and consumed further down the tree. Register with `inherits: true` so it reaches them, and register it so the crossings between query breakpoints can animate rather than snap.
- **An invalid value must fall back rather than break** — a registered property with a bad value resolves to its `initial-value`; an unregistered one is invalid at computed-value time and poisons every declaration that reads it.
- **It must not inherit** — `inherits: false` is the only way to stop a custom property inheriting.

Required within a registration:

- `initial-value` for every `syntax` other than `*`. Omitting it makes the whole `@property` rule invalid, and it is dropped silently — the same failure mode as not registering at all.
- `inherits` stated explicitly. It has no default worth relying on: pick `true` for values descendants read, `false` for values scoped to one element.
- Registrations live in the `tokens` layer, next to the custom properties they type.

```css
@layer tokens {
  @property --gradient-angle {
    syntax: "<angle>";
    inherits: false;
    initial-value: 0deg;
  }
}

@layer components {
  @media (prefers-reduced-motion: no-preference) {
    .ring {
      background: conic-gradient(from var(--gradient-angle), var(--color-accent), transparent);
      transition: --gradient-angle 300ms ease-out;
    }

    .ring:hover {
      --gradient-angle: 180deg;
    }
  }
}
```

A query-driven scale, registered so the steps interpolate instead of snapping:

```css
@layer tokens {
  @property --density {
    syntax: "<number>";
    inherits: true;
    initial-value: 0;
  }
}

@layer components {
  .panel {
    container-type: inline-size;
  }

  .card {
    gap: calc(var(--space-2xs) + var(--density) * var(--density-step));
    padding: calc(var(--space-s) + var(--density) * var(--density-step));

    @media (prefers-reduced-motion: no-preference) {
      transition: --density 200ms ease-out;
    }
  }

  @container (inline-size > 40rem) {
    .card {
      --density: 1;
    }
  }
}
```

- Never register properties that are only static tokens — registration without an interpolation, inheritance, or fallback need is noise.
- Never express the step size as a bare literal (`* .35rem`) inside the `calc()`. That is a magic number; give it a token, as `--density-step` above.

## @starting-style — Stability: Stable

Priority: MEDIUM

- Required for entry animations of elements arriving via `display: none` → visible, `popover`, or `dialog`. Never JavaScript class-juggling for this.

```css
@layer components {
  @media (prefers-reduced-motion: no-preference) {
    .menu {
      /* closed state = exit target; transition lives here so closing animates too */
      opacity: 0;
      transition:
        opacity 200ms ease-out,
        display 200ms allow-discrete,
        overlay 200ms allow-discrete;

      &:popover-open {
        opacity: 1;

        @starting-style {
          opacity: 0;
        }
      }
    }
  }
}
```

- Required: pair with `transition-behavior: allow-discrete` when transitioning `display` or `overlay`. Top-layer elements (`[popover]`, modal `<dialog>`) must transition **both** — without `overlay`, the element leaves the top layer instantly and the exit animation is clipped behind other content.
- Required: put the transition on the base (closed) rule, not only the open-state rule. A transition declared only on `:popover-open`/`[open]` stops applying the moment the state is removed, so only the entry animates.
- Placing the reduced-motion guard around the base rule, as above, means `no-preference` users get the fade and everyone else gets an instant toggle — the closed state is still `display: none` from the UA stylesheet, so `opacity: 0` never hides an open element.

## Scroll-Driven Animations — Stability: Experimental

Priority: MEDIUM

Not Baseline: Chrome shipped `animation-timeline` in 2023 and Safari in 2025, but **Firefox has not shipped it**. Never generate unless explicitly requested. This feature was tiered Stable in earlier versions of these rules; that was wrong, and CSS generated against it degrades silently — an `animation-timeline` Firefox does not understand leaves the element frozen in its `from` state, which for a reveal-on-scroll effect means permanently invisible content.

When explicitly requested:

- Required: an `@supports (animation-timeline: view())` guard, with the unenhanced state fully usable — the element must render in its `to` state (visible, final position), never its `from` state.
- Required: `prefers-reduced-motion` guard, same as any other animation — a scroll-driven animation is still an animation.
- Required: `animation-range` to bound where the animation starts/ends within the scroller or the element's view, instead of approximating the range with JS-measured offsets.
- Never make content visibility depend on the animation running. A reveal effect must degrade to "already revealed", not to "never revealed".

```css
@layer components {
  /* Baseline: visible with no animation. */
  .reveal {
    opacity: 1;
  }

  @supports (animation-timeline: view()) {
    @media (prefers-reduced-motion: no-preference) {
      .reveal {
        animation: fade-in linear both;
        animation-timeline: view();
        animation-range: entry 0% cover 30%;
      }
    }
  }

  @keyframes fade-in {
    from {
      opacity: 0;
      translate: 0 2rem;
    }
    to {
      opacity: 1;
      translate: 0 0;
    }
  }
}
```

Until the capability is confirmed, a scroll-linked effect is a candidate for *not building it* rather than for a JS scrollytelling library — the library is a large runtime cost for decoration. Where the effect is genuinely required, say so and accept the JS.

### Named timelines: `timeline-scope`, `view-timeline-name` — Stability: Experimental

Priority: LOW — same gating as the parent section; never generate unless explicitly requested.

A named `view-timeline` (`view-timeline-name` on the source element, referenced by `animation-timeline` on the animated element) is what connects an animated element to a scroller it does not itself live inside — e.g. a progress bar tracking an article. `timeline-scope` widens a name's visibility to ancestors that would otherwise be out of its scope.

```css
@supports (animation-timeline: view()) {
  @layer components {
    .scroller {
      view-timeline-name: --story-scroll;
    }

    .progress-bar {
      timeline-scope: --story-scroll;
      animation: grow linear both;
      animation-timeline: --story-scroll;
    }
  }
}
```

### Staggered entrance: `sibling-index()` / `sibling-count()` — Stability: Emerging

Priority: LOW — direct on `modern`; `@supports`-gated progressive enhancement on `evergreen`; unavailable on `enterprise`/`legacy`.

Required: `sibling-index()`/`sibling-count()` for stagger delays driven by DOM position, instead of a JS loop writing an inline `--delay` custom property per element.

```css
@supports (animation-delay: calc(sibling-index() * 1s)) {
  @media (prefers-reduced-motion: no-preference) {
    @layer components {
      .list-item {
        animation: fade-in 400ms ease-out both;
        animation-delay: calc(sibling-index() * 60ms);
      }
    }
  }
}
```

## Shapes and Clipping: `clip-path`, `shape()`, `mask`, `corner-shape`, `border-shape`

Pick the tool by what must change shape:

| Need | Tool | Stability |
| ---- | ---- | --------- |
| Rounded corners | `border-radius` | Stable |
| Non-round corners (squircle, bevel, scoop, notch) with border, shadow, and focus ring following them | `corner-shape` + `border-radius` | Experimental (safe-degrading) |
| Cut the element's whole rendering to a geometric outline | `clip-path` with a basic shape | Stable |
| Same, but the outline is curves/arcs that must use tokens or `%` | `clip-path: shape()` | Emerging |
| Soft or image-based edge (fade-out, gradient reveal, icon silhouette) | `mask-image` | Stable |
| Border, background, and shadow drawn along an arbitrary shape | `border-shape` | Experimental |

### `clip-path` — Stability: Stable

Priority: MEDIUM

`clip-path` with `inset()`, `circle()`, `ellipse()`, `polygon()`, and `path()` is Baseline widely available.

- Required: `clip-path` hides everything the element paints outside the shape, including its own `outline` and `box-shadow`, and clicks there no longer reach it. Never clip an interactive element directly: its focus ring disappears and its hit area shrinks. Clip an inner decorative child, or draw the focus indicator on an unclipped wrapper (see [rules-a11y-performance.md](rules-a11y-performance.md) Focus and Pointer and Touch).
- Prefer `inset(… round …)`, `circle()`, `ellipse()`, and `polygon()` over `path()`. Basic shapes take `%` and custom properties and resize with the box; `path()` is an opaque, fixed-unit SVG string that neither tokens nor container size can reach.
- Required: shapes animate only between the same function with matching arguments (two `inset()`s, two `polygon()`s with the same number of points). Anything else snaps. To reveal a polygon, start from the same polygon collapsed, not from `inset(…)`.
- `clip-path` is paint-only, so short reveal transitions are permitted under the Animation Cost rules. Guard them with `prefers-reduced-motion` like any other motion.
- A value other than `none` creates a stacking context, like `opacity < 1`. Check for `z-index` interactions with siblings before adding it.

```css
@layer components {
  .avatar-image {
    clip-path: circle(50%);
  }

  @media (prefers-reduced-motion: no-preference) {
    .reveal {
      clip-path: inset(0 0 100% 0);
      transition: clip-path 300ms ease-out;

      &.is-visible {
        clip-path: inset(0);
      }
    }
  }
}
```

### `shape()` — Stability: Emerging

Priority: LOW — direct on `modern`; `@supports`-gated progressive enhancement on `evergreen`; unavailable on `enterprise`/`legacy`.

Prefer `shape()` over `clip-path: path(...)` when the shape is expressed as a sequence of commands (arcs, curves) whose values need to reference custom properties or container units — `path()` takes an opaque SVG path string that tokens can't participate in. The `clip-path` rules above (focus ring, hit area, interpolation) apply unchanged.

```css
@supports (clip-path: shape(from 0 0, line to 100% 0)) {
  @layer components {
    .badge {
      clip-path: shape(from 0 0, line to 100% 0, curve to 100% 100% with 50% 50%, close);
    }
  }
}
```

### `mask` — Stability: Stable

Priority: LOW

Unprefixed `mask` and `mask-image` are Baseline widely available.

- Required: unprefixed properties only. `-webkit-mask-*` is a Stable-feature vendor prefix ([prohibited-patterns.md](prohibited-patterns.md)).
- Prefer `mask-image` over a gradient overlay element for fade-out edges (truncated text, scroll shadows): it needs no extra element and fades to whatever is behind the element.
- `black`/`white`/`transparent` in a mask gradient are alpha/luminance stops, not design colors, so they are exempt from the token rule.
- Masks clip `outline` and the hit area exactly like `clip-path`. The same never-on-interactive-elements rule applies.

```css
@layer components {
  .excerpt {
    mask-image: linear-gradient(to bottom, black 70%, transparent);
  }
}
```

### `corner-shape` — Stability: Experimental (safe-degrading)

Priority: LOW — never generate unless explicitly requested.

Not Baseline: Chromium only (Chrome/Edge 139+); Firefox and Safari have not shipped it. Unlike most Experimental features it degrades safely. An engine without it ignores the declaration and draws the `border-radius` it modifies, so the fallback is ordinary rounded corners, not a broken box.

- Required: pair it with `border-radius`. `corner-shape` reshapes the radius and does nothing without one.
- Required: no `@supports` guard. The unsupported state is already correct, as with `prefers-reduced-transparency`. The plain rounded fallback must be an acceptable design on its own. Never let meaning depend on the shape (a ticket notch that signals "torn-off", a bevel that signals a state).
- Prefer `corner-shape` over `clip-path` for non-round corners on anything with a border, shadow, or focus ring. Border, `outline`, `box-shadow`, background, and `overflow` all follow the corner shape, and the hit area stays the full box.
- Required: with `scoop`, `notch`, or `bevel`, content is not reshaped and still sits in the rectangular box, so padding must keep text clear of the cut-away corners.
- Required: logical longhands (`corner-start-start-shape`, `corner-block-start-shape`) when corners differ, never the physical `corner-top-left-shape` family, for the same reason as logical `border-*-radius`.
- `squircle` at the same radius looks visibly tighter than `round`. Tune the radius so both look right, rather than raising it only for the enhanced engine.

```css
@layer components {
  .tile {
    border-radius: var(--radius-card);
    corner-shape: squircle;
  }
}
```

### `border-shape` — Stability: Experimental

Never generate unless explicitly requested. Not Baseline: Chromium only (Chrome/Edge 155+); Firefox and Safari have not shipped it.

It draws the border, background, and shadow along a basic shape instead of the box. The border is always rendered `solid` and `border-radius`/`corner-shape` are ignored while it is set. When requested, gate it with `@supports (border-shape: circle(50%))` and keep a complete `border-radius` (or `corner-shape`) design outside the guard.

## View Transitions — Stability: Stable (same-document); Emerging (`:active-view-transition`); Experimental (cross-document)

Priority: MEDIUM

Same-document view transitions (`view-transition-name`, `view-transition-class`, `::view-transition-*`) are Stable: direct on `modern`/`evergreen`, no `@supports`; unavailable on `enterprise`/`legacy` (not yet Baseline widely available). Always progressive enhancement regardless of profile: navigation and state changes must work identically without it. The CSS side is inert where unsupported, since the transition is started from script (`document.startViewTransition`), which must feature-detect itself.

`:active-view-transition` is still Emerging: direct on `modern`, `@supports selector(:active-view-transition)`-gated on `evergreen`.

```css
@media (prefers-reduced-motion: no-preference) {
  @layer components {
    .card-hero {
      view-transition-name: card-hero;
      view-transition-class: card;
    }
  }
}
```

Rules:

- Required: unique `view-transition-name` per element per page.
- Prefer `view-transition-class` to share transition styling across a group of elements instead of duplicating `::view-transition-*` rules per name.
- Required: `prefers-reduced-motion` guard on customized transition animations.
- Prefer `:active-view-transition` (matched on `:root`) to change page chrome only while a transition is in flight, instead of a JS-toggled class with the same lifetime.
- Never make functionality depend on a transition finishing.

### Cross-document view transitions — Stability: Experimental

`@view-transition { navigation: auto; }` is not yet Baseline — Firefox has not shipped it. Never generate unless explicitly requested. When requested, Required: the navigation must complete identically with the rule absent, since an engine that ignores `@view-transition` still has to navigate normally.

## Anchor Positioning — Stability: Emerging

Priority: MEDIUM — direct on `modern` (capability `true`); `@supports`-gated progressive enhancement on `evergreen` (capability `optional`); unavailable on `enterprise`/`legacy` (capability `false`) — see [browser-profiles.md](browser-profiles.md).

Generate directly whenever the resolved profile's `anchor_positioning` capability is `true` or `optional`. This is no longer a "never generate unless asked" feature: it is the default technique for anchored overlays (tooltips, menus, popovers, comboboxes) on `modern`/`evergreen`, ahead of a JavaScript positioning library.

Support arrived in pieces. `anchor-name`, `position-area` and `position-try-fallbacks` reached Baseline early in 2026; `position-anchor` was last, in September 2026 (Safari 27). Detect the last piece — `@supports (position-anchor: --a)` — because a guard written against `anchor-name` passes in engines from before September 2026 that cannot actually position the element, which is worse than no guard at all.

```css
@supports (position-anchor: --a) {
  @layer components {
    .trigger {
      anchor-name: --menu-trigger;
    }

    .menu {
      position: fixed;
      position-anchor: --menu-trigger;
      position-area: block-end span-inline-end;
      position-try-fallbacks: flip-block;
    }
  }
}
```

Rules:

- Required: `position-try-fallbacks` (or an `@position-try` block referenced by it) so the anchored element never renders off-screen.
- Required: wrap in `@supports (position-anchor: --a)` on `evergreen` per the Emerging pattern; generate directly with no wrapper on `modern`. Never guard on `anchor-name` — it is Baseline and detects nothing.
- Required: a usable unenhanced state inside the guard's shadow. An unanchored menu must still be reachable (popover default placement, or a positioned container), not rendered at the viewport origin.
- Prefer a named `@position-try` block over an inline `position-try-fallbacks` list only when the same custom fallback is reused across multiple anchored elements:

```css
@position-try --menu-fallback {
  position-area: block-start span-inline-end;
}

.menu {
  position-try-fallbacks: --menu-fallback, flip-block;
}
```

- Prefer `anchor()` to read an offset or size from the anchor element directly in a property value (`top: anchor(bottom)`) only when `position-area` cannot already express the needed placement.
- Prefer `position-visibility: anchors-visible` so the anchored element hides once its anchor scrolls out of view, instead of leaving a floating menu with no visible trigger.
- On `enterprise`/`legacy` (capability `false`): position overlays with popover default placement or a positioned container, not a JavaScript positioning library.

## Custom CSS Functions (@function) — Stability: Experimental

Never generate unless explicitly requested. When requested:

- Required: a comment at the use site stating that the project targets engines shipping `@function`. There is no valid `@supports` test for it — `result` is only a descriptor inside `@function`, not a property, so `@supports (result: …)` is always false, and `at-rule(@function)` is not Baseline.
- Required: a working non-function fallback value in the same rule.
