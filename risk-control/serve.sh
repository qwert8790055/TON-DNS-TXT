#!/bin/bash
# Start PHP built-in server for risk-control API + dashboard
cd "$(dirname "$0")"
PORT=${PORT:-8080}
echo "Risk Control API: http://localhost:${PORT}/api.php?action=dashboard"
echo "Dashboard UI:     http://localhost:${PORT}/dashboard.html"
php -S "0.0.0.0:${PORT}" -t .
