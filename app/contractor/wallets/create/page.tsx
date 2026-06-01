'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function CreateWalletPage() {
  const [formData, setFormData] = useState({
    walletName: '',
    description: '',
    paymentOptions: {
      paybill: false,
      till: false,
      pochi: false,
      mpesa: false,
    },
    dailySpendLimit: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Home</span> <span className="mx-2">/</span> <span>Wallets</span> <span className="mx-2">/</span> <span className="font-medium">Create Wallet</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create Wallet</h1>
        <Link
          href="/contractor/wallets"
          className="rounded-md bg-gray-500 text-white px-4 py-2 text-sm hover:bg-gray-600"
        >
          ← Back to List
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="rounded-lg border border-gray-200 bg-white p-8 space-y-6">
          {/* Wallet Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WALLET NAME <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.walletName}
              onChange={(e) => setFormData({ ...formData, walletName: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DESCRIPTION
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Payment Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              SUPPORTED PAYMENT OPTIONS
            </label>
            <div className="flex gap-6">
              {[
                { id: 'paybill', label: 'Paybill' },
                { id: 'till', label: 'Till' },
                { id: 'pochi', label: 'Pochi' },
                { id: 'mpesa', label: 'M-Pesa Mobile No' },
              ].map((option) => (
                <label key={option.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.paymentOptions[option.id as keyof typeof formData.paymentOptions]}
                    onChange={(e) => setFormData({
                      ...formData,
                      paymentOptions: {
                        ...formData.paymentOptions,
                        [option.id]: e.target.checked,
                      },
                    })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Daily Spend Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DAILY SPEND LIMIT
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={formData.dailySpendLimit}
              onChange={(e) => setFormData({ ...formData, dailySpendLimit: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-white font-medium hover:bg-primary/90"
            >
              💾 Save Wallet
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md bg-gray-400 px-6 py-2 text-white font-medium hover:bg-gray-500"
            >
              ⊗ Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
