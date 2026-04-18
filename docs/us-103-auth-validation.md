# US-103 Auth Validation

Date: 2026-04-18
Environment: `localhost`
Base URL: `http://localhost:3000`

## Status

Localhost auth validation passed.
Vercel validation is pending `US-104`.

## Scenarios

1. Unauthenticated user opens `/dashboard`
   - Result: `PASS`
   - Observed: `307` redirect to `/sign-in`

2. Magic link sign-in completes and lands on `/dashboard`
   - Result: `PASS`
   - Observed: server-side auth confirmation returned `307` to `/dashboard`
   - Observed: auth cookie `sb-<project>-auth-token` was written

3. Refresh `/dashboard` after sign-in
   - Result: `PASS`
   - Observed: repeated authenticated requests to `/dashboard` returned `200`

4. Logout clears the session and redirects to `/sign-in`
   - Result: `PASS`
   - Observed: logout server action returned `303` to `/sign-in`
   - Observed: auth cookie was cleared with `Max-Age=0`

5. Open `/dashboard` after logout
   - Result: `PASS`
   - Observed: `307` redirect to `/sign-in`

## Notes

- Auth was validated using a generated Supabase magic-link token and a local cookie jar.
- `npm run lint` passed.
- `npm run build` passed.
- `Vercel` preview validation should be executed after `US-104` is ready.
