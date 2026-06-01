'use client';

import { useState } from 'react';

export default function WalletDetailPage() {
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showMakePayment, setShowMakePayment] = useState(false);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Home</span> <span className="mx-2">/</span> <span>Wallets</span> <span className="mx-2">/</span> <span className="font-medium">Test Wallet</span>
      </div>

      {/* Header with Action Buttons */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Test Wallet</h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-md bg-primary text-white px-4 py-2 text-sm hover:bg-primary/90">
            ✏️
          </button>
          <button className="flex items-center gap-2 rounded-md bg-green-500 text-white px-4 py-2 text-sm hover:bg-green-600">
            ✓
          </button>
          <button className="flex items-center gap-2 rounded-md bg-cyan-500 text-white px-4 py-2 text-sm hover:bg-cyan-600">
            ▶
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Balance</p>
              <p className="text-2xl font-bold text-gray-900">KES 0.00</p>
            </div>
            <div className="text-3xl">$</div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Credits</p>
              <p className="text-2xl font-bold text-gray-900">KES 0.00</p>
            </div>
            <div className="text-3xl">➕</div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Debits</p>
              <p className="text-2xl font-bold text-gray-900">KES 0.00</p>
            </div>
            <div className="text-3xl">➖</div>
          </div>
        </div>
      </div>

      {/* Wallet Information */}
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Wallet Information</h2>
        
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Wallet Name</p>
              <p className="text-lg text-gray-900">Test Wallet</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Status</p>
              <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                ACTIVE
              </div>
            </div>
          </div>
          
          <div>
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Supported Payment Options</p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-green-500 text-white px-3 py-1 rounded text-xs font-semibold">PAYBILL</span>
                <span className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-semibold">TILL</span>
                <span className="bg-cyan-500 text-white px-3 py-1 rounded text-xs font-semibold">POCHI</span>
                <span className="bg-yellow-500 text-white px-3 py-1 rounded text-xs font-semibold">M-PESA MOBILE NO</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Description</p>
              <p className="text-gray-700">Demo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Transactions</h2>
        
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
            <option>Select Transaction Type</option>
            <option>Credit</option>
            <option>Debit</option>
          </select>
          <select className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
            <option>Select status</option>
            <option>Pending</option>
            <option>Completed</option>
            <option>Failed</option>
          </select>
          <select className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
            <option>Select Method</option>
            <option>Paybill</option>
            <option>Till</option>
            <option>Pochi</option>
            <option>M-Pesa</option>
          </select>
          <input
            type="text"
            placeholder="Search"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary flex-1"
          />
          <button className="rounded-md bg-gray-500 text-white px-4 py-2 text-sm hover:bg-gray-600">↻</button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">AMOUNT</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">TYPE</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">DESCRIPTION</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">METHOD</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">STATUS</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">DATE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={7} className="py-8 px-4 text-center text-gray-500">
                  No matching records found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddFunds && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Add Funds to Wallet</h3>
              <button onClick={() => setShowAddFunds(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">AMOUNT *</label>
                <input type="number" className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PHONE NUMBER *</label>
                <input type="tel" placeholder="254XXXXXXXXX" className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">DESCRIPTION *</label>
                <textarea rows={3} className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <p className="text-sm text-red-600">Warning: Wallet has insufficient balance. Please add funds first.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowAddFunds(false)} className="flex-1 rounded-md bg-gray-500 text-white px-4 py-2 text-sm hover:bg-gray-600">
                Cancel
              </button>
              <button className="flex-1 rounded-md bg-primary text-white px-4 py-2 text-sm hover:bg-primary/90">
                Add Funds
              </button>
            </div>
          </div>
        </div>
      )}

      {showMakePayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Make Payment from Wallet</h3>
              <button onClick={() => setShowMakePayment(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">AMOUNT *</label>
                <input type="number" className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <p className="text-xs text-gray-600 mt-1">Max available balance: KES 0.00</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PAYMENT TYPE *</label>
                <select className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Select Payment Type</option>
                  <option>Paybill</option>
                  <option>Till</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">DESCRIPTION *</label>
                <textarea rows={3} className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <p className="text-sm text-red-600">Warning: Wallet has insufficient balance. Please add funds first.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowMakePayment(false)} className="flex-1 rounded-md bg-gray-500 text-white px-4 py-2 text-sm hover:bg-gray-600">
                Cancel
              </button>
              <button className="flex-1 rounded-md bg-primary text-white px-4 py-2 text-sm hover:bg-primary/90">
                Make Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons to Trigger Modals */}
      <div className="flex gap-4 justify-center py-6">
        <button onClick={() => setShowAddFunds(true)} className="rounded-md bg-green-500 text-white px-6 py-2 text-sm hover:bg-green-600">
          ➕ Add Funds
        </button>
        <button onClick={() => setShowMakePayment(true)} className="rounded-md bg-blue-500 text-white px-6 py-2 text-sm hover:bg-blue-600">
          💳 Make Payment
        </button>
      </div>
    </div>
  );
}
