import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTikTokCSV, parseTikTokDate, parseCurrency, parseIncomeFile } from "@/lib/csv-parser";
import { initializeProgress, startFileProgress, updateProgress, completeProgress, failProgress, isSyncCancelled, resetCancelFlag } from "@/lib/sync-progress";
import path from "path";
import fs from "fs";

export async function POST() {
  resetCancelFlag();

  // Start sync in background, return immediately
  (async () => {
    await runSync();
  })();

  // Return immediately without waiting
  return NextResponse.json({
    success: true,
    message: "Sync started in background. Check progress via /api/import-tiktok/progress",
  });
}

async function runSync() {
  try {
    const tiktokDir = path.join(process.cwd(), "data", "tiktok");
    const externalDir = path.join(process.cwd(), "data", "external");

    // Separate sales and income files from TikTok
    const allFiles = fs.readdirSync(tiktokDir).filter((f) => f.endsWith(".csv") || f.endsWith(".xlsx"));
    const salesFiles = allFiles.filter((f) => !f.startsWith("income-"));
    const incomeFiles = allFiles.filter((f) => f.startsWith("income-"));

    // Get external JSON files
    let externalFiles: string[] = [];
    if (fs.existsSync(externalDir)) {
      externalFiles = fs.readdirSync(externalDir).filter((f) => f.endsWith(".json"));
    }

    if (salesFiles.length === 0 && incomeFiles.length === 0 && externalFiles.length === 0) {
      return NextResponse.json({ error: "No CSV, XLSX, or JSON files found in /data" }, { status: 404 });
    }

    // Initialize progress tracking
    const allFilesForProgress = [...salesFiles, ...incomeFiles, ...externalFiles.map((f) => `[External] ${f}`)];
    initializeProgress(allFilesForProgress.length, allFilesForProgress);

    // Ensure TikTok platform exists
    const platform = await prisma.platform.upsert({
        where: { name: "TikTok" },
        update: {},
        create: { name: "TikTok" },
      });

      let totalOrdersImported = 0;
      let totalItemsImported = 0;
      let totalSettlementsUpdated = 0;
      let filesSkipped = 0;

      // Get imported file metadata
      const importedMetadata = await prisma.fileImportMetadata.findMany();
      const importedFileNames = new Set(importedMetadata.map(m => m.fileName));

      // Step 1: Import sales data from CSV files
      for (const file of salesFiles) {
        // Check if sync was cancelled
        if (isSyncCancelled()) {
          failProgress("Sync cancelled by user");
          return NextResponse.json({ error: "Sync cancelled by user" }, { status: 400 });
        }

        // Skip if already imported (unless you need to re-import)
        if (importedFileNames.has(file)) {
          filesSkipped++;
          startFileProgress(file);
          updateProgress(file); // Still update progress for skipped files
          console.log(`Skipping already imported file: ${file}`);
          continue;
        }

        startFileProgress(file);
        const filePath = path.join(tiktokDir, file);
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

        // Create products if they don't exist
        for (const row of orderRows) {
          const productName = row["Product Name"];
          if (productName) {
            await prisma.product.upsert({
              where: { name: productName },
              update: {},
              create: { name: productName },
            });
          }
        }

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

        // Upsert items instead of delete + recreate (more efficient)
        for (const itemRow of orderRows) {
          await prisma.orderItem.upsert({
            where: {
              orderId_skuId: {
                orderId: order.id,
                skuId: itemRow["SKU ID"],
              },
            },
            update: {
              productName: itemRow["Product Name"],
              variation: itemRow["Variation"],
              quantity: parseInt(itemRow["Quantity"]) || 1,
              originalPrice: parseCurrency(itemRow["SKU Unit Original Price"]),
              platformDiscount: parseCurrency(itemRow["SKU Platform Discount"]),
              sellerDiscount: parseCurrency(itemRow["SKU Seller Discount"]),
              subtotal: parseCurrency(itemRow["SKU Subtotal After Discount"]),
            },
            create: {
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

      // Track file import
      await prisma.fileImportMetadata.upsert({
        where: { fileName: file },
        update: { lastImportedAt: new Date(), recordCount: ordersMap.size, status: "COMPLETED" },
        create: { fileName: file, recordCount: ordersMap.size, status: "COMPLETED" },
      });

      updateProgress(file); // Mark file as done after all processing is complete
    }

      // Step 2: Import settlement data from income files
      for (const file of incomeFiles) {
        // Check if sync was cancelled
        if (isSyncCancelled()) {
          failProgress("Sync cancelled by user");
          return NextResponse.json({ error: "Sync cancelled by user" }, { status: 400 });
        }

        // Skip if already imported
        if (importedFileNames.has(file)) {
          filesSkipped++;
          startFileProgress(file);
          updateProgress(file); // Still update progress for skipped files
          console.log(`Skipping already imported file: ${file}`);
          continue;
        }

        startFileProgress(file);
        const filePath = path.join(tiktokDir, file);
      const rows = await parseIncomeFile(filePath);

      let settlementsInFile = 0;
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
          settlementsInFile++;
        } catch (error) {
          // Order might not exist yet, silently skip but don't count as success
          console.log(`Settlement skipped for order ${orderId}: order not found in database`);
        }
      }

      // Track file import
      await prisma.fileImportMetadata.upsert({
        where: { fileName: file },
        update: { lastImportedAt: new Date(), recordCount: settlementsInFile, status: "COMPLETED" },
        create: { fileName: file, recordCount: settlementsInFile, status: "COMPLETED" },
      });

      updateProgress(file); // Mark file as done after all processing is complete
    }

    // Step 3: Import external orders from JSON files
    let totalExternalOrders = 0;
    const externalPlatform = await prisma.platform.upsert({
      where: { name: "External" },
      update: {},
      create: { name: "External" },
    });

    for (const file of externalFiles) {
      // Check if sync was cancelled
      if (isSyncCancelled()) {
        failProgress("Sync cancelled by user");
        return NextResponse.json({ error: "Sync cancelled by user" }, { status: 400 });
      }

      startFileProgress(`[External] ${file}`);
      const filePath = path.join(externalDir, file);

      try {
        const jsonContent = fs.readFileSync(filePath, "utf-8");
        const externalOrder = JSON.parse(jsonContent);

        const order = await prisma.order.upsert({
          where: { externalOrderId: externalOrder.orderId },
          update: {
            status: externalOrder.status,
            subtotal: externalOrder.subtotal,
            shippingFee: externalOrder.shippingFee,
            orderAmount: externalOrder.orderAmount,
            buyerUsername: externalOrder.customerName,
            paymentMethod: externalOrder.paymentMethod,
            createdTime: new Date(externalOrder.createdAt),
          },
          create: {
            platformId: externalPlatform.id,
            externalOrderId: externalOrder.orderId,
            status: externalOrder.status,
            subtotal: externalOrder.subtotal,
            shippingFee: externalOrder.shippingFee,
            orderAmount: externalOrder.orderAmount,
            buyerUsername: externalOrder.customerName,
            paymentMethod: externalOrder.paymentMethod,
            createdTime: new Date(externalOrder.createdAt),
          },
        });

        // Create or update order items
        for (let i = 0; i < externalOrder.items.length; i++) {
          const item = externalOrder.items[i];

          // Create product if it doesn't exist
          if (item.productName) {
            await prisma.product.upsert({
              where: { name: item.productName },
              update: {},
              create: { name: item.productName },
            });
          }

          await prisma.orderItem.upsert({
            where: {
              orderId_skuId: {
                orderId: order.id,
                skuId: `${externalOrder.orderId}-${i}`,
              },
            },
            update: {
              productName: item.productName,
              quantity: item.quantity,
              originalPrice: item.price,
              subtotal: item.quantity * item.price,
            },
            create: {
              orderId: order.id,
              skuId: `${externalOrder.orderId}-${i}`,
              productName: item.productName,
              quantity: item.quantity,
              originalPrice: item.price,
              subtotal: item.quantity * item.price,
            },
          });
        }

        totalExternalOrders++;
        totalOrdersImported++;
        totalItemsImported++;

        // Track file import
        await prisma.fileImportMetadata.upsert({
          where: { fileName: file },
          update: { lastImportedAt: new Date(), recordCount: 1, status: "COMPLETED" },
          create: { fileName: file, recordCount: 1, status: "COMPLETED" },
        });
      } catch (error) {
        console.error(`Error processing external file ${file}:`, error);
      }

      updateProgress(`[External] ${file}`); // Mark file as done
    }

    completeProgress();

    return NextResponse.json({
      success: true,
      message: `Imported ${totalOrdersImported} orders and ${totalItemsImported} items from ${salesFiles.length} TikTok sales files, ${externalFiles.length} external orders, and updated ${totalSettlementsUpdated} settlement amounts from ${incomeFiles.length} income files. Skipped ${filesSkipped} already-imported files.`,
      stats: {
        ordersImported: totalOrdersImported,
        itemsImported: totalItemsImported,
        settlementsUpdated: totalSettlementsUpdated,
        externalOrdersImported: totalExternalOrders,
        filesSkipped,
        totalFilesProcessed: salesFiles.length + incomeFiles.length + externalFiles.length,
      },
    });
  } catch (error: any) {
    failProgress(error.message);
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
