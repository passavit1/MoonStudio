# MoonStudio Sales Dashboard Planning

## 1. Project Overview
The goal is to create a web-based dashboard for MoonStudio to track and analyze sales of 3D printing models across multiple platforms (Shopee, Lazada, TikTok). The system will process monthly CSV exports from these platforms to provide actionable insights.

## 2. Data Analysis (Current Sample: TikTok Shop)
Based on `data/2026-03.csv`, the following fields are critical:
- **Order Identification:** `Order ID`, `Package ID`.
- **Status Tracking:** `Order Status` (To Ship, Shipped, Cancelled, Completed).
- **Product Details:** `Product Name`, `Variation`, `SKU ID`, `Product Category`.
- **Financials:** `SKU Unit Original Price`, `SKU Subtotal After Discount`, `Shipping Fee`, `Order Amount`.
- **Logistics:** `Created Time`, `Paid Time`, `Shipped Time`, `Delivered Time`, `Province`.
- **Customer:** `Buyer Username`, `Payment Method`.

## 3. Proposed Features
- **Data Import:** Upload monthly CSV files from Shopee, Lazada, and TikTok.
- **Sales Overview:** Total revenue, total orders, average order value.
- **Product Performance:** Top-selling models, most popular variations (e.g., "Blue Switch - Click sound").
- **Platform Comparison:** Compare sales volume and revenue across Shopee, Lazada, and TikTok.
- **Geographic Insights:** Map of sales by province in Thailand.
- **Status Tracking:** Analysis of cancellation rates and fulfillment speed.
- **Historical Trends:** Month-over-month growth and seasonal patterns.

## 4. Proposed Tech Stack
### Frontend
- **Framework:** React (TypeScript) or Next.js.
- **UI Library:** Shadcn UI or Material UI.
- **Charts:** Recharts or Chart.js for data visualization.
- **Styling:** Vanilla CSS or CSS Modules (as per project mandate).

### Backend
- **Framework:** Node.js (Express) or Python (FastAPI).
- **Processing:** `pandas` (Python) or `csv-parse` (Node.js) for handling CSV files.

### Database
- **Type:** Relational (PostgreSQL) recommended for structured order data.
- **Schema:** 
    - `Orders`: Basic order info.
    - `OrderItems`: Line items per order.
    - `Products`: Catalog of 3D models.
    - `Platforms`: Mapping for Shopee, Lazada, TikTok.

## 5. Next Steps
1. **Database Design:** Finalize schema to accommodate different CSV formats from various platforms.
2. **Backend Setup:** Create API to parse and store CSV data.
3. **Frontend Prototype:** Design the main dashboard layout.
4. **Integration:** Connect frontend to backend for real-time visualization.

---
**Questions for Discussion:**
- Do you have samples for Shopee and Lazada CSVs? (The columns might differ).
- Would you prefer a simple local tool or a hosted website (Cloud)?
- Do you want to track costs (material, electricity, labor) to calculate net profit?
