import { clerkClient } from "@clerk/nextjs/server";

const today = () => new Date().toISOString().slice(0, 10);

// Reads a user's plan and today's usage from their Clerk account.
// Pro status is set only by the Stripe webhook, never by the browser.
export async function getUsage(userId) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const pro = user.publicMetadata?.pro === true;
  const u = user.privateMetadata?.usage || {};
  const used = u.day === today() ? u.used || 0 : 0;
  const limit = pro
    ? Number(process.env.PRO_DAILY_LIMIT || 200)
    : Number(process.env.FREE_DAILY_LIMIT || 5);
  return { client, user, pro, used, limit, remaining: Math.max(0, limit - used) };
}

export async function recordQuestion(client, userId, used) {
  await client.users.updateUserMetadata(userId, {
    privateMetadata: { usage: { day: today(), used: used + 1 } },
  });
}
