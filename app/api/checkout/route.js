import Stripe from "stripe";
import { auth, clerkClient } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses?.[0]?.emailAddress;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    client_reference_id: userId,
    customer_email: email,
    subscription_data: { metadata: { userId } },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?upgraded=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
  });

  return Response.json({ url: session.url });
}
