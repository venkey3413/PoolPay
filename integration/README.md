# PoolPay Integration Guide

## Integration Steps

### 1. Build PoolPay
```bash
npm install
npm run build:poolpay
```

### 2. Deploy to Resort Booking Server
Copy the `dist-poolpay` folder to your resort booking server under `/poolpay/`

### 3. Add to Header
In your resort booking header component, add:

```tsx
import { HeaderIntegration } from './path/to/HeaderIntegration';

// In your header JSX:
<HeaderIntegration />
```

### 4. Server Configuration
Add route handling for `/poolpay` to serve the built PoolPay application.

### 5. Styling
Ensure Tailwind CSS is available or add the required styles for the widget.