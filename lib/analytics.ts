import { prisma } from "./prisma";

export async function getDashboardSummary() {
  // Only count orders that were NOT cancelled before shipping (ignore customer cancellations with no fee)
  const totalOrders = await prisma.order.count({
    where: {
      OR: [
        { cancelationType: null }, // Not cancelled
        { shippedTime: { not: null } }, // OR was shipped (we paid the fee even if later cancelled)
      ],
    },
  });

  // Sum revenue from valid orders only (same filtering as Reports)
  const totalRevenueResult = await prisma.order.aggregate({
    _sum: {
      orderAmount: true,
    },
    where: {
      OR: [
        { cancelationType: null },
        { shippedTime: { not: null } },
      ],
    },
  });

  const uniqueProducts = await prisma.orderItem.groupBy({
    by: ["productName"],
  });

  const topProducts = await prisma.orderItem.groupBy({
    by: ["productName", "variation"],
    _sum: {
      quantity: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: 5,
  });

  return {
    totalOrders,
    totalRevenue: totalRevenueResult._sum.orderAmount || 0,
    uniqueProductCount: uniqueProducts.length,
    topProducts: topProducts.map(p => ({
      name: p.productName,
      variation: p.variation,
      count: p._sum.quantity || 0,
    })),
  };
}

export async function getRecentOrders(limit = 10) {
  return await prisma.order.findMany({
    take: limit,
    orderBy: {
      createdTime: "desc",
    },
    include: {
      platform: true,
      items: true,
    },
  });
}

export async function getAllProductsSales() {
  const products = await prisma.orderItem.groupBy({
    by: ["productName", "variation"],
    _sum: {
      quantity: true,
      subtotal: true,
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
  });

  return products.map(p => ({
    name: p.productName,
    variation: p.variation,
    unitsSold: p._sum.quantity || 0,
    totalRevenue: p._sum.subtotal || 0,
  }));
}

export async function getCancelledOrdersByMonth() {
  // Get orders with BOTH cancelationType AND shippedTime (failed shipments)
  const orders = await prisma.order.findMany({
    where: {
      cancelationType: {
        not: null,
      },
      shippedTime: {
        not: null,
      },
    },
    select: {
      externalOrderId: true,
      createdTime: true,
      cancelationType: true,
      shippedTime: true,
    },
  });

  // Group by month and year
  const monthlyData: { [key: string]: { count: number; orders: string[]; year: number; monthNum: number } } = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  orders.forEach(order => {
    if (order.createdTime) {
      const year = order.createdTime.getFullYear();
      const monthNum = order.createdTime.getMonth();
      const monthName = monthNames[monthNum];
      const key = `${monthName} ${year}`;

      if (!monthlyData[key]) {
        monthlyData[key] = { count: 0, orders: [], year, monthNum };
      }
      monthlyData[key].count++;
      monthlyData[key].orders.push(order.externalOrderId);
    }
  });

  // Convert to array and sort by year and month
  return Object.entries(monthlyData)
    .map(([month, data]) => ({ month, count: data.count, orderIds: data.orders, year: data.year, monthNum: data.monthNum }))
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthNum - b.monthNum;
    });
}

export async function getCurrentMonthFailedShipments() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const count = await prisma.order.count({
    where: {
      cancelationType: {
        not: null,
      },
      shippedTime: {
        not: null,
      },
      createdTime: {
        gte: new Date(currentYear, currentMonth, 1),
        lt: new Date(currentYear, currentMonth + 1, 1),
      },
    },
  });

  return count;
}

export async function getSuccessfulOrdersByMonth() {
  // Get orders with shippedTime but NO cancelationType (successful shipments)
  const orders = await prisma.order.findMany({
    where: {
      shippedTime: {
        not: null,
      },
      cancelationType: null,
    },
    select: {
      externalOrderId: true,
      createdTime: true,
      shippedTime: true,
      orderAmount: true,
      settlementAmount: true,
    },
  });

  // Group by month and year
  const monthlyData: {
    [key: string]: {
      count: number;
      orders: string[];
      totalRevenue: number;
      totalSettlement: number;
      year: number;
      monthNum: number
    }
  } = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  orders.forEach(order => {
    if (order.createdTime) {
      const year = order.createdTime.getFullYear();
      const monthNum = order.createdTime.getMonth();
      const monthName = monthNames[monthNum];
      const key = `${monthName} ${year}`;

      if (!monthlyData[key]) {
        monthlyData[key] = { count: 0, orders: [], totalRevenue: 0, totalSettlement: 0, year, monthNum };
      }
      monthlyData[key].count++;
      monthlyData[key].orders.push(order.externalOrderId);
      monthlyData[key].totalRevenue += order.orderAmount || 0;
      if (order.settlementAmount !== null && order.settlementAmount !== undefined) {
        monthlyData[key].totalSettlement += order.settlementAmount;
      }
    }
  });

  // Convert to array and sort by year and month
  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      count: data.count,
      orderIds: data.orders,
      totalRevenue: data.totalRevenue,
      totalSettlement: data.totalSettlement,
      year: data.year,
      monthNum: data.monthNum
    }))
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthNum - b.monthNum;
    });
}

export async function getCurrentMonthSuccessfulOrders() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const count = await prisma.order.count({
    where: {
      shippedTime: {
        not: null,
      },
      cancelationType: null,
      createdTime: {
        gte: new Date(currentYear, currentMonth, 1),
        lt: new Date(currentYear, currentMonth + 1, 1),
      },
    },
  });

  return count;
}
