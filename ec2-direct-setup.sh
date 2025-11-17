#!/bin/bash
# Run this on your EC2 server

# Clone PoolPay repo
cd /var/www/html
git clone https://github.com/venkey3413/PoolPay.git
cd PoolPay

# Install dependencies
npm install

# Build for production with /poolpay base path
npm run build

# Move build files to poolpay directory
sudo mkdir -p /var/www/html/poolpay
sudo cp -r dist/* /var/www/html/poolpay/

# Set permissions
sudo chown -R www-data:www-data /var/www/html/poolpay