// Generates a complete Postman v2.1 collection for the ReconSMI Mobile API.
// Run: node scripts/generate-mobile-postman.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const BASE = 'mobile/api';

// each endpoint: { name, method, segs:[...path segments using {{var}}], query:[{k,v}], body:obj|null, auth:true|false, perm:'' }
const folders = [
  {
    name: 'Auth',
    items: [
      { name: 'Login (stores tokens)', method: 'POST', segs: ['auth','login'], query: [], body: { email: 'admin@example.com', password: 'password123' }, auth: false, perm: 'public' },
      { name: 'Refresh Token', method: 'POST', segs: ['auth','refresh'], query: [], body: { refreshToken: '{{refreshToken}}' }, auth: false, perm: 'public' },
      { name: 'Get Current User (me)', method: 'GET', segs: ['auth','me'], query: [], body: null, auth: true, perm: 'authenticated' },
      { name: 'Logout', method: 'POST', segs: ['auth','logout'], query: [], body: null, auth: true, perm: 'authenticated' },
      { name: 'Change Password', method: 'POST', segs: ['auth','change-password'], query: [], body: { currentPassword: 'password123', newPassword: 'newpassword123' }, auth: true, perm: 'authenticated' },
      { name: 'Forgot Password', method: 'POST', segs: ['auth','forgot-password'], query: [], body: { email: 'admin@example.com' }, auth: false, perm: 'public' },
      { name: 'Reset Password', method: 'POST', segs: ['auth','reset-password'], query: [], body: { token: '{{resetToken}}', password: 'newpassword123' }, auth: false, perm: 'public' },
      { name: 'Select Site', method: 'POST', segs: ['auth','select-site'], query: [], body: { siteId: '{{siteId}}' }, auth: true, perm: 'authenticated' },
    ],
  },
  {
    name: 'Workers',
    items: [
      { name: 'List Workers', method: 'GET', segs: ['workers'], query: [{ k: 'page', v: '1' }, { k: 'limit', v: '20' }, { k: 'search', v: '' }], body: null, auth: true, perm: 'workers:read' },
      { name: 'Create Worker', method: 'POST', segs: ['workers'], query: [], body: { name: 'John Doe', email: 'john@example.com', phone: '0700000000', nationalId: '12345678', designationId: '{{designationId}}', shiftId: '{{shiftId}}', paymentMode: 'manual', status: 'Active' }, auth: true, perm: 'workers:create' },
      { name: 'Get Worker', method: 'GET', segs: ['workers','{{id}}'], query: [], body: null, auth: true, perm: 'workers:read' },
      { name: 'Update Worker', method: 'PUT', segs: ['workers','{{id}}'], query: [], body: { name: 'John Doe Updated', phone: '0711111111', status: 'Active' }, auth: true, perm: 'workers:update' },
      { name: 'Delete Worker', method: 'DELETE', segs: ['workers','{{id}}'], query: [], body: null, auth: true, perm: 'workers:delete' },
    ],
  },
  {
    name: 'Attendance',
    items: [
      { name: 'List Attendance', method: 'GET', segs: ['attendance'], query: [{ k: 'workerId', v: '{{id}}' }, { k: 'date', v: '' }, { k: 'startDate', v: '' }, { k: 'endDate', v: '' }], body: null, auth: true, perm: 'attendance:read' },
      { name: 'Clock In / Out', method: 'POST', segs: ['attendance'], query: [], body: { workerId: '{{id}}', type: 'CLOCK_IN', notes: '' }, auth: true, perm: 'attendance:create' },
      { name: 'Biometric Punch', method: 'POST', segs: ['attendance','biometric'], query: [], body: { enrollId: '1', deviceId: 'device-1' }, auth: true, perm: 'attendance:create' },
    ],
  },
  {
    name: 'Projects',
    items: [
      { name: 'List Projects', method: 'GET', segs: ['projects'], query: [{ k: 'page', v: '1' }, { k: 'limit', v: '10' }, { k: 'search', v: '' }], body: null, auth: true, perm: 'projects:read' },
      { name: 'Create Project', method: 'POST', segs: ['projects'], query: [], body: { name: 'Site A', location: 'Nairobi', description: 'New build', status: 'planning' }, auth: true, perm: 'projects:create' },
      { name: 'Get Project', method: 'GET', segs: ['projects','{{id}}'], query: [], body: null, auth: true, perm: 'projects:read' },
      { name: 'Update Project', method: 'PUT', segs: ['projects','{{id}}'], query: [], body: { name: 'Site A Updated', status: 'active' }, auth: true, perm: 'projects:update' },
      { name: 'Delete Project', method: 'DELETE', segs: ['projects','{{id}}'], query: [], body: null, auth: true, perm: 'projects:delete' },
    ],
  },
  {
    name: 'Sites',
    items: [
      { name: 'List Sites', method: 'GET', segs: ['sites'], query: [{ k: 'page', v: '1' }, { k: 'limit', v: '10' }, { k: 'search', v: '' }], body: null, auth: true, perm: 'sites:read' },
      { name: 'Create Site', method: 'POST', segs: ['sites'], query: [], body: { name: 'Main Site', location: 'Nairobi', isPrimary: true }, auth: true, perm: 'sites:create' },
      { name: 'Check Onboarding', method: 'GET', segs: ['sites','check-onboarding'], query: [], body: null, auth: true, perm: 'authenticated' },
      { name: 'Get Site', method: 'GET', segs: ['sites','{{id}}'], query: [], body: null, auth: true, perm: 'sites:read' },
      { name: 'Update Site', method: 'PUT', segs: ['sites','{{id}}'], query: [], body: { name: 'Main Site Updated', isPrimary: false }, auth: true, perm: 'sites:update' },
      { name: 'Delete Site', method: 'DELETE', segs: ['sites','{{id}}'], query: [], body: null, auth: true, perm: 'sites:delete' },
    ],
  },
  {
    name: 'Tasks',
    items: [
      { name: 'List Tasks', method: 'GET', segs: ['tasks'], query: [{ k: 'page', v: '1' }, { k: 'limit', v: '20' }], body: null, auth: true, perm: 'tasks:read' },
      { name: 'Create Task', method: 'POST', segs: ['tasks'], query: [], body: { title: 'Pour concrete', siteId: '{{siteId}}', status: 'pending', priority: 'high' }, auth: true, perm: 'tasks:create' },
      { name: 'Get Task', method: 'GET', segs: ['tasks','{{id}}'], query: [], body: null, auth: true, perm: 'tasks:read' },
      { name: 'Update Task', method: 'PUT', segs: ['tasks','{{id}}'], query: [], body: { status: 'in_progress', priority: 'medium' }, auth: true, perm: 'tasks:update' },
      { name: 'Delete Task', method: 'DELETE', segs: ['tasks','{{id}}'], query: [], body: null, auth: true, perm: 'tasks:delete' },
    ],
  },
  {
    name: 'Team',
    items: [
      { name: 'List Team', method: 'GET', segs: ['team'], query: [], body: null, auth: true, perm: 'team:read' },
      { name: 'Create Team Member', method: 'POST', segs: ['team'], query: [], body: { name: 'Jane', email: 'jane@example.com', phone: '0700000000', roleId: '{{roleId}}' }, auth: true, perm: 'team:create' },
      { name: 'Get Team Member', method: 'GET', segs: ['team','{{id}}'], query: [], body: null, auth: true, perm: 'team:read' },
      { name: 'Update Team Member', method: 'PATCH', segs: ['team','{{id}}'], query: [], body: { name: 'Jane Updated' }, auth: true, perm: 'team:update' },
      { name: 'Delete Team Member', method: 'DELETE', segs: ['team','{{id}}'], query: [], body: null, auth: true, perm: 'team:delete' },
    ],
  },
  {
    name: 'Inventory',
    items: [
      { name: 'List Inventory', method: 'GET', segs: ['inventory'], query: [{ k: 'page', v: '1' }, { k: 'limit', v: '20' }], body: null, auth: true, perm: 'inventory:read' },
      { name: 'Create Inventory Item', method: 'POST', segs: ['inventory'], query: [], body: { name: 'Cement', quantity: 100, siteId: '{{siteId}}' }, auth: true, perm: 'inventory:create' },
      { name: 'Import Inventory', method: 'POST', segs: ['inventory','import'], query: [], body: { rows: [] }, auth: true, perm: 'inventory:create' },
      { name: 'List Categories', method: 'GET', segs: ['inventory','categories'], query: [], body: null, auth: true, perm: 'inventory:read' },
      { name: 'Create Category', method: 'POST', segs: ['inventory','categories'], query: [], body: { name: 'Building Materials' }, auth: true, perm: 'inventory:create' },
      { name: 'Import Categories', method: 'POST', segs: ['inventory','categories','import'], query: [], body: { rows: [] }, auth: true, perm: 'inventory:create' },
      { name: 'Get Category', method: 'GET', segs: ['inventory','categories','{{id}}'], query: [], body: null, auth: true, perm: 'inventory:read' },
      { name: 'Update Category', method: 'PATCH', segs: ['inventory','categories','{{id}}'], query: [], body: { name: 'Materials' }, auth: true, perm: 'inventory:update' },
      { name: 'Delete Category', method: 'DELETE', segs: ['inventory','categories','{{id}}'], query: [], body: null, auth: true, perm: 'inventory:delete' },
      { name: 'Get Inventory Item', method: 'GET', segs: ['inventory','{{id}}'], query: [], body: null, auth: true, perm: 'inventory:read' },
      { name: 'Update Inventory Item', method: 'PATCH', segs: ['inventory','{{id}}'], query: [], body: { quantity: 150 }, auth: true, perm: 'inventory:update' },
      { name: 'Delete Inventory Item', method: 'DELETE', segs: ['inventory','{{id}}'], query: [], body: null, auth: true, perm: 'inventory:delete' },
      { name: 'Stock In', method: 'POST', segs: ['inventory','{{id}}','stock-in'], query: [], body: { quantity: 50, notes: 'Restock' }, auth: true, perm: 'inventory:update' },
      { name: 'Record Usage', method: 'POST', segs: ['inventory','{{id}}','usage'], query: [], body: { quantity: 10, notes: 'Used' }, auth: true, perm: 'inventory:update' },
      { name: 'List Transfers', method: 'GET', segs: ['inventory','{{id}}','transfers'], query: [], body: null, auth: true, perm: 'inventory:read' },
      { name: 'Create Transfer', method: 'POST', segs: ['inventory','{{id}}','transfers'], query: [], body: { toSiteId: '{{siteId}}', quantity: 5 }, auth: true, perm: 'inventory:create' },
      { name: 'Update Transfer', method: 'PATCH', segs: ['inventory','{{id}}','transfers','{{transferId}}'], query: [], body: { status: 'completed' }, auth: true, perm: 'inventory:update' },
    ],
  },
  {
    name: 'Equipment',
    items: [
      { name: 'List Equipment', method: 'GET', segs: ['equipment'], query: [{ k: 'page', v: '1' }, { k: 'limit', v: '20' }], body: null, auth: true, perm: 'equipment:read' },
      { name: 'Create Equipment', method: 'POST', segs: ['equipment'], query: [], body: { name: 'Excavator', siteId: '{{siteId}}', status: 'Active' }, auth: true, perm: 'equipment:create' },
      { name: 'Import Equipment', method: 'POST', segs: ['equipment','import'], query: [], body: { rows: [] }, auth: true, perm: 'equipment:create' },
      { name: 'Get Equipment', method: 'GET', segs: ['equipment','{{id}}'], query: [], body: null, auth: true, perm: 'equipment:read' },
      { name: 'Update Equipment', method: 'PATCH', segs: ['equipment','{{id}}'], query: [], body: { status: 'Under Maintenance' }, auth: true, perm: 'equipment:update' },
      { name: 'Delete Equipment', method: 'DELETE', segs: ['equipment','{{id}}'], query: [], body: null, auth: true, perm: 'equipment:delete' },
    ],
  },
  {
    name: 'Purchase Orders',
    items: [
      { name: 'List Purchase Orders', method: 'GET', segs: ['purchase-orders'], query: [{ k: 'page', v: '1' }, { k: 'limit', v: '20' }], body: null, auth: true, perm: 'purchase_orders:read' },
      { name: 'Create Purchase Order', method: 'POST', segs: ['purchase-orders'], query: [], body: { supplierId: '{{id}}', siteId: '{{siteId}}', items: [] }, auth: true, perm: 'purchase_orders:create' },
      { name: 'Get Purchase Order', method: 'GET', segs: ['purchase-orders','{{id}}'], query: [], body: null, auth: true, perm: 'purchase_orders:read' },
      { name: 'Update Purchase Order', method: 'PATCH', segs: ['purchase-orders','{{id}}'], query: [], body: { status: 'approved' }, auth: true, perm: 'purchase_orders:update' },
      { name: 'Delete Purchase Order', method: 'DELETE', segs: ['purchase-orders','{{id}}'], query: [], body: null, auth: true, perm: 'purchase_orders:delete' },
      { name: 'Receive Purchase Order', method: 'POST', segs: ['purchase-orders','{{id}}','receive'], query: [], body: { items: [] }, auth: true, perm: 'purchase_orders:update' },
      { name: 'Download Purchase Order PDF', method: 'GET', segs: ['purchase-orders','{{id}}','pdf'], query: [], body: null, auth: true, perm: 'purchase_orders:read' },
    ],
  },
  {
    name: 'Suppliers',
    items: [
      { name: 'List Suppliers', method: 'GET', segs: ['suppliers'], query: [], body: null, auth: true, perm: 'suppliers:read' },
      { name: 'Create Supplier', method: 'POST', segs: ['suppliers'], query: [], body: { name: 'Acme Ltd', phone: '0700000000', email: 'acme@example.com' }, auth: true, perm: 'suppliers:create' },
      { name: 'Get Supplier', method: 'GET', segs: ['suppliers','{{id}}'], query: [], body: null, auth: true, perm: 'suppliers:read' },
      { name: 'Update Supplier', method: 'PATCH', segs: ['suppliers','{{id}}'], query: [], body: { name: 'Acme Ltd Updated' }, auth: true, perm: 'suppliers:update' },
      { name: 'Delete Supplier', method: 'DELETE', segs: ['suppliers','{{id}}'], query: [], body: null, auth: true, perm: 'suppliers:delete' },
    ],
  },
  {
    name: 'Materials',
    items: [
      { name: 'List Materials', method: 'GET', segs: ['materials'], query: [], body: null, auth: true, perm: 'materials:read' },
      { name: 'Create Material', method: 'POST', segs: ['materials'], query: [], body: { name: 'Sand', unit: 'tonne' }, auth: true, perm: 'materials:create' },
    ],
  },
  {
    name: 'Designations',
    items: [
      { name: 'List Designations', method: 'GET', segs: ['designations'], query: [], body: null, auth: true, perm: 'designations:read' },
      { name: 'Create Designation', method: 'POST', segs: ['designations'], query: [], body: { title: 'Mason' }, auth: true, perm: 'designations:create' },
      { name: 'Get Designation', method: 'GET', segs: ['designations','{{id}}'], query: [], body: null, auth: true, perm: 'designations:read' },
      { name: 'Update Designation', method: 'PUT', segs: ['designations','{{id}}'], query: [], body: { title: 'Senior Mason' }, auth: true, perm: 'designations:update' },
      { name: 'Delete Designation', method: 'DELETE', segs: ['designations','{{id}}'], query: [], body: null, auth: true, perm: 'designations:delete' },
    ],
  },
  {
    name: 'Shifts',
    items: [
      { name: 'List Shifts', method: 'GET', segs: ['shifts'], query: [], body: null, auth: true, perm: 'shifts:read' },
      { name: 'Create Shift', method: 'POST', segs: ['shifts'], query: [], body: { name: 'Day', startTime: '08:00', endTime: '17:00' }, auth: true, perm: 'shifts:create' },
      { name: 'Get Shift', method: 'GET', segs: ['shifts','{{id}}'], query: [], body: null, auth: true, perm: 'shifts:read' },
      { name: 'Update Shift', method: 'PUT', segs: ['shifts','{{id}}'], query: [], body: { name: 'Day Updated' }, auth: true, perm: 'shifts:update' },
      { name: 'Delete Shift', method: 'DELETE', segs: ['shifts','{{id}}'], query: [], body: null, auth: true, perm: 'shifts:delete' },
    ],
  },
  {
    name: 'Payroll Periods',
    items: [
      { name: 'List Payroll Periods', method: 'GET', segs: ['payroll-periods'], query: [], body: null, auth: true, perm: 'payroll:read' },
      { name: 'Create Payroll Period', method: 'POST', segs: ['payroll-periods'], query: [], body: { name: 'June 2026', startDate: '2026-06-01', endDate: '2026-06-30' }, auth: true, perm: 'payroll:create' },
      { name: 'Get Payroll Period', method: 'GET', segs: ['payroll-periods','{{id}}'], query: [], body: null, auth: true, perm: 'payroll:read' },
      { name: 'Update Payroll Period', method: 'PUT', segs: ['payroll-periods','{{id}}'], query: [], body: { status: 'approved' }, auth: true, perm: 'payroll:update' },
      { name: 'Delete Payroll Period', method: 'DELETE', segs: ['payroll-periods','{{id}}'], query: [], body: null, auth: true, perm: 'payroll:delete' },
      { name: 'Disburse Payroll', method: 'POST', segs: ['payroll-periods','{{id}}','disburse'], query: [], body: {}, auth: true, perm: 'payroll:manage' },
    ],
  },
  {
    name: 'Salary Components',
    items: [
      { name: 'List Salary Components', method: 'GET', segs: ['salary-components'], query: [], body: null, auth: true, perm: 'salary_components:read' },
      { name: 'Create Salary Component', method: 'POST', segs: ['salary-components'], query: [], body: { name: 'House Allowance', type: 'allowance' }, auth: true, perm: 'salary_components:create' },
      { name: 'Get Salary Component', method: 'GET', segs: ['salary-components','{{id}}'], query: [], body: null, auth: true, perm: 'salary_components:read' },
      { name: 'Update Salary Component', method: 'PUT', segs: ['salary-components','{{id}}'], query: [], body: { name: 'House Allowance Updated' }, auth: true, perm: 'salary_components:update' },
      { name: 'Delete Salary Component', method: 'DELETE', segs: ['salary-components','{{id}}'], query: [], body: null, auth: true, perm: 'salary_components:delete' },
    ],
  },
  {
    name: 'Salary Slips',
    items: [
      { name: 'List Salary Slips', method: 'GET', segs: ['salary-slips'], query: [], body: null, auth: true, perm: 'salary_slips:read' },
      { name: 'Generate Salary Slips', method: 'POST', segs: ['salary-slips'], query: [], body: { payrollPeriodId: '{{id}}' }, auth: true, perm: 'salary_slips:create' },
    ],
  },
  {
    name: 'Wallets',
    items: [
      { name: 'List Wallets', method: 'GET', segs: ['wallets'], query: [], body: null, auth: true, perm: 'wallets:read' },
      { name: 'Create Wallet', method: 'POST', segs: ['wallets'], query: [], body: { name: 'Main Wallet' }, auth: true, perm: 'wallets:create' },
      { name: 'Get Wallet', method: 'GET', segs: ['wallets','{{id}}'], query: [], body: null, auth: true, perm: 'wallets:read' },
      { name: 'Update Wallet', method: 'PATCH', segs: ['wallets','{{id}}'], query: [], body: { name: 'Main Wallet Updated' }, auth: true, perm: 'wallets:update' },
      { name: 'Delete Wallet', method: 'DELETE', segs: ['wallets','{{id}}'], query: [], body: null, auth: true, perm: 'wallets:delete' },
      { name: 'List Wallet Transactions', method: 'GET', segs: ['wallets','{{id}}','transactions'], query: [], body: null, auth: true, perm: 'wallets:read' },
      { name: 'Create Wallet Transaction', method: 'POST', segs: ['wallets','{{id}}','transactions'], query: [], body: { type: 'withdrawal', amount: 1000 }, auth: true, perm: 'wallets:create' },
      { name: 'List Approval Queue', method: 'GET', segs: ['wallets','transactions','approvals'], query: [], body: null, auth: true, perm: 'wallets:read' },
      { name: 'Approve Transaction', method: 'POST', segs: ['wallets','transactions','approvals'], query: [], body: { transactionId: '{{transactionId}}' }, auth: true, perm: 'wallets:manage' },
      { name: 'Reject Transaction', method: 'POST', segs: ['wallets','transactions','{{transactionId}}','reject'], query: [], body: { reason: 'Invalid' }, auth: true, perm: 'wallets:manage' },
    ],
  },
  {
    name: 'Payments',
    items: [
      { name: 'Payment Status', method: 'GET', segs: ['payments','status'], query: [], body: null, auth: false, perm: 'public' },
      { name: 'Initiate Registration Payment', method: 'POST', segs: ['payments','initiate-registration'], query: [], body: { planId: '{{id}}', phone: '0700000000' }, auth: false, perm: 'public' },
    ],
  },
  {
    name: 'M-Pesa',
    items: [
      { name: 'Account Balance', method: 'POST', segs: ['mpesa','account-balance'], query: [], body: {}, auth: true, perm: 'wallets:read' },
      { name: 'B2B Payment', method: 'POST', segs: ['mpesa','b2b'], query: [], body: { amount: 1000, partyB: '600000', remarks: 'B2B' }, auth: true, perm: 'wallets:create' },
      { name: 'B2C Payment', method: 'POST', segs: ['mpesa','b2c'], query: [], body: { amount: 1000, partyB: '0700000000', remarks: 'Salary' }, auth: true, perm: 'wallets:create' },
      { name: 'B2 Pochi', method: 'POST', segs: ['mpesa','b2pochi'], query: [], body: { amount: 500, partyB: '0700000000', remarks: 'Pochi' }, auth: true, perm: 'wallets:create' },
      { name: 'Reversal', method: 'POST', segs: ['mpesa','reversal'], query: [], body: { transactionId: '{{transactionId}}' }, auth: true, perm: 'wallets:manage' },
      { name: 'STK Push', method: 'POST', segs: ['mpesa','stkpush'], query: [], body: { amount: 1000, phone: '0700000000', accountReference: 'INV001' }, auth: true, perm: 'wallets:create' },
      { name: 'Transaction Status (POST)', method: 'POST', segs: ['mpesa','transaction-status'], query: [], body: { transactionId: '{{transactionId}}' }, auth: true, perm: 'wallets:read' },
      { name: 'Transaction Status (GET)', method: 'GET', segs: ['mpesa','transaction-status'], query: [{ k: 'transactionId', v: '{{transactionId}}' }], body: null, auth: true, perm: 'wallets:read' },
      { name: 'List M-Pesa Transactions', method: 'GET', segs: ['mpesa','transactions'], query: [], body: null, auth: true, perm: 'wallets:read' },
    ],
  },
  {
    name: 'Documents',
    items: [
      { name: 'List Documents', method: 'GET', segs: ['documents'], query: [], body: null, auth: true, perm: 'documents:read' },
      { name: 'Create Document', method: 'POST', segs: ['documents'], query: [], body: { name: 'Contract', siteId: '{{siteId}}', type: 'contract' }, auth: true, perm: 'documents:create' },
      { name: 'Get Document', method: 'GET', segs: ['documents','{{id}}'], query: [], body: null, auth: true, perm: 'documents:read' },
      { name: 'Update Document', method: 'PUT', segs: ['documents','{{id}}'], query: [], body: { name: 'Contract Updated' }, auth: true, perm: 'documents:update' },
      { name: 'Delete Document', method: 'DELETE', segs: ['documents','{{id}}'], query: [], body: null, auth: true, perm: 'documents:delete' },
    ],
  },
  {
    name: 'Licenses',
    items: [
      { name: 'List Licenses', method: 'GET', segs: ['licenses'], query: [], body: null, auth: true, perm: 'licenses:read' },
      { name: 'Create License', method: 'POST', segs: ['licenses'], query: [], body: { name: 'Trade License', licenseNumber: 'TL001', siteId: '{{siteId}}' }, auth: true, perm: 'licenses:create' },
      { name: 'Check Expiry', method: 'GET', segs: ['licenses','check-expiry'], query: [], body: null, auth: true, perm: 'superadmin/cron' },
      { name: 'Get License', method: 'GET', segs: ['licenses','{{id}}'], query: [], body: null, auth: true, perm: 'licenses:read' },
      { name: 'Update License', method: 'PATCH', segs: ['licenses','{{id}}'], query: [], body: { status: 'active' }, auth: true, perm: 'licenses:update' },
      { name: 'Delete License', method: 'DELETE', segs: ['licenses','{{id}}'], query: [], body: null, auth: true, perm: 'licenses:delete' },
    ],
  },
  {
    name: 'Safety Incidents',
    items: [
      { name: 'List Safety Incidents', method: 'GET', segs: ['safety-incidents'], query: [], body: null, auth: true, perm: 'safety:read' },
      { name: 'Create Safety Incident', method: 'POST', segs: ['safety-incidents'], query: [], body: { title: 'Fall hazard', siteId: '{{siteId}}', severity: 'high' }, auth: true, perm: 'safety:create' },
      { name: 'Get Safety Incident', method: 'GET', segs: ['safety-incidents','{{id}}'], query: [], body: null, auth: true, perm: 'safety:read' },
      { name: 'Update Safety Incident', method: 'PUT', segs: ['safety-incidents','{{id}}'], query: [], body: { status: 'resolved' }, auth: true, perm: 'safety:update' },
      { name: 'Delete Safety Incident', method: 'DELETE', segs: ['safety-incidents','{{id}}'], query: [], body: null, auth: true, perm: 'safety:delete' },
    ],
  },
  {
    name: 'Visitors',
    items: [
      { name: 'List Visitors', method: 'GET', segs: ['visitors'], query: [], body: null, auth: true, perm: 'visitors:read' },
      { name: 'Create Visitor', method: 'POST', segs: ['visitors'], query: [], body: { name: 'Guest', phone: '0700000000', siteId: '{{siteId}}' }, auth: true, perm: 'visitors:create' },
      { name: 'Get Visitor', method: 'GET', segs: ['visitors','{{id}}'], query: [], body: null, auth: true, perm: 'visitors:read' },
      { name: 'Update Visitor', method: 'PUT', segs: ['visitors','{{id}}'], query: [], body: { status: 'checked_out' }, auth: true, perm: 'visitors:update' },
      { name: 'Delete Visitor', method: 'DELETE', segs: ['visitors','{{id}}'], query: [], body: null, auth: true, perm: 'visitors:delete' },
    ],
  },
  {
    name: 'Notifications',
    items: [
      { name: 'List Notifications', method: 'GET', segs: ['notifications'], query: [], body: null, auth: true, perm: 'settings:read' },
      { name: 'Update Notification Settings', method: 'PUT', segs: ['notifications'], query: [], body: { email: true, push: true }, auth: true, perm: 'settings:update' },
    ],
  },
  {
    name: 'Activity Logs',
    items: [
      { name: 'List Activity Logs', method: 'GET', segs: ['activity-logs'], query: [], body: null, auth: true, perm: 'dashboard:read' },
    ],
  },
  {
    name: 'Reports',
    items: [
      { name: 'Get Reports', method: 'GET', segs: ['reports'], query: [], body: null, auth: true, perm: 'reports:read' },
    ],
  },
  {
    name: 'Companies',
    items: [
      { name: 'Get/Update Company', method: 'GET', segs: ['companies'], query: [], body: null, auth: true, perm: 'settings:read' },
      { name: 'Update Company', method: 'PUT', segs: ['companies'], query: [], body: { companyName: 'Acme Construction' }, auth: true, perm: 'settings:update' },
      { name: 'Get Company', method: 'GET', segs: ['companies','{{id}}'], query: [], body: null, auth: true, perm: 'settings:read' },
    ],
  },
  {
    name: 'Contractors',
    items: [
      { name: 'List Contractors', method: 'GET', segs: ['contractors'], query: [], body: null, auth: true, perm: 'dashboard:read' },
      { name: 'Create Contractor', method: 'POST', segs: ['contractors'], query: [], body: { companyName: 'Acme', email: 'acme@example.com', phoneNumber: '0700000000' }, auth: true, perm: 'settings:manage' },
      { name: 'Get Contractor', method: 'GET', segs: ['contractors','{{id}}'], query: [], body: null, auth: true, perm: 'settings:read' },
      { name: 'Update Contractor', method: 'PUT', segs: ['contractors','{{id}}'], query: [], body: { companyName: 'Acme Updated' }, auth: true, perm: 'settings:update' },
      { name: 'Delete Contractor', method: 'DELETE', segs: ['contractors','{{id}}'], query: [], body: null, auth: true, perm: 'settings:manage' },
      { name: 'Get Subscription', method: 'GET', segs: ['contractors','{{id}}','subscription'], query: [], body: null, auth: true, perm: 'settings:read' },
      { name: 'Update Subscription', method: 'PUT', segs: ['contractors','{{id}}','subscription'], query: [], body: { planId: '{{id}}' }, auth: true, perm: 'settings:update' },
      { name: 'Get Notification Preferences', method: 'GET', segs: ['contractors','{{id}}','notification-preferences'], query: [], body: null, auth: true, perm: 'settings:read' },
      { name: 'Update Notification Preferences', method: 'PUT', segs: ['contractors','{{id}}','notification-preferences'], query: [], body: { email: true, sms: false }, auth: true, perm: 'settings:update' },
    ],
  },
  {
    name: 'Roles',
    items: [
      { name: 'List Roles', method: 'GET', segs: ['roles'], query: [], body: null, auth: true, perm: 'roles:read' },
      { name: 'Create Role', method: 'POST', segs: ['roles'], query: [], body: { name: 'Foreman', permissions: ['workers:read'] }, auth: true, perm: 'roles:create' },
      { name: 'Get Role', method: 'GET', segs: ['roles','{{id}}'], query: [], body: null, auth: true, perm: 'roles:read' },
      { name: 'Update Role', method: 'PATCH', segs: ['roles','{{id}}'], query: [], body: { name: 'Senior Foreman' }, auth: true, perm: 'roles:update' },
      { name: 'Delete Role', method: 'DELETE', segs: ['roles','{{id}}'], query: [], body: null, auth: true, perm: 'roles:delete' },
    ],
  },
  {
    name: 'Permissions',
    items: [
      { name: 'List Permissions', method: 'GET', segs: ['permissions'], query: [], body: null, auth: true, perm: 'roles:read' },
    ],
  },
  {
    name: 'Subscription Plans',
    items: [
      { name: 'List Plans', method: 'GET', segs: ['subscription-plans'], query: [], body: null, auth: true, perm: 'settings:read' },
      { name: 'Create Plan', method: 'POST', segs: ['subscription-plans'], query: [], body: { name: 'Pro', price: 5000, interval: 'monthly' }, auth: true, perm: 'settings:manage' },
    ],
  },
  {
    name: 'Contractor Dashboard',
    items: [
      { name: 'Dashboard', method: 'GET', segs: ['contractor','dashboard'], query: [], body: null, auth: true, perm: 'dashboard:read' },
    ],
  },
  {
    name: 'Upload',
    items: [
      { name: 'Upload File', method: 'POST', segs: ['upload'], query: [], body: null, auth: true, perm: 'documents:create', formdata: true },
    ],
  },
  {
    name: 'Superadmin',
    items: [
      { name: 'Dashboard', method: 'GET', segs: ['superadmin','dashboard'], query: [], body: null, auth: true, perm: 'superadmin' },
      { name: 'List Subscriptions', method: 'GET', segs: ['superadmin','subscriptions'], query: [], body: null, auth: true, perm: 'superadmin' },
      { name: 'Update Subscription', method: 'PATCH', segs: ['superadmin','subscriptions'], query: [], body: { status: 'active' }, auth: true, perm: 'superadmin' },
      { name: 'List Transactions', method: 'GET', segs: ['superadmin','transactions'], query: [], body: null, auth: true, perm: 'superadmin' },
      { name: 'Create Transaction', method: 'POST', segs: ['superadmin','transactions'], query: [], body: { amount: 5000, type: 'subscription' }, auth: true, perm: 'superadmin' },
      { name: 'List Admins', method: 'GET', segs: ['superadmin','admins'], query: [], body: null, auth: true, perm: 'superadmin' },
      { name: 'Create Admin', method: 'POST', segs: ['superadmin','admins'], query: [], body: { name: 'Admin', email: 'admin2@example.com', password: 'password123' }, auth: true, perm: 'superadmin' },
      { name: 'Update Admin', method: 'PATCH', segs: ['superadmin','admins','{{id}}'], query: [], body: { name: 'Admin Updated' }, auth: true, perm: 'superadmin' },
      { name: 'Delete Admin', method: 'DELETE', segs: ['superadmin','admins','{{id}}'], query: [], body: null, auth: true, perm: 'superadmin' },
      { name: 'List Contractors', method: 'GET', segs: ['superadmin','contractors'], query: [], body: null, auth: true, perm: 'superadmin' },
      { name: 'Create Contractor', method: 'POST', segs: ['superadmin','contractors'], query: [], body: { companyName: 'New Co', email: 'new@example.com' }, auth: true, perm: 'superadmin' },
      { name: 'Get Contractor', method: 'GET', segs: ['superadmin','contractors','{{id}}'], query: [], body: null, auth: true, perm: 'superadmin' },
      { name: 'Update Contractor', method: 'PATCH', segs: ['superadmin','contractors','{{id}}'], query: [], body: { status: 'active' }, auth: true, perm: 'superadmin' },
      { name: 'Delete Contractor', method: 'DELETE', segs: ['superadmin','contractors','{{id}}'], query: [], body: null, auth: true, perm: 'superadmin' },
      { name: 'List Plans', method: 'GET', segs: ['superadmin','plans'], query: [], body: null, auth: true, perm: 'superadmin' },
      { name: 'Create Plan', method: 'POST', segs: ['superadmin','plans'], query: [], body: { name: 'Enterprise', price: 10000 }, auth: true, perm: 'superadmin' },
      { name: 'Update Plan', method: 'PATCH', segs: ['superadmin','plans','{{id}}'], query: [], body: { price: 12000 }, auth: true, perm: 'superadmin' },
      { name: 'Delete Plan', method: 'DELETE', segs: ['superadmin','plans','{{id}}'], query: [], body: null, auth: true, perm: 'superadmin' },
    ],
  },
];

function buildUrl(segs, query) {
  const path = [BASE, ...segs];
  const raw = `{{baseUrl}}/${path.join('/')}${query && query.length ? '?' + query.map(q => `${q.k}=${encodeURIComponent(q.v)}`).join('&') : ''}`;
  return {
    raw,
    host: ['{{baseUrl}}'],
    path: path.flatMap(s => s.split('/')).filter(Boolean),
    query: (query || []).map(q => ({ key: q.k, value: q.v })),
  };
}

function buildItem(ep) {
  const headers = [];
  if (ep.auth) {
    headers.push({ key: 'Authorization', value: 'Bearer {{accessToken}}', type: 'text' });
    headers.push({ key: 'company-id', value: '{{companyId}}', type: 'text', disabled: true });
    headers.push({ key: 'site-id', value: '{{siteId}}', type: 'text', disabled: true });
  }
  const body = {};
  if (ep.formdata) {
    body.mode = 'formdata';
    body.formdata = [
      { key: 'file', type: 'file', src: '' },
    ];
  } else if (ep.body) {
    body.mode = 'raw';
    body.raw = JSON.stringify(ep.body, null, 2);
    body.options = { raw: { language: 'json' } };
  }
  const item = {
    name: ep.name,
    request: {
      method: ep.method,
      header: headers,
      url: buildUrl(ep.segs, ep.query),
    },
    response: [],
  };
  if ((ep.body || ep.formdata) && Object.keys(body).length) item.request.body = body;
  if (ep.perm) item.request.description = `Permission: ${ep.perm}`;
  return item;
}

// Login request: add test script to store tokens
const loginTest = [
  "const json = pm.response.json();",
  "if (json && json.data && json.data.accessToken) {",
  "  pm.environment.set('accessToken', json.data.accessToken);",
  "  pm.environment.set('refreshToken', json.data.refreshToken);",
  "  if (json.data.contractor) pm.environment.set('companyId', json.data.contractor.id);",
  "  const sites = json.data.sites || [];",
  "  if (sites.length) pm.environment.set('siteId', sites[0].id);",
  "  console.log('Tokens stored.');",
  "} else { console.log('Login did not return tokens.', JSON.stringify(json)); }",
].join('\n');

const collection = {
  info: {
    name: 'ReconSMI Mobile API',
    _postman_id: 'reconsmi-mobile-api-' + Date.now(),
    description: 'Complete Postman collection for the ReconSMI /mobile/api endpoints. All protected routes enforce the same RBAC permissions as the web API (Authorization: Bearer <accessToken>). Run "Login" first — it auto-stores accessToken, refreshToken, companyId and siteId into the active environment.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3010', type: 'string' },
    { key: 'accessToken', value: '', type: 'string' },
    { key: 'refreshToken', value: '', type: 'string' },
    { key: 'companyId', value: '', type: 'string' },
    { key: 'siteId', value: '', type: 'string' },
    { key: 'id', value: '', type: 'string', description: 'Generic resource id for :id path params' },
    { key: 'transferId', value: '', type: 'string' },
    { key: 'transactionId', value: '', type: 'string' },
    { key: 'roleId', value: '', type: 'string' },
    { key: 'designationId', value: '', type: 'string' },
    { key: 'shiftId', value: '', type: 'string' },
    { key: 'resetToken', value: '', type: 'string' },
  ],
  item: folders.map(f => ({
    name: f.name,
    item: f.items.map(ep => {
      const item = buildItem(ep);
      if (ep.name.startsWith('Login')) {
        item.event = [{ listen: 'test', script: { type: 'text/javascript', exec: loginTest.split('\n') } }];
      }
      return item;
    }),
  })),
};

const outPath = 'postman/ReconSMI_Mobile_API.postman_collection.json';
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(collection, null, 2));
const total = folders.reduce((n, f) => n + f.items.length, 0);
console.log(`Wrote ${outPath} (${total} requests across ${folders.length} folders).`);
