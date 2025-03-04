#!/bin/bash

set -e  # Exit immediately if anything fails

echo "🚀 Deploying Healthcare App..."

# Move into the correct directory (medical)
cd "$(dirname "$0")"

echo "📂 Current directory: $(pwd)"

# Install dependencies
npm install

# Build the app
npm run build

# Confirm dist exists after build
if [ ! -d "dist" ]; then
    echo "❌ Build failed — dist folder missing!"
    exit 1
fi

# Stop and delete any old PM2 process (if exists)
pm2 stop healthcare-app || true
pm2 delete healthcare-app || true

# Start `serve` with the correct args
pm2 start serve --name healthcare-app -- -s dist -l 3000 --host 0.0.0.0

# Save PM2 process list so it survives reboot
pm2 save

# Final confirmation
echo "✅ App deployed at: http://$(curl -s http://checkip.amazonaws.com):3000"
