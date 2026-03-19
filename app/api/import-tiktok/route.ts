import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTikTokCSV, parseTikTokDate, parseCurrency, parseIncomeFile } from "@/lib/csv-parser";
import path from "path";
import fs from "fs";

export async function POST() {
  try {
    const dataDir = path.join(process.cwd(), "data", "tiktok");

    // Separate sales and income files
    const allFiles = fs.readdirSync(dataDir).filter((f) => f.endsWith(".csv") || f.endsWith(".xlsx"));
    const salesFiles = allFiles.filter((f) => !f.startsWith("income-"));
    const incomeFiles = allFiles.filter((f) => f.startsWith("income-"));

    if (salesFiles.length === 0 && incomeFiles.length === 0) {
      return NextResponse.json({ error: "No CSV or XLSX files found in /data/tiktok" }, { status: 404 });
    }

    // Ensure TikTok platform exists
    const platform = await prisma.platform.upsert({
      where: { name: "TikTok" },
      update: {},
      create: { name: "TikTok" },
    });

    let totalOrdersImported = 0;
    let totalItemsImported = 0;
    let totalSettlementsUpdated = 0;

    // Step 1: Import sales data from CSV files
    for (const file of salesFiles) {
      const filePath = path.join(dataDir, file);
      const rows = await parseTikTokCSV(filePath);

      // Group rows by Order ID (one order can have multiple items)
      const ordersMap = new Map<string, any[]>();
      for (const row of rows) {
        const orderId = row["Order ID"]?.trim();
        if (!orderId) continue;
        if (!ordersMap.has(orderId)) {
          ordersMap.set(orderId, []);
        }
        ordersMap.get(orderId)!.push(row);
      }

      // Process each unique order
      for (const [orderId, orderRows] of ordersMap.entries()) {
        const firstRow = orderRows[0];

        // Calculate subtotal as sum of all items (for multi-item orders)
        const itemSubtotal = orderRows.reduce((sum, row) => {
          return sum + parseCurrency(row["SKU Subtotal After Discount"]);
        }, 0);

        // Calculate real product value (before discounts)
        const subtotalBeforeDiscount = orderRows.reduce((sum, row) => {
          return sum + parseCurrency(row["SKU Subtotal Before Discount"]);
        }, 0);

        // Create or update the order
        const order = await prisma.order.upsert({
          where: { externalOrderId: orderId },
          update: {
            status: firstRow["Order Status"],
            cancelationType: firstRow["Cancelation/Return Type"] || null,
            subtotalBeforeDiscount: subtotalBeforeDiscount,
            subtotal: itemSubtotal,
            shippingFee: parseCurrency(firstRow["Shipping Fee"]),
            orderAmount: parseCurrency(firstRow["Order Amount"]),
            buyerUsername: firstRow["Buyer Username"],
            province: firstRow["Province"],
            paymentMethod: firstRow["Payment Method"],
            createdTime: parseTikTokDate(firstRow["Created Time"]),
            paidTime: parseTikTokDate(firstRow["Paid Time"]),
            shippedTime: parseTikTokDate(firstRow["Shipped Time"]),
          },
          create: {
            platformId: platform.id,
            externalOrderId: orderId,
            status: firstRow["Order Status"],
            cancelationType: firstRow["Cancelation/Return Type"] || null,
            subtotalBeforeDiscount: subtotalBeforeDiscount,
            subtotal: itemSubtotal,
            shippingFee: parseCurrency(firstRow["Shipping Fee"]),
            orderAmount: parseCurrency(firstRow["Order Amount"]),
            buyerUsername: firstRow["Buyer Username"],
            province: firstRow["Province"],
            paymentMethod: firstRow["Payment Method"],
            createdTime: parseTikTokDate(firstRow["Created Time"]),
            paidTime: parseTikTokDate(firstRow["Paid Time"]),
            shippedTime: parseTikTokDate(firstRow["Shipped Time"]),
          },
        });

        totalOrdersImported++;

        // Delete existing items for this order and recreate them (simpler than upserting items)
        await prisma.orderItem.deleteMany({
          where: { orderId: order.id },
        });

        for (const itemRow of orderRows) {
          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              skuId: itemRow["SKU ID"],
              productName: itemRow["Product Name"],
              variation: itemRow["Variation"],
              quantity: parseInt(itemRow["Quantity"]) || 1,
              originalPrice: parseCurrency(itemRow["SKU Unit Original Price"]),
              platformDiscount: parseCurrency(itemRow["SKU Platform Discount"]),
              sellerDiscount: parseCurrency(itemRow["SKU Seller Discount"]),
              subtotal: parseCurrency(itemRow["SKU Subtotal After Discount"]),
            },
          });
          totalItemsImported++;
        }
      }
    }

    // Step 2: Import settlement data from income files
    for (const file of incomeFiles) {
      const filePath = path.join(dataDir, file);
      const rows = await parseIncomeFile(filePath);

      for (const row of rows) {
        const orderId = row["Order/adjustment ID"];
        if (!orderId) continue;

        const settlementAmount = parseCurrency(row["Total settlement amount"]);

        // Update the order with settlement amount
        try {
          await prisma.order.update({
            where: { externalOrderId: orderId },
            data: { settlementAmount },
          });
          totalSettlementsUpdated++;
        } catch (error) {
          // Order might not exist yet, silently skip but don't count as success
          console.log(`Settlement skipped for order ${orderId}: order not found in database`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${totalOrdersImported} orders and ${totalItemsImported} items from ${salesFiles.length} sales files. Updated ${totalSettlementsUpdated} settlement amounts from ${incomeFiles.length} income files.`,
      stats: {
        ordersImported: totalOrdersImported,
        itemsImported: totalItemsImported,
        settlementsUpdated: totalSettlementsUpdated,
      },
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
