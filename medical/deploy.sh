#!/bin/bash

set -e

echo "🚀 Deploying Healthcare App..."
echo "📂 Current directory: $(pwd)"

cd "$(dirname "$0")" || exit 1

npm install
npm run build

pm2 stop healthcare-app || true
pm2 delete healthcare-app || true

# Start using PM2 by running the clean wrapper script
pm2 start ./start-serve.sh --name healthcare-app

pm2 save

echo "✅ App deployed at: http://$(curl -s http://checkip.amazonaws.com):3000"
