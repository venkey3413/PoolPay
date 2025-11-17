// Express.js route configuration for PoolPay integration
const express = require('express');
const path = require('path');

// Serve PoolPay static files
app.use('/poolpay', express.static(path.join(__dirname, 'dist-poolpay')));

// Handle PoolPay SPA routing
app.get('/poolpay/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist-poolpay', 'index.html'));
});