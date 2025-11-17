#!/bin/bash

# Build PoolPay for integration
npm run build:poolpay

# Create integration package
mkdir -p integration-package
cp -r dist-poolpay integration-package/
cp integration/*.tsx integration-package/
cp package.json integration-package/

echo "Integration package created in integration-package/"
echo "Copy this to your resort booking server under /poolpay/"