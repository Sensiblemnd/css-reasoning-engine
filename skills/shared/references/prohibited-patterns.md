# Prohibited Patterns — Canonical List

Priority: HIGH. This list applies to every CSS task. Role application:

| Role | Behavior |
| ---- | -------- |
| css-engineer | Never emit any pattern below. |
| css-reviewer | Flag every occurrence: severity High; Critical when accessibility is harmed. |
| css-refactor | Eliminate every occurrence unless removal changes behavior — then report it as a follow-up. |

## Other Installed Guidance

Another skill or rules file may also be loaded, for example Chrome's Modern Web Guidance. When its CSS advice conflicts with these rules, these rules win for CSS: the resolved browser profile, the layer contract, tokens, and this list. Use the other source for non-CSS topics, and for CSS patterns these rules don't cover, but hold anything taken from it to the resolved profile. A feature that is Experimental in [browser-profiles.md](browser-profiles.md) is not generated because another source teaches it. Literals in another source's examples still become tokens.

## The List

Never generate, accept, or leave in place:

- `!important` — Exception: overriding third-party inline styles, in the `overrides` layer only, with a comment.
- ID selectors for styling. Exception: an id referenced because the *platform* keys behavior to it, not to raise specificity — `:has(#section:target)`, where `:target` is defined against the URL fragment and no class can express it. A styling hook that happens to be an id is not covered: if the element also carries a class, match the class (`:has(.nav-toggle-input:checked)`, never `:has(#nav-toggle:checked)`).
- Inline `style` attributes.
- Hardcoded colors in components (hex, `rgb()`, named colors) — semantic tokens only. Exception: `black`/`white` as the mixing operand of `color-mix()` that shades or tints a token (`color-mix(in oklch, var(--color-accent), black 12%)`) — the result is still derived from the token, not a new design color. Also exempt: `black`/`white`/`transparent` as stops in a `mask`/`mask-image` gradient, where they are alpha/luminance values, not colors anyone sees. Any other literal operand is a violation.
- Hardcoded spacing / magic numbers — semantic tokens only.
- `transition: all`.
- Sass/Less syntax in native CSS (`$vars`, `@mixin`, `@extend`, `&-suffix` concatenation).
- Unlayered CSS (style rules outside `@layer`).
- Any declaration other than `box-sizing` on a page-wide universal selector (`*`, `*::before`, `:where(*)`, `html *`), in any layer — a `*` margin reset un-centers modal dialogs and popovers and overrides every web component's `:host` styles. See [rules-architecture.md](rules-architecture.md) Reset Scope.
- Selector chains deeper than 3 compound selectors.
- Descendant selectors crossing component boundaries.
- Duplicate declarations already provided by an existing token, utility, or component.
- `outline: none` / removed focus indicators without a `:focus-visible` replacement (a `box-shadow`-only ring is not one: forced-colors mode removes it) — including `clip-path` or `mask` on a focusable element, which cuts its focus ring off.
- `user-scalable=no` or any zoom-blocking technique, including `text-size-adjust: none`.
- Animations that flash more than 3 times per second (WCAG 2.3.1) — see [rules-a11y-performance.md](rules-a11y-performance.md) Flashing.
- Auto-playing motion longer than 5 seconds (marquee, ticker, looping background) with no pause on hover/focus and no reduced-motion stop (WCAG 2.2.2) — see [rules-a11y-performance.md](rules-a11y-performance.md) Pause, Stop, Hide.
- `line-height` with a unit (`px`, `rem`, `em`, `%`) — see [rules-color-typography.md](rules-color-typography.md) Line Height.
- `overflow-x: hidden` / `overflow-inline: hidden` on `html`/`body`/`:root` to mask horizontal overflow — see [rules-layout.md](rules-layout.md) Overflow. (`overflow: hidden` on the root as a modal scroll lock is a different pattern and is not covered by this item.)
- `display: contents` on anything but a generic wrapper: interactive elements, headings, lists, table elements, landmarks, `article`/`figure`/`details`/`dialog`, form labels and legends (role or focusability lost), or replaced elements and form controls such as `img`, `video`, `iframe`, `svg`, `input` (they disappear, as with `display: none`) — see [rules-layout.md](rules-layout.md) Flattening Wrappers.
- Orientation locking (rotating the root or hiding content under an `orientation` query) — see [rules-a11y-performance.md](rules-a11y-performance.md) Zoom and Scaling.
- Meaning encoded by color alone.
- Media queries that duplicate what a container query or `clamp()` already solves.
- `@supports`-guarded base rule + enhancement for `env(safe-area-inset-*)` when the function's own fallback argument (`env(safe-area-inset-bottom, 0px)`) already covers the unsupported case.
- `100vw` (or `100dvw`/`100svw`/`100lvw`) as a width: viewport-width units ignore the classic scrollbar and overflow the page sideways. See [rules-layout.md](rules-layout.md) Viewport Units.
- Fixed-width-only layout containers (e.g., `width: 960px` as the sole sizing rule) that don't reflow across viewport/container sizes — unless the context is explicitly fixed-size (email, print, fixed widget).
- Vendor prefixes for Stable features.
- Animating layout properties (`width`, `height`, `top`, `left`, `margin`, `padding`, `font-size`).
- Unnecessary wrapper elements introduced only to enable styling.
- The legacy masonry syntax (`grid-template-rows: masonry`, `grid-template-columns: masonry`, `masonry-auto-flow`). `display: grid-lanes` superseded it and Firefox 159 removed it — see [rules-layout.md](rules-layout.md) Grid vs Flexbox vs Flow.
- A JS scroll listener recalculating styles on every frame **where the CSS replacement is available for the resolved profile**. Scroll-driven animations (`animation-timeline`) are Emerging, so this covers a scroll-linked *animation* (progress bar, reveal-on-scroll, parallax) on a profile where `scroll_driven_animations` is `true` or `optional`. That is `modern`, and `evergreen` when the effect is decorative and its unenhanced state is the finished state — see [rules-advanced.md](rules-advanced.md) Scroll-Driven Animations. It does not cover `enterprise`/`legacy`. It also does not cover a listener that toggles *sticky/snapped state* classes: their replacement, `@container scroll-state()`, is Experimental and Chromium only. Flag that JS only when the project has explicitly opted into the feature. Otherwise the listener is the correct implementation and must not be reported.
- `z-index` escalation (`z-index: 9999` and successors) for overlay content that belongs in the top layer (`<dialog>`, `[popover]`) — see [rules-interaction.md](rules-interaction.md).
- A JavaScript positioning library for anchored overlays (tooltips, menus, comboboxes) on a profile where the `anchor_positioning` capability is `true` or `optional` — see [rules-advanced.md](rules-advanced.md) Anchor Positioning.

## Exceptions

- Required: every exception is explicitly requested by the user or documented with a comment at the use site stating the reason.
- An undocumented exception is a violation, regardless of intent.
