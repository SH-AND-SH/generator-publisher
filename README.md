Generator / Publisher is a Next.js 16 App Router application for multi-project AI content operations.

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Environment

Copy `.env.example` to `.env.local` and configure:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL`

Use `http://localhost:3000` locally and the preview domain on Vercel deployments.

## CI

GitHub Actions runs:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Deployment

Deploy preview builds to `Vercel`.

After the first preview deployment:

1. Add the preview URL to Supabase Auth redirect configuration.
2. Validate the auth flow on the deployed URL.
3. Keep `NEXT_PUBLIC_APP_URL` aligned with the target environment.
