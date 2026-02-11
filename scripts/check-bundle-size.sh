#!/usr/bin/env bash
set -euo pipefail

JS_BUDGET=51200   # 50 KB gzipped
CSS_BUDGET=20480  # 20 KB gzipped

js_size=0
css_size=0

for f in dist/assets/*.js; do
  [ -f "$f" ] || continue
  gz=$(gzip -c "$f" | wc -c)
  js_size=$((js_size + gz))
done

for f in dist/assets/*.css; do
  [ -f "$f" ] || continue
  gz=$(gzip -c "$f" | wc -c)
  css_size=$((css_size + gz))
done

echo "JS gzipped:  ${js_size} bytes (budget: ${JS_BUDGET})"
echo "CSS gzipped: ${css_size} bytes (budget: ${CSS_BUDGET})"

fail=0
if [ "$js_size" -gt "$JS_BUDGET" ]; then
  echo "❌ JS exceeds budget by $((js_size - JS_BUDGET)) bytes"
  fail=1
fi
if [ "$css_size" -gt "$CSS_BUDGET" ]; then
  echo "❌ CSS exceeds budget by $((css_size - CSS_BUDGET)) bytes"
  fail=1
fi

if [ "$fail" -eq 1 ]; then
  exit 1
fi
echo "✅ Bundle size within budget"
