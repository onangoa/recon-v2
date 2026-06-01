'use client';

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Home</span> <span className="mx-2">/</span> <span className="font-medium">Transactions</span>
      </div>

      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>

      {/* Content */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
        <p className="text-gray-600">Transaction history and management will appear here</p>
      </div>
    </div>
  );
}
