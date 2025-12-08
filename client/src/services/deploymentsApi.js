// client/src/services/deploymentsApi.js
import axios from "axios";

export async function getDeployedProducts() {
  const res = await axios.get("/api/deployments/list", {
    withCredentials: true, // send cookies for admin/staff auth
  });
  return res.data;
}

export async function setDeployment(product_id, deploy_qty) {
  const res = await axios.post(
    "/api/deployments",
    { product_id, deploy_qty },
    { withCredentials: true }
  );
  return res.data;
}

export async function deleteDeployment(product_id) {
  const res = await axios.delete(`/api/deployments/${product_id}`, {
    withCredentials: true,
  });
  return res.data;
}
