'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  RotateCcw, 
  Package,
  Calendar,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
  ChevronLeft
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
import { useSite } from '@/hooks/use-site';
import { getErrorMessage } from '@/lib/toast-utils';

interface PurchaseOrderItem {
  id: string;
  description: string;
  quantity: number;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: {
    name: string;
  };
  expectedDeliveryDate: string;
  orderDate: string;
  status: string;
  items: PurchaseOrderItem[];
}

export default function MaterialsPage() {
  const { activeSite } = useSite();
  const [deliveries, setDeliveries] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const fetchDeliveries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/web/api/purchase-orders?status=delivered&page=${currentPage}&limit=${limit}&search=${searchQuery}${activeSite ? `&siteId=${activeSite.id}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch deliveries');
      const data = await response.json();
      setDeliveries(data.purchaseOrders);
      setTotalPages(data.pagination.pages);
      setTotalCount(data.pagination.total);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Unable to load materials. Please refresh the page and try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [currentPage, searchQuery, activeSite]);

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
            <BreadcrumbPage>Material Deliveries</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Material Supply Chain</h1>
          <p className="text-muted-foreground mt-1 text-sm italic">Track and verify all materials delivered to your project sites.</p>
        </div>
        <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-white h-10 shadow-sm">
          <Link href="/contractor/purchase-orders">
            <Plus className="w-4 h-4" />
            <span>Manage Orders</span>
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="p-4 md:p-6 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by PO# or supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-none h-10 text-sm shadow-sm"
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 hover:bg-background hover:text-primary transition-colors"
              onClick={fetchDeliveries}
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
              <p className="text-sm text-muted-foreground italic">Loading deliveries...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchDeliveries} className="mt-2 text-destructive hover:text-destructive">
                Try Again
              </Button>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Truck className="h-8 w-8 opacity-20" />
              <p className="text-sm italic">No deliveries found.</p>
              <Button asChild variant="link" className="text-primary p-0">
                <Link href="/contractor/purchase-orders">Go to Purchase Orders</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Item Details & PO#</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Qty</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Supplier</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Delivery Date</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="text-right w-[80px] font-bold text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow key={delivery.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1.5 bg-primary/10 rounded">
                          <Package className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground text-sm">
                            {delivery.items.map(i => i.description).join(', ')}
                          </span>
                          <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{delivery.orderNumber}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-black text-sm text-foreground">
                      {delivery.items.reduce((sum, i) => sum + i.quantity, 0)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-foreground">{delivery.supplier.name}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center text-[10px] text-muted-foreground font-medium bg-muted/30 py-1 rounded-md px-2">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(delivery.expectedDeliveryDate || delivery.orderDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-[10px] uppercase font-black px-2 py-0 border-none bg-emerald-500/10 text-emerald-600">
                        Received
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="gap-2 text-primary hover:bg-primary/5" asChild>
                        <Link href={`/contractor/purchase-orders/${delivery.id}`}>
                          <FileText className="w-4 h-4" />
                          <span className="text-xs font-bold">View</span>
                        </Link>
                      </Button>
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
    </div>
  );
}
