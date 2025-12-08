// client/src/components/ProductCard.jsx
import React from "react";

// Simple mapping: category -> emoji
function getEmojiForCategory(categoryName) {
  const name = (categoryName || "").toLowerCase();
  if (name.includes("drink") || name.includes("beverage")) return "🥤";
  if (name.includes("coffee")) return "☕️";
  if (name.includes("dessert") || name.includes("ice cream")) return "🍨";
  if (name.includes("snack")) return "🍪";
  if (name.includes("beer") || name.includes("alcohol")) return "🍺";
  if (name.includes("food") || name.includes("meal")) return "🍱";
  return "📦"; // default
}

function ProductCard({ product, currentQty, onAdd }) {
  const emoji = getEmojiForCategory(product.category_name);
  const isUnlimited = !!product.is_unlimited;
  const available = isUnlimited
    ? null
    : product.available ?? product.deployed_qty ?? product.quantity ?? 0;

  const lowStock = !isUnlimited && available !== null && available <= 5;
  const outOfStock = !isUnlimited && available <= 0;
  // MySQL may return DECIMAL as string; coerce to number before formatting
  const priceNumber = Number(product.price);
  const priceDisplay = Number.isFinite(priceNumber)
    ? priceNumber.toFixed(2)
    : "0.00";

  return (
    <div
      className={`product-card ${outOfStock ? "disabled" : ""}`}
      onClick={() => {
        if (outOfStock) return;
        onAdd();
      }}
    >
      <div className="product-header">
        <div className="product-name">{product.name}</div>
        <div className="product-category-chip">
          {product.category_name || "Uncategorised"}
        </div>
      </div>

      <div className="product-icon">{emoji}</div>

      {/* stock badge */}
      {isUnlimited ? (
        <div className="product-stock-badge unlimited">∞</div>
      ) : (
        <div
          className={`product-stock-badge ${
            lowStock ? "low" : ""
          }`}
        >
          {available}
        </div>
      )}

      {/* qty badge when added */}
      {currentQty > 0 && (
        <div className="product-qty-pill">In order: {currentQty}</div>
      )}

      <div className="product-bottom">
        <div className="product-price">
          ${priceDisplay}
          <span>/ unit</span>
        </div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>
          {outOfStock ? "Out of stock" : "tap to add"}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
