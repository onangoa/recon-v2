'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function CreateLicensePage() {
  const [formData, setFormData] = useState({
    licenseNumber: '',
    licenseType: '',
    issuingAuthority: '',
    issueDate: '',
    expiryDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Home</span> <span className="mx-2">/</span> <span>Licenses</span> <span className="mx-2">/</span> <span className="font-medium">Create</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create License</h1>
        <Link
          href="/contractor/licenses"
          className="rounded-md bg-gray-500 text-white px-4 py-2 text-sm hover:bg-gray-600"
        >
          ← Back to List
        </Link>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="rounded-lg border border-gray-200 bg-white p-8 space-y-6">
          {/* License Number and Type Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LICENSE NUMBER <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LICENSE TYPE <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.licenseType}
                onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select License Type</option>
                <option value="contractor">Contractor License</option>
                <option value="safety">Safety Certificate</option>
                <option value="environmental">Environmental License</option>
              </select>
            </div>
          </div>

          {/* Issuing Authority and Site Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ISSUING AUTHORITY <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.issuingAuthority}
                onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
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
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ISSUE DATE <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="mm/dd/yyyy"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                EXPIRY DATE <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="mm/dd/yyyy"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DOCUMENT
            </label>
            <div className="flex items-center gap-4">
              <button type="button" className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Choose File
              </button>
              <span className="text-sm text-gray-600">No file chosen</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Allowed formats: PDF, DOC, DOCX, JPG, JPEG, PNG (Max: 10MB)
            </p>
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
