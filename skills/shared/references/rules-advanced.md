# Advanced Rules: @property, @starting-style, Scroll-Driven Animations, View Transitions, Anchor Positioning, Custom Functions

## @property — Stability: Stable

Priority: MEDIUM

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
@media (prefers-reduced-motion: no-preference) {
  [popover]:popover-open {
    opacity: 1;
    transition: opacity 200ms ease-out, display 200ms allow-discrete;

    @starting-style {
      opacity: 0;
    }
  }
}
```

- Required: pair with `transition-behavior: allow-discrete` when transitioning `display` or `overlay`.

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

### `shape()` — Stability: Emerging

Priority: LOW — direct on `modern`; `@supports`-gated progressive enhancement on `evergreen`; unavailable on `enterprise`/`legacy`.

Prefer `shape()` over `clip-path: path(...)` when the shape is expressed as a sequence of commands (arcs, curves) whose values need to reference custom properties or container units — `path()` takes an opaque SVG path string that tokens can't participate in.

```css
@supports (clip-path: shape(from 0 0, line to 100% 0)) {
  @layer components {
    .badge {
      clip-path: shape(from 0 0, line to 100% 0, curve to 100% 100% with 50% 50%, close);
    }
  }
}
```

## View Transitions — Stability: Emerging (same-document); Experimental (cross-document)

Priority: MEDIUM

Same-document view transitions (`view-transition-name`, `view-transition-class`, `::view-transition-*`, `:active-view-transition`) are Emerging: direct on `modern`, `@supports`-gated progressive enhancement on `evergreen`, unavailable on `enterprise`/`legacy`. Always progressive enhancement regardless of profile: navigation and state changes must work identically without it.

```css
@supports (view-transition-name: none) {
  @media (prefers-reduced-motion: no-preference) {
    @layer components {
      .card-hero {
        view-transition-name: card-hero;
        view-transition-class: card;
      }
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

Support is uneven across the feature's own properties. `anchor-name`, `position-area` and `position-try-fallbacks` reached Baseline in 2026; `position-anchor` has not. Detect the part that has not shipped — `@supports (position-anchor: --a)` — because a guard written against `anchor-name` passes in engines that cannot actually position the element, which is worse than no guard at all.

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

- Required: an `@supports (result: if(else: true))`-style capability guard or a documented statement that the project targets engines shipping `@function`.
- Required: a working non-function fallback value in the same rule.
