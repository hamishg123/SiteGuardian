# Stripe Integration Guide - SiteGuardian

## Overview
This guide explains how SiteGuardian handles Stripe payments and automatically updates user plans and credits upon successful purchase.

---

## 🔄 How It Works

### Payment Flow
1. **User Clicks "Get Started"** on pricing page or "Choose a Plan" from No Credits modal
2. **Payment Modal Opens** with three plan options (Starter, Pro, Agency)
3. **User Selects Plan** and clicks "Continue to Payment"
4. **Redirects to Stripe Checkout** with user UID and email pre-filled
5. **User Completes Payment** on Stripe
6. **Stripe Webhook Fires** (backend implementation needed)
7. **User Plan Updated** in Firestore with new credits
8. **User Returns to Site** with upgraded plan active

---

## 💳 Plan Configuration

### Plan Details

| Plan | Monthly Price | Daily Tests | Features |
|------|---------------|------------|----------|
| **Starter** | £9.99 | 3 | Security Analysis, Email Alerts |
| **Pro** | £35 | 15 | SEO & Security, Detailed Reports |
| **Agency** | £99 | 55 | Full Audit, Priority Support |

All plans include **30-day money-back guarantee**.

### Plan Config in Code
```javascript
const PLAN_CONFIG = {
    'starter': { credits: 3, maxCredits: 3, displayName: 'Starter' },
    'pro': { credits: 15, maxCredits: 15, displayName: 'Pro' },
    'agency': { credits: 55, maxCredits: 55, displayName: 'Agency' }
};
```

---

## 🔗 Stripe Payment Links

The application uses Stripe Payment Links for checkout:

```javascript
const STRIPE_LINKS = {
    'price_starter': 'https://buy.stripe.com/8x200jalK4ZB39Q89H0Fi00',
    'price_pro': 'https://buy.stripe.com/bJeaEX79y1Np9ye61z0Fi01',
    'price_agency': 'https://buy.stripe.com/4gMaEXeC0eAbbGmgGd0Fi02'
};
```

### Query Parameters
When redirecting to Stripe, the following parameters are included:
- `client_reference_id`: User's Firebase UID
- `prefilled_email`: User's email address

---

## 🪝 Webhook Implementation (Backend Required)

### What Needs to Be Done

To fully automate plan updates, you need to implement a **backend webhook endpoint** that:

1. **Listens for Stripe Events**
   - Event Type: `checkout.session.completed`
   - Endpoint: `/api/webhooks/stripe`

2. **Verifies Webhook Signature**
   - Use Stripe's webhook signing secret
   - Verify the request is authentic

3. **Extracts Payment Information**
   - Customer email
   - Payment status
   - Amount paid
   - Product/Price ID

4. **Updates Firestore**
   - Find user by `client_reference_id` (UID)
   - Update user document with:
     - `plan`: 'starter' | 'pro' | 'agency'
     - `credits`: corresponding daily limit
     - `maxCredits`: corresponding daily limit
     - `subscriptionId`: Stripe subscription ID
     - `planUpdatedAt`: timestamp

### Example Backend Implementation (Node.js/Express)

```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

const app = express();

// Webhook endpoint
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    try {
        // Verify webhook signature
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        // Handle checkout.session.completed
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            
            // Extract user ID and plan from metadata
            const userId = session.client_reference_id;
            const priceId = session.line_items.data[0].price.id;
            
            // Map price ID to plan
            const planMap = {
                'price_starter': 'starter',
                'price_pro': 'pro',
                'price_agency': 'agency'
            };
            
            const plan = planMap[priceId];
            
            // Get plan config
            const planConfig = {
                'starter': { credits: 3, maxCredits: 3 },
                'pro': { credits: 15, maxCredits: 15 },
                'agency': { credits: 55, maxCredits: 55 }
            };
            
            // Update Firestore
            await admin.firestore().collection('users').doc(userId).update({
                plan: plan,
                credits: planConfig[plan].credits,
                maxCredits: planConfig[plan].maxCredits,
                subscriptionId: session.subscription,
                planUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
                lastReset: Date.now()
            });
            
            console.log(`✅ Plan updated for user ${userId}: ${plan}`);
        }
        
        res.json({received: true});
    } catch (err) {
        console.error('Webhook error:', err);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

module.exports = app;
```

### Environment Variables Needed
```
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
FIREBASE_PROJECT_ID=siteguardian-a4905
```

---

## 🔐 Current Frontend Implementation

### Automatic Plan Check on Page Load
```javascript
// Check for plan updates on page load (for returning users from Stripe)
window.addEventListener('load', async () => {
    const user = auth.currentUser;
    if (user) {
        // Small delay to ensure Firestore is updated
        setTimeout(() => {
            handleStripeWebhook(null);
        }, 2000);
    }
});
```

This automatically refreshes the user's credits display when they return from Stripe checkout.

### Modal Transition Flow
When user runs out of tests:
1. "Out of Tests" modal appears
2. User clicks "Choose a Plan"
3. "Out of Tests" modal closes
4. "Choose Your Plan" modal opens
5. User selects plan and proceeds to Stripe

---

## 📊 Firestore Data Structure

### Users Collection
```javascript
{
  uid: "user123",
  plan: "pro",
  credits: 15,
  maxCredits: 15,
  lastReset: 1710907200000,
  subscriptionId: "sub_xxxxx",
  planUpdatedAt: 1710907200000,
  email: "user@example.com",
  photoURL: "https://..."
}
```

### Tests Subcollection
```javascript
{
  url: "https://example.com",
  timestamp: 1710907200000,
  securityScore: 85,
  seoScore: 78,
  performanceScore: 92,
  status: "completed"
}
```

---

## 🧪 Testing the Integration

### Manual Testing Checklist
- [ ] Sign in with test account
- [ ] Verify credits display in navbar
- [ ] Click "Get Started" on pricing page
- [ ] Verify payment modal opens
- [ ] Select different plans
- [ ] Click "Continue to Payment"
- [ ] Verify redirects to Stripe
- [ ] Use Stripe test card: `4242 4242 4242 4242`
- [ ] Complete payment
- [ ] Verify redirect back to site
- [ ] Check that plan updated in Firestore
- [ ] Verify credits increased in navbar
- [ ] Test "No Tests Left" modal flow

### Stripe Test Cards
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Require Auth**: `4000 0025 0000 3155`

---

## 🔄 Daily Credit Reset

Credits automatically reset at midnight (24 hours after last reset):

```javascript
async function checkCreditReset() {
    const user = auth.currentUser;
    if (!user) return;

    const ref = db.collection("users").doc(user.uid);
    const doc = await ref.get();
    if (!doc.exists) return;

    const data = doc.data();
    const day = 1000 * 60 * 60 * 24;

    if (Date.now() - data.lastReset > day) {
        await ref.update({
            credits: data.maxCredits,
            lastReset: Date.now()
        });
    }
}
```

---

## 🚀 Deployment Checklist

### Before Going Live
- [ ] Set up Stripe webhook endpoint on backend
- [ ] Configure webhook secret in environment
- [ ] Test webhook with Stripe CLI
- [ ] Update Stripe payment links to live mode
- [ ] Configure Stripe success/cancel URLs
- [ ] Set up email notifications for new subscriptions
- [ ] Test full payment flow end-to-end
- [ ] Verify Firestore security rules
- [ ] Set up monitoring and error logging
- [ ] Configure Stripe dashboard webhooks

### Stripe Dashboard Setup
1. Go to **Developers** → **Webhooks**
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `checkout.session.completed`
4. Copy webhook signing secret
5. Add to environment variables

---

## 💰 Handling Refunds

When a refund is processed through Stripe:

1. **Stripe Fires** `charge.refunded` event
2. **Backend Webhook** receives event
3. **Check Refund Reason** (within 30 days = money-back guarantee)
4. **Update User Plan** back to 'free'
5. **Reset Credits** to 1
6. **Send Confirmation Email** to user

---

## 📞 Support

For issues or questions:
- **Email**: hamishgordon051@gmail.com
- **Stripe Support**: https://support.stripe.com
- **Firebase Support**: https://firebase.google.com/support

---

## 📝 Notes

- All prices are in GBP (£)
- Subscriptions auto-renew monthly
- 30-day money-back guarantee applies to all plans
- No setup fees or hidden charges
- Users can cancel anytime

---

**Last Updated**: March 19, 2026
**Version**: 1.0 - Initial Integration Guide
