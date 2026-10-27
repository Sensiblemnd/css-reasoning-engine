# Interaction Rules: Scroll Snap, Overscroll, Scrollbars, Overlays, Details Disclosure, Custom Highlights, Scroll-State Queries, Carousels

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

## Scrollbar Styling: `scrollbar-width` (Stable), `scrollbar-color` (Emerging, safe-degrading)

Priority: LOW

- Required: standard `scrollbar-width` and `scrollbar-color` for scrollbar styling, never the `::-webkit-scrollbar` pseudo-element family on `modern`/`evergreen`. Engines that support the standard properties ignore `::-webkit-scrollbar` on any element where they're set to something other than `auto`, so mixing the two gives different scrollbars per engine.
- `scrollbar-color` is Emerging but needs no `@supports` guard: an engine without it ignores the declaration and draws its default scrollbar, which is a correct state. `scrollbar-color` takes thumb then track, and both must be tokens with at least 3:1 contrast against each other (a scrollbar is a UI control, WCAG 1.4.11).
- Never `scrollbar-width: none` on content the user has to scroll. It removes the only visible sign that more content exists and the mouse user's drag handle. Exception: a scroller with its own visible controls (a carousel with previous/next buttons), documented at the use site.
- `::-webkit-scrollbar` is acceptable only on `enterprise`/`legacy` as the profile's fallback, and only on elements where `scrollbar-color` is not set.
- Never choose between the two with `@supports selector(::-webkit-scrollbar)` or `@supports not selector(::-webkit-scrollbar)`. Since Firefox 156, Firefox reports the pseudo-element as unsupported on every site but still applies `::-webkit-scrollbar` rules on some, so the guard no longer tells engines apart. Separate the two by element, per the previous rule.

```css
@layer components {
  .panel-body {
    overflow-block: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--color-scrollbar-thumb) var(--color-scrollbar-track);
  }
}
```

## Overlays: `<dialog>`, `::backdrop`, `popover`, `:open`, and the top layer

Priority: HIGH

Required: `<dialog>` (`.showModal()`) or `[popover]` — Stability: Stable — for anything that must render above all other page content: modals, menus, toasts, comboboxes. Never a hand-rolled `position: fixed` element with an escalating `z-index`.

The top layer is why this matters architecturally, not just semantically: an element promoted to it (every `<dialog>` while modal, every `[popover]` while showing) paints above the entire document regardless of any `z-index` set anywhere else in the page. This makes the "z-index war" structurally impossible instead of merely discouraged — nobody has to know or prove what the current highest `z-index` is, because there is no ceiling to out-bid.

Element-level overlay defaults live in `base` with zero specificity; component classes (`.modal`, `.menu`) layer their specifics on top in `components`.

```css
@layer base {
  :where(dialog, [popover]) {
    /* transparent, not none: the border becomes the visible edge in forced-colors mode */
    border: var(--border-width-thin) solid transparent;
    border-radius: var(--radius-card);
    padding-inline: var(--space-m);
    padding-block: var(--space-s);
  }

  :where(dialog)::backdrop {
    background: var(--color-scrim);
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
- Prefer `:open` — Stability: Emerging, direct on `modern`, `@supports`-gated on `evergreen` — for the open state of `<details>`, `<dialog>`, `<select>`, and `<input>` pickers, instead of the `[open]` attribute selector (which cannot see a `<select>` or picker at all). `:open` does **not** match popovers: a showing `[popover]` is `:popover-open`, a separate state. Always anchor `:open` to a component selector, never bare.

```css
@supports selector(:open) {
  @layer components {
    .disclosure:open {
      background: var(--color-surface-raised);
    }
  }
}
```

- Cross-reference `@starting-style` ([rules-advanced.md](rules-advanced.md)) for entry/exit animation of `<dialog>` and `[popover]` — not restated here.
- To tether a popover to its trigger, use anchor positioning ([rules-advanced.md](rules-advanced.md) Anchor Positioning) — Emerging, and `position-area` does nothing without `position-anchor`, so it belongs inside that section's `@supports (position-anchor: --a)` guard, never in an unguarded `[popover]` rule. A popover's default placement is centered in the viewport; that is the correct unenhanced state.

## `::details-content` — Stability: Stable

Priority: LOW — direct on `modern`/`evergreen`; unavailable on `enterprise`/`legacy` (not yet Baseline widely available), where the disclosure simply opens without the fade.

`::details-content` targets the collapsible part of a `<details>` element, so the disclosure's content can be styled and faded without a wrapper element.

- Prefer an opacity/transform reveal on `::details-content` over animating its height. Animating `block-size` is a layout-property animation (prohibited — see [rules-a11y-performance.md](rules-a11y-performance.md) Animation Cost), and it cannot reach `auto` anyway without `interpolate-size`/`calc-size()`, which are Experimental. Without them a `block-size` transition snaps instead of animating.
- A height-animated disclosure is therefore **not** a Stable-CSS replacement for a JS height-measurement hack. Leave existing JS height animation in place (reviewer: not a finding; refactorer: skip) unless the project has explicitly opted into `interpolate-size`.

```css
@media (prefers-reduced-motion: no-preference) {
  @layer components {
    .disclosure::details-content {
      opacity: 0;
      transition: opacity 200ms ease-out, content-visibility 200ms allow-discrete;
    }

    .disclosure:where([open])::details-content {
      opacity: 1;
    }
  }
}
```

## Custom Highlights: `::highlight()` — Stability: Emerging (safe-degrading)

Priority: LOW — direct on `modern`/`evergreen` without `@supports`; unavailable on `enterprise`/`legacy` (not yet Baseline widely available).

`::highlight(name)` styles text ranges that script registers with the CSS Custom Highlight API (`CSS.highlights.set(name, new Highlight(...ranges))`), without adding elements to the DOM.

- Prefer `::highlight()` for find-in-page matches, spelling or grammar marks, and syntax coloring over wrapping ranges in `<span>`/`<mark>` elements from script. Wrapping splits text nodes, breaks the user's selection, and costs a DOM mutation per match.
- Highlights are not exposed to assistive technology. When the marking is content (a search term in a results list that a screen reader should announce), use `<mark>` in the HTML instead.
- The script feature-detects with `"highlights" in CSS` and does nothing without it, so the text stays unmarked, which is a correct state. No `@supports` guard is needed: an engine without the pseudo-element drops the rule by itself.
- Never put `::highlight()` in a selector list with other selectors: one unknown pseudo-element invalidates the whole list, so those selectors are dropped too.
- Only text-paint properties apply (`color`, `background-color`, `text-decoration`, `text-shadow`). Never rely on layout or box properties here; they are ignored.

```css
@layer components {
  ::highlight(search-match) {
    background-color: var(--color-highlight);
    color: var(--color-on-highlight);
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
