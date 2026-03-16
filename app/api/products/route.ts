import { getAllProductsSales } from "@/lib/analytics";

export async function GET() {
  try {
    const products = await getAllProductsSales();
    return Response.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return Response.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
