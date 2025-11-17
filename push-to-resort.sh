#!/bin/bash

# Clone the resort repo
git clone https://github.com/venkey3413/vizag-resort-booking.git ../resort-temp
cd ../resort-temp

# Create poolpay directory and copy files
mkdir -p poolpay
cp -r ../PoolPay/src poolpay/
cp -r ../PoolPay/public poolpay/ 2>/dev/null || true
cp ../PoolPay/package.json poolpay/
cp ../PoolPay/index.html poolpay/
cp ../PoolPay/tailwind.config.js poolpay/
cp ../PoolPay/tsconfig*.json poolpay/
cp ../PoolPay/eslint.config.js poolpay/
cp ../PoolPay/postcss.config.js poolpay/

# Create vite config for poolpay
cat > poolpay/vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/poolpay/',
  build: {
    outDir: '../public/poolpay',
    emptyOutDir: true,
  },
});
EOF

# Create build script
cat > build-poolpay.sh << 'EOF'
#!/bin/bash
cd poolpay
npm install
npm run build
EOF

chmod +x build-poolpay.sh

# Create server integration
cat > poolpay-routes.js << 'EOF'
// Add to your server.js
const path = require('path');

app.use('/poolpay', express.static(path.join(__dirname, 'public/poolpay')));
app.get('/poolpay/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/poolpay/index.html'));
});
EOF

# Add and push
git add .
git commit -m "Add PoolPay integration"
git push origin main

echo "PoolPay pushed to vizag-resort-booking repo!"
cd ../PoolPay