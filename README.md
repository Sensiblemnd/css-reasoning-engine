# CSS Skills

A collection of Agent Skills that give AI coding assistants CSS engineering judgment. Skills are deterministic rule systems — closer to an ESLint config or an architecture RFC than a tutorial.

## Skills

| Skill | Role | Description |
| ----- | ---- | ----------- |
| [css-engineer](skills/css-engineer/SKILL.md) | Generate | Write new modern native CSS: decision engine for layout/responsive/color/animation/scoping/overlay choices, cascade layers, tokens, logical properties, forms, print, mobile viewport, subgrid, self-review checklist. |
| [css-reviewer](skills/css-reviewer/SKILL.md) | Audit | Review existing CSS and report structured findings (Issue / Severity / Location / Problem / Why / Fix / Example) across architecture, modern CSS, accessibility, and performance, routed through the same topic→file table the engineer uses. |
| [css-refactor](skills/css-refactor/SKILL.md) | Modernize | Refactor existing CSS without changing rendering: literals→tokens, physical→logical, Sass→native, unlayered→layered, JS effects→native CSS (anchor positioning, `field-sizing`, top layer), with cascade-safety verification and a risk-rated change list. |

All three route into one shared knowledge base, so the rules cannot drift between roles.

## Structure

```
skills/
├── shared/
│   └── references/                # single source of truth, loaded on demand
│       ├── browser-profiles.md    # profiles, capability map, stability, @supports
│       ├── prohibited-patterns.md # canonical never-generate list + per-role handling
│       ├── rules-architecture.md
│       ├── rules-layout.md
│       ├── rules-color-typography.md
│       ├── rules-a11y-performance.md
│       ├── rules-forms.md
│       ├── rules-advanced.md
│       └── rules-interaction.md
├── css-engineer/SKILL.md
├── css-reviewer/SKILL.md
└── css-refactor/SKILL.md
tests/                             # zero-dependency linter for the rules
├── lint.mjs                       # rule engine + CLI
├── run.sh                         # self-test, then gate repo stylesheets
├── README.md
└── fixtures/                      # compliant.css + annotated violations.css
docs/                              # static GitHub Pages site, no build step
.github/workflows/lint.yml         # runs tests/run.sh on push and PR
```

Each SKILL.md is a lean core (philosophy, workflow, checklists) that references `../shared/references/` for topic rules.

## Tests

The mechanically checkable subset of the rules is enforced by a zero-dependency linter, so the rules are executable and not just documentation:

```sh
./tests/run.sh                    # self-test the linter, then gate docs/styles.css
node tests/lint.mjs path/to.css   # lint any stylesheet
node tests/lint.mjs --list-rules  # every rule and what it enforces
```

Requires Node; there is no `package.json` and no install step. It also runs in CI on every push and pull request ([.github/workflows/lint.yml](.github/workflows/lint.yml)).

A clean run is a floor, not a pass — judgment rules (token semantics, `@scope` suitability, contrast, profile compliance) stay with `css-reviewer`. See [tests/README.md](tests/README.md).

## Installation

### Claude Code

Copy or symlink all skill directories **and** `shared/` into your skills folder — the role skills resolve rules via `../shared/references/`:

```bash
# per project
cp -r skills/css-engineer skills/css-reviewer skills/css-refactor skills/shared .claude/skills/

# or globally, via symlinks (stay in sync with this repo)
ln -s "$PWD"/skills/css-engineer "$PWD"/skills/css-reviewer "$PWD"/skills/css-refactor "$PWD"/skills/shared ~/.claude/skills/
```

The right skill activates automatically: "style a card" → css-engineer, "review this CSS" → css-reviewer, "modernize this stylesheet" → css-refactor.

### Other agents (Cursor, Copilot, Codex, Windsurf, Cline, …)

- Agents that support the Agent Skills format: point them at the `skills/` directory.
- Agents that use a single rules file (`.cursor/rules`, `AGENTS.md`, `.github/copilot-instructions.md`): concatenate a role skill with the shared rules:

```bash
cat skills/css-engineer/SKILL.md skills/shared/references/*.md > css-rules.md
```

### A note on CLI skill installers (e.g. `npx skills add`)

Tools like [skills.sh](https://skills.sh) install a skill as a single standalone `SKILL.md` file, not the directory it lives in. That breaks these skills: each one resolves its actual rule content through relative links into `../shared/references/`, and a single-file install has no `shared/` to link to. Use the **Claude Code** or **Other agents** instructions above (copy/symlink the whole `skills/` tree, `shared/` included) instead of a single-file CLI installer.

## Configuring browser support

Every skill resolves a browser profile per project before acting: explicit instruction → `browserslist` config → default `evergreen`. Profiles (`modern`, `evergreen`, `enterprise`, `legacy`) and per-feature capabilities are defined in [browser-profiles.md](skills/shared/references/browser-profiles.md) and can be overridden per project.

## License

[MIT](LICENSE)

