# 2026-03-12 Bug Fix: Tailwind CSS v4 PostCSS Error

## Goal
Resolve the error: "tailwindcss directly as a PostCSS plugin" encountered after project initialization.

## Changes
- **Dependencies:**
    - Installed `@tailwindcss/postcss` (required for Tailwind v4 with PostCSS).
- **Configurations:**
    - Updated `postcss.config.mjs` to use `@tailwindcss/postcss` instead of `tailwindcss`.
    - Updated `app/globals.css` to use the new CSS-first Tailwind v4 `@import "tailwindcss";` directive.

## Outcome
The project now correctly compiles Tailwind CSS styles using the v4 engine, and the Next.js development server should start without PostCSS errors.

## Next Steps
- Continue with CSV parsing logic or Dashboard UI.
