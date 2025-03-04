#!/bin/bash

set -e  # Exit on error

echo "🚀 Deploying Healthcare App..."
echo "📂 Current directory: $(pwd)"

cd "$(dirname "$0")" || exit 1

npm install
npm run build

pkill -f "serve -s dist -l" || true

nohup npx serve -s dist -l tcp://0.0.0.0:3000 > ./app.log 2>&1 &

echo $! > ./app.pid

sleep 5

if nc -z localhost 3000; then
  echo "✅ App deployed at: http://$(curl -s http://checkip.amazonaws.com):3000"
else
  echo "❌ Failed to start the server. Check app.log for details."
  cat ./app.log
  exit 1
fi
