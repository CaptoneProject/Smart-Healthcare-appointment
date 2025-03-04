#!/bin/bash
set -e

echo "🚀 Deploying Smart Healthcare Vite App from Jenkins"

cd medical

npm install
npm run build

pm2 delete healthcare-app || true

# Correct way to pass arguments to `serve` via PM2
pm2 start serve --name healthcare-app -- -s dist -l 3000

pm2 save

echo "✅ App deployed and running at: http://18.225.149.38:3000"
