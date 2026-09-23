# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

A collection of Claude Agent Skills that give AI coding assistants CSS engineering judgment. The skills are deterministic rule systems (closer to an ESLint config or an architecture RFC than a tutorial), not example code to imitate. There is no build step — the repository's output *is* the skill definitions plus a static marketing/docs site.

There is a test suite: `./tests/run.sh` self-tests the rule linter and then gates `docs/styles.css` and every ```` ```css ```` example inside `skills/**/*.md` against it. It is zero-dependency (Node, no `package.json`, no install). Run it after changing `docs/styles.css`, `tests/`, or any code example in a skill file. Anti-examples must sit under an `Avoid:` / `Never:` / `Before:` line (or `<!-- lint-skip: reason -->`) or the suite fails. See `tests/README.md`.

## Working conventions

Use the plain Read/Edit/Write tools for file changes in this repo, not shell one-liners (`sed`, `perl -pi`, `awk`, etc.) — even for simple find/replace across a file. Prefer `Edit` with `replace_all: true` over a scripted substitution.

Never run git commands (`add`, `commit`, `push`, etc.) in this repo unless the user explicitly asks for that specific command. Draft commit messages when asked, but leave staging and committing to the user unless told otherwise.

## Repository structure

```
skills/
├── shared/references/     # single source of truth for all rules, loaded on demand
│   ├── browser-profiles.md      # profile resolution, capability map, @supports rules
│   ├── prohibited-patterns.md   # canonical never-generate list, with per-role handling
│   ├── rules-architecture.md    # cascade layers, imports, component boundaries, specificity, nesting, @scope
│   ├── rules-layout.md          # Grid/Flexbox, logical properties, container queries, viewport units
│   ├── rules-color-typography.md # tokens, OKLCH, light-dark(), color-mix(), clamp(), text-wrap
│   ├── rules-a11y-performance.md # focus, pointer/touch, motion, contrast, forced-colors, containment, animation cost
│   ├── rules-forms.md           # validation states, native control color, labels/placeholder
│   ├── rules-interaction.md     # scroll snap, overlays/top layer, :open, ::details-content, scroll-state, carousels
│   └── rules-advanced.md        # @property, @starting-style, scroll-driven animations, View Transitions, Anchor Positioning
├── css-engineer/SKILL.md  # role: generate new CSS
├── css-reviewer/SKILL.md  # role: audit existing CSS, report structured findings, never rewrite
└── css-refactor/SKILL.md  # role: modernize CSS without changing rendering
docs/           # static GitHub Pages site (index.html + styles.css), no build step
planning/       # original project briefs, not part of the published site
tests/          # zero-dependency linter for the mechanically checkable rules
├── lint.mjs        # rule engine + CLI (--self-test, --list-rules)
├── run.sh          # self-test, then gate repo stylesheets and skill examples
└── fixtures/       # compliant.css (must be clean) + violations.css (annotated)
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
