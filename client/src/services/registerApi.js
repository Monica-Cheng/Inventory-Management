// client/src/services/registerApi.js
import axios from "axios";

export async function registerUser(payload) {
  const res = await axios.post("/api/register", payload, {
    withCredentials: true,
  });
  return res.data;
}
