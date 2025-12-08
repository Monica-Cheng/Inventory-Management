// client/src/pages/LoginPage.jsx
import React, { useState } from "react";
import "../App.css";
import { login } from "../services/authApi";

function LoginPage({ onLogin }) {
  const [role, setRole] = useState("admin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const data = await login({ role, identifier, password });
      const user = data?.user;
      if (onLogin && user) onLogin(user);
    } catch (err) {
      const msg =
        err?.response?.data?.error || err.message || "Login failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Sign in</h2>
        <p className="muted">Use your email/phone/user ID with password.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Role
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </label>

          <label>
            Email / phone / user ID
            <input
              type="text"
              placeholder="e.g. admin@shop.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </label>

          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {error && <div className="auth-error">{error}</div>}
      </div>
    </div>
  );
}

export default LoginPage;
