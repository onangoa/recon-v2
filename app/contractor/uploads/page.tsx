'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function SiteUploadsPage() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Home</span> <span className="mx-2">/</span> <span>Sites</span> <span className="mx-2">/</span> <span className="font-medium">Karen plains Road Project</span>
      </div>

      {/* Header with Title and Star */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Karen plains Road Project</h1>
          <span className="text-2xl">⭐</span>
        </div>
        <Link
          href="/contractor/uploads/create"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          +
        </Link>
      </div>

      {/* Media Section */}
      <div className="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-md border border-green-200">
        <span>📁</span>
        <span className="font-medium text-gray-900">Media</span>
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
              <th className="text-left py-3 px-4 font-medium text-gray-700">FILE</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">TITLE</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">NOTES</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">FILE SIZE</th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className="py-12 px-4 text-center">
                <span className="text-gray-600">No matching records found</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
