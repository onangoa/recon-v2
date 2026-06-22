# Mobile API Response Guide

Complete reference of all routes defined in `routes/mobile.php`, their HTTP methods, authentication requirements, response formats, and status codes.

---

## Table of Contents

1. [Authentication (Public)](#1-authentication-public)
2. [Authentication (Protected)](#2-authentication-protected)
3. [Configuration (Public)](#3-configuration-public)
4. [Dashboard](#4-dashboard)
5. [Notifications](#5-notifications)
6. [Announcements](#6-announcements)
7. [Licenses](#7-licenses)
8. [License Files](#8-license-files)
9. [Inventory Categories](#9-inventory-categories)
10. [Inventory Items](#10-inventory-items)
11. [Suppliers](#11-suppliers)
12. [Machines](#12-machines)
13. [Purchase Orders](#13-purchase-orders)
14. [Material Deliveries](#14-material-deliveries)
15. [Activity Logs](#15-activity-logs)
16. [Attendance](#16-attendance)
17. [Subscriptions](#17-subscriptions)
18. [User Profile](#18-user-profile)
19. [Wallets](#19-wallets)
20. [Companies](#20-companies)
21. [Sites](#21-sites)
22. [Visitor Categories](#22-visitor-categories)
23. [Visitors](#23-visitors)
24. [Payroll Periods](#24-payroll-periods)
25. [Salary Components](#25-salary-components)

---

## Common Response Patterns

### Authentication Error (401)
Returned by Sanctum middleware when no valid token is provided:
```json
{
  "message": "Unauthenticated."
}
```

### Validation Error (422)
Returned by Laravel's `$request->validate()`:
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field": ["Error message"]
  }
}
```

---

## 1. Authentication (Public)

### POST /users/authenticate

```json
// 200 — Success
{
  "error": false,
  "message": "{Role} login successful",
  "access_token": "<plainTextToken>",
  "token_type": "Bearer",
  "account_type": "user",
  "role": "<role_name>",
  "company_id": "<company_id>",
  "user": { "<User model fields>" },
  "sites": [
    {
      "id": "<int>",
      "title": "<string>",
      "description": "<string>",
      "status_id": "<int>",
      "company_id": "<int>",
      "is_favorite": "<bool>",
      "is_primary": "<bool>"
    }
  ],
  "subscriptions": [{ "<subscription with plan>" }],
  "redirect_url": "<url>"
}
```

```json
// 200 — Inactive account
{
  "error": true,
  "message": "Your account is currently inactive. Please contact admin for assistance."
}
```

```json
// 200 — Rate limited
{
  "error": true,
  "message": "Too many login attempts. Please try again in {X minute(s) and Y second(s)}."
}
```

```json
// 200 — Invalid credentials
{
  "error": true,
  "message": "Invalid credentials!"
}
```

### POST /users/register

```json
// 200 — Success
{
  "error": false,
  "session": "<session_data>",
  "message": "Registration data saved. Please complete your subscription to create your account.",
  "redirect_url": "<route('subscription-plan.index')>"
}
```

```json
// 422 — Validation error
{
  "error": true,
  "message": {
    "email": ["The email has already been taken."],
    "password": ["Password must be at least 6 characters long."]
  }
}
```

### POST /users/forgot-password

```json
// 200 — Success
{
  "error": false,
  "message": "Password reset link emailed successfully."
}
```

```json
// 200 — Error (invalid user / exception / email not configured)
{
  "error": true,
  "message": "<translated_password_broker_error_message>"
}
// OR
{
  "error": true,
  "message": "Password reset link couldn't be sent."
}
```

---

## 2. Authentication (Protected)

All protected routes require `Authorization: Bearer <token>` header.
`auth:sanctum` middleware returns **401** with `{"message": "Unauthenticated."}` when token is invalid/missing.

### GET /users/check-token

```json
// 200 — Valid token
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "id": "<user->id>",
    "first_name": "<string>",
    "last_name": "<string>",
    "full_name": "<first_name> <last_name>",
    "email": "<string>",
    "phone": "<string>",
    "status": "<string>",
    "email_verified": "<bool>",
    "photo_url": "<asset('storage/' . photo) or asset('storage/photos/no-image.jpg')>",
    "role": "<role_name>",
    "account_type": "user",
    "created_at": "<timestamp>",
    "updated_at": "<timestamp>"
  }
}
```

```json
// 401 — Invalid/expired token
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### POST /users/logout

```json
// 200 — Success
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST /users/logout-all

```json
// 200 — Success
{
  "success": true,
  "message": "Logged out from all devices successfully"
}
```

---

## 3. Configuration (Public)

### GET /config

```json
// 200 — Success
{
  "success": true,
  "data": {
    "mobile_app_version": {
      "current_version": "<string>",
      "minimum_supported_version": "<string>",
      "force_update_version": "<string|null>",
      "update_url": "<string>",
      "release_notes": "<string>",
      "update_required": "<bool>",
      "update_available": "<bool>",
      "force_update": "<bool>",
      "platform": "<string>"
    },
    "purchase_order_priorities": [
      { "id": 1, "name": "low", "color": "success", "description": "Low Priority" },
      { "id": 2, "name": "medium", "color": "warning", "description": "Medium Priority" },
      { "id": 3, "name": "high", "color": "danger", "description": "High Priority" },
      { "id": 4, "name": "urgent", "color": "danger", "description": "Urgent Priority" }
    ],
    "machine_types": [{ "key": "<string>", "value": "<string>" }],
    "machine_conditions": [{ "key": "<string>", "value": "<string>" }],
    "license_types": [{ "key": "<string>", "value": "<string>" }],
    "wallet_transaction_types": [
      { "key": "mpesa", "value": "M-Pesa" },
      { "key": "bank", "value": "Bank Account" },
      { "key": "mobile_money", "value": "Mobile Money" }
    ],
    "activity_log_types": [
      { "key": "create", "value": "Create" },
      { "key": "update", "value": "Update" },
      { "key": "delete", "value": "Delete" },
      { "key": "login", "value": "Login" },
      { "key": "logout", "value": "Logout" },
      { "key": "upload", "value": "Upload" },
      { "key": "download", "value": "Download" },
      { "key": "approve", "value": "Approve" },
      { "key": "reject", "value": "Reject" }
    ],
    "currency": {
      "full_form": "<string|null>",
      "symbol": "<string|null>",
      "code": "<string|null>",
      "symbol_position": "<string|null>",
      "format": "<string|null>",
      "decimal_points": "<string|null>"
    }
  }
}
```

---

## 4. Dashboard

### GET /dashboard/stats

```json
// 200 — Success (authenticated user)
{
  "status": "success",
  "data": {
    "purchase_orders_count": "<int>",
    "machines_count": "<int>",
    "inventories_count": "<int>",
    "material_deliveries_count": "<int>",
    "licenses_count": "<int>",
    "suppliers_count": "<int>",
    "attendance_chart": {
      "dates": ["<string>", "..."],        // 7 items, format: 'D, M d'
      "present_count": ["<int>", "..."],     // 7 items
      "absent_count": ["<int>", "..."],      // 7 items
      "late_count": ["<int>", "..."],         // 7 items
      "date_label": "<string>"               // e.g. 'Sun, Jun 15 - Sat, Jun 21'
    },
    "wallet_chart": {
      "months": ["<string>", "..."],         // 12 items: Jan..Dec
      "credits": ["<string>", "..."],         // 12 items, 2 decimal format
      "debits": ["<string>", "..."],           // 12 items, 2 decimal format
      "total_credits": "<float>",
      "total_debits": "<float>",
      "date_label": "<string>",               // current year
      "currency_symbol": "<string>"           // from settings, default '$'
    }
  }
}
```

```json
// 200 — Unauthenticated/fallback (counts all zero, empty charts)
{
  "status": "success",
  "data": {
    "purchase_orders_count": 0,
    "machines_count": 0,
    "inventories_count": 0,
    "material_deliveries_count": 0,
    "licenses_count": 0,
    "suppliers_count": 0,
    "attendance_chart": [],
    "wallet_chart": []
  }
}
```

---

## 5. Notifications

### GET /notifications/get-unread-notifications

```json
// 200 — Success
{
  "count": "<int>",
  "data": [
    {
      "id": "<int>",
      "title": "<string>",
      "message": "<string>",
      "type": "<string>",
      "type_id": "<int>",
      "created_at": "<string|null>"
    }
  ]
}
```

```json
// 200 — No valid user
{
  "count": 0,
  "data": []
}
```

### POST /notifications/mark-all-as-read

```json
// 200 — Success
{
  "error": false,
  "message": "All notifications marked as read"
}
```

```json
// 401 — No userId
{
  "error": true,
  "message": "Unauthorized"
}
```

### POST /notifications/update-status

```json
// 200 — Toggled read (with needConfirm=true)
{ "error": false, "message": "Notification marked as read" }
// OR
{ "error": false, "message": "Notification marked as unread" }

// 200 — Silent mark (without needConfirm)
{ "error": false }

// 401 — No userId
{ "error": true, "message": "Unauthorized" }

// 404 — Not found
{ "error": true, "message": "Notification not found" }

// 500 — Exception
{ "error": true, "message": "Failed to update status" }
```

---

## 6. Announcements

### GET /announcements/get-unread-announcements

```json
// 200 — Success
{
  "count": "<int>",
  "data": [
    {
      "id": "<int>",
      "title": "<string>",
      "content": "<string>",
      "priority": "<string>",
      "start_date": "<string|null>",
      "end_date": "<string|null>",
      "created_at": "<string|null>",
      "updated_at": "<string|null>"
    }
  ]
}
```

```json
// 200 — No valid user
{
  "count": 0,
  "data": []
}
```

### POST /announcements/mark-all-as-read

```json
// 200 — Success
{ "error": false, "message": "All announcements marked as read" }

// 401 — No userId
{ "error": true, "message": "Unauthorized" }
```

### POST /announcements/update-status

```json
// 200 — Toggled read (with needConfirm=true)
{ "error": false, "message": "Announcement marked as read" }
// OR
{ "error": false, "message": "Announcement marked as unread" }

// 200 — Silent mark (without needConfirm)
{ "error": false }

// 401 — No userId
{ "error": true, "message": "Unauthorized" }

// 404 — Not found
{ "error": true, "message": "Announcement not found" }

// 500 — Exception
{ "error": true, "message": "Failed to update status" }
```

---

## 7. Licenses

### GET /licenses/

```json
// 200 — Success
{
  "rows": [
    {
      "id": "<int>",
      "license_number": "<string>",
      "license_type": "<string>",
      "issuing_authority": "<string>",
      "site": "<string>",
      "issue_date": "<string>",
      "expiry_date": "<string>",
      "license_status": "<string>",
      "obj_status": "<string>",
      "created_at": "<string>",
      "updated_at": "<string>",
      "actions": "<string>"
    }
  ],
  "total": "<int>"
}
```

```json
// 400 — No company
{ "error": "No company selected." }
```

### GET /licenses/{id}

```json
// 200 — Success
{
  "error": false,
  "data": {
    "id": "<int>",
    "license_number": "<string>",
    "license_type": "<string>",
    "license_type_raw": "<string>",
    "issuing_authority": "<string>",
    "site": { "id": "<int>", "title": "<string>" },
    "issue_date": "<string>",
    "expiry_date": "<string>",
    "license_status": "<string>",
    "document_path": "<string|null>",
    "created_at": "<string>",
    "updated_at": "<string>"
  }
}
```

```json
// 400 — No company
{ "error": "No company selected." }

// 404 — Not found
{ "error": true, "message": "License not found." }
```

### POST /licenses/

```json
// 200 — Success (with file)
{
  "error": false,
  "message": "License created successfully.",
  "id": "<int>",
  "type": "license",
  "title": "<string>",
  "file": { "name": "<string>", "url": "<string>", "size": "<int>" },
  "data": { "<full License model with site relation>" }
}

// 200 — Success (without file) — same structure without "file" key
```

```json
// 400 — No company
{ "error": "No company selected." }
```

### PUT /licenses/{id}

```json
// 200 — Success (with file)
{
  "error": false,
  "message": "License updated successfully.",
  "id": "<int>",
  "type": "license",
  "title": "<string>",
  "file": { "name": "<string>", "url": "<string>", "size": "<int>" },
  "data": { "<full License model with site relation>" }
}

// 200 — Success (without file) — same structure without "file" key
```

```json
// 400 — No company
{ "error": "No company selected." }

// 404 — Not found
{ "error": true, "message": "License not found." }
```

### DELETE /licenses/{id}

```json
// 200 — Success
{ "error": false, "message": "License deleted successfully.", "id": "<int>", "type": "license", "title": "<string>" }

// 400 — No company
{ "error": "No company selected." }

// 404 — Not found
{ "error": true, "message": "License not found1.<id>" }
```

### GET /licenses/expiring-soon

```json
// 200 — Success (raw Eloquent collection with site relation)
[ { "<License model with site relation>" } ]

// 400 — No company
{ "error": "No company selected." }
```

### GET /licenses/expired

```json
// 200 — Success (raw Eloquent collection with site relation)
[ { "<License model with site relation>" } ]

// 400 — No company
{ "error": "No company selected." }
```

---

## 8. License Files

### POST /licenses/{id}/upload-file

```json
// 200 — Success
{
  "error": false,
  "message": "File uploaded successfully.",
  "file": { "name": "<string>", "url": "<string>", "size": "<int>" },
  "data": { "id": "<int>", "license_number": "<string>", "document_path": "<string|null>" }
}
```

```json
// 400 — No company
{ "error": "No company selected." }

// 400 — No file
{ "error": true, "message": "No file uploaded." }

// 404 — Not found
{ "error": true, "message": "License not found." }
```

### DELETE /licenses/{id}/remove-file

```json
// 200 — Success
{
  "error": false,
  "message": "File removed successfully.",
  "data": { "id": "<int>", "license_number": "<string>", "document_path": null }
}
```

```json
// 400 — No company
{ "error": "No company selected." }

// 400 — No file to remove
{ "error": true, "message": "No file to remove." }

// 404 — Not found
{ "error": true, "message": "License not found." }
```

---

## 9. Inventory Categories

### GET /inventory-categories/

```json
// 200 — Success
{
  "total": "<int>",
  "rows": [
    {
      "id": "<int>",
      "name": "<string>",
      "description": "<string>",
      "parent_category": "<string>",
      "items_count": "<int>",
      "is_parent": "<string>",
      "status": "<string>",
      "obj_status": "<string>",
      "actions": "<string>"
    }
  ]
}
```

### GET /inventory-categories/{inventoryCategory}

```json
// 200 — Success
{
  "success": true,
  "data": { "<InventoryCategory model with company, inventoryItems, parentCategory, subCategories>" }
}
```

```json
// 403 — Unauthorized (wrong company)
{ "success": false, "message": "Unauthorized access." }
```

### POST /inventory-categories/

```json
// 200 — Success
{ "success": true, "message": "Inventory category created successfully.", "category": { "<InventoryCategory model>" } }

// 403 — No permission
{ "success": false, "message": "You do not have permission to create inventory categories." }

// 422 — Subcategory as parent
{ "success": false, "message": "You cannot select a subcategory as a parent category." }
```

### PUT /inventory-categories/{inventoryCategory}

```json
// 200 — Success
{ "success": true, "message": "Inventory category updated successfully.", "category": { "<InventoryCategory model>" } }

// 403 — No permission
{ "success": false, "message": "You do not have permission to edit inventory categories." }

// 403 — Unauthorized (wrong company)
{ "success": false, "message": "Unauthorized access." }

// 422 — Self-parent
{ "success": false, "message": "A category cannot be its own parent." }

// 422 — Subcategory as parent
{ "success": false, "message": "You cannot select a subcategory as a parent category." }

// 422 — Child as parent
{ "success": false, "message": "You cannot set a child category as the parent." }
```

### DELETE /inventory-categories/{inventoryCategory}

```json
// 200 — Success
{ "success": true, "message": "Inventory category deleted successfully." }

// 403 — Unauthorized (wrong company)
{ "success": false, "message": "Unauthorized access." }

// 422 — Has inventory items
{ "success": false, "message": "Cannot delete category with associated inventory items." }

// 422 — Has subcategories
{ "success": false, "message": "Cannot delete category with subcategories. Delete subcategories first." }
```

### GET /inventory-categories/tree

```json
// 200 — Success
{
  "success": true,
  "data": [
    {
      "id": "<int>",
      "name": "<string>",
      "description": "<string>",
      "parent_id": "<int|null>",
      "company_id": "<int>",
      "is_parent": "<string>",
      "items_count": "<int>",
      "children": [
        {
          "id": "<int>",
          "name": "<string>",
          "description": "<string>",
          "parent_id": "<int>",
          "company_id": "<int>",
          "is_parent": "<string>",
          "items_count": "<int>"
        }
      ]
    }
  ]
}
```

---

## 10. Inventory Items

### GET /inventory-items/

```json
// 200 — Success
{
  "total": "<int>",
  "rows": [
    {
      "id": "<int>",
      "name": "<string>",
      "sku": "<string>",
      "category": "<string>",
      "current_stock": "<string>",
      "unit_price": "<string>",
      "status": "<string>",
      "obj_status": "<string>",
      "created_at": "<string>",
      "updated_at": "<string>",
      "actions": "<string>"
    }
  ]
}
```

### GET /inventory-items/{inventoryItem}

```json
// 200 — Success
{
  "success": true,
  "data": { "<InventoryItem model with inventoryCategory, site, supplier, stockMovements>" }
}
```

### POST /inventory-items/

```json
// 201 — Success (API/mobile)
{
  "success": true,
  "message": "Inventory item created successfully.",
  "data": {
    "inventory_item": { "<InventoryItem model>" },
    "request_type": "mobile_api"
  }
}
```

```json
// 422 — Missing company_id
{ "success": false, "message": "Company ID is required.", "request_type": "mobile_api" }

// 422 — Missing site_id
{ "success": false, "message": "Site ID is required.", "request_type": "mobile_api" }
```

### PUT /inventory-items/{inventoryItem}

```json
// 200 — Success (API/mobile)
{
  "success": true,
  "message": "Inventory item updated successfully.",
  "data": {
    "inventory_item": { "<InventoryItem model>" },
    "request_type": "mobile_api"
  }
}
```

```json
// 422 — Missing company_id
{ "success": false, "message": "Company ID is required.", "request_type": "mobile_api" }

// 422 — Missing site_id
{ "success": false, "message": "Site ID is required.", "request_type": "mobile_api" }
```

### DELETE /inventory-items/{inventoryItem}

```json
// 200 — Success (API/mobile)
{ "success": true, "message": "Inventory item deleted successfully.", "data": { "request_type": "mobile_api" } }
```

### POST /inventory-items/{inventoryItem}/add-stock

```json
// 200 — Success
{ "success": true, "message": "Stock added successfully.", "inventory_item": { "<InventoryItem model>" } }
```

### POST /inventory-items/{inventoryItem}/remove-stock

```json
// 200 — Success
{ "success": true, "message": "Stock removed successfully.", "inventory_item": { "<InventoryItem model>" } }

// 200 — Insufficient stock
{ "success": false, "message": "Insufficient stock for this operation." }
```

### POST /inventory-items/transfer-stock

```json
// 200 — Success
{
  "success": true,
  "message": "Stock transferred successfully.",
  "from_item": { "<InventoryItem model>" },
  "to_item": { "<InventoryItem model>" }
}
```

```json
// 200 — Insufficient stock
{ "success": false, "message": "Insufficient stock for this transfer." }
```

### GET /inventory-items/low-stock

```json
// 200 — Success
{ "success": true, "data": [ { "<InventoryItem with inventoryCategory, site, supplier>" } ] }
```

### GET /inventory-items/out-of-stock

```json
// 200 — Success
{ "success": true, "data": [ { "<InventoryItem with inventoryCategory, site, supplier>" } ] }
```

### GET /inventory-items/{inventoryItem}/stock-movements

```json
// 200 — Success
{
  "total": "<int>",
  "rows": [
    {
      "id": "<int>",
      "created_at": "<string>",
      "movement_type": "<string>",
      "quantity": "<string>",
      "unit_price": "<string>",
      "total_amount": "<string>",
      "notes": "<string>",
      "created_by": "<string>"
    }
  ]
}
```

---

## 11. Suppliers

### GET /suppliers/

```json
// 200 — Success (raw collection)
[
  {
    "id": "<int>",
    "name": "<string>",
    "contact_person": "<string>",
    "email": "<string>",
    "phone": "<string>"
  }
]
```

### GET /suppliers/{supplier}

```json
// 200 — Success
{ "success": true, "data": { "<Supplier model>" } }

// 403 — Wrong company
{ "success": false, "message": "Unauthorized action." }
```

### POST /suppliers/

```json
// 200 — Success
{ "success": true, "message": "Supplier created successfully.", "supplier": { "<Supplier model>" } }
```

### PUT /suppliers/{supplier}

```json
// 200 — Success
{ "success": true, "supplier": { "<Supplier model (fresh)>" } }

// 403 — Wrong company
{ "success": false, "message": "Unauthorized action." }
```

### DELETE /suppliers/{supplier}

```json
// 200 — Success
{ "success": true, "message": "Supplier deleted successfully." }

// 403 — Wrong company
{ "success": false, "message": "Unauthorized action." }
```

---

## 12. Machines

### GET /machines/

```json
// 200 — Success (API/mobile, with company-id header)
{
  "total": "<int>",
  "data": [ { "<Machine model with site relation>" } ]
}

// 400 — No company (missing header)
{ "error": "No company selected." }

// 200 — No company (invalid header value)
{ "error": "No company selected." }
```

### GET /machines/{machine}

```json
// 200 — Success
{ "success": true, "data": { "<Machine model with site, equipmentAssignments>" } }

// 403 — Unauthorized (wrong company)
{ "success": false, "message": "Unauthorized access." }
```

### POST /machines/

```json
// 200 — Success
{ "success": true, "message": "Machine created successfully.", "machine": { "<Machine model>" } }

// 400 — No permission
{ "success": false, "message": "You do not have permission to create machines." }

// 400 — No company
{ "success": false, "message": "No company selected." }
```

### PUT /machines/{machine}

```json
// 200 — Success
{ "success": true, "message": "Machine updated successfully.", "machine": { "<Machine model>" } }

// 403 — No permission
{ "success": false, "message": "You do not have permission to edit machines." }

// 403 — Unauthorized (wrong company)
{ "success": false, "message": "Unauthorized access." }
```

### DELETE /machines/{machine}

```json
// 200 — Success
{ "success": true, "message": "Machine deleted successfully." }

// 403 — No permission
{ "success": false, "message": "You do not have permission to delete machines." }

// 403 — Unauthorized (wrong company)
{ "success": false, "message": "Unauthorized access." }
```

### GET /machines/maintenance-due

```json
// 200 — Success (raw Eloquent collection with site relation)
[ { "<Machine model with site relation>" } ]

// 400 — No company
{ "error": "No company selected." }
```

---

## 13. Purchase Orders

### GET /purchase-orders

```json
// 200 — Success
{
  "total": "<int>",
  "rows": [
    {
      "id": "<int>",
      "order_number": "<string>",
      "supplier": "<string|null>",
      "site": "<string|null>",
      "total_amount": "<string>",
      "status": "<string>",
      "priority": "<string>",
      "obj_status": "<string>",
      "obj_priority": "<string>",
      "delivery_date": "<string|null>",
      "created_at": "<string>",
      "updated_at": "<string>",
      "actions": "<string>"
    }
  ]
}
```

### GET /purchase-orders/{id}

```json
// 200 — Success
{
  "error": false,
  "purchase_order": { "<PurchaseOrder model with supplier, site, requestedBy, approvedBy, orderItems>" }
}
```

### POST /purchase-orders

```json
// 200 — Success
{
  "error": false,
  "message": "Purchase order created successfully.",
  "purchase_order": { "<PurchaseOrder model with relations>" }
}
```

### PUT /purchase-orders/{id}

```json
// 200 — Success
{
  "error": false,
  "message": "Purchase order updated successfully.",
  "purchase_order": { "<PurchaseOrder model with relations>" }
}
```

```json
// 400 — Not pending
{ "error": true, "message": "Only pending purchase orders can be edited." }
```

### DELETE /purchase-orders/{id}

```json
// 200 — Success
{ "error": false, "message": "Purchase order deleted successfully." }

// 400 — Not pending
{ "error": true, "message": "Only pending purchase orders can be deleted." }
```

### POST /purchase-orders/{id}/approve

```json
// 200 — Success
{
  "error": false,
  "message": "Purchase order approved successfully.",
  "purchase_order": { "<fresh model with relations>" }
}
```

```json
// 400 — Not pending
{ "error": true, "message": "Only pending purchase orders can be approved." }
```

### POST /purchase-orders/{id}/reject

```json
// 200 — Success
{
  "error": false,
  "message": "Purchase order rejected successfully.",
  "purchase_order": { "<fresh model with relations>" }
}
```

```json
// 400 — Not pending
{ "error": true, "message": "Only pending purchase orders can be rejected." }

// 400 — Missing rejection_reason
{
  "error": true,
  "message": "Rejection reason is required.",
  "errors": { "rejection_reason": ["The rejection reason field is required."] }
}
```

### POST /purchase-orders/{id}/mark-as-delivered

```json
// 200 — Success
{
  "error": false,
  "message": "Purchase order marked as delivered successfully. Material delivery entry created.",
  "purchase_order": { "<fresh model with relations>" },
  "material_delivery": { "<MaterialDelivery model>" }
}
```

```json
// 400 — Not approved
{ "error": true, "message": "Only approved purchase orders can be marked as delivered." }
```

---

## 14. Material Deliveries

### GET /material-deliveries

```json
// 200 — Success
{
  "error": false,
  "material_deliveries": {
    "data": [ { "<MaterialDelivery with purchaseOrder, supplier, site, receivedBy>" } ],
    "current_page": "<int>",
    "per_page": "<int>",
    "total": "<int>"
  }
}
```

```json
// 400 — Missing company_id
{ "error": true, "message": "Company ID is required." }

// 500 — Exception
{ "error": true, "message": "<exception message>" }
```

### GET /material-deliveries/{id}

```json
// 200 — Success
{
  "error": false,
  "material_delivery": {
    "<MaterialDelivery with purchaseOrder, supplier, site, receivedBy, deliveryItems.orderItem.inventoryItem, attachments>"
  }
}
```

```json
// 400 — Missing company_id
{ "error": true, "message": "Company ID is required." }

// 404 — Not found
{ "error": true, "message": "Material delivery not found." }

// 500 — Exception
{ "error": true, "message": "<exception message>" }
```

### DELETE /material-deliveries/{id}

```json
// 200 — Success
{ "error": false, "message": "Material delivery deleted successfully." }
```

```json
// 400 — Missing company_id
{ "error": true, "message": "Company ID is required." }

// 400 — Received status
{ "error": true, "message": "Received material deliveries cannot be deleted." }

// 404 — Not found
{ "error": true, "message": "Material delivery not found." }

// 500 — Exception
{ "error": true, "message": "<exception message>" }
```

---

## 15. Activity Logs

### GET /activity-logs

```json
// 200 — Success (API request)
{
  "error": false,
  "message": "Activity logs retrieved successfully",
  "data": [
    {
      "id": "<int|null>",
      "actor_id": "<int|null>",
      "actor_name": "<string>",
      "actor_type": "<string>",
      "type_id": "<int|null>",
      "parent_type_id": "<string>",
      "type": "<string>",
      "parent_type": "<string>",
      "type_title": "<string>",
      "parent_type_title": "<string>",
      "activity": "<string>",
      "message": "<string>",
      "created_at": "<string>",
      "updated_at": "<string>"
    }
  ],
  "total": "<int>"
}
```

```json
// 400 — Company not found
{ "error": true, "message": "Company not found." }
```

---

## 16. Attendance

### GET /attendance

```json
// 200 — Success (mobile API)
{
  "error": false,
  "message": "Attendance records retrieved successfully",
  "data": [
    {
      "id": "<int>",
      "date": "<string>",
      "worker_name": "<string>",
      "total_work_hours": "<string|'-'>",
      "attained_work_hours": "<string|'-'>",
      "overtime_hours": "<int>",
      "late_hours": "<string>",
      "leave_hours": "<string|float|'-'>",
      "status": "<string>",
      "site_name": "<string>",
      "created_at": "<string>",
      "updated_at": "<string>"
    }
  ],
  "total": "<int>"
}
```

```json
// 200 — Missing company (note: returns 200, not 400)
{ "error": true, "message": "Company ID is required", "total": 0, "rows": [] }

// 200 — Missing site_id (API request)
{ "error": true, "message": "Site ID is required for API requests", "total": 0, "rows": [] }
```

---

## 17. Subscriptions

### GET /subscriptions/plans

```json
// 200 — Success
{
  "error": false,
  "message": "Subscription plans retrieved successfully",
  "data": [
    {
      "id": "<int>",
      "name": "<string>",
      "description": "<string>",
      "max_sites": "<int>",
      "max_clients": "<int>",
      "max_team_members": "<int>",
      "max_companies": "<int>",
      "plan_type": "<string>",
      "modules": ["<string>"],
      "monthly_price": "<string>",
      "monthly_discounted_price": "<string>",
      "yearly_price": "<string>",
      "yearly_discounted_price": "<string>",
      "lifetime_price": "<string>",
      "lifetime_discounted_price": "<string>"
    }
  ]
}
```

### GET /subscriptions/current

```json
// 200 — Found
{
  "error": false,
  "message": "Active subscription retrieved successfully",
  "data": {
    "id": "<int>",
    "plan_name": "<string>",
    "tenure": "<string>",
    "starts_at": "<string Y-m-d>",
    "ends_at": "<string Y-m-d>",
    "status": "<string>",
    "features": {
      "max_sites": "<int>",
      "max_clients": "<int>",
      "max_team_members": "<int>",
      "max_companies": "<int>",
      "modules": ["<string>"]
    },
    "payment_method": "<string>",
    "charging_price": "<string>",
    "charging_currency": "<string>",
    "usage_metrics": {
      "users": { "current": "<int>", "limit": "<int>" },
      "sites": { "current": "<int>", "limit": "<int>" },
      "clients": { "current": "<int>", "limit": "<int>" },
      "companies": { "current": "<int>", "limit": "<int>" }
    }
  }
}

// 404 — No subscription
{ "error": true, "message": "No subscription found" }
```

### GET /subscriptions/history

```json
// 200 — Success
{
  "error": false,
  "message": "Subscription history retrieved successfully",
  "data": [
    {
      "id": "<int>",
      "plan_name": "<string>",
      "tenure": "<string>",
      "starts_at": "<string Y-m-d>",
      "ends_at": "<string Y-m-d>",
      "status": "<string>",
      "payment_method": "<string>",
      "charging_price": "<string>",
      "charging_currency": "<string>"
    }
  ],
  "total": "<int>"
}
```

### GET /subscriptions/transactions

```json
// 200 — Success
{
  "error": false,
  "message": "Subscription transactions retrieved successfully",
  "data": [
    {
      "id": "<int>",
      "subscription_id": "<int>",
      "plan_name": "<string>",
      "amount": "<string>",
      "currency": "<string>",
      "payment_method": "<string>",
      "status": "<string>",
      "transaction_id": "<string>",
      "created_at": "<string Y-m-d H:i:s>"
    }
  ],
  "total": "<int>"
}
```

### POST /subscriptions/subscribe

```json
// 200 — STK push initiated
{
  "success": true,
  "error": false,
  "message": "STK push initiated successfully. Please complete payment on your phone.",
  "data": {
    "subscription_id": "<int>",
    "transaction_id": "<string>",
    "checkout_request_id": "<string>",
    "merchant_request_id": "<string|null>",
    "charging_price": "<string>",
    "charging_currency": "<string>",
    "phone_number": "<string>",
    "status": "pending"
  }
}
```

```json
// 422 — Validation / STK push failed
{ "errors": { "<field>": ["<error message>"] } }
// OR
{ "error": false, "message": "<Mpesa error message>" }

// 500 — Exception
{ "error": "Failed to create subscription: <exception message>" }
```

### POST /subscriptions/subscribe-demo

```json
// 200 — Success (inline closure in routes)
{
  "error": false,
  "message": "Demo subscribed"
}
```

### POST /subscriptions/cancel

```json
// 200 — Cancelled
{ "error": false, "message": "Subscription cancelled successfully" }

// 404 — No active subscription
{ "error": true, "message": "No active subscription found" }
```

---

## 18. User Profile

### GET /profile/

```json
// 200 — Success
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "<int>",
    "first_name": "<string>",
    "last_name": "<string>",
    "email": "<string>",
    "phone": "<string>",
    "photo_url": "<string>",
    "address": "<string>",
    "city": "<string>",
    "state": "<string>",
    "country": "<string>",
    "zip": "<string>",
    "created_at": "<timestamp>",
    "updated_at": "<timestamp>"
  }
}
```

### PUT /profile/

```json
// 200 — Success
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "<int>",
    "first_name": "<string>",
    "last_name": "<string>",
    "email": "<string>",
    "phone": "<string>",
    "address": "<string>",
    "city": "<string>",
    "state": "<string>",
    "country": "<string>",
    "zip": "<string>"
  }
}
```

### POST /profile/picture

```json
// 200 — Success
{
  "success": true,
  "message": "Profile picture updated successfully",
  "data": { "photo_url": "<string>" }
}

// 400 — No image
{ "success": false, "message": "No profile image provided" }
```

### POST /profile/change-password

```json
// 200 — Success
{ "success": true, "message": "Password changed successfully" }

// 422 — Incorrect current password
{ "success": false, "message": "Current password is incorrect" }
```

### DELETE /account/delete

```json
// 200 — Success
{ "success": true, "message": "Account deleted successfully" }

// 500 — Server error
{ "success": false, "message": "Failed to delete account", "error": "<exception_message>" }
```

### POST /users/reset-password

```json
// 200 — Success
{ "error": false, "message": "Password reset successful.", "data": [] }

// 422 — Invalid/expired token
{ "error": true, "message": "<password_broker_error>", "data": [] }

// 500 — Exception
{ "error": true, "message": "An unexpected error occurred.", "data": { "error": "<exception_message>" } }

// 422 — Validation failure (API format)
{ "error": true, "message": "<flattened_error_messages_separated_by_newlines>" }
```

---

## 19. Wallets

### GET /wallets/

```json
// 200 — Success
{
  "total": "<int>",
  "rows": [
    {
      "id": "<int>",
      "wallet_name": "<string>",
      "balance": "<string>",
      "status": "<string>",
      "obj_status": "<string>",
      "site": "<string|null>",
      "created_by": "<string|null>",
      "created_at": "<string>",
      "updated_at": "<string>",
      "has_transactions": "<bool>",
      "daily_spend_limit": "<string|null>",
      "supported_payment_options": ["<string>"],
      "actions": "<string>"
    }
  ]
}
```

### GET /wallets/{wallet}

```json
// 200 — Success
{ "success": true, "data": { "<Wallet model>" } }
```

### POST /wallets/

```json
// 200 — Success
{ "success": true, "message": "Wallet created successfully.", "data": { "<Wallet model>" } }

// 400 — No company
{ "success": false, "message": "No company selected." }

// 500 — Exception
{
  "success": false,
  "message": "Failed to create wallet: <exception message>",
  "error_details": { "file": "<string>", "line": "<int>", "trace": "<string>" }
}
```

### PUT /wallets/{wallet}

```json
// 200 — Success
{ "success": true, "message": "Wallet updated successfully.", "data": { "<Wallet model>" } }

// 500 — Exception
{ "success": false, "message": "Failed to update wallet. Please try again." }
```

### DELETE /wallets/{wallet}

```json
// 200 — Success
{ "success": true, "message": "Wallet deleted successfully." }

// 422 — Has transactions
{ "success": false, "message": "Cannot delete wallet with existing transactions. Please delete all transactions first." }

// 500 — Exception
{ "success": false, "message": "Failed to delete wallet. Please try again." }
```

### GET /wallets/{wallet}/transactions

```json
// 200 — Success
{ "total": "<int>", "rows": [ { "<paginated transaction items>" } ] }
```

### POST /wallets/{wallet}/add-funds

```json
// 200 — Success
{
  "success": true,
  "message": "Payment initiated successfully. Please complete the payment on your phone.",
  "data": {
    "transaction_id": "<int>",
    "checkout_request_id": "<string>"
  }
}

// 400 — M-Pesa failure
{ "success": false, "message": "<Mpesa error message>" }

// 500 — Exception
{ "success": false, "message": "Failed to initiate payment. Please try again." }
```

### POST /wallets/{wallet}/pochi-payment-demo

```json
// 200 — Success (inline closure in routes)
{
  "success": true,
  "message": "Payment initiated successfully. Please complete the payment on your phone.",
  "data": {
    "transaction_id": "x",
    "checkout_request_id": "x"
  }
}
```

### POST /wallets/{wallet}/mpesa-payment

> **WARNING:** `WalletController::initiateMpesaPayment` is commented out. This route will cause a 500 error.

### POST /wallets/{wallet}/till-payment

```json
// 200 — Success
{
  "success": true,
  "message": "Till payment initiated successfully",
  "data": {
    "transaction_id": "<int>",
    "conversation_id": "<string|null>",
    "originator_conversation_id": "<string|null>"
  }
}

// 400 — M-Pesa failure
{ "success": false, "message": "<Mpesa error message>" }

// 500 — Exception
{ "success": false, "message": "Failed to initiate till payment. Please try again." }
```

### POST /wallets/{wallet}/paybill-payment

```json
// 200 — Success
{
  "success": true,
  "message": "Paybill payment initiated successfully",
  "data": {
    "transaction_id": "<int>",
    "conversation_id": "<string|null>",
    "originator_conversation_id": "<string|null>"
  }
}

// 400 — M-Pesa failure
{ "success": false, "message": "<Mpesa error message>" }

// 500 — Exception
{ "success": false, "message": "Failed to initiate paybill payment. Please try again." }
```

### POST /wallets/{wallet}/pochi-payment

```json
// 200 — Success
{
  "success": true,
  "message": "Phone payment initiated successfully",
  "data": {
    "transaction_id": "<int>",
    "conversation_id": "<string|null>",
    "originator_conversation_id": "<string|null>"
  }
}

// 400 — M-Pesa failure
{ "success": false, "message": "<Mpesa error message>" }

// 500 — Exception
{ "success": false, "message": "Failed to initiate phone payment. Please try again." }
```

### GET /wallets/transactions/{transaction}/mpesa-status

```json
// 200 — Success (proxied from MpesaService)
{ "<Mpesa result object>" }

// 500 — Exception
{ "success": false, "message": "Failed to check payment status." }
```

---

## 20. Companies

### GET /companies/

```json
// 200 — List
{ "error": false, "message": "Companies retrieved successfully.", "data": { "total": "<int>", "data": [ { "<formatWorkspace result>" } ] } }
```

### GET /companies/{id}

```json
// 200 — Single
{ "error": false, "message": "Company retrieved successfully.", "data": { "<formatWorkspace result>" } }

// 404 — Not found
{ "message": "No query results for model [App\\Models\\Company] <id>." }
```

### POST /companies/

```json
// 200 — Success
{ "error": false, "message": "Company created successfully.", "id": "<int>", "data": { "<formatWorkspace result>" } }

// 422 — Validation error
{ "message": "The given data was invalid.", "errors": { "<field>": ["<error>"] } }

// 500 — Exception
{ "error": true, "message": "An error occurred while creating the company." }
```

### PUT /companies/{id}

```json
// 200 — Success
{ "error": false, "message": "Company updated successfully.", "id": "<int>", "data": { "<formatWorkspace result>" } }

// 422 — Validation error
{ "message": "The given data was invalid.", "errors": { "<field>": ["<error>"] } }
```

### DELETE /companies/{id}

```json
// 200 — Success
{ "error": false, "message": "Company deleted successfully.", "id": "<string>", "title": "<string>", "data": [] }

// 400 — Active company
{ "error": true, "message": "Cannot delete the currently active company.", "data": [] }

// 404 — Not found
{ "error": true, "message": "Company not found or already deleted.", "data": [] }

// 500 — Exception
{ "error": true, "message": "Something went wrong while deleting the company.", "data": { "exception": "<message>" } }
```

---

## 21. Sites

### GET /sites/

```json
// 200 — List
{ "error": false, "message": "Sites retrieved successfully.", "total": "<int>", "data": [ { "<formatProject result>" } ] }
```

### GET /sites/{id}

```json
// 200 — Single
{ "error": false, "message": "Site retrieved successfully", "total": 1, "data": [ { "<formatProject result>" } ] }

// 404 — Not found
{ "error": true, "message": "Site not found", "total": 0, "data": [] }
```

### POST /sites/

```json
// 200 — Success
{ "error": false, "message": "Site created successfully.", "id": "<int>", "data": { "<formatProject result>" } }

// 400 — No company
{ "error": true, "message": "Missing or invalid company." }

// 422 — Validation error
{ "message": "The given data was invalid.", "errors": { "<field>": ["<error>"] } }

// 500 — Exception
{ "error": true, "message": "Site could not be created.", "data": { "error": "<msg>", "line": "<int>", "file": "<path>" } }
```

### PUT /sites/{id}

```json
// 200 — Success
{ "error": false, "message": "Site updated successfully.", "id": "<int>", "data": { "<formatProject result>" } }

// 400 — No company
{ "error": true, "message": "Missing or invalid company." }

// 403 — Wrong company
{ "error": true, "message": "Site does not belong to this company." }
```

### DELETE /sites/{id}

```json
// 200 — Success
{ "error": false, "message": "Site deleted successfully.", "id": "<string>", "title": "<string>", "data": [] }

// 404 — Not found
{ "error": true, "message": "Site not found.", "data": [] }
```

### POST /sites/{id}/upload-media

```json
// 200 — Success (API)
{ "error": false, "message": "Media uploaded successfully.", "id": ["<int>"], "data": [ { "<formatted media>" } ] }

// 200 — No files
{ "error": true, "message": "No file(s) chosen." }

// 422 — Validation error
{ "message": "The given data was invalid.", "errors": { "<field>": ["<error>"] } }

// 500 — Exception
{ "error": true, "message": "Site could not be created.", "data": { "error": "<msg>", "line": "<int>", "file": "<path>" } }
```

### GET /sites/{id}/media

```json
// 200 — Success (API)
{
  "error": false,
  "message": "Media retrieved successfully.",
  "data": [
    {
      "id": "<int>",
      "file": "<string>",
      "file_name": "<string>",
      "title": "<string>",
      "notes": "<string>",
      "file_size": "<string>",
      "created_at": "<string>",
      "updated_at": "<string>",
      "actions": "<string>"
    }
  ]
}
```

### DELETE /sites/media/{mediaId}

```json
// 200 — Success (API)
{
  "error": false,
  "message": "Media deleted successfully.",
  "id": "<int>",
  "title": "<string>",
  "parent_id": "<int>",
  "type": "media",
  "parent_type": "site"
}
```

### POST /sites/{id}/favorite

```json
// 200 — Success
{ "error": false, "message": "Site favorite status updated successfully", "data": { "<formatProject result>" } }

// 200 — Not found
{ "error": true, "message": "Site not found" }

// 422 — Validation error
{ "message": "The given data was invalid.", "errors": { "<field>": ["<error>"] } }

// 500 — Exception
{ "error": true, "message": "An error occurred while updating the site favorite status." }
```

### POST /sites/{id}/milestones

```json
// 200 — Success
{
  "error": false,
  "message": "Milestone created successfully.",
  "data": {
    "id": "<int>",
    "type": "milestone",
    "parent_type": "site",
    "parent_id": "<int>"
  }
}

// 422 — Validation error
{ "message": "The given data was invalid.", "errors": { "<field>": ["<error>"] } }

// 500 — Exception
{ "error": true, "message": "Milestone couldn't be created: <exception message>" }
```

---

## 22. Visitor Categories

### GET /visitor-categories/

```json
// 200 — Success
{
  "total": "<int>",
  "rows": [
    {
      "id": "<int>",
      "name": "<string>",
      "description": "<string>",
      "parent_category": "<string|'None'>",
      "visitors_count": "<int>",
      "is_parent": "<'Yes'|'No'>",
      "status": "<string>",
      "obj_status": "<string>",
      "actions": "<string>"
    }
  ]
}
```

### GET /visitor-categories/{visitorCategory}

```json
// 200 — Success
{ "error": false, "category": { "<VisitorCategory model>" } }
```

### POST /visitor-categories/

```json
// 200 — Success
{ "error": false, "message": "Visitor category created successfully.", "category": { "<VisitorCategory model>" } }
```

### PUT /visitor-categories/{visitorCategory}

```json
// 200 — Success
{ "error": false, "message": "Visitor category updated successfully.", "category": { "<VisitorCategory model>" } }
```

### DELETE /visitor-categories/{visitorCategory}

```json
// 200 — Success
{ "error": false, "message": "Visitor category deleted successfully." }
```

---

## 23. Visitors

### GET /visitors/

```json
// 200 — Success
{
  "total": "<int>",
  "rows": [
    {
      "id": "<int>",
      "name": "<string>",
      "company": "<string|'-'>",
      "category": "<string|'-'>",
      "purpose": "<string>",
      "time_in": "<string>",
      "time_out": "<string|'-'>",
      "status": "<string>",
      "obj_status": "<string>",
      "created_at": "<string>",
      "updated_at": "<string>",
      "actions": "<string>"
    }
  ]
}
```

### GET /visitors/{visitor}

```json
// 200 — Success
{ "error": false, "visitor": { "<Visitor model>" } }
```

### POST /visitors/

```json
// 200 — Success
{ "error": false, "message": "Visitor checked in successfully.", "visitor": { "<Visitor model>" } }
```

### PUT /visitors/{visitor}

```json
// 200 — Success
{ "error": false, "message": "Visitor updated successfully.", "visitor": { "<Visitor model>" } }
```

### DELETE /visitors/{visitor}

```json
// 200 — Success
{ "error": false, "message": "Visitor deleted successfully." }
```

### POST /visitors/{visitor}/check-out

```json
// 200 — Success
{ "success": true, "message": "Visitor checked out successfully.", "visitor": { "<Visitor model>" } }

// 200 — Not on site
{ "success": false, "message": "Visitor is not currently on site." }
```

### GET /visitors/{visitor}/logs

```json
// 200 — Success (paginated Laravel response)
{ "<paginated logs with performedBy relationship>" }
```

### POST /visitors/{visitor}/generate-qr-code

```json
// 200 — Success
{ "success": true, "message": "QR code generated successfully.", "qr_code": "<string>" }
```

---

## 24. Payroll Periods

### GET /payroll-period/

```json
// 200 — Success
{
  "success": true,
  "data": [
    {
      "id": "<int>",
      "name": "<string>",
      "start_date": "<string Y-m-d>",
      "end_date": "<string Y-m-d>",
      "payment_date": "<string Y-m-d>",
      "status": "<string>",
      "total_employees": "<int>",
      "processed_employees": "<int>",
      "total_amount": "<string>",
      "description": "<string>"
    }
  ]
}
```

```json
// 400 — No company_id header
{ "success": false, "message": "Company ID is required" }

// 500 — Exception
{ "success": false, "message": "<exception message>" }
```

### GET /payroll-period/{id}

```json
// 200 — Success
{
  "success": true,
  "data": {
    "id": "<int>",
    "name": "<string>",
    "start_date": "<string Y-m-d>",
    "end_date": "<string Y-m-d>",
    "payment_date": "<string Y-m-d>",
    "status": "<string>",
    "total_employees": "<int>",
    "processed_employees": "<int>",
    "total_amount": "<string>",
    "description": "<string>"
  }
}
```

```json
// 400 — No company_id header
{ "success": false, "message": "Company ID is required" }

// 404 — Not found
{ "success": false, "message": "Payroll period not found" }

// 500 — Exception
{ "success": false, "message": "<exception message>" }
```

---

## 25. Salary Components

### GET /salary-component/

```json
// 200 — Success
{
  "success": true,
  "data": [
    {
      "id": "<int>",
      "name": "<string>",
      "type": "<string>",
      "amount_type": "<string>",
      "amount": "<string>",
      "percentage": "<string>",
      "is_taxable": "<bool>",
      "is_statutory": "<bool>",
      "deduction_type": "<string>",
      "is_active": "<bool>",
      "description": "<string>"
    }
  ]
}
```

```json
// 400 — No company_id header
{ "success": false, "message": "Company ID is required" }

// 500 — Exception
{ "success": false, "message": "<exception message>" }
```

### GET /salary-component/{id}

```json
// 200 — Success
{
  "success": true,
  "data": {
    "id": "<int>",
    "name": "<string>",
    "type": "<string>",
    "amount_type": "<string>",
    "amount": "<string>",
    "percentage": "<string>",
    "is_taxable": "<bool>",
    "is_statutory": "<bool>",
    "deduction_type": "<string>",
    "is_active": "<bool>",
    "description": "<string>"
  }
}
```

```json
// 400 — No company_id header
{ "success": false, "message": "Company ID is required" }

// 404 — Not found
{ "success": false, "message": "Salary component not found" }

// 500 — Exception
{ "success": false, "message": "<exception message>" }
```

---

## Notes

1. **Authentication**: All routes under `auth:sanctum` middleware return **401** `{"message": "Unauthenticated."}` when no valid token is provided.

2. **Response format inconsistency**: Older controllers use `"error": true/false` while newer mobile-specific methods use `"success": true/false`. Key patterns:
   - `"error": false` / `"error": true` — older pattern (Licenses, PurchaseOrders, MaterialDeliveries, Companies, Sites, VisitorCategories, Visitors)
   - `"success": true` / `"success": false` — newer pattern (Machines, Inventory, Suppliers, Wallets, Profile, Subscriptions, Payroll, Salary)

3. **Status code inconsistencies**: Some error responses return **200** when they should return 4xx codes:
   - `sendLockoutResponse` / `handleFailedLogin` in authenticate → should be 429/401
   - `sendResetLinkEmail` error cases → should be 400/500
   - Inventory `addStock`/`removeStock` insufficient stock → should be 400
   - Attendance missing company/site → should be 400

4. **Broken route**: `POST /wallets/{wallet}/mpesa-payment` maps to `WalletController::initiateMpesaPayment` which is **commented out** and will cause a 500 error.

5. **Inline closures**: Two routes use inline closures in `mobile.php`:
   - `POST /subscriptions/subscribe-demo` — returns `{"error": false, "message": "Demo subscribed"}` with HTTP 200
   - `POST /wallets/{wallet}/pochi-payment-demo` — returns demo payment response with HTTP 200