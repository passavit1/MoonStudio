import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all orders grouped by month
    const orders = await prisma.order.findMany({
      select: {
        orderAmount: true,
        settlementAmount: true,
        createdTime: true,
        status: true,
        cancelationType: true,
        shippedTime: true,
      },
      orderBy: {
        createdTime: "asc",
      },
    });

    // Group by month
    const monthlyData: {
      [key: string]: {
        totalRevenue: number;
        totalSettlement: number;
        totalOrders: number;
        completedOrders: number;
        pendingOrders: number; // On the way to customer
        lostOrders: number; // Cancelled/Refunded AFTER shipping
      };
    } = {};

    orders.forEach((order) => {
      if (!order.createdTime) return;

      // Parse date and adjust for Thailand timezone (UTC+7) since CSV dates are in local time
      const dateStr = order.createdTime.toISOString ? order.createdTime.toISOString() : String(order.createdTime);
      const date = new Date(dateStr);
      // Add 7 hours to convert from UTC back to Thailand local time for grouping
      const localDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));
      const monthKey = `${localDate.getUTCFullYear()}-${String(localDate.getUTCMonth() + 1).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          totalRevenue: 0,
          totalSettlement: 0,
          totalOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          lostOrders: 0,
        };
      }

      // Count all orders (only ignore cancelled before shipping)
      const isCancelledBeforeShip =
        order.cancelationType !== null && !order.shippedTime;

      if (isCancelledBeforeShip) {
        // Ignore: cancelled before we shipped (customer changed mind)
        return;
      }

      monthlyData[monthKey].totalRevenue += order.orderAmount;
      if (order.settlementAmount !== null && order.settlementAmount !== undefined) {
        monthlyData[monthKey].totalSettlement += order.settlementAmount;
      }
      monthlyData[monthKey].totalOrders += 1;

      // Lost orders take PRIORITY (shipped & cancelled)
      if (order.cancelationType !== null && order.shippedTime) {
        // Lost: has cancelationType AND was shipped (we paid the fee)
        monthlyData[monthKey].lostOrders += 1;
      } else if (order.status === "เสร็จสมบูรณ์" || order.status === "จัดส่งแล้ว") {
        // Completed: either status is "เสร็จสมบูรณ์" or "จัดส่งแล้ว"
        monthlyData[monthKey].completedOrders += 1;
      } else if (order.status === "ที่จะจัดส่ง") {
        // Pending: on the way to customer
        monthlyData[monthKey].pendingOrders += 1;
      }
    });

    // Convert to array and sort
    const data = Object.entries(monthlyData)
      .map(([month, stats]) => ({
        month,
        ...stats,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate totals
    const totals = {
      totalRevenue: data.reduce((sum, m) => sum + m.totalRevenue, 0),
      totalSettlement: data.reduce((sum, m) => sum + m.totalSettlement, 0),
      totalOrders: data.reduce((sum, m) => sum + m.totalOrders, 0),
      completedOrders: data.reduce((sum, m) => sum + m.completedOrders, 0),
      pendingOrders: data.reduce((sum, m) => sum + m.pendingOrders, 0),
      lostOrders: data.reduce((sum, m) => sum + m.lostOrders, 0),
    };

    return NextResponse.json({
      monthly: data,
      totals,
    });
  } catch (error: any) {
    console.error("Reports error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
