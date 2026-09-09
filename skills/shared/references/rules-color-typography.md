# Color and Typography Rules: Tokens, OKLCH, light-dark(), clamp(), text-wrap, contrast-color(), text-box-trim

## Token System

Priority: HIGH

Required: tokens live in the `tokens` layer as custom properties. Two tiers:

- **Primitive tokens** — raw scale values (`--blue-600`, `--size-4`). Used only by semantic tokens.
- **Semantic tokens** — meaning-carrying names (`--color-surface`, `--space-m`, `--radius-card`). The only tier components may reference.

Required token categories: color, spacing, typography scale, radius, shadow, z-index.

```css
@layer tokens {
  :root {
    /* primitives */
    --blue-600: oklch(55% 0.18 255);

    /* semantic */
    --color-accent: var(--blue-600);
    --color-surface: light-dark(oklch(99% 0 0), oklch(20% 0.02 255));
    --space-s: 0.5rem;
    --space-m: 1rem;
    --radius-card: 0.75rem;
    --shadow-raised: 0 2px 8px oklch(20% 0.02 255 / 0.15);
    --z-modal: 100;
  }
}
```

Rules:

- Components reference semantic tokens only. Never primitives, never literals.
- Missing token → create the semantic token in `tokens`, then use it. Never inline the value "temporarily".
- Never create a new token when an existing one carries the same meaning.

## Color Definition

Priority: HIGH

- Required: OKLCH for all authored color values — perceptually uniform lightness across hues.
- Required: `light-dark()` for scheme-dependent colors, with `color-scheme: light dark` set on `:root`. Never duplicate whole rule blocks per scheme when `light-dark()` suffices. Exception: profiles where the capability is `false` — use the `prefers-color-scheme` media query with custom-property swaps.
- Prefer `color-mix()` for derived states (hover, disabled, tint) over new literal values:

```css
.button:hover {
  background: color-mix(in oklch, var(--color-accent), black 12%);
}
```

- Prefer relative color syntax for systematic derivation when the capability is confirmed:

```css
--color-accent-muted: oklch(from var(--color-accent) l calc(c * 0.5) h);
```

Avoid:

```css
.button:hover {
  background: #1e40af; /* hardcoded, unrelated to the token it darkens */
}
```

### `contrast-color()` — Stability: Emerging

Priority: LOW — direct on `modern`; `@supports`-gated progressive enhancement on `evergreen`; unavailable on `enterprise`/`legacy`.

`contrast-color()` returns a browser-evaluated black or white companion for a base color, for the case a semantic token pair can't cover: an accent color that's user- or CMS-supplied at render time, where no design-time token pairing exists to hand-author against. Prefer the manual token-pairing rule in Contrast below whenever the color is known at author time — `contrast-color()` is the fallback for the case it isn't, not a replacement for designing paired tokens.

```css
@supports (color: contrast-color(red)) {
  @layer components {
    .badge {
      background: var(--color-user-accent);
      color: contrast-color(var(--color-user-accent));
    }
  }
}
```

## Fluid Typography and Spacing

Priority: HIGH

- Required: `clamp()` for values that scale between viewport/container sizes. Never a chain of breakpoint overrides for one scaling value.

Preferred:

```css
@layer tokens {
  :root {
    --text-xl: clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem);
  }
}
```

Avoid:

```css
h1 { font-size: 24px; }
@media (min-width: 768px) { h1 { font-size: 30px; } }
@media (min-width: 1200px) { h1 { font-size: 36px; } }
```

Rules:

- Required: `rem`-based bounds in `clamp()` so zoom and user font-size settings scale the result.
- Never a `px`-only fluid expression — it breaks user font scaling.

## Text Wrapping

Priority: MEDIUM

- Required in `base`: `text-wrap: balance` on headings; `text-wrap: pretty` on body copy.
- Required on user-generated or unknown content: `overflow-wrap: break-word`.
- Prefer `hyphens: auto` for narrow columns of justified or long-word text; requires a correct `lang` attribute.

```css
@layer base {
  :is(h1, h2, h3, h4) {
    text-wrap: balance;
  }

  :is(p, li) {
    text-wrap: pretty;
  }
}
```

### `text-box-trim` / `text-box-edge` — Stability: Emerging

Priority: LOW — direct on `modern`; `@supports`-gated progressive enhancement on `evergreen`; unavailable on `enterprise`/`legacy`.

Prefer `text-box-trim` + `text-box-edge` for optical centering of headings and button labels — trimming the leading/trailing half-leading that font metrics otherwise add above a capital letter and below a baseline — instead of a hand-tuned negative margin guessed per typeface.

```css
@supports (text-box-trim: trim-both) {
  @layer components {
    .button {
      text-box-trim: trim-both;
      text-box-edge: cap alphabetic;
    }
  }
}
```

## Contrast

Priority: HIGH

- Required: text/background token pairs meet WCAG AA (4.5:1 body, 3:1 large text/UI).
- Never encode meaning with color alone — pair with an icon, text, or border change.
- Prefer defining paired tokens (`--color-surface` + `--color-on-surface`) so contrast is designed once, not per component.
