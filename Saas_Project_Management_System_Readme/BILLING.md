# 💳 Billing — Stripe Integration

This document covers the billing and subscription system powered by **Stripe**.

---

## Table of Contents

- [Plans & Pricing](#plans--pricing)
- [Architecture Overview](#architecture-overview)
- [Checkout Flow](#checkout-flow)
- [Webhook Handler](#webhook-handler)
- [Customer Portal](#customer-portal)
- [Plan Enforcement](#plan-enforcement)
- [Environment Variables](#environment-variables)
- [Testing](#testing)

---

## Plans & Pricing

| Feature | Free | Pro | Business |
|---|---|---|---|
| Members | 5 | 25 | Unlimited |
| Projects | 3 | 50 | Unlimited |
| Storage | 1 GB | 20 GB | 100 GB |
| Sprints | ❌ | ✅ | ✅ |
| Time tracking | ❌ | ✅ | ✅ |
| Analytics | Basic | Full | Full + Export |
| Priority support | ❌ | ❌ | ✅ |
| Price | $0 | $12/seat/mo | $24/seat/mo |

---

## Architecture Overview

```
User upgrades plan
       │
       ▼
POST /api/v1/workspaces/:id/billing/checkout
       │
       ▼
Create Stripe Checkout Session
       │
       ▼
User completes payment on Stripe-hosted page
       │
       ▼
Stripe fires: checkout.session.completed
       │
       ▼
POST /api/webhooks/stripe (our handler)
       │
       ▼
Update subscriptions table in PostgreSQL
       │
       ▼
Plan limits enforced on next request
```

---

## Checkout Flow

### 1. Create checkout session

```typescript
// src/server/services/billing.service.ts

export async function createCheckoutSession(
  workspaceId: string,
  plan: "pro" | "business",
  seats: number,
  userId: string
) {
  const workspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    include: { subscription: true },
  });

  // Create or retrieve Stripe customer
  let customerId = workspace.subscription?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: (await prisma.user.findUniqueOrThrow({ where: { id: userId } })).email,
      metadata: { workspaceId },
    });
    customerId = customer.id;
  }

  const priceId = STRIPE_PRICE_IDS[plan]; // from env

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: seats }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/${workspace.slug}/settings/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${workspace.slug}/settings/billing`,
    metadata: { workspaceId },
    subscription_data: {
      metadata: { workspaceId },
    },
  });

  return { checkoutUrl: session.url };
}
```

---

## Webhook Handler

The webhook endpoint validates the Stripe signature and processes events:

```typescript
// src/app/api/webhooks/stripe/route.ts

import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutComplete(event.data.object);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdate(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionCanceled(event.data.object);
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object);
      break;
  }

  return new Response("OK", { status: 200 });
}
```

### Event handlers

```typescript
async function handleCheckoutComplete(session: Stripe.CheckoutSession) {
  const workspaceId = session.metadata!.workspaceId;
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  await prisma.subscription.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscription.id,
      plan: getPlanFromPriceId(subscription.items.data[0].price.id),
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
    update: {
      status: subscription.status,
      plan: getPlanFromPriceId(subscription.items.data[0].price.id),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  // Update workspace plan
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { plan: getPlanFromPriceId(subscription.items.data[0].price.id) },
  });
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const workspaceId = subscription.metadata.workspaceId;
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: { plan: "free" },
  });
  await prisma.subscription.update({
    where: { workspaceId },
    data: { status: "canceled", plan: "free" },
  });
}
```

---

## Customer Portal

Allow users to manage their subscription (cancel, change plan, update card) via Stripe's hosted portal:

```typescript
export async function createPortalSession(workspaceId: string) {
  const subscription = await prisma.subscription.findUniqueOrThrow({
    where: { workspaceId },
  });

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId!,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/${workspace.slug}/settings/billing`,
  });

  return { portalUrl: session.url };
}
```

---

## Plan Enforcement

Plan limits are enforced **before** creating resources (not after). See [MULTI_TENANCY.md](./MULTI_TENANCY.md#plan-limits-enforcement).

When a limit is hit, the API returns:

```json
{
  "error": "Your free plan allows up to 3 projects. Upgrade to add more.",
  "code": "PLAN_LIMIT_EXCEEDED",
  "limit": 3,
  "current": 3,
  "upgradeUrl": "/acme-corp/settings/billing"
}
```

---

## Environment Variables

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Price IDs from Stripe Dashboard
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_...
```

---

## Testing

Use Stripe's test mode and CLI for local webhook testing:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted

# Use test card numbers
# Success: 4242 4242 4242 4242
# Decline: 4000 0000 0000 9995
# 3D Secure: 4000 0025 0000 3155
```

Test price IDs (in `.env.local`):
```env
STRIPE_PRO_MONTHLY_PRICE_ID=price_test_...
STRIPE_BUSINESS_MONTHLY_PRICE_ID=price_test_...
```
