import { prisma } from "./prisma";

export async function getDashboardSummary() {
  const totalOrders = await prisma.order.count();
  
  // Only sum "Completed" or similar status if needed, but for now we sum all orderAmount
  const totalRevenueResult = await prisma.order.aggregate({
    _sum: {
      orderAmount: true,
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

  // Group by month
  const monthlyData: { [key: string]: { count: number; orders: string[] } } = {};

  orders.forEach(order => {
    if (order.createdTime) {
      const month = order.createdTime.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' });
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, orders: [] };
      }
      monthlyData[month].count++;
      monthlyData[month].orders.push(order.externalOrderId);
    }
  });

  // Convert to array and sort by month
  return Object.entries(monthlyData)
    .map(([month, data]) => ({ month, count: data.count, orderIds: data.orders }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
