const express = require('express');
const path = require('path');
const registerRoutes = require('./backend/routes/registerRoutes');
const adminDashboardRoutes = require('./backend/admin/dashboardRoutes');
const adminCategoryRoutes = require('./backend/admin/categoryRoutes');
const adminProductRoutes = require('./backend/admin/productRoutes');
const { getSession } = require('./backend/auth/sessionStore');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(registerRoutes);
app.use(adminDashboardRoutes);
app.use(adminCategoryRoutes);
app.use(adminProductRoutes);

// protect admin dashboard page
app.get(
  '/admin/dashboard.html',
  (req, res, next) => {
    const raw = req.headers.cookie;
    const cookies = raw
      ? raw.split(';').reduce((acc, pair) => {
          const [k, ...rest] = pair.trim().split('=');
          acc[k] = decodeURIComponent(rest.join('='));
          return acc;
        }, {})
      : {};
    const session = getSession(cookies.admin_token);
    if (!session || session.role !== 'admin') {
      return res.redirect('/login.html');
    }
    next();
  },
  (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
  }
);

// protect admin categories page
app.get(
  '/admin/categories.html',
  (req, res, next) => {
    const raw = req.headers.cookie;
    const cookies = raw
      ? raw.split(';').reduce((acc, pair) => {
          const [k, ...rest] = pair.trim().split('=');
          acc[k] = decodeURIComponent(rest.join('='));
          return acc;
        }, {})
      : {};
    const session = getSession(cookies.admin_token);
    if (!session || session.role !== 'admin') {
      return res.redirect('/login.html');
    }
    next();
  },
  (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'categories.html'));
  }
);

// protect admin products page
app.get(
  '/admin/products.html',
  (req, res, next) => {
    const raw = req.headers.cookie;
    const cookies = raw
      ? raw.split(';').reduce((acc, pair) => {
          const [k, ...rest] = pair.trim().split('=');
          acc[k] = decodeURIComponent(rest.join('='));
          return acc;
        }, {})
      : {};
    const session = getSession(cookies.admin_token);
    if (!session || session.role !== 'admin') {
      return res.redirect('/login.html');
    }
    next();
  },
  (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'products.html'));
  }
);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
