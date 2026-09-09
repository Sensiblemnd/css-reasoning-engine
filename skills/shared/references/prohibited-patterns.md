# Prohibited Patterns — Canonical List

Priority: HIGH. This list applies to every CSS task. Role application:

| Role | Behavior |
| ---- | -------- |
| css-engineer | Never emit any pattern below. |
| css-reviewer | Flag every occurrence: severity High; Critical when accessibility is harmed. |
| css-refactor | Eliminate every occurrence unless removal changes behavior — then report it as a follow-up. |

## The List

Never generate, accept, or leave in place:

- `!important` — Exception: overriding third-party inline styles, in the `overrides` layer only, with a comment.
- ID selectors for styling. Exception: an id referenced because the *platform* keys behavior to it, not to raise specificity — `:has(#section:target)`, where `:target` is defined against the URL fragment and no class can express it. A styling hook that happens to be an id is not covered: if the element also carries a class, match the class (`:has(.nav-toggle-input:checked)`, never `:has(#nav-toggle:checked)`).
- Inline `style` attributes.
- Hardcoded colors in components (hex, `rgb()`, named colors) — semantic tokens only.
- Hardcoded spacing / magic numbers — semantic tokens only.
- `transition: all`.
- Sass/Less syntax in native CSS (`$vars`, `@mixin`, `@extend`, `&-suffix` concatenation).
- Unlayered CSS (style rules outside `@layer`).
- Selector chains deeper than 3 compound selectors.
- Descendant selectors crossing component boundaries.
- Duplicate declarations already provided by an existing token, utility, or component.
- `outline: none` / removed focus indicators without a `:focus-visible` replacement.
- `user-scalable=no` or any zoom-blocking technique.
- Meaning encoded by color alone.
- Media queries that duplicate what a container query or `clamp()` already solves.
- `@supports`-guarded base rule + enhancement for `env(safe-area-inset-*)` when the function's own fallback argument (`env(safe-area-inset-bottom, 0px)`) already covers the unsupported case.
- Fixed-width-only layout containers (e.g., `width: 960px` as the sole sizing rule) that don't reflow across viewport/container sizes — unless the context is explicitly fixed-size (email, print, fixed widget).
- Vendor prefixes for Stable features.
- Animating layout properties (`width`, `height`, `top`, `left`, `margin`, `padding`, `font-size`).
- Unnecessary wrapper elements introduced only to enable styling.
- A JS scroll listener recalculating styles on every frame **where the CSS replacement is available for the resolved profile**. Scroll-driven animations (`animation-timeline`) and `@container scroll-state()` are both Experimental — not Baseline, Firefox has shipped neither — so this is not a prohibition on `evergreen` or below. Flag the JS only when the project has explicitly opted into those features; otherwise a scroll listener is the correct implementation and must not be reported as a violation.
- `z-index` escalation (`z-index: 9999` and successors) for overlay content that belongs in the top layer (`<dialog>`, `[popover]`) — see [rules-interaction.md](rules-interaction.md).
- A JavaScript positioning library for anchored overlays (tooltips, menus, comboboxes) on a profile where the `anchor_positioning` capability is `true` or `optional` — see [rules-advanced.md](rules-advanced.md) Anchor Positioning.

## Exceptions

- Required: every exception is explicitly requested by the user or documented with a comment at the use site stating the reason.
- An undocumented exception is a violation, regardless of intent.
