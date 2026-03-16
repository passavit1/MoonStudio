# Failed Shipments Tracking Feature

## Overview
This feature tracks orders that were cancelled or returned **after being shipped**. These are considered "failed shipments" because the product was already sent to the customer but then the order was cancelled or returned.

## Purpose
- **Identify problematic shipments:** Track which orders were shipped but later cancelled/returned
- **Monitor monthly trends:** See how many failed shipments occur each month
- **Quick identification:** View order IDs for failed shipments to investigate issues

## Key Metrics

### 1. Total Failed Shipments
- **Definition:** Total count of all orders with BOTH a cancellation/return type AND a shipped time
- **Location:** Chart summary, left stat box
- **Calculation:** Sum of all failed shipments across all months
- **Example:** If you have 5 failed shipments total, it displays "5"

### 2. Failed Shipments This Month
- **Definition:** Count of failed shipments created in the current calendar month
- **Location:** Chart summary, right stat box
- **Calculation:** Filters for orders where `createdTime` falls within the current month (1st to last day)
- **Example:** If today is March 16, 2026, it counts all failed shipments created from March 1-16, 2026

## Data Requirements
An order is counted as a "failed shipment" if it has:
- ✅ `cancelationType` is NOT null (order was cancelled or returned)
- ✅ `shippedTime` is NOT null (order was already shipped)

Both conditions must be true. Orders without either field are not counted.

## Implementation Details

### Files Involved
1. **`lib/analytics.ts`**
   - `getCancelledOrdersByMonth()` - Groups failed shipments by month for chart display
   - `getCurrentMonthFailedShipments()` - Counts failed shipments in current month

2. **`components/CancelledOrdersChart.tsx`**
   - Displays both metrics in the summary stats section
   - Shows bar chart of failed shipments by month
   - Modal to view order IDs for each month

3. **`app/page.tsx`**
   - Calls analytics functions and passes data to component

### Date Format Handling
- **CSV Format:** `DD/MM/YYYY HH:MM:SS` (e.g., "01/03/2026 21:15:58")
- **Parser:** `parseTikTokDate()` in `lib/csv-parser.ts`
- **Smart Detection:** Automatically handles dates with or without time component
  - `01/03/2026 21:15:58` ✅ With time
  - `01/03/2026` ✅ Without time (defaults to 00:00:00)

### Month Grouping Logic
- Uses `createdTime` to determine which month an order belongs to
- Groups by calendar month (Jan, Feb, Mar, etc.) and year
- Chart displays months chronologically (oldest to newest)

## Example Scenario
```
Order 1:
- Created: 01/03/2026 (March 1st)
- Shipped: 02/03/2026 (March 2nd)
- Cancelled: Yes
→ Counted in March failed shipments

Order 2:
- Created: 15/02/2026 (February 15th)
- Shipped: 20/02/2026 (February 20th)
- Cancelled: Yes
→ Counted in February failed shipments

Dashboard shows:
- Total Failed Shipments: 2
- Failed Shipments This Month: 1 (if current month is March)
- Chart: February (1), March (1)
```

## CSV Column Names
The import expects these columns from TikTok CSV:
- `Created Time` - When the order was created
- `Cancelation/Return Type` - Type of cancellation (any non-null value counts)
- `Shipped Time` - When the order was shipped

## Future Enhancements
- Filter failed shipments by cancellation type (Cancel vs Return)
- Show customer information for failed shipments
- Track refund status for returned items
- Analyze reasons for shipment failures
