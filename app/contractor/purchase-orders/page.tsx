'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  RotateCcw, 
  MoreVertical,
  Pencil,
  Trash2,
  FileText,
  Eye,
  ArrowUpDown,
  Filter,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
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
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useSite } from '@/hooks/use-site';
import { exportToCSV, exportToPDF } from '@/lib/export';

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: {
    id: string;
    name: string;
  };
  total: number;
  status: string;
  orderDate: string;
  items: any[];
}

export default function PurchaseOrdersList() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeSite } = useSite();
  
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Delete states
  const [orderToDelete, setOrderToDelete] = useState<PurchaseOrder | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/web/api/purchase-orders?page=${currentPage}&limit=${limit}&search=${searchQuery}${activeSite ? `&siteId=${activeSite.id}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch purchase orders');
      const data = await response.json();
      setOrders(data.purchaseOrders);
      setTotalPages(data.pagination.pages);
      setTotalCount(data.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else fetchOrders();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeSite]);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, activeSite]);

  const handleDelete = async () => {
    if (!orderToDelete) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/web/api/purchase-orders/${orderToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Deleted",
          description: "Purchase order has been removed",
          variant: "success",
          action: (
            <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          ),
        });
        setIsDeleteDialogOpen(false);
        if (orders.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          fetchOrders();
        }
      } else {
        throw new Error('Failed to delete purchase order');
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
    const data = orders.map(o => ({
      'Order Number': o.orderNumber,
      'Supplier': o.supplier.name,
      'Items': o.items.length,
      'Total (KES)': o.total.toLocaleString(),
      'Date': new Date(o.orderDate).toLocaleDateString(),
      'Status': o.status,
    }));
    exportToCSV(data, `purchase-orders-${new Date().toISOString().split('T')[0]}`);
    toast({ title: "Exported", description: "CSV file downloaded", variant: "success" });
  };

  const handleExportPDF = () => {
    const headers = ['PO #', 'Supplier', 'Items', 'Total (KES)', 'Date', 'Status'];
    const rows = orders.map(o => [
      o.orderNumber,
      o.supplier.name,
      String(o.items.length),
      o.total.toLocaleString(),
      new Date(o.orderDate).toLocaleDateString(),
      o.status.toUpperCase(),
    ]);
    exportToPDF('Purchase Orders', headers, rows, `purchase-orders-${new Date().toISOString().split('T')[0]}`, { 2: { halign: 'center' }, 3: { halign: 'right' } });
    toast({ title: "Exported", description: "PDF file downloaded", variant: "success" });
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Purchase Orders</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Procurement & POs</h1>
          <p className="text-muted-foreground mt-1 text-sm italic">Generate and track official purchase orders for materials and services.</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 h-10" disabled={orders.length === 0}>
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
          <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-white h-10 shadow-sm">
            <Link href="/contractor/purchase-orders/create">
              <Plus className="w-4 h-4" />
              <span>New Purchase Order</span>
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="p-4 md:p-6 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by supplier or PO#..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-none h-10 text-sm shadow-sm"
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 hover:bg-background hover:text-primary transition-colors"
              onClick={fetchOrders}
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
              <p className="text-sm text-muted-foreground italic">Loading purchase orders...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchOrders} className="mt-2 text-destructive hover:text-destructive">
                Try Again
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <ClipboardList className="h-8 w-8 opacity-20" />
              <p className="text-sm italic">No purchase orders found.</p>
              <Button asChild variant="link" className="text-primary p-0">
                <Link href="/contractor/purchase-orders/create">Create your first PO</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">PO Number & Supplier</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Items</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Total Amount</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Date</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="text-right w-[100px] font-bold text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="group hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-primary text-xs uppercase tracking-tighter">{order.orderNumber}</span>
                        <span className="font-semibold text-foreground">{order.supplier.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-sm">
                      {order.items.length}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm">
                      KES {order.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={`
                        text-[10px] font-black uppercase px-2 py-0 border-none
                        ${order.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 
                          order.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 
                          order.status === 'processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}
                      `}>
                        {order.status}
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
                            onClick={() => router.push(`/contractor/purchase-orders/${order.id}`)}
                          >
                            <Eye className="size-4" /> View Order
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer"
                            onClick={() => router.push(`/contractor/purchase-orders/edit/${order.id}`)}
                            disabled={order.status === 'delivered'}
                          >
                            <Pencil className="size-4" /> Edit Order
                          </DropdownMenuItem>
                         
                          <DropdownMenuItem 
                            className="gap-2 text-destructive cursor-pointer"
                            onClick={() => {
                              setOrderToDelete(order);
                              setIsDeleteDialogOpen(true);
                            }}
                            disabled={order.status === 'delivered'}
                          >
                            <Trash2 className="size-4" /> Delete Order
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

        {/* Pagination */}
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

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Purchase Order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete PO <span className="font-bold text-foreground">"{orderToDelete?.orderNumber}"</span>? 
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
              Delete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
