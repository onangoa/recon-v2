'use client';

export default function CreateInventoryCategoryPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600">
        <span>Home</span> <span className="mx-2">/</span> <span>Inventory</span> <span className="mx-2">/</span> <span>Inventory Categories</span> <span className="mx-2">/</span> <span className="font-medium">Create Inventory Category</span>
      </div>

      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Create Inventory Category</h1>
        <button className="flex items-center gap-2 rounded-md bg-gray-500 text-white px-4 py-2 text-sm hover:bg-gray-600">
          ← Back
        </button>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <form className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">NAME *</label>
            <input
              type="text"
              placeholder="Enter category name"
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Parent Category Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">PARENT CATEGORY</label>
            <select className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
              <option>None (This will be a parent category)</option>
              <option>Materials</option>
              <option>Equipment</option>
              <option>Tools</option>
            </select>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">DESCRIPTION</label>
            <textarea
              placeholder="Enter category description"
              rows={5}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Parent Category Checkbox */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="parentCategory"
              className="rounded border-gray-300"
            />
            <label htmlFor="parentCategory" className="text-sm text-gray-700">
              This is a parent category (can have subcategories)
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-md bg-primary text-white px-6 py-2 font-medium hover:bg-primary/90"
            >
              💾 Save
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
