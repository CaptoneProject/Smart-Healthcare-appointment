#!/bin/bash

set -e  # Exit if any command fails

echo "🚀 Deploying Healthcare App..."
echo "📂 Current directory: $(pwd)"

cd "$(dirname "$0")" || exit 1  # Go into "medical"

npm install
npm run build

# Stop and delete existing PM2 process if running
pm2 stop healthcare-app || true
pm2 delete healthcare-app || true

# Start new instance using PM2 (this works reliably)
pm2 start --name healthcare-app --interpreter bash -- -c "npx serve -s dist -l 3000 --host 0.0.0.0"

# Persist PM2 process list so it survives EC2 reboot
pm2 save

echo "✅ App deployed at: http://$(curl -s http://checkip.amazonaws.com):3000"
