import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { getUsage, recordQuestion } from "@/lib/usage";

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FREE_PROMPT =
  "You are Plumb. Answer accurately and concisely in a short paragraph of plain text (no markdown). If you are not sure, say so instead of guessing.";

const PRO_PROMPT =
  "You are Plumb Pro. Give the most accurate answer possible in plain text (no markdown). Use web search for anything that may have changed recently. Check your reasoning before answering. End with a short 'Sources:' list and a one-line confidence note. If evidence is weak or conflicting, say so plainly.";

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Sign in to ask a question." }, { status: 401 });
  }

  const { question } = await req.json().catch(() => ({}));
  const q = typeof question === "string" ? question.trim() : "";
  if (!q) return Response.json({ error: "Type a question first." }, { status: 400 });
  if (q.length > 2000) {
    return Response.json({ error: "Keep questions under 2,000 characters." }, { status: 400 });
  }

  const { client, pro, used, limit } = await getUsage(userId);
  if (used >= limit) {
    return Response.json(
      {
        error: pro
          ? "You've hit today's Pro limit. It resets tomorrow."
          : "You've used today's free questions. Upgrade to Pro for more.",
        limitReached: true,
      },
      { status: 429 }
    );
  }

  try {
    const msg = await anthropic.messages.create({
      model: pro ? process.env.PRO_MODEL : process.env.FREE_MODEL,
      max_tokens: pro ? 1500 : 600,
      system: pro ? PRO_PROMPT : FREE_PROMPT,
      messages: [{ role: "user", content: q }],
      ...(pro && {
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
      }),
    });

    const answer = msg.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!answer) throw new Error("empty");

    await recordQuestion(client, userId, used);
    return Response.json({ answer, pro, remaining: limit - used - 1 });
  } catch (e) {
    console.error("Anthropic error:", e);
    return Response.json(
      { error: "The answer didn't come through. Try asking again." },
      { status: 502 }
    );
  }
}
