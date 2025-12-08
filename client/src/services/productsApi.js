// client/src/services/productsApi.js
import axios from "axios";

export async function listProducts() {
  const res = await axios.get("/api/products", { withCredentials: true });
  return res.data || [];
}

export async function createProduct(payload) {
  const res = await axios.post("/api/products", payload, { withCredentials: true });
  return res.data;
}

export async function updateProduct(id, payload) {
  const res = await axios.put(`/api/products/${id}`, payload, { withCredentials: true });
  return res.data;
}

export async function deleteProduct(id) {
  const res = await axios.delete(`/api/products/${id}`, { withCredentials: true });
  return res.data;
}
