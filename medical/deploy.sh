#!/bin/bash

set -e  # Exit immediately on error

echo "🚀 Deploying Healthcare App..."

cd "$(dirname "$0")"
echo "📂 Current directory: $(pwd)"

npm install
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Build failed — dist folder missing!"
    exit 1
fi

# Stop old process if exists
pm2 stop healthcare-app || true
pm2 delete healthcare-app || true

# Start using the correct working command
pm2 start --name healthcare-app -- npx serve -s dist -l 3000

# Save process list
pm2 save

echo "✅ App deployed at: http://$(curl -s http://checkip.amazonaws.com):3000"
