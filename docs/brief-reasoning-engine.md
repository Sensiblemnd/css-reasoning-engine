# Create a CSS Reasoning Engine Agent Skill System

## Role

Act as a:

* Senior frontend platform engineer
* CSS architecture specialist
* Browser standards expert
* AI agent behavior designer
* Design system architect

Your task is to create a set of **AI Agent Skills** that encode CSS engineering judgment.

This is NOT a CSS tutorial.

This is NOT a human style guide.

This is a decision-making framework that teaches AI coding agents how to:

* create CSS
* review CSS
* refactor CSS
* make architecture decisions
* choose the correct browser features
* balance modern CSS with compatibility requirements

The target users are:

* Codex CLI
* Claude Code
* GitHub Copilot
* Cursor
* Gemini CLI
* Cline
* Roo Code
* Windsurf
* Other AI coding agents

---

# Project Goal

Create a CSS Engineering Intelligence System.

The system should combine:

```
CSS Architecture Rules
+
Browser Capability Knowledge
+
Design System Principles
+
Accessibility Standards
+
Performance Guidelines
+
Decision Trees
+
Code Review Rules
```

The goal is not simply:

"Generate CSS."

The goal is:

"Make correct CSS engineering decisions."

---

# Create Three Separate Skills

Create three independent but related agent skills.

```
skills/

├── css-engineer/
│   └── SKILL.md
│
├── css-reviewer/
│   └── SKILL.md
│
└── css-refactor/
    └── SKILL.md
```

---

# Skill 1: CSS Engineer

Purpose:

Generate new CSS following modern engineering standards.

The agent must decide:

* Which layout system to use.
* Which responsive strategy to use.
* Which browser features are appropriate.
* Which tokens should exist.
* How components should be structured.
* How accessibility should be handled.

---

## CSS Engineer Decision Engine

The skill must include decision trees.

Example:

```
Need layout?

Two-dimensional?

YES
→ CSS Grid

NO

One-dimensional alignment?

YES
→ Flexbox

NO

→ Normal Flow
```

---

Example:

```
Need responsive behavior?

Whole page?

YES
→ Media Query

Component?

YES
→ Container Query
```

---

Example:

```
Need spacing?

Existing token?

YES
→ Use token

NO
→ Create semantic token

Never hardcode random values
```

---

# Skill 2: CSS Reviewer

Purpose:

Analyze existing CSS and identify problems.

The reviewer should check:

## Architecture

* Missing Cascade Layers
* Excessive specificity
* Duplicate styles
* Poor component boundaries
* Missing tokens

## Modern CSS

* Missing container queries
* Missing logical properties
* Missing nesting opportunities
* Incorrect responsive strategies

## Accessibility

Check:

* focus-visible
* reduced motion
* contrast
* keyboard accessibility
* forced colors

## Performance

Check:

* expensive selectors
* unnecessary reflows
* transition: all
* excessive animations
* unnecessary DOM styling

---

The reviewer output should be structured:

```
Issue

Severity

Location

Problem

Why it matters

Recommended fix

Example
```

---

# Skill 3: CSS Refactor

Purpose:

Modernize existing CSS without changing functionality.

The refactor skill should:

* Preserve visual behavior.
* Preserve browser compatibility.
* Reduce complexity.
* Improve maintainability.

Examples:

Convert:

```css
.button {
 margin-left:20px;
 color:#333;
}
```

Into:

```css
.button {
 margin-inline-start:var(--space-4);
 color:var(--color-text);
}
```

---

# CSS Philosophy

All skills must enforce:

1. Native CSS first.
2. Avoid unnecessary JavaScript.
3. Use browser capabilities.
4. Prefer semantic tokens.
5. Prefer composition over specificity.
6. Accessibility by default.
7. Performance matters.
8. Progressive enhancement.
9. The cascade is a feature.
10. Simpler CSS is better CSS.

---

# Browser Capability System

Do not assume one browser target.

Create profiles.

Example:

```yaml
profiles:

modern:
  fallback_strategy: none

evergreen:
  fallback_strategy: minimal

enterprise:
  fallback_strategy: progressive

legacy:
  fallback_strategy: extensive
```

---

# Feature Capability Matrix

The system should reason using capabilities.

Example:

```yaml
features:

cascade_layers:
  status: stable

container_queries:
  status: stable

css_nesting:
  status: stable

scope:
  status: stable

has_selector:
  status: stable

light_dark:
  status: stable

color_mix:
  status: stable

oklch:
  status: stable

view_transitions:
  status: emerging

anchor_positioning:
  status: experimental
```

---

# @supports Strategy

Rules:

Use `@supports` only when needed.

Never generate unnecessary feature queries.

Preferred:

```css
.card {
 display:block;
}

@supports(display:grid){

.card{
 display:grid;
}

}
```

Avoid:

```css
@supports(display:flex){

display:flex;

}
```

when flexbox is guaranteed.

---

# Modern CSS Knowledge Base

The system must include rules for:

## Architecture

* Cascade Layers
* Imports
* Specificity management
* Component isolation

## Selectors

* :has()
* :is()
* :where()
* :not()

## Scoping

* @scope

## Layout

* Grid
* Flexbox
* Gap
* Container Queries
* Container Units

## Typography

* clamp()
* fluid sizing
* text-wrap balance
* text-wrap pretty

## Colors

* light-dark()
* OKLCH
* color-mix()
* semantic color tokens

## Advanced CSS

* @property
* custom functions
* view transitions
* @starting-style
* anchor positioning

---

# Accessibility Requirements

Never generate CSS that:

* removes focus indicators
* disables zoom
* relies only on color
* ignores reduced motion

Always consider:

* :focus-visible
* prefers-reduced-motion
* prefers-contrast
* forced-colors

---

# Performance Requirements

Avoid:

* deep selectors
* excessive nesting
* unnecessary DOM dependencies
* transition: all
* layout-triggering animations

Prefer:

* transform
* opacity
* contain
* content-visibility

---

# Required Prohibited Patterns

Never generate:

* !important
* ID selectors
* inline styles
* hardcoded colors
* hardcoded spacing
* magic numbers
* Sass-only syntax
* unnecessary wrappers
* duplicated CSS

Exceptions must be explicitly justified.

---

# Agent Self-Validation

Before returning CSS, verify:

```
Architecture:

✓ Layers considered
✓ Tokens used
✓ Specificity controlled


Responsive:

✓ Container queries considered
✓ Media queries used appropriately


Modern CSS:

✓ Logical properties
✓ Nesting
✓ Modern selectors


Accessibility:

✓ Focus handling
✓ Motion handling
✓ Contrast


Performance:

✓ Efficient selectors
✓ Efficient animations


Compatibility:

✓ Browser profile checked
✓ @supports considered
✓ Progressive enhancement applied
```

---

# Final Output Requirements

The final deliverable should be:

* Markdown based
* Versioned
* Modular
* Deterministic
* Optimized for AI agents

It should behave like:

```
ESLint
+
CSS Architecture Guide
+
Browser Capability Matrix
+
AI Reasoning System
```

The objective is to create an AI CSS engineer, not a CSS reference manual.
