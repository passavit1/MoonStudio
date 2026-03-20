import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs";

interface OrderItemData {
  productName: string;
  quantity: number;
  price: number;
}

interface ExternalOrderRequest {
  orderId: string;
  customerName: string;
  items: OrderItemData[];
  shippingFee: number;
  paymentMethod: string;
  status: string;
  notes: string;
  subtotal: number;
  orderAmount: number;
}

export async function POST(req: Request) {
  try {
    const data: ExternalOrderRequest = await req.json();

    // Validate required fields
    if (!data.orderId || !data.customerName || !data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields or no items provided" },
        { status: 400 }
      );
    }

    if (data.items.some((item) => !item.productName || item.price <= 0)) {
      return NextResponse.json(
        { error: "All items must have a product name and valid price" },
        { status: 400 }
      );
    }

    // Get or create "External" platform
    const platform = await prisma.platform.upsert({
      where: { name: "External" },
      update: {},
      create: { name: "External" },
    });

    // Create or update order
    const order = await prisma.order.upsert({
      where: { externalOrderId: data.orderId },
      update: {
        status: data.status,
        subtotal: data.subtotal,
        shippingFee: data.shippingFee,
        orderAmount: data.orderAmount,
        buyerUsername: data.customerName,
        paymentMethod: data.paymentMethod,
      },
      create: {
        platformId: platform.id,
        externalOrderId: data.orderId,
        status: data.status,
        subtotal: data.subtotal,
        shippingFee: data.shippingFee,
        orderAmount: data.orderAmount,
        buyerUsername: data.customerName,
        paymentMethod: data.paymentMethod,
        createdTime: new Date(),
      },
    });

    // Create or update order items
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const itemSubtotal = item.quantity * item.price;

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
            skuId: `${data.orderId}-${i}`,
          },
        },
        update: {
          productName: item.productName,
          quantity: item.quantity,
          originalPrice: item.price,
          subtotal: itemSubtotal,
        },
        create: {
          orderId: order.id,
          skuId: `${data.orderId}-${i}`,
          productName: item.productName,
          quantity: item.quantity,
          originalPrice: item.price,
          subtotal: itemSubtotal,
        },
      });
    }

    // Create JSON file in ./data/external
    const externalDir = path.join(process.cwd(), "data", "external");
    if (!fs.existsSync(externalDir)) {
      fs.mkdirSync(externalDir, { recursive: true });
    }

    // Create a file with timestamp and order ID
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0];
    const filename = `${timestamp}-${data.orderId}.json`;
    const filepath = path.join(externalDir, filename);

    // Prepare JSON content
    const jsonData = {
      orderId: data.orderId,
      customerName: data.customerName,
      items: data.items,
      shippingFee: data.shippingFee,
      paymentMethod: data.paymentMethod,
      status: data.status,
      notes: data.notes || null,
      subtotal: data.subtotal,
      orderAmount: data.orderAmount,
      createdAt: new Date().toISOString(),
    };

    fs.writeFileSync(filepath, JSON.stringify(jsonData, null, 2));

    return NextResponse.json(
      {
        success: true,
        message: "External order created successfully",
        order: {
          id: order.id,
          externalOrderId: order.externalOrderId,
          status: order.status,
          subtotal: order.subtotal,
          orderAmount: order.orderAmount,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating external order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
