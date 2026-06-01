'use client';

export default function CreateSupplierPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Home</span> <span className="mx-2">/</span> <span>Suppliers</span> <span className="mx-2">/</span> <span className="font-medium">Create</span>
      </div>

      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create Supplier</h1>
        <button className="flex items-center gap-2 rounded-md bg-gray-500 text-white px-4 py-2 text-sm hover:bg-gray-600">
          ← Back to List
        </button>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <form className="space-y-6">
          {/* Name and Contact Person */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NAME *</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CONTACT PERSON</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-MAIL</label>
              <input
                type="email"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PHONE</label>
              <input
                type="tel"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ADDRESS</label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* KRA PIN and Payment Terms */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">KRA PIN</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PAYMENT TERMS</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">NOTES</label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-md bg-primary text-white px-6 py-2 font-medium hover:bg-primary/90"
            >
              💾 Save Supplier
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md bg-gray-500 text-white px-6 py-2 font-medium hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
