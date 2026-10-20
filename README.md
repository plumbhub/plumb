# Plumb — setup guide

Plumb is an AI question-answering site. Free users get 5 short answers a day. Pro users pay $20/month for a stronger model, live web search, and sources.

You'll set up four free accounts, paste in some keys, and go live. Plan on about an hour the first time.

---

## Step 1: Put the code on GitHub

1. Create a free account at github.com.
2. Click **New repository**, name it `plumb`, and keep it **Private**.
3. On the empty repo page, click **uploading an existing file**.
4. Unzip this folder on your computer and drag **everything inside it** into the upload box. Then click **Commit changes**.

## Step 2: Get your Anthropic API key

1. Go to console.anthropic.com and sign up.
2. Add a payment method under **Billing**. Set a monthly spending limit so a surprise bill can't happen.
3. Go to **API Keys → Create Key** and copy it somewhere safe. You'll need it in step 5.

## Step 3: Set up Clerk (sign-in)

1. Go to clerk.com, sign up, and create an application called Plumb.
2. Choose the sign-in options you want, such as Google and email.
3. Copy the **Publishable key** and **Secret key** from **API Keys**.

## Step 4: Set up Stripe (payments)

1. Go to stripe.com and sign up. Stay in **Test mode** (the toggle at the top) until everything works.
2. Go to **Product catalog → Add product**. Name it "Plumb Pro", set the price to **$20.00, Recurring, Monthly**, and save.
3. Open the product and copy the **Price ID** (it starts with `price_`).
4. Go to **Developers → API keys** and copy the **Secret key**.
5. Go to **Settings → Billing → Customer portal** and click **Activate**. This lets subscribers cancel on their own.

## Step 5: Deploy on Vercel

1. Go to vercel.com and sign up with your GitHub account.
2. Click **Add New → Project** and import `plumb`.
3. Open **Environment Variables** and add each line from `env-template.txt` with your real values. Skip `STRIPE_WEBHOOK_SECRET` for now, and for `NEXT_PUBLIC_SITE_URL` put a placeholder.
4. Click **Deploy**. When it finishes, copy your site's address (like `https://plumb-abc.vercel.app`).
5. Go to **Settings → Environment Variables**, set `NEXT_PUBLIC_SITE_URL` to that address, and redeploy.

## Step 6: Connect Stripe to your site

This is how your site learns that someone paid.

1. In Stripe, go to **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://YOUR-SITE.vercel.app/api/webhook`
3. Select these events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. Save, then copy the **Signing secret** (starts with `whsec_`).
5. Add it in Vercel as `STRIPE_WEBHOOK_SECRET` and redeploy.

## Step 7: Test it

1. Open your site, sign in, and ask a question.
2. Click **Upgrade to Pro** and pay with Stripe's test card: `4242 4242 4242 4242`, any future date, any CVC.
3. You should land back on the site as Pro within a few seconds.

When it all works, switch Stripe to **Live mode**, create the product again there, and update `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET` in Vercel with the live versions.

---

## Before you charge real people

- **Watch your API costs.** Pro answers with web search cost noticeably more than free ones. Check console.anthropic.com in your first weeks and adjust `PRO_DAILY_LIMIT` if needed.
- **Add a Terms of Service and Privacy Policy.** Stripe requires them for live payments.
- **Be honest in your marketing.** AI can still be wrong. Pro is more reliable, not perfect.

## Changing things later

- Free and Pro daily limits: `FREE_DAILY_LIMIT` and `PRO_DAILY_LIMIT` in Vercel.
- AI models: `FREE_MODEL` and `PRO_MODEL` in Vercel.
- Look and wording: `app/page.js` and `app/globals.css`.
