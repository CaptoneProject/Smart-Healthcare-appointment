#!/bin/bash

set -e  # Fail fast on errors

echo "🚀 Deploying Healthcare App..."

cd "$(dirname "$0")"
echo "📂 Current directory: $(pwd)"

npm install
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Build failed — dist folder missing!"
    exit 1
fi

# Kill anything already on 3000 (optional)
fuser -k 3000/tcp || true  # No sudo needed if Jenkins owns the port

# Start serve fully detached (does NOT tie to Jenkins)
nohup npx serve -s dist -l 3000 > serve.log 2>&1 &

echo "✅ App deployed at: http://$(curl -s http://checkip.amazonaws.com):3000"
