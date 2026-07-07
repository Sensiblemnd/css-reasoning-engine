# Advanced Rules: @property, @starting-style, View Transitions, Anchor Positioning, Custom Functions

## @property — Stability: Stable

Priority: MEDIUM

- Required: register a custom property when it is animated, needs type-checked values, or must not inherit.
- Registrations live in the `tokens` layer.

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

- Never register properties that are only static tokens — registration without animation/typing need is noise.

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

## View Transitions — Stability: Emerging

Generate only when the capability is confirmed for the profile. Always progressive enhancement: navigation and state changes must work identically without it.

```css
@supports (view-transition-name: none) {
  @media (prefers-reduced-motion: no-preference) {
    .card-hero {
      view-transition-name: card-hero;
    }
  }
}
```

Rules:

- Required: unique `view-transition-name` per element per page.
- Required: `prefers-reduced-motion` guard on customized transition animations.
- Never make functionality depend on a transition finishing.

## Anchor Positioning — Stability: Experimental

Never generate unless explicitly requested. When requested, Required: a functional fallback (positioned container, popover default placement) and an `@supports` guard.

```css
@supports (anchor-name: --a) {
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
```

Rules:

- Required: `position-try-fallbacks` so the anchored element never renders off-screen.
- Until requested, position overlays with popover defaults or positioned containers, not JavaScript libraries.

## Custom CSS Functions (@function) — Stability: Experimental

Never generate unless explicitly requested. When requested:

- Required: an `@supports (result: if(else: true))`-style capability guard or a documented statement that the project targets engines shipping `@function`.
- Required: a working non-function fallback value in the same rule.
