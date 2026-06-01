'use client';

export default function CreateInventoryItemPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Home</span> <span className="mx-2">/</span> <span>Inventory</span> <span className="mx-2">/</span> <span className="font-medium">Create</span>
      </div>

      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Add New Inventory Item</h1>
        <button className="flex items-center gap-2 rounded-md bg-gray-500 text-white px-4 py-2 text-sm hover:bg-gray-600">
          ← Back to List
        </button>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <form className="space-y-6">
          {/* Company and Site */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">COMPANY *</label>
              <input
                type="text"
                defaultValue="test a"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SITE *</label>
              <input
                type="text"
                defaultValue="Karen plains Road Project"
                disabled
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm bg-gray-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Category and Supplier */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CATEGORY *</label>
              <select className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Select Category</option>
                <option>Materials</option>
                <option>Equipment</option>
                <option>Tools</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SUPPLIER</label>
              <select className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
                <option>Select Supplier</option>
                <option>Supplier 1</option>
                <option>Supplier 2</option>
              </select>
            </div>
          </div>

          {/* Name and SKU */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NAME *</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">UNIT *</label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Current Stock and Minimum Stock */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CURRENT STOCK *</label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">MINIMUM STOCK *</label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Unit Price and Location */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">UNIT PRICE *</label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LOCATION</label>
              <input
                type="text"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">STATUS *</label>
            <select className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Active</option>
              <option>Inactive</option>
              <option>Discontinued</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">DESCRIPTION</label>
            <textarea
              rows={4}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-md bg-primary text-white px-6 py-2 font-medium hover:bg-primary/90"
            >
              💾 Save Inventory Item
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
