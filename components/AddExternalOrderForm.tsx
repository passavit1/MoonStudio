"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, X, AlertCircle, CheckCircle, Trash2 } from "lucide-react";

interface OrderItem {
  id: string; // temp id for form
  productName: string;
  quantity: number;
  price: number;
}

interface ExternalOrderFormData {
  orderId: string;
  customerName: string;
  items: OrderItem[];
  shippingFee: number;
  paymentMethod: string;
  status: string;
  notes: string;
}

export function AddExternalOrderForm() {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [products, setProducts] = useState<string[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<string[]>([]);
  const [productSearchFocus, setProductSearchFocus] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExternalOrderFormData>({
    orderId: `EXT-${Date.now()}`,
    customerName: "",
    items: [{ id: "item-0", productName: "", quantity: 1, price: 0 }],
    shippingFee: 0,
    paymentMethod: "Cash",
    status: "Completed",
    notes: "",
  });

  // Fetch products list on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        const uniqueNames = Array.from(
          new Set(data.map((p: any) => p.name))
        ) as string[];
        setProducts(uniqueNames.sort());
      } catch (err) {
        console.error("Failed to fetch products:", err);
      }
    };

    if (showModal) {
      fetchProducts();
    }
  }, [showModal]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "shippingFee" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleItemChange = (
    itemId: string,
    field: keyof OrderItem,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              [field]:
                field === "quantity" || field === "price"
                  ? parseFloat(value) || 0
                  : value,
            }
          : item
      ),
    }));

    // Handle product search
    if (field === "productName") {
      const search = value.toLowerCase();
      if (search) {
        setFilteredProducts(
          products.filter((p) => p.toLowerCase().includes(search)).slice(0, 5)
        );
        setProductSearchFocus(itemId);
      } else {
        setFilteredProducts([]);
        setProductSearchFocus(null);
      }
    }
  };

  const selectProduct = (itemId: string, productName: string) => {
    handleItemChange(itemId, "productName", productName);
    setFilteredProducts([]);
    setProductSearchFocus(null);
  };

  const addItem = () => {
    const newId = `item-${Date.now()}`;
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: newId, productName: "", quantity: 1, price: 0 },
      ],
    }));
  };

  const removeItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.customerName) {
      setError("Customer name is required");
      return;
    }
    if (formData.items.length === 0) {
      setError("Add at least one item");
      return;
    }
    if (formData.items.some((item) => !item.productName || item.price <= 0)) {
      setError("All items must have a product name and valid price");
      return;
    }

    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const subtotal = calculateSubtotal();
      const orderAmount = subtotal + formData.shippingFee;

      const payload = {
        orderId: formData.orderId,
        customerName: formData.customerName,
        items: formData.items.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingFee: formData.shippingFee,
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        notes: formData.notes,
        subtotal,
        orderAmount,
      };

      const response = await fetch("/api/orders/create-external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      setSuccess(true);
      // Reset form
      setFormData({
        orderId: `EXT-${Date.now()}`,
        customerName: "",
        items: [{ id: "item-0", productName: "", quantity: 1, price: 0 }],
        shippingFee: 0,
        paymentMethod: "Cash",
        status: "Completed",
        notes: "",
      });

      setTimeout(() => {
        setShowModal(false);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const subtotal = calculateSubtotal();
  const orderAmount = subtotal + formData.shippingFee;

  return (
    <>
      <button
        onClick={() => {
          setShowModal(true);
          setError(null);
          setSuccess(false);
        }}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        <Plus size={20} />
        Add External Order
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl mx-4 my-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add External Order</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Success message */}
            {success && (
              <div className="mb-4 flex items-center gap-2 bg-green-50 text-green-800 rounded-lg px-3 py-2 text-sm">
                <CheckCircle size={16} />
                Order created successfully!
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-4 flex items-start gap-2 bg-red-50 text-red-800 rounded-lg px-3 py-2 text-sm">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Order ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order ID <span className="text-gray-400 text-xs">(auto-generated)</span>
                </label>
                <input
                  type="text"
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleInputChange}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-50"
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="e.g., John Doe"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Items Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold text-gray-700">
                    Order Items <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                  >
                    <Plus size={14} />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, idx) => (
                    <div key={item.id} className="p-3 border border-gray-200 rounded-lg space-y-2">
                      {/* Item number */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500">Item {idx + 1}</span>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        )}
                      </div>

                      {/* Product Name with Search */}
                      <div className="relative">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) =>
                            handleItemChange(item.id, "productName", e.target.value)
                          }
                          placeholder="Search or type product name..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                          required
                        />
                        {/* Product suggestions dropdown */}
                        {productSearchFocus === item.id && filteredProducts.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                            {filteredProducts.map((product) => (
                              <button
                                key={product}
                                type="button"
                                onClick={() => selectProduct(item.id, product)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-blue-50 transition-colors"
                              >
                                {product}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Quantity & Price */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Qty <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(item.id, "quantity", e.target.value)
                            }
                            min="1"
                            required
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Price <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-2 top-1.5 text-gray-600 text-sm">฿</span>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) =>
                                handleItemChange(item.id, "price", e.target.value)
                              }
                              min="0"
                              step="0.01"
                              required
                              className="w-full pl-5 pr-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Item subtotal */}
                      <div className="text-right text-xs text-gray-600">
                        Subtotal: <span className="font-semibold text-gray-900">฿{(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping & Totals */}
              <div className="border-t pt-4 space-y-2 bg-gray-50 p-3 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping Fee
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-600">฿</span>
                      <input
                        type="number"
                        name="shippingFee"
                        value={formData.shippingFee}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Card">Card</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Summary */}
                <div className="border-t border-gray-300 pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items Subtotal:</span>
                    <span className="font-semibold text-gray-900">฿{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-semibold text-gray-900">฿{formData.shippingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-gray-300 pt-1">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-green-600">฿{orderAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Status & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Add notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Creating...
                    </>
                  ) : (
                    "Create Order"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
