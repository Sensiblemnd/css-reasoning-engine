# Forms Rules: Validation States, Native Control Color, Field Sizing, Native Select, Labels

## Validation States

Priority: HIGH

- Required: style constraint-validation feedback with `:user-valid` / `:user-invalid`, not a JS-toggled error class. The pseudo-classes only match after the user has interacted with the field (or attempted submit), so an empty required field never renders as "wrong" before the user has touched it.
- Never rely on bare `:invalid` for interactive feedback — it matches immediately on page load, before the user has typed anything.
- Required: pair validation styling with the field's existing ARIA wiring (`aria-invalid`, `aria-describedby` pointing at the error text). CSS only changes appearance; it cannot announce the error to assistive technology. Flag missing ARIA wiring in the HTML rather than compensating for it in CSS.
- Fallback (profile capability `false`, e.g. `legacy`): gate `:invalid` with `:not(:placeholder-shown)` to approximate "touched" state without JavaScript.

Emit one of these, never both — they are alternatives selected by the resolved profile, not a base rule plus an enhancement. On an engine that supports `:user-invalid`, shipping both means the fallback also matches and wins on specificity ((0,3,0) vs (0,2,0)), reintroducing the "wrong before you've touched it" behavior the first rule exists to avoid.

Profiles where `user_valid_invalid` is `true` (`modern`, `evergreen`, `enterprise`):

```css
@layer components {
  .field:user-invalid {
    border-color: var(--color-danger);
  }
}
```

Profiles where it is `false` (`legacy`) — this rule only:

```css
@layer components {
  /* approximates "touched" without JS; :user-invalid unsupported here */
  .field:not(:placeholder-shown):invalid {
    border-color: var(--color-danger);
  }
}
```

## Native Control Color

Priority: MEDIUM

- Required: `accent-color` for brand-colored checkboxes, radios, range inputs, and progress bars. Never rebuild a native control's states (checked, indeterminate, focus, disabled, `forced-colors`) with `appearance: none` and custom pseudo-elements just to change its color.
- `appearance: none` plus custom markup is justified only when the required visual differs structurally from anything a native control can render (a multi-thumb range, a switch with an internal label) — document the reason at the use site.
- `accent-color` respects `forced-colors: active` automatically, since it maps onto the control's native rendering; a hand-rolled replacement has to reimplement that itself (see [rules-a11y-performance.md](rules-a11y-performance.md) Contrast and Forced Colors).

Preferred:

```css
:is(input[type="checkbox"], input[type="radio"], input[type="range"]) {
  accent-color: var(--color-accent);
}
```

Avoid:

```css
input[type="checkbox"] {
  appearance: none;
  /* + custom pseudo-elements reimplementing check/focus/disabled states
     that accent-color already provides */
}
```

- `accent-color` degrades to the browser/OS default automatically where unsupported (profile capability `false`) — no fallback declaration needed.

## Field Sizing — Stability: Emerging

Priority: MEDIUM — direct on `modern`; `@supports`-gated progressive enhancement on `evergreen`; unavailable on `enterprise`/`legacy`.

Required: `field-sizing: content` for a `<textarea>` or `<input>` that should grow with its own content, instead of a JS input-listener autosize (measuring `scrollHeight`, writing it back as an inline `height`). The JS version re-measures on every keystroke and still gets the first paint wrong before the listener attaches; `field-sizing` sizes correctly from the initial render.

```css
@supports (field-sizing: content) {
  @layer components {
    .field-textarea {
      field-sizing: content;
      max-block-size: var(--textarea-max-block-size);
    }
  }
}
```

- Required: pair with `max-block-size`/`max-inline-size` so unbounded content still stops growing at a sane limit — `field-sizing: content` alone has no ceiling.

## Native Select Styling

Priority: LOW

- `:open` ([rules-interaction.md](rules-interaction.md), Stability: Emerging) matches a `<select>` or picker `<input>` (color, date) while its picker is showing, alongside an open `<dialog>`/`<details>` — one selector for "currently open" instead of a per-element state check. It does not match popovers; those use `:popover-open`.
- Customizable select (`appearance: base-select` plus `::picker(select)` and friends) — Stability: Experimental, single-engine. Never generate unless explicitly requested. Until it is Baseline, `appearance: none` on a `<select>` remains discouraged for the same reason `appearance: none` is discouraged on checkboxes/radios in Native Control Color above: it strips native keyboard, focus, and `forced-colors` behavior that a full custom rebuild has to reimplement, and there is no Baseline "customize without losing the native behavior" option yet.

## Labels and Placeholder Text

Priority: HIGH

- Required: every field has a real `<label>` (or `aria-label`/`aria-labelledby`); flag the HTML when `::placeholder` is the only visible instruction — CSS cannot substitute for a missing label.
- Required: `::placeholder` color still meets the same WCAG AA contrast as body text against its field background once a label exists. Placeholder text is real, readable content (hints, format examples), not decoration, even though it disappears on input.

```css
::placeholder {
  color: var(--color-ink-muted); /* the token body copy uses, not a lighter one-off */
}
```
