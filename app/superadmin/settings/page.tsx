export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Settings</h2>
        <p className="mt-2 text-muted-foreground">
          Configure platform settings and preferences
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* General Settings */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">General Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Platform Name
              </label>
              <input
                type="text"
                defaultValue="Construction Hub"
                className="mt-1 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Support Email
              </label>
              <input
                type="email"
                defaultValue="support@constructionhub.ke"
                className="mt-1 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Default Currency
              </label>
              <select className="mt-1 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground">
                <option>KES - Kenyan Shilling</option>
                <option>USD - US Dollar</option>
                <option>EUR - Euro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Security</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Require 2FA for all users</p>
              </div>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-border" />
                <span className="ml-2 text-sm">Enable</span>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Session Timeout</p>
                <p className="text-xs text-muted-foreground">Auto-logout after 30 minutes</p>
              </div>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-border" defaultChecked />
                <span className="ml-2 text-sm">Enable</span>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground">Email alerts for new contractors</p>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-border" defaultChecked />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground">Weekly platform summary</p>
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-border" defaultChecked />
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button className="rounded-md bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90">
          Save Settings
        </button>
      </div>
    </div>
  );
}
