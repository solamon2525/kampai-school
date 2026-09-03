# Savings student statement — verification 2026-09-03

Status: user requested release of the implemented feature after disclosure of the existing permission issue. This release does not change database permissions; cross-role privacy remains an unresolved pre-existing issue, not a passed acceptance check. Deployment and live smoke results are reported in the delivery message.

## Passed

- `node scripts/test-savings-statement.mjs`: satang-safe cumulative balances, backdated input ordering, inclusive dates, empty history/period, CSV formula neutralization, student-ID query filter, stable 1,051-row pagination, mismatch rejection and failed second-page rejection.
- Targeted ESLint: StudentStatementDialog, StudentSummaryTab, savings-statement utility and savings service.
- Production Vite build and git diff whitespace check.
- TypeScript app check has existing errors elsewhere; after fixes, none match StudentStatementDialog, StudentSummaryTab, savings-statement or savings.service.
- Real Chrome against local HTTP component fixture at 360×800 and 1280×720: dialog fits viewport, mobile cards/desktop table, 50-row screen pagination. Date input also handles input events for native date controls.
- Date filter 2026-09-01: 1,050 of 1,051 fixture transactions, opening balance 1, closing/current 1,051. Print preview contains all 1,050 table rows and no script nodes from untrusted notes. CSV download action exercised; downloaded-file bytes not inspected.
- Empty date range shows empty state. Simulated query denial displays retry, no zero balance, and disabled export. No real transactions were created or changed. Temporary local fixture files removed after verification.

## Existing production permissions requiring follow-up (P1)

Read-only metadata checks on project `lkpqssbqxxpasidfqhpb` confirmed:

- `public.savings_transactions`: RLS enabled, but SELECT policy `public_read_savings_transactions` applies to public with `USING (true)`.
- `anon` has SELECT privileges on both savings_transactions and savings_student_summary.
- savings_student_summary has no security_invoker option.

This means hiding the admin page does not protect the underlying financial data. No financial rows were queried anonymously. Fixing this requires a separately authorized policy/view/RPC compatibility review, including parent history, student lookup and public leaderboard. Do not remove permissions blindly, or those existing flows may regress.

## Not yet verified / released

- Cross-role privacy acceptance cannot pass with the current production policies.
- End-to-end new admin detail with live service responses and post-deployment smoke are pending; existing production admin page opens in the signed-in browser.
- Native print-to-PDF output and downloaded CSV bytes still need final inspection.
- Full-project TypeScript is not clean; unrelated baseline errors were not changed.

Documentation included in DESIGN-COMPONENTS.md and SystemOverview v1.229.24.
