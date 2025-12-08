// client/src/pages/OrdersPage.jsx
import React, { useEffect, useState } from "react";
import "../App.css";
import { listOrders, getOrder, updateOrderStatus } from "../services/ordersApi";
import { useNavigate } from "react-router-dom";

const STATUS_OPTIONS = ["PENDING", "PAID", "CANCELLED"];

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [viewOrder, setViewOrder] = useState(null);
  const [editOrderModal, setEditOrderModal] = useState(null);
  const [statusModal, setStatusModal] = useState(null); // {id, status}
  const [actionMenuId, setActionMenuId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return today;
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    return today;
  });
  const navigate = useNavigate();

  async function load() {
    try {
      setLoading(true);
      setError("");
      const data = await listOrders();
      setOrders(data || []);
      if (data?.length && !selectedId) {
        handleSelect(data[0].id);
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Failed to load orders";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const closeMenu = () => setActionMenuId(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  async function handleSelect(id) {
    setSelectedId(id);
    setMessage("");
    setError("");
    try {
      const detail = await getOrder(id);
      setSelected(detail || null);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Failed to load order";
      setError(msg);
      setSelected(null);
    }
  }

  async function handleStatusChange(newStatus) {
    if (!selectedId) return;
    try {
      setError("");
      setMessage("");
      await updateOrderStatus(selectedId, newStatus);
      setMessage(`Status updated for order #${selectedId}`);
      await load();
      await handleSelect(selectedId);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Failed to update status";
      setError(msg);
    }
  }

  return (
    <div className="orders-page">
      <div className="orders-list">
        <div className="orders-head">Orders</div>
        <div className="orders-filters">
          <div className="orders-status-tabs">
            {["all", "PAID", "PENDING", "CANCELLED"].map((s) => (
              <button
                key={s}
                className={`tab-pill ${statusFilter === s ? "active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "All orders" : s}
              </button>
            ))}
          </div>
          <div className="date-range">
            <label>
              From
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && val < startDate) return;
                  setEndDate(val);
                }}
              />
            </label>
          </div>
          <div className="orders-search">
            <input
              className="filter-input"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {loading && <div>Loading…</div>}
        {error && <div className="auth-error">{error}</div>}
        <div className="orders-table">
          <div className="orders-row head">
            <div>ID</div>
            <div>Date</div>
            <div>Items</div>
            <div>Total</div>
              <div>Status</div>
            <div>Action</div>
          </div>
          {orders
            .filter((o) => {
              const term = search.toLowerCase();
              const matchesSearch =
                !term ||
                String(o.id).includes(term) ||
                new Date(o.created_at).toLocaleString().toLowerCase().includes(term);
              const matchesStatus =
                statusFilter === "all" ? true : o.status === statusFilter;
              const orderDate = new Date(o.created_at).toISOString().slice(0, 10);
              const withinRange =
                (!startDate || orderDate >= startDate) && (!endDate || orderDate <= endDate);
              return matchesSearch && matchesStatus && withinRange;
            })
            .map((o) => (
            <div
              className={`orders-row ${selectedId === o.id ? "active" : ""}`}
              key={o.id}
              onClick={() => handleSelect(o.id)}
            >
              <div>#{o.id}</div>
              <div>{new Date(o.created_at).toLocaleString()}</div>
              <div>{o.item_count}</div>
              <div>${Number(o.total).toFixed(2)}</div>
              <div>
                <StatusPill status={o.status} />
              </div>
              <div className="action-cell" onClick={(e) => e.stopPropagation()}>
                <button
                  className="action-dots"
                  onClick={() => setActionMenuId(actionMenuId === o.id ? null : o.id)}
                >
                  ⋮
                </button>
                {actionMenuId === o.id && (
                  <div className="action-menu">
                    <button
                      onClick={async () => {
                        const detail = await getOrder(o.id);
                        setViewOrder(detail);
                        setActionMenuId(null);
                      }}
                    >
                      View order
                    </button>
                    <button
                      onClick={() => {
                        setSelectedId(o.id);
                        setStatusModal({ id: o.id, status: o.status });
                        setActionMenuId(null);
                      }}
                    >
                      Edit status
                    </button>
                    <button
                      onClick={async () => {
                        const detail = await getOrder(o.id);
                        if (detail) setEditOrderModal(detail);
                        setActionMenuId(null);
                      }}
                    >
                      Edit order
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {viewOrder && (
        <Modal onClose={() => setViewOrder(null)}>
          <div className="orders-detail-title">Order #{viewOrder.id}</div>
          <div className="muted">{new Date(viewOrder.created_at).toLocaleString()}</div>
          <div className="orders-detail-section">
            <div className="section-label">Items</div>
            <div className="orders-items head-row orders-item-row">
              <div className="orders-item-name">Product (price)</div>
              <div className="muted">Quantity</div>
              <div className="orders-item-total">Total</div>
            </div>
            <div className="orders-items">
              {Array.isArray(viewOrder.items) && viewOrder.items.length > 0 ? (
                viewOrder.items.map((it) => (
                  <div className="orders-item-row" key={it.id}>
                    <div className="orders-item-name">
                      {it.product_name || `#${it.product_id}`}{" "}
                      <span className="muted">(${Number(it.unit_price).toFixed(2)})</span>
                    </div>
                    <div className="muted">{it.quantity}</div>
                    <div className="orders-item-total">
                      ${(it.quantity * Number(it.unit_price)).toFixed(2)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="orders-item-row">
                  <div className="muted">No items</div>
                </div>
              )}
            </div>
            <div className="orders-summary">
              <div>Payment: {viewOrder.payment_method || "—"}</div>
              <div>Total: ${Number(viewOrder.total).toFixed(2)}</div>
            </div>
          </div>
        </Modal>
      )}

      {editOrderModal && (
        <Modal onClose={() => setEditOrderModal(null)}>
          <div className="orders-detail-head">
            <div>
              <div className="orders-detail-title">Order #{editOrderModal.id}</div>
              <div className="muted">{new Date(editOrderModal.created_at).toLocaleString()}</div>
            </div>
            <StatusPill status={editOrderModal.status} />
          </div>
          <div className="orders-detail-actions">
            <div className="order-total-inline">Total: ${Number(editOrderModal.total).toFixed(2)}</div>
            <button
              className="btn secondary"
              onClick={() => {
                const payload = {
                  id: editOrderModal.id,
                  payment_method: editOrderModal.payment_method,
                  items: editOrderModal.items || [],
                };
                localStorage.setItem("sb_edit_order", JSON.stringify(payload));
                navigate("/pos");
              }}
            >
              Edit in POS
            </button>
          </div>

          <div className="orders-detail-section">
            <div className="section-label">Items</div>
            <div className="orders-items head-row orders-item-row">
              <div className="orders-item-name">Product (price)</div>
              <div className="muted">Quantity</div>
              <div className="orders-item-total">Total</div>
            </div>
            <div className="orders-items">
              {Array.isArray(editOrderModal.items) && editOrderModal.items.length > 0 ? (
                editOrderModal.items.map((it) => (
                  <div className="orders-item-row" key={it.id}>
                    <div className="orders-item-name">
                      {it.product_name || `#${it.product_id}`}{" "}
                      <span className="muted">(${Number(it.unit_price).toFixed(2)})</span>
                    </div>
                    <div className="muted">{it.quantity}</div>
                    <div className="orders-item-total">
                      ${(it.quantity * Number(it.unit_price)).toFixed(2)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="orders-item-row">
                  <div className="muted">No items</div>
                </div>
              )}
            </div>
            <div className="orders-summary">
              <div>Payment: {editOrderModal.payment_method || "—"}</div>
              <div>Total: ${Number(editOrderModal.total).toFixed(2)}</div>
            </div>
          </div>

          {Array.isArray(editOrderModal.logs) && editOrderModal.logs.length > 0 && (
            <div className="orders-detail-section">
              <div className="section-label">Changes</div>
              <div className="orders-items">
                {editOrderModal.logs.map((log) => {
                  let detail;
                  try {
                    detail = log.detail ? JSON.parse(log.detail) : null;
                  } catch (e) {
                    detail = null;
                  }
                  const actor =
                    detail?.actorName ||
                    (log.actor_role ? `${log.actor_role} #${log.actor_id || "-"}` : "Unknown");
                  const changes = Array.isArray(detail?.changes) ? detail.changes : [];
                  return (
                    <div
                      className="orders-item-row"
                      key={log.id}
                      style={{ flexDirection: "column", alignItems: "flex-start" }}
                    >
                      <div className="orders-item-name">
                        Updated by {actor} on {new Date(log.created_at).toLocaleString()}
                      </div>
                      <div className="changes-stack">
                        {changes.length === 0 && (
                          <div className="muted" style={{ fontSize: 12 }}>
                            No item changes
                          </div>
                        )}
                        {changes.map((c, idx) => (
                          <div className="muted change-line" key={idx}>
                            {c.product_name}: <span className="change-from">{c.from}</span> →{" "}
                            <span className="change-to">{c.to}</span>
                          </div>
                        ))}
                        {detail?.paymentMethod && (
                          <div className="muted change-line">Payment: {detail.paymentMethod}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Modal>
      )}

      {statusModal && (
        <Modal onClose={() => setStatusModal(null)}>
          <div className="orders-detail-title">Update status for Order #{statusModal.id}</div>
          <div className="status-actions" style={{ marginTop: 10 }}>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                className={`status-button ${statusModal.status === s ? "active" : ""}`}
                onClick={() => setStatusModal({ ...statusModal, status: s })}
              >
                {s}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button
              className="btn primary"
              onClick={async () => {
                await handleStatusChange(statusModal.status);
                setStatusModal(null);
              }}
            >
              Save
            </button>
            <button className="btn secondary" onClick={() => setStatusModal(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  return <span className={`status-pill ${status?.toLowerCase()}`}>{status}</span>;
}

function Modal({ children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        {children}
      </div>
    </div>
  );
}

export default OrdersPage;
