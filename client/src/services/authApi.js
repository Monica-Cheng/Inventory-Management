// client/src/services/authApi.js
import axios from "axios";

export async function login({ role, identifier, password }) {
  const payload = { role, identifier, password };
  const res = await axios.post("/api/login", payload, { withCredentials: true });
  return res.data;
}
