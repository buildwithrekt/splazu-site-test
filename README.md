# splazu-site-test ($FORK)

The landing page for your project, as a small standalone Next.js app. Built with splazu.

## What is in here

| File | What it is |
|---|---|
| `kit.json` | All the site content and the brand: name, colors, fonts, logo, headline, features, steps, FAQ. |
| `project.json` | Your token (address and pons curve) and your links (X, Telegram, website). |
| `public/logo.svg` | Your logo. Also used as the favicon. |
| `app/page.tsx` | The home page. Renders `kit.json` with `components/kit-site.tsx`. |
| `components/token-widget.tsx` | The live token box (price, market cap, bonding curve progress). |
| `lib/token-stats.ts` | Reads the token's pons bonding curve from the public Robinhood Chain RPC. |

There is no database, no API key and no secret in this project. Token stats are public on-chain data, and the page refreshes them about once a minute (`revalidate = 60` in `app/page.tsx`).

When you change your site from the splazu dashboard, splazu commits the new `kit.json` / `project.json` / `public/logo.svg` to this repo, and Vercel redeploys it.

## Run it locally

You need Node.js 20.9 or later.

```bash
npm install
npm run dev
```

Then open http://localhost:3000. To check a production build: `npm run build && npm start`.

## Deploy on Vercel

1. In Vercel, choose **Add New → Project** and import this repository (the splazu dashboard has a button that opens this page for you).
2. Keep the defaults (framework: Next.js) and click **Deploy**.
3. Every push to `main` deploys again.

## Use your own domain

1. In your Vercel project, open **Settings → Domains**.
2. Add your domain (for example `example.com`) and, if you like, `www.example.com`.
3. Vercel shows the DNS records to add at your domain registrar. Add them; the domain goes live once DNS has updated (usually minutes, sometimes up to an hour).

## Notes

- Buying the token happens on pons. This site never connects a wallet and never sends transactions.
- Tokens are volatile and can lose all value. Nothing on this site is financial advice.
