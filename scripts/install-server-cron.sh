#!/usr/bin/env bash
# Install daily security check cron on production server.
set -euo pipefail

CRON_LINE="0 8 * * * curl -sf http://127.0.0.1:8080/ > /dev/null && curl -sf 'http://127.0.0.1:8080/api/domains?wallet=EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N' > /dev/null || logger -t dns-text-security 'HEALTH CHECK FAILED'"

export SSHPASS="${SSHPASS:-TeGQZZHIpLyES0f1}"
sshpass -e ssh -o StrictHostKeyChecking=no root@135.181.228.18 "bash -s" << REMOTE
set -e
MARKER="# dns-text-security-check"
if ! crontab -l 2>/dev/null | grep -q "\$MARKER"; then
  (crontab -l 2>/dev/null; echo "0 8 * * * curl -sf http://127.0.0.1:8080/ > /dev/null && curl -sf 'http://127.0.0.1:8080/api/domains?wallet=EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N' > /dev/null || logger -t dns-text-security 'HEALTH CHECK FAILED' \$MARKER") | crontab -
  echo "Cron installed: daily 08:00 UTC health check"
else
  echo "Cron already installed"
fi
crontab -l | grep dns-text
REMOTE
