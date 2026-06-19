'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  RotateCcw,
  ChevronRight,
  MoreVertical,
  Layers,
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ChevronLeft,
  CheckCircle2,
  MinusCircle,
  Eye,
  Upload,
  Download,
  FileSpreadsheet,
  FileDown
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
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useSite } from '@/hooks/use-site';
import { exportToCSV, exportToPDF } from '@/lib/export';
import CsvImportDialog from '@/components/csv-import-dialog';

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
  description: string | null;
  status: string;
  sku: string | null;
  category: {
    id: string;
    name: string;
  } | null;
  site: {
    id: string;
    name: string;
  };
}

export default function InventoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeSite } = useSite();
  
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Usage recording states
  const [itemForUsage, setItemForUsage] = useState<InventoryItem | null>(null);
  const [isUsageDialogOpen, setIsUsageDialogOpen] = useState(false);
  const [usageQuantity, setUsageQuantity] = useState<string>('');
  const [usageNotes, setUsageNotes] = useState<string>('');

  const fetchInventory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let url = `/api/inventory?page=${currentPage}&limit=${limit}`;
      if (searchQuery) url += `&search=${searchQuery}`;
      if (activeSite) url += `&siteId=${activeSite.id}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      setInventory(data.inventory);
      setTotalPages(data.pagination.pages);
      setTotalCount(data.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordUsage = async () => {
    if (!itemForUsage || !usageQuantity) return;
    
    const qty = parseFloat(usageQuantity);
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity greater than zero",
        variant: "destructive",
      });
      return;
    }

    if (qty > itemForUsage.quantity) {
      toast({
        title: "Insufficient stock",
        description: `Only ${itemForUsage.quantity} ${itemForUsage.unit} available`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/inventory/${itemForUsage.id}/usage`, {
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
          description: `Recorded usage of ${qty} ${itemForUsage.unit}`,
          variant: "success",
        });
        setIsUsageDialogOpen(false);
        setUsageQuantity('');
        setUsageNotes('');
        fetchInventory();
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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else fetchInventory();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeSite]);

  useEffect(() => {
    fetchInventory();
  }, [currentPage]);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/inventory/${itemToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Deleted",
          description: "Inventory item has been removed",
          variant: "success",
          action: (
            <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          ),
        });
        setIsDeleteDialogOpen(false);
        if (inventory.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          fetchInventory();
        }
      } else {
        throw new Error('Failed to delete item');
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

  const handleExportCSV = () => {
    const data = inventory.map(item => ({
      'Name': item.name,
      'Category': item.category?.name || 'Uncategorized',
      'Quantity': String(item.quantity),
      'Unit': item.unit,
      'Min Stock': String(item.minStock),
      'SKU': item.sku || '',
      'Status': item.status,
      'Site': item.site.name,
    }));
    exportToCSV(data, `inventory-${new Date().toISOString().split('T')[0]}`);
    toast({ title: "Exported", description: "CSV file downloaded", variant: "success" });
  };

  const handleExportPDF = () => {
    const headers = ['Name', 'Category', 'Qty', 'Unit', 'Min Stock', 'SKU', 'Status', 'Site'];
    const rows = inventory.map(item => [
      item.name,
      item.category?.name || 'N/A',
      String(item.quantity),
      item.unit,
      String(item.minStock),
      item.sku || 'N/A',
      item.status,
      item.site.name,
    ]);
    exportToPDF('Inventory', headers, rows, `inventory-${new Date().toISOString().split('T')[0]}`, { 2: { halign: 'center' }, 4: { halign: 'center' } });
    toast({ title: "Exported", description: "PDF file downloaded", variant: "success" });
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Inventory</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Inventory Management</h1>
          <p className="text-muted-foreground mt-1 text-sm italic">Track and manage site materials and equipment stock levels.</p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={inventory.length === 0}>
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="w-4 h-4" /> Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
                <FileDown className="w-4 h-4" /> Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/contractor/inventory/categories">
              <Layers className="w-4 h-4" />
              <span>Manage Categories</span>
            </Link>
          </Button>
          <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-white">
            <Link href="/contractor/inventory/create">
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" disabled={!activeSite} onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="p-4 md:p-6 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-none h-10 text-sm shadow-sm"
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 hover:bg-background hover:text-primary transition-colors"
              onClick={fetchInventory}
              disabled={isLoading}
            >
              <RotateCcw className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground italic">Loading inventory...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchInventory} className="mt-2 text-destructive hover:text-destructive">
                Try Again
              </Button>
            </div>
          ) : inventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Package className="h-8 w-8 opacity-20" />
              <p className="text-sm italic">No inventory items found.</p>
              <Button asChild variant="link" className="text-primary p-0">
                <Link href="/contractor/inventory/create">Create your first item</Link>
              </Button>
            </div>
          ) : (
            <Table>
               <TableHeader className="bg-muted/30">
                 <TableRow>
                   <TableHead className="font-bold text-xs uppercase">Item Name</TableHead>
                   <TableHead className="font-bold text-xs uppercase">Category</TableHead>
                   <TableHead className="font-bold text-xs uppercase text-center">Quantity</TableHead>
                   <TableHead className="font-bold text-xs uppercase text-center">Unit</TableHead>
                   <TableHead className="font-bold text-xs uppercase text-center">Min Stock</TableHead>
                   <TableHead className="font-bold text-xs uppercase text-center">Status</TableHead>
                   <TableHead className="text-right w-[100px] font-bold text-xs uppercase">Actions</TableHead>
                 </TableRow>
               </TableHeader>
              <TableBody>
                {inventory.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <Link href={`/contractor/inventory/${item.id}`} className="flex items-center gap-3 group/link">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover/link:bg-primary/20 transition-colors">
                          <Package className="size-4 text-primary" />
                        </div>
                        <span className="font-bold text-sm text-foreground group-hover/link:text-primary transition-colors">{item.name}</span>
                      </Link>
                    </TableCell>
                     <TableCell>
                       {item.category ? (
                         <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] font-black uppercase px-2 py-0">
                           {item.category.name}
                         </Badge>
                       ) : (
                         <span className="text-xs text-muted-foreground">-</span>
                       )}
                     </TableCell>
                     <TableCell className="text-center font-bold text-sm">
                       {item.quantity}
                     </TableCell>
                     <TableCell className="text-center">
                       <span className="text-xs text-muted-foreground">{item.unit}</span>
                     </TableCell>
                     <TableCell className="text-center font-bold text-sm">
                       {item.minStock}
                     </TableCell>
                     <TableCell className="text-center">
                       <Badge 
                         variant={item.status === 'in-stock' ? 'default' : 'secondary'}
                         className={item.status === 'in-stock' 
                           ? 'text-[10px] font-black uppercase px-2 py-0 bg-green-100 text-green-700' 
                           : 'text-[10px] font-black uppercase px-2 py-0 bg-red-100 text-red-700'
                         }
                       >
                         {item.status}
                       </Badge>
                     </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer"
                            onClick={() => {
                              router.push(`/contractor/inventory/${item.id}`);
                            }}
                          >
                            <Eye className="size-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer text-amber-600"
                            onClick={() => {
                              setItemForUsage(item);
                              setIsUsageDialogOpen(true);
                            }}
                          >
                            <MinusCircle className="size-4" /> Record Usage
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer"
                            onClick={() => {
                              router.push(`/contractor/inventory/edit/${item.id}`);
                            }}
                          >
                            <Pencil className="size-4" /> Edit Item
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 text-destructive cursor-pointer"
                            onClick={() => {
                              setItemToDelete(item);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="size-4" /> Delete Item
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-muted/5">
            <p className="text-sm text-muted-foreground italic">
              Showing <span className="font-bold">{(currentPage - 1) * limit + 1}</span> to <span className="font-bold">{Math.min(currentPage * limit, totalCount)}</span> of <span className="font-bold">{totalCount}</span> results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
                className="gap-1 h-8 px-3"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={currentPage === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(p)}
                    disabled={isLoading}
                    className={`h-8 w-8 p-0 ${currentPage === p ? 'bg-primary text-white' : ''}`}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || isLoading}
                className="gap-1 h-8 px-3"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Item
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-bold text-foreground">"{itemToDelete?.name}"</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Usage Dialog */}
      <Dialog open={isUsageDialogOpen} onOpenChange={setIsUsageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <MinusCircle className="w-5 h-5" /> Record Usage
            </DialogTitle>
            <DialogDescription>
              Record how much of <span className="font-bold text-foreground">"{itemForUsage?.name}"</span> has been used.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Use ({itemForUsage?.unit})</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0.00"
                value={usageQuantity}
                onChange={(e) => setUsageQuantity(e.target.value)}
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground italic">
                Current stock: {itemForUsage?.quantity} {itemForUsage?.unit}
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

      <CsvImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        title="Inventory Items"
        description="Upload a CSV file to bulk import inventory items. Download the template for the required format."
        columns={[
          { key: 'name', label: 'Name', required: true },
          { key: 'quantity', label: 'Quantity', required: true },
          { key: 'unit', label: 'Unit', required: true },
          { key: 'minStock', label: 'Min Stock', required: false },
          { key: 'sku', label: 'SKU', required: false },
          { key: 'description', label: 'Description', required: false },
          { key: 'status', label: 'Status', required: false },
          { key: 'categoryId', label: 'Category ID', required: false },
        ]}
        templateRows={[
          { name: 'Cement Bags', quantity: '500', unit: 'bags', minStock: '100', sku: 'CMT-001', description: 'Portland cement', status: 'In Stock', categoryId: '' },
          { name: 'Steel Rods', quantity: '200', unit: 'pieces', minStock: '50', sku: 'STL-002', description: 'Reinforcement steel', status: 'In Stock', categoryId: '' },
        ]}
        endpoint="/api/inventory/import"
        requestBodyKey="items"
        extraBody={activeSite ? { siteId: activeSite.id } : undefined}
        onSuccess={() => { fetchInventory(); toast({ title: "Import Complete", description: "Inventory items imported successfully", variant: "success" }); }}
      />
    </div>
  );
}