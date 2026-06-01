'use client';

import Link from 'next/link';

interface Plan {
  id: string;
  name: string;
  type: 'PAID' | 'FREE';
  modules: string[];
  monthlyPrice: string;
  yearlyPrice: string;
  lifetimePrice: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const plansData: Plan[] = [
  {
    id: '1',
    name: 'Plan 1',
    type: 'PAID',
    modules: ['CLIENTS', 'WORKERS', 'ATTENDANCE', 'INVENTORY', 'SUPPLIERS', 'VISITORS', 'PETTY_CASH', 'WORKER_PAYMENTS', 'LICENSES', 'MACHINES', 'LEAVE_REQUESTS', 'PURCHASE_ORDERS', 'MATERIAL_DELIVERIES', 'REPORTS', 'FILES', 'SETTINGS'],
    monthlyPrice: 'Kshs. 10.00',
    yearlyPrice: 'Kshs. 5.00',
    lifetimePrice: 'Kshs. 4.00',
    status: 'ACTIVE',
  },
  {
    id: '2',
    name: 'Demo Plan Paid',
    type: 'PAID',
    modules: ['CLIENTS', 'WORKERS', 'ATTENDANCE', 'INVENTORY', 'SUPPLIERS', 'VISITORS', 'PETTY_CASH', 'WORKER_PAYMENTS', 'LICENSES', 'MACHINES', 'LEAVE_REQUESTS', 'PURCHASE_ORDERS', 'MATERIAL_DELIVERIES', 'REPORTS', 'FILES', 'SETTINGS'],
    monthlyPrice: 'Kshs. 100.00',
    yearlyPrice: 'Kshs. 100.00',
    lifetimePrice: 'Kshs. 100.00',
    status: 'ACTIVE',
  },
  {
    id: '3',
    name: 'Demo Plan Free',
    type: 'FREE',
    modules: ['CLIENTS', 'WORKERS', 'ATTENDANCE', 'INVENTORY', 'SUPPLIERS', 'VISITORS', 'PETTY_CASH', 'WORKER_PAYMENTS', 'LICENSES', 'MACHINES', 'LEAVE_REQUESTS', 'PURCHASE_ORDERS', 'MATERIAL_DELIVERIES', 'REPORTS', 'FILES', 'SETTINGS'],
    monthlyPrice: 'Kshs. 0.00',
    yearlyPrice: 'Kshs. 0.00',
    lifetimePrice: 'Kshs. 0.00',
    status: 'ACTIVE',
  },
];

export default function PlansPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Home</span> <span className="mx-2">/</span> <span className="font-medium">Plans</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
        <Link
          href="/superadmin/plans/new"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          <span>+</span> New Plan
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">FILTER BY STATUS</label>
          <select className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white">
            <option>Select status</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">FILTER BY TYPE</label>
          <select className="rounded-md border border-gray-300 px-3 py-2 text-sm bg-white">
            <option>Select type</option>
            <option>PAID</option>
            <option>FREE</option>
          </select>
        </div>
        <div className="flex-1 flex items-end gap-2">
          <input
            type="text"
            placeholder="Search"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button className="rounded-md bg-gray-500 text-white px-4 py-2 text-sm hover:bg-gray-600">
            ↻
          </button>
        </div>
      </div>

      {/* Plans Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">NAME</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">PLAN TYPE</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">MODULES</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">MONTHLY PRICE</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">YEARLY PRICE</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">LIFETIME PRICE</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">STATUS</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {plansData.map((plan) => (
                <tr key={plan.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900 font-medium">{plan.name}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      plan.type === 'PAID'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {plan.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {plan.modules.slice(0, 4).map((module) => (
                        <span key={module} className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          {module}
                        </span>
                      ))}
                      {plan.modules.length > 4 && (
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          +{plan.modules.length - 4} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{plan.monthlyPrice}</td>
                  <td className="py-3 px-4 text-gray-900">{plan.yearlyPrice}</td>
                  <td className="py-3 px-4 text-gray-900">{plan.lifetimePrice}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      {plan.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-800">✎</button>
                      <button className="text-red-600 hover:text-red-800">🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Showing 1 to {plansData.length} of {plansData.length} rows</span>
      </div>
    </div>
  );
}
