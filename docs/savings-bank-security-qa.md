# Savings Bank Security Verification

## Scope

Migrations `20260903074254`, `20260909003859` and `20260909004057` introduce restricted public/parent RPCs and staff-only ledger mutations. They are already applied to production. Never run all pending migrations blindly in a dirty worktree.

## Automated Checks

- `node scripts/test-savings-bank-security.mjs`: static contracts, public field allowlist and server-confirmed balances.
- `node scripts/test-savings-statement.mjs`: statement calculation, date ranges and CSV escaping.
- `node scripts/test-savings-bank-sql.mjs`: executes migrations 045, 046, 103 and 493 against an isolated PGlite database with synthetic records and explicit Supabase-style grants.
- SQL test dependency: PGlite 0.3.10. Install in a scratch directory with pnpm, then set `SAVINGS_PGLITE_MODULE` to its absolute `dist/index.js` path. The SQL runner never connects to production.
- SQL cases cover exact/over withdrawals, fractional/zero/NaN amounts, backdated edit/delete recomputation, rollback on negative historical balances, direct DML denial, anonymous table/view denial, public field minimization, scoped lookup, and parent cross-student denial.

## Remaining Release Checks

Release check on 2026-09-09: isolated SQL tests, statement tests, static contracts, production build and live HTTP status passed. Targeted ESLint had zero errors. Full-project TypeScript checking remains blocked by unrelated baseline errors. Browser automation was unavailable.

- PGlite is single-connection: it cannot verify PostgreSQL multi-session advisory-lock contention or deadlock behavior.
- Local Supabase/Docker is unavailable. Full local migrations and locally regenerated types remain unverified.
- Verify production migration, schema/type alignment and Supabase advisors separately before claiming deployment complete.
- Authenticated staff/parent browser checks, desktop/mobile PDF printing, continuous QR/camera and Thai speech require real authorized sessions/devices.
- Student-code lookup remains intentionally public and is not strong identity verification. Anyone who knows a code can access its lookup; this change does not audit unrelated student-code exposures elsewhere in the application.
- Existing summary-only backup restore and a complete admin hooks/RPC refactor are not verified by this release. Do not claim the entire original plan is complete.
