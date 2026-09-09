# Savings Bank Security Verification

## Scope

Migration 493 introduces restricted public/parent RPCs and staff-only ledger mutations. It must be applied before publishing the corresponding frontend. Never run all pending migrations blindly in a dirty worktree.

## Automated Checks

- `node scripts/test-savings-bank-security.mjs`: static contracts, public field allowlist and server-confirmed balances.
- `node scripts/test-savings-statement.mjs`: statement calculation, date ranges and CSV escaping.
- `node scripts/test-savings-bank-sql.mjs`: executes migrations 045, 046, 103 and 493 against an isolated PGlite database with synthetic records and explicit Supabase-style grants.
- SQL test dependency: PGlite 0.3.10. Install in a scratch directory with pnpm, then set `SAVINGS_PGLITE_MODULE` to its absolute `dist/index.js` path. The SQL runner never connects to production.
- SQL cases cover exact/over withdrawals, fractional/zero/NaN amounts, backdated edit/delete recomputation, rollback on negative historical balances, direct DML denial, anonymous table/view denial, public field minimization, scoped lookup, and parent cross-student denial.

## Remaining Release Checks

Pre-push check on 2026-09-03: isolated SQL tests, statement tests, static contracts and production build passed. Targeted ESLint had zero errors and two hook warnings. Full-project TypeScript checking failed, including the existing summary-only backup reference to the nonexistent `savings_summaries` table. Browser verification was not completed (`agent-browser` unavailable). No commit, push or production migration was performed; production migration authorization was requested separately.

- PGlite is single-connection: it cannot verify PostgreSQL multi-session advisory-lock contention or deadlock behavior.
- Local Supabase/Docker is unavailable. Full local migrations and locally regenerated types remain unverified.
- Verify production migration, schema/type alignment and Supabase advisors separately before claiming deployment complete.
- Authenticated staff/parent browser checks, desktop/mobile PDF printing, continuous QR/camera and Thai speech require real authorized sessions/devices.
- Student-code lookup remains intentionally public and is not strong identity verification. Anyone who knows a code can access its lookup; this change does not audit unrelated student-code exposures elsewhere in the application.
- Existing summary-only backup restore and a complete admin hooks/RPC refactor are not verified by this release. Do not claim the entire original plan is complete.
