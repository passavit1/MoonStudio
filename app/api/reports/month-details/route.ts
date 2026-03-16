import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    if (!month) {
      return NextResponse.json(
        { error: "Month parameter required" },
        { status: 400 }
      );
    }

    // Parse month (format: 2026-01) - adjust for Thailand timezone (UTC+7)
    // When user selects "2026-01", they mean January in local time, but we need to query UTC range
    const [year, monthNum] = month.split("-");
    const startLocalDate = new Date(`${year}-${monthNum}-01T00:00:00Z`);
    const endLocalDate = new Date(startLocalDate);
    endLocalDate.setUTCMonth(endLocalDate.getUTCMonth() + 1);

    // Subtract 7 hours to convert from local time range to UTC query range
    const startDate = new Date(startLocalDate.getTime() - (7 * 60 * 60 * 1000));
    const endDate = new Date(endLocalDate.getTime() - (7 * 60 * 60 * 1000));

    // Get all orders for the month (excluding cancelled-before-ship)
    const orders = await prisma.order.findMany({
      where: {
        createdTime: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        externalOrderId: true,
        status: true,
        orderAmount: true,
        cancelationType: true,
        shippedTime: true,
        createdTime: true,
      },
      orderBy: {
        createdTime: "desc",
      },
    });

    // Filter out orders cancelled before shipping
    const validOrders = orders.filter((order) => {
      const isCancelledBeforeShip =
        order.cancelationType !== null && !order.shippedTime;
      return !isCancelledBeforeShip;
    });

    return NextResponse.json({
      month,
      orders: validOrders,
    });
  } catch (error: any) {
    console.error("Month details error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
