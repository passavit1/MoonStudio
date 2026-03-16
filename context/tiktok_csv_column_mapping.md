# TikTok CSV Column Mapping

## Overview
Complete mapping of TikTok Shop CSV columns to SQLite database tables. This document tracks:
- Which columns are currently imported
- Which database fields they map to
- Financial calculations
- Data not yet tracked (for future implementation)

---

## CSV Structure

**File Location:** `/data/*.csv` (e.g., `2026-03.csv`)

**One Order = Multiple CSV Rows** if it contains multiple items
- Example: Order ID `583049006971717596` appears 4 times (4 items in 1 order)
- System groups by Order ID and creates: 1 Order record + 4 OrderItem records

---

## Order-Level Mapping

Data taken from **first row** of each Order ID group.

| # | CSV Column | DB Field | Data Type | Currently Used | Notes |
|---|---|---|---|---|---|
| 1 | `Order ID` | `externalOrderId` | String | ✅ | Unique identifier |
| 2 | `Order Status` | `status` | String | ✅ | e.g., "ที่จะจัดส่ง", "เสร็จสมบูรณ์", "ยกเลิกแล้ว" |
| 3 | `Order Substatus` | - | String | ❌ | Not imported |
| 4 | `Cancelation/Return Type` | `cancelationType` | String | ✅ | Reason for cancellation |
| 5 | `Normal or Pre-order` | - | String | ❌ | Not imported |
| 23 | `Created Time` | `createdTime` | DateTime | ✅ | When order was placed |
| 24 | `Paid Time` | `paidTime` | DateTime | ✅ | When payment was received |
| 25 | `Shipped Time` | `shippedTime` | DateTime | ✅ | When order shipped |
| 26 | `RTS Time` | - | DateTime | ❌ | Return to Seller time |
| 27 | `Delivered Time` | - | DateTime | ❌ | Delivery confirmation time |
| 28 | `Cancelled Time` | - | DateTime | ❌ | When order was cancelled |
| 30 | `Buyer Username` | `buyerUsername` | String | ✅ | Customer username |
| 31 | `Province` | `province` | String | ✅ | Shipping province |
| 35 | `Payment Method` | `paymentMethod` | String | ✅ | Payment type (e.g., "Mbanking", "PromptPay", "บัตรเครดิต/เดบิต") |
| 36 | `Fulfillment Type` | - | String | ❌ | "Fulfillment by seller" vs "Fulfillment by TikTok" |

---

## Financial Fields (Order Level)

### Order Amount - What Customer Paid
| Field | CSV Column | DB Field | Formula | Value |
|---|---|---|---|---|
| Total Customer Paid | `Order Amount` | `orderAmount` | ✅ Imported directly | 99 |

### Product Subtotal - Real Product Value
| Field | CSV Column | DB Field | Status | Notes |
|---|---|---|---|---|
| Sum Before Discount | `SKU Subtotal Before Discount` | `subtotalBeforeDiscount` (TODO) | ❌ Not yet imported | **Real product value** (sum of all items) |
| Sum After Discount | `SKU Subtotal After Discount` | `subtotal` | ✅ Currently used | What customer sees (sum of all items) |

### Shipping Fee - 4 Columns
| Column | Value | DB Field | Currently Used | Formula |
|---|---|---|---|---|
| `Original Shipping Fee` | 38 | - | ❌ | Base shipping cost |
| `Shipping Fee Seller Discount` | 0 | - | ❌ | Seller's discount on shipping |
| `Shipping Fee Platform Discount` | 38 | - | ❌ | Platform's discount on shipping |
| `Shipping Fee After Discount` | 0 | `shippingFee` | ✅ | = Original - Seller Discount - Platform Discount |

**Currently imported:** Only `Shipping Fee After Discount`

### Other Financial Fields (Not Yet Tracked)
| CSV Column | Status | Notes |
|---|---|---|
| `SKU Platform Discount` | ❌ | TikTok commission (per item) |
| `SKU Seller Discount` | ❌ | Seller's discount (per item) |
| `Payment platform discount` | ❌ | Payment processing fees |
| `Small Order Fee` | ❌ | Fee for orders below minimum value |
| `Taxes` | ❌ | Tax amount |
| `Order Refund Amount` | ❌ | Refunded amount (if cancelled) |

---

## Item-Level Mapping (OrderItem Table)

Each CSV row with unique Order ID = 1 OrderItem record.

| # | CSV Column | DB Field | Data Type | Currently Used | Notes |
|---|---|---|---|---|---|
| 6 | `SKU ID` | `skuId` | String | ✅ | Product identifier |
| 8 | `Product Name` | `productName` | String | ✅ | Item name |
| 9 | `Variation` | `variation` | String | ✅ | Size/color/option |
| 10 | `Quantity` | `quantity` | Int | ✅ | Units ordered |
| 11 | `Sku Quantity of return` | - | Int | ❌ | Quantity returned |
| 12 | `SKU Unit Original Price` | `originalPrice` | Float | ✅ | Price per unit (before discount) |
| 13 | `SKU Subtotal Before Discount` | - | Float | ❌ | Total item value (quantity × unit price) |
| 14 | `SKU Platform Discount` | `platformDiscount` | Float | ✅ | Platform commission per item |
| 15 | `SKU Seller Discount` | `sellerDiscount` | Float | ✅ | Seller discount per item |
| 16 | `SKU Subtotal After Discount` | `subtotal` | Float | ✅ | Final item price |

---

## Example: Order with 2 Items

### CSV Data
```
Order ID | Product Name | SKU Unit Original Price | SKU Subtotal Before Discount | SKU Platform Discount | SKU Subtotal After Discount | Order Amount
583049349183603960 | พวงกุญแจแผงไข่ | 119 | 119 | 20 | 99 | 130
583049349183603960 | น้องกองไฟ&น้ำหยด | 79 | 79 | 10 | 69 | 130
```

### Database Result
```
Order {
  externalOrderId: "583049349183603960"
  orderAmount: 130           ← Customer paid 130 (for both items)
  subtotal: 168              ← Sum of "SKU Subtotal After Discount" (99 + 69)
  subtotalBeforeDiscount: 198 ← Sum of "SKU Subtotal Before Discount" (119 + 79) - TODO
  items: [
    {
      productName: "พวงกุญแจแผงไข่",
      originalPrice: 119,
      platformDiscount: 20,
      subtotal: 99
    },
    {
      productName: "น้องกองไฟ&น้ำหยด",
      originalPrice: 79,
      platformDiscount: 10,
      subtotal: 69
    }
  ]
}
```

---

## Financial Summary Formula

For a single order with multiple items:

```
Real Product Value        = SUM(SKU Subtotal Before Discount) = 198
What Customer Paid        = Order Amount = 130
─────────────────────────────────────────────────────────────────
Difference (all discounts) = 198 - 130 = 68
  ├─ Platform Commissions = SUM(SKU Platform Discount) = 30
  ├─ Seller Discounts      = SUM(SKU Seller Discount) = 0
  ├─ Shipping Savings      = Varies
  ├─ Payment Fees          = Payment platform discount
  └─ Other Fees           = Small Order Fee, Taxes, etc.

What You Actually Received = TBD (from settlement CSV) ❌
```

---

## Current Import Implementation

**File:** `app/api/import-tiktok/route.ts`

### Order Calculation (Lines 46-72)
```typescript
// Subtotal = SUM of all items (After Discount)
const itemSubtotal = orderRows.reduce((sum, row) => {
  return sum + parseCurrency(row["SKU Subtotal After Discount"]);
}, 0);

// Order is created/updated with:
order.status = firstRow["Order Status"]
order.cancelationType = firstRow["Cancelation/Return Type"]
order.subtotal = itemSubtotal                                   // ✅ After Discount
order.subtotalBeforeDiscount = NOT SET YET                      // ❌ TODO
order.shippingFee = parseCurrency(firstRow["Shipping Fee After Discount"])
order.orderAmount = parseCurrency(firstRow["Order Amount"])
order.buyerUsername = firstRow["Buyer Username"]
order.province = firstRow["Province"]
order.paymentMethod = firstRow["Payment Method"]
order.createdTime = parseTikTokDate(firstRow["Created Time"])
order.paidTime = parseTikTokDate(firstRow["Paid Time"])
order.shippedTime = parseTikTokDate(firstRow["Shipped Time"])
```

### Item Creation (Lines 90-105)
```typescript
for (const itemRow of orderRows) {
  orderItem.skuId = itemRow["SKU ID"]
  orderItem.productName = itemRow["Product Name"]
  orderItem.variation = itemRow["Variation"]
  orderItem.quantity = parseInt(itemRow["Quantity"]) || 1
  orderItem.originalPrice = parseCurrency(itemRow["SKU Unit Original Price"])
  orderItem.platformDiscount = parseCurrency(itemRow["SKU Platform Discount"])
  orderItem.sellerDiscount = parseCurrency(itemRow["SKU Seller Discount"])
  orderItem.subtotal = parseCurrency(itemRow["SKU Subtotal After Discount"])
}
```

---

## To-Do / Future Implementation

### Phase 1: Capture Real Product Value (CURRENT)
- [ ] Add `subtotalBeforeDiscount` to Order schema
- [ ] Update import to calculate: `SUM(SKU Subtotal Before Discount)`
- [ ] Verify mapping matches CSV data

### Phase 2: Settlement/Payout Tracking (FUTURE)
- [ ] Create Settlement CSV import (from TikTok payout report)
- [ ] Add fields: `platformCommission`, `paymentFee`, `smallOrderFee`, `actualProceeds`
- [ ] Link Settlement records to Orders
- [ ] Dashboard: Real Value → Customer Paid → What You Received

### Phase 3: Multi-Platform (FUTURE)
- [ ] Define Shopee CSV column mapping
- [ ] Define Lazada CSV column mapping

---

## Testing Checklist

After implementation:
- [ ] Import sample CSV (`data/2026-03.csv`)
- [ ] Verify `subtotalBeforeDiscount` is calculated correctly for multi-item orders
- [ ] Confirm `orderAmount` matches CSV "Order Amount" column
- [ ] Check `subtotal` (After Discount) vs `subtotalBeforeDiscount` shows discount correctly
- [ ] Validate with at least 1 multi-item order (Order ID: `583049006971717596` has 4+ items)

