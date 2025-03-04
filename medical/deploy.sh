#!/bin/bash
set -e

echo "🚀 Deploying Smart Healthcare Vite App from Jenkins"

# Navigate to the project directory (this is the directory where `package.json` is located)
cd "$(dirname "$0")"

# Install dependencies (safe if already installed)
npm install

# Build the Vite project
npm run build

# Stop any existing running app
pm2 delete healthcare-app || true

# Start the app using `serve` to serve static files from dist
pm2 start serve --name healthcare-app -- -s dist -l 3000

# Save PM2 process list so it auto-restores on reboot
pm2 save

echo "✅ App deployed and running at: http://18.225.149.38:3000"
