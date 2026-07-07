# Create a Native CSS Engineering Agent Skill

## Role

Act as a:

* CSS Working Group specification author
* Browser rendering engineer
* Design system architect
* Frontend platform engineer
* AI agent behavior designer

Your task is to create an **Agent Skill specification** for generating and reviewing modern CSS.

This is NOT a CSS tutorial.

This is NOT documentation for humans.

This is a deterministic rule system that teaches AI coding agents how to write, refactor, and review CSS.

The primary users are:

* Codex CLI
* Claude Code
* GitHub Copilot
* Cursor
* Gemini CLI
* Cline
* Roo Code
* Windsurf
* Other AI coding assistants

---

# Core Objective

Create a CSS engineering skill that produces CSS which is:

* Native CSS first
* Accessible by default
* Performant
* Maintainable
* Component-oriented
* Progressive-enhancement friendly
* Browser-aware
* Design-system compatible
* Future-friendly

The skill should behave like:

* an ESLint configuration
* a compiler specification
* a CSS architecture RFC
* a code review checklist

It should not behave like:

* a tutorial
* a blog post
* a CSS introduction

---

# Writing Rules

Use deterministic language.

Prefer:

* Always
* Never
* Prefer
* Avoid
* Required
* Allowed
* Exception

Avoid:

* "You may want to"
* "Consider"
* "It is recommended"
* Long explanations

Every rule must be:

* actionable
* testable
* enforceable

---

# Document Format

Use this structure:

```md
---
name: modern-css-engineering
description: Deterministic rules for generating modern native CSS.
version: 2.0.0
priority: high
---

# Philosophy

# Browser Compatibility Policy

# Decision Engine

# Rules

# Prohibited Patterns

# Self Review Checklist
```

---

# CSS Philosophy

The skill must enforce these principles:

1. Native CSS over JavaScript.
2. Browser features over preprocessors.
3. Composition over specificity.
4. Semantic tokens over literal values.
5. Components over global selectors.
6. Accessibility is mandatory.
7. Performance is part of correctness.
8. Progressive enhancement by default.
9. The cascade is a feature.
10. Prefer simple CSS over clever CSS.

---

# Browser Compatibility System

The skill MUST include browser compatibility controls.

Do not assume all projects target the same browsers.

Create configurable browser profiles.

Example:

```yaml
browser_profiles:

modern:
  fallbacks: none

evergreen:
  fallbacks: minimal

enterprise:
  fallbacks: progressive

legacy:
  fallbacks: extensive
```

---

# Capability-Based Feature Detection

Do not hardcode browser versions throughout rules.

Use feature capabilities.

Example:

```yaml
capabilities:

cascade_layers: true
nesting: true
container_queries: true
scope: true
has_selector: true
light_dark: true
color_mix: true
oklch: true
property_registration: true

view_transitions: optional
anchor_positioning: experimental
custom_functions: experimental
```

The agent should reason from capabilities.

---

# Feature Stability Levels

Every CSS feature must have a maturity level.

## Stable

Generate normally.

Examples:

* Cascade Layers
* Flexbox
* Grid
* clamp()
* Container Queries
* CSS Nesting
* :has()
* :is()
* :where()
* light-dark()
* color-mix()
* OKLCH
* @property

---

## Emerging

Generate only when supported.

Examples:

* View Transitions
* Anchor Positioning
* Custom CSS Functions

---

## Experimental

Never generate unless explicitly requested.

---

# @supports Rules

## Rule

Use `@supports` only when compatibility requirements require progressive enhancement.

Priority:

HIGH

---

Preferred:

```css
.card {
  display: block;
}

@supports (display: grid) {
  .card {
    display: grid;
  }
}
```

---

Avoid:

```css
@supports (display: flex) {
  .button {
    display:flex;
  }
}
```

when flexbox is already guaranteed.

---

Agent behavior:

* Do not add unnecessary feature queries.
* Do not wrap universally supported features.
* Use progressive enhancement when fallback behavior exists.
* Prefer graceful degradation.

---

# Decision Engine

The skill must include decision trees.

---

## Layout Decision

Question:

Need layout?

Two-dimensional placement?

YES:

Use Grid.

NO:

Need alignment in one axis?

YES:

Use Flexbox.

NO:

Use normal document flow.

---

## Responsive Decision

Need responsive behavior?

Entire page structure?

YES:

Use Media Queries.

Component behavior?

YES:

Use Container Queries.

---

## Spacing Decision

Need spacing?

Existing design token?

YES:

Use token.

NO:

Create semantic token.

Never create random values.

---

# Required CSS Architecture

Enforce:

```
reset
tokens
base
layout
components
utilities
overrides
```

Use Cascade Layers.

Example:

```css
@layer reset, tokens, base, layout, components, utilities, overrides;
```

Never generate unlayered CSS unless explicitly requested.

---

# Required Modern CSS Features

The skill must include rules for:

## Architecture

* Cascade Layers
* CSS Imports
* Component boundaries
* Specificity control

## Tokens

* Colors
* Typography
* Spacing
* Radius
* Shadows
* Z-index

## Responsive

* Container Queries
* Container Units
* Media Queries
* dvh
* svh
* lvh

## Selectors

* :has()
* :is()
* :where()
* :not()

## Scoping

* @scope

## Typography

* clamp()
* text-wrap
* text-wrap: balance
* text-wrap: pretty
* overflow-wrap
* hyphens

## Color

* light-dark()
* OKLCH
* color-mix()
* relative colors

## Advanced CSS

* @property
* CSS custom functions
* View Transitions
* @starting-style
* Anchor Positioning

---

# Required Accessibility Rules

Always enforce:

* :focus-visible
* prefers-reduced-motion
* prefers-contrast
* forced-colors support
* readable contrast
* zoom support
* semantic HTML compatibility

Never:

* remove focus indicators
* disable user zoom
* rely only on color

---

# Required Performance Rules

Avoid:

* deep selectors
* expensive selectors
* unnecessary reflows
* transition: all

Prefer:

* transform animations
* opacity animations
* contain
* content-visibility
* efficient selectors

---

# Required Layout Rules

Prefer:

```css
margin-inline
margin-block

padding-inline
padding-block

inline-size
block-size

inset-inline
inset-block
```

Avoid:

```css
margin-left
margin-right
padding-left
padding-right
width
height
```

unless required.

---

# Native CSS Nesting Rules

Allow:

```css
.card {

  &:hover {

  }

  img {

  }

}
```

Rules:

* Maximum nesting depth: 3 levels.
* Never use Sass string concatenation.
* Avoid unnecessary nesting.

Never generate:

```css
.button {

  &-icon {}

}
```

---

# Prohibited Patterns

Never generate:

* !important
* ID selectors
* Inline styles
* Hardcoded colors
* Hardcoded spacing
* Magic numbers
* transition: all
* Sass syntax
* Deep selector chains
* Duplicate styles
* Unlayered CSS
* Excessive specificity
* Unnecessary media queries
* Removing accessibility features

Exceptions must be explicitly documented.

---

# Final Agent Validation Checklist

Before producing CSS, verify:

Architecture:

* Cascade Layers used
* Tokens used
* Specificity controlled

Modern CSS:

* Container Queries considered
* Logical properties used
* Nesting used appropriately
* Modern selectors considered

Typography:

* clamp() considered
* Text wrapping considered

Colors:

* Semantic colors used
* light-dark() considered
* OKLCH preferred

Accessibility:

* focus-visible
* reduced motion
* contrast

Performance:

* No expensive selectors
* No layout abuse

Compatibility:

* Browser profile checked
* @supports used only when needed
* Progressive enhancement applied

Output:

* No prohibited patterns
* CSS is maintainable
* CSS is production ready

---

# Final Requirement

Generate the final Agent Skill as a concise, deterministic Markdown specification.

The output must optimize for AI behavior, not human education.

The result should be suitable as a reusable skill file for modern AI coding agents.
