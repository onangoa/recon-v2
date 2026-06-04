'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Package
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
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  materialId?: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  name: string;
  unitCost: number;
  unit: string;
}

export default function EditPurchaseOrder() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;
  
  const [formData, setFormData] = useState({
    orderNumber: '',
    supplierId: '',
    orderDate: '',
    expectedDeliveryDate: '',
    status: 'pending',
    notes: '',
  });
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, inventoryRes, poRes] = await Promise.all([
          fetch('/api/suppliers?limit=100'),
          fetch('/api/inventory?limit=1000'),
          fetch(`/api/purchase-orders/${id}`)
        ]);
        
        const suppliersData = await suppliersRes.json();
        if (suppliersData.suppliers) setSuppliers(suppliersData.suppliers);

        const inventoryData = await inventoryRes.json();
        if (inventoryData.inventory) setInventoryItems(inventoryData.inventory);

        const poData = await poRes.json();
        if (poRes.ok) {
          setFormData({
            orderNumber: poData.orderNumber,
            supplierId: poData.supplierId,
            orderDate: poData.orderDate ? new Date(poData.orderDate).toISOString().split('T')[0] : '',
            expectedDeliveryDate: poData.expectedDeliveryDate ? new Date(poData.expectedDeliveryDate).toISOString().split('T')[0] : '',
            status: poData.status,
            notes: poData.notes || '',
          });
          setItems(poData.items.map((item: any) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            materialId: item.materialId || undefined,
          })));
        } else {
          throw new Error(poData.error || 'Failed to fetch purchase order');
        }
      } catch (error: any) {
        console.error('Failed to fetch data:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load purchase order",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const addItem = () => {
    setItems([...items, {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      quantity: 1,
      unitPrice: 0
    }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    if (field === 'materialId') {
      const selectedItem = inventoryItems.find(i => i.id === value);
      if (selectedItem) {
        setItems(items.map(item =>
          item.id === id ? { 
            ...item, 
            materialId: value, 
            description: selectedItem.name,
            unitPrice: selectedItem.unitPrice || selectedItem.unitCost || 0
          } : item
        ));
        return;
      }
    }
    
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplierId) {
      toast({
        title: "Validation Error",
        description: "Supplier is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/purchase-orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          items: items.filter(item => item.description.trim()),
          subtotal: totalAmount,
          tax: 0,
          total: totalAmount,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: `Purchase order "${result.orderNumber}" has been updated.`,
          variant: "success",
        });
        router.push('/contractor/purchase-orders');
        router.refresh();
      } else {
        throw new Error(result.error || 'Failed to update purchase order');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <BreadcrumbLink href="/contractor/purchase-orders">Purchase Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Purchase Order</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()}
            className="h-10 w-10 border border-muted-foreground/10"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Edit Purchase Order</h1>
            <p className="text-muted-foreground mt-1 text-sm italic">Update PO details for order #{formData.orderNumber}.</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-muted/20 rounded-xl border border-muted-foreground/5">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">Order Number</label>
                  <input
                    type="text"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full rounded-lg border-none bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">Supplier *</label>
                  <select 
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full rounded-lg border-none bg-background px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary shadow-sm"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">Order Date</label>
                  <input
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full rounded-lg border-none bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">Expected Delivery</label>
                  <input
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full rounded-lg border-none bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">Order Items</h2>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
                  <Plus className="w-4 h-4" />
                  Add Item
                </Button>
              </div>
              
              <div className="border border-muted-foreground/10 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-4 py-3 text-left font-black text-[10px] uppercase tracking-wider text-muted-foreground">Inventory Item (Optional)</th>
                      <th className="px-4 py-3 text-left font-black text-[10px] uppercase tracking-wider text-muted-foreground">Description</th>
                      <th className="px-4 py-3 text-center font-black text-[10px] uppercase tracking-wider text-muted-foreground w-24">Qty</th>
                      <th className="px-4 py-3 text-right font-black text-[10px] uppercase tracking-wider text-muted-foreground w-32">Unit Price</th>
                      <th className="px-4 py-3 text-right font-black text-[10px] uppercase tracking-wider text-muted-foreground w-32">Total</th>
                      <th className="px-4 py-3 text-center font-black text-[10px] uppercase tracking-wider text-muted-foreground w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-muted-foreground/5">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/5 transition-colors">
                        <td className="px-4 py-3">
                          <select
                            value={item.materialId || ''}
                            onChange={(e) => updateItem(item.id, 'materialId', e.target.value)}
                            disabled={isSubmitting}
                            className="w-full rounded-md border-none bg-muted/20 px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary"
                          >
                            <option value="">Manual Entry</option>
                            {inventoryItems.map((inv) => (
                              <option key={inv.id} value={inv.id}>{inv.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Description"
                            disabled={isSubmitting}
                            className="w-full rounded-md border-none bg-muted/20 px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                            min="1"
                            disabled={isSubmitting}
                            className="w-full rounded-md border-none bg-muted/20 px-3 py-1.5 text-xs text-center focus:ring-1 focus:ring-primary font-bold"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[10px] text-muted-foreground">KES</span>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              disabled={isSubmitting}
                              className="w-24 rounded-md border-none bg-muted/20 px-3 py-1.5 text-xs text-right focus:ring-1 focus:ring-primary font-bold"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-foreground">
                          KES {(item.quantity * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            disabled={isSubmitting || items.length === 1}
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="text-right">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Grand Total</p>
                  <p className="text-2xl font-black text-foreground">
                    <span className="text-sm font-normal text-muted-foreground mr-1">KES</span>
                    {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">Additional Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter any special instructions or details..."
                rows={3}
                disabled={isSubmitting}
                className="w-full rounded-xl border-none bg-muted/20 px-4 py-3 text-sm focus:ring-2 focus:ring-primary shadow-inner"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t border-muted-foreground/10">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Updating PO...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span className="text-base font-bold">Update Purchase Order</span>
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => router.back()} 
                disabled={isSubmitting}
                className="gap-2 px-8 py-6 rounded-xl border-muted-foreground/20 hover:bg-muted/50"
              >
                <X className="w-5 h-5" />
                <span className="text-base font-medium">Cancel</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
