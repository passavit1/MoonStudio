import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseIncomeFile, parseCurrency } from "@/lib/csv-parser";
import fs from "fs";
import path from "path";

// GET - fetch all unsettled orders + unmatched transactions (excluding dismissed)
export async function GET() {
  try {
    // Load all dismissed keys for fast lookup
    const dismissed = await prisma.reconciliationDismissal.findMany();
    const dismissedKeys = new Set(dismissed.map((d) => d.key));

    // --- PART 1: All unsettled non-cancelled orders ---
    const unsettledOrders = await prisma.order.findMany({
      where: {
        settlementAmount: null,
        cancelationType: null,
      },
      select: {
        id: true,
        externalOrderId: true,
        status: true,
        orderAmount: true,
        cancelationType: true,
        shippedTime: true,
        createdTime: true,
      },
      orderBy: { createdTime: "desc" },
    });

    // --- PART 2: All valid order IDs for matching ---
    const allOrderIds = new Set(
      (
        await prisma.order.findMany({
          where: { cancelationType: null },
          select: { externalOrderId: true },
        })
      ).map((o) => o.externalOrderId)
    );

    // --- PART 3: Scan ALL income files for unmatched transactions ---
    const dataDir = path.join(process.cwd(), "data", "tiktok");
    const allDataFiles = fs.readdirSync(dataDir);
    const incomeFiles = allDataFiles
      .filter((f) => /^income-\d{4}-\d{2}\.(csv|xlsx)$/.test(f))
      .sort();

    // Deduplicate: prefer CSV over XLSX for same month
    const fileMap = new Map<string, string>();
    for (const file of incomeFiles) {
      const base = file.replace(/\.(csv|xlsx)$/, "");
      if (!fileMap.has(base) || file.endsWith(".csv")) {
        fileMap.set(base, file);
      }
    }

    const unmatchedTransactions: any[] = [];

    for (const file of fileMap.values()) {
      try {
        const filePath = path.join(dataDir, file);
        const rows = await parseIncomeFile(filePath);

        for (const row of rows) {
          const orderId = row["Order/adjustment ID"];
          if (!orderId) continue;

          const trimmedId = orderId.trim();
          if (!allOrderIds.has(trimmedId)) {
            const key = `${file}::${trimmedId}`;
            unmatchedTransactions.push({
              file,
              orderId: trimmedId,
              type: row["Type"] || "Unknown",
              settlementAmount: parseCurrency(row["Total settlement amount"]),
              settledTime: row["Order settled time"],
              key,
              dismissed: dismissedKeys.has(key),
            });
          }
        }
      } catch (error) {
        console.log(`Note: Could not read income file ${file}:`, (error as Error).message);
      }
    }

    // Attach dismissed flag to unsettled orders
    const unsettledWithFlag = unsettledOrders.map((o) => ({
      orderId: o.externalOrderId,
      status: o.status,
      orderAmount: o.orderAmount,
      cancelationType: o.cancelationType,
      shippedTime: o.shippedTime,
      createdTime: o.createdTime,
      key: o.externalOrderId,
      dismissed: dismissedKeys.has(o.externalOrderId),
    }));

    const activeUnsettled = unsettledWithFlag.filter((o) => !o.dismissed);
    const activeUnmatched = unmatchedTransactions.filter((t) => !t.dismissed);

    return NextResponse.json({
      summary: {
        unsettledCount: activeUnsettled.length,
        unmatchedCount: activeUnmatched.length,
        totalOrders: allOrderIds.size,
        dismissedCount: dismissed.length,
      },
      unsettledOrders: {
        description: "Orders without settlement data (no cancellation)",
        count: activeUnsettled.length,
        orders: activeUnsettled,
      },
      unmatchedTransactions: {
        description: "Income file transactions with no matching order in database",
        count: activeUnmatched.length,
        transactions: activeUnmatched,
      },
    });
  } catch (error: any) {
    console.error("Settlement reconciliation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - dismiss an item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, key, note } = body;

    if (!type || !key) {
      return NextResponse.json({ error: "type and key are required" }, { status: 400 });
    }

    const dismissal = await prisma.reconciliationDismissal.upsert({
      where: { key },
      update: { note, dismissedAt: new Date() },
      create: { type, key, note },
    });

    return NextResponse.json({ success: true, dismissal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - undo a dismissal
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }

    await prisma.reconciliationDismissal.delete({ where: { key } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
