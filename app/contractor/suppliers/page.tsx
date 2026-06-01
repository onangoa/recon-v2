'use client';

import Link from 'next/link';

export default function SuppliersPage() {
  const suppliers = [
    {
      id: '1',
      name: 'ABC Construction Supplies',
      contact: '+254 712 345 678',
      email: 'info@abcsupplies.co.ke',
      location: 'Nairobi',
      status: 'Active',
    },
    {
      id: '2',
      name: 'XYZ Materials Ltd',
      contact: '+254 720 123 456',
      email: 'sales@xyzmaterials.co.ke',
      location: 'Mombasa',
      status: 'Active',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Home</span> <span className="mx-2">/</span> <span className="font-medium">Suppliers</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
        <Link
          href="/contractor/suppliers/create"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          + Add Supplier
        </Link>
      </div>

      {/* Search */}
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
              <th className="text-left py-3 px-4 font-medium text-gray-700">SUPPLIER NAME</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">CONTACT</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">EMAIL</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">LOCATION</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">STATUS</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900 font-medium">{supplier.name}</td>
                <td className="py-3 px-4 text-gray-600">{supplier.contact}</td>
                <td className="py-3 px-4 text-gray-600">{supplier.email}</td>
                <td className="py-3 px-4 text-gray-600">{supplier.location}</td>
                <td className="py-3 px-4">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    {supplier.status}
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
  );
}
