'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  PackageCheck, 
  Download, 
  Pencil, 
  Trash2, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  Building2,
  FileText,
  BadgeInfo
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
import { useToast } from '@/hooks/use-toast';
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

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  total: number;
  subtotal: number;
  tax: number;
  status: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  notes?: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export default function PurchaseOrderView() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchOrder = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/purchase-orders/${id}`);
      if (!response.ok) throw new Error('Failed to fetch purchase order');
      const data = await response.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const markAsDelivered = async () => {
    if (!order) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/purchase-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
      });

      if (response.ok) {
        toast({
          title: "Updated",
          description: "Order marked as delivered and inventory updated",
          variant: "success",
        });
        fetchOrder();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
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

  const handleDelete = async () => {
    if (!order) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/purchase-orders/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Deleted",
          description: "Purchase order has been removed",
          variant: "success",
        });
        router.push('/contractor/purchase-orders');
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground italic">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-medium">{error || 'Order not found'}</p>
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
            <BreadcrumbLink href="/contractor/purchase-orders">Purchase Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{order.orderNumber}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="h-10 w-10">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">PO: {order.orderNumber}</h1>
            <p className="text-muted-foreground text-sm italic">Detailed view of your procurement order.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {order.status !== 'delivered' && (
            <Button 
              onClick={markAsDelivered} 
              disabled={isSubmitting}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
              <span>Mark as Delivered</span>
            </Button>
          )}
          <Button variant="outline" className="gap-2" asChild>
            <Link href={`/contractor/purchase-orders/edit/${order.id}`}>
              <Pencil className="w-4 h-4" />
              <span>Edit</span>
            </Link>
          </Button>
          <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right font-mono text-sm">KES {item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-sm text-primary">KES {item.totalPrice.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-6 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">KES {order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-mono">KES {order.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span className="text-primary uppercase tracking-wider">Total</span>
                  <span className="text-primary font-mono font-black">KES {order.total.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card className="border-none shadow-md">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BadgeInfo className="w-5 h-5 text-primary" />
                  Notes & Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Supplier Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Supplier Name</label>
                <p className="font-bold text-lg">{order.supplier.name}</p>
              </div>
              {order.supplier.email && (
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Email Address</label>
                  <p className="text-sm font-medium">{order.supplier.email}</p>
                </div>
              )}
              {order.supplier.phone && (
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Phone Number</label>
                  <p className="text-sm font-medium">{order.supplier.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg flex items-center gap-2">
                <BadgeInfo className="w-5 h-5 text-primary" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Status</label>
                <Badge variant="secondary" className={`
                  text-[10px] font-black uppercase px-2 py-0 border-none
                  ${order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-600' : 
                    order.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 
                    'bg-red-500/10 text-red-600'}
                `}>
                  {order.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center border-t pt-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <label className="text-xs font-bold uppercase tracking-widest">Order Date</label>
                </div>
                <p className="text-sm font-bold">{new Date(order.orderDate).toLocaleDateString()}</p>
              </div>
              {order.expectedDeliveryDate && (
                <div className="flex justify-between items-center border-t pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <label className="text-xs font-bold uppercase tracking-widest">Expected Delivery</label>
                  </div>
                  <p className="text-sm font-bold">{new Date(order.expectedDeliveryDate).toLocaleDateString()}</p>
                </div>
              )}
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full gap-2 h-10 border-primary/20 hover:bg-primary/5 text-primary transition-colors">
                  <Download className="w-4 h-4" />
                  <span>Download PO PDF</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Purchase Order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete PO <span className="font-bold text-foreground">"{order.orderNumber}"</span>? 
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
