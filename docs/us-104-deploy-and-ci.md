# US-104 Deploy And CI

Date: 2026-04-18
Status: Almost complete

## Goal

Finish the first preview deployment pipeline for `generator-publisher` and make the repo ready for repeatable validation.

## Scope

1. Create GitHub repository and push the project.
2. Connect the repo to `Vercel`.
3. Configure environment variables in `Vercel`.
4. Add the `Vercel` URL to Supabase Auth URL configuration.
5. Add CI for pull requests and `main`.
6. Validate the deployed auth flow manually.

## Acceptance Criteria

- The app opens on a `Vercel` preview URL.
- Magic link auth works on the deployed URL.
- GitHub Actions CI runs on pull requests.
- `localhost` and preview deployment use the same auth callback pattern.

## Repo Changes Included In This Task

- Added `typecheck` script.
- Added GitHub Actions workflow for lint, typecheck, and build.
- Expanded `.env.example` for current Sprint 1 requirements.

## Current Result

- Preview deployment path is working.
- `Vercel` project created: `generator-publisher`
- Active deployment URL: `https://generator-publisher-jr02nhdan-dmitriys-projects-46d420d9.vercel.app`
- Stable alias: `https://generator-publisher.vercel.app`
- Production env vars were added to the Vercel project.
- Production redeploy succeeded after temporarily removing local `.env.local` from the deploy step.
- Local `lint`, `typecheck`, and `build` are green.

## External Steps Still Required

- Create or connect the GitHub repository.
- Push the current branch history to GitHub so GitHub Actions can run on pull requests.
- Add the stable Vercel domain to Supabase Auth redirect settings.
- Optionally add preview env vars after Git integration is connected, if branch previews are required.

## Important Notes

- The first deployment succeeded because `Vercel` detected the local `.env.local` file during CLI deploy.
- A second deployment was completed after removing `.env.local` from the deploy command, which confirms the production deployment now works from Vercel project env vars.
- Vercel preview env vars still require Git branch context and should be added after GitHub integration is connected.

## Manual Validation After US-104

1. Open the preview URL.
   Expected: app loads without server error.

2. Open `/dashboard` in an incognito session.
   Expected: redirect to `/sign-in`.

3. Submit an email on `/sign-in`.
   Expected: success state says the magic link email was sent.

4. Click the magic link from the email.
   Expected: redirect back to the preview deployment and land on `/dashboard`.

5. Refresh `/dashboard`.
   Expected: session persists and user stays authenticated.

6. Click logout in the sidebar.
   Expected: redirect to `/sign-in`.

7. Open `/dashboard` again after logout.
   Expected: redirect to `/sign-in`.

8. Open the latest GitHub Actions run for the branch or PR.
   Expected: lint, typecheck, and build are all green.

## Supabase Auth Settings To Add

- Site URL: `https://generator-publisher.vercel.app`
- Redirect URL: `https://generator-publisher.vercel.app/auth/callback`
