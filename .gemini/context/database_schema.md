# Database Schema

## Overview
The database supports **multi-item orders** where a single Order ID can contain multiple products/SKUs.

## Data Model

### Platform
```
id        Int      (Primary Key)
name      String   @unique ("TikTok", "Shopee", "Lazada")
createdAt DateTime
updatedAt DateTime
```

### Order (1-to-Many with OrderItem)
```
id              Int         (Primary Key)
platformId      Int         (Foreign Key → Platform.id)
externalOrderId String      @unique (Order ID from CSV)
status          String      (e.g., "Completed", "Cancelled", "To Ship")
subtotal        Float       (Total from all items)
shippingFee     Float       (Shipping cost)
orderAmount     Float       (Total order value after discounts)
buyerUsername   String?
province        String?
paymentMethod   String?
createdTime     DateTime?   (When order was placed)
paidTime        DateTime?   (When payment was received)
items           OrderItem[] (All items in this order)
createdAt       DateTime
updatedAt       DateTime
```

### OrderItem (Many items per Order)
```
id              Int      (Primary Key)
orderId         Int      (Foreign Key → Order.id)
skuId           String?  (Product SKU from platform)
productName     String   (Product name)
variation       String?  (Product variation/option)
quantity        Int      (Units ordered - default 1)
originalPrice   Float    (Unit price before discount)
platformDiscount Float   (Platform discount per item)
sellerDiscount   Float   (Seller discount per item)
subtotal        Float    (Total price for this item after discounts)
createdAt       DateTime
updatedAt       DateTime
```

## Multi-Item Order Support

### ✅ Yes, Multiple Items Per Order Are Fully Supported

**Data Structure:**
- One Order record = One unique Order ID from CSV
- Multiple OrderItem records = Each row with that Order ID in the CSV

**Example:**
If your CSV has:
```
Order ID        | Product Name      | SKU ID | Quantity | Subtotal
583049006971717596 | Shark Clicker    | 1734618455... | 1 | 59
583049006971717596 | Cake Clicker     | 1733371030... | 1 | 59
583049006971717596 | Cat Keychain     | 1731997074... | 1 | 39
583049006971717596 | Guava Squish     | 1733636959... | 1 | 39
```

**Database Result:**
```
Order {
  externalOrderId: "583049006971717596"
  subtotal: 196 (59 + 59 + 39 + 39)
  items: [
    { productName: "Shark Clicker", subtotal: 59 },
    { productName: "Cake Clicker", subtotal: 59 },
    { productName: "Cat Keychain", subtotal: 39 },
    { productName: "Guava Squish", subtotal: 39 }
  ]
}
```

### How Import Process Handles Duplicates

**File:** `app/api/import-tiktok/route.ts`

1. **Group by Order ID** (Lines 30-39):
   - Reads all CSV rows
   - Groups rows by `Order ID` into a Map
   - One Order ID = multiple rows if multi-item order

2. **Create One Order** (Lines 41-72):
   - For each unique Order ID, create ONE Order record
   - Data from first row (order status, payment method, etc.)

3. **Create Multiple Items** (Lines 76-96):
   - For each row with that Order ID, create ONE OrderItem record
   - Each item has own: SKU ID, product name, variation, quantity, pricing

## Sample Data Stats

From `data/2026-03.csv`:
- Order ID `582854074808435930`: 32 items (largest order)
- Order ID `583026030902150660`: 6 items
- Order ID `582945190975669634`: 5 items
- Many orders with 3-4 items
- Some single-item orders

**All are handled correctly by the current schema.**

## Platform-Specific Notes

### TikTok
- **Field:** "Order ID" (Column 1)
- **Duplicate handling:** Already implemented ✅
- **Data mapping:** See `data_processing.md`

### Shopee (Pending)
- Awaiting sample CSV
- Will need similar Order/OrderItem structure
- Update field mapping in `data_processing.md` when available

### Lazada (Pending)
- Awaiting sample CSV
- Will need similar Order/OrderItem structure
- Update field mapping in `data_processing.md` when available
