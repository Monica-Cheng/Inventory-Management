const express = require('express');
const path = require('path');
const registerRoutes = require('./backend/routes/registerRoutes');
const adminDashboardRoutes = require('./backend/admin/dashboardRoutes');
const adminCategoryRoutes = require('./backend/admin/categoryRoutes');
const adminProductRoutes = require('./backend/admin/productRoutes');
const adminOrderRoutes = require('./backend/admin/orderRoutes');
const adminStaffRoutes = require('./backend/admin/staffRoutes');
const { getSession } = require('./backend/auth/sessionStore');

// ⭐ NEW CLEAN BACKEND ROUTES
const deploymentRoutes = require('./backend/admin/deploymentRoutes');
const newOrderRoutes = require('./backend/admin/orderRoutes');
const newProductRoutes = require('./backend/admin/productRoutes');

const deploymentListRoutes = require('./backend/admin/deploymentListRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/deployments', deploymentListRoutes);

// OLD ROUTES (HTML-based admin)
app.use(registerRoutes);
app.use(adminDashboardRoutes);
app.use(adminCategoryRoutes);
app.use(adminProductRoutes);
app.use(adminOrderRoutes);
app.use(adminStaffRoutes);

// ⭐ NEW CLEAN API ROUTES (React will use these)
app.use('/api/deployments', deploymentRoutes);
app.use('/api/orders', newOrderRoutes);
app.use('/api/products', newProductRoutes);

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

// protect admin orders page
app.get(
  '/admin/orders.html',
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
    res.sendFile(path.join(__dirname, 'public', 'admin', 'orders.html'));
  }
);

// protect admin staff page
app.get(
  '/admin/staff.html',
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
    res.sendFile(path.join(__dirname, 'public', 'admin', 'staff.html'));
  }
);

const server = app.listen(PORT, (err) => {
  if (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
  console.log(`Server running at http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
  process.exit(1);
});
