export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Reports</h2>
        <p className="mt-2 text-muted-foreground">
          Generate and view platform reports
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-2">Revenue Report</h3>
          <p className="text-sm text-muted-foreground">
            View monthly revenue from subscriptions and services
          </p>
          <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Generate
          </button>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-2">Contractor Performance</h3>
          <p className="text-sm text-muted-foreground">
            Analyze contractor metrics and project completion rates
          </p>
          <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Generate
          </button>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-2">Project Analytics</h3>
          <p className="text-sm text-muted-foreground">
            View project completion trends and budget analysis
          </p>
          <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Generate
          </button>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-2">Safety Report</h3>
          <p className="text-sm text-muted-foreground">
            Safety scores and incident tracking across all projects
          </p>
          <button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
