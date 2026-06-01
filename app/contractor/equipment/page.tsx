export default function EquipmentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Equipment Management</h2>
          <p className="mt-2 text-muted-foreground">Track equipment and machinery</p>
        </div>
        <button className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90">
          + Add Equipment
        </button>
      </div>
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Equipment tracking interface - detailed management coming soon</p>
      </div>
    </div>
  );
}
