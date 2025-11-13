#!/bin/bash
# PoolPay Auto-Deploy Script

echo "🚀 Deploying PoolPay..."

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Restart PM2
pm2 restart poolpay

echo "✅ PoolPay deployed successfully!"
echo "🌐 Visit: http://your-ec2-ip"