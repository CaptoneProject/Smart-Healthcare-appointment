#!/bin/bash
set -e

echo "🚀 Deploying Smart Healthcare Vite App from Jenkins"

cd medical

npm install
npm run build

pm2 delete healthcare-app || true

pm2 start "serve -s dist -p 3000 --no-clipboard" --name healthcare-app

pm2 save

echo "✅ App deployed and running at: http://18.225.149.38:3000"
