// client/src/pages/RegisterPage.jsx
import React, { useState } from "react";
import "../App.css";
import { registerUser } from "../services/registerApi";

function RegisterPage() {
  const [role, setRole] = useState("admin");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [adminId, setAdminId] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const payload = {
        role,
        user_name: userName,
        email,
        phone_number: phone,
        password,
      };
      if (userId.trim()) payload.user_id = userId.trim();
      if (role === "staff") payload.admin_id = adminId.trim();
      await registerUser(payload);
      setMessage("Registered! You can now log in.");
    } catch (err) {
      const msg =
        err?.response?.data?.error || err.message || "Registration failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create account</h2>
        <p className="muted">Register an admin or staff user.</p>

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
            Name
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={loading}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </label>

          <label>
            Phone number
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </label>

          <label>
            Optional user_id (if you want to set your own)
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={loading}
            />
          </label>

          {role === "staff" && (
            <label>
              Admin ID (required for staff)
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                disabled={loading}
                required
              />
            </label>
          )}

          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? "Registering…" : "Register"}
          </button>
        </form>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}
      </div>
    </div>
  );
}

export default RegisterPage;
