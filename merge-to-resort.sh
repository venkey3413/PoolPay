#!/bin/bash

# Clone vizag resort booking repo
git clone https://github.com/venkey3413/vizag-resort-booking.git temp-resort
cd temp-resort

# Create poolpay directory structure
mkdir -p poolpay/src
mkdir -p poolpay/public

# Copy PoolPay files
cp -r ../src/* poolpay/src/
cp -r ../public/* poolpay/public/ 2>/dev/null || true
cp ../package.json poolpay/
cp ../vite.config.ts poolpay/
cp ../tailwind.config.js poolpay/
cp ../tsconfig.json poolpay/
cp ../index.html poolpay/

# Create poolpay build script
cat > build-poolpay.sh << 'EOF'
#!/bin/bash
cd poolpay
npm install
npm run build
mkdir -p ../public/poolpay
cp -r dist/* ../public/poolpay/
EOF

chmod +x build-poolpay.sh

# Add to git
git add .
git commit -m "Add PoolPay integration"
git push origin main

echo "PoolPay merged into vizag-resort-booking repo"