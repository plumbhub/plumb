"use client";

import { useEffect, useState } from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  const [status, setStatus] = useState(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const [upgraded, setUpgraded] = useState(false);

  const loadStatus = () =>
    fetch("/api/status").then((r) => r.json()).then(setStatus).catch(() => {});

  useEffect(() => {
    loadStatus();
    if (new URLSearchParams(window.location.search).get("upgraded")) {
      setUpgraded(true);
      window.history.replaceState({}, "", "/");
      // Stripe can take a few seconds to confirm, so check again shortly.
      setTimeout(loadStatus, 4000);
    }
  }, []);

  const pro = status?.pro;
  const outOfQuestions = status?.signedIn && status.remaining <= 0;

  const ask = async () => {
    const question = q.trim();
    if (!question || loading) return;
    setLoading(true);
    setQ("");
    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await r.json();
      setHistory((h) => [
        { question, answer: data.answer || data.error, pro: data.pro, err: !r.ok },
        ...h,
      ]);
      if (typeof data.remaining === "number") {
        setStatus((s) => ({ ...s, remaining: data.remaining }));
      } else if (data.limitReached) {
        setStatus((s) => ({ ...s, remaining: 0 }));
      }
    } catch {
      setHistory((h) => [{ question, answer: "Couldn't reach the server. Check your connection and try again.", err: true }, ...h]);
    }
    setLoading(false);
  };

  const go = async (path) => {
    setBusy(true);
    try {
      const r = await fetch(path, { method: "POST" });
      const data = await r.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="wrap">
      <div className="top">
        <div className="logo">Plumb</div>
        <div className="right">
          <SignedIn>
            {status?.signedIn &&
              (pro ? <b>Pro</b> : <span>Free · {status.remaining} left today</span>)}
            <UserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="ghost">Sign in</button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>

      <div className="hero">
        <div className="bobcol" aria-hidden="true">
          <div className="string" />
          <div className="bob" />
        </div>
        <div>
          <h1>Ask anything. Get a straight answer.</h1>
          <p className="sub">
            Plumb answers clearly and tells you when it isn&apos;t sure. Pro checks the live web
            and shows its sources.
          </p>
        </div>
      </div>

      {upgraded && (
        <p className="notice">
          {pro ? "You're on Pro. Every answer now checks the live web." : "Payment received. Switching on Pro…"}
        </p>
      )}

      <div className="ask">
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask();
            }
          }}
          placeholder="How far is the Moon from Earth?"
          aria-label="Your question"
          maxLength={2000}
        />
        <div className="row">
          <SignedOut>
            <span className="count">Sign in to ask. Your first 5 questions each day are free.</span>
            <SignInButton mode="modal">
              <button className="primary">Sign in to ask</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <span className="count">
              {outOfQuestions
                ? pro
                  ? "You've hit today's Pro limit. It resets tomorrow."
                  : "You've used today's free questions."
                : pro
                ? "Pro: web-checked answers with sources"
                : "Enter to ask"}
            </span>
            {outOfQuestions && !pro ? (
              <button className="ghost" onClick={() => go("/api/checkout")} disabled={busy}>
                Upgrade to Pro
              </button>
            ) : (
              <button className="primary" onClick={ask} disabled={loading || !q.trim() || outOfQuestions}>
                {loading ? (pro ? "Checking sources…" : "Thinking…") : "Ask"}
              </button>
            )}
          </SignedIn>
        </div>
      </div>

      {history.map((h, i) => (
        <div className="answer" key={i}>
          {h.pro && !h.err && <span className="tag">Pro answer</span>}
          <p className="q">{h.question}</p>
          <p className={"a" + (h.err ? " err" : "")}>{h.answer}</p>
        </div>
      ))}

      {pro ? (
        <div style={{ marginTop: 48 }}>
          <button className="link" onClick={() => go("/api/portal")} disabled={busy}>
            Manage or cancel your subscription
          </button>
        </div>
      ) : (
        <div className="tiers">
          <div className="tier">
            <h3>Free</h3>
            <p className="price">$0</p>
            <ul>
              <li>5 questions a day</li>
              <li>Short, direct answers</li>
              <li>Flags when it isn&apos;t sure</li>
            </ul>
          </div>
          <div className="tier pro">
            <h3>Pro</h3>
            <p className="price">$20 / month</p>
            <ul>
              <li>Up to 200 questions a day</li>
              <li>A stronger AI model</li>
              <li>Searches the live web for current facts</li>
              <li>Sources and a confidence note on every answer</li>
            </ul>
            <div style={{ marginTop: 16 }}>
              <SignedIn>
                <button className="ghost" onClick={() => go("/api/checkout")} disabled={busy}>
                  Upgrade to Pro
                </button>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="ghost">Sign in to upgrade</button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
