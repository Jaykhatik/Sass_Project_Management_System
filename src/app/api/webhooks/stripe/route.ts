import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (error: any) {
    console.error("Webhook signature verification failed.", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const customerId = session.customer as string;
        const workspaceId = session.client_reference_id;

        const sub = workspaceId
          ? await prisma.subscription.findUnique({ where: { workspaceId } })
          : await prisma.subscription.findFirst({ where: { stripeCustomerId: customerId } });

        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              plan: "pro",
              status: subscription.status,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscription.id,
              currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
              currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            },
          });
        }
      }
    }

    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const sub = await prisma.subscription.findFirst({
        where: {
          OR: [
            { stripeSubscriptionId: subscription.id },
            { stripeCustomerId: customerId }
          ]
        }
      });

      if (sub) {
        const isProPrice = subscription.items.data.some(
          (item) => item.price.id === process.env.STRIPE_PRO_PRICE_ID
        );
        const isPro = (isProPrice || subscription.status === "active") && subscription.status !== "canceled";

        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            plan: isPro ? "pro" : "free",
            status: subscription.status,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customerId,
            currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const sub = await prisma.subscription.findFirst({
        where: {
          OR: [
            { stripeSubscriptionId: subscription.id },
            { stripeCustomerId: customerId }
          ]
        }
      });

      if (sub) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            plan: "free",
            status: "canceled",
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook processing error:", error.message);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
