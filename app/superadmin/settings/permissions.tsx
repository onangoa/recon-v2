'use client';

import Link from 'next/link';

interface Role {
  name: string;
  permissions: Permission[];
  color: string;
}

interface Permission {
  category: string;
  items: string[];
}

const rolesData: Role[] = [
  {
    name: 'Superadmin',
    color: 'bg-green-100 text-green-800',
    permissions: [
      {
        category: 'Admin Permissions',
        items: ['SUPER ADMIN HAS ALL THE PERMISSIONS'],
      },
    ],
  },
  {
    name: 'Manager',
    color: 'bg-green-100 text-green-800',
    permissions: [
      {
        category: 'Global Admin',
        items: ['AS A GLOBAL ADMIN, USER CAN ACCESS AND MANAGE PLANS, SUBSCRIPTIONS, TRANSACTIONS, AND CONTRACTORS'],
      },
    ],
  },
  {
    name: 'Admin',
    color: 'bg-green-100 text-green-800',
    permissions: [
      {
        category: 'Admin Permissions',
        items: ['ADMIN HAS ALL THE PERMISSIONS'],
      },
    ],
  },
  {
    name: 'Member',
    color: 'bg-blue-100 text-blue-800',
    permissions: [
      {
        category: 'Task Management',
        items: ['EDIT TASKS', 'CREATE TASKS', 'MANAGE TASKS', 'DELETE SITES', 'CREATE SITES', 'MANAGE SITES'],
      },
      {
        category: 'Contracts',
        items: ['EDIT MEETINGS', 'CREATE CONTRACTS', 'EDIT CONTRACTS', 'CREATE TIMESHEET', 'CREATE PAYSLIPS', 'EDIT PAYSLIPS'],
      },
      {
        category: 'Financial',
        items: ['MANAGE ESTIMATES INVOICES', 'CREATE ESTIMATES INVOICES', 'EDIT ESTIMATES INVOICES', 'MANAGE EXPENSES', 'CREATE EXPENSES'],
      },
      {
        category: 'System',
        items: ['EDIT EXPENSES', 'MANAGE MILESTONES', 'CREATE MILESTONES', 'EDIT MILESTONES', 'MANAGE SYSTEM NOTIFICATIONS'],
      },
    ],
  },
  {
    name: 'Client',
    color: 'bg-blue-100 text-blue-800',
    permissions: [
      {
        category: 'View Operations',
        items: ['VIEW SUPPLIERS', 'VIEW PETTY CASH ACCOUNT', 'VIEW PETTY CASH ACCOUNT', 'ADD PETTY CASH FUNDS'],
      },
      {
        category: 'Staff Management',
        items: ['WITHDRAW PETTY CASH FUNDS', 'VIEW WORKERS', 'VIEW WORKER PAYMENTS', 'CREATE LEAVE REQUESTS', 'VIEW LEAVE REQUESTS'],
      },
      {
        category: 'Financial Tracking',
        items: ['VIEW ALLOWANCES', 'VIEW DEDUCTIONS', 'VIEW INVENTORY CATEGORIES', 'VIEW INVENTORY ITEMS', 'VIEW STOCK MOVEMENTS'],
      },
    ],
  },
];

export default function PermissionsPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Home</span> <span className="mx-2">/</span> <span>Settings</span> <span className="mx-2">/</span> <span className="font-medium">Permissions</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Permissions</h1>
        <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90">
          <span>+</span>
        </button>
      </div>

      {/* Roles and Permissions */}
      <div className="space-y-6">
        {rolesData.map((role) => (
          <div key={role.name} className="rounded-lg border border-gray-200 bg-white p-6">
            {/* Role Header */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
            </div>

            {/* Permissions Grid */}
            <div className="flex flex-wrap gap-2">
              {role.permissions.map((perm, idx) => (
                <div key={idx} className="w-full">
                  {perm.category && (
                    <p className="text-xs font-bold text-gray-600 mb-2 mt-2">{perm.category.toUpperCase()}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {perm.items.map((item) => (
                      <span
                        key={item}
                        className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-4 flex justify-end">
              <button className="text-gray-500 hover:text-gray-700">
                ✎
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
