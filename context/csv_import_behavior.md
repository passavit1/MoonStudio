# CSV Import Behavior & Data Update Logic

## Overview

The CSV import system allows partial and incremental data imports. Orders can be imported multiple times (e.g., mid-month with incomplete data, then again at month-end with completed status), and the system intelligently **updates existing orders** rather than creating duplicates.

## File: `app/api/import-tiktok/route.ts`

### Import Flow

1. **Scan Data Directory** (Lines 9-14)
   - Reads all `.csv` files from `/data` folder
   - If multiple CSV files exist, imports all of them

2. **Group by Order ID** (Lines 30-39)
   - Rows are grouped by `Order ID` (since one order can have multiple items)
   - Example: Order `583049006971717596` may appear 4 times in CSV = 4 items in 1 order

3. **Upsert (Create or Update)** (Lines 46-76)
   - Uses Prisma's `upsert()` to intelligently handle duplicates
   - **If order already exists**: Updates the order fields
   - **If order is new**: Creates a new order

4. **Item Refresh** (Lines 77-96)
   - Deletes all existing items for the order
   - Recreates items from the current CSV
   - Ensures item list is always current

---

## Upsert Behavior (Update Scenario)

### When You Replace & Re-import a CSV

**Scenario:**
- Mid-month: Download CSV with Order 1234, status = "Shipping"
- Import data → Order 1234 saved to database
- End-of-month: Download CSV again with Order 1234, status = "Shipped"
- Replace CSV file & import again → What happens?

**Answer: Order is UPDATED** ✅

**Old Data (Mid-Month):**
```
Database:
Order {
  externalOrderId: "1234"
  status: "Shipping"
}
```

**New Data (End-of-Month):**
```
Database (after re-import):
Order {
  externalOrderId: "1234"
  status: "Shipped"  ← UPDATED
}
```

### Fields That Are Updated

When an order is re-imported, these fields are updated (Lines 53-62):
```
- status              → From "Order Status" column
- subtotal            → Sum of all item subtotals
- shippingFee         → From "Shipping Fee" column
- orderAmount         → From "Order Amount" column
- buyerUsername       → From "Buyer Username" column
- province            → From "Province" column
- paymentMethod       → From "Payment Method" column
- createdTime         → From "Created Time" column
- paidTime            → From "Paid Time" column
```

**Fields that NEVER change:**
- `externalOrderId` (used as unique key)
- `platformId` (which platform it came from)

---

## Subtotal Calculation (IMPORTANT)

### How Order Subtotal is Calculated

**For Multi-Item Orders**, the subtotal is the **SUM of all items** (Lines 46-48):

```typescript
const itemSubtotal = orderRows.reduce((sum, row) => {
  return sum + parseCurrency(row["SKU Subtotal After Discount"]);
}, 0);
```

### Example

**CSV Data (One Order with 4 Items):**
```
Order ID | Product Name   | SKU Subtotal After Discount
1234     | Shark Clicker  | 59
1234     | Cake Clicker   | 59
1234     | Cat Keychain   | 39
1234     | Guava Squish   | 39
```

**Database Result:**
```
Order {
  externalOrderId: "1234"
  subtotal: 196  ← (59 + 59 + 39 + 39)
  items: [
    { productName: "Shark Clicker", subtotal: 59 },
    { productName: "Cake Clicker", subtotal: 59 },
    { productName: "Cat Keychain", subtotal: 39 },
    { productName: "Guava Squish", subtotal: 39 }
  ]
}
```

**Individual item subtotals are always correct.** The order-level subtotal is the **sum of all items**, ensuring dashboard revenue metrics are accurate.

---

## Order Items Replacement

**Important:** When an order is re-imported, **all items are deleted and recreated** (Lines 77-96):

```typescript
// Delete existing items for this order
await prisma.orderItem.deleteMany({
  where: { orderId: order.id }
});

// Create new items from CSV
for (const itemRow of orderRows) {
  await prisma.orderItem.create({...});
}
```

### Implication

If the CSV changes (items added/removed/modified), the database items will reflect the latest CSV state. This ensures consistency.

**Example:**
- Mid-month CSV: Order 1234 has items [A, B]
- Import → Database: Order 1234 has items [A, B]
- End-month CSV: Order 1234 has items [A, B, C] (new item C added)
- Re-import → Database: Order 1234 has items [A, B, C] ✓

---

## Workflow: Incremental Monthly Imports

### Typical Use Case

1. **March 15 (Mid-Month)**
   - Download TikTok CSV → contains all March orders (some incomplete)
   - Save to `data/2026-03.csv`
   - Click "Import Data" → creates 500 orders

2. **March 31 (Month-End)**
   - Download TikTok CSV again → contains complete March orders (all statuses final)
   - Replace `data/2026-03.csv` with new file
   - Click "Import Data" → updates all 500 orders with final status

3. **April 1**
   - Download April CSV → contains April orders only
   - Save to `data/2026-04.csv`
   - Click "Import Data" → creates new April orders (doesn't affect March)

### Why This Works

- **Unique Key:** `Order ID` (from platform) is the unique identifier
- **Upsert Logic:** Same Order ID = update, new Order ID = create
- **No Manual Management:** No need to delete old data or manage duplicates

---

## Supported Platforms

### TikTok Shop ✅
- **Implementation:** Fully implemented in `app/api/import-tiktok/route.ts`
- **CSV Format:** Standard TikTok Shop export
- **Key Field:** `Order ID`

### Shopee ⏳
- **Status:** Pending (awaiting sample CSV)
- **Will require:** Similar upsert logic, field mapping for Shopee-specific columns

### Lazada ⏳
- **Status:** Pending (awaiting sample CSV)
- **Will require:** Similar upsert logic, field mapping for Lazada-specific columns

---

## Edge Cases & Considerations

### Multiple CSV Files in `/data`

If multiple CSV files exist (e.g., `2026-03.csv` and `2026-04.csv`):
- All are imported in one operation
- Orders are deduplicated by `externalOrderId` across all files
- Safe to keep monthly CSV files in the folder

### Income Files (XLSX Format)

Income/settlement files (named like `income-2026-01.xlsx`) are also processed automatically:
- Parsed from the "Order details" sheet
- `Order/adjustment ID` column is matched against existing orders' `externalOrderId`
- `Total settlement amount` is stored in Order.settlementAmount
- Non-matching orders are silently skipped (common for partial months)

**Import Flow:**
1. All sales CSV/XLSX files are imported/updated
2. All income XLSX files are processed to update settlement amounts
3. Results include both sales imports and settlement updates

### Empty CSV Files

- Ignored (no rows to process)
- No error thrown

### Partial Data in Early Imports

- Works fine! Import early with incomplete orders
- Re-import with completed orders later
- Status fields will be updated, items will be refreshed

---

## Future Enhancement Ideas

1. **Selective Re-import:** Allow users to choose which platforms/months to re-import
2. **Import Audit Log:** Track when each order was last updated and from which CSV
3. **Conflict Resolution:** Handle cases where CSV data contradicts existing database (e.g., revenue changed)
4. **Validation:** Warn user if order subtotal in CSV doesn't match item sum
