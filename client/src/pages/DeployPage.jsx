// client/src/pages/DeployPage.jsx
import React, { useEffect, useState } from "react";
import "../App.css";
import { getDeployedProducts, setDeployment, deleteDeployment } from "../services/deploymentsApi";

function DeployPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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
      const data = await getDeployedProducts();
      setItems(data || []);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Failed to load products";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(product, newQty) {
    const productId = product.product_id || product.id;
    try {
      setSavingId(productId);
      setError("");
      setMessage("");
      const result = await setDeployment(productId, Number(newQty));
      const qty = result?.deployment?.deployed_qty ?? newQty;
      const name = result?.deployment?.product_name || product.name;
      setMessage(`Deployment updated: ${name} now deployed ${qty}`);
      await load();
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Failed to save";
      setError(msg);
    } finally {
      setSavingId(null);
    }
  }

  async function handleRemove(product) {
    const productId = product.product_id || product.id;
    if (!window.confirm("Remove this deployment? It will disappear from POS.")) return;
    try {
      setSavingId(productId);
      setError("");
      setMessage("");
      await deleteDeployment(productId);
      setMessage(`Removed deployment for ${product.name}`);
      await load();
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Failed to remove";
      setError(msg);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="deploy-page">
      <div className="deploy-header">
        <h2>Deploy products</h2>
        <p className="muted">Set how many units are available on POS.</p>
      </div>

      {error && <div className="auth-error">{error}</div>}
      {message && <div className="auth-success">{message}</div>}

      <div className="deploy-table">
        <div className="deploy-row deploy-head">
          <div className="col-name">Product</div>
          <div className="col-cat">Category</div>
          <div className="col-stock">Total stock</div>
          <div className="col-deployed">Deployed</div>
          <div className="col-actions">Action</div>
        </div>
        {loading && <div className="deploy-row">Loading…</div>}
        {!loading &&
          items.map((p) => (
            <DeployRow
              key={p.product_id || p.id}
              product={p}
              onSave={handleSave}
              onRemove={handleRemove}
              saving={savingId === (p.product_id || p.id)}
              openActionId={openActionId}
              setOpenActionId={setOpenActionId}
            />
          ))}
      </div>
    </div>
  );
}

function DeployRow({ product, onSave, onRemove, saving, openActionId, setOpenActionId }) {
  const productId = product.product_id || product.id;
  const available =
    product.available ??
    (product.deployed_qty != null && product.sold_qty != null
      ? product.deployed_qty - product.sold_qty
      : null);
  const [qty, setQty] = useState(
    available != null ? available : product.deployed_qty ?? 0
  );

  return (
    <div className="deploy-row">
      <div className="col-name">
        <div className="row-title">{product.name}</div>
        <div className="row-sub">#{productId}</div>
      </div>
      <div className="col-cat">{product.category_name || "—"}</div>
      <div className="col-stock">
        {product.is_unlimited ? "∞" : product.total_stock ?? 0}
      </div>
      <div className="col-deployed">
        {product.is_unlimited ? (
          <div className="muted">Unlimited</div>
        ) : (
          <>
            <input
              type="number"
              min="0"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
            <div className="muted" style={{ fontSize: 11 }}>
              Available on POS: {available != null ? available : "—"}
            </div>
          </>
        )}
      </div>
      <div className="col-actions action-cell">
        <button
          className="action-dots"
          onClick={(e) => {
            e.stopPropagation();
            setOpenActionId(openActionId === productId ? null : productId);
          }}
        >
          •••
        </button>
        {openActionId === productId && (
          <div
            className="action-menu"
            onClick={(e) => e.stopPropagation()}
          >
            {!product.is_unlimited && (
              <button disabled={saving} onClick={() => onSave(product, qty)}>
                {saving ? "Saving…" : "Save"}
              </button>
            )}
            <button disabled={saving} onClick={() => onRemove(product)}>
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeployPage;
