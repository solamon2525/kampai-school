# Auth readiness / Page Builder — verification 14 September 2026

Status: implemented locally, **not committed/pushed/deployed**. Base: `e7047a67` on main. Publication paused because repository-wide checks still fail; no unrelated fixes or database changes were made.

## Authorized scope

1. Wait for session, role and menu permissions before deciding protected-page access; never grant admin on a failed/missing role read.
2. Restrict `/admin/page-builder` to admin through the existing `PortalProtectedRoute allow={['admin']}` interface.

Game routes/rewrites, RLS, account roles and student data are unchanged. Existing dirty `vercel.json` and other unrelated work are excluded.

Pre-flight: existing generated user_roles/user_menu_permissions types; existing central guards; no equivalent role+menu service found; error view wraps the existing Button outside components/ui; installed Vite/Playwright support isolated browser fixtures without production access.

## Implementation

- QueryClientProvider now encloses AuthProvider; queries for role/menu execute outside the synchronous auth callback and go through auth-permissions.service.
- Loading covers session and both reads, including refresh. Errors keep the protected URL and show a Thai retry button. Missing menu row yields an empty allowlist; missing/invalid role or either read error denies privileged UI.
- User ID plus generation isolates old responses. Same-user SIGNED_IN/TOKEN_REFRESHED/USER_UPDATED and realtime changes revalidate permissions; cached roles are not exposed while loading/error.
- Role/menu reads have cancellation and a 20-second abort deadline; session initialization has a 20-second error deadline. Actual network timeout/cancellation behavior was not exercised by the synthetic boundary, which deliberately permits late responses to test stale-result isolation.
- Documentation updated: DESIGN.md, DESIGN-COMPONENTS.md, versionHistory v1.229.54 (not yet released).

## Fresh results

| Check | Result |
|---|---|
| `node scripts/test-auth-readiness.mjs` | PASS 24 cases |
| `node scripts/test-teacher-conduct-access.mjs` | PASS 24 role/context/viewport cases; teacher access regression preserved |
| `pnpm build` | PASS; existing unresolved /grid.svg and large-chunk warnings |
| TypeScript restricted to auth files plus vite-env.d.ts | PASS, 0 errors |
| Whole-project TypeScript | FAIL, 181 diagnostics; baseline also 181. No diagnostics in changed auth/App/main files |
| ESLint auth/guards/main/SystemOverview | 0 errors; one existing Fast Refresh export warning in AuthProvider |
| ESLint App.tsx | FAIL: existing no-explicit-any in lazyWithRetry. Kept unchanged to avoid unrelated work |
| `git diff --check` | PASS |
| Read-only reviewer | Same-user refresh issue identified, regression reproduced, fixed and re-reviewed with no remaining objection on that issue |

The first browser run reproduced the old early-loading/fallback-admin failures. A separate new same-user refresh test failed before its fix and passes afterward. The auth test executes the real provider, service and guards; it extracts and executes the actual Page Builder route registration from App, with an inert editor body. Settings uses a small menu-guard fixture. Two additional cases boot the real main.tsx/App as anonymous and verify the editor URL redirects to login while preserving the return URL.

All browser tests run over localhost HTTP at 360×800 and 1280×720. Synthetic sessions/database results are used, all external requests are intercepted, and no real account is impersonated. These results do not certify server-side RLS or saving content as an admin. No production mutations were attempted.

## Screenshots

- [Error/retry mobile](../../output/auth-readiness/error-360.png)
- [Error/retry desktop](../../output/auth-readiness/error-1280.png)
- [Real app anonymous mobile](../../output/auth-readiness/app-anonymous-360.png)
- [Real app anonymous desktop](../../output/auth-readiness/app-anonymous-1280.png)

The snapshots use synthetic/no personal data. Publication requires explicit direction accepting the pre-existing TypeScript/lint failures, or a separately authorized repair of those failures. Do not silently broaden this task to fix 181 existing diagnostics.
