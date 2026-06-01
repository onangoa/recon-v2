'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function CreateMachinePage() {
  const [formData, setFormData] = useState({
    name: '',
    machineType: '',
    model: '',
    serialNumber: '',
    condition: '',
    purchaseDate: '',
    purchasePrice: '',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Home</span> <span className="mx-2">/</span> <span>Machines</span> <span className="mx-2">/</span> <span className="font-medium">Create</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create Machine</h1>
        <Link
          href="/contractor/equipment"
          className="rounded-md bg-gray-500 text-white px-4 py-2 text-sm hover:bg-gray-600"
        >
          ← Back to List
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="rounded-lg border border-gray-200 bg-white p-8 space-y-6">
          {/* Name and Type Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NAME <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MACHINE TYPE <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.machineType}
                onChange={(e) => setFormData({ ...formData, machineType: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Machine Type</option>
                <option value="excavator">Excavator</option>
                <option value="crane">Crane</option>
                <option value="mixer">Mixer</option>
                <option value="dozer">Dozer</option>
                <option value="generator">Generator</option>
              </select>
            </div>
          </div>

          {/* Model and Serial Number Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MODEL
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SERIAL NUMBER
              </label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Site and Condition Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SITE
              </label>
              <input
                type="text"
                value="Karen plains Road Project"
                disabled
                className="w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-sm text-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CONDITION <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Condition</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="needs-repair">Needs Repair</option>
              </select>
            </div>
          </div>

          {/* Purchase Date and Price Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PURCHASE DATE
              </label>
              <input
                type="text"
                placeholder="mm/dd/yyyy"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PURCHASE PRICE
              </label>
              <input
                type="text"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Maintenance Dates Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LAST MAINTENANCE DATE
              </label>
              <input
                type="text"
                placeholder="mm/dd/yyyy"
                value={formData.lastMaintenanceDate}
                onChange={(e) => setFormData({ ...formData, lastMaintenanceDate: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NEXT MAINTENANCE DATE
              </label>
              <input
                type="text"
                placeholder="mm/dd/yyyy"
                value={formData.nextMaintenanceDate}
                onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NOTES
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-md bg-primary px-6 py-2 text-white font-medium hover:bg-primary/90"
            >
              💾 Save
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
