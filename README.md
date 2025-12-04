
# Frontend–Backend Interaction

This project serves a static frontend from `public/` while exposing REST-style routes under `/api/**` in `server.js`. The client pages call those APIs with `fetch`, and the backend returns JSON plus, for admin users, an `admin_token` cookie that gates all admin HTML pages.

## Auth and session flow
- Registration (`POST /api/register`, body: `user_name`, `phone_number`, `password`, `role`, optional `user_id`, and `admin_id` for staff) creates an admin or a staff account. Staff signups must reference an existing `admin_id` and stay pending until approved.
- Login (`POST /api/login`) accepts either `user_id` or `phone_number` plus `password` and `role` (`admin` or `staff`). On admin login, the server sets an HTTP-only `admin_token` cookie; staff logins just return the user JSON.
- Admin-only APIs read the `admin_token` via `requireAdmin`, which pulls the session from the in-memory `backend/auth/sessionStore.js`. The same cookie is required to load the protected admin HTML routes (`/admin/*.html`) that are served only after the middleware check.

## APIs the frontend calls
- `GET /api/admin/dashboard` – Used by `public/admin/dashboard.html` to show counts for products, orders, staff, and categories.
- `GET /api/admin/categories` – `public/admin/categories.html` renders the list with this.
- `POST /api/admin/categories` – The category form posts here to create a new category for the logged-in admin.
- `GET /api/admin/products` – Populates the products table in `products.html`.
- `POST /api/admin/products` – Creates a product (validates `category_id` belongs to the admin and `quantity` is non-negative).
- `PATCH /api/admin/products/:id/quantity` – Inline quantity updates from the products page.
- `GET /api/admin/orders/meta` – Provides staff and product options when the orders page builds the “create order” form.
- `GET /api/admin/orders` – Lists recent orders with their items for the admin.
- `POST /api/admin/orders` – Submits an order with items; validates operator belongs to the admin and stock levels are sufficient.
- `GET /api/admin/staff?status=pending|active|rejected|terminated|all` – Filters staff for the admin’s team view.
- `PATCH /api/admin/staff/:id/approve|reject|terminate` – Actions the admin can trigger from the staff page to change status.

## Frontend behavior
- `public/login.html` posts to `/api/login`. Successful admin logins redirect the browser to `/admin/dashboard.html`; staff logins show a success message but do not set admin cookies.
- `public/register.html` posts to `/api/register`, enforcing the same required fields the backend validates.
- The admin pages under `public/admin/` call the listed admin APIs with plain `fetch` requests; the browser automatically includes the `admin_token` cookie, and unauthorized calls receive `401` JSON or an HTML redirect when visiting the page directly.

## Static assets
- All CSS lives in `public/css/` and is served by Express with `express.static`. No build step is required; running `node server.js` serves both the SPA pages and the API.
