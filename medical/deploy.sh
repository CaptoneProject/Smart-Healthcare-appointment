#!/bin/bash

set -e  # Exit on first error

echo "🚀 Deploying Healthcare App..."
echo "📂 Current directory: $(pwd)"

cd "$(dirname "$0")" || exit 1

# Install dependencies and build
npm install
npm run build

# Kill any old instance if it's running
pm2 delete healthcare-app || true

# Start using PM2 (bind to 0.0.0.0 so it's accessible externally)
pm2 start npx --name healthcare-app -- serve -s dist -l 3000 --no-clipboard

# Save PM2 state so it survives reboots
pm2 save
pm2 list

# Confirm process is listening
sleep 5
if nc -z localhost 3000; then
    echo "✅ App deployed at: http://$(curl -s http://checkip.amazonaws.com):3000"
else
    echo "❌ App failed to start, check PM2 logs."
    pm2 logs healthcare-app
    exit 1
fi
