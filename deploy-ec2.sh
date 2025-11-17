#!/bin/bash

# Build PoolPay
npm run build:poolpay

# Deploy to EC2 (replace with your EC2 details)
EC2_HOST="your-ec2-ip"
EC2_USER="ubuntu"
KEY_PATH="~/.ssh/your-key.pem"

# Upload built files
scp -i $KEY_PATH -r dist-poolpay/ $EC2_USER@$EC2_HOST:/var/www/html/poolpay/
scp -i $KEY_PATH integration/*.tsx $EC2_USER@$EC2_HOST:/var/www/html/integration/

# Restart services
ssh -i $KEY_PATH $EC2_USER@$EC2_HOST "sudo systemctl restart nginx && sudo systemctl restart pm2"