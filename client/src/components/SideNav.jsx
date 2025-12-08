// client/src/components/SideNav.jsx
import React from "react";
import { NavLink } from "react-router-dom";

function SideNav({ user, onLogout }) {
  return (
    <aside className="side-nav">
      <div className="side-brand">
        <div className="brand-icon">🍦</div>
        <div className="brand-name">StockBuddy</div>
      </div>

      <nav className="side-links">
        <NavLink to="/pos" className="side-link">
          POS
        </NavLink>
        <NavLink to="/deploy" className="side-link">
          Deploy
        </NavLink>
        <NavLink to="/products" className="side-link">
          Products
        </NavLink>
        <NavLink to="/orders" className="side-link">
          Orders
        </NavLink>
      </nav>

      <div className="side-footer">
        <div className="user-block">
          <div className="user-avatar">{user?.user_name?.[0]?.toUpperCase() || "U"}</div>
          <div>
            <div className="user-name">{user?.user_name || "User"}</div>
            <div className="user-role">{user?.role || ""}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          ↩ Logout
        </button>
      </div>
    </aside>
  );
}

export default SideNav;
