'use client';

import Link from 'next/link';

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Home</span> <span className="mx-2">/</span> <span className="font-medium">Inventory</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <Link
          href="/contractor/inventory/create"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          +
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
          <option>Select category</option>
          <option>Materials</option>
          <option>Equipment</option>
          <option>Tools</option>
        </select>
        <select className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
          <option>Select supplier</option>
          <option>Supplier 1</option>
          <option>Supplier 2</option>
        </select>
        <select className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
          <option>Select stock status</option>
          <option>In Stock</option>
          <option>Low Stock</option>
          <option>Out of Stock</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button className="flex items-center gap-2 rounded-md border border-red-300 text-red-600 px-4 py-2 text-sm hover:bg-red-50">
          🗑 Deleted selected
        </button>
        <button className="flex items-center gap-2 rounded-md border border-gray-300 text-gray-700 px-4 py-2 text-sm hover:bg-gray-50">
          💾 Save Column Visibility
        </button>
      </div>

      {/* Search and Filter Button */}
      <div className="flex gap-2 items-center justify-end">
        <input
          type="text"
          placeholder="Search"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary w-48"
        />
        <button className="rounded-md bg-gray-500 text-white px-4 py-2 text-sm hover:bg-gray-600">↻</button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-700 w-8">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">NAME</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">SKU</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">CATEGORY</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">CURRENT STOCK</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">UNIT PRICE</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">STATUS</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={9} className="py-12 px-4 text-center">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="text-5xl">📦</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">No Inventory Items Found</h3>
                    <p className="text-sm text-gray-600 mt-1">Get started by creating your first inventory item.</p>
                  </div>
                  <Link
                    href="/contractor/inventory/create"
                    className="mt-4 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
                  >
                    + Create Inventory Item
                  </Link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
