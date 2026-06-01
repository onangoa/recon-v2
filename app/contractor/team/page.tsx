export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Team Management</h2>
          <p className="mt-2 text-muted-foreground">Manage team members and roles</p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90">
          + Add Member
        </button>
      </div>
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Team management interface - member assignment coming soon</p>
      </div>
    </div>
  );
}
