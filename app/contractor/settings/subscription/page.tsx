'use client';

import { useState } from 'react';

interface SubscriptionPlan {
  id: number;
  name: string;
  tier: string;
  status: string;
  startDate: string;
  endDate: string;
  price: string;
  duration: string;
  features: SubscriptionFeature[];
}

interface SubscriptionFeature {
  name: string;
  modules: string[];
}

export default function SubscriptionPlansPage() {
  const [expandedPlans, setExpandedPlans] = useState<number[]>([1]);

  const plans: SubscriptionPlan[] = [
    {
      id: 1,
      name: 'Professional Plan',
      tier: 'Plan 1',
      status: 'Active',
      startDate: '2026-01-15',
      endDate: '2026-12-31',
      price: '5,000 KES',
      duration: '12 Months',
      features: [
        {
          name: 'Premium Features',
          modules: [
            'Advanced Inventory Management',
            'Real-time Analytics Dashboard',
            'Multi-user Access',
            'Scheduled Reporting',
          ],
        },
        {
          name: 'Support & Integration',
          modules: [
            'Priority Email Support',
            'API Access',
            'Custom Integrations',
            'Dedicated Account Manager',
          ],
        },
      ],
    },
    {
      id: 2,
      name: 'Standard Plan',
      tier: 'Plan 2',
      status: 'Active',
      startDate: '2026-02-01',
      endDate: '2026-08-31',
      price: '3,000 KES',
      duration: '7 Months',
      features: [
        {
          name: 'Core Features',
          modules: [
            'Inventory Management',
            'Basic Analytics',
            'User Accounts',
            'Monthly Reports',
          ],
        },
        {
          name: 'Support',
          modules: [
            'Email Support',
            'Documentation Access',
            'Community Forum',
          ],
        },
      ],
    },
    {
      id: 3,
      name: 'Starter Plan',
      tier: 'Plan 3',
      status: 'Expired',
      startDate: '2025-06-01',
      endDate: '2025-12-31',
      price: '1,000 KES',
      duration: '7 Months',
      features: [
        {
          name: 'Basic Features',
          modules: [
            'Inventory Tracking',
            'Dashboard View',
            'Single User',
          ],
        },
      ],
    },
  ];

  const togglePlan = (id: number) => {
    setExpandedPlans((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Home</span> <span className="mx-2">/</span> <span className="font-medium">Subscription Plan</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Subscriptions</h1>
          <p className="mt-1 text-sm text-gray-600">Manage and view your active subscription plans</p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          Renew Subscription
        </button>
      </div>

      {/* Subscription Plans */}
      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            {/* Plan Header */}
            <button
              onClick={() => togglePlan(plan.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 text-left">
                <span className="text-lg font-semibold text-gray-900">{plan.tier}</span>
                <span className="text-sm text-gray-600">{plan.name}</span>
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    plan.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {plan.status}
                </span>
              </div>
              <span className={`transform transition-transform ${expandedPlans.includes(plan.id) ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {/* Plan Details */}
            {expandedPlans.includes(plan.id) && (
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                {/* Features */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Features & Modules</h3>
                  <div className="space-y-4">
                    {plan.features.map((feature, idx) => (
                      <div key={idx}>
                        <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          ✓ {feature.name}
                        </h4>
                        <ul className="ml-6 space-y-1">
                          {feature.modules.map((module, moduleIdx) => (
                            <li key={moduleIdx} className="text-sm text-gray-700 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                              {module}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Start Date</p>
                    <p className="mt-1 text-sm text-gray-900">{plan.startDate}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">End Date</p>
                    <p className="mt-1 text-sm text-gray-900">{plan.endDate}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Price</p>
                    <p className="mt-1 text-sm text-gray-900">{plan.price}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Duration</p>
                    <p className="mt-1 text-sm text-gray-900">{plan.duration}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
                  <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
                    Upgrade
                  </button>
                  <button className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                    View Details
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Subscription Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Plan Name</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Tier</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Start Date</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">End Date</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Price</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900 font-medium">{plan.name}</td>
                  <td className="px-6 py-4 text-gray-600">{plan.tier}</td>
                  <td className="px-6 py-4 text-gray-600">{plan.startDate}</td>
                  <td className="px-6 py-4 text-gray-600">{plan.endDate}</td>
                  <td className="px-6 py-4 text-gray-900 font-semibold">{plan.price}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        plan.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {plan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-primary hover:underline text-sm font-medium">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
