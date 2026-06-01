'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Contractor {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([
    { id: '1', firstName: 'sdt', lastName: 'tyui', phoneNumber: '0701515491', email: 'demo@outlook.com', status: 'ACTIVE' },
    { id: '2', firstName: 'Antwon', lastName: 'Ullrich', phoneNumber: '0700000009', email: 'ononagoa@gmail.com', status: 'ACTIVE' },
    { id: '3', firstName: 'Jennifer', lastName: 'Emard', phoneNumber: '0634427523', email: 'test0@gmail.com', status: 'ACTIVE' },
    { id: '4', firstName: 'Delphine', lastName: 'Jakubowski-Gorczany', phoneNumber: '0700000000', email: 'demo3@gmail.com', status: 'ACTIVE' },
    { id: '5', firstName: 'Rebarcrete', lastName: 'Construction', phoneNumber: '0706491785', email: 'rebarcreteconstruction@gmail.com', status: 'ACTIVE' },
    { id: '6', firstName: 'John', lastName: 'Doe', phoneNumber: '0700000001', email: 'test@gmail.com', status: 'ACTIVE' },
    { id: '7', firstName: 'Antwon', lastName: 'Ullrich', phoneNumber: '7000000000', email: 'demo@gmail.com', status: 'ACTIVE' },
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContractors, setFilteredContractors] = useState(contractors);

  useEffect(() => {
    const filtered = contractors.filter(
      (c) =>
        c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContractors(filtered);
  }, [searchTerm, contractors]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Home</span> <span className="mx-2">/</span> <span className="font-medium">Contractors</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Contractors</h1>
        <Link
          href="/superadmin/contractors/new"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          <span>+</span> Add Contractor
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button className="rounded-md border border-gray-300 bg-gray-500 text-white px-4 py-2 text-sm hover:bg-gray-600">
          ↻
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">FIRST NAME</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">LAST NAME</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">PHONE NUMBER</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">E-MAIL</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">STATUS</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredContractors.map((contractor) => (
                <tr key={contractor.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">{contractor.firstName}</td>
                  <td className="py-3 px-4 text-gray-900">{contractor.lastName}</td>
                  <td className="py-3 px-4 text-gray-600">{contractor.phoneNumber}</td>
                  <td className="py-3 px-4 text-gray-600">{contractor.email}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                      {contractor.status}
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

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Showing 1 to {filteredContractors.length} of {contractors.length} rows</span>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">rows per page</span>
          <button className="rounded-md border border-gray-300 bg-gray-600 text-white px-3 py-1 hover:bg-gray-700">
            10
          </button>
        </div>
      </div>
    </div>
  );
}
