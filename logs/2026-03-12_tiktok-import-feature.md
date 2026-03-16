# 2026-03-12 Feature: TikTok CSV Import & Dashboard Data

## Goal
Enable parsing of TikTok CSV files and display real sales metrics on the dashboard.

## Changes
- **Backend Logic:**
    - Created `lib/prisma.ts` for database access.
    - Created `lib/csv-parser.ts` to handle TikTok-specific CSV formatting and data conversion (dates, currency).
    - Created `lib/analytics.ts` to compute dashboard summaries (Revenue, Orders, Top Products).
- **API:**
    - Implemented `app/api/import-tiktok/route.ts` to process files from the `data/` directory and upsert them into the database.
- **Frontend:**
    - Created `components/ImportButton.tsx` for a client-side trigger with status feedback.
    - Updated `app/page.tsx` to fetch and display real data from the database.
    - Designed a clean, modern dashboard layout using Tailwind CSS.

## Outcome
The user can now click "Import TikTok Data" to process their CSV files. The dashboard immediately updates to show total revenue, order count, unique products, and a table of top-selling items.

## Next Steps
- Add support for Shopee and Lazada CSV formats.
- Implement more detailed charts (e.g., daily sales trends).
- Add filters for date ranges or specific platforms.
