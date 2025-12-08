// client/src/services/ordersApi.js
import axios from "axios";

export async function createOrder(payload) {
  const res = await axios.post("/api/orders", payload, {
    withCredentials: true,
  });
  return res.data;
}

export async function listOrders() {
  const res = await axios.get("/api/orders", { withCredentials: true });
  return res.data || [];
}

export async function getOrder(id) {
  const res = await axios.get(`/api/orders/${id}`, { withCredentials: true });
  return res.data;
}

export async function updateOrderStatus(id, status) {
  const res = await axios.patch(
    `/api/orders/${id}/status`,
    { status },
    { withCredentials: true }
  );
  return res.data;
}

export async function updateOrder(id, payload) {
  const res = await axios.put(`/api/orders/${id}`, payload, { withCredentials: true });
  return res.data;
}
