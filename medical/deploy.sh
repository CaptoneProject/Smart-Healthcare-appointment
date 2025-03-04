#!/bin/bash

set -e  # Exit on error

echo "🚀 Deploying Healthcare App..."
echo "📂 Current directory: $(pwd)"

cd "$(dirname "$0")" || exit 1

npm install
npm run build

# Stop any previous instance of the app
pm2 stop healthcare-app || true
pm2 delete healthcare-app || true

# Start new instance using PM2
pm2 start --name healthcare-app -- npx serve -s dist -l 3000 --host 0.0.0.0

# Persist PM2 config to restart after reboot
pm2 save

echo "✅ App deployed at: http://$(curl -s http://checkip.amazonaws.com):3000"
