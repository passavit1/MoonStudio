# Data Processing Specs

## Important: Multi-Item Order Handling

⚠️ **One Order ID can appear multiple times in the CSV** (one row per item/SKU in the order).

Example: Order ID `583049006971717596` appears 4 times = 1 order with 4 different items.

**Status:** ✅ **Fully supported by current implementation**
- Stored as 1 Order record with multiple OrderItem records
- See `database_schema.md` for details

## TikTok Shop (Standard CSV)
- **Source File:** `data/*.csv` (TikTok format).
- **Key Fields Mapping:**
    - `Order ID` -> Unique Identifier (may repeat for multi-item orders).
    - `SKU Subtotal After Discount` -> Revenue per item.
    - `Created Time` -> Sales Date.
    - `Order Status` -> Filter for "Completed" vs "Cancelled".

## Shopee (Pending)
*To be defined once sample data is provided.*

## Lazada (Pending)
*To be defined once sample data is provided.*
