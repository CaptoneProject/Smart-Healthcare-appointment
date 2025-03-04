#!/bin/bash

# Display deployment message
echo "🚀 Deploying Healthcare App..."
echo "📂 Current directory: $(pwd)"

# Navigate to the medical directory if not already there
cd "$(dirname "$0")" || exit 1

# Build the application
npm install
npm run build

# Kill any previous instances of the server running on port 3000
pkill -f "serve -s dist -l 3000" || true

# Start the server using nohup to keep it running after Jenkins job completes
nohup npx serve -s dist -l 3000 > ./app.log 2>&1 &

# Save the process ID for potential future management
echo $! > ./app.pid

# Wait a moment to ensure the server starts
sleep 5

# Check if the server is running by testing the port
if nc -z localhost 3000; then
  echo "✅ App deployed at: http://18.225.149.38:3000"
else
  echo "❌ Failed to start the server. Check app.log for details."
  cat ./app.log
  exit 1
fi
