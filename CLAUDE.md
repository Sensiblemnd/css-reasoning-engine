# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A collection of Claude Agent Skills that give AI coding assistants CSS engineering judgment. The skills are deterministic rule systems (closer to an ESLint config or an architecture RFC than a tutorial), not example code to imitate. There is no build, lint, or test tooling — the repository's output *is* the skill definitions plus a static marketing/docs site.

## Working conventions

Use the plain Read/Edit/Write tools for file changes in this repo, not shell one-liners (`sed`, `perl -pi`, `awk`, etc.) — even for simple find/replace across a file. Prefer `Edit` with `replace_all: true` over a scripted substitution.

## Repository structure

```
skills/
├── shared/references/     # single source of truth for all rules, loaded on demand
│   ├── browser-profiles.md      # profile resolution, capability map, @supports rules
│   ├── prohibited-patterns.md   # canonical never-generate list, with per-role handling
│   ├── rules-architecture.md    # cascade layers, imports, component boundaries, specificity, nesting, @scope
│   ├── rules-layout.md          # Grid/Flexbox, logical properties, container queries, viewport units
│   ├── rules-color-typography.md # tokens, OKLCH, light-dark(), color-mix(), clamp(), text-wrap
│   ├── rules-a11y-performance.md # focus, motion, contrast, forced-colors, containment, animation cost
│   └── rules-advanced.md        # @property, @starting-style, View Transitions, Anchor Positioning
├── css-engineer/SKILL.md  # role: generate new CSS
├── css-reviewer/SKILL.md  # role: audit existing CSS, report structured findings, never rewrite
└── css-refactor/SKILL.md  # role: modernize CSS without changing rendering
docs/           # static GitHub Pages site (index.html + styles.css), no build step
planning/       # original project briefs, not part of the published site
```

All three skills route into the same `skills/shared/references/` files so the rules cannot drift between generating, reviewing, and refactoring. When editing any rule, update it in `shared/references/` — never fork a rule into a single skill's own `SKILL.md`.

## Working on `docs/`

`docs/index.html` and `docs/styles.css` are a hand-authored static site published via GitHub Pages (source: `main` branch, `/docs` folder; `docs/.nojekyll` disables Jekyll processing). There is no bundler — edit the files directly and open `docs/index.html` in a browser (e.g. a local static server or the VS Code Live Server extension) to preview.

Any CSS written for `docs/styles.css` must itself comply with the `css-engineer` skill's rules (cascade layers in the order `reset, tokens, base, layout, components, utilities, overrides`; semantic design tokens; logical properties; `:where()`-wrapped or classed selectors instead of bare tag selectors inside components — see `skills/shared/references/rules-architecture.md`'s Component Boundaries section). The site's resolved browser profile is `modern` (it exists to showcase current native CSS, so no `@supports` fallbacks for Stable features). Read `skills/shared/references/prohibited-patterns.md` before editing this stylesheet — it is easy to accidentally violate the very rules the skill exists to enforce.

## Skill authoring conventions

- `css-engineer`: never emits any pattern in `prohibited-patterns.md`; every generated rule lives in a cascade layer; components reference semantic tokens only, never primitives or literals.
- `css-reviewer`: audit-only, structured output (`Issue / Severity / Location / Problem / Why it matters / Recommended fix / Example`), never rewrites code — route rewrite requests to `css-refactor`.
- `css-refactor`: must preserve rendering and browser compatibility exactly; a change that doesn't reduce complexity is not a refactor and should be skipped; every transformation is reported in a change list with a risk rating (`none` / `low` / `follow-up`).
- Browser profile resolution order (used by all three skills): explicit user instruction → project config (`browserslist`/`.browserslistrc`/`baseline`) → default `evergreen`.

## Installation model (for users of the skills, not this repo's own tooling)

Skills are consumed by symlinking `skills/css-engineer`, `skills/css-reviewer`, `skills/css-refactor`, and `skills/shared` into a target project's `.claude/skills/` (or a global `~/.claude/skills/`), as documented in `README.md`. The `../shared/references/` relative paths mean `shared/` must be installed alongside every role skill.
