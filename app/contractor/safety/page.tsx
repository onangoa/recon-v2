export default function SafetyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Safety & Compliance</h2>
        <p className="mt-2 text-muted-foreground">Monitor safety metrics and compliance</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-2">Safety Score</h3>
          <p className="text-3xl font-bold text-green-600">92%</p>
          <p className="mt-2 text-xs text-muted-foreground">Excellent performance</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-2">Incidents</h3>
          <p className="text-3xl font-bold text-foreground">2</p>
          <p className="mt-2 text-xs text-muted-foreground">Last 30 days</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground mb-2">Inspections</h3>
          <p className="text-3xl font-bold text-primary">Passed</p>
          <p className="mt-2 text-xs text-muted-foreground">Latest inspection</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Safety compliance interface - detailed tracking coming soon</p>
      </div>
    </div>
  );
}
