// client/src/components/CategoryTabs.jsx
import React from "react";

function CategoryTabs({ categories, selected, onChange }) {
  return (
    <div className="tabs">
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          className={`tab-pill ${selected === cat ? "active" : ""}`}
          onClick={() => onChange(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

export default CategoryTabs;