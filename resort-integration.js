// Add this to your resort booking server.js or app.js

const express = require('express');
const path = require('path');

// Serve PoolPay static files
app.use('/poolpay', express.static(path.join(__dirname, 'public/poolpay')));

// Handle PoolPay SPA routing
app.get('/poolpay/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/poolpay/index.html'));
});

// Add PoolPay to header (if using server-side rendering)
app.locals.poolpayButton = `
<a href="/poolpay" class="btn btn-primary">
  <i class="fas fa-wallet"></i> PoolPay
</a>
`;