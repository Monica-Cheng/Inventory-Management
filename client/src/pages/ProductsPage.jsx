// client/src/pages/ProductsPage.jsx
import React, { useEffect, useState } from "react";
import "../App.css";
import { listCategories, createCategory } from "../services/categoriesApi";
import { listProducts, createProduct, updateProduct, deleteProduct } from "../services/productsApi";
import { setDeployment } from "../services/deploymentsApi";
import CollapsibleCard from "../components/CollapsibleCard";

function ProductsPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [totalStock, setTotalStock] = useState("");
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("");
  const [openActionId, setOpenActionId] = useState(null);

  useEffect(() => {
    function handleDocClick() {
      setOpenActionId(null);
    }
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const [cats, prods] = await Promise.all([listCategories(), listProducts()]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Failed to load data";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreateCategory(e) {
    e.preventDefault();
    try {
      setError("");
      setMessage("");
      await createCategory({ name: catName, description: catDesc });
      setCatName("");
      setCatDesc("");
      setMessage("Category created");
      await load();
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Failed to create category";
      setError(msg);
    }
  }

  async function handleCreateProduct(e) {
    e.preventDefault();
    try {
      setError("");
      setMessage("");
      const payload = {
        name,
        description,
        price: Number(price),
        total_stock: isUnlimited ? null : Number(totalStock || 0),
        is_unlimited: isUnlimited ? 1 : 0,
        categoryId: categoryId ? Number(categoryId) : null,
      };
      if (editingId) {
        await updateProduct(editingId, payload);
        setMessage("Product updated");
      } else {
        await createProduct(payload);
        setMessage("Product created");
      }
      setName("");
      setDescription("");
      setPrice("");
      setTotalStock("");
      setIsUnlimited(false);
      setCategoryId("");
      setEditingId(null);
      await load();
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Failed to create product";
      setError(msg);
    }
  }

  return (
    <div className="products-page">
      <div className="products-forms">
        <CollapsibleCard title="Create category" defaultOpen={true}>
          <form className="stacked" onSubmit={handleCreateCategory}>
            <label>
              Name
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
              />
            </label>
            <label>
              Description
              <input
                type="text"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
              />
            </label>
            <button className="btn primary" type="submit">
              Add category
            </button>
          </form>
        </CollapsibleCard>

        <CollapsibleCard title={editingId ? "Edit product" : "Create product"} defaultOpen={true}>
          <form className="stacked product-form" onSubmit={handleCreateProduct}>
            <label>
              Name
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <label>
              Category
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Uncategorised</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Price
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </label>
            <label>
              Total stock
              <input
                type="number"
                min="0"
                placeholder="Total stock"
                value={totalStock}
                onChange={(e) => setTotalStock(e.target.value)}
                disabled={isUnlimited}
              />
            </label>
            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={isUnlimited}
                onChange={(e) => setIsUnlimited(e.target.checked)}
              />
              <span>Unlimited (ignore stock)</span>
            </label>
            <label>
              Description
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="full-width-textarea"
              />
            </label>
            <button className="btn primary wide-btn" type="submit">
              {editingId ? "Save changes" : "Add product"}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setEditingId(null);
                  setName("");
                  setDescription("");
                  setPrice("");
                  setTotalStock("");
                  setIsUnlimited(false);
                  setCategoryId("");
                }}
              >
                Cancel edit
              </button>
            )}
          </form>
        </CollapsibleCard>
      </div>

      {error && <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>}
      {message && <div className="auth-success" style={{ marginTop: 12 }}>{message}</div>}

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="products-header">
          <h3>Products</h3>
          <input
            className="filter-input"
            placeholder="Search by name or category..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <div className="products-table">
          <div className="products-row head">
            <div>Name</div>
            <div>Category</div>
            <div>Price</div>
            <div>Stock</div>
            <div>Unlimited</div>
            <div>Action</div>
          </div>
            {products
              .filter((p) => {
                if (!filter.trim()) return true;
                const term = filter.toLowerCase();
                return (
                  p.name.toLowerCase().includes(term) ||
                  (p.category_name || "").toLowerCase().includes(term)
                );
              })
              .map((p) => (
                <div className="products-row" key={p.id}>
                  <div>{p.name}</div>
                  <div>{p.category_name || "—"}</div>
                <div>${Number(p.price).toFixed(2)}</div>
                <div>{p.is_unlimited ? "∞" : p.total_stock ?? 0}</div>
                <div>{p.is_unlimited ? "Yes" : "No"}</div>
                <div className="action-cell">
                  <button
                    className="action-dots"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionId(openActionId === p.id ? null : p.id);
                    }}
                  >
                    •••
                  </button>
                  {openActionId === p.id && (
                    <div
                      className="action-menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setEditingId(p.id);
                          setName(p.name);
                          setCategoryId(p.category_id || "");
                          setPrice(p.price);
                          setTotalStock(p.total_stock ?? "");
                          setIsUnlimited(!!p.is_unlimited);
                          setDescription(p.description || "");
                          setOpenActionId(null);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm("Delete this product?")) return;
                          try {
                            setError("");
                            setMessage("");
                            await deleteProduct(p.id);
                            setMessage("Product deleted");
                            await load();
                          } catch (err) {
                            const msg =
                              err?.response?.data?.error || err.message || "Failed to delete";
                            setError(msg);
                          } finally {
                            setOpenActionId(null);
                          }
                        }}
                      >
                        Delete
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            setError("");
                            setMessage("");
                            if (p.is_unlimited) {
                              await setDeployment(p.id, 0);
                              setMessage(`Deployment updated: ${p.name} (unlimited)`);
                            } else {
                              const suggested = p.total_stock ?? 0;
                              const input = window.prompt(
                                `Deploy quantity for ${p.name}`,
                                String(suggested)
                              );
                              if (input === null) return;
                              const qty = Number(input);
                              if (!Number.isFinite(qty) || qty < 0) {
                                alert("Enter a non-negative number");
                                return;
                              }
                              await setDeployment(p.id, qty);
                              setMessage(`Deployment updated: ${p.name} now deployed ${qty}`);
                            }
                          } catch (err) {
                            const msg =
                              err?.response?.data?.error ||
                              err.message ||
                              "Failed to deploy";
                            setError(msg);
                          } finally {
                            setOpenActionId(null);
                          }
                        }}
                      >
                        Deploy
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductsPage;
