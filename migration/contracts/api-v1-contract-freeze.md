# API v1 Contract Freeze

This document freezes the currently consumed API contract for migration from Node/Express (`/api`) to DRF (`/api/v2`).

## Global Rules

- Base URL (legacy): `/api`
- Response envelope: `{ "data": ... }`
- Error shape (best effort compatibility): `{ "message": string, "errors"?: object }`
- Auth: `Authorization: Bearer <token>` for authenticated endpoints.
- Uploaded image URLs are currently returned as relative paths, e.g. `/uploads/abc.jpg`.

## Auth

- `POST /auth/login`
  - Request: `{ username, password }`
  - Response: `{ data: { token, user } }`
- `POST /auth/admin/login`
  - Request: `{ username, password }`
  - Response: `{ data: { token, user } }`
- `POST /auth/register`
  - Request: `{ username, password, email, fullName? }`
  - Response: `{ data: { token, user } }`
- `POST /auth/logout`
  - Response: `{ data: { success: true } }` (or equivalent success payload)
- `GET /auth/me`
  - Response: `{ data: user }`

## Roles

- `GET /roles`
- `GET /roles/:roleId`
- `POST /roles` `{ roleName, description? }`
- `PUT /roles/:roleId` partial update allowed
- `DELETE /roles/:roleId`

## Users

- `GET /users`
- `GET /users/:userId`
- `POST /users`
- `PUT /users/:userId`
- `PATCH /users/:userId/status` `{ status }`
- `DELETE /users/:userId`

## Catalog

- Categories
  - `GET /categories`
  - `GET /categories/:categoryId`
  - `POST /categories`
  - `PUT /categories/:categoryId`
  - `DELETE /categories/:categoryId`
- Brands
  - `GET /brands`
  - `GET /brands/:brandId`
  - `POST /brands`
  - `PUT /brands/:brandId`
  - `DELETE /brands/:brandId`
- Suppliers
  - `GET /suppliers`
  - `GET /suppliers/:supplierId`
  - `POST /suppliers`
  - `PUT /suppliers/:supplierId`
  - `DELETE /suppliers/:supplierId`
- Products
  - `GET /products?categoryId=&status=&search=`
  - `GET /products/:productId`
  - `POST /products`
  - `PUT /products/:productId`
  - `PATCH /products/:productId/status` `{ status }`
  - `DELETE /products/:productId`

## Product Images

- `GET /products/:productId/images`
- `POST /products/:productId/images` `{ productId, imageUrl }`
- `DELETE /products/:productId/images/:imageId`
- Upload file endpoint:
  - `POST /upload` (multipart/form-data, field: `image`)
  - Response: `{ data: { imageUrl } }`

## Inventory

- `GET /inventory`
- `GET /inventory/:productId`
- `PUT /inventory/:productId`
- `GET /inventory-transactions?productId=&transactionType=&from=&to=`
- `GET /inventory-transactions/:transactionId`
- `POST /inventory-transactions`
- `POST /inventory-transactions/bulk`

## Orders / Payments / Carts / Reports

- Orders
  - `GET /orders?status=&from=&to=&userId=`
  - `GET /orders/:orderId`
  - `POST /orders`
  - `PATCH /orders/:orderId/status` `{ status }`
  - `PATCH /orders/:orderId/payment` `{ paymentId }`
  - `GET /orders/:orderId/items`
  - `POST /orders/:orderId/items`
  - `PUT /orders/:orderId/items/:orderItemId`
  - `DELETE /orders/:orderId/items/:orderItemId`
- Payments
  - `GET /payments`
  - `GET /payments/:paymentId`
  - `GET /payments/order/:orderId`
  - `POST /payments`
  - `PUT /payments/:paymentId`
  - `POST /payments/create-url`
- Carts
  - `GET /carts/:cartId`
  - `PATCH /carts/:cartId/status`
  - `POST /carts`
  - `GET /carts/user/:userId/active`
  - `GET /carts/user/:userId/history`
  - `GET /carts/:cartId/items`
  - `POST /carts/:cartId/items`
  - `PUT /carts/:cartId/items/:cartItemId`
  - `DELETE /carts/:cartId/items/:cartItemId`
- Reports
  - `GET /reports?from=&to=&paymentStatus=`

## Compatibility Requirements for DRF v2

1. Keep the envelope `{ data: ... }` for migration period.
2. Preserve existing enum values:
   - Product: `available | unavailable`
   - Order: `pending | paid | shipped | completed | cancelled`
   - Payment method: `cash | credit_card | bank_transfer`
   - Payment status: `pending | completed | failed`
3. Maintain support for relative image paths (`/uploads/...`) and multipart upload field `image`.
4. Keep query parameter names stable during phased rollout.
