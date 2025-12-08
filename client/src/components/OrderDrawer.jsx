// client/src/components/OrderDrawer.jsx
import React from "react";

const PAYMENT_OPTIONS = ["Cash", "Card", "GrabPay", "WeChat Pay"];

function OrderDrawer({
  items,
  orderId,
  totals,
  paymentMethod,
  onChangePayment,
  onIncrease,
  onDecrease,
  onRemove,
  onSubmit,
  onCancel,
  submitting,
}) {
  const hasItems = items.length > 0;

  return (
    <>
      <div className="order-drawer-header">
        <div className="order-drawer-title">
          Order summary {orderId ? `#${orderId}` : ""}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          {totals.itemCount} items
        </div>
      </div>

      <div className="order-drawer-body">
        {!hasItems && (
          <div className="empty-state">
            No items yet. Tap on products to add them.
          </div>
        )}

        {items.map((item) => {
          const p = item.product;
          const priceNumber = Number(p.price) || 0;
          const lineTotal = priceNumber * item.qty;
          return (
            <div className="cart-row" key={p.id}>
              <div className="cart-main">
                <div className="cart-name">{p.name}</div>
                <div className="cart-meta">
                  ${priceNumber.toFixed(2)} each
                </div>
              </div>
              <div className="cart-actions">
                <button
                  type="button"
                  className="cart-qty-btn"
                  onClick={() => onDecrease(p.id)}
                >
                  –
                </button>
                <div className="cart-qty-display">{item.qty}</div>
                <button
                  type="button"
                  className="cart-qty-btn"
                  onClick={() => onIncrease(p)}
                >
                  +
                </button>
              </div>
              <div className="cart-price">
                ${lineTotal.toFixed(2)}
              </div>
              <button
                type="button"
                className="cart-remove"
                onClick={() => onRemove(p.id)}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <div className="order-drawer-footer">
        <div className="order-summary-row">
          <span>Subtotal</span>
          <span>${totals.subtotal.toFixed(2)}</span>
        </div>
        {/* Add tax/discount rows here in the future */}

        <div className="order-total">
          Total ${totals.total.toFixed(2)}
        </div>

        <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
          Payment method
        </div>
        <div className="payment-methods">
          {PAYMENT_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`payment-pill ${
                paymentMethod === opt ? "active" : ""
              }`}
              onClick={() => onChangePayment(opt)}
            >
              {opt}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="order-submit-btn"
          disabled={!hasItems || submitting}
          onClick={onSubmit}
        >
          {submitting ? "Creating order..." : "Complete order"}
        </button>
        <button
          type="button"
          className="btn secondary"
          style={{ marginTop: 8, width: "100%" }}
          disabled={!hasItems || submitting}
          onClick={onCancel}
        >
          Cancel order
        </button>
      </div>
    </>
  );
}

export default OrderDrawer;
