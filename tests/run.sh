#!/usr/bin/env bash
# Test suite for the css-skills rule linter.
#
#   ./tests/run.sh          self-test the linter, then gate docs/styles.css
#   ./tests/run.sh --fast   self-test only
#
# Exits non-zero if the linter regresses or if repo CSS violates the rules.

set -uo pipefail

cd "$(dirname "$0")/.." || exit 2

status=0

echo "== linter self-test =="
if ! node tests/lint.mjs --self-test; then
  status=1
fi

if [ "${1:-}" = "--fast" ]; then
  exit "$status"
fi

echo
echo "== repo stylesheets =="
if node tests/lint.mjs docs/styles.css; then
  :
else
  status=1
fi

echo
if [ "$status" -eq 0 ]; then
  echo "All checks passed."
else
  echo "FAILED. Fix the findings above, or silence a documented exception with"
  echo "  /* lint-ignore: rule-id */"
  echo "on the line before the construct, with a comment explaining why."
fi

exit "$status"
