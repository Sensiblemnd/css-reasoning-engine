# CSS rule linter

A zero-dependency linter for the mechanically checkable subset of the rules in
`skills/shared/references/`. It exists so the rules can be enforced, not just
described, and so `docs/styles.css` cannot silently drift from the skills it
advertises.

```sh
./tests/run.sh                    # self-test, then gate repo stylesheets and skill examples
./tests/run.sh --fast             # self-test only
node tests/lint.mjs path/to.css   # lint arbitrary files
node tests/lint.mjs skills/shared/references/*.md   # lint the css examples in Markdown
node tests/lint.mjs --list-rules  # rule ids and the reference file each enforces
```

Requires Node (no `package.json`, no install step).

## What it does and does not cover

The rules below are chosen for a near-zero false-positive rate. `--list-rules`
is the authoritative list; this table is prose around it.

| Rule | Enforces |
| ---- | -------- |
| `no-unlayered` | every rule lives in a cascade layer |
| `no-important` | `!important` only in the `overrides` layer |
| `no-id-selector` | no ID selectors |
| `no-literal-color` | components reference semantic tokens, not literals |
| `no-physical-property` | logical properties over physical ones |
| `no-transition-all` | never `transition: all` |
| `no-sass-concat` | `&-suffix` is invalid native CSS |
| `max-nesting-depth` | nesting depth ≤ 3 |
| `no-bare-vh` | `dvh`/`svh`/`lvh` for mobile-affected heights |
| `no-prefixed-media-range` | range syntax, not `min-width:`/`max-width:` |
| `no-vendor-prefix` | no prefixes for stable features |
| `no-unanchored-has` | `:has()` anchored to a specific selector |
| `no-forced-color-adjust-none` | never disable forced-colors |
| `no-outline-none` | never remove a focus indicator without replacing it |
| `max-selector-depth` | no deep descendant chains |
| `unregistered-animated-property` | `@property` registration before a custom property is interpolated |
| `no-layout-animation` | no transitioned/`@keyframes`-animated layout properties (`block-size`, `inset-*`, `margin`, …) |
| `no-invalid-supports-guard` | no `@supports` test that is invalid or detects nothing (`at-rule()`, `style()`, `result:`, `anchor-name`) |

`unregistered-animated-property` is the only rule that reads across files:
`@property` registrations are collected from every path in one invocation,
because a component's registrations usually live in a separate tokens file.
Linting a single file in isolation can therefore report a registration that
exists elsewhere — pass the whole set (`node tests/lint.mjs styles/**/*.css`)
when that matters.

It deliberately does **not** check the judgment rules — whether a token is
semantic rather than primitive, whether `@scope` is warranted, whether a
component boundary was violated in spirit, whether contrast passes AA. Those
stay with the `css-reviewer` skill. A clean lint run is a floor, not a pass.

It also does not check browser-profile compliance (is this feature allowed for
the resolved profile?). That needs Baseline data; see "Possible additions".

## Fixtures

`fixtures/violations.css` annotates each construct with the rule ids it should
trigger:

```css
/* expect: no-literal-color */
.literal-color {
  background: #1e40af;
}
```

`--self-test` compares the multiset of annotated ids against actual findings, so
a rule that stops firing (regression) and a rule that fires twice (false
positive) both fail the suite. It also fails if any rule has no fixture
coverage, which forces a fixture entry alongside every new rule.

`fixtures/compliant.css` must produce zero findings. It is the false-positive
guard: everything in it is CSS the `css-engineer` skill should be willing to
emit for the `modern` profile.

Multiset comparison is deliberate — it survives reformatting of the fixture. The
trade-off is that a rule firing the right number of times on the wrong lines is
not caught.

## Skill examples

The ```` ```css ```` blocks inside `skills/**/*.md` are what an AI copies most
faithfully, so `run.sh` lints them too. Passing a `.md` file to `lint.mjs`
extracts every css block, lints each one as its own stylesheet, and reports
findings at the Markdown line.

- **Skipped:** anti-examples — a block whose preceding line starts with
  `Avoid`, `Never`, or `Before`, or a block preceded by
  `<!-- lint-skip: reason -->`.
- **Relaxed:** `no-unlayered` does not apply, because examples are fragments
  that routinely omit the `@layer` wrapper (the `css-engineer` skill states
  emitted CSS must still be layered).

`fixtures/examples.md` self-tests the extraction and skip logic.

## Benchmarks (not run by the suite)

`benchmarks/` holds fixtures that test the **skills** rather than the linter —
judgment the mechanical rules cannot check. Nothing in it runs automatically;
`run.sh` does not touch it. See [benchmarks/README.md](benchmarks/README.md).

`benchmarks/product-card.css` is the LogRocket refactor benchmark: one card with
seven planted pitfalls where the safe refactor is to *not* make the obvious
change. It is also the clearest illustration of why a clean lint run is a floor
— the linter reports 32 findings on it, and acting on the three `no-important`
ones breaks the file.

## Directives

Comments recognised anywhere in a stylesheet:

```css
/* lint-layer-context: components */
```
Declares that the whole file is `@import`-ed into that layer, so `no-unlayered`
and `no-important` resolve correctly for one-file-per-component sheets that have
no `@layer` block of their own.

```css
/* lint-ignore: no-physical-property */
```
Silences the named rules for the next construct (within 3 lines). Use it for the
documented exceptions the reference files already allow — and write a comment
saying which exception applies.

## Adding a rule

1. Add an entry to `RULES` in `lint.mjs` with an `id` and a `doc` naming the
   reference file it enforces.
2. Add a construct to `fixtures/violations.css` with an `expect:` annotation.
   Add the inverse to `fixtures/compliant.css` too when the rule has a near-miss
   that must *not* fire.
3. Add a row to the table above.
4. Run `./tests/run.sh`. The suite fails if the rule has no fixture coverage.
5. Update the rule count in `docs/index.html` (the "Verified" section) — it is
   the one place a hardcoded count is kept, because a number reads better than a
   hedge in marketing copy. Nothing checks it automatically.

Keep the false-positive rate near zero. A linter that cries wolf gets disabled,
and then the rules stop being enforced at all.

## Possible additions

- **Browser-profile compliance.** The highest-value missing check: flag features
  that exceed the resolved profile. Needs Baseline data — the `web-features` npm
  package is the official source that powers webstatus.dev, but adopting it
  means taking a dependency and losing the zero-install property.
- **Computed checks.** Selector specificity ≤ (0,2,0), magic-number detection,
  WCAG AA contrast math on token pairs. Higher value, higher false-positive risk.
- **A stylelint config export**, for editor squiggles, once the rule set settles.
