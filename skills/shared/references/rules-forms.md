# Forms Rules: Validation States, Native Control Color, Labels

## Validation States

Priority: HIGH

- Required: style constraint-validation feedback with `:user-valid` / `:user-invalid`, not a JS-toggled error class. The pseudo-classes only match after the user has interacted with the field (or attempted submit), so an empty required field never renders as "wrong" before the user has touched it.
- Never rely on bare `:invalid` for interactive feedback — it matches immediately on page load, before the user has typed anything.
- Required: pair validation styling with the field's existing ARIA wiring (`aria-invalid`, `aria-describedby` pointing at the error text). CSS only changes appearance; it cannot announce the error to assistive technology. Flag missing ARIA wiring in the HTML rather than compensating for it in CSS.
- Fallback (profile capability `false`, e.g. `legacy`): gate `:invalid` with `:not(:placeholder-shown)` to approximate "touched" state without JavaScript.

```css
@layer components {
  .field:user-invalid {
    border-color: var(--color-danger);
  }

  /* legacy fallback: :user-invalid unsupported */
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

## Labels and Placeholder Text

Priority: HIGH

- Required: every field has a real `<label>` (or `aria-label`/`aria-labelledby`); flag the HTML when `::placeholder` is the only visible instruction — CSS cannot substitute for a missing label.
- Required: `::placeholder` color still meets the same WCAG AA contrast as body text against its field background once a label exists. Placeholder text is real, readable content (hints, format examples), not decoration, even though it disappears on input.

```css
::placeholder {
  color: var(--color-ink-muted); /* the token body copy uses, not a lighter one-off */
}
```
