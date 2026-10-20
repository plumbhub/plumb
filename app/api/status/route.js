import { auth } from "@clerk/nextjs/server";
import { getUsage } from "@/lib/usage";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ signedIn: false });
  const { pro, remaining, limit } = await getUsage(userId);
  return Response.json({ signedIn: true, pro, remaining, limit });
}
