'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Package, 
  Loader2, 
  AlertCircle,
  Layers,
  Tag,
  Pencil,
  MinusCircle,
  Box,
  ArrowRight,
  Check,
  X,
  Clock,
  History,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  RefreshCcw
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StockMovement {
  id: string;
  quantity: number;
  change: number;
  type: string;
  notes: string | null;
  createdAt: string;
}

interface StockTransfer {
  id: string;
  quantity: number;
  status: string;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: string;
  approvedAt: string | null;
  fromSite: {
    id: string;
    name: string;
    location: string;
  };
  toSite: {
    id: string;
    name: string;
    location: string;
  };
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
  description: string | null;
  status: string;
  sku: string | null;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
  } | null;
  site: {
    id: string;
    name: string;
  };
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
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);
  
  const [isUsageDialogOpen, setIsUsageDialogOpen] = useState(false);
  const [usageQuantity, setUsageQuantity] = useState<string>('');
  const [usageNotes, setUsageNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [transferQuantity, setTransferQuantity] = useState<string>('');
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [toSiteId, setToSiteId] = useState<string>('');
  const [sites, setSites] = useState<any[]>([]);

  const [isStockInDialogOpen, setIsStockInDialogOpen] = useState(false);
  const [stockInQuantity, setStockInQuantity] = useState<string>('');
  const [stockInNotes, setStockInNotes] = useState<string>('');

  const fetchItem = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/inventory/${id}`);
      if (!response.ok) throw new Error('Failed to fetch item details');
      const data = await response.json();
      setItem(data);
      
      fetchTransfers();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransfers = async () => {
    setIsLoadingTransfers(true);
    try {
      const response = await fetch(`/api/inventory/${id}/transfers`);
      if (!response.ok) throw new Error('Failed to fetch transfers');
      const data = await response.json();
      setTransfers(data);
    } catch (err: any) {
      console.error('Failed to fetch transfers:', err);
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites');
      if (!response.ok) throw new Error('Failed to fetch sites');
      const data = await response.json();
      setSites(data.sites || []);
    } catch (err: any) {
      console.error('Failed to fetch sites:', err);
      setSites([]);
    }
  };

  useEffect(() => {
    if (id) fetchItem();
    fetchSites();
  }, [id]);

  const handleCreateTransfer = async () => {
    if (!item || !transferQuantity || !toSiteId) return;
    
    const qty = parseFloat(transferQuantity);
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

    if (toSiteId === item.site.id) {
      toast({
        title: "Invalid destination",
        description: "Cannot transfer to the same site",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/inventory/${item.id}/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toSiteId,
          quantity: qty,
          notes: transferNotes,
        }),
      });

      if (response.ok) {
        toast({
          title: "Transfer Request Created",
          description: `Stock transfer request submitted for approval`,
          variant: "success",
        });
        setIsTransferDialogOpen(false);
        setTransferQuantity('');
        setTransferNotes('');
        setToSiteId('');
        fetchItem();
        fetchTransfers();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create transfer');
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

  const handleApproveTransfer = async (transferId: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/inventory/${id}/transfers/${transferId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (response.ok) {
        toast({
          title: "Transfer Approved",
          description: "Stock transfer has been completed",
          variant: "success",
        });
        fetchItem();
        fetchTransfers();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve transfer');
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

  const handleRejectTransfer = async (transferId: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/inventory/${id}/transfers/${transferId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejectionReason: 'Rejected by user' }),
      });

      if (response.ok) {
        toast({
          title: "Transfer Rejected",
          description: "Stock transfer request has been rejected",
          variant: "success",
        });
        fetchTransfers();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject transfer');
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

  const handleRecordStockIn = async () => {
    if (!item || !stockInQuantity) return;
    
    const qty = parseFloat(stockInQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity greater than zero",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/inventory/${item.id}/stock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: qty,
          notes: stockInNotes,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Added ${qty} ${item.unit} to stock`,
          variant: "success",
        });
        setIsStockInDialogOpen(false);
        setStockInQuantity('');
        setStockInNotes('');
        fetchItem();
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to record stock in');
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
              <p className="text-muted-foreground text-sm italic">Inventory item details.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsStockInDialogOpen(true)}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Stock In</span>
          </Button>
          <Button 
            onClick={() => setIsTransferDialogOpen(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Transfer Stock</span>
          </Button>
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
                <Box className="w-5 h-5 text-primary" />
                Item Details
              </CardTitle>
              <CardDescription>Basic information about this inventory item.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {item.description && (
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Description</label>
                  <p className="text-sm mt-1">{item.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">SKU</label>
                  <p className="text-sm font-mono mt-1">{item.sku || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Site</label>
                  <p className="text-sm mt-1">{item.site.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Created</label>
                  <p className="text-sm mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Last Updated</label>
                  <p className="text-sm mt-1">{new Date(item.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

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

          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-primary" />
                Stock Transfers
              </CardTitle>
              <CardDescription>History of stock transfers between sites.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingTransfers ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : transfers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Box className="h-8 w-8 opacity-20 mb-2" />
                  <p className="text-sm italic">No stock transfers found.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs uppercase">From</TableHead>
                      <TableHead className="text-xs uppercase">To</TableHead>
                      <TableHead className="text-xs uppercase text-right">Quantity</TableHead>
                      <TableHead className="text-xs uppercase">Status</TableHead>
                      <TableHead className="text-xs uppercase">Date</TableHead>
                      <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfers.map((transfer) => (
                      <TableRow key={transfer.id} className="hover:bg-muted/20">
                        <TableCell className="text-sm">
                          <div className="font-medium">{transfer.fromSite.name}</div>
                          <div className="text-xs text-muted-foreground">{transfer.fromSite.location}</div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="font-medium">{transfer.toSite.name}</div>
                          <div className="text-xs text-muted-foreground">{transfer.toSite.location}</div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-sm">
                          {transfer.quantity} {item?.unit}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={`
                              text-[10px] font-black uppercase px-2 py-0 border-none
                              ${transfer.status === 'approved' ? 'bg-green-500/10 text-green-600' : 
                                transfer.status === 'rejected' ? 'bg-red-500/10 text-red-600' : 
                                'bg-amber-500/10 text-amber-600'}
                            `}
                          >
                            {transfer.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {transfer.status === 'approved' && <Check className="w-3 h-3 mr-1" />}
                            {transfer.status === 'rejected' && <X className="w-3 h-3 mr-1" />}
                            {transfer.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(transfer.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {transfer.status === 'pending' && (
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-green-500/10 text-green-600"
                                onClick={() => handleApproveTransfer(transfer.id)}
                                disabled={isSubmitting}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-red-500/10 text-red-600"
                                onClick={() => handleRejectTransfer(transfer.id)}
                                disabled={isSubmitting}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
                    item.status === 'in-stock' ? 'bg-green-500/10 text-green-600' :
                    'bg-red-500/10 text-red-600'
                  }`}
                >
                  {item.status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Minimum Stock</label>
                  <p className="font-bold">{item.minStock} {item.unit}</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Stock Level</label>
                  <p className={`font-bold ${item.quantity <= item.minStock ? 'text-red-600' : 'text-green-600'}`}>
                    {item.quantity <= item.minStock ? 'Low' : 'Good'}
                  </p>
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
                  {item.category ? (
                    <Badge variant="outline" className="text-xs font-bold px-3 py-1">
                      {item.category.name}
                    </Badge>
                  ) : (
                    <span className="text-sm italic text-muted-foreground">Uncategorized</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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

      <Dialog open={isStockInDialogOpen} onOpenChange={setIsStockInDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Plus className="w-5 h-5" /> Stock In
            </DialogTitle>
            <DialogDescription>
              Add stock to <span className="font-bold text-foreground">"{item?.name}"</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="stockInQuantity">Quantity to Add ({item?.unit})</Label>
              <Input
                id="stockInQuantity"
                type="number"
                placeholder="0.00"
                value={stockInQuantity}
                onChange={(e) => setStockInQuantity(e.target.value)}
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground italic">
                Current stock: {item?.quantity} {item?.unit}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockInNotes">Notes</Label>
              <Textarea
                id="stockInNotes"
                placeholder="Source of stock (e.g., Purchase, Return)"
                value={stockInNotes}
                onChange={(e) => setStockInNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStockInDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleRecordStockIn} 
              disabled={isSubmitting || !stockInQuantity}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <ArrowRight className="w-5 h-5" /> Transfer Stock
            </DialogTitle>
            <DialogDescription>
              Transfer stock of <span className="font-bold text-foreground">"{item?.name}"</span> to another site.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="site">Destination Site</Label>
              <Select value={toSiteId} onValueChange={setToSiteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination site" />
                </SelectTrigger>
                <SelectContent>
                  {sites
                    .filter(site => site.id !== item?.site.id)
                    .map(site => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name} - {site.location}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Transfer ({item?.unit})</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0.00"
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(e.target.value)}
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground italic">
                Available: {item?.quantity} {item?.unit}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Reason for transfer (optional)"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTransfer} 
              disabled={isSubmitting || !transferQuantity || !toSiteId}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Transfer Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
