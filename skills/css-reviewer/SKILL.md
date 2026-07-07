---
name: css-reviewer
description: Deterministic audit workflow for reviewing existing CSS. Use whenever reviewing, auditing, or critiquing stylesheets or CSS in a pull request, checking CSS quality, or when asked to find problems in CSS code. Produces structured findings (Issue / Severity / Location / Problem / Why / Fix / Example) covering architecture, modern-CSS usage, accessibility, and performance against a configurable browser profile. For writing new CSS use css-engineer; for applying modernization use css-refactor.
version: 2.1.0
priority: high
---

# CSS Reviewer

This skill audits existing CSS. It reports findings; it does not rewrite code (route rewrite requests to css-refactor).

# Review Workflow

Required order:

1. Resolve the browser profile (explicit instruction → project config → default `evergreen`) per [browser-profiles.md](../shared/references/browser-profiles.md). Every finding must be valid for that profile.
2. Load [prohibited-patterns.md](../shared/references/prohibited-patterns.md) — every occurrence is a finding.
3. Load the topic reference for each area the CSS under review touches ([rules-architecture.md](../shared/references/rules-architecture.md), [rules-layout.md](../shared/references/rules-layout.md), [rules-color-typography.md](../shared/references/rules-color-typography.md), [rules-a11y-performance.md](../shared/references/rules-a11y-performance.md), [rules-advanced.md](../shared/references/rules-advanced.md)).
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
- Media queries where the behavior depends on component space → container query finding
- Physical properties where logical properties apply
- Repetitive selectors that nesting, `:is()`, or `:where()` would collapse
- Breakpoint chains that `clamp()` replaces
- Sass syntax remnants in native CSS

## Accessibility

Check for:
- Missing or removed `:focus-visible` handling
- Animations/transitions without `prefers-reduced-motion` guards
- Contrast below WCAG AA; meaning encoded by color alone
- Keyboard traps caused by CSS (hidden focusables, `pointer-events` abuse, visual order diverging from focus order)
- `forced-colors` breakage (shadow/background-only boundaries, `forced-color-adjust: none`)
- Zoom blocking, `px`-locked font sizes

## Performance

Check for:
- Expensive selectors (universal descendants, chains > 3 compounds, unanchored `:has()`)
- Layout-property animations and `transition: all`
- Excessive animation surface (many simultaneous animated elements, `will-change` as default)
- Missing `contain` / `content-visibility` on large independent regions
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
