import Stripe from "stripe";
import { auth, clerkClient } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Lets Pro users cancel or update their card themselves.
export async function POST() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 });

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const customer = user.privateMetadata?.stripeCustomerId;
  if (!customer) return Response.json({ error: "No subscription found." }, { status: 404 });

  const session = await stripe.billingPortal.sessions.create({
    customer,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
  });
  return Response.json({ url: session.url });
}
