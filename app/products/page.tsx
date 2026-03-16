"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Search, ArrowLeft, ChevronDown } from "lucide-react";

interface ProductVariation {
  variation: string | null;
  unitsSold: number;
  totalRevenue: number;
}

interface Product {
  name: string;
  variations: ProductVariation[];
  totalUnitsSold: number;
  totalRevenue: number;
}

interface RawProduct {
  name: string;
  variation: string | null;
  unitsSold: number;
  totalRevenue: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        const rawData: RawProduct[] = await response.json();

        // Group products by name
        const grouped = new Map<string, ProductVariation[]>();
        rawData.forEach(item => {
          if (!grouped.has(item.name)) {
            grouped.set(item.name, []);
          }
          grouped.get(item.name)!.push({
            variation: item.variation,
            unitsSold: item.unitsSold,
            totalRevenue: item.totalRevenue,
          });
        });

        // Convert to array and sort by total units
        const productsArray: Product[] = Array.from(grouped.entries())
          .map(([name, variations]) => ({
            name,
            variations: variations.sort((a, b) => {
              const varA = a.variation || '';
              const varB = b.variation || '';
              return varA.localeCompare(varB, 'th');
            }),
            totalUnitsSold: variations.reduce((sum, v) => sum + v.unitsSold, 0),
            totalRevenue: variations.reduce((sum, v) => sum + v.totalRevenue, 0),
          }))
          .sort((a, b) => b.totalUnitsSold - a.totalUnitsSold);

        setProducts(productsArray);
        setFilteredProducts(productsArray);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const toggleExpand = (productName: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productName)) {
      newExpanded.delete(productName);
    } else {
      newExpanded.add(productName);
    }
    setExpandedProducts(newExpanded);
  };

  const totalUnits = filteredProducts.reduce((sum, p) => sum + p.totalUnitsSold, 0);
  const totalRevenue = filteredProducts.reduce((sum, p) => sum + p.totalRevenue, 0);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 sm:p-12 font-sans">
      <main className="max-w-7xl mx-auto flex flex-col gap-8">

        {/* Header with back button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-200">
                <Package size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  Product Sales
                </h1>
                <p className="text-gray-500">Track units sold per product</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 text-orange-600 mb-4 font-semibold uppercase text-xs tracking-wider">
              <Package size={18} />
              Total Units Sold
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {totalUnits.toLocaleString()}
            </div>
            <p className="text-sm text-gray-400 mt-2">Across all filtered products</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 text-green-600 mb-4 font-semibold uppercase text-xs tracking-wider">
              <span className="text-lg">₿</span>
              Total Revenue
            </div>
            <div className="text-3xl font-bold text-gray-900">
              ฿{totalRevenue.toLocaleString()}
            </div>
            <p className="text-sm text-gray-400 mt-2">From filtered products</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Products List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">
                Products ({filteredProducts.length})
              </h3>
            </div>
            <div className="hidden sm:flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest pb-2 border-b border-gray-200">
              <div className="flex-1">Product Name</div>
              <div className="w-24 text-right">Units</div>
              <div className="w-32 text-right">Revenue</div>
            </div>
          </div>
          <div>
            {loading ? (
              <div className="px-6 py-10 text-center text-gray-400">
                Loading products...
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {filteredProducts.map((product) => (
                  <div key={product.name} className="hover:bg-gray-50/50 transition-colors">
                    {/* Product Row */}
                    <button
                      onClick={() => toggleExpand(product.name)}
                      className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                    >
                      <div className="flex items-center flex-1 gap-4 min-w-0">
                        <ChevronDown
                          size={20}
                          className={`text-gray-400 transition-transform flex-shrink-0 ${
                            expandedProducts.has(product.name) ? "rotate-180" : ""
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 break-words">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {product.variations.length} {product.variations.length === 1 ? "option" : "options"}
                          </p>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-0 ml-4 flex-shrink-0">
                        <div className="w-24 text-right">
                          <span className="inline-flex items-center justify-center px-3 py-1 bg-orange-100 text-orange-600 rounded font-semibold text-sm">
                            {product.totalUnitsSold}
                          </span>
                        </div>
                        <div className="w-32 text-right">
                          <p className="font-semibold text-green-600">
                            ฿{product.totalRevenue.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Mobile Summary */}
                    <div className="px-6 py-2 sm:hidden flex gap-8 text-sm">
                      <div>
                        <p className="text-gray-400">Units: </p>
                        <p className="font-semibold text-orange-600">{product.totalUnitsSold}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Revenue: </p>
                        <p className="font-semibold text-green-600">฿{product.totalRevenue.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Expanded Variations */}
                    {expandedProducts.has(product.name) && (
                      <div className="bg-gray-50/50 border-t border-gray-50">
                        <div className="px-6 py-4">
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest pb-2 border-b border-gray-200">
                              <div className="flex-1">Variation</div>
                              <div className="w-24 text-right">Units</div>
                              <div className="w-32 text-right">Revenue</div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {product.variations.map((variation, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:bg-orange-50/30 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 break-words">
                                    {variation.variation || "Default"}
                                  </p>
                                </div>
                                <div className="w-24 text-right">
                                  <p className="font-semibold text-orange-600">
                                    {variation.unitsSold}
                                  </p>
                                </div>
                                <div className="w-32 text-right">
                                  <p className="font-semibold text-green-600">
                                    ฿{variation.totalRevenue.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-10 text-center text-gray-400 italic">
                No products found. Try adjusting your search.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
