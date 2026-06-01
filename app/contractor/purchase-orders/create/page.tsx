'use client';

import Link from 'next/link';
import { useState } from 'react';

interface OrderItem {
  id: string;
  item: string;
  quantity: number;
  unitPrice: number;
}

export default function CreatePurchaseOrder() {
  const [supplier, setSupplier] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [priority, setPriority] = useState('Low');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([
    { id: '1', item: '', quantity: 1, unitPrice: 0 }
  ]);

  const addItem = () => {
    setItems([...items, {
      id: String(items.length + 1),
      item: '',
      quantity: 1,
      unitPrice: 0
    }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating purchase order:', { supplier, deliveryDate, priority, notes, items });
  };

  const handleCancel = () => {
    window.history.back();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Link href="/contractor" className="text-primary hover:underline">Home</Link>
          <span>›</span>
          <Link href="/contractor/purchase-orders" className="text-primary hover:underline">Purchase Orders</Link>
          <span>›</span>
          <span className="text-gray-900">Create</span>
        </div>
        <Link
          href="/contractor/purchase-orders"
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          ← Back to List
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Purchase Order</h2>

          <div className="space-y-6">
            {/* Supplier and Site */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SUPPLIER</label>
                <select
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Supplier</option>
                  <option value="BuildMart">BuildMart Supplies</option>
                  <option value="Steel">Steel & Co</option>
                  <option value="Cement">Cement Industries</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SITE *</label>
                <input
                  type="text"
                  value="Karen plains Road Project"
                  disabled
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm bg-gray-100"
                />
              </div>
            </div>

            {/* Delivery Date and Priority */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">DELIVERY DATE</label>
                <input
                  type="text"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  placeholder="mm/dd/yyyy"
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">PRIORITY *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">NOTES</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Inventory Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Unit Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <select
                        value={item.item}
                        onChange={(e) => updateItem(item.id, 'item', e.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full"
                      >
                        <option value="">Select Inventory Item</option>
                        <option value="Cement">Cement (50kg bags)</option>
                        <option value="Steel">Steel Rods</option>
                        <option value="Bricks">Bricks (1000pcs)</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value))}
                        min="1"
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                        min="0"
                        step="0.01"
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full bg-gray-50"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {(item.quantity * item.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium text-sm"
          >
            + Add Item
          </button>
        </div>

        {/* Total Amount */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-700">TOTAL AMOUNT</span>
            <input
              type="text"
              value={`/= ${totalAmount.toFixed(2)}`}
              disabled
              className="w-48 rounded-md border border-gray-300 px-4 py-2 text-sm bg-gray-50"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2"
          >
            📋 Create Purchase Order
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2"
          >
            ◯ Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
