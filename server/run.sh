#!/bin/sh
set -eu

cd /opt/application

if [ ! -f "index.js" ]; then
  echo "[run.sh] index.js not found in /opt/application"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  if [ -f "package-lock.json" ]; then
    npm ci --omit=dev --no-audit --no-fund
  else
    npm install --omit=dev --no-audit --no-fund
  fi
fi

exec node index.js
