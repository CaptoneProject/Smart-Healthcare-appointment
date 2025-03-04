#!/bin/bash
set -e

echo "🚀 Deploying Smart Healthcare Vite App from Jenkins"

# Go to the medical folder (inside the repo)
cd medical

# Install dependencies and build
npm install
npm run build

# Stop any existing PM2 process for this app
pm2 delete healthcare-app || true

# Start serving the dist folder correctly
pm2 start serve --name healthcare-app -- -s $(pwd)/dist -l 3000

# Save PM2 process list
pm2 save

echo "✅ App deployed and running at: http://18.225.149.38:3000"
