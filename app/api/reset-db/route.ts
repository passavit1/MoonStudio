import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    console.log("Starting database reset...");

    // Delete all data in reverse order of dependencies
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.fileImportMetadata.deleteMany({});
    await prisma.platform.deleteMany({});

    console.log("Database reset completed");

    return NextResponse.json({
      success: true,
      message: "Database reset successfully. All orders, items, and import metadata have been deleted.",
    });
  } catch (error: any) {
    console.error("Reset DB error:", error);
    return NextResponse.json(
      { error: "Failed to reset database: " + error.message },
      { status: 500 }
    );
  }
}
