#!/usr/bin/env bash
#
# Smoke checks against production — the audit's checks, runnable on demand.
#
# Read-only: every check is a GET against the live domains, so running this can
# never change anything. It exists because the alternative is re-deriving these
# curl commands from memory each time something feels off. Takes ~15 seconds.
#
#   npm run smoke
#
set -u

DOMAINS=(
  "www.pududotoho.sk sk"
  "www.pududotoho.cz cz"
  "www.puduindustrial.com en"
  "www.puduindustrial.de de"
)

failures=0

check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "  ✓ $label"
  else
    echo "  ✗ $label — čakané '$expected', prišlo '$actual'"
    failures=$((failures + 1))
  fi
}

fetch_code() { curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$@"; }

for entry in "${DOMAINS[@]}"; do
  read -r host locale <<<"$entry"
  echo "=== $host ==="

  # The full redirect chain ends on the market's language, alive.
  final=$(curl -s -o /tmp/smoke-body.html -w "%{http_code} %{url_effective}" -L --max-time 25 "http://${host#www.}")
  check "reťaz presmerovaní končí na /$locale (200)" \
    "200 https://$host/$locale" "$final"

  # The database-backed footer is rendered — the company block, not the fallback.
  count=$(grep -c footcompany /tmp/smoke-body.html)
  check "päta s firmou je v HTML" "1" "$count"

  # hreflang carries all four markets plus the default.
  count=$(grep -io 'hreflang="[^"]*"' /tmp/smoke-body.html | sort -u | wc -l | tr -d ' ')
  check "hreflang: 4 jazyky + x-default" "5" "$count"

  # The admin requires a session…
  check "/admin presmeruje na prihlásenie" "307" "$(fetch_code "https://$host/admin")"

  # …and the retention cron refuses strangers. 401 means the secret is set and
  # checked; 503 means it is missing and the nightly deletion is not running.
  check "cron odmieta bez kľúča (401)" "401" \
    "$(fetch_code "https://$host/api/cron/purge-enquiries")"
  check "cron odmieta zlý kľúč (401)" "401" \
    "$(fetch_code -H "Authorization: Bearer wrong" "https://$host/api/cron/purge-enquiries")"

  check "sitemap.xml" "200" "$(fetch_code "https://$host/sitemap.xml")"
  check "robots.txt" "200" "$(fetch_code "https://$host/robots.txt")"
done

echo
if [ "$failures" -eq 0 ]; then
  echo "Všetko v poriadku."
else
  echo "$failures kontrol zlyhalo."
  exit 1
fi
