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
  BadgeInfo,
  PackagePlus,
  AlertTriangle,
  MinusCircle,
  PlusCircle,
  Upload,
  Paperclip,
  X,
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
import { getApiError, getErrorMessage } from '@/lib/toast-utils';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  partiallyReceivedDate?: string;
  receivedInFullDate?: string;
  deliveryNoteUrl?: string;
  deliveryNoteFileName?: string;
  notes?: string;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    receivedQuantity?: number;
    unitPrice: number;
    totalPrice: number;
    materialId?: string;
  }>;
  files?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType?: string | null;
    uploadedAt: string;
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});
  const [receiveNote, setReceiveNote] = useState('');
  const [isDeliverDialogOpen, setIsDeliverDialogOpen] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const [deliverQuantities, setDeliverQuantities] = useState<Record<string, number>>({});
  const [deliverNote, setDeliverNote] = useState('');
  const [itemStatuses, setItemStatuses] = useState<Record<string, 'not_delivered' | 'partial' | 'full' | 'excess'>>({});
  const [deliveryNoteFiles, setDeliveryNoteFiles] = useState<File[]>([]);
  const [isUploadingNote, setIsUploadingNote] = useState(false);
  const [receivePartialDate, setReceivePartialDate] = useState('');
  const [receiveFullDate, setReceiveFullDate] = useState('');
  const [deliverPartialDate, setDeliverPartialDate] = useState('');
  const [deliverFullDate, setDeliverFullDate] = useState('');
  const fetchOrder = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/web/api/purchase-orders/${id}`);
      if (!response.ok) throw new Error('Failed to fetch purchase order');
      const data = await response.json();
      setOrder(data);
    } catch (err: any) {
      setError(getErrorMessage(err, "Unable to load the purchase order details. Please refresh the page and try again."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const uploadDeliveryNotes = async (): Promise<Array<{ fileName: string; fileUrl: string; fileType?: string }>> => {
    if (deliveryNoteFiles.length === 0) return [];
    setIsUploadingNote(true);
    try {
      const uploaded: Array<{ fileName: string; fileUrl: string; fileType?: string }> = [];
      for (const file of deliveryNoteFiles) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/web/api/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Failed to upload delivery note');
        const data = await res.json();
        uploaded.push({
          fileName: data.fileName || file.name,
          fileUrl: data.url || data.fileData || '',
          fileType: data.fileType || file.type || undefined,
        });
      }
      return uploaded;
    } finally {
      setIsUploadingNote(false);
    }
  };

  const markAsDelivered = async () => {
    if (!order) return;
    // Pre-fill each item with the ordered quantity (assume full delivery by default).
    // The user can adjust per item to record partial, excess, or not-delivered.
    const initial: Record<string, number> = {};
    order.items.forEach((item) => {
      initial[item.id] = item.quantity;
    });
    setDeliverQuantities(initial);
    setDeliverNote('');
    setDeliveryNoteFiles([]);
    setDeliverPartialDate('');
    setDeliverFullDate('');
    const statuses: Record<string, 'not_delivered' | 'partial' | 'full' | 'excess'> = {};
    order.items.forEach((item) => {
      statuses[item.id] = 'full';
    });
    setItemStatuses(statuses);
    setIsDeliverDialogOpen(true);
  };

  const computeItemStatus = (received: number, ordered: number): 'not_delivered' | 'partial' | 'full' | 'excess' => {
    if (received <= 0) return 'not_delivered';
    if (received < ordered) return 'partial';
    if (received === ordered) return 'full';
    return 'excess';
  };

  const updateDeliverQuantity = (itemId: string, ordered: number, value: number) => {
    const qty = Math.max(0, value);
    setDeliverQuantities((prev) => ({ ...prev, [itemId]: qty }));
    setItemStatuses((prev) => ({ ...prev, [itemId]: computeItemStatus(qty, ordered) }));
  };

  const submitDelivery = async () => {
    if (!order) return;
    setIsDelivering(true);
    try {
      const uploadedFiles = await uploadDeliveryNotes();
      const payload = {
        note: deliverNote,
        files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
        partiallyReceivedDate: deliverPartialDate || undefined,
        receivedInFullDate: deliverFullDate || undefined,
        items: order.items.map((item) => ({
          id: item.id,
          receivedQuantity: Number(deliverQuantities[item.id] ?? 0) || 0,
        })),
      };

      const response = await fetch(`/web/api/purchase-orders/${id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const summary = order.items.reduce(
          (acc, item) => {
            const r = Number(deliverQuantities[item.id] ?? 0);
            if (r <= 0) acc.notDelivered += 1;
            else if (r < item.quantity) acc.partial += 1;
            else if (r > item.quantity) acc.excess += 1;
            else acc.full += 1;
            return acc;
          },
          { notDelivered: 0, partial: 0, full: 0, excess: 0 }
        );
        toast({
          title: 'Delivery Recorded',
          description: `Full: ${summary.full} · Partial: ${summary.partial} · Excess: ${summary.excess} · Not delivered: ${summary.notDelivered}`,
          variant: 'success',
        });
        setIsDeliverDialogOpen(false);
        fetchOrder();
      } else {
        const errorData = await response.json();
        throw new Error(getApiError(errorData, 'Unable to record the delivery. Please verify the details and try again.'));
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(err, "Unable to record the delivery. Please check your connection and try again."),
        variant: 'destructive',
      });
    } finally {
      setIsDelivering(false);
    }
  };

  const openReceiveDialog = () => {
    if (!order) return;
    const initial: Record<string, number> = {};
    order.items.forEach((item) => {
      initial[item.id] = item.receivedQuantity ?? 0;
    });
    setReceiveQuantities(initial);
    setReceiveNote('');
    setDeliveryNoteFiles([]);
    setReceivePartialDate('');
    setReceiveFullDate('');
    setIsReceiveDialogOpen(true);
  };

  const submitReceive = async () => {
    if (!order) return;
    setIsReceiving(true);
    try {
      const uploadedFiles = await uploadDeliveryNotes();
      const payload = {
        note: receiveNote,
        files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
        partiallyReceivedDate: receivePartialDate || undefined,
        receivedInFullDate: receiveFullDate || undefined,
        items: order.items.map((item) => ({
          id: item.id,
          receivedQuantity: Number(receiveQuantities[item.id] ?? 0) || 0,
        })),
      };

      const response = await fetch(`/web/api/purchase-orders/${id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: 'Stock Recorded',
          description: 'Received quantities saved and inventory updated.',
          variant: 'success',
        });
        setIsReceiveDialogOpen(false);
        fetchOrder();
      } else {
        const errorData = await response.json();
        throw new Error(getApiError(errorData, 'Unable to record the stock received. Please verify the details and try again.'));
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: getErrorMessage(err, "Unable to record the stock received. Please check your connection and try again."),
        variant: 'destructive',
      });
    } finally {
      setIsReceiving(false);
    }
  };

  const handleDelete = async () => {
    if (!order) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/web/api/purchase-orders/${id}`, {
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
        throw new Error('Unable to delete the purchase order. Please try again.');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Unable to delete the purchase order. Please check your connection and try again."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadPdf = async () => {
    if (!order) return;
    setIsDownloading(true);
    try {
      const response = await fetch(`/web/api/purchase-orders/${order.id}/pdf`);
      if (!response.ok) throw new Error('Unable to download the PDF. Please try again.');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PO-${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Unable to download the PDF. Please check your connection and try again."),
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
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
              onClick={openReceiveDialog} 
              disabled={isSubmitting}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Record Stock Received</span>
            </Button>
          )}
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
          {order.status !== 'delivered' && (
            <Button variant="outline" className="gap-2" asChild>
              <Link href={`/contractor/purchase-orders/edit/${order.id}`}>
                <Pencil className="w-4 h-4" />
                <span>Edit</span>
              </Link>
            </Button>
          )}
          {order.status !== 'delivered' && (
            <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </Button>
          )}
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
                    <TableHead className="text-center">Received</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => {
                    const received = item.receivedQuantity ?? 0;
                    const fullyReceived = received >= item.quantity;
                    return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${fullyReceived ? 'text-green-600' : received > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          {fullyReceived && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {received} / {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">KES {item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono font-bold text-sm text-primary">KES {item.totalPrice.toLocaleString()}</TableCell>
                    </TableRow>
                    );
                  })}
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
                  ${order.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 
                    order.status === 'partially_received' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400' :
                    order.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' : 
                    order.status === 'processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}
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
              {order.receivedInFullDate ? (
                <div className="flex justify-between items-center border-t pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <label className="text-xs font-bold uppercase tracking-widest">Received In Full</label>
                  </div>
                  <p className="text-sm font-bold text-green-600">{new Date(order.receivedInFullDate).toLocaleDateString()}</p>
                </div>
              ) : order.partiallyReceivedDate ? (
                <div className="flex justify-between items-center border-t pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <label className="text-xs font-bold uppercase tracking-widest">Partially Received</label>
                  </div>
                  <p className="text-sm font-bold text-amber-600">{new Date(order.partiallyReceivedDate).toLocaleDateString()}</p>
                </div>
              ) : null}
              {((order.files && order.files.length > 0) || order.deliveryNoteUrl) && (
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Paperclip className="w-4 h-4" />
                    <label className="text-xs font-bold uppercase tracking-widest">Delivery Note Files</label>
                  </div>
                  {order.files && order.files.length > 0 ? (
                    <div className="space-y-1.5">
                      {order.files.map((f) => (
                        <a key={f.id} href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border border-muted bg-muted/20 px-3 py-2 hover:bg-muted/40 transition">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm font-medium truncate flex-1">{f.fileName}</span>
                          <span className="text-xs text-muted-foreground">{new Date(f.uploadedAt).toLocaleDateString()}</span>
                        </a>
                      ))}
                    </div>
                  ) : order.deliveryNoteUrl ? (
                    <a href={order.deliveryNoteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border border-muted bg-muted/20 px-3 py-2 hover:bg-muted/40 transition">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-medium truncate flex-1">{order.deliveryNoteFileName || 'View file'}</span>
                    </a>
                  ) : null}
                </div>
              )}
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full gap-2 h-10 border-primary/20 hover:bg-primary/5 text-primary transition-colors" onClick={downloadPdf} disabled={isDownloading}>
                  {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>{isDownloading ? 'Generating...' : 'Download PO PDF'}</span>
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
      {/* Record Stock Received Dialog */}
      <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-primary" /> Record Stock Received
            </DialogTitle>
            <DialogDescription>
              Enter the quantity received for each item. Inventory linked to materials will be updated automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[55vh] overflow-y-auto -mx-2 px-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Ordered</TableHead>
                  <TableHead className="text-center w-32">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => {
                  const received = Number(receiveQuantities[item.id] ?? 0);
                  const fully = received >= item.quantity;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium align-middle">
                        {item.description}
                        {item.materialId ? (
                          <span className="block text-[10px] text-muted-foreground uppercase">Linked to inventory</span>
                        ) : (
                          <span className="block text-[10px] text-muted-foreground uppercase">No inventory link</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center align-middle">{item.quantity}</TableCell>
                      <TableCell className="text-center align-middle">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={receiveQuantities[item.id] ?? 0}
                          onChange={(e) =>
                            setReceiveQuantities({
                              ...receiveQuantities,
                              [item.id]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={`h-9 text-center ${fully ? 'border-green-500 text-green-700' : ''}`}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="receive-note" className="text-xs uppercase tracking-wider">Note (optional)</Label>
            <Input
              id="receive-note"
              value={receiveNote}
              onChange={(e) => setReceiveNote(e.target.value)}
              placeholder="e.g. Delivery note / GRN reference"
            />
          </div>

          {(() => {
            const allFull = order.items.every(item => (Number(receiveQuantities[item.id] ?? 0)) >= item.quantity);
            const anyReceived = order.items.some(item => (Number(receiveQuantities[item.id] ?? 0)) > 0);
            if (!anyReceived) return null;
            return (
              <div className="space-y-1.5">
                <Label htmlFor={allFull ? "receive-full-date" : "receive-partial-date"} className="text-xs uppercase tracking-wider">
                  {allFull ? 'Received In Full Date' : 'Partially Received Date'}
                </Label>
                <Input
                  id={allFull ? "receive-full-date" : "receive-partial-date"}
                  type="date"
                  value={allFull ? receiveFullDate : receivePartialDate}
                  onChange={(e) => allFull ? setReceiveFullDate(e.target.value) : setReceivePartialDate(e.target.value)}
                  className="bg-muted/30 border-none h-10"
                />
              </div>
            );
          })()}

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider">Delivery Note Document(s)</Label>
            {deliveryNoteFiles.length > 0 && (
              <div className="space-y-2">
                {deliveryNoteFiles.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-md border border-muted bg-muted/30 px-3 py-2">
                    <Paperclip className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm truncate flex-1">{f.name}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setDeliveryNoteFiles(deliveryNoteFiles.filter((_, i) => i !== idx))}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-4 text-sm text-muted-foreground transition hover:bg-muted/40">
              <Upload className="w-4 h-4" /> Click to upload delivery note (multiple allowed)
              <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={(e) => setDeliveryNoteFiles(Array.from(e.target.files || []))} />
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReceiveDialogOpen(false)} disabled={isReceiving}>
              Cancel
            </Button>
            <Button onClick={submitReceive} disabled={isReceiving || isUploadingNote} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              {isReceiving || isUploadingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
              Save Received Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Mark as Delivered Dialog */}
      <Dialog open={isDeliverDialogOpen} onOpenChange={setIsDeliverDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-600" /> Record Delivery
            </DialogTitle>
            <DialogDescription>
              Enter the actual quantity received for each item. Record partial, full, excess, or not-delivered items. Status will update automatically.
            </DialogDescription>
          </DialogHeader>

          {order.items.length > 0 && (() => {
            const totals = order.items.reduce(
              (acc, item) => {
                const r = Number(deliverQuantities[item.id] ?? 0);
                if (r <= 0) acc.notDelivered += 1;
                else if (r < item.quantity) acc.partial += 1;
                else if (r > item.quantity) acc.excess += 1;
                else acc.full += 1;
                return acc;
              },
              { notDelivered: 0, partial: 0, full: 0, excess: 0 }
            );
            return (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge className="bg-green-100 text-green-700 border-none">{totals.full} Full</Badge>
                {totals.partial > 0 && <Badge className="bg-amber-100 text-amber-700 border-none">{totals.partial} Partial</Badge>}
                {totals.excess > 0 && <Badge className="bg-purple-100 text-purple-700 border-none">{totals.excess} Excess</Badge>}
                {totals.notDelivered > 0 && <Badge className="bg-red-100 text-red-700 border-none">{totals.notDelivered} Not Delivered</Badge>}
              </div>
            );
          })()}

          <div className="max-h-[50vh] overflow-y-auto -mx-2 px-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-center">Ordered</TableHead>
                  <TableHead className="text-center w-32">Received</TableHead>
                  <TableHead className="text-center w-32">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => {
                  const received = Number(deliverQuantities[item.id] ?? 0);
                  const status = itemStatuses[item.id] || computeItemStatus(received, item.quantity);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium align-middle">
                        {item.description}
                        {item.materialId ? (
                          <span className="block text-[10px] text-muted-foreground uppercase">Linked to inventory</span>
                        ) : (
                          <span className="block text-[10px] text-muted-foreground uppercase">No inventory link</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center align-middle">{item.quantity}</TableCell>
                      <TableCell className="text-center align-middle">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={deliverQuantities[item.id] ?? 0}
                          onChange={(e) => updateDeliverQuantity(item.id, item.quantity, parseFloat(e.target.value) || 0)}
                          className={`h-9 text-center ${
                            status === 'full' ? 'border-green-500' :
                            status === 'partial' ? 'border-amber-500' :
                            status === 'excess' ? 'border-purple-500' :
                            'border-red-300'
                          }`}
                        />
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        {status === 'full' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Full
                          </span>
                        )}
                        {status === 'partial' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                            <AlertTriangle className="w-3.5 h-3.5" /> Partial
                          </span>
                        )}
                        {status === 'excess' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600">
                            <PlusCircle className="w-3.5 h-3.5" /> Excess
                          </span>
                        )}
                        {status === 'not_delivered' && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500">
                            <MinusCircle className="w-3.5 h-3.5" /> Not Delivered
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deliver-note" className="text-xs uppercase tracking-wider">Delivery Note (optional)</Label>
            <Input
              id="deliver-note"
              value={deliverNote}
              onChange={(e) => setDeliverNote(e.target.value)}
              placeholder="e.g. Delivery note #, driver name, GRN reference, discrepancies"
            />
          </div>

          {(() => {
            const allFull = order.items.every(item => (Number(deliverQuantities[item.id] ?? 0)) >= item.quantity);
            const anyReceived = order.items.some(item => (Number(deliverQuantities[item.id] ?? 0)) > 0);
            if (!anyReceived) return null;
            return (
              <div className="space-y-1.5">
                <Label htmlFor={allFull ? "deliver-full-date" : "deliver-partial-date"} className="text-xs uppercase tracking-wider">
                  {allFull ? 'Received In Full Date' : 'Partially Received Date'}
                </Label>
                <Input
                  id={allFull ? "deliver-full-date" : "deliver-partial-date"}
                  type="date"
                  value={allFull ? deliverFullDate : deliverPartialDate}
                  onChange={(e) => allFull ? setDeliverFullDate(e.target.value) : setDeliverPartialDate(e.target.value)}
                  className="bg-muted/30 border-none h-10"
                />
              </div>
            );
          })()}

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider">Upload Delivery Note Document(s)</Label>
            {deliveryNoteFiles.length > 0 && (
              <div className="space-y-2">
                {deliveryNoteFiles.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-md border border-muted bg-muted/30 px-3 py-2">
                    <Paperclip className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm truncate flex-1">{f.name}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setDeliveryNoteFiles(deliveryNoteFiles.filter((_, i) => i !== idx))}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-4 text-sm text-muted-foreground transition hover:bg-muted/40">
              <Upload className="w-4 h-4" /> Click to upload delivery note (multiple allowed)
              <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={(e) => setDeliveryNoteFiles(Array.from(e.target.files || []))} />
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeliverDialogOpen(false)} disabled={isDelivering}>
              Cancel
            </Button>
            <Button onClick={submitDelivery} disabled={isDelivering || isUploadingNote} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              {isDelivering || isUploadingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
              Confirm Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
