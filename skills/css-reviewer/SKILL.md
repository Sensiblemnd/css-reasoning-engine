---
name: css-reviewer
description: Deterministic audit workflow for reviewing existing CSS. Use whenever reviewing, auditing, or critiquing stylesheets or CSS in a pull request, checking CSS quality, or when asked to find problems in CSS code. Produces structured findings (Issue / Severity / Location / Problem / Why / Fix / Example) covering architecture, modern-CSS usage, accessibility, and performance against a configurable browser profile. For writing new CSS use css-engineer; for applying modernization use css-refactor.
metadata:
  version: 2.1.0
  priority: high
---

# CSS Reviewer

This skill audits existing CSS. It reports findings; it does not rewrite code (route rewrite requests to css-refactor).

# Review Workflow

Required order:

1. Resolve the browser profile (explicit instruction → project config → default `evergreen`) per [browser-profiles.md](../shared/references/browser-profiles.md). Every finding must be valid for that profile.
2. Load [prohibited-patterns.md](../shared/references/prohibited-patterns.md) — every occurrence is a finding.
3. Load the topic reference for each area the CSS under review touches ([rules-architecture.md](../shared/references/rules-architecture.md), [rules-layout.md](../shared/references/rules-layout.md), [rules-color-typography.md](../shared/references/rules-color-typography.md), [rules-a11y-performance.md](../shared/references/rules-a11y-performance.md), [rules-forms.md](../shared/references/rules-forms.md), [rules-advanced.md](../shared/references/rules-advanced.md)).
4. Audit the four categories below.
5. Emit findings in the Required output format, ordered by severity.

# Audit Categories

## Architecture

Check for:
- Missing cascade layers / unlayered rules
- Excessive specificity (> (0,2,0) in components, ID selectors, `!important`)
- Duplicate styles that an existing token, utility, or component already provides
- Poor component boundaries (cross-component descendant selectors, global tag styling in components)
- Missing tokens (hardcoded colors, spacing, radius, shadow, z-index)

## Modern CSS

Check for:
- Fixed-width-only layouts (no fluid sizing, no media/container query) that break or overflow between narrow and wide viewports — responsive behavior is a required baseline, not an opt-in; flag its absence even if the task/PR never mentions responsiveness
- Replaced elements (img/video/iframe) without `max-inline-size: 100%` or fixed `block-size` instead of `aspect-ratio` — likely to overflow or distort at other sizes
- Nested grids with track definitions duplicated from a parent grid → `subgrid` finding
- Bare `vh` on mobile-affected full/bounded-viewport heights with no `dvh` counterpart — flag even if the diff/task doesn't mention mobile
- Elements anchored to a physical viewport edge (fixed header/bottom bar, edge FAB, fullscreen modal/sheet) missing `env(safe-area-inset-*)` padding
- `env(safe-area-inset-*)` wrapped in `@supports` with a separate base rule instead of using the function's own fallback argument
- Media queries where the behavior depends on component space → container query finding
- `min-width`/`max-width` prefixed media/container query syntax where range comparison syntax (`width < 60rem`) applies for the resolved profile (all but `legacy`)
- Physical properties where logical properties apply
- Repetitive selectors that nesting, `:is()`, or `:where()` would collapse
- Breakpoint chains that `clamp()` replaces
- Sass syntax remnants in native CSS
- Native checkbox/radio/range recolored via wrapper `div`s or hidden-input hacks instead of `accent-color`
- Fixed-size context claimed (print, email) but no `@media print` rules (hidden non-printable chrome, `break-inside: avoid`, ink-safe color) provided

## Accessibility

Check for:
- Missing or removed `:focus-visible` handling
- Animations/transitions without `prefers-reduced-motion` guards
- Contrast below WCAG AA; meaning encoded by color alone
- Keyboard traps caused by CSS (hidden focusables, `pointer-events` abuse, visual order diverging from focus order)
- `forced-colors` breakage (shadow/background-only boundaries, `forced-color-adjust: none`)
- Zoom blocking, `px`-locked font sizes
- Form validation styled only via JS-toggled classes where `:user-valid`/`:user-invalid` would work natively, or validation styling with no matching ARIA wiring
- `::placeholder` used as the only labeling mechanism, or placeholder text failing contrast requirements

## Performance

Check for:
- Expensive selectors (universal descendants, chains > 3 compounds, unanchored `:has()`)
- Layout-property animations and `transition: all`
- Excessive animation surface (many simultaneous animated elements, `will-change` as default)
- `transform`/`filter`/`will-change: transform` on an element with `position: fixed` descendants — the new containing block silently breaks the descendant's viewport-relative positioning
- Missing `contain` / `content-visibility` on large independent regions
- Missing `scrollbar-gutter: stable` on containers that toggle between scrollable and non-scrollable, causing layout shift
- Style recalculation triggers (deep inheritance of frequently-changed custom properties)

# Severity Model

| Severity | Meaning |
| -------- | ------- |
| Critical | Accessibility broken or functional risk (focus removed, zoom blocked, contrast failure, keyboard trap) |
| High | Prohibited pattern or architecture violation (unlayered CSS, `!important`, hardcoded values, specificity abuse) |
| Medium | Missed modern-CSS opportunity with maintainability cost (physical properties, breakpoint chains, duplication) |
| Low | Style/consistency issue with no functional impact |

# Required Output Format

One block per finding, exactly this structure:

```
Issue: <one-line name>
Severity: Critical | High | Medium | Low
Location: <file>:<line>
Problem: <what the code does wrong>
Why it matters: <concrete consequence>
Recommended fix: <deterministic instruction>
Example:
  <corrected CSS fragment>
```

Rules:

- Order findings by severity, Critical first.
- Required: every finding cites a real location. Never report a finding you cannot anchor to code.
- Example fragments must themselves pass the prohibited-patterns list.

# Anti-Noise Rules

- Never flag code that is compliant for the resolved profile (e.g., a fallback the `legacy` profile requires).
- Never demand Emerging or Experimental features; their absence is not a finding. Suggest Stable features only.
- Never flag a documented exception (comment at the use site) — verify the justification instead.
- Never restate the same root cause as multiple findings; group repeated instances into one finding with all locations.
- No findings → state explicitly that the CSS passes review for the resolved profile, and name the profile.
