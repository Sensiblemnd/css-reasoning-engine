# Example-extraction fixture

Self-test input for linting css blocks inside Markdown. Only the annotated
finding may be reported; every other block must be skipped or clean.

Preferred:

```css
/* A Preferred example that breaks a rule must be caught. */
/* expect: no-transition-all */
.card {
  transition: all 200ms;
}
```

Avoid:

```css
.card {
  transition: all 200ms; /* anti-example: must be skipped */
}
```

Never:

```css
.button {
  &-icon { color: red; } /* anti-example: must be skipped */
}
```

Before:

```css
.button {
  margin-left: 20px; /* input half of a refactor pair: must be skipped */
}
```

<!-- lint-skip: deliberately incomplete fragment -->
```css
.x { transition: all 1s; }
```

- Indented block inside a list, and unlayered on purpose — `no-unlayered` is
  exempt for examples, so this must be clean:

  ```css
  .card {
    color: var(--color-text);
  }
  ```
