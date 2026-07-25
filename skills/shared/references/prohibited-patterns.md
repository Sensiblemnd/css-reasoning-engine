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
- ID selectors for styling.
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

## Exceptions

- Required: every exception is explicitly requested by the user or documented with a comment at the use site stating the reason.
- An undocumented exception is a violation, regardless of intent.
