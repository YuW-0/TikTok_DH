#!/bin/sh
set -eu

# Compatible with two deployment target layouts:
# 1) repository root (server code in ./server)
# 2) server directory as deployment target (index.js in current dir)

if [ -f "/opt/application/server/index.js" ]; then
  cd /opt/application/server
elif [ -f "/opt/application/index.js" ]; then
  cd /opt/application
else
  echo "[run.sh] index.js not found in /opt/application or /opt/application/server"
  exit 1
fi

# Install dependencies if the platform build stage did not install them.
if [ ! -d "node_modules" ]; then
  if [ -f "package-lock.json" ]; then
    npm ci --omit=dev --no-audit --no-fund
  else
    npm install --omit=dev --no-audit --no-fund
  fi
fi

exec node index.js
