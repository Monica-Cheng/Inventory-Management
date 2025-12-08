// backend/admin/deploymentListRoutes.js

const express = require("express");
const router = express.Router();

const { listDeployedProducts } = require("./deploymentRepository");

function parseCookies(raw) {
  if (!raw) return {};
  return raw.split(";").reduce((acc, pair) => {
    const [k, ...rest] = pair.trim().split("=");
    acc[k] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

// Admin + Staff can see deployed products for POS
router.get("/list", async (req, res) => {
  try {
    const products = await listDeployedProducts();
    res.json(products);
  } catch (err) {
    console.error("Deployment list error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
