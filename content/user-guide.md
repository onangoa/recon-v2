# ReconSMI User Guide

A complete guide to the ReconSMI construction site management platform — covering both the **Contractor** and **Super Admin** portals.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Roles & Access](#roles--access)
3. [Public Pages](#public-pages)
4. [Contractor Portal](#contractor-portal)
5. [Super Admin Portal](#super-admin-portal)
6. [Glossary](#glossary)

---

## Getting Started

### Create an account

1. Visit the landing page and click **Get Started** (or go to `/register`).
2. Fill in the registration form: your name, email, password, company name, phone number, license number, and location.
3. Click **Create Account**. Your account (and a default wallet) is created immediately — no plan selection or payment required.

> Your progress is auto-saved as a draft in your browser, so you can resume if you navigate away.

### Log in

1. Go to `/login`.
2. Enter your email and password.
3. You are redirected based on your role:
   - **Super Admin** → `/superadmin`
   - **Contractor needing onboarding** (no sites yet) → `/contractor/sites/create`
   - **Contractor** → `/contractor`

### Forgot password

1. Go to `/login` and click **Forgot password?**.
2. Enter your email — a reset link is sent.
3. Follow the link to `/reset-password` and set a new password (minimum 8 characters).

---

## Roles & Access

| Role | Landing page | Portal access | Permissions |
|---|---|---|---|
| **Super Admin** | `/superadmin` | Super Admin portal only | All permissions implicitly |
| **Contractor** | `/contractor` | Contractor portal only | Only explicitly assigned permissions (each menu item is gated) |

- A Super Admin cannot access `/contractor/*` routes and vice-versa.
- Contractor menu items are filtered by the permissions assigned to the logged-in user's role. The **Contractor Admin** role automatically has all permissions.

---

## Public Pages

| Route | Purpose |
|---|---|
| `/` | Landing / marketing page with features, free-access, and mobile app sections. |
| `/login` | Sign-in form. |
| `/register` | Contractor self-registration form (free, no payment required). |
| `/forgot-password` | Request a password reset link by email. |
| `/reset-password` | Set a new password using a token from the reset email. |

---

## Contractor Portal

The Contractor portal is the main workspace for managing construction sites, workers, inventory, finances, and compliance. The left sidebar is your navigation; the top bar shows your **active site** (which you can switch), a global search, and notifications.

### Onboarding

When you first log in with no sites, you are taken to **Create Site** (`/contractor/sites/create`) to set up your first construction location. You cannot access the full sidebar until at least one site exists.

---

### Dashboard

**Route:** `/contractor`  
**Permission:** `dashboard:read`

An at-a-glance overview of your **active site** (or all sites). Includes:

- **KPI cards:** Workers present today, total inventory, pending purchase orders, safety incidents.
- **Attendance & Hours:** Bar chart for the last 7 days (regular vs. overtime hours).
- **Purchase Orders:** Bar chart grouped by status.
- **Inventory Status:** Progress bars for in-stock, low-stock, and out-of-stock items.
- **Recent Activity:** A live feed of actions performed across modules by your team.

---

### Safety & Incidents

**Route:** `/contractor/safety`  
**Permission:** `safety:read`

Track, report, and manage on-site safety incidents and near misses.

- List and search incidents by severity and status.
- Create a new incident with a dialog form.
- Edit or delete existing incident reports.

---

### Inventory

**Route:** `/contractor/inventory`  
**Permission:** `inventory:read`

Track and manage site materials and equipment stock levels.

- Searchable, paginated item table with status badges (in-stock, low-stock, out-of-stock).
- Low-stock alerts.
- CSV import and export.
- Create, edit, and delete items.

**Sub-pages:**

| Route | Purpose |
|---|---|
| `/contractor/inventory/create` | Create a new inventory item. |
| `/contractor/inventory/[id]` | View item details — balances, movements, and history. |
| `/contractor/inventory/edit/[id]` | Edit an inventory item. |
| `/contractor/inventory/categories` | Manage inventory categories (classify your site resources). |
| `/contractor/inventory/categories/create` | Create a category. |
| `/contractor/inventory/categories/edit/[id]` | Edit a category. |

---

### Suppliers

**Route:** `/contractor/suppliers`  
**Permission:** `suppliers:read`

Manage relationships with your construction material and equipment providers.

- Searchable, paginated supplier table with contact details (email, phone, location).
- Create, edit, and delete suppliers.
- CSV export.

**Sub-pages:**

| Route | Purpose |
|---|---|
| `/contractor/suppliers/create` | Add a supplier. |
| `/contractor/suppliers/edit/[id]` | Edit a supplier. |

---

### Wallets

**Route:** `/contractor/wallets`  
**Permission:** `wallets:read`

Manage project funds, track balances, and monitor financial transactions.

- Wallet cards showing name, balance, currency, status, and transaction count.
- Create, edit, and delete wallets.
- View wallet details with full transaction history.

**Payout fee:** every outgoing payout (bank, M-Pesa, or manual debit) carries a flat platform fee (default KES 40, configurable by the superadmin under **Settings → Payout Fees**). The wallet is debited the payout amount **plus** the fee, and the fee appears as a separate `PAYOUT_FEE` transaction. Worker payroll payments are exempt, and a failed or reversed payout never leaves you out of pocket — the fee is only charged when a payout completes and is refunded if it is reversed.

**Sub-pages:**

| Route | Purpose |
|---|---|
| `/contractor/wallets/create` | Create a wallet. |
| `/contractor/wallets/[id]` | Wallet detail — transactions and balance. |
| `/contractor/wallets/[id]/edit` | Edit a wallet. |

---

### Wallet Approvals

**Route:** `/contractor/wallets/approvals`  
**Permission:** `approve`

Review and approve pending payout transactions.

- Paginated list of pending transactions.
- Approve or reject with a dialog and reason.
- Search and filter by payout method (M-Pesa, etc.).

---

### Site Documents (Uploads)

**Route:** `/contractor/uploads`  
**Permission:** `documents:read`

Manage site documentation and files.

- Upload, create, edit, and delete documents.
- Organise files per site.

**Sub-pages:**

| Route | Purpose |
|---|---|
| `/contractor/uploads/create` | Upload a new site document. |
| `/contractor/uploads/edit/[id]` | Edit a document. |

---

### Machines & Equipment

**Route:** `/contractor/equipment`  
**Permission:** `equipment:read`

Monitor, track maintenance, and manage site equipment inventory.

- Searchable equipment table.
- Create, edit, and delete equipment records.
- Maintenance tracking.

**Sub-pages:**

| Route | Purpose |
|---|---|
| `/contractor/equipment/create` | Add equipment. |
| `/contractor/equipment/edit/[id]` | Edit equipment. |

---

### Purchase Orders

**Route:** `/contractor/purchase-orders`  
**Permission:** `purchase_orders:read`

Generate and track official purchase orders for materials and services.

- Searchable, paginated table showing PO number, supplier, status, and value.
- Create and edit purchase orders.
- Filter by status.

**Sub-pages:**

| Route | Purpose |
|---|---|
| `/contractor/purchase-orders/create` | Create a purchase order (requires an active site). |
| `/contractor/purchase-orders/[id]` | View PO details. |
| `/contractor/purchase-orders/edit/[id]` | Edit a purchase order. |

---

### Material Deliveries

**Route:** `/contractor/materials`  
**Permission:** `materials:read`

Track and verify all materials delivered to your project sites.

- Search by PO number or supplier.
- Verify deliveries against purchase orders.

---

### Licenses

**Route:** `/contractor/licenses`  
**Permission:** `licenses:read`

Monitor license renewals, permits, and regulatory certificates.

- Searchable list with expiry tracking and status badges.
- Create and edit license records.

**Sub-pages:**

| Route | Purpose |
|---|---|
| `/contractor/licenses/create` | Add a license (requires an active site). |
| `/contractor/licenses/edit/[id]` | Edit a license. |

---

### Visitor Management

**Route:** `/contractor/visitors`  
**Permission:** `visitors:read`

Track and manage site visitors.

- Visitor list with check-in/check-out times.
- Search visitors.

**Sub-pages:**

| Route | Purpose |
|---|---|
| `/contractor/visitors/create` | Check in a visitor. |
| `/contractor/visitors/edit/[id]` | Edit visitor details. |

---

### Payroll

**Route:** `/contractor/payroll`  
**Permission:** `payroll:read`

Manage payroll periods, salary components, and employee payments.

- List of payroll periods with totals (gross, deductions, net).
- Create and manage periods.

**Sub-pages:**

| Route | Purpose |
|---|---|
| `/contractor/payroll/periods/create` | Create a payroll period. |
| `/contractor/payroll/periods/[id]` | Period detail — payslips and totals. |
| `/contractor/payroll/periods/edit/[id]` | Edit a payroll period. |
| `/contractor/payroll/components` | Configure salary components (earnings and deductions). |

---

### Team Members

**Route:** `/contractor/team`  
**Permission:** `team:read`

Oversee your project team, assign roles, and track site attendance.

- Team member list with role assignments.
- Create and edit member details.

**Sub-pages:**

| Route | Purpose |
|---|---|
| `/contractor/team/create` | Add a team member. |
| `/contractor/team/edit/[id]` | Edit a team member. |

---

### Workers

**Route:** `/contractor/workers`  
**Permission:** `workers:read`

Manage your site workers, designations, and payroll status.

- Searchable, paginated worker list.
- Create, edit, and delete workers.
- Enrol workers to biometric devices for attendance.

**Sub-pages:**

| Route | Purpose |
|---|---|
| `/contractor/workers/create` | Add a new worker (includes biometric device selection). |
| `/contractor/workers/edit/[id]` | Edit a worker profile. |
| `/contractor/workers/designations` | Define job designations and salary ranges. |

---

### Shifts

**Route:** `/contractor/shifts`  
**Permission:** `shifts:read`

Define and manage working hours for your workers.

- Create, edit, and delete shifts (working hours + days).
- Empty state prompts you to create your first shift.

---

### Attendance

**Route:** `/contractor/attendance`  
**Permission:** `attendance:read`

Monitor worker check-ins, check-outs, and calculated hours.

- Searchable attendance logs by worker.
- Export attendance reports.
- Check-in/check-out times with calculated hours.
- Biometric scan records are shown here when devices are connected.

---

### Reports

**Route:** `/contractor/reports`  
**Permission:** `reports:read`

Comprehensive overview of your construction operations.

- Overview cards: Workers, Inventory, Pending POs, Net Pay, Incidents.
- **Payroll Summary:** Gross, deductions, and net totals.
- **Purchase Orders:** Chart grouped by status.
- Export to CSV or PDF.

---

### Settings

**Route:** `/contractor/settings`  
**Permission:** `settings:read`

Manage your professional profile, security, and preferences. The settings page has five tabs:

#### 1. Profile
Edit your name, email, and contact details.

#### 2. Notifications
Configure which notifications you receive (email, in-app, etc.).

#### 3. Security
Change your password and manage security settings.

#### 4. Roles & Permissions
Create and manage custom roles for your team members. Each role has a set of permissions that control which modules the user can access.

**Sub-pages:**

| Route | Purpose |
|---|---|
| `/contractor/settings/roles/create` | Create a custom role with selected permissions. |
| `/contractor/settings/roles/edit/[id]` | Edit an existing role's permissions. |

#### 5. Devices (Biometric)
Add and manage biometric attendance devices.

- Add a device by name and serial number (SN).
- Edit or delete devices.
- **Check Status** to probe whether each device is online.
- Only **Online** devices can be selected when enrolling a worker.

---

### Sites

**Route:** `/contractor/sites`

Manage all your construction site locations. Accessed via the site switcher in the sidebar header or breadcrumbs (not in the sidebar menu).

- Site list with active/decommissioned status.
- **Add New Site** button — you can create as many sites as you need.
- Decommission (delete) sites.

| Route | Purpose |
|---|---|
| `/contractor/sites/create` | Create a new site. |
| `/contractor/sites/edit/[id]` | Edit a site. |

---

### Company

**Route:** `/contractor/company`

View and manage your contractor company details.

| Route | Purpose |
|---|---|
| `/contractor/company` | View company information. |
| `/contractor/company/edit/[id]` | Edit company details. |

---

### Tasks

**Route:** `/contractor/tasks`

Manage all tasks across your projects.

- Task list with title, status, priority, and due date.
- Filter by status (All, In-Progress, Completed).
- Add new tasks.

> Note: Tasks is a standalone page not currently surfaced in the sidebar.

---

## Super Admin Portal

The Super Admin portal is the platform control panel for managing contractors, transactions, and administrators.

---

### Dashboard

**Route:** `/superadmin`

A platform-wide overview.

- **KPI cards:** Revenue, Contractors, Sites (with trend percentages).
- **Secondary stats:** Workers, Sites.
- **Recent Transactions:** Table of recent financial activity with a "View All" link.

---

### Contractors

**Route:** `/superadmin/contractors`

Manage all registered contractors.

- Searchable, paginated table (company, contact, location, created date).
- **Add Contractor** dialog: name, email, auto-generated password, company name, location, phone, license number.
- Row actions: View details, Edit profile, Delete account.

**Sub-page:**

| Route | Purpose |
|---|---|
| `/superadmin/contractors/[id]` | Contractor details — company info, contact, stats (employees, projects, wallet), account info, edit/delete. |

---

### Transactions

**Route:** `/superadmin/transactions`

A comprehensive log of all platform financial movements.

- Searchable table: transaction ID/reference, wallet/entity, description, amount (credit/debit colour-coded), status badge, date.
- **Manual Entry** dialog: select wallet, type (credit/debit), amount, description, reference number.
- Export logs.

---

### Admins

**Route:** `/superadmin/admins`

Manage global administrators with full access to the platform control panel.

- Searchable table of admins (name, email, role, created date).
- **Add Administrator** dialog: name, email, optional password.
- Row actions: Edit Profile, Reset Password, Remove Access.
- Security warning about admin privileges.

---

### Reports

**Route:** `/superadmin/reports`

Generate comprehensive analytics and insights for the entire platform.

- Report cards: Revenue Analytics, Contractor Insights, Safety Compliance, Project Progress.
- Each report supports PDF, CSV, and Excel export with a "Generate Report" button.
- "Recently Generated" list and a date filter.

---

### Profile

**Route:** `/superadmin/profile`

Manage your Super Admin account details and security settings.

- Profile overview card (avatar, name, email, "Super Admin" badge).
- **Profile Details** form: edit name and email.
- **Change Password** form: current, new, and confirm password (minimum 8 characters; forces re-login).

---

### Settings

**Route:** `/superadmin/settings`

Configure global platform parameters, security, and integrations.

- **General:** Platform name, global support email, base URL; regional settings (currency KES, timezone Africa/Nairobi); payout fee (flat KES amount charged on outgoing payouts — payroll exempt).
- **Security:** MFA toggle, session timeout (30 min), strict password policy toggles.
- **Alerts:** Notifications for new registrations, security breaches, M-Pesa failures.

---

## Glossary

| Term | Meaning |
|---|---|
| **Active Site** | The construction site currently selected in the sidebar header. Most data is scoped to this site. |
| **STK Push** | M-Pesa's Sim Toolkit prompt sent to a user's phone to authorise a payment (used for wallet top-ups). |
| **Biometric Device** | A hardware fingerprint/attendance scanner. Workers are enrolled to a device and attendance scans are recorded. |
| **Contractor Admin** | A role that automatically grants all permissions within the contractor portal. |
| **Onboarding** | The initial flow for a new contractor with no sites — forced to create their first site. |
| **Decommission** | Soft-delete a site. Only allowed when the site has no related records (tasks, materials, equipment, etc.). |