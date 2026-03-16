import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTikTokCSV, parseTikTokDate, parseCurrency } from "@/lib/csv-parser";
import path from "path";
import fs from "fs";

export async function POST() {
  try {
    const dataDir = path.join(process.cwd(), "data");
    const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".csv"));

    if (files.length === 0) {
      return NextResponse.json({ error: "No CSV files found in /data" }, { status: 404 });
    }

    // Ensure TikTok platform exists
    const platform = await prisma.platform.upsert({
      where: { name: "TikTok" },
      update: {},
      create: { name: "TikTok" },
    });

    let totalOrdersImported = 0;
    let totalItemsImported = 0;

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const rows = await parseTikTokCSV(filePath);

      // Group rows by Order ID (one order can have multiple items)
      const ordersMap = new Map<string, any[]>();
      for (const row of rows) {
        const orderId = row["Order ID"];
        if (!orderId) continue;
        if (!ordersMap.has(orderId)) {
          ordersMap.set(orderId, []);
        }
        ordersMap.get(orderId)!.push(row);
      }

      // Process each unique order
      for (const [orderId, orderRows] of ordersMap.entries()) {
        const firstRow = orderRows[0];
        
        // Create or update the order
        const order = await prisma.order.upsert({
          where: { externalOrderId: orderId },
          update: {
            status: firstRow["Order Status"],
            subtotal: parseCurrency(firstRow["SKU Subtotal After Discount"]),
            shippingFee: parseCurrency(firstRow["Shipping Fee"]),
            orderAmount: parseCurrency(firstRow["Order Amount"]),
            buyerUsername: firstRow["Buyer Username"],
            province: firstRow["Province"],
            paymentMethod: firstRow["Payment Method"],
            createdTime: parseTikTokDate(firstRow["Created Time"]),
            paidTime: parseTikTokDate(firstRow["Paid Time"]),
          },
          create: {
            platformId: platform.id,
            externalOrderId: orderId,
            status: firstRow["Order Status"],
            subtotal: parseCurrency(firstRow["SKU Subtotal After Discount"]),
            shippingFee: parseCurrency(firstRow["Shipping Fee"]),
            orderAmount: parseCurrency(firstRow["Order Amount"]),
            buyerUsername: firstRow["Buyer Username"],
            province: firstRow["Province"],
            paymentMethod: firstRow["Payment Method"],
            createdTime: parseTikTokDate(firstRow["Created Time"]),
            paidTime: parseTikTokDate(firstRow["Paid Time"]),
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

    return NextResponse.json({
      success: true,
      message: `Imported ${totalOrdersImported} orders and ${totalItemsImported} items from ${files.length} files.`,
    });
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
