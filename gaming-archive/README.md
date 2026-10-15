# Gaming Archive: isolated regression harness

**Purpose:** safeguard the PSN identity resolution and Cloud readiness gate extracted from Gaming Archive v0.7.3 + identity fix. This directory is **not the complete application** and cannot deploy the Gaming Archive by itself.

## Provenance
- Vercel project: `gaming-archive-japa-psn`.
- Original reference: preview `dpl_7jd1uT1iGQEae6DSuMVcZjRL2pkN` (v0.7.3).
- Patched reference: preview `dpl_G1E7mniQzWo6JGMa9zx17ZdPRzgC`.
- `src/identity.mjs`: reference identity resolver with exact safe-integer fix.
- `src/cloud-config.mjs`: published Cloud feature gate; no private environment variable values copied.
- Tests use synthetic user IDs, fake tokens and synthetic Supabase URLs only.

## Run

Requires Node.js 22+ (built-in test runner; no npm dependencies):

```sh
node --check gaming-archive/src/identity.mjs
node --check gaming-archive/src/cloud-config.mjs
node --test gaming-archive/tests/*.test.mjs
```

## Verified here
- PSN account ID parsing and endpoint fallback never silently accept rounded numeric IDs.
- The Cloud API does not expose even public configuration while the `GA_CLOUD_READY` flag is absent.
- Cloud config input validation and POST rejection.

## Not covered (release blockers)
- Full application source: `index.html`, `cloud-sync.js`, PSN handler and IndexedDB logic are **not included**. The Vercel file API currently truncates large source responses.
- Backup **restoration** compatibility with Safari/iPhone and Cloud across devices.
- Real Sony account transitions using two PSN accounts.
- Real authenticated Supabase sessions (including OTP/refresh) and Playwright E2E.
- This repo is public and must never store NPSSO, Sony tokens, Supabase secrets, account backups or personal exports.

RLS policies were inspected and tested independently in Supabase using a rollback-only synthetic transaction. Those database tests are **not** rerun by the GitHub workflow.

**Deployment policy:** pass CI first, then check real browser tests and storage migration. Do not automatically promote preview to production or set `GA_CLOUD_READY=true`.
