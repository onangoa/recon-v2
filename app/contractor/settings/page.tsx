export default function ContractorSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Settings</h2>
        <p className="mt-2 text-muted-foreground">Manage your contractor account settings</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Company Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Company Name</label>
              <input
                type="text"
                defaultValue="Nairobi Builders Ltd"
                className="mt-1 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">License Number</label>
              <input
                type="text"
                defaultValue="LIC-001-2024"
                className="mt-1 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Location</label>
              <input
                type="text"
                defaultValue="Nairobi"
                className="mt-1 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground">Email notifications</p>
              <input type="checkbox" defaultChecked className="rounded border-border" />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground">Task reminders</p>
              <input type="checkbox" defaultChecked className="rounded border-border" />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground">Safety alerts</p>
              <input type="checkbox" defaultChecked className="rounded border-border" />
            </div>
          </div>
        </div>

        <button className="rounded-md bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90">
          Save Settings
        </button>
      </div>
    </div>
  );
}
