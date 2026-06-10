'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Package, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCcw,
  Loader2, 
  AlertCircle,
  Calendar,
  Layers,
  Building2,
  Tag,
  Pencil,
  Plus,
  MinusCircle
} from 'lucide-react';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface StockMovement {
  id: string;
  quantity: number;
  change: number;
  type: string;
  notes: string | null;
  createdAt: string;
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  supplier: string | null;
  status: string;
  categoryRel: {
    id: string;
    name: string;
  } | null;
  movements: StockMovement[];
}

export default function InventoryItemView() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Usage recording states
  const [isUsageDialogOpen, setIsUsageDialogOpen] = useState(false);
  const [usageQuantity, setUsageQuantity] = useState<string>('');
  const [usageNotes, setUsageNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItem = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/inventory/${id}`);
      if (!response.ok) throw new Error('Failed to fetch item details');
      const data = await response.json();
      setItem(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchItem();
  }, [id]);

  const handleRecordUsage = async () => {
    if (!item || !usageQuantity) return;
    
    const qty = parseFloat(usageQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity greater than zero",
        variant: "destructive",
      });
      return;
    }

    if (qty > item.quantity) {
      toast({
        title: "Insufficient stock",
        description: `Only ${item.quantity} ${item.unit} available`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/inventory/${item.id}/usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: qty,
          notes: usageNotes,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Recorded usage of ${qty} ${item.unit}`,
          variant: "success",
        });
        setIsUsageDialogOpen(false);
        setUsageQuantity('');
        setUsageNotes('');
        fetchItem();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to record usage');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground italic">Loading item details...</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-medium">{error || 'Item not found'}</p>
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mt-2">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor/inventory">Inventory</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{item.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="h-10 w-10">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary">{item.name}</h1>
              <p className="text-muted-foreground text-sm italic">Inventory item details and movement history.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsUsageDialogOpen(true)}
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <MinusCircle className="w-4 h-4" />
            <span>Record Usage</span>
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href={`/contractor/inventory/edit/${item.id}`}>
              <Pencil className="w-4 h-4" />
              <span>Edit Item</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Stock Movements
              </CardTitle>
              <CardDescription>History of all stock additions, deductions, and adjustments.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">
                        No movement history found for this item.
                      </TableCell>
                    </TableRow>
                  ) : (
                    item.movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(movement.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`
                            text-[10px] font-black uppercase px-2 py-0 border-none
                            ${movement.type === 'in' ? 'bg-emerald-500/10 text-emerald-600' : 
                              movement.type === 'out' ? 'bg-amber-500/10 text-amber-600' : 
                              'bg-blue-500/10 text-blue-600'}
                          `}>
                            <div className="flex items-center gap-1">
                              {movement.type === 'in' ? <ArrowDownLeft className="w-3 h-3" /> : 
                               movement.type === 'out' ? <ArrowUpRight className="w-3 h-3" /> : 
                               <RefreshCcw className="w-3 h-3" />}
                              {movement.type}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-bold ${movement.change > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {movement.change > 0 ? '+' : ''}{movement.change}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {movement.quantity}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {movement.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-end border-b pb-4">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">In Stock</label>
                  <p className="text-3xl font-black text-primary">{item.quantity} <span className="text-sm font-medium text-muted-foreground">{item.unit}</span></p>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`text-[10px] font-black uppercase px-2 py-0 border-none mb-1 ${
                    item.status === 'received' ? 'bg-green-500/10 text-green-600' :
                    item.status === 'ordered' ? 'bg-blue-500/10 text-blue-600' :
                    'bg-yellow-500/10 text-yellow-600'
                  }`}
                >
                  {item.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Unit Cost</label>
                  <p className="font-bold">KSh {item.unitCost.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Total Value</label>
                  <p className="font-bold">KSh {item.totalCost.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Categorization
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Category</label>
                <div className="flex items-center gap-2 mt-1">
                  {item.categoryRel ? (
                    <Badge variant="outline" className="text-xs font-bold px-3 py-1">
                      {item.categoryRel.name}
                    </Badge>
                  ) : (
                    <span className="text-sm italic text-muted-foreground">Uncategorized</span>
                  )}
                </div>
              </div>
              {item.supplier && (
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Primary Supplier</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.supplier}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Usage Dialog */}
      <Dialog open={isUsageDialogOpen} onOpenChange={setIsUsageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <MinusCircle className="w-5 h-5" /> Record Usage
            </DialogTitle>
            <DialogDescription>
              Record how much of <span className="font-bold text-foreground">"{item.name}"</span> has been used.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Use ({item.unit})</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0.00"
                value={usageQuantity}
                onChange={(e) => setUsageQuantity(e.target.value)}
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground italic">
                Current stock: {item.quantity} {item.unit}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Where was this used? (e.g., Section A foundation)"
                value={usageNotes}
                onChange={(e) => setUsageNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUsageDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleRecordUsage} 
              disabled={isSubmitting || !usageQuantity}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm Usage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
