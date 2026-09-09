# Interaction Rules: Scroll Snap, Overscroll, Overlays, Details Disclosure, Scroll-State Queries, Carousels

## Scroll Snap — Stability: Stable

Priority: MEDIUM

- Required: `scroll-snap-type` on the scroller and `scroll-snap-align` on its children for any horizontally- or vertically-paged content (carousels, image rails, onboarding steps). Never a JS carousel library reimplementing snap-to-item behavior the platform already provides — a JS-computed offset drifts the moment item width, gap, or content changes, where native snapping recalculates for free.
- Required: `scroll-padding`/`scroll-margin` to offset the snap target from a fixed header/sidebar. Without it, the header covers the first visible pixels of the item that just snapped into place.
- Required: `scroll-behavior: smooth` only inside `@media (prefers-reduced-motion: no-preference)` — programmatic smooth scrolling is motion like any other and must respect the same preference.

```css
@layer components {
  .gallery {
    display: flex;
    overflow-inline: auto;
    scroll-snap-type: inline mandatory;
    scroll-padding-inline-start: var(--space-header-offset);
    gap: var(--space-m);
  }

  .gallery-item {
    scroll-snap-align: start;
  }
}

@media (prefers-reduced-motion: no-preference) {
  @layer components {
    .gallery {
      scroll-behavior: smooth;
    }
  }
}
```

## overscroll-behavior — Stability: Experimental

Priority: LOW — not yet Baseline: Safari has not shipped it. Never generate unless explicitly requested. When requested, Required: an `@supports` guard and a documented note that the gap on unsupported Safari versions is accepted.

`overscroll-behavior: contain` on a scrollable overlay (modal body, side panel, nested chat log) stops scroll chaining — without it, scrolling to the end of the overlay's content hands the remaining scroll delta to the page behind it, so the page silently scrolls under the user. That is the failure mode this property exists to prevent: a background page that jumps, or a modal that appears to "scroll through" to the page behind it, while the modal's own code has no bug in it.

```css
@supports (overscroll-behavior: contain) {
  @layer components {
    .modal-body {
      overscroll-behavior: contain;
    }
  }
}
```

## Overlays: `<dialog>`, `::backdrop`, `popover`, `:open`, and the top layer

Priority: HIGH

Required: `<dialog>` (`.showModal()`) or `[popover]` — Stability: Stable — for anything that must render above all other page content: modals, menus, toasts, comboboxes. Never a hand-rolled `position: fixed` element with an escalating `z-index`.

The top layer is why this matters architecturally, not just semantically: an element promoted to it (every `<dialog>` while modal, every `[popover]` while showing) paints above the entire document regardless of any `z-index` set anywhere else in the page. This makes the "z-index war" structurally impossible instead of merely discouraged — nobody has to know or prove what the current highest `z-index` is, because there is no ceiling to out-bid.

```css
@layer components {
  dialog {
    border: none;
    border-radius: var(--radius-card);
    padding-inline: var(--space-l);
    padding-block: var(--space-m);
  }

  dialog::backdrop {
    background: var(--color-scrim);
  }

  [popover] {
    border: none;
    border-radius: var(--radius-card);
    padding-inline: var(--space-m);
    padding-block: var(--space-s);
  }
}
```

Avoid:

```css
.menu {
  position: fixed;
  z-index: 9999; /* the next component picks 10000, and the arms race repeats */
}
```

Rules:

- Required: `::backdrop` for the dimming layer behind a modal `<dialog>`. Never a sibling `.overlay` element with manual `position: fixed` and `z-index` standing in for it.
- Required: `[popover]` (not a `role="dialog"` div with hand-wired listeners) for transient UI — menus, tooltips, toasts — that should light-dismiss on outside click, `Escape`, or opening another popover. That behavior is native to the top layer and popover semantics; reimplementing it in JS reproduces the same edge cases (focus trap, nested-popover close order) the platform already solved.
- Prefer `:open` — Stability: Emerging, direct on `modern`, `@supports`-gated on `evergreen` — to style any element currently in its open state (a shown `<dialog>`, an expanded `<details>`, a showing `[popover]`) with one selector, instead of three separate mechanisms (`:popover-open`, `[open]`, a dialog-specific check).

```css
@supports selector(:open) {
  @layer components {
    :open {
      accent-color: var(--color-accent);
    }
  }
}
```

- Cross-reference `@starting-style` ([rules-advanced.md](rules-advanced.md)) for entry/exit animation of `<dialog>` and `[popover]` — not restated here.
- To tether a popover to its trigger, use anchor positioning ([rules-advanced.md](rules-advanced.md) Anchor Positioning) — Emerging, and `position-area` does nothing without `position-anchor`, so it belongs inside that section's `@supports (position-anchor: --a)` guard, never in an unguarded `[popover]` rule. A popover's default placement is centered in the viewport; that is the correct unenhanced state.

## `::details-content` — Stability: Emerging

Priority: LOW — direct on `modern`; `@supports`-gated progressive enhancement on `evergreen`; unavailable on `enterprise`/`legacy`.

Required: `::details-content` to animate a `<details>` disclosure open/closed, instead of a JS height-measurement hack (`scrollHeight` read into an inline style right before transitioning). The JS version fails a specific, hard-to-reproduce way: it measures before a web font swaps or an image finishes loading, then animates to a height that's already stale, producing a visible snap at the end of the transition. `::details-content` animates the actual box, so it can't be stale.

```css
@supports selector(::details-content) {
  @media (prefers-reduced-motion: no-preference) {
    @layer components {
      ::details-content {
        overflow: hidden;
        transition: block-size 200ms ease-out, content-visibility 200ms allow-discrete;
      }
    }
  }
}
```

## `@container scroll-state()` — Stability: Experimental

Priority: LOW — not yet Baseline: Firefox has not shipped it. Documented so the reviewer recognizes it and the refactorer knows the migration target; never generate unless explicitly requested.

`scroll-state(stuck: ...)` / `scroll-state(snapped: ...)` / `scroll-state(scrollable: ...)`, queried on a `container-type: scroll-state` ancestor, answer "is this element currently stuck / snapped / scrollable" without a JS `IntersectionObserver` polling for the same state and writing a class back onto the DOM.

```css
@supports (container-type: scroll-state) {
  @layer components {
    .sticky-header {
      container-type: scroll-state;
    }

    @container scroll-state(stuck: top) {
      .sticky-header-title {
        font-size: var(--text-s);
      }
    }
  }
}
```

## CSS Carousels: `::scroll-marker`, `::scroll-marker-group`, `::scroll-button()` — Stability: Experimental

Priority: LOW — single-engine. Documented so the reviewer recognizes it and the refactorer knows the migration target; never generate unless explicitly requested.

These pseudo-elements generate carousel navigation (dot indicators, previous/next controls) directly from a `scroll-snap-align` scroller, replacing a JS-authored dot-per-slide loop that has to stay in sync with slide count by hand. When requested on a `modern`-only project, pair with the Scroll Snap rules above rather than in place of them — the pseudo-elements are navigation UI for an already-snapping scroller, not a substitute for `scroll-snap-type`.

```css
@supports (scroll-marker-group: after) {
  @layer components {
    .gallery {
      scroll-marker-group: after;
    }

    .gallery-item::scroll-marker {
      background: var(--color-border);
      border-radius: var(--radius-full);
    }

    .gallery-item::scroll-marker:target-current {
      background: var(--color-accent);
    }
  }
}
```
