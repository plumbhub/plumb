import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe calls this when someone pays, cancels, or a payment fails.
// It's the only place Pro gets switched on or off.
export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return new Response(`Webhook error: ${e.message}`, { status: 400 });
  }

  const client = await clerkClient();
  const setPro = async (userId, pro, customerId) => {
    if (!userId) return;
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { pro },
      ...(customerId && { privateMetadata: { stripeCustomerId: customerId } }),
    });
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object;
      await setPro(s.client_reference_id, true, s.customer);
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const active = ["active", "trialing"].includes(sub.status);
      await setPro(sub.metadata?.userId, active, sub.customer);
      break;
    }
  }

  return new Response("ok");
}
