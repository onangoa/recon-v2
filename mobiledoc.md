# ReconSMI — Mobile API Reference (`/mobile/api`) opencode -s ses_02f374714ffecNfca4RxgjAPDe

Generated from the route handlers in `app/mobile/api/**`. Use this to update the old mobile app.

## Conventions

- **Base URL**: `https://reconsmi.com` (production). All paths below are appended to this base.
- **Auth**: Except where marked "none", every endpoint requires a Bearer access token in the `Authorization` header:
  ```
  Authorization: Bearer <accessToken>
  ```
  The access token is obtained from `POST /mobile/api/auth/login` and refreshed via `POST /mobile/api/auth/refresh`. Access tokens expire in ~15 minutes (`expiresIn: 900`).
- **Unauthenticated response** (from the auth middleware / route guards): `401` `{ "message": "Unauthenticated." }`.
- **Permission denied**: `403` `{ "error": true, "message": "Forbidden. Missing permission: <module>:<action>" }`.
- **Contractor account required**: many endpoints require the authenticated user to be linked to a contractor; otherwise `403` `{ "error": true, "message": "Contractor account required." }`.
- **Standard success envelope** (mobile routes):
  ```json
  { "error": false, "message": "<message>", "data": { ... } }
  ```
- **Standard error envelope** (mobile routes):
  ```json
  { "error": true, "message": "<message>" }
  ```
  Some older modules (documents, notifications, permissions, roles, team, tasks, visitors, safety, licenses, reports, upload, superadmin) use a legacy envelope:
  ```json
  { "data": { ... }, "message": "<message>" }
  ```
  and errors like `{ "error": "<message>" }`. Both envelopes are documented per-endpoint below.
- **Pagination**: list endpoints return `{ "rows": [...], "total": <n>, "pagination": { "page": <n>, "limit": <n>, "pages": <n> } }` (mobile) or `{ "data": [...], "total": <n>, "pagination": {...} }` (legacy). Query params are `page` (default 1) and `limit` (default 10 unless noted).
- **Content-Type**: `application/json` for all POST/PUT/PATCH bodies unless the endpoint is multipart (`/mobile/api/upload`).
- All examples show placeholder IDs (e.g. `<workerId>`, `site-1`) — substitute real values returned by the relevant list/create endpoints.

---

## Table of Contents

1. [Auth](#auth)
2. [Workers](#workers)
3. [Designations](#designations)
4. [Shifts](#shifts)
5. [Attendance](#attendance)
6. [Salary Components](#salary-components)
7. [Salary Slips](#salary-slips)
8. [Sites](#sites)
9. [Projects](#projects)
10. [Companies](#companies)
11. [Contractors](#contractors)
12. [Inventory](#inventory)
13. [Inventory Categories](#inventory-categories)
14. [Materials](#materials)
15. [Suppliers](#suppliers)
16. [Equipment](#equipment)
17. [Purchase Orders](#purchase-orders)
18. [Payroll Periods](#payroll-periods)
19. [Wallets](#wallets)
20. [M-Pesa](#m-pesa)
21. [Payments](#payments)
22. [Documents](#documents)
23. [Notifications](#notifications)
24. [Permissions](#permissions)
25. [Roles](#roles)
26. [Activity Logs](#activity-logs)
27. [Reports](#reports)
28. [Upload](#upload)
29. [Visitors](#visitors)
30. [Safety Incidents](#safety-incidents)
31. [Licenses](#licenses)
32. [Team](#team)
33. [Tasks](#tasks)
34. [Contractor Dashboard](#contractor-dashboard)
35. [Subscription Plans](#subscription-plans)
36. [Superadmin](#superadmin)
37. [Config](#config)

---

## Auth

### POST `/mobile/api/auth/login`
Description: Authenticates a user with email/password and returns access & refresh tokens plus session info.
Auth: none
Request headers: `Content-Type: application/json`
Request body:
```json
{ "email": "user@example.com", "password": "secret123" }
```
Success response: `200`
```json
{
  "error": false,
  "message": "Login successful",
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "id": "<userId>",
      "email": "user@example.com",
      "role": "CONTRACTOR",
      "name": "Jane Doe",
      "avatar": null,
      "phone": null,
      "permissions": ["workers:read"]
    },
    "contractor": {
      "id": "<contractorId>",
      "companyName": "Acme Ltd",
      "location": "Nairobi",
      "phoneNumber": "+254700000000",
      "licenseNo": "LIC-001",
      "userId": "<userId>"
    },
    "sites": [
      { "id": "<siteId>", "name": "Site A", "location": "Nairobi", "status": "active", "isPrimary": true, "projectId": null }
    ],
    "selectedSiteId": "<siteId>",
    "needsOnboarding": false
  }
}
```
Error responses:
- `400` `{ "error": true, "message": "Email and password are required" }`
- `401` `{ "message": "Unauthenticated." }`
- `500` `{ "error": true, "message": "Login failed" }`

### POST `/mobile/api/auth/refresh`
Description: Exchanges a valid refresh token for a new access/refresh token pair.
Auth: none (refresh token via Bearer header or body)
Request headers: `Authorization: Bearer <refreshToken>` (optional), `Content-Type: application/json`
Request body:
```json
{ "refreshToken": "<jwt>" }
```
Success response: `200`
```json
{
  "error": false,
  "message": "Token refreshed",
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "id": "<userId>",
      "email": "user@example.com",
      "role": "CONTRACTOR",
      "name": "Jane Doe",
      "avatar": null,
      "permissions": ["workers:read"]
    }
  }
}
```
Error responses:
- `401` `{ "message": "Unauthenticated." }` (no/invalid/expired/revoked refresh token)
- `500` `{ "error": true, "message": "Token refresh failed" }`

### POST `/mobile/api/auth/logout`
Description: Revokes all refresh tokens for the authenticated user.
Auth: Bearer access token (optional; still returns success if unauthenticated)
Success response: `200`
```json
{ "error": false, "message": "Logout successful", "data": null }
```

### GET `/mobile/api/auth/me`
Description: Returns the current authenticated user's session, contractor, sites, and onboarding status.
Auth: Bearer access token
Success response: `200`
```json
{
  "error": false,
  "message": "Session retrieved",
  "data": {
    "user": { "id": "<userId>", "email": "user@example.com", "role": "CONTRACTOR", "name": "Jane Doe", "avatar": null, "phone": "+254700000000", "permissions": ["workers:read"] },
    "contractor": { "id": "<contractorId>", "companyName": "Acme Ltd", "location": "Nairobi", "phoneNumber": "+254700000000", "licenseNo": "LIC-001", "userId": "<userId>" },
    "sites": [ { "id": "<siteId>", "name": "Site A", "location": "Nairobi", "status": "active", "isPrimary": true, "projectId": null } ],
    "selectedSiteId": "<siteId>",
    "needsOnboarding": false
  }
}
```
Error responses:
- `401` `{ "message": "Unauthenticated." }`
- `500` `{ "error": true, "message": "Failed to get session" }`

### POST `/mobile/api/auth/forgot-password`
Description: Emails a password-reset link (always returns success regardless of user existence).
Auth: none
Request body:
```json
{ "email": "user@example.com" }
```
Success response: `200`
```json
{ "error": false, "message": "Reset password instructions sent to your email.", "data": null }
```
Error responses:
- `400` `{ "error": true, "message": "Email is required" }`
- `500` `{ "error": true, "message": "An error occurred while processing your request." }`

### POST `/mobile/api/auth/reset-password`
Description: Resets the password using a valid reset token; revokes all refresh tokens.
Auth: none
Request body:
```json
{ "token": "abc123hex...", "password": "newpassword123" }
```
Success response: `200`
```json
{ "error": false, "message": "Password has been reset successfully", "data": null }
```
Error responses:
- `400` `{ "error": true, "message": "Token and password are required" }`
- `400` `{ "error": true, "message": "Password must be at least 8 characters long" }`
- `400` `{ "error": true, "message": "Invalid or expired reset token" }`
- `400` `{ "error": true, "message": "Reset token has expired" }`
- `500` `{ "error": true, "message": "An error occurred while processing your request" }`

### POST `/mobile/api/auth/change-password`
Description: Changes the authenticated user's password given the current password; revokes refresh tokens.
Auth: Bearer access token
Request body:
```json
{ "currentPassword": "oldpass123", "newPassword": "newpass123" }
```
Success response: `200`
```json
{ "error": false, "message": "Password updated successfully", "data": null }
```
Error responses:
- `401` `{ "message": "Unauthenticated." }`
- `400` `{ "error": true, "message": "Current password and new password are required" }`
- `400` `{ "error": true, "message": "Current password is incorrect" }`
- `400` `{ "error": true, "message": "New password must be at least 8 characters" }`
- `404` `{ "error": true, "message": "User not found" }`
- `500` `{ "error": true, "message": "Failed to change password" }`

### POST `/mobile/api/auth/select-site`
Description: Validates and selects a site belonging to the authenticated contractor.
Auth: Bearer access token
Request body:
```json
{ "siteId": "<siteId>" }
```
Success response: `200`
```json
{ "error": false, "message": "Site selected", "data": { "siteId": "<siteId>", "name": "Site A", "location": "Nairobi" } }
```
Error responses:
- `401` `{ "message": "Unauthenticated." }`
- `400` `{ "error": true, "message": "Site ID is required" }`
- `404` `{ "error": true, "message": "Site not found" }`
- `500` `{ "error": true, "message": "Failed to select site" }`

---

## Workers

### GET `/mobile/api/workers`
Description: Lists workers for the contractor with optional search and pagination.
Auth: Bearer token + `workers:read` + contractor account
Query params: `search`, `page` (default 1), `limit` (default 20)
Success response: `200`
```json
{
  "error": false,
  "message": "Success",
  "data": {
    "rows": [
      {
        "id": "<workerId>",
        "name": "John Worker",
        "email": "john@worker.com",
        "phone": "+254700000001",
        "nationalId": "12345678",
        "enrollId": "1",
        "designationId": "<designationId>",
        "shiftId": "<shiftId>",
        "paymentMode": "manual",
        "paymentPhone": null,
        "paymentAccount": null,
        "contractorId": "<contractorId>",
        "status": "Active",
        "joinedAt": "2026-01-01T00:00:00.000Z",
        "createdAt": "2026-01-01T00:00:00.000Z",
        "designation": { "id": "<designationId>", "title": "Mason" },
        "shift": { "id": "<shiftId>", "name": "Day" }
      }
    ],
    "total": 1,
    "pagination": { "page": 1, "limit": 20, "pages": 1 }
  }
}
```
Error responses:
- `401` `{ "message": "Unauthenticated." }`
- `403` `{ "error": true, "message": "Forbidden. Missing permission: workers:read" }` / `{ "error": true, "message": "Contractor account required" }`
- `500` `{ "error": true, "message": "Failed to fetch workers" }`

### POST `/mobile/api/workers`
Description: Creates a new worker under the contractor.
Auth: Bearer token + `workers:create` + contractor account
Request body:
```json
{
  "name": "John Worker",
  "email": "john@worker.com",
  "phone": "+254700000001",
  "nationalId": "12345678",
  "enrollId": "1",
  "designationId": "<designationId>",
  "shiftId": "<shiftId>",
  "paymentMode": "manual",
  "paymentPhone": null,
  "paymentAccount": null,
  "status": "Active",
  "joinedAt": "2026-01-01T00:00:00.000Z"
}
```
Success response: `200`
```json
{ "error": false, "message": "Worker created", "data": { "id": "<workerId>", "name": "John Worker", "designation": { "id": "<designationId>", "title": "Mason" }, "shift": { "id": "<shiftId>", "name": "Day" } } }
```
Error responses: `401` Unauthenticated; `403` permission/contractor; `500` `Failed to create worker`.

### GET `/mobile/api/workers/[id]`
Description: Retrieves a single worker by ID.
Auth: Bearer token + `workers:read` + contractor account
Path params: `id`
Success response: `200` — `{ "error": false, "message": "Success", "data": { "id": "<workerId>", "name": "John Worker", "designation": {...}, "shift": {...} } }`
Error responses: `401`; `403`; `404` `{ "error": true, "message": "Worker not found" }`; `500` `Failed to fetch worker`.

### PUT `/mobile/api/workers/[id]`
Description: Updates a worker belonging to the contractor.
Auth: Bearer token + `workers:update` + contractor account
Path params: `id`
Request body: same shape as POST (any subset of fields)
Success response: `200` — `{ "error": false, "message": "Worker updated", "data": {...} }`
Error responses: `401`; `403`; `400` `Invalid designation ID` / `Invalid shift ID`; `404` `Worker not found`; `500` `Failed to update worker`.

### DELETE `/mobile/api/workers/[id]`
Description: Deletes a worker belonging to the contractor.
Auth: Bearer token + `workers:delete` + contractor account
Path params: `id`
Success response: `200` — `{ "error": false, "message": "Worker deleted", "data": null }`
Error responses: `401`; `403`; `404` `Worker not found`; `500` `Failed to delete worker`.

---

## Designations

### GET `/mobile/api/designations`
Description: Lists designations for the contractor (paginated, searchable).
Auth: Bearer token + `designations:read` + contractor account
Query params: `page` (default 1), `limit` (default 10), `search`
Success response: `200`
```json
{
  "error": false,
  "message": "Success",
  "data": {
    "rows": [ { "id": "<designationId>", "title": "Mason", "description": "Brick work", "salary": 30000, "paymentFrequency": "monthly", "isActive": true, "contractorId": "<contractorId>", "createdAt": "2026-01-01T00:00:00.000Z" } ],
    "total": 1,
    "pagination": { "page": 1, "limit": 10, "pages": 1 }
  }
}
```
Error responses: `401`; `403`; `500` `Failed to fetch designations`.

### POST `/mobile/api/designations`
Description: Creates a new designation under the contractor.
Auth: Bearer token + `designations:create` + contractor account
Request body:
```json
{ "title": "Mason", "description": "Brick work", "salary": 30000, "paymentFrequency": "monthly", "isActive": true }
```
Success response: `200` — `{ "error": false, "message": "Designation created", "data": {...} }`
Error responses: `401`; `403`; `500` `Failed to create designation`.

### GET `/mobile/api/designations/[id]`
Description: Retrieves a single designation by ID.
Auth: Bearer token + `designations:read` + contractor account
Path params: `id`
Success: `200` — `{ "error": false, "message": "Success", "data": {...} }`
Error responses: `401`; `403`; `404` `Designation not found`; `500` `Failed to fetch designation`.

### PUT `/mobile/api/designations/[id]`
Description: Updates a designation belonging to the contractor.
Auth: Bearer token + `designations:update` + contractor account
Path params: `id`
Request body:
```json
{ "title": "Mason", "description": "Brick work", "salary": 32000, "paymentFrequency": "monthly", "isActive": true }
```
Success: `200` — `{ "error": false, "message": "Designation updated", "data": {...} }`
Error responses: `401`; `403`; `404` `Designation not found`; `500` `Failed to update designation`.

### DELETE `/mobile/api/designations/[id]`
Description: Deletes a designation belonging to the contractor.
Auth: Bearer token + `designations:delete` + contractor account
Path params: `id`
Success: `200` — `{ "error": false, "message": "Designation deleted", "data": null }`
Error responses: `401`; `403`; `404` `Designation not found`; `500` `Failed to delete designation`.

---

## Shifts

### GET `/mobile/api/shifts`
Description: Lists all shifts for the contractor including worker counts.
Auth: Bearer token + `shifts:read` + contractor account
Success response: `200`
```json
{
  "error": false,
  "message": "Success",
  "data": [
    { "id": "<shiftId>", "name": "Day Shift", "startTime": "08:00", "endTime": "17:00", "breakDuration": 60, "workingDays": ["MON","TUE","WED","THU","FRI"], "allowOvertime": true, "contractorId": "<contractorId>", "createdAt": "2026-01-01T00:00:00.000Z", "_count": { "workers": 12 } }
  ]
}
```
Error responses: `401`; `403`; `500` `Failed to fetch shifts`.

### POST `/mobile/api/shifts`
Description: Creates a new shift for the contractor.
Auth: Bearer token + `shifts:create` + contractor account
Request body:
```json
{ "name": "Day Shift", "startTime": "08:00", "endTime": "17:00", "breakDuration": "60", "workingDays": ["MON","TUE","WED","THU","FRI"], "allowOvertime": true }
```
Success: `200` — `{ "error": false, "message": "Shift created", "data": {...} }`
Error responses: `401`; `403`; `400` `Missing required fields`; `500` `Failed to create shift`.

### GET `/mobile/api/shifts/[id]`
Description: Retrieves a single shift by ID including its workers.
Auth: Bearer token + `shifts:read` + contractor account
Path params: `id`
Success: `200` — `{ "error": false, "message": "Success", "data": { "id": "<shiftId>", "name": "Day Shift", ..., "workers": [] } }`
Error responses: `401`; `403`; `404` `Shift not found`; `500` `Failed to fetch shift`.

### PUT `/mobile/api/shifts/[id]`
Description: Updates a shift belonging to the contractor.
Auth: Bearer token + `shifts:update` + contractor account
Path params: `id`
Request body: same shape as POST (any subset)
Success: `200` — `{ "error": false, "message": "Shift updated", "data": {...} }`
Error responses: `401`; `403`; `404` `Shift not found`; `500` `Failed to update shift`.

### DELETE `/mobile/api/shifts/[id]`
Description: Deletes a shift belonging to the contractor.
Auth: Bearer token + `shifts:delete` + contractor account
Path params: `id`
Success: `200` — `{ "error": false, "message": "Shift deleted successfully", "data": null }`
Error responses: `401`; `403`; `404` `Shift not found`; `500` `Failed to delete shift`.

---

## Attendance

### GET `/mobile/api/attendance`
Description: Lists attendance records, optionally filtered by worker and/or date range.
Auth: Bearer token + `attendance:read` + contractor account
Query params: `workerId`, `date` (ISO date), `startDate` (ISO date), `endDate` (ISO date)
Success response: `200`
```json
{
  "error": false,
  "message": "Success",
  "data": [
    { "id": "<attendanceId>", "workerId": "<workerId>", "shiftId": "<shiftId>", "date": "2026-07-20T00:00:00.000Z", "checkIn": "2026-07-20T08:00:00.000Z", "checkOut": "2026-07-20T17:00:00.000Z", "totalHours": 9, "overtimeHours": 0, "lateHours": 0, "lateDays": 0, "status": "Present", "worker": { "name": "John Worker", "designation": { "title": "Mason" } }, "shift": { "id": "<shiftId>", "name": "Day Shift" }, "logs": [] }
  ]
}
```
Error responses: `401`; `403`; `500` `Failed to fetch attendance`.

### POST `/mobile/api/attendance`
Description: Records a clock-in or clock-out for a worker (date is always "today").
Auth: Bearer token + `attendance:create` + contractor account
Request body:
```json
{ "workerId": "<workerId>", "type": "CLOCK_IN", "notes": "On time" }
```
`type`: `CLOCK_IN` or `CLOCK_OUT`.
Success response: `200`
```json
{ "error": false, "message": "Attendance recorded", "data": { "id": "<attendanceId>", "workerId": "<workerId>", "shiftId": "<shiftId>", "date": "2026-07-20T00:00:00.000Z", "checkIn": "2026-07-20T08:00:00.000Z", "checkOut": null, "status": "Present" } }
```
Error responses: `401`; `403`; `400` `Missing required fields` / `Already clocked in today` / `Not clocked in today` / `Already clocked out today`; `404` `Worker not found`; `500` `Failed to record attendance`.

### POST `/mobile/api/attendance/biometric`
Description: Processes one or more biometric punch logs (no auth).
Auth: none
Request body: array of records
```json
[
  { "enroll_id": 1, "records_time": "2026-07-20 08:00:00", "intOut": 0, "device_serial_num": "ZK-001", "temperature": 36.5 }
]
```
Success response: `200`
```json
{
  "error": false,
  "message": "Biometric data processed",
  "data": {
    "processed": 1,
    "results": [ { "enroll_id": 1, "workerId": "<workerId>", "workerName": "John Worker", "action": "check-in", "time": "2026-07-20 08:00:00", "attendanceId": "<attendanceId>", "status": "Present" } ],
    "errors": []
  }
}
```
Error responses: `400` `{ "error": true, "message": "No records provided" }`; `500` `Failed to process biometric data`.

---

## Salary Components

### GET `/mobile/api/salary-components`
Description: Lists salary components for the contractor (paginated, ordered by sortOrder).
Auth: Bearer token + `salary_components:read` + contractor account
Query params: `page` (default 1), `limit` (default 100)
Success response: `200`
```json
{
  "error": false,
  "message": "Success",
  "data": {
    "rows": [ { "id": "<componentId>", "name": "House Allowance", "type": "ALLOWANCE", "deductionType": null, "calculationType": "FIXED", "amount": 5000, "percentage": null, "isPercentage": false, "isTaxable": true, "isStatutory": false, "isActive": true, "isRecurring": true, "description": "Housing", "sortOrder": 1, "contractorId": "<contractorId>" } ],
    "total": 1,
    "pagination": { "page": 1, "limit": 100, "pages": 1 }
  }
}
```
Error responses: `401`; `403`; `500` `Failed to fetch salary components`.

### POST `/mobile/api/salary-components`
Description: Creates a new salary component under the contractor.
Auth: Bearer token + `salary_components:create` + contractor account
Request body:
```json
{ "name": "House Allowance", "type": "ALLOWANCE", "deductionType": null, "calculationType": "FIXED", "amount": "5000", "percentage": null, "isPercentage": false, "isTaxable": true, "isStatutory": false, "isActive": true, "isRecurring": true, "description": "Housing", "sortOrder": 1 }
```
Success: `200` — `{ "error": false, "message": "Salary component created", "data": {...} }`
Error responses: `401`; `403`; `500` `Failed to create salary component`.

### GET `/mobile/api/salary-components/[id]`
Description: Retrieves a single salary component by ID.
Auth: Bearer token + `salary_components:read` + contractor account
Path params: `id`
Success: `200` — `{ "error": false, "message": "Success", "data": {...} }`
Error responses: `401`; `403`; `404` `Salary component not found`; `500` `Failed to fetch salary component`.

### PUT `/mobile/api/salary-components/[id]`
Description: Updates any subset of fields on a salary component.
Auth: Bearer token + `salary_components:update` + contractor account
Path params: `id`
Request body: same shape as POST (any subset)
Success: `200` — `{ "error": false, "message": "Salary component updated", "data": {...} }`
Error responses: `401`; `403`; `404` `Salary component not found`; `500` `Failed to update salary component`.

### DELETE `/mobile/api/salary-components/[id]`
Description: Deletes a salary component belonging to the contractor.
Auth: Bearer token + `salary_components:delete` + contractor account
Path params: `id`
Success: `200` — `{ "error": false, "message": "Salary component deleted", "data": null }`
Error responses: `401`; `403`; `404` `Salary component not found`; `500` `Failed to delete salary component`.

---

## Salary Slips

### GET `/mobile/api/salary-slips`
Description: Lists salary slips, optionally filtered by payroll period and/or worker.
Auth: Bearer token + `salary_slips:read` + contractor account
Query params: `payrollPeriodId`, `workerId`
Success response: `200`
```json
{
  "error": false,
  "message": "Success",
  "data": [
    {
      "id": "<slipId>", "contractorId": "<contractorId>", "payrollPeriodId": "<payrollPeriodId>", "workerId": "<workerId>", "designationId": "<designationId>",
      "workingHours": 200, "attainedHours": 192, "workingDays": 26, "attainedDays": 24, "overtimeHours": 0, "overtimePay": 0, "lateHours": 0, "lateDays": 0, "leaveHours": 0, "leaveDays": 0, "daysWorked": 24,
      "basicSalary": 30000, "totalAllowance": 5000, "totalDeductions": 1500, "grossPay": 35000, "chargeableIncome": 33500, "payeTax": 3000, "personalRelief": 2400, "netPay": 30500, "employerCosts": 32000,
      "status": "draft", "note": null, "paymentMethod": null, "phoneNumber": "+254700000001",
      "worker": { "id": "<workerId>", "name": "John Worker" }, "designation": { "id": "<designationId>", "title": "Mason" },
      "details": [ { "name": "House Allowance", "type": "ALLOWANCE", "amount": 5000, "isStatutory": false } ]
    }
  ]
}
```
Error responses: `401`; `403`; `500` `Failed to fetch salary slips`.

### POST `/mobile/api/salary-slips`
Description: Generates a salary slip for a worker by computing payroll from active salary components and provided attendance inputs.
Auth: Bearer token + `salary_slips:create` + contractor account
Request body:
```json
{
  "workerId": "<workerId>", "payrollPeriodId": "<payrollPeriodId>", "designationId": "<designationId>",
  "workingHours": 200, "attainedHours": 192, "workingDays": 26, "attainedDays": 24, "overtimeHours": 0, "lateHours": 0, "lateDays": 0, "leaveHours": 0, "leaveDays": 0,
  "note": "July 2026 payroll", "paymentMethod": "bank", "phoneNumber": "+254700000001"
}
```
Success: `200` — `{ "error": false, "message": "Salary slip created", "data": { "id": "<slipId>", ..., "details": [...], "worker": {...}, "designation": {...} } }`
Error responses: `401`; `403`; `404` `Worker not found` / `Designation not found`; `500` `Failed to create salary slip`.

---

## Sites

### GET `/mobile/api/sites`
Description: Lists sites for the authenticated contractor (paginated, searchable).
Auth: Bearer token + `sites:read` + contractor account
Query params: `page` (default 1), `limit` (default 10), `search`
Success response: `200`
```json
{
  "error": false,
  "message": "Success",
  "data": {
    "rows": [ { "id": "cuid1", "name": "Main Warehouse", "location": "Lagos", "contractorId": "cuid-contractor", "description": "Primary storage", "category": "warehouse", "isPrimary": true, "createdAt": "2026-07-01T10:00:00.000Z", "updatedAt": "2026-07-01T10:00:00.000Z" } ],
    "total": 1,
    "pagination": { "page": 1, "limit": 10, "pages": 1 }
  }
}
```
Error responses: `401`; `403`; `500` `Failed to fetch sites`.

### POST `/mobile/api/sites`
Description: Creates a new site for the authenticated contractor.
Auth: Bearer token + `sites:create` + contractor account
Request body:
```json
{ "name": "North Storage", "location": "Abuja", "description": "Secondary storage facility", "category": "storage", "isPrimary": false }
```
Success: `200` — `{ "error": false, "message": "Site created", "data": {...} }`
Error responses: `401`; `403`; `500` `Failed to create site`.

### GET `/mobile/api/sites/[id]`
Description: Fetches a single site owned by the authenticated contractor.
Auth: Bearer token + `sites:read` + contractor account
Path params: `id`
Success: `200` — `{ "error": false, "message": "Success", "data": {...} }`
Error responses: `401`; `403`; `404` `Site not found`; `500` `Failed to fetch site`.

### PUT `/mobile/api/sites/[id]`
Description: Updates a site owned by the authenticated contractor.
Auth: Bearer token + `sites:update` + contractor account
Path params: `id`
Request body:
```json
{ "name": "Main Warehouse Updated", "location": "Lagos Island", "description": "Updated description", "category": "warehouse", "isPrimary": true }
```
Success: `200` — `{ "error": false, "message": "Site updated", "data": {...} }`
Error responses: `401`; `403`; `404` `Site not found`; `500` `Failed to update site`.

### DELETE `/mobile/api/sites/[id]`
Description: Deletes a site if it has no related records (materials, tasks, equipment, visitors, documents, metrics).
Auth: Bearer token + `sites:delete` + contractor account
Path params: `id`
Success: `200` — `{ "error": false, "message": "Site deleted successfully", "data": null }`
Error responses: `401`; `403`; `400` `{ "error": true, "message": "Cannot delete site with related records. Please remove all materials, tasks, and other associated data first." }`; `404` `Site not found`; `500` `Failed to delete site`.

### GET `/mobile/api/sites/check-onboarding`
Description: Checks whether the authenticated user still needs site onboarding.
Auth: Bearer token
Success: `200` — `{ "error": false, "message": "Success", "data": { "needsOnboarding": false, "hasSites": true, "siteCount": 3 } }`
Error responses: `401`; `500` `Failed to check onboarding status`.

---

## Projects

### GET `/mobile/api/projects`
Description: Lists projects (paginated, searchable).
Auth: Bearer token + `projects:read`
Query params: `page` (default 1), `limit` (default 10), `search`
Success: `200`
```json
{
  "error": false, "message": "Success",
  "data": { "rows": [ { "id": "proj1", "name": "Tower Build", "location": "Lagos", "description": "New office tower", "status": "planning", "companyId": null, "createdAt": "...", "updatedAt": "...", "company": null } ], "total": 1, "pagination": { "page": 1, "limit": 10, "pages": 1 } }
}
```
Error responses: `401`; `403`; `500` `Failed to fetch projects`.

### POST `/mobile/api/projects`
Description: Creates a new project.
Auth: Bearer token + `projects:create`
Request body:
```json
{ "name": "Tower Build", "location": "Lagos", "description": "New office tower", "coordinates": null, "category": "construction", "startDate": "2026-08-01", "endDate": "2027-08-01", "status": "planning", "companyId": null }
```
Success: `200` — `{ "error": false, "message": "Project created", "data": {...} }`
Error responses: `400` `Project name is required` / `Project location is required`; `401`; `403`; `500` `Failed to create project`.

### GET `/mobile/api/projects/[id]`
Description: Fetches a project by id with related contractor, sites, tasks, materials, equipment, documents, visitors, and metrics.
Auth: Bearer token + `projects:read`
Path params: `id`
Success: `200` — `{ "error": false, "message": "Success", "data": { "id": "proj1", "name": "Tower Build", "location": "Lagos", "contractor": null, "sites": [], "tasks": [], "materials": [], "equipment": [], "documents": [], "visitors": [], "metrics": [] } }`
Error responses: `401`; `403`; `404` `Project not found`; `500` `Failed to fetch project`.

### PUT `/mobile/api/projects/[id]`
Description: Updates a project (spreads body, parses `startDate`/`endDate`).
Auth: Bearer token + `projects:update`
Path params: `id`
Request body:
```json
{ "name": "Tower Build v2", "location": "Lagos", "status": "active", "startDate": "2026-08-01", "endDate": "2027-12-01" }
```
Success: `200` — `{ "error": false, "message": "Project updated", "data": {...} }`
Error responses: `401`; `403`; `500` `Failed to update project`.

### DELETE `/mobile/api/projects/[id]`
Description: Deletes a project by id.
Auth: Bearer token + `projects:delete`
Path params: `id`
Success: `200` — `{ "error": false, "message": "Project deleted", "data": null }`
Error responses: `401`; `403`; `500` `Failed to delete project`.

---

## Companies

### GET `/mobile/api/companies`
Description: Fetches the company profile for the authenticated contractor.
Auth: Bearer token + `settings:read` + contractor account
Success: `200`
```json
{ "error": false, "message": "Success", "data": { "id": "contractor-id", "name": "Acme Construction Ltd", "email": "owner@acme.com", "phone": "+2348000000000", "licenseNo": "LC-12345", "location": "Lagos", "createdAt": "...", "updatedAt": "..." } }
```
Error responses: `401`; `403`; `404` `Contractor not found`; `500` `Failed to fetch company`.

### PUT `/mobile/api/companies`
Description: Updates the company profile for the authenticated contractor.
Auth: Bearer token + `settings:update` + contractor account
Request body:
```json
{ "name": "Acme Construction Ltd", "phone": "+2348000000000", "licenseNo": "LC-12345", "location": "Lagos" }
```
Success: `200` — `{ "error": false, "message": "Company updated", "data": {...} }`
Error responses: `400` `Company name is required`; `401`; `403`; `404` `Contractor not found`; `500` `Failed to update company`.

### GET `/mobile/api/companies/[id]`
Description: Fetches a company by id, restricted to the authenticated user's own contractor record.
Auth: Bearer token + `settings:read`
Path params: `id`
Success: `200` — `{ "error": false, "message": "Success", "data": {...} }`
Error responses: `401`; `403` `Forbidden`; `404` `Company not found`; `500` `Failed to fetch company`.

---

## Contractors

### GET `/mobile/api/contractors`
Description: Lists contractors; scopes to the authenticated contractor if present.
Auth: Bearer token + `dashboard:read`
Query params: `page` (default 1), `limit` (default 10)
Success: `200` — `{ "error": false, "message": "Success", "data": { "rows": [...], "total": 1, "pagination": {...} } }`
Error responses: `401`; `403`; `500` `Failed to fetch contractors`.

### POST `/mobile/api/contractors`
Description: Creates a new contractor record.
Auth: Bearer token + `settings:manage`
Request body:
```json
{ "userId": "user-1", "companyName": "Acme Construction Ltd", "location": "Lagos", "phoneNumber": "+2348000000000", "licenseNo": "LC-12345", "subscriptionPlanId": "plan-1" }
```
Success: `200` — `{ "error": false, "message": "Contractor created", "data": {...} }`
Error responses: `401`; `403`; `500` `Failed to create contractor`.

### GET `/mobile/api/contractors/[id]`
Description: Fetches a contractor by id, including user, subscription plan, and projects.
Auth: Bearer token + `settings:read`
Path params: `id`
Success: `200` — `{ "error": false, "message": "Success", "data": { "id": "contractor-1", "companyName": "Acme Construction Ltd", "user": {...}, "subscriptionPlan": null, "projects": [] } }`
Error responses: `401`; `403`; `404` `Contractor not found`; `500` `Failed to fetch contractor`.

### PUT `/mobile/api/contractors/[id]`
Description: Updates a contractor (spreads body as update data).
Auth: Bearer token + `settings:update`
Path params: `id`
Request body:
```json
{ "companyName": "Acme Construction Ltd Updated", "location": "Abuja", "phoneNumber": "+2348000000001", "licenseNo": "LC-12345" }
```
Success: `200` — `{ "error": false, "message": "Contractor updated", "data": {...} }`
Error responses: `401`; `403`; `500` `Failed to update contractor`.

### DELETE `/mobile/api/contractors/[id]`
Description: Deletes a contractor by id.
Auth: Bearer token + `settings:manage`
Path params: `id`
Success: `200` — `{ "error": false, "message": "Contractor deleted", "data": null }`
Error responses: `401`; `403`; `500` `Failed to delete contractor`.

### GET `/mobile/api/contractors/[id]/subscription`
Description: Fetches the contractor's current subscription plus all active available plans.
Auth: Bearer token + `settings:read`
Path params: `id`
Success: `200` — `{ "error": false, "message": "Success", "data": { "currentPlan": { "id": "plan-1", "name": "Pro" }, "status": "active", "endDate": "...", "availablePlans": [...] } }`
Error responses: `401`; `403`; `500` `Failed to fetch subscription data`.

### PUT `/mobile/api/contractors/[id]/subscription`
Description: Sets the contractor's subscription plan to active for 30 days.
Auth: Bearer token + `settings:update`
Path params: `id`
Request body:
```json
{ "planId": "plan-1" }
```
Success: `200` — `{ "error": false, "message": "Subscription updated", "data": { "id": "contractor-1", "subscriptionPlanId": "plan-1", "subscriptionStatus": "active", "subscriptionEndDate": "...", "subscriptionPlan": {...} } }`
Error responses: `401`; `403`; `500` `Failed to update subscription`.

### GET `/mobile/api/contractors/[id]/notification-preferences`
Description: Fetches the contractor's notification preferences, merging defaults for types `payroll`, `safety`, `inventory`, `team`, `license`.
Auth: Bearer token + `settings:read`
Path params: `id`
Success: `200` — `{ "error": false, "message": "Success", "data": [ { "type": "payroll", "emailEnabled": true, "pushEnabled": true }, ... ] }`
Error responses: `401`; `403`; `500` `Failed to fetch preferences`.

### PUT `/mobile/api/contractors/[id]/notification-preferences`
Description: Upserts the contractor's notification preferences.
Auth: Bearer token + `settings:update`
Path params: `id`
Request body:
```json
{ "preferences": [ { "type": "payroll", "emailEnabled": true, "pushEnabled": false }, { "type": "safety", "emailEnabled": true, "pushEnabled": true } ] }
```
Success: `200` — `{ "error": false, "message": "Preferences updated", "data": null }`
Error responses: `401`; `403`; `500` `Failed to update preferences`.

---

## Inventory

### GET `/mobile/api/inventory`
Description: Lists inventory items for the contractor's sites (paginated, searchable, optional site filter).
Auth: Bearer token + `inventory:read` + contractor account
Query params: `page` (default 1), `limit` (default 10), `search`, `siteId`
Success: `200`
```json
{
  "error": false, "message": "Success",
  "data": { "rows": [ { "id": "inv-1", "name": "Cement Bag", "sku": "CEM-50", "quantity": 100, "unit": "bags", "category": { "id": "cat-1", "name": "Building" }, "site": { "id": "site-1", "name": "Main Warehouse", "contractor": { "id": "contractor-1", "companyName": "Acme" } } } ], "total": 1, "pagination": { "page": 1, "limit": 10, "pages": 1 } }
}
```
Error responses: `401`; `403`; `404` `Site not found`; `500` `Failed to fetch inventory`.

### POST `/mobile/api/inventory`
Description: Creates a new inventory item for a site owned by the contractor.
Auth: Bearer token + `inventory:create` + contractor account
Request body:
```json
{ "siteId": "site-1", "name": "Cement Bag", "description": "50kg Portland cement", "sku": "CEM-50", "categoryId": "cat-1", "quantity": "100", "unitCost": "12.5", "unit": "bags", "minStockLevel": "20", "maxStockLevel": "500", "reorderPoint": "30", "location": "Shelf A1", "status": "in-stock" }
```
Success: `200` — `{ "error": false, "message": "Inventory item created", "data": {...} }`
Error responses: `400` `Name is required` / `Site ID is required` / `Unit is required` / `Quantity must be a valid number`; `401`; `403`; `404` `Site not found`; `500` `Failed to create inventory item`.

### GET `/mobile/api/inventory/[id]`
Description: Fetches a single inventory item, including category, movements, and site.
Auth: Bearer token + `inventory:read` + contractor account
Path params: `id`
Success: `200` — `{ "error": false, "message": "Success", "data": { "id": "inv-1", ..., "movements": [...], "site": {...} } }`
Error responses: `401`; `403`; `404` `Inventory item not found`; `500` `Failed to fetch inventory item`.

### PATCH `/mobile/api/inventory/[id]`
Description: Partially updates an inventory item.
Auth: Bearer token + `inventory:update` + contractor account
Path params: `id`
Request body: any subset of POST fields
Success: `200` — `{ "error": false, "message": "Inventory item updated", "data": {...} }`
Error responses: `401`; `403`; `404` `Inventory item not found`; `500` `Failed to update inventory item`.

### DELETE `/mobile/api/inventory/[id]`
Description: Deletes an inventory item.
Auth: Bearer token + `inventory:delete` + contractor account
Path params: `id`
Success: `200` — `{ "error": false, "message": "Inventory item deleted", "data": null }`
Error responses: `401`; `403`; `404` `Inventory item not found`; `500` `Failed to delete inventory item`.

### POST `/mobile/api/inventory/[id]/stock-in`
Description: Adds stock to an inventory item and records an `in` stock movement.
Auth: Bearer token + `inventory:update`
Path params: `id`
Request body:
```json
{ "quantity": 50, "notes": "Restocked from supplier" }
```
Success: `200` — `{ "error": false, "message": "Stock added", "data": { "id": "inv-1", "quantity": 150, "site": {...} } }`
Error responses: `400` `Valid quantity is required`; `401`; `403`; `404` `Inventory item not found`; `500` `Failed to record stock in`.

### POST `/mobile/api/inventory/[id]/usage`
Description: Records usage (outflow) of an inventory item, validating sufficient stock.
Auth: Bearer token + `inventory:update`
Path params: `id`
Request body:
```json
{ "quantity": 10, "notes": "Used for foundation pour" }
```
Success: `200` — `{ "error": false, "message": "Usage recorded", "data": { "id": "inv-1", "quantity": 140, "site": {...} } }`
Error responses: `400` `Valid quantity is required` / `Insufficient stock`; `401`; `403`; `404` `Inventory item not found`; `500` `Failed to record usage`.

### GET `/mobile/api/inventory/[id]/transfers`
Description: Lists stock transfers for an inventory item, including from/to site details.
Auth: Bearer token + `inventory:read`
Path params: `id`
Success: `200` — `{ "error": false, "message": "Success", "data": [ { "id": "transfer-1", "inventoryId": "inv-1", "fromSiteId": "site-1", "toSiteId": "site-2", "quantity": 20, "status": "pending", "createdAt": "...", "fromSite": {...}, "toSite": {...} } ] }`
Error responses: `401`; `403`; `500` `Failed to fetch stock transfers`.

### POST `/mobile/api/inventory/[id]/transfers`
Description: Creates a pending stock transfer request to a destination site.
Auth: Bearer token + `inventory:create`
Path params: `id`
Request body:
```json
{ "toSiteId": "site-2", "quantity": 20, "requestedBy": "user-1", "notes": "Transfer to North Storage" }
```
Success: `200` — `{ "error": false, "message": "Stock transfer created", "data": {...} }`
Error responses: `400` `Destination site and quantity are required` / `Insufficient stock`; `401`; `403`; `404` `Inventory item not found`; `500` `Failed to create stock transfer`.

### PATCH `/mobile/api/inventory/[id]/transfers/[transferId]`
Description: Approves or rejects a pending stock transfer; on approval, moves stock between sites (creating a matching item at destination if needed).
Auth: Bearer token + `inventory:update`
Path params: `id` (inventory id, unused in lookup), `transferId` (used as the transfer id)
Request body (approve):
```json
{ "status": "approved", "approvedBy": "user-1" }
```
Request body (reject):
```json
{ "status": "rejected", "rejectedReason": "Insufficient need", "approvedBy": "user-1" }
```
Success: `200` — `{ "error": false, "message": "Stock transfer updated", "data": {...} }`
Error responses: `400` `Transfer is not in pending status` / `Insufficient stock for transfer`; `401`; `403`; `404` `Transfer not found`; `500` `Failed to update stock transfer`.

### POST `/mobile/api/inventory/import`
Description: Bulk imports inventory items into a specified site.
Auth: Bearer token + `inventory:create`
Request body:
```json
{ "siteId": "site-1", "items": [ { "name": "Cement Bag", "description": "50kg", "sku": "CEM-50", "categoryId": "cat-1", "quantity": "100", "unitCost": "12.5", "unit": "bags", "minStock": "20", "location": "Shelf A1", "status": "in-stock" }, { "name": "Sand", "quantity": "50", "unit": "tons" } ] }
```
Success: `200` — `{ "error": false, "message": "Inventory imported", "data": { "created": 2, "failed": 0, "errors": [] } }`
Error responses: `400` `Items array is required` / `Site ID is required`; `401`; `403`; `404` `Site not found`; `500` `Failed to import inventory`.

---

## Inventory Categories

### GET `/mobile/api/inventory/categories`
Description: Lists inventory categories scoped to the contractor (or shared globals).
Auth: Bearer token + `inventory:read`
Query params: `page` (default 1), `limit` (default 100), `search`
Success: `200`
```json
{
  "error": false, "message": "Success",
  "data": { "rows": [ { "id": "cat-1", "name": "Building", "description": "Building materials", "parent": null, "subCategories": [], "_count": { "inventory": 5 } } ], "total": 1, "pagination": { "page": 1, "limit": 100, "pages": 1 } }
}
```
Error responses: `401`; `403`; `500` `Failed to fetch categories`.

### POST `/mobile/api/inventory/categories`
Description: Creates a new inventory category scoped to the contractor.
Auth: Bearer token + `inventory:create`
Request body:
```json
{ "name": "Building", "description": "Building materials", "parentId": null }
```
Success: `200` — `{ "error": false, "message": "Category created", "data": {...} }`
Error responses: `400` `Name is required`; `401`; `403`; `500` `Failed to create category`.

### GET `/mobile/api/inventory/categories/[id]`
Description: Fetches a single category (contractor-owned or shared global).
Auth: Bearer token + `inventory:read`
Path params: `id`
Success: `200` — `{ "error": false, "message": "Success", "data": {...} }`
Error responses: `401`; `403`; `404` `Category not found`; `500` `Failed to fetch category`.

### PATCH `/mobile/api/inventory/categories/[id]`
Description: Updates a contractor-owned category; shared globals are read-only.
Auth: Bearer token + `inventory:update`
Path params: `id`
Request body:
```json
{ "name": "Building Updated", "description": "Updated description", "parentId": null }
```
Success: `200` — `{ "error": false, "message": "Category updated", "data": {...} }`
Error responses: `400` `Name is required`; `401`; `403`; `404` `Category not found`; `500` `Failed to update category`.

### DELETE `/mobile/api/inventory/categories/[id]`
Description: Deletes a contractor-owned category if it has no associated inventory items.
Auth: Bearer token + `inventory:delete`
Path params: `id`
Success: `200` — `{ "error": false, "message": "Category deleted", "data": null }`
Error responses: `400` `Cannot delete category with associated materials`; `401`; `403`; `404` `Category not found`; `500` `Failed to delete category`.

### POST `/mobile/api/inventory/categories/import`
Description: Bulk imports inventory categories scoped to the contractor.
Auth: Bearer token + `inventory:create`
Request body:
```json
{ "categories": [ { "name": "Building", "description": "Building materials", "parentId": null }, { "name": "Electrical", "description": "Electrical supplies", "parentId": null } ] }
```
Success: `200` — `{ "error": false, "message": "Categories imported", "data": { "created": 2, "failed": 0, "errors": [] } }`
Error responses: `400` `Categories array is required`; `401`; `403`; `500` `Failed to import categories`.

---

## Materials

### GET `/mobile/api/materials`
Description: Lists inventory items treated as materials, optionally filtered by site.
Auth: Bearer token + `materials:read` + contractor account
Query params: `siteId`
Success: `200`
```json
{
  "error": false, "message": "Success",
  "data": [ { "id": "inv-1", "name": "Cement Bag", "quantity": 100, "unit": "bags", "category": { "id": "cat-1", "name": "Building" }, "site": { "id": "site-1", "name": "Main Warehouse", "contractor": { "id": "contractor-1", "companyName": "Acme" } } } ]
}
```
Error responses: `401`; `403`; `404` `Site not found`; `500` `Failed to fetch inventory`.

### POST `/mobile/api/materials`
Description: Creates an inventory item (material) for a site owned by the contractor.
Auth: Bearer token + `materials:create` + contractor account
Request body:
```json
{ "siteId": "site-1", "name": "Sand", "description": "Sharp sand", "categoryId": "cat-1", "quantity": 50, "unit": "tons", "minStock": 10, "location": "Yard B", "status": "in-stock" }
```
Success: `200` — `{ "error": false, "message": "Inventory item created", "data": {...} }`
Error responses: `400` `Unit is required`; `401`; `403`; `404` `Site not found`; `500` `Failed to create inventory item`.

---

## Suppliers

### GET `/mobile/api/suppliers`
Description: Lists suppliers scoped to the contractor (and shared globals).
Auth: Bearer token + `suppliers:read`
Query params: `page` (default 1), `limit` (default 10), `search`
Success: `200`
```json
{
  "error": false, "message": "Success",
  "data": { "rows": [ { "id": "sup-1", "name": "BuildMart Ltd", "contactPerson": "John Doe", "email": "sales@buildmart.com", "phone": "+2348000000000", "address": "12 Industrial Rd, Lagos", "contractorId": "contractor-1" } ], "total": 1, "pagination": { "page": 1, "limit": 10, "pages": 1 } }
}
```
Error responses: `401`; `403`; `500` `Failed to fetch suppliers`.

### POST `/mobile/api/suppliers`
Description: Creates a new supplier scoped to the contractor.
Auth: Bearer token + `suppliers:create`
Request body:
```json
{ "name": "BuildMart Ltd", "contactPerson": "John Doe", "email": "sales@buildmart.com", "phone": "+2348000000000", "address": "12 Industrial Rd, Lagos" }
```
Success: `200` — `{ "error": false, "message": "Supplier created", "data": {...} }`
Error responses: `400` `Name is required`; `401`; `403`; `500` `Failed to create supplier`.

### GET `/mobile/api/suppliers/[id]`
Description: Fetches a supplier (contractor-owned or shared global).
Auth: Bearer token + `suppliers:read`
Path params: `id`
Success: `200` — `{ "error": false, "message": "Success", "data": {...} }`
Error responses: `401`; `403`; `404` `Supplier not found`; `500` `Failed to fetch supplier`.

### PATCH `/mobile/api/suppliers/[id]`
Description: Updates a contractor-owned supplier; shared globals are read-only.
Auth: Bearer token + `suppliers:update`
Path params: `id`
Request body:
```json
{ "name": "BuildMart Ltd Updated", "contactPerson": "Jane Doe", "email": "info@buildmart.com", "phone": "+2348000000001", "address": "15 Industrial Rd, Lagos" }
```
Success: `200` — `{ "error": false, "message": "Supplier updated", "data": {...} }`
Error responses: `400` `Name is required`; `401`; `403`; `404` `Supplier not found`; `500` `Failed to update supplier`.

### DELETE `/mobile/api/suppliers/[id]`
Description: Deletes a contractor-owned supplier.
Auth: Bearer token + `suppliers:delete`
Path params: `id`
Success: `200` — `{ "error": false, "message": "Supplier deleted", "data": null }`
Error responses: `401`; `403`; `404` `Supplier not found`; `500` `Failed to delete supplier`.

---

## Equipment

### GET `/mobile/api/equipment`
Description: Lists equipment for the contractor's sites (paginated, searchable, optional site filter).
Auth: Bearer token + `equipment:read` + contractor account
Query params: `page` (default 1), `limit` (default 10), `search`, `siteId`
Success: `200`
```json
{
  "error": false, "message": "Success",
  "data": { "rows": [ { "id": "eq-1", "name": "Excavator 1", "type": "excavator", "serialNumber": "EX-001", "status": "Active", "siteId": "site-1" } ], "total": 1, "pagination": { "page": 1, "limit": 10, "pages": 1 } }
}
```
Error responses: `401`; `403`; `404` `Site not found`; `500` `Failed to fetch equipment`.

### POST `/mobile/api/equipment`
Description: Creates new equipment on a site owned by the contractor.
Auth: Bearer token + `equipment:create` + contractor account
Request body:
```json
{ "siteId": "site-1", "name": "Excavator 1", "machineType": "excavator", "serialNo": "EX-001", "serialNumber": "EX-001", "rentalCost": "5000", "dailyRate": "1000", "status": "Active", "lastMaintenanceDate": "2026-06-01", "nextMaintenanceDate": "2026-09-01", "projectId": null }
```
Success: `200` — `{ "error": false, "message": "Equipment created", "data": { "id": "eq-new", "name": "Excavator 1", "type": "excavator", "rentalCost": 5000, "dailyRate": 1000, "lastService": "...", "nextService": "...", "siteId": "site-1" } }`
Error responses: `400` `Site ID is required` / `Name is required` / `Machine type is required`; `401`; `403`; `404` `Site not found`; `500` `Failed to create equipment`.

### GET `/mobile/api/equipment/[id]`
Description: Fetches a single equipment item, including its site.
Auth: Bearer token + `equipment:read` + contractor account
Path params: `id`
Success: `200` — `{ "error": false, "message": "Success", "data": { "id": "eq-1", "name": "Excavator 1", "type": "excavator", "serialNumber": "EX-001", "status": "Active", "site": {...} } }`
Error responses: `401`; `403`; `404` `Equipment not found`; `500` `Failed to fetch equipment`.

### PATCH `/mobile/api/equipment/[id]`
Description: Updates equipment owned by the contractor.
Auth: Bearer token + `equipment:update` + contractor account
Path params: `id`
Request body:
```json
{ "name": "Excavator 1 Updated", "machineType": "excavator", "serialNo": "EX-001", "rentalCost": "5500", "dailyRate": "1100", "status": "Maintenance", "lastMaintenanceDate": "2026-07-01", "nextMaintenanceDate": "2026-10-01", "projectId": "proj-1" }
```
Success: `200` — `{ "error": false, "message": "Equipment updated", "data": {...} }`
Error responses: `401`; `403`; `404` `Equipment not found`; `500` `Failed to update equipment`.

### DELETE `/mobile/api/equipment/[id]`
Description: Deletes equipment owned by the contractor.
Auth: Bearer token + `equipment:delete` + contractor account
Path params: `id`
Success: `200` — `{ "error": false, "message": "Equipment deleted", "data": null }`
Error responses: `401`; `403`; `404` `Equipment not found`; `500` `Failed to delete equipment`.

### POST `/mobile/api/equipment/import`
Description: Bulk imports equipment into a specified site.
Auth: Bearer token + `equipment:create`
Request body:
```json
{ "siteId": "site-1", "equipment": [ { "name": "Excavator 1", "machineType": "excavator", "serialNumber": "EX-001", "rentalCost": "5000", "dailyRate": "1000", "status": "Active" }, { "name": "Crane", "type": "crane", "status": "Active" } ] }
```
Success: `200` — `{ "error": false, "message": "Equipment imported", "data": { "created": 2, "failed": 0, "errors": [] } }`
Error responses: `400` `Equipment array is required` / `Site ID is required`; `401`; `403`; `404` `Site not found`; `500` `Failed to import equipment`.

---

## Purchase Orders

### GET `/mobile/api/purchase-orders`
Description: Lists paginated purchase orders for the contractor's sites.
Auth: Bearer token + `purchase_orders:read` + contractor account
Query params: `page` (default 1), `limit` (default 10), `search`, `status`, `siteId`
Success: `200`
```json
{
  "error": false, "message": "Success",
  "data": { "rows": [ { "id": "po_1", "orderNumber": "PO-001", "status": "pending", "supplier": { "id": "sup_1", "name": "Acme Supplies" }, "items": [], "site": { "id": "site_1", "name": "Site A" }, "subtotal": 1000, "tax": 0, "total": 1000, "createdAt": "..." } ], "total": 1, "pagination": {...} }
}
```
Error responses: `401`; `403`; `404` `Site not found`; `500` `Failed to fetch purchase orders`.

### POST `/mobile/api/purchase-orders`
Description: Creates a new purchase order (with optional line items).
Auth: Bearer token + `purchase_orders:create` + contractor account
Request body:
```json
{
  "orderNumber": "PO-001", "supplierId": "sup_1", "siteId": "site_1", "status": "pending", "subtotal": 1000, "tax": 100, "total": 1100, "orderDate": "2026-01-01", "expectedDeliveryDate": "2026-01-10", "notes": "Urgent delivery",
  "items": [ { "description": "Cement bags", "quantity": 10, "unitPrice": 100, "materialId": "inv_1" } ]
}
```
Success: `200` — `{ "error": false, "message": "Purchase order created", "data": {...} }`
Error responses: `400` `Order number is required` / `Supplier is required`; `401`; `403`; `404` `Site not found`; `500` `Failed to create purchase order`.

### GET `/mobile/api/purchase-orders/[id]`
Description: Fetches a single purchase order.
Auth: Bearer token + `purchase_orders:read` + contractor account
Path params: `id`
Success: `200` — `{ "error": false, "message": "Success", "data": {...} }`
Error responses: `401`; `403`; `404` `Purchase order not found`; `500` `Failed to fetch purchase order`.

### PATCH `/mobile/api/purchase-orders/[id]`
Description: Updates a purchase order; on transition to `delivered` posts stock into inventory; replaces items if provided.
Auth: Bearer token + `purchase_orders:update` + contractor account
Path params: `id`
Request body:
```json
{ "status": "processing", "orderDate": "2026-01-01", "expectedDeliveryDate": "2026-01-10", "items": [ { "id": "item_1", "description": "Cement bags", "quantity": 10, "unitPrice": 100 } ] }
```
Success: `200` — `{ "error": false, "message": "Purchase order updated", "data": {...} }`
Error responses: `400` `Cannot edit a delivered purchase order`; `401`; `403`; `404` `Purchase order not found`; `500` `Failed to update purchase order`.

### DELETE `/mobile/api/purchase-orders/[id]`
Description: Deletes a non-delivered purchase order.
Auth: Bearer token + `purchase_orders:delete` + contractor account
Path params: `id`
Success: `200` — `{ "error": false, "message": "Purchase order deleted successfully", "data": null }`
Error responses: `400` `Cannot delete a delivered purchase order`; `401`; `403`; `404` `Purchase order not found`; `500` `Failed to delete purchase order`.

### POST `/mobile/api/purchase-orders/[id]/receive`
Description: Records stock received for PO items, updating inventory and PO status.
Auth: Bearer token + `purchase_orders:update` + contractor account
Path params: `id`
Request body:
```json
{ "items": [ { "id": "poitem_1", "receivedQuantity": 10 } ], "note": "Partial delivery accepted" }
```
Success: `200` — `{ "error": false, "message": "Stock received recorded", "data": {...} }`
Error responses: `400` `No items provided`; `401`; `403`; `404` `Purchase order not found`; `500` `<error.message>` / `Failed to record stock received`.

### GET `/mobile/api/purchase-orders/[id]/pdf`
Description: Generates and downloads a PDF for a purchase order.
Auth: Bearer token + `purchase_orders:read`
Path params: `id`
Success: `200` — binary PDF with headers `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="PO-<orderNumber>.pdf"`.
Error responses: `401`; `403`; `404` `Purchase order not found`; `500` `Failed to generate PDF`.

---

## Payroll Periods

### GET `/mobile/api/payroll-periods`
Description: Lists paginated payroll periods for the contractor.
Auth: Bearer token + `payroll:read` + contractor account
Query params: `page` (default 1), `limit` (default 10)
Success: `200`
```json
{
  "error": false, "message": "Success",
  "data": { "rows": [ { "id": "pp_1", "name": "January 2026", "status": "draft", "startDate": "...", "endDate": "...", "paymentFrequency": "monthly", "totalEmployees": 5, "createdBy": { "id": "u_1", "name": "Admin" }, "_count": { "salarySlips": 0 } } ], "total": 1, "pagination": {...} }
}
```
Error responses: `401`; `403`; `500` `Failed to fetch payroll periods`.

### POST `/mobile/api/payroll-periods`
Description: Creates a new draft payroll period for the contractor.
Auth: Bearer token + `payroll:create` + contractor account
Request body:
```json
{ "name": "January 2026", "startDate": "2026-01-01", "endDate": "2026-01-31", "paymentFrequency": "monthly", "description": "Monthly payroll", "createdByWorkerId": "worker_1" }
```
Success: `200` — `{ "error": false, "message": "Payroll period created", "data": {...} }`
Error responses: `401`; `403`; `500` `Failed to create payroll period`.

### GET `/mobile/api/payroll-periods/[id]`
Description: Fetches a single payroll period with salary slips.
Auth: Bearer token + `payroll:read` + contractor account
Path params: `id`
Success: `200` — `{ "error": false, "message": "Success", "data": { "id": "pp_1", "name": "January 2026", "status": "completed", "totalEmployees": 5, "createdBy": {...}, "salarySlips": [] } }`
Error responses: `401`; `403`; `404` `Payroll period not found`; `500` `Failed to fetch payroll period`.

### PUT `/mobile/api/payroll-periods/[id]`
Description: Updates a payroll period; when `status` is `processing`, runs full payroll calculation and generates salary slips.
Auth: Bearer token + `payroll:update` + contractor account
Path params: `id`
Request body:
```json
{ "status": "processing", "name": "January 2026", "startDate": "2026-01-01", "endDate": "2026-01-31", "paymentFrequency": "monthly", "description": "Monthly payroll", "totalEmployees": 5, "totalGrossPay": 500000, "totalNetPay": 400000, "totalDeductions": 100000 }
```
Success: `200` — `{ "error": false, "message": "Payroll processed", "data": { "id": "pp_1", "status": "completed", "totalEmployees": 5, "totalGrossPay": 500000, "totalNetPay": 400000, "totalDeductions": 100000 } }`
Error responses: `401`; `403`; `404` `Period not found`; `500` `Failed to update payroll period`.

### DELETE `/mobile/api/payroll-periods/[id]`
Description: Deletes a payroll period that has no salary slips.
Auth: Bearer token + `payroll:delete`
Path params: `id`
Success: `200` — `{ "error": false, "message": "Payroll period deleted", "data": null }`
Error responses: `400` `Cannot delete period with salary slips`; `401`; `403`; `404` `Payroll period not found`; `500` `Failed to delete payroll period`.

### POST `/mobile/api/payroll-periods/[id]/disburse`
Description: Disburses a completed payroll period's net pay to workers via manual wallet debit or M-Pesa (B2C/B2B/B2Pochi) pending approval.
Auth: Bearer token + `payroll:manage`
Path params: `id`
Request body:
```json
{ "walletId": "wallet_1" }
```
Success: `200`
```json
{
  "error": false, "message": "Disbursement processed",
  "data": { "total": 5, "mpesa": 3, "manual": 1, "skipped": 0, "alreadyDisbursed": 1, "transactions": [ { "slipId": "slip_1", "workerName": "John Doe", "netPay": 50000, "mode": "manual", "transactionId": "txn_1", "status": "completed" } ] }
}
```
Error responses: `400` `Wallet ID is required` / `Payroll must be completed before disbursement` / `Insufficient wallet balance. Balance: <balance>, Required: <totalNetPay>`; `401`; `403`; `404` `Wallet not found` / `Payroll period not found`; `500` `<error.message>` / `Failed to process disbursement`.

---

## Wallets

### GET `/mobile/api/wallets`
Description: Lists all wallets owned by the contractor, with last-transaction info.
Auth: Bearer token + `wallets:read`
Success: `200`
```json
{ "error": false, "message": "Success", "data": [ { "id": "wallet_1", "name": "Main Wallet", "balance": 100000, "lastTransaction": "3 days ago", "transactionCount": 12 } ] }
```
Error responses: `401`; `403`; `404` `Contractor not found`; `500` `Failed to fetch wallets`.

### POST `/mobile/api/wallets`
Description: Creates a new wallet for the contractor.
Auth: Bearer token + `wallets:create`
Request body:
```json
{ "name": "Operations Wallet", "description": "Daily operations float" }
```
Success: `200` — `{ "error": false, "message": "Wallet created", "data": { "id": "wallet_2", "name": "Operations Wallet", "description": "...", "balance": 0, "contractorId": "c_1" } }`
Error responses: `400` `Wallet name is required`; `401`; `403`; `404` `Contractor not found`; `500` `Failed to create wallet`.

### GET `/mobile/api/wallets/[id]`
Description: Fetches a single wallet, with transaction count.
Auth: Bearer token + `wallets:read` + contractor account
Path params: `id`
Success: `200` — `{ "error": false, "message": "Success", "data": { "id": "wallet_1", "name": "Main Wallet", "balance": 100000, "_count": { "transactions": 12 } } }`
Error responses: `401`; `403`; `404` `Wallet not found`; `500` `Failed to fetch wallet`.

### PATCH `/mobile/api/wallets/[id]`
Description: Updates a wallet's name and description.
Auth: Bearer token + `wallets:update` + contractor account
Path params: `id`
Request body:
```json
{ "name": "Main Wallet (Updated)", "description": "Updated description" }
```
Success: `200` — `{ "error": false, "message": "Wallet updated", "data": {...} }`
Error responses: `400` `Wallet name is required`; `401`; `403`; `404` `Wallet not found`; `500` `Failed to update wallet`.

### DELETE `/mobile/api/wallets/[id]`
Description: Deletes a wallet that has no existing transactions.
Auth: Bearer token + `wallets:delete` + contractor account
Path params: `id`
Success: `200` — `{ "error": false, "message": "Wallet deleted", "data": null }`
Error responses: `400` `Cannot delete wallet with existing transactions`; `401`; `403`; `404` `Wallet not found`; `500` `Failed to delete wallet`.

### GET `/mobile/api/wallets/[id]/transactions`
Description: Lists paginated transactions for a wallet (optional full-text search).
Auth: Bearer token + `wallets:read` + contractor account
Path params: `id`
Query params: `page` (default 1), `limit` (default 10), `search`
Success: `200`
```json
{
  "error": false, "message": "Success",
  "data": { "rows": [ { "id": "txn_1", "walletId": "wallet_1", "type": "credit", "amount": 5000, "reference": "REF-1", "status": "completed", "createdAt": "..." } ], "total": 1, "pagination": {...} }
}
```
Error responses: `401`; `403`; `404` `Wallet not found`; `500` `Failed to fetch transactions`.

### POST `/mobile/api/wallets/[id]/transactions`
Description: Creates a wallet transaction (manual credit/debit, bank top-up/payout, or M-Pesa STK push / pending-approval payout).
Auth: Bearer token + `wallets:create` + contractor account
Path params: `id`
Request body:
```json
{ "type": "debit", "amount": 1500, "description": "Fuel payment", "referenceNumber": "0712345678", "method": "mpesa", "payoutType": "phone", "accountNumber": "ACC-1", "requiresApproval": true, "bankCode": "63", "destinationAccount": "0112345678", "mobileNumber": "0712345678", "payoutChannel": "pesalink" }
```
Success (non-bank, non-mpesa): `200` — `{ "error": false, "message": "Success", "data": { "id": "txn_1", "walletId": "wallet_1", "type": "debit", "amount": 1500, "status": "completed" } }`

(M-Pesa payout returns `{ "message": "Transaction created and pending approval", "data": { "transaction": {...} } }`. Bank credit: `Bank top-up initiated and pending confirmation`; bank debit: `Bank payout created and pending approval`; mpesa credit: `STK Push initiated`.)
Error responses: `400` `Type and amount are required` / `Insufficient balance` / `Sender account number is required for bank top-up` / `Mobile number is required for bank-to-M-Pesa payout` / `Destination account number is required for bank payout`; `401`; `403`; `404` `Wallet not found`; `500` `<error.message>` / `Failed to process transaction`.

### GET `/mobile/api/wallets/transactions/approvals`
Description: Lists transactions pending approval, optionally filtered by wallet.
Auth: Bearer token + `wallets:read`
Query params: `walletId`, `page` (default 1), `limit` (default 50)
Success: `200` — `{ "error": false, "message": "Success", "data": { "rows": [...], "total": 1, "pagination": {...} } }`
Error responses: `401`; `403`; `500` `Failed to fetch pending approval transactions`.

### POST `/mobile/api/wallets/transactions/approvals`
Description: Approves (and triggers) pending M-Pesa payouts for a batch of transaction IDs.
Auth: Bearer token + `wallets:manage`
Request body:
```json
{ "transactionIds": ["txn_1", "txn_2"] }
```
Success: `200`
```json
{
  "error": false, "message": "Approvals processed",
  "data": { "approved": 1, "failed": 1, "results": [ { "transactionId": "txn_1", "success": true, "mpesaResponse": {} } ], "errors": [ { "transactionId": "txn_2", "error": "Insufficient balance" } ] }
}
```
Error responses: `400` `Transaction IDs are required`; `401`; `403`; `500` `<error.message>` / `Failed to approve transactions`.

### POST `/mobile/api/wallets/transactions/[id]/reject`
Description: Rejects a pending-approval transaction, marking it CANCELLED.
Auth: Bearer token + `wallets:manage`
Path params: `id`
Request body:
```json
{ "reason": "Duplicate request" }
```
Success: `200` — `{ "error": false, "message": "Transaction rejected successfully", "data": null }`
Error responses: `400` `Transaction is not pending approval`; `401`; `403`; `404` `Transaction not found`; `500` `<error.message>` / `Failed to reject transaction`.

---

## M-Pesa

### POST `/mobile/api/mpesa/stkpush`
Description: Initiates an STK Push (customer-to-business) deposit to a wallet.
Auth: Bearer token + `wallets:create`
Request body:
```json
{ "phoneNumber": "0712345678", "amount": 1000, "walletId": "wallet_1", "accountReference": "WALLET_wallet_1", "transactionDesc": "Top-up" }
```
Success: `200`
```json
{ "error": false, "message": "STK Push initiated successfully", "data": { "transactionId": "txn_1", "checkoutRequestId": "ws_CO_...", "merchantRequestId": "...", "responseCode": "0", "responseDescription": "Success. Request accepted for processing", "customerMessage": "..." } }
```
Error responses: `400` `Missing required fields: phoneNumber, amount, walletId` / `Amount must be a positive number` / `Invalid phone number format` / `<result.error>`; `401`; `403`; `404` `Wallet not found`; `500` `Failed to initiate STK Push`.

### POST `/mobile/api/mpesa/b2c`
Description: Initiates a Business-to-Customer (B2C) M-Pesa payout to a phone number.
Auth: Bearer token + `wallets:create`
Request body:
```json
{ "phoneNumber": "0712345678", "amount": 2000, "walletId": "wallet_1", "commandID": "BusinessPayment", "remarks": "Salary payout", "occasion": "May payroll" }
```
Success: `200` — `{ "error": false, "message": "B2C payment initiated successfully", "data": { "transactionId": "txn_1", "conversationId": "...", "originatorConversationId": "...", "responseCode": "0", "responseDescription": "Accept the service request successfully." } }`
Error responses: `400` `Missing required fields: phoneNumber, amount, walletId` / `Amount must be a positive number` / `Invalid phone number format` / `Insufficient wallet balance` / `<result.error>`; `401`; `403`; `404` `Wallet not found`; `500` `Failed to initiate B2C payment`.

### POST `/mobile/api/mpesa/b2b`
Description: Initiates a Business-to-Business (B2B) M-Pesa transfer to a short code (paybill/till).
Auth: Bearer token + `wallets:create`
Request body:
```json
{ "receiverShortCode": "123456", "amount": 5000, "walletId": "wallet_1", "accountReference": "ACC-1", "commandID": "BusinessPayBill", "remarks": "Supplier payment" }
```
Success: `200` — `{ "error": false, "message": "B2B transfer initiated successfully", "data": { "transactionId": "txn_1", "conversationId": "...", "originatorConversationId": "...", "responseCode": "0", "responseDescription": "Accept the service request successfully." } }`
Error responses: `400` `Missing required fields: receiverShortCode, amount, walletId` / `Amount must be a positive number` / `Insufficient wallet balance` / `<result.error>`; `401`; `403`; `404` `Wallet not found`; `500` `Failed to initiate B2B transfer`.

### POST `/mobile/api/mpesa/b2pochi`
Description: Initiates a Business-to-Pochi (send money to a personal Pochi wallet) M-Pesa payment.
Auth: Bearer token + `wallets:create`
Request body:
```json
{ "phoneNumber": "0712345678", "amount": 1500, "walletId": "wallet_1", "remarks": "Pochi payment" }
```
Success: `200` — `{ "error": false, "message": "B2Pochi payment initiated successfully", "data": {...} }`
Error responses: `400` `Missing required fields: phoneNumber, amount, walletId` / `Amount must be a positive number` / `Invalid phone number format` / `Insufficient wallet balance` / `<result.error>`; `401`; `403`; `404` `Wallet not found`; `500` `Failed to initiate B2Pochi payment`.

### POST `/mobile/api/mpesa/reversal`
Description: Initiates a reversal of a previous M-Pesa transaction.
Auth: Bearer token + `wallets:manage`
Request body:
```json
{ "transactionID": "OEI2K4RN6Q", "amount": 1000, "walletId": "wallet_1", "remarks": "Reversal Request" }
```
Success: `200` — `{ "error": false, "message": "Reversal initiated successfully", "data": {...} }`
Error responses: `400` `Missing required fields: transactionID, amount, walletId` / `Amount must be a positive number` / `<result.error>`; `401`; `403`; `404` `Wallet not found`; `500` `Failed to initiate reversal`.

### POST `/mobile/api/mpesa/account-balance`
Description: Queries the M-Pesa account balance for the configured organization shortcode.
Auth: Bearer token + `wallets:read`
Request body:
```json
{ "remarks": "Balance Query", "walletId": "wallet_1" }
```
Success: `200` — `{ "error": false, "message": "Account balance retrieved successfully", "data": { "responseCode": "0", "responseDescription": "Accept the service request successfully.", "result": {}, "transactionId": "txn_1" } }`
Error responses: `400` `<result.responseDescription>`; `401`; `403`; `500` `Failed to query account balance`.

### GET `/mobile/api/mpesa/transactions`
Description: Lists M-Pesa wallet transactions, filtered by transaction id, wallet, status, or type.
Auth: Bearer token + `wallets:read` + contractor account
Query params: `transactionId`, `walletId`, `status`, `type`, `limit` (default 50), `offset` (default 0)
Success: `200` — `{ "error": false, "message": "Success", "data": { "rows": [...], "total": 1, "pagination": { "page": 1, "limit": 50, "pages": 1 } } }`
Error responses: `400` `Invalid status value` / `Invalid transaction type`; `401`; `403`; `404` `Transaction not found` / `Wallet not found`; `500` `Failed to retrieve transactions`.

### POST `/mobile/api/mpesa/transaction-status`
Description: Queries the status of an M-Pesa transaction via the M-Pesa API by `transactionID`.
Auth: Bearer token + `wallets:read`
Request body:
```json
{ "transactionID": "OEI2K4RN6Q", "remarks": "Status Query", "walletId": "wallet_1" }
```
Success: `200` — `{ "error": false, "message": "Transaction status retrieved successfully", "data": { "responseCode": "0", "responseDescription": "...", "result": {}, "transactionId": "txn_1" } }`
Error responses: `400` `Missing required field: transactionID` / `<result.responseDescription>`; `401`; `403`; `500` `Failed to query transaction status`.

### GET `/mobile/api/mpesa/transaction-status`
Description: Looks up a locally stored M-Pesa transaction by id.
Auth: Bearer token + `wallets:read`
Query params: `transactionId` (required)
Success: `200` — `{ "error": false, "message": "Success", "data": { "id": "txn_1", "status": "completed", "amount": 1000 } }`
Error responses: `400` `Missing required parameter: transactionId`; `401`; `403`; `404` `Transaction not found`; `500` `Failed to retrieve transaction`.

---

## Payments

### POST `/mobile/api/payments/initiate-registration`
Description: Initiates an M-Pesa STK Push registration/subscription payment to a system "System Fees" wallet.
Auth: none
Request body:
```json
{ "phoneNumber": "0712345678", "amount": 500, "email": "user@example.com", "formData": { "companyName": "Acme Ltd", "plan": "premium" } }
```
Success: `200` — `{ "error": false, "message": "STK Push initiated", "data": { "checkoutRequestId": "ws_CO_...", "transactionId": "txn_1" } }`
Error responses: `400` `Phone number, amount, and form data are required`; `500` `<stkResponse.error>` / `Failed to initiate STK Push` / `<error.message>` / `Failed to initiate payment`.

### GET `/mobile/api/payments/status`
Description: Checks the status of a registration payment transaction by `checkoutRequestId`.
Auth: none
Query params: `checkoutRequestId` (required)
Success: `200` — `{ "error": false, "message": "Success", "data": { "status": "completed", "transactionId": "txn_1", "registrationStatus": null } }`

When not found: `{ "data": { "status": "not_found", "registrationStatus": null } }`.
Error responses: `400` `CheckoutRequestID is required`; `500` `Failed to check status`.

---

## Documents

> Legacy envelope: `{ "data": {...}, "message": "..." }` and errors `{ "error": "<message>" }`.

### GET `/mobile/api/documents`
Description: Lists paginated documents for the contractor's sites.
Auth: Bearer token + `documents:read`
Query params: `page` (default 1), `limit` (default 10), `search`, `siteId`
Success: `200`
```json
{ "data": [ { "id": "doc_1", "siteId": "site_1", "name": "Safety Plan.pdf", "type": "pdf", "fileUrl": "/uploads/safety-plan.pdf", "notes": null, "uploadedAt": "..." } ], "total": 1, "pagination": { "page": 1, "limit": 10, "pages": 1 } }
```
Error responses: `401` `{ "error": "Unauthorized" }`; `403` `{ "error": "Forbidden" }`; `404` `{ "error": "Site not found" }`; `500` `{ "error": "Failed to fetch documents" }`.

### POST `/mobile/api/documents`
Description: Uploads a single document or bulk-uploads an array of documents.
Auth: Bearer token + `documents:create`
Request body (single):
```json
{ "siteId": "site_1", "name": "Safety Plan.pdf", "type": "pdf", "fileUrl": "/uploads/safety-plan.pdf", "notes": "Updated plan" }
```
Request body (bulk): array of the above objects.
Success: `200/201` — `{ "data": { "id": "doc_1", ... }, "message": "Document uploaded" }`
Error responses: `400` `Site ID is required` / `Document name is required` / `File URL is required` / `Document type is required`; `401`; `403`; `404` `Site not found`; `500` `Failed to upload document`.

### GET `/mobile/api/documents/[id]`
Description: Fetches a single document.
Auth: Bearer token + `documents:read`
Path params: `id`
Success: `200` — `{ "data": { "id": "doc_1", "siteId": "site_1", "name": "Safety Plan.pdf", "type": "pdf", "fileUrl": "...", "notes": null, "uploadedAt": "...", "site": {...} } }`
Error responses: `401`; `403`; `404` `{ "error": "Document not found" }`; `500` `{ "error": "Failed to fetch document" }`.

### PUT `/mobile/api/documents/[id]`
Description: Updates a document's name, type, fileUrl, and notes.
Auth: Bearer token + `documents:update`
Path params: `id`
Request body:
```json
{ "name": "Safety Plan v2.pdf", "type": "pdf", "fileUrl": "/uploads/safety-plan-v2.pdf", "notes": "Revised" }
```
Success: `200` — `{ "data": {...}, "message": "Document updated" }`
Error responses: `401`; `403`; `404` `Document not found`; `500` `Failed to update document`.

### DELETE `/mobile/api/documents/[id]`
Description: Deletes a document by id.
Auth: Bearer token + `documents:delete`
Path params: `id`
Success: `200` — `{ "data": null, "message": "Document deleted" }`
Error responses: `401`; `403`; `404` `Document not found`; `500` `Failed to delete document`.

---

## Notifications

> Legacy envelope. See Documents note.

### GET `/mobile/api/notifications`
Description: Fetches up to 20 most recent notifications for the authenticated user.
Auth: Bearer token + `settings:read`
Success: `200` — `{ "data": [ { "id": "n_1", "userId": "u_1", "title": "Welcome", "message": "Hello", "isRead": false, "createdAt": "..." } ] }`
Error responses: `401`; `403`; `500` `Failed to fetch notifications`.

### PUT `/mobile/api/notifications`
Description: Marks a single notification as read/unread, or marks all unread as read when `id` equals `"all"`.
Auth: Bearer token + `settings:update`
Request body:
```json
{ "id": "n_1", "isRead": true }
```
or
```json
{ "id": "all", "isRead": true }
```
Success: `200` — `{ "data": null, "message": "Notification updated" }`
Error responses: `401`; `403`; `404` `Notification not found`; `500` `Failed to update notification`.

---

## Permissions

### GET `/mobile/api/permissions`
Description: Lists all permissions ordered by module then action.
Auth: Bearer token + `roles:read`
Success: `200` — `{ "data": [ { "id": "p_1", "module": "documents", "action": "read", "description": "View documents" } ] }`
Error responses: `401`; `403`; `500` `Failed to fetch permissions`.

---

## Roles

### GET `/mobile/api/roles`
Description: Lists roles scoped to the contractor (or all roles for superadmin), including permissions.
Auth: Bearer token + `roles:read`
Success: `200` — `{ "data": [ { "id": "r_1", "name": "Manager", "description": "Site manager", "scope": "contractor", "contractorId": "c_1", "permissions": [...] } ] }`
Error responses: `401`; `403`; `500` `Failed to fetch roles`.

### POST `/mobile/api/roles`
Description: Creates a new contractor-scoped role with attached permissions.
Auth: Bearer token + `roles:create` + contractor account
Request body:
```json
{ "name": "Manager", "description": "Site manager", "permissionIds": ["p_1", "p_2"] }
```
Success: `200/201` — `{ "data": { "id": "r_1", "name": "Manager", ... }, "message": "Role created" }`
Error responses: `400` `Role name is required`; `401`; `403`; `403` `Contractor account required`; `500` `Failed to create role`.

### GET `/mobile/api/roles/[id]`
Description: Fetches a single role by id, including permissions.
Auth: Bearer token + `roles:read`
Path params: `id`
Success: `200` — `{ "data": {...} }`
Error responses: `401`; `403`; `404` `Role not found`; `500` `Failed to fetch role`.

### PATCH `/mobile/api/roles/[id]`
Description: Updates a role's name, description, and permissions. System (platform) roles only editable by superadmin.
Auth: Bearer token + `roles:update`
Path params: `id`
Request body:
```json
{ "name": "Manager Pro", "description": "Updated", "permissionIds": ["p_1", "p_3"] }
```
Success: `200` — `{ "data": {...}, "message": "Role updated" }`
Error responses: `401`; `403` `Forbidden` / `Cannot edit system roles`; `404` `Role not found`; `500` `Failed to update role`.

### DELETE `/mobile/api/roles/[id]`
Description: Deletes a role by id. System roles only deletable by superadmin.
Auth: Bearer token + `roles:delete`
Path params: `id`
Success: `200` — `{ "data": null, "message": "Role deleted" }`
Error responses: `401`; `403` `Forbidden` / `Cannot delete system roles`; `404` `Role not found`; `500` `Failed to delete role`.

---

## Activity Logs

### GET `/mobile/api/activity-logs`
Description: Lists paginated activity logs for the contractor, optionally filtered by module.
Auth: Bearer token + `dashboard:read`
Query params: `module`, `page` (default 1), `limit` (default 50)
Success: `200`
```json
{ "data": [ { "id": "al_1", "userId": "u_1", "contractorId": "c_1", "action": "CREATE", "module": "DOCUMENTS", "description": "Uploaded document", "createdAt": "...", "user": { "name": "Jane", "email": "jane@example.com" } } ], "total": 1, "pagination": {...} }
```
Error responses: `401`; `403`; `500` `Failed to fetch activity logs`.

---

## Reports

### GET `/mobile/api/reports`
Description: Generates a consolidated contractor report (workers, inventory, equipment, purchase orders, payroll, safety, transactions, attendance, wallets).
Auth: Bearer token + `reports:read` + contractor account
Query params: `siteId`, `startDate`, `endDate`
Success: `200`
```json
{
  "data": {
    "overview": { "totalWorkers": 12, "activeWorkers": 10, "totalSites": 3, "totalInventory": 50, "totalEquipment": 8, "totalPurchaseOrders": 5, "pendingPurchaseOrders": 2, "totalPayrollPeriods": 4, "totalSafetyIncidents": 1 },
    "payroll": { "totalGrossPay": 500000, "totalNetPay": 450000, "totalDeductions": 50000, "periodCount": 4 },
    "inventoryByStatus": [ { "status": "in_stock", "count": 40 } ],
    "attendanceByStatus": [ { "status": "Present", "count": 100 } ],
    "purchaseOrdersByStatus": [ { "status": "pending", "count": 2, "totalValue": 25000 } ],
    "wallet": { "totalBalance": 100000, "walletCount": 2 },
    "recentTransactions": [ { "id": "t_1", "type": "credit", "amount": 1000, "description": "Top up", "status": "completed", "createdAt": "...", "walletName": "Main Wallet" } ]
  }
}
```
Error responses: `401`; `403`; `403` `Contractor account required`; `404` `Site not found`; `500` `Failed to generate report`.

---

## Upload

### POST `/mobile/api/upload`
Description: Uploads a file via multipart form data and saves it to `public/uploads`.
Auth: Bearer token + `documents:create`
Request headers: `Content-Type: multipart/form-data`
Form field: `file` (File)
Success: `200/201` — `{ "data": { "url": "/uploads/<timestamp>-<name>", "fileData": "/uploads/...", "fileName": "report.pdf", "fileType": "application/pdf" }, "message": "File uploaded" }`
Error responses: `400` `No file provided`; `401`; `403`; `500` `Failed to upload file`.

---

## Visitors

> Legacy envelope.

### GET `/mobile/api/visitors`
Description: Lists paginated visitors for the contractor's sites.
Auth: Bearer token + `visitors:read`
Query params: `page` (default 1), `limit` (default 10), `search`, `siteId`
Success: `200` — `{ "data": [ { "id": "v_1", "siteId": "site_1", "name": "John Doe", "company": "Acme", "purpose": "Inspection", "checkInTime": "...", "checkOutTime": null, "projectId": null } ], "total": 1, "pagination": {...} }`
Error responses: `401`; `403`; `404` `Site not found`; `500` `Failed to fetch visitors`.

### POST `/mobile/api/visitors`
Description: Checks in a new visitor at a contractor-owned site.
Auth: Bearer token + `visitors:create`
Request body:
```json
{ "siteId": "site_1", "name": "John Doe", "company": "Acme", "purpose": "Inspection", "checkInTime": "2026-07-20T09:00:00.000Z", "checkOutTime": null, "projectId": null }
```
Success: `200/201` — `{ "data": {...}, "message": "Visitor checked in" }`
Error responses: `400` `Site ID is required` / `Visitor name is required` / `Purpose is required`; `401`; `403`; `404` `Site not found`; `500` `Failed to create visitor`.

### GET `/mobile/api/visitors/[id]`
Description: Fetches a single visitor by id.
Auth: Bearer token + `visitors:read`
Path params: `id`
Success: `200` — `{ "data": { "id": "v_1", ..., "site": {...} } }`
Error responses: `401`; `403`; `404` `Visitor not found`; `500` `Failed to fetch visitor`.

### PUT `/mobile/api/visitors/[id]`
Description: Updates a visitor's name, company, purpose, check-out time, and project.
Auth: Bearer token + `visitors:update`
Path params: `id`
Request body:
```json
{ "name": "John Doe", "company": "Acme Ltd", "purpose": "Inspection", "checkOutTime": "2026-07-20T17:00:00.000Z", "projectId": "proj_1" }
```
Success: `200` — `{ "data": {...}, "message": "Visitor updated" }`
Error responses: `401`; `403`; `404` `Visitor not found`; `500` `Failed to update visitor`.

### DELETE `/mobile/api/visitors/[id]`
Description: Deletes a visitor by id.
Auth: Bearer token + `visitors:delete`
Path params: `id`
Success: `200` — `{ "data": null, "message": "Visitor deleted" }`
Error responses: `401`; `403`; `404` `Visitor not found`; `500` `Failed to delete visitor`.

---

## Safety Incidents

### GET `/mobile/api/safety-incidents`
Description: Lists safety incidents for the contractor's sites, optionally filtered by site.
Auth: Bearer token + `safety:read`
Query params: `siteId`
Success: `200` — `{ "data": [ { "id": "si_1", "siteId": "site_1", "title": "Slip", "description": "Minor slip", "type": "near_miss", "severity": "low", "status": "Reported", "incidentDate": "...", "reportedBy": "u_1", "attachments": null, "site": {...} } ] }`Error responses: `401` `{ "error": "Unauthorized" }`; `403` `{ "error": "Forbidden" }`; `500` `{ "error": "Failed to fetch safety incidents" }`.

### POST `/mobile/api/safety-incidents`
Description: Reports a new safety incident at a contractor-owned site. Sends a notification and logs activity.
Auth: Bearer token + `safety:create`
Request body:
```json
{ "siteId": "site_1", "title": "Slip", "description": "Minor slip on wet floor", "type": "near_miss", "severity": "low", "status": "Reported", "incidentDate": "2026-07-20T08:00:00.000Z", "reportedBy": "u_1", "attachments": ["/uploads/slip.jpg"] }
```
Success: `200/201` — `{ "data": { "id": "si_1", ..., "site": {...} }, "message": "Safety incident reported" }`
Error responses: `400` `siteId is required` / `Site not found`; `401`; `403` `Forbidden` / `Access denied`; `500` `Failed to create safety incident`.

### GET `/mobile/api/safety-incidents/[id]`
Description: Fetches a single safety incident by id.
Auth: Bearer token + `safety:read`
Path params: `id`
Success: `200` — `{ "data": { "id": "si_1", ..., "site": {...} } }`
Error responses: `401`; `403`; `404` `Incident not found`; `500` `Failed to fetch incident`.

### PUT `/mobile/api/safety-incidents/[id]`
Description: Updates a safety incident's details.
Auth: Bearer token + `safety:update`
Path params: `id`
Request body:
```json
{ "title": "Slip Updated", "description": "Minor slip, revised", "type": "near_miss", "severity": "medium", "status": "Investigating", "incidentDate": "2026-07-20T08:00:00.000Z", "reportedBy": "u_1", "attachments": ["/uploads/slip.jpg"] }
```
Success: `200` — `{ "data": {...}, "message": "Incident updated" }`
Error responses: `401`; `403`; `404` `Incident not found`; `500` `Failed to update incident`.

### DELETE `/mobile/api/safety-incidents/[id]`
Description: Deletes a safety incident by id.
Auth: Bearer token + `safety:delete`
Path params: `id`
Success: `200` — `{ "data": null, "message": "Incident deleted" }`
Error responses: `401`; `403`; `404` `Incident not found`; `500` `Failed to delete incident`.

---

## Licenses

### GET `/mobile/api/licenses`
Description: Lists paginated licenses for the contractor's sites.
Auth: Bearer token + `licenses:read`
Query params: `page` (default 1), `limit` (default 10), `search`, `siteId`
Success: `200`
```json
{ "data": [ { "id": "l_1", "siteId": "site_1", "name": "Trade License", "licenseNumber": "TL-001", "issuingAuthority": "NCA", "issueDate": "2025-01-01T00:00:00.000Z", "expiryDate": "2026-12-31T00:00:00.000Z", "type": "trade", "category": "A", "status": "active", "fileName": null, "fileData": null } ], "total": 1, "pagination": { "page": 1, "limit": 10, "pages": 1 } }
```
Error responses: `401`; `403`; `404` `Site not found`; `500` `Failed to fetch licenses`.

### POST `/mobile/api/licenses`
Description: Creates a new license (optionally attached to a contractor-owned site); runs an immediate expiry check.
Auth: Bearer token + `licenses:create`
Request body:
```json
{ "siteId": "site_1", "name": "Trade License", "licenseNumber": "TL-001", "issuingAuthority": "NCA", "issueDate": "2025-01-01", "expiryDate": "2026-12-31", "type": "trade", "category": "A", "status": "active", "fileName": "tl.pdf", "fileData": "/uploads/tl.pdf" }
```
Success: `200/201` — `{ "data": {...}, "message": "License created" }`
Error responses: `400` `License name is required` / `License number is required`; `401`; `403`; `404` `Site not found`; `500` `Failed to create license`.

### GET `/mobile/api/licenses/[id]`
Description: Fetches a single license by id.
Auth: Bearer token + `licenses:read`
Path params: `id`
Success: `200` — `{ "data": { "id": "l_1", ..., "site": {...} } }`
Error responses: `401`; `403`; `404` `License not found`; `500` `Failed to fetch license`.

### PATCH `/mobile/api/licenses/[id]`
Description: Updates a license's details and runs an immediate expiry check.
Auth: Bearer token + `licenses:update`
Path params: `id`
Request body:
```json
{ "name": "Trade License", "licenseNumber": "TL-001", "issuingAuthority": "NCA", "issueDate": "2025-01-01", "expiryDate": "2026-12-31", "type": "trade", "category": "A", "status": "active", "notes": "Renewed" }
```
Success: `200` — `{ "data": {...}, "message": "License updated" }`
Error responses: `401`; `403`; `404` `License not found`; `500` `Failed to update license`.

### DELETE `/mobile/api/licenses/[id]`
Description: Deletes a license by id.
Auth: Bearer token + `licenses:delete`
Path params: `id`
Success: `200` — `{ "data": null, "message": "License deleted" }`
Error responses: `401`; `403`; `404` `License not found`; `500` `Failed to delete license`.

### GET `/mobile/api/licenses/check-expiry`
Description: Runs the license expiry check job.
Auth: `x-cron-secret` header equal to `CRON_SECRET` env var, OR superadmin Bearer token
Request headers: `x-cron-secret: <secret>` OR `Authorization: Bearer <token>`
Success: `200` — `{ "data": { "checked": 12, "notified": 3 } }`
Error responses: `401`; `403`; `500` `License expiry check failed`.

---

## Team

### GET `/mobile/api/team`
Description: Lists paginated team members for the contractor, including role permissions and site.
Auth: Bearer token + `team:read`
Query params: `page` (default 1), `limit` (default 10), `search`
Success: `200`
```json
{ "data": [ { "id": "tm_1", "contractorId": "c_1", "userId": "u_1", "name": "Jane Doe", "role": "Manager", "email": "jane@example.com", "phone": "0700000000", "status": "Active", "siteId": "site_1", "roleId": "r_1", "roleRelation": { "id": "r_1", "name": "Manager", "permissions": [...] }, "site": {...} } ], "total": 1, "pagination": {...} }
```
Error responses: `401`; `403`; `500` `Failed to fetch team members`.

### POST `/mobile/api/team`
Description: Creates a team member, optionally creating a linked user account and sending a welcome email.
Auth: Bearer token + `team:create`
Request body:
```json
{ "name": "Jane Doe", "email": "jane@example.com", "phone": "0700000000", "role": "Manager", "roleId": "r_1", "status": "Active", "siteId": "site_1", "password": "TempPass123!" }
```
Success: `200/201` — `{ "data": {...}, "message": "Team member created" }`
Error responses: `400` `Name is required` / `Invalid site`; `401`; `403`; `500` `Failed to create team member`.

### GET `/mobile/api/team/[id]`
Description: Fetches a single team member by id.
Auth: Bearer token + `team:read`
Path params: `id`
Success: `200` — `{ "data": {...} }`
Error responses: `401`; `403`; `404` `Team member not found`; `500` `Failed to fetch team member`.

### PATCH `/mobile/api/team/[id]`
Description: Updates a team member and synchronously updates the linked user account.
Auth: Bearer token + `team:update`
Path params: `id`
Request body:
```json
{ "name": "Jane Doe", "role": "Senior Manager", "roleId": "r_2", "email": "jane@example.com", "phone": "0711111111", "status": "Active", "siteId": "site_2" }
```
Success: `200` — `{ "data": {...}, "message": "Team member updated" }`
Error responses: `401`; `403`; `404` `Team member not found`; `500` `Failed to update team member`.

### DELETE `/mobile/api/team/[id]`
Description: Deletes a team member and the linked user account if one exists.
Auth: Bearer token + `team:delete`
Path params: `id`
Success: `200` — `{ "data": null, "message": "Team member deleted" }`
Error responses: `401`; `403`; `404` `Team member not found`; `500` `Failed to delete team member`.

---

## Tasks

### GET `/mobile/api/tasks`
Description: Lists tasks for the contractor's sites, optionally filtered by site.
Auth: Bearer token + `tasks:read`
Query params: `siteId`
Success: `200` — `{ "data": [ { "id": "t_1", "siteId": "site_1", "title": "Install signage", "description": "Install safety signage", "status": "pending", "priority": "medium", "dueDate": "2026-08-01T00:00:00.000Z", "createdAt": "...", "site": {...} } ] }`
Error responses: `401`; `403`; `404` `Site not found`; `500` `Failed to fetch tasks`.

### POST `/mobile/api/tasks`
Description: Creates a new task for a contractor-owned site.
Auth: Bearer token + `tasks:create`
Request body:
```json
{ "siteId": "site_1", "title": "Install signage", "description": "Install safety signage", "status": "pending", "priority": "medium", "dueDate": "2026-08-01" }
```
Success: `200/201` — `{ "data": {...}, "message": "Task created" }`
Error responses: `400` `Site ID is required`; `401`; `403`; `404` `Site not found`; `500` `Failed to create task`.

### GET `/mobile/api/tasks/[id]`
Description: Fetches a single task by id, including project and site.
Auth: Bearer token + `tasks:read`
Path params: `id`
Success: `200` — `{ "data": { "id": "t_1", ..., "project": {...}, "site": {...} } }`
Error responses: `401`; `403`; `404` `Task not found`; `500` `Failed to fetch task`.

### PUT `/mobile/api/tasks/[id]`
Description: Updates a task (body spread onto the task record; `dueDate` parsed as Date).
Auth: Bearer token + `tasks:update`
Path params: `id`
Request body:
```json
{ "title": "Install signage", "description": "Updated scope", "status": "in-progress", "priority": "high", "dueDate": "2026-08-15" }
```
Success: `200` — `{ "data": {...}, "message": "Task updated" }`
Error responses: `401`; `403`; `404` `Task not found`; `500` `Failed to update task`.

### DELETE `/mobile/api/tasks/[id]`
Description: Deletes a task by id.
Auth: Bearer token + `tasks:delete`
Path params: `id`
Success: `200` — `{ "data": null, "message": "Task deleted" }`
Error responses: `401`; `403`; `404` `Task not found`; `500` `Failed to delete task`.

---

## Contractor Dashboard

### GET `/mobile/api/contractor/dashboard`
Description: Fetches aggregated contractor dashboard stats, optionally scoped to a single site.
Auth: Bearer token + `dashboard:read` + contractor account
Query params: `siteId`
Success: `200`
```json
{
  "data": {
    "stats": { "totalWorkers": 12, "workersPresentToday": 10, "totalEquipment": 8, "totalInventory": 50, "totalPurchaseOrders": 5, "pendingPurchaseOrders": 2, "activeTasks": 3, "totalSites": 3, "safetyIncidents": 1, "monthlyCredits": 200000, "monthlyDebits": 50000, "walletBalance": 150000 },
    "recentActivityLogs": [ { "id": "al_1", "user": { "name": "Jane" }, "action": "CREATE", "module": "DOCUMENTS", "description": "Uploaded document", "createdAt": "..." } ],
    "attendanceData": [ { "date": "Mon 20 Jul", "totalHours": 80, "overtimeHours": 5, "avgHours": 8, "workersPresent": 10 } ],
    "poSummary": [ { "status": "pending", "count": 2, "totalValue": 25000 } ],
    "inventoryByStatus": [ { "status": "in_stock", "count": 40 } ],
    "siteId": "site_1"
  }
}
```
Error responses: `401`; `403`; `403` `Contractor account required`; `404` `Site not found`; `500` `Failed to fetch dashboard data`.

---

## Subscription Plans

### GET `/mobile/api/subscription-plans`
Description: Lists all subscription plans ordered by price ascending.
Auth: Bearer token + `settings:read`
Success: `200` — `{ "data": [ { "id": "sp_1", "name": "Basic", "price": 1000, "maxSites": 1, "maxTeamMembers": 5, "features": "..." } ] }`
Error responses: `401`; `403`; `500` `Failed to fetch plans`.

### POST `/mobile/api/subscription-plans`
Description: Creates a new subscription plan.
Auth: Bearer token + `settings:manage`
Request body:
```json
{ "name": "Basic", "price": 1000, "maxTeamMembers": 5, "features": [ "workers", "inventory" ] }
```
Success: `200/201` — `{ "data": {...}, "message": "Plan created" }`
Error responses: `401`; `403`; `500` `Failed to create plan`.

---

## Superadmin

> All Superadmin endpoints require a superadmin Bearer token.

### GET `/mobile/api/superadmin/dashboard`
Description: Fetches superadmin dashboard stats including revenue, contractors, active subscriptions, plan distribution, and recent transactions.
Query params: `months` (default 6)
Success: `200`
```json
{
  "data": {
    "stats": { "totalRevenue": 1000000, "revenueTrend": 12.5, "totalContractors": 50, "contractorsTrend": 8.3, "activeSubscriptions": 45, "subscriptionsTrend": 12.1, "totalPlans": 4, "totalWorkers": 600, "totalSites": 120 },
    "recentTransactions": [ { "id": "t_1", "name": "Acme Ltd", "amount": "KES 10,000", "method": "M-Pesa", "status": "Completed", "date": "7/20/2026" } ],
    "planSalesData": [ { "name": "Basic", "value": 40, "color": "#10b981" } ]
  }
}
```
Error responses: `401`; `403`; `500` `Failed to fetch dashboard data`.

### GET `/mobile/api/superadmin/contractors`
Description: Lists paginated contractors with their user and subscription plan, newest first.
Query params: `page` (default 1), `limit` (default 10)
Success: `200` — `{ "data": [...], "total": 1, "pagination": {...} }`
Error responses: `401`; `403`; `500` `Failed to fetch contractors`.

### POST `/mobile/api/superadmin/contractors`
Description: Creates a new contractor with a linked user account, a Contractor Admin role granting all permissions, and an assigned subscription plan.
Request body:
```json
{ "name": "John Smith", "email": "john@acme.com", "companyName": "Acme Ltd", "location": "Nairobi", "phoneNumber": "0700000000", "licenseNo": "LIC-1", "subscriptionPlanId": "sp_1", "password": "TempPass123!" }
```
Success: `200/201` — `{ "data": {...}, "message": "Contractor created" }`
Error responses: `400` `Subscription plan is mandatory` / `A user with this email address already exists`; `401`; `403`; `500` `Failed to create contractor`.

### GET `/mobile/api/superadmin/contractors/[id]`
Description: Fetches a single contractor by id with user, plan, employees, projects, invoices, and wallets.
Path params: `id`
Success: `200` — `{ "data": { "id": "c_1", ..., "user": {...}, "subscriptionPlan": {...}, "employees": [], "projects": [], "invoices": [], "wallets": [] } }`
Error responses: `401`; `403`; `404` `Contractor not found`; `500` `Failed to fetch contractor`.

### PATCH `/mobile/api/superadmin/contractors/[id]`
Description: Updates a contractor's company fields, subscription plan, and linked user name/email.
Path params: `id`
Request body:
```json
{ "companyName": "Acme Ltd", "location": "Mombasa", "phoneNumber": "0711111111", "licenseNo": "LIC-2", "subscriptionPlanId": "sp_2", "name": "John S", "email": "john@acme.co" }
```
Success: `200` — `{ "data": {...}, "message": "Contractor updated" }`
Error responses: `401`; `403`; `500` `Failed to update contractor`.

### DELETE `/mobile/api/superadmin/contractors/[id]`
Description: Deletes a contractor and its linked user account.
Path params: `id`
Success: `200` — `{ "data": null, "message": "Contractor deleted" }`
Error responses: `401`; `403`; `404` `Contractor not found`; `500` `Failed to delete contractor`.

### GET `/mobile/api/superadmin/admins`
Description: Lists all superadmin users, newest first.
Success: `200` — `{ "data": [ { "id": "u_1", "name": "Root Admin", "email": "admin@example.com", "role": "superadmin", "createdAt": "..." } ] }`
Error responses: `401`; `403`; `500` `Failed to fetch admins`.

### POST `/mobile/api/superadmin/admins`
Description: Creates a new superadmin user. Password defaults to a random hex string if not supplied.
Request body:
```json
{ "name": "New Admin", "email": "newadmin@example.com", "password": "AdminPass123!" }
```
Success: `200/201` — `{ "data": { "id": "u_2", "name": "New Admin", "email": "...", "role": "superadmin" }, "message": "Admin created" }`
Error responses: `401`; `403`; `500` `Failed to create admin`.

### PATCH `/mobile/api/superadmin/admins/[id]`
Description: Updates a superadmin's name, email, and optionally password.
Path params: `id`
Request body:
```json
{ "name": "Updated Admin", "email": "admin@example.com", "password": "NewPass123!" }
```
Success: `200` — `{ "data": {...}, "message": "Admin updated" }`
Error responses: `401`; `403`; `500` `Failed to update admin`.

### DELETE `/mobile/api/superadmin/admins/[id]`
Description: Deletes a superadmin user by id.
Path params: `id`
Success: `200` — `{ "data": null, "message": "Admin deleted" }`
Error responses: `401`; `403`; `500` `Failed to delete admin`.

### GET `/mobile/api/superadmin/plans`
Description: Lists all subscription plans with contractor counts, ordered by price ascending.
Success: `200` — `{ "data": [ { "id": "sp_1", "name": "Basic", "price": 1000, "maxSites": 1, "maxTeamMembers": 5, "features": "...", "isActive": true, "_count": { "contractors": 10 } } ] }`
Error responses: `401`; `403`; `500` `Failed to fetch plans`.

### POST `/mobile/api/superadmin/plans`
Description: Creates a new subscription plan.
Request body:
```json
{ "name": "Basic", "price": "1000", "maxTeamMembers": "5", "features": [ "workers", "inventory" ], "isActive": true }
```
Success: `200/201` — `{ "data": {...}, "message": "Plan created" }`
Error responses: `401`; `403`; `409` `A plan with this name already exists`; `500` `Failed to create plan`.

### PATCH `/mobile/api/superadmin/plans/[id]`
Description: Updates fields of a subscription plan.
Path params: `id`
Request body:
```json
{ "name": "Basic Plus", "price": "1500", "maxTeamMembers": "10", "features": [ "workers", "inventory", "safety" ], "isActive": true }
```
Success: `200` — `{ "data": {...}, "message": "Plan updated" }`
Error responses: `401`; `403`; `409` `A plan with this name already exists`; `500` `Failed to update plan`.

### DELETE `/mobile/api/superadmin/plans/[id]`
Description: Deletes a subscription plan if no contractors are using it.
Path params: `id`
Success: `200` — `{ "data": null, "message": "Plan deleted" }`
Error responses: `400` `Cannot delete plan as it is currently being used by contractors. Try deactivating it instead.`; `401`; `403`; `500` `Failed to delete plan`.

### GET `/mobile/api/superadmin/subscriptions`
Description: Lists all contractors with their subscription plan and user details, ordered by most recently updated.
Success: `200` — `{ "data": [ { "id": "c_1", "companyName": "Acme Ltd", "subscriptionPlan": {...}, "updatedAt": "...", "user": {...} } ] }`
Error responses: `401`; `403`; `500` `Failed to fetch subscriptions`.

### PATCH `/mobile/api/superadmin/subscriptions`
Description: Updates a contractor's assigned subscription plan.
Request body:
```json
{ "contractorId": "c_1", "planId": "sp_2" }
```
Success: `200` — `{ "data": { "id": "c_1", ..., "subscriptionPlan": {...} }, "message": "Subscription updated" }`
Error responses: `401`; `403`; `500` `Failed to update subscription`.

### GET `/mobile/api/superadmin/transactions`
Description: Lists all transactions with their associated wallet, newest first.
Success: `200` — `{ "data": [ { "id": "t_1", "walletId": "w_1", "amount": 1000, "type": "credit", "description": "Top up", "referenceNumber": "REF-1", "status": "completed", "createdAt": "...", "wallet": {...} } ] }`
Error responses: `401`; `403`; `500` `Failed to fetch transactions`.

### POST `/mobile/api/superadmin/transactions`
Description: Creates a transaction and, if completed, adjusts the wallet balance accordingly.
Request body:
```json
{ "walletId": "w_1", "amount": "1000", "type": "credit", "description": "Top up", "referenceNumber": "REF-1", "status": "completed" }
```
Success: `200/201` — `{ "data": {...}, "message": "Transaction created" }`
Error responses: `401`; `403`; `500` `Failed to create transaction`.

---

## Config

### GET `/mobile/api/config`
Description: Returns static mobile app configuration (enums, currency, and app version metadata). Intended to be called at app startup before authentication.
Auth: none
Success response: `200`
```json
{
  "error": false,
  "message": "Success",
  "data": {
    "purchase_order_priorities": [
      { "id": 1, "name": "High",   "color": "#F44336", "description": "High priority" },
      { "id": 2, "name": "Medium", "color": "#FFC107", "description": "Medium priority" },
      { "id": 3, "name": "Low",    "color": "#4CAF50", "description": "Low priority" }
    ],
    "machine_types":   [ { "key": "heavy", "value": "Heavy" }, { "key": "light", "value": "Light" } ],
    "machine_conditions": [ { "key": "new",      "value": "New" },
                            { "key": "used",     "value": "Used" },
                            { "key": "damaged",  "value": "Damaged" } ],
    "license_types":   [ { "key": "medical", "value": "Medical" } ],
    "wallet_transaction_types": [ { "key": "credit", "value": "Credit" },
                                   { "key": "debit",  "value": "Debit" } ],
    "activity_log_types": [ { "key": "create", "value": "Create" },
                            { "key": "update", "value": "Update" },
                            { "key": "delete", "value": "Delete" } ],
    "currency": {
      "full_form": "Kenyan Shilling",
      "symbol": "KSh",
      "code": "KES",
      "symbol_position": "before",
      "format": "comma_separated",
      "decimal_points": "2"
    },
    "mobile_app_version": {
      "current_version": "1.0.2",
      "minimum_supported_version": "1.0.0",
      "force_update_version": null,
      "update_url": "",
      "release_notes": "",
      "update_required": false,
      "platform": "both"
    }
  }
}
```
Error responses: `500` `{ "error": true, "message": "Failed to fetch config" }`
