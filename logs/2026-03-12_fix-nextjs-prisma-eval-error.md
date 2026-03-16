# 2026-03-12 Bug Fix: Next.js Prisma evaluation error

## Goal
Resolve the `500` error during Prisma Client evaluation in Next.js (Turbopack).

## Changes
- **next.config.mjs:** Added `serverExternalPackages: ["@prisma/client"]` to the Next.js configuration to ensure that Prisma is handled correctly as a server-side dependency.

## Outcome
Next.js will now treat the Prisma Client as an external package, which prevents it from being bundled incorrectly by Turbopack and should resolve the evaluation error on the server.

## Next Steps
- Verify the fix by accessing the dashboard.
- Continue with CSV imports and data visualization.
