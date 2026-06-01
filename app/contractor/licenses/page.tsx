'use client';

import Link from 'next/link';

export default function LicensesPage() {
  const licenses = [
    {
      id: '1',
      number: 'LIC-2024-001',
      type: 'Contractor License',
      issuingAuthority: 'Ministry of Works',
      issueDate: '2024-01-15',
      expiryDate: '2025-01-14',
      status: 'Active',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Home</span> <span className="mx-2">/</span> <span className="font-medium">Licenses</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Licenses</h1>
        <Link
          href="/contractor/licenses/create"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          + Create License
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
              <th className="text-left py-3 px-4 font-medium text-gray-700">LICENSE NUMBER</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">TYPE</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">ISSUING AUTHORITY</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">ISSUE DATE</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">EXPIRY DATE</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">STATUS</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((license) => (
              <tr key={license.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900 font-medium">{license.number}</td>
                <td className="py-3 px-4 text-gray-600">{license.type}</td>
                <td className="py-3 px-4 text-gray-600">{license.issuingAuthority}</td>
                <td className="py-3 px-4 text-gray-600">{license.issueDate}</td>
                <td className="py-3 px-4 text-gray-600">{license.expiryDate}</td>
                <td className="py-3 px-4">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    {license.status}
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
