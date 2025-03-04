#!/bin/bash

set -e  # Exit on first error

echo "🚀 Deploying Healthcare App..."

cd "$(dirname "$0")"
echo "📂 Current directory: $(pwd)"

npm install
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Build failed — dist folder missing!"
    exit 1
fi

# Kill any existing `serve` processes on port 3000 (just in case)
sudo fuser -k 3000/tcp || true

# Start serve directly (this process will be managed by Jenkins itself)
npx serve -s dist -l 3000 &
disown  # Optional to fully detach if needed

echo "✅ App deployed at: http://$(curl -s http://checkip.amazonaws.com):3000"
