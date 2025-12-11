# Stripe Payment Integration

Terra Trionfo now uses Stripe for secure payment processing.

## Setup Instructions

### 1. Get Your Stripe Keys

1. Go to https://dashboard.stripe.com/register
2. Create an account (or sign in)
3. Go to **Developers** → **API keys**
4. Copy your keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### 2. Add Environment Variables

Add these to your `.env` file:

```env
STRIPE_SECRET_KEY="sk_test_your_actual_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret" # Get this in step 3
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_actual_key_here"
```

### 3. Set Up Webhook (For Production)

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL: `https://your-domain.com/api/webhook`
4. Select event: `checkout.session.completed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

### 4. Test Locally (Optional)

To test webhooks locally, use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhook
```

Copy the webhook signing secret from the output and add to `.env`.

## How It Works

### Customer Flow
1. Customer adds products to cart
2. Clicks "Checkout with Stripe"
3. Redirected to Stripe Checkout page
4. Enters payment details securely on Stripe
5. After payment, redirected back to success page
6. Order status updated to CONFIRMED

### Order Processing
- Order is created with PENDING status when checkout starts
- Stripe webhook confirms payment
- Order status updated to CONFIRMED
- Inventory automatically decremented

## Test Cards

Use these test card numbers in Stripe's test mode:

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 9995 | Decline |
| 4000 0025 0000 3155 | Requires authentication (3D Secure) |

- Use any future expiration date (e.g., 12/34)
- Use any 3-digit CVC
- Use any ZIP code

## Production Checklist

Before going live:

- [ ] Switch to live API keys (start with `pk_live_` and `sk_live_`)
- [ ] Set up webhook endpoint in production
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Test with real (small amount) transactions
- [ ] Enable Stripe Radar for fraud protection
- [ ] Set up email receipts in Stripe settings

## Support

Stripe Documentation: https://stripe.com/docs/checkout/quickstart
