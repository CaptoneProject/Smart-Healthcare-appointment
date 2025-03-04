#!/bin/bash

set -e  # Stop immediately if any command fails

echo "🚀 Deploying Healthcare App..."

# Move into the right directory (medical)
cd "$(dirname "$0")"

echo "📂 Current directory: $(pwd)"

# Install dependencies
npm install

# Build the app
npm run build

# Check if dist exists after build (mandatory)
if [ ! -d "dist" ]; then
    echo "❌ Build failed: dist folder missing"
    exit 1
fi

# Stop & delete old process safely
pm2 stop healthcare-app || true
pm2 delete healthcare-app || true

# Log the command to be sure
echo "⚙️ Starting serve using PM2 (this time correctly!)"

# Start the app correctly (no weird "bash" process tricks)
pm2 start serve --name healthcare-app -- -s dist -l 3000 --host 0.0.0.0

# Save PM2 list for auto-restart
pm2 save

# Final confirmation
echo "✅ App deployed at: http://$(curl -s http://checkip.amazonaws.com):3000"
