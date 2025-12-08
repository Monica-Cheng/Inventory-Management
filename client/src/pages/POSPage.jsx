// client/src/pages/POSPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { getDeployedProducts } from "../services/deploymentsApi";
import { createOrder, updateOrder } from "../services/ordersApi";
import CategoryTabs from "../components/CategoryTabs";
import ProductCard from "../components/ProductCard";
import OrderDrawer from "../components/OrderDrawer";

function POSPage() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [orderItems, setOrderItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [baseProducts, setBaseProducts] = useState([]);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const navigate = useNavigate();

  function getAvailable(p) {
    if (p.is_unlimited) return Infinity;
    return Number(p.available ?? p.deployed_qty ?? p.quantity ?? 0);
  }

  // Load deployed products for POS
  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");
      const data = await getDeployedProducts();
      const normalized = (data || []).map((p) => ({
        ...p,
        id: p.id || p.product_id,
      }));
      setProducts(normalized);
      setBaseProducts(normalized.map((p) => ({ ...p })));
      // After products load, see if we have an order to edit
      try {
        const raw = localStorage.getItem("sb_edit_order");
        if (raw) {
          const data = JSON.parse(raw);
          if (Array.isArray(data.items)) {
            const preloaded = data.items.map((it) => {
              const match = normalized.find((p) => p.id === it.product_id);
              const product =
                match ||
                {
                  id: it.product_id,
                  name: it.product_name || `#${it.product_id}`,
                  price: it.unit_price,
                  is_unlimited: false,
                  available: it.quantity, // at least allow current qty
                };
              return { product, qty: it.quantity };
            });
            setOrderItems(preloaded);
            if (data.payment_method) setPaymentMethod(data.payment_method);
            if (data.id) setEditingOrderId(data.id);
          }
          localStorage.removeItem("sb_edit_order");
        }
      } catch (e) {
        // ignore parse errors
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  // Unique category names from products
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category_name) set.add(p.category_name);
    });
    return ["All", ...Array.from(set)];
  }, [products]);

  // Filtered visible products
  const visibleProducts = useMemo(() => {
    let list = products;

    if (selectedCategory !== "All") {
      list = list.filter((p) => p.category_name === selectedCategory);
    }
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.category_name || "").toLowerCase().includes(term)
      );
    }
    return list;
  }, [products, selectedCategory, search]);

  // Helper: find item in order
  function findOrderItem(productId) {
    return orderItems.find((item) => item.product.id === productId);
  }

  function adjustAvailable(productId, delta) {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        if (p.is_unlimited) return p;
        const avail = getAvailable(p);
        const next = Math.max(0, avail + delta);
        return { ...p, available: next };
      })
    );
  }

  // Add or increase product in order
  function handleAddProduct(product) {
    const available = getAvailable(product);
    if (!product.is_unlimited && available <= 0) {
      alert("No more stock for this product.");
      return;
    }

    setOrderItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product, qty: 1 }];
    });
    if (!product.is_unlimited) adjustAvailable(product.id, -1);
  }

  function handleDecreaseProduct(productId) {
    const item = findOrderItem(productId);
    if (!item) return;
    if (!item.product.is_unlimited) adjustAvailable(productId, +1);

    setOrderItems((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? { ...i, qty: i.qty - 1 } : i
        )
        .filter((i) => i.qty > 0)
    );
  }

  function handleRemoveProduct(productId) {
    const item = findOrderItem(productId);
    if (item && !item.product.is_unlimited) {
      adjustAvailable(productId, item.qty);
    }
    setOrderItems((prev) => prev.filter((i) => i.product.id !== productId));
  }

  // Compute totals
  const totals = useMemo(() => {
    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.qty * (item.product.price || 0),
      0
    );
    return {
      subtotal,
      total: subtotal, // you can add tax/discount here later
      itemCount: orderItems.reduce((sum, item) => sum + item.qty, 0),
    };
  }, [orderItems]);

  // Submit order
  async function handleSubmitOrder() {
    if (!orderItems.length) return;
    try {
      setSubmitting(true);
      setError("");

      const payload = {
        payment_method: paymentMethod,
        items: orderItems.map((i) => ({
          product_id: i.product.id,
          quantity: i.qty,
        })),
      };

      if (editingOrderId) {
        await updateOrder(editingOrderId, payload);
        alert("Order modified!");
      } else {
        await createOrder(payload);
        alert("Order created!");
      }

      // clear order
      setOrderItems([]);
      setEditingOrderId(null);
      await loadProducts(); // refresh available after server updates
    } catch (err) {
      console.error(err);
      if (editingOrderId) {
        setError(err?.response?.data?.error || "Failed to modify order.");
      } else {
        setError(err?.response?.data?.error || "Failed to create order.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancelOrder() {
    setOrderItems([]);
    setProducts(baseProducts.map((p) => ({ ...p })));
    setEditingOrderId(null);
  }

  return (
    <div className="pos-root">
      {/* Header */}
      <header className="pos-header">
        <div className="pos-title-block">
          <div className="pos-logo-text-main">POS</div>
          <div className="pos-logo-text-sub">Menu & ordering</div>
        </div>

        <button className="cart-toggle">
          Cart • {totals.itemCount} items · ${totals.total.toFixed(2)}
        </button>
      </header>

      {/* Main area */}
      <main className="pos-main">
        {/* Left: products */}
        <section className="pos-products-area">
          <div className="pos-products-toolbar">
            <CategoryTabs
              categories={categories}
              selected={selectedCategory}
              onChange={setSelectedCategory}
            />

            <div className="pos-search">
              <input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading && <div>Loading products…</div>}
          {error && <div style={{ color: "red", fontSize: 13 }}>{error}</div>}

          {!loading && !products.length && (
            <div className="empty-state">
              No deployed products yet. Go to admin to deploy items.
            </div>
          )}

          <div className="pos-grid">
            {visibleProducts.map((product) => {
              const inOrder = findOrderItem(product.id);
              const currentQty = inOrder ? inOrder.qty : 0;
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  currentQty={currentQty}
                  onAdd={() => handleAddProduct(product)}
                />
              );
            })}
          </div>
        </section>

        {/* Right: order drawer */}
        <aside className="order-drawer">
          <OrderDrawer
            items={orderItems}
            orderId={editingOrderId}
            totals={totals}
            paymentMethod={paymentMethod}
            onChangePayment={setPaymentMethod}
            onIncrease={handleAddProduct}
            onDecrease={handleDecreaseProduct}
            onRemove={handleRemoveProduct}
            onSubmit={handleSubmitOrder}
            onCancel={handleCancelOrder}
            submitting={submitting}
          />
        </aside>
      </main>
    </div>
  );
}

export default POSPage;
