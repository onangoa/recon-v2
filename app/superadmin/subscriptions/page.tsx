'use client';

import Link from 'next/link';

interface Subscription {
  id: string;
  contractorName: string;
  planName: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'CANCELLED' | 'PENDING';
  amount: string;
  features: string[];
}

const subscriptionsData: Subscription[] = [
  {
    id: '1',
    contractorName: 'Nairobi Builders Ltd',
    planName: 'Demo Plan Paid',
    startDate: 'Jan-2026',
    endDate: 'Jan-2026',
    status: 'ACTIVE',
    amount: 'KSHs. 100.00',
    features: ['CLIENTS', 'WORKERS', 'ATTENDANCE', 'INVENTORY', 'SUPPLIERS', 'VISITORS', 'PETTY_CASH', 'WORKER_PAYMENTS'],
  },
  {
    id: '2',
    contractorName: 'Kisumu Construction Co',
    planName: 'Demo Plan Paid',
    startDate: 'Jan-2026',
    endDate: 'Jan-2026',
    status: 'ACTIVE',
    amount: 'KSHs. 100.00',
    features: ['CLIENTS', 'WORKERS', 'ATTENDANCE', 'INVENTORY', 'SUPPLIERS', 'VISITORS', 'PETTY_CASH', 'WORKER_PAYMENTS'],
  },
  {
    id: '3',
    contractorName: 'Mombasa Developers',
    planName: 'Demo Plan Free',
    startDate: 'Jan-2026',
    endDate: 'Jan-2026',
    status: 'ACTIVE',
    amount: 'KSHs. 0.00',
    features: ['CLIENTS', 'WORKERS', 'ATTENDANCE', 'INVENTORY', 'SUPPLIERS', 'VISITORS', 'PETTY_CASH'],
  },
];

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Home</span> <span className="mx-2">/</span> <span className="font-medium">Subscriptions</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <Link
          href="/superadmin/subscriptions/new"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          <span>+</span> New Subscription
        </Link>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-4">
        {subscriptionsData.map((subscription) => (
          <div key={subscription.id} className="rounded-lg border border-gray-200 bg-white p-6">
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">{subscription.contractorName}</h3>
                  <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                    {subscription.planName}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">{subscription.startDate}</span> to <span className="font-medium">{subscription.endDate}</span>
                </p>
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                subscription.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800'
                  : subscription.status === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {subscription.status}
              </span>
            </div>

            {/* Features */}
            <div className="mb-4 flex flex-wrap gap-2">
              {subscription.features.map((feature) => (
                <span
                  key={feature}
                  className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-600">Monthly Amount</p>
                <p className="text-lg font-semibold text-gray-900">{subscription.amount}</p>
              </div>
              <div className="flex gap-2">
                <button className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
                  Edit
                </button>
                <button className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
                  Renew
                </button>
                <button className="rounded-md border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
