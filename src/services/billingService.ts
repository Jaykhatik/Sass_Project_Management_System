import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function createCheckoutSession(workspaceId: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { subscription: true }
  });

  if (!workspace) throw new Error("Workspace not found");

  let customerId = workspace.subscription?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { workspaceId }
    });
    customerId = customer.id;
    
    if (!workspace.subscription) {
      await prisma.subscription.create({
        data: {
          workspaceId,
          stripeCustomerId: customerId,
          plan: "free"
        }
      });
    } else {
      await prisma.subscription.update({
        where: { workspaceId },
        data: { stripeCustomerId: customerId }
      });
    }
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: PRO_PRICE_ID,
        quantity: 1,
      },
    ],
    success_url: `${APP_URL}/dashboard/settings/billing?success=true`,
    cancel_url: `${APP_URL}/dashboard/settings/billing?canceled=true`,
    client_reference_id: workspaceId,
  });

  return session.url;
}

export async function createPortalSession(workspaceId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId }
  });

  if (!subscription?.stripeCustomerId) {
    throw new Error("No active subscription found");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${APP_URL}/dashboard/settings/billing`,
  });

  return session.url;
}

export async function getCurrentSubscription(workspaceId: string) {
  let sub = await prisma.subscription.findUnique({
    where: { workspaceId }
  });

  if (!sub) {
    sub = await prisma.subscription.create({
      data: {
        workspaceId,
        plan: "free",
        status: "active"
      }
    });
  }

  // Fallback sync: If local database says "free" but user has a stripeCustomerId, check Stripe directly
  if (sub.plan === "free" && sub.stripeCustomerId) {
    try {
      const activeSubs = await stripe.subscriptions.list({
        customer: sub.stripeCustomerId,
        status: "active",
        limit: 1,
      });

      if (activeSubs.data.length > 0) {
        const activeSub = activeSubs.data[0];
        sub = await prisma.subscription.update({
          where: { workspaceId },
          data: {
            plan: "pro",
            status: activeSub.status,
            stripeSubscriptionId: activeSub.id,
            currentPeriodStart: new Date((activeSub as any).current_period_start * 1000),
            currentPeriodEnd: new Date((activeSub as any).current_period_end * 1000),
          },
        });
      }
    } catch (e) {
      console.error("Error performing Stripe fallback sync:", e);
    }
  }

  return sub;
}
