'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface PurchaseOrder {
  id: string;
  supplier: string;
  totalAmount: number;
  status: string;
  date: string;
}

export default function PurchaseOrdersList() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setOrders([
      { id: '1', supplier: 'BuildMart Supplies', totalAmount: 45000, status: 'Completed', date: '2026-05-15' },
      { id: '2', supplier: 'Steel & Co', totalAmount: 125000, status: 'Pending', date: '2026-05-20' },
      { id: '3', supplier: 'Cement Industries', totalAmount: 85000, status: 'Completed', date: '2026-05-25' },
    ]);
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-600 mt-1">Manage and track all purchase orders</p>
        </div>
        <Link
          href="/contractor/purchase-orders/create"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium"
        >
          + New Purchase Order
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Supplier</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading...</td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No purchase orders found</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{order.supplier}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">KES {order.totalAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{order.date}</td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-primary hover:underline">View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
