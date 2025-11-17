#!/bin/bash

echo "Starting PoolPay integration into vizag-resort-booking..."

# Step 1: Clone resort repo
git clone https://github.com/venkey3413/vizag-resort-booking.git ../vizag-resort-integration
cd ../vizag-resort-integration

# Step 2: Create PoolPay directory
mkdir -p poolpay

# Step 3: Copy PoolPay source
cp -r ../PoolPay/src poolpay/
cp -r ../PoolPay/public poolpay/ 2>/dev/null || true
cp ../PoolPay/package.json poolpay/
cp ../PoolPay/tailwind.config.js poolpay/
cp ../PoolPay/tsconfig*.json poolpay/
cp ../PoolPay/index.html poolpay/
cp ../PoolPay/poolpay-vite.config.ts poolpay/vite.config.ts

# Step 4: Create build script
cat > build-poolpay.sh << 'EOF'
#!/bin/bash
cd poolpay
npm install
npm run build
echo "PoolPay built successfully at /poolpay"
EOF

chmod +x build-poolpay.sh

# Step 5: Add integration files
cp ../PoolPay/resort-integration.js ./
cp ../PoolPay/header-integration.html ./

# Step 6: Commit and push
git add .
git commit -m "Integrate PoolPay application"
git push origin main

echo "Integration complete! Run ./build-poolpay.sh on your EC2 server"