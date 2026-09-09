# Skill benchmarks

Fixtures that test the **skills**, not the linter.

`../fixtures/` holds mechanical fixtures: `lint.mjs` runs them and `run.sh`
fails on a regression. Nothing here runs automatically. These files test
judgment a linter cannot check — whether `css-refactor` recognises that a
change is *not safe*, which is a decision about the cascade, not a pattern
match. Running one means pointing an agent at the input with the skill loaded
and grading the result against the table below.

This is the other half of the "a clean lint run is a floor, not a pass" claim.
The linter would flag five separate things in `product-card.css` and be
**wrong about four of them** — see "Where the linter disagrees" at the bottom.

## `product-card.css`

Reconstructed from LogRocket's [Can AI tools refactor your
CSS?](https://blog.logrocket.com/ai-tool-refactor-css/), which fed one product
card with seven planted pitfalls to five AI assistants. It is a benchmark, not
a guide: **all five failed trap 1, and four of five failed trap 6.** The file
here is rebuilt from the article's description of each trap, not copied.

It is a good regression test precisely because `css-refactor` already has rules
covering the two failures every tool made. If the skill works, it should not
reproduce them.

### Pass criteria

| # | Trap | Correct behaviour | Covering rule |
| - | ---- | ----------------- | ------------- |
| 1 | Two `box-shadow` declarations on `.card:hover`, the first `!important` and therefore the one that renders | Keep the **tight** shadow (`0 2px 4px`). Delete the soft one as dead code, or report the pair. Emitting the soft shadow is a visual regression | Prime Directive 1 |
| 2 | `.badge` `z-index: 3 !important` over `.card-image-wrap` `z-index: 2` | Treat the pair as one unit. Removing the `!important` is only safe if the stacking result is proven identical; otherwise `follow-up` | Specificity reduction |
| 3 | `#4caf50` (Material 500) vs `#43a047` (Material 600) | Two tokens, not one. Merging is a rendering change | Literals → Semantic tokens |
| 4 | `.promo-active .card .badge` ties `.card .badge.badge-new` at (0,3,0); `!important` breaks the tie | Preserve the winner. Dropping `!important` while flattening the other selector "passes" by accident — grade the reasoning, not the diff | Specificity reduction |
| 5 | `.card-description` repeats two declarations from `.card p` but adds truncation | Deduplicate only the two shared declarations. Deleting `.card p` (it styles other paragraphs) or folding truncation into it are both wrong | Duplication → Composition |
| 6 | `.card .tag`, `.card .card-footer .btn-primary` — generic names, protective scope | Keep the scope. Flattening to `.btn-primary` changes the matched element set | Specificity reduction; Duplication → Composition |
| 7 | `display: -webkit-box` + `-webkit-line-clamp` + `-webkit-box-orient` | Keep all three. They are the interoperable multi-line clamp; dropping them silently removes truncation | Prime Directive 2 |

Also observed in the article, worth grading:

- `opacity: 0.95` dropped from the button hover (three of five tools).
- `.card p` deleted outright (two of five).

### Legitimate changes

A correct pass is not a no-op. These are safe and should appear in the change
list with risk `none`:

- Physical → logical properties (`width` → `inline-size`, `margin-right` →
  `margin-inline-end`, `top`/`left` → `inset-block-start`/`inset-inline-start`).
- `transition: all 0.2s ease` → the properties that actually change
  (`background-color`, `opacity`).
- Literal colours → tokens, **one token per distinct value** (see trap 3).
- Rules moved into cascade layers — provided every competing rule moves in the
  same pass, and traps 1/2/4 still resolve to the same winner afterwards.

`width: 320px` → `inline-size: 320px` is in scope. `width: 320px` →
`max-inline-size: 320px` is **not** — that changes rendering below 320px and
belongs in the change list as a `follow-up`.

### Where the linter helps, and where it misleads

`node tests/lint.mjs tests/benchmarks/product-card.css` reports 32 findings
across five rules:

| Rule | Count | Safe to act on? |
| ---- | ----- | --------------- |
| `no-unlayered` | 12 | Yes — but only if every competing rule moves in the same pass (traps 1, 2, 4 all depend on cascade order) |
| `no-literal-color` | 11 | Yes — one token per distinct value (trap 3) |
| `no-physical-property` | 5 | Yes |
| `no-important` | 3 | **No — two of the three are load-bearing** (traps 1 and 4) |
| `no-transition-all` | 1 | Yes |

The linter stays silent on traps 6 and 7 **by design**, which is the good news:

- `-webkit-line-clamp` and `-webkit-box-orient` are on `ALLOWED_PREFIXES` in
  `lint.mjs`, so the clamp trio is not flagged.
- `.card .card-footer .btn-primary` is three compounds, exactly at
  `max-selector-depth`'s limit, so protective scope is not flagged either.

So the mechanical layer gets six of seven traps right, mostly by not having an
opinion. The one place it actively points the wrong way is `no-important` —
where doing what the linter says breaks traps 1 and 4.

That is the shape of the "floor, not a pass" claim, and it cuts both ways: an
agent that treats a linter finding as a to-do item fails this benchmark, and an
agent that treats a *clean* run as approval never looks at traps 5 or 6 at all.
