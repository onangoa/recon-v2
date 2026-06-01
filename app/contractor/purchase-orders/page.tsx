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
  Download
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
import { Skeleton } from '@/components/ui/skeleton';

interface PurchaseOrder {
  id: string;
  supplier: string;
  totalAmount: number;
  status: string;
  date: string;
  itemsCount: number;
}

export default function PurchaseOrdersList() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setTimeout(() => {
      setOrders([
        { id: 'PO-2026-001', supplier: 'BuildMart Supplies', totalAmount: 45000, status: 'Completed', date: '2026-05-15', itemsCount: 12 },
        { id: 'PO-2026-002', supplier: 'Steel & Co', totalAmount: 125000, status: 'Pending', date: '2026-05-20', itemsCount: 5 },
        { id: 'PO-2026-003', supplier: 'Cement Industries', totalAmount: 85000, status: 'Completed', date: '2026-05-25', itemsCount: 20 },
        { id: 'PO-2026-004', supplier: 'Nairobi Glass Works', totalAmount: 62000, status: 'Cancelled', date: '2026-05-28', itemsCount: 8 },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

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
          <p className="text-muted-foreground mt-1">Generate and track official purchase orders for materials and services.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
          <Button asChild className="gap-2 bg-primary hover:bg-primary/90">
            <Link href="/contractor/purchase-orders/create">
              <Plus className="w-4 h-4" />
              <span>New Purchase Order</span>
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by supplier or PO#..."
                  className="pl-10 bg-background border-none h-9 text-sm"
                />
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Filter className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold text-xs uppercase tracking-wider">PO Number & Supplier</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Items</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Total Amount</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Date</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                <TableHead className="text-right w-[80px] font-bold text-xs uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-10 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ClipboardList className="w-8 h-8 text-muted-foreground opacity-20" />
                      <p className="text-muted-foreground font-medium">No purchase orders found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className="group hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-primary text-xs uppercase tracking-tighter">{order.id}</span>
                        <span className="font-semibold text-foreground">{order.supplier}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {order.itemsCount}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      KES {order.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {order.date}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={`
                        ${order.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                          order.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                          'bg-red-50 text-red-700 border-red-100'}
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
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="gap-2">
                            <Eye className="w-4 h-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Download className="w-4 h-4" /> Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive">
                            <Trash2 className="w-4 h-4" /> Delete PO
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
