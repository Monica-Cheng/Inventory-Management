// client/src/services/categoriesApi.js
import axios from "axios";

export async function listCategories() {
  const res = await axios.get("/api/admin/categories", { withCredentials: true });
  return res.data?.items || [];
}

export async function createCategory({ name, description }) {
  const res = await axios.post(
    "/api/admin/categories",
    { name, description },
    { withCredentials: true }
  );
  return res.data;
}
