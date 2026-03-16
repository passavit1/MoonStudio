# Products Sales Feature Documentation

## Overview
The **Products Sales** feature is a detailed product analytics page that displays how many units of each product were sold across all platforms. It allows users to view products grouped by name with expandable variation details.

## Feature Purpose
- **Track product performance** by viewing total units sold per product
- **Analyze variations** of the same product (e.g., different colors, sizes, options)
- **Search & filter** products by name
- **View revenue** breakdown per product and variation

## Related Feature Roadmap
This feature is part of **Phase 3: Advanced Analytics** in the roadmap:
- `[x]` Product variation performance (IMPLEMENTED)
- `[ ]` Monthly growth trends
- `[ ]` Profit margin calculator

## File Structure

### Frontend Files
```
app/
├── products/
│   └── page.tsx          # Products sales page (client component)
└── page.tsx              # Dashboard (has "View Products" navigation button)
```

### Backend Files
```
app/api/
└── products/
    └── route.ts          # API endpoint to fetch product sales data

lib/
└── analytics.ts          # Analytics functions (includes getAllProductsSales)
```

## Key Features

### 1. **Product Grouping**
- Products with the same name are automatically grouped together
- Sum of all variations' units sold is displayed as the product total
- Sum of all variations' revenue is displayed as the product total

### 2. **Alphabetical Sorting**
- Variations are sorted alphabetically (A-Z) using Thai locale support
- Uses `localeCompare(varB, 'th')` for proper Thai text sorting
- Products are sorted by total units sold (highest first)

### 3. **Expand/Collapse UI**
- Click on a product row to expand and see variations
- Chevron icon rotates to indicate expanded state
- Shows count of available variations (e.g., "2 options")

### 4. **Column Alignment**
- Desktop view: Fixed column widths for proper alignment
  - Product Name: `flex-1` (takes remaining space)
  - Units: `w-24` (fixed width)
  - Revenue: `w-32` (fixed width)
- Mobile view: Compact layout with stacked information

### 5. **Search Functionality**
- Filter products by name (case-insensitive)
- Updates summary stats based on filtered results
- Does not search variations in the main filter (variations shown when expanded)

## Data Flow

### API Flow: `/api/products`
```
Client Request (GET /api/products)
    ↓
getAllProductsSales() in lib/analytics.ts
    ↓
Database Query (Prisma groupBy on OrderItem)
    ↓
Group by productName + variation
    ↓
Sum quantity (unitsSold) and subtotal (totalRevenue)
    ↓
Map to clean format
    ↓
Return JSON response
    ↓
Client receives raw product + variation data
```

### Frontend Grouping Flow:
```
Raw API Data (variation-level)
    ↓
Group by product name (Map)
    ↓
Sort variations alphabetically (Thai locale)
    ↓
Calculate totals per product
    ↓
Sort products by total units
    ↓
Display in UI
```

## Component Structure

### Products Page (`app/products/page.tsx`)

**State Variables:**
- `products`: Grouped and sorted products data
- `filteredProducts`: Products after search filter
- `expandedProducts`: Set of product names currently expanded
- `searchTerm`: Current search input value
- `loading`: Loading state

**Key Functions:**
- `toggleExpand(productName)`: Toggle product expansion state
- `fetchProducts()`: Fetch data from `/api/products` API and group them

**UI Sections:**
1. **Header**: Page title with back button to dashboard
2. **Summary Stats**: Total units sold and total revenue (filtered)
3. **Search Bar**: Filter products by name
4. **Products List**:
   - Header row with column labels (desktop only)
   - Product rows with expand button
   - Mobile summary (below product row on small screens)
5. **Variations Section** (when expanded):
   - Variation header row with column labels
   - List of variations with units and revenue

## Database Schema Used

The feature uses the following Prisma models:
```prisma
model OrderItem {
  id              Int      @id @default(autoincrement())
  productName     String   // Product name (grouped by this)
  variation       String?  // Variation option (e.g., "เสียงคลิก (สวิตซ์ฟ้า)")
  quantity        Int      // Units sold (summed in API)
  subtotal        Float    // Price (summed as revenue in API)
  ...
}
```

## API Endpoint

### GET `/api/products`

**Response Format:**
```json
[
  {
    "name": "พวงกุญแจซาลาเปา Clicker กดได้...",
    "variation": "เสียงคลิก(สวิตซ์ฟ้า)",
    "unitsSold": 150,
    "totalRevenue": 2250.50
  },
  {
    "name": "พวงกุญแจซาลาเปา Clicker กดได้...",
    "variation": "เสียงเบา(สวิตซ์แดง)",
    "unitsSold": 120,
    "totalRevenue": 1800.00
  }
  ...
]
```

**Implementation:** `app/api/products/route.ts`

## UI/UX Design Details

### Colors & Styling
- **Units Badge**: Orange background (`bg-orange-100 text-orange-600`)
- **Revenue**: Green text (`text-green-600`)
- **Hover Effects**: Subtle background color change (`hover:bg-orange-50/30`)
- **Headers**: Gray uppercase text with letter-spacing

### Responsive Behavior
- **Desktop (≥640px)**: Shows Units and Revenue columns in main table
- **Mobile (<640px)**: Shows summary below product name, expandable variations still available

### Thai Language Support
- Product names and variations can be in Thai
- Sorting uses `localeCompare` with 'th' locale for proper alphabetical order
- All text supports break-words for long product names

## User Journey

1. User clicks "View Products" button on dashboard
2. Page loads and fetches products from `/api/products`
3. Products are grouped and displayed in a collapsible list
4. User can:
   - Search for products by name
   - Click to expand a product and see variations
   - View total units and revenue for each product/variation
5. Click the back arrow to return to dashboard

## Example Data Display

```
Product: "พวงกุญแจซาลาเปา Clicker กดได้..." (2 options)
├─ Total Units: 270
└─ Total Revenue: ฿4,050.50
   ↓ (when expanded)
   ├─ เสียงเบา(สวิตซ์แดง): 120 units, ฿1,800.00
   └─ เสียงคลิก(สวิตซ์ฟ้า): 150 units, ฿2,250.50
```

## Future Enhancements

- [ ] Add sorting options (by units, by revenue, by name)
- [ ] Add date range filter for seasonal analysis
- [ ] Add export to CSV functionality
- [ ] Add charts showing variation popularity
- [ ] Add platform comparison (which platform sells more)
- [ ] Add trend analysis (month-over-month growth)
- [ ] Add product images/thumbnails
- [ ] Add cost of goods sold (COGS) for profit calculation

## Known Limitations

- Search only filters by product name (not variations)
- Cannot filter by date range within this page
- Variations are not filterable separately
- No export functionality yet
- No permission/role-based access control

## Testing Notes

When testing this feature:
1. Ensure you have imported TikTok CSV data first (via dashboard)
2. Products with multiple variations will show correctly grouped
3. Thai text sorting should work correctly
4. Mobile responsiveness should be tested on small screens
5. Long product names should wrap properly without breaking layout
