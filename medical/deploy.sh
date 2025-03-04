#!/bin/bash

set -e  # Exit immediately if a command fails

echo "🚀 Deploying Healthcare App..."

# Move into the medical directory (where this script lives)
cd "$(dirname "$0")"

# Install dependencies (safe to re-run every time)
npm install

# Build the app (outputs to dist/)
npm run build

# Stop and delete old process if it exists (safe redeploy)
pm2 stop healthcare-app || true
pm2 delete healthcare-app || true

# Start the app via serve (bind to 0.0.0.0 so external traffic works)
pm2 start serve --name healthcare-app -- -s dist -l 3000 --host 0.0.0.0

# Save PM2 process list (so it restarts after reboot)
pm2 save

# Print confirmation with public IP (just for your logs)
echo "✅ App deployed and running at: http://$(curl -s http://checkip.amazonaws.com):3000"
