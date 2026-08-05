'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { getApiError, getErrorMessage } from '@/lib/toast-utils';
import { useSite } from '@/hooks/use-site';

interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  materialId?: string;
  manualPrice: boolean;
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

export default function CreatePurchaseOrder() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeSite } = useSite();
  
  const [formData, setFormData] = useState({
    orderNumber: '',
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    status: 'pending',
    notes: '',
  });
  const [items, setItems] = useState<OrderItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, materialId: '', manualPrice: false }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliersRes, inventoryRes] = await Promise.all([
          fetch('/web/api/suppliers?limit=100'),
          fetch(`/web/api/inventory?limit=1000${activeSite ? `&siteId=${activeSite.id}` : ''}`)
        ]);
        
        const suppliersData = await suppliersRes.json();
        if (suppliersData.suppliers && Array.isArray(suppliersData.suppliers)) {
          setSuppliers(suppliersData.suppliers);
        }

        const inventoryData = await inventoryRes.json();
        if (inventoryData.inventory && Array.isArray(inventoryData.inventory)) {
          setInventoryItems(inventoryData.inventory);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  const addItem = () => {
    setItems([...items, {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      quantity: 1,
      unitPrice: 0,
      materialId: '',
      manualPrice: false
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
            unitPrice: selectedItem.unitCost || 0,
            manualPrice: false
          } : item
        ));
      } else {
        setItems(items.map(item =>
          item.id === id ? { 
            ...item, 
            materialId: '', 
            manualPrice: true
          } : item
        ));
      }
      return;
    }

    if (field === 'manualPrice') {
      setItems(items.map(item =>
        item.id === id ? { ...item, manualPrice: value } : item
      ));
      return;
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

    if (!activeSite?.id) {
      toast({
        title: "Error",
        description: "No active site selected. Please select a site from the sidebar.",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0 || items.every(item => !item.description.trim())) {
      toast({
        title: "Validation Error",
        description: "At least one item is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/web/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          siteId: activeSite.id,
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
          description: `Purchase order "${result.orderNumber}" has been created.`,
          variant: "success",
          action: (
            <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          ),
        });
        router.push('/contractor/purchase-orders');
        router.refresh();
      } else {
        throw new Error(getApiError(result, 'Unable to create the purchase order. Please verify the details and try again.'));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Unable to create the purchase order. Please check your connection and try again."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
            <BreadcrumbLink href="/contractor/purchase-orders">Purchase Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create Purchase Order</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
          <p className="text-sm text-gray-500">Generate a new official PO for your site materials.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Order Number</label>
              <input
                type="text"
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                placeholder="e.g. PO-2026-001"
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Supplier *</label>
              <select 
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Order Date</label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Expected Delivery</label>
              <input
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Order Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </div>
            
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium uppercase tracking-wider text-[10px]">Inventory Item</th>
                    <th className="px-4 py-2 text-left font-medium uppercase tracking-wider text-[10px]">Description</th>
                    <th className="px-4 py-2 text-center font-medium uppercase tracking-wider text-[10px] w-20">Qty</th>
                    <th className="px-4 py-2 text-right font-medium uppercase tracking-wider text-[10px] w-32">Unit Price</th>
                    <th className="px-4 py-2 text-right font-medium uppercase tracking-wider text-[10px] w-32">Total</th>
                    <th className="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2">
                        <select
                          value={item.materialId}
                          onChange={(e) => updateItem(item.id, 'materialId', e.target.value)}
                          disabled={isSubmitting}
                          className="w-full rounded border-gray-300 text-xs focus:ring-primary focus:border-primary"
                        >
                          <option value="">Manual Entry</option>
                          {inventoryItems.map((inv) => (
                            <option key={inv.id} value={inv.id}>{inv.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Description"
                          disabled={isSubmitting}
                          className="w-full rounded border-gray-300 text-xs focus:ring-primary focus:border-primary"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          min="1"
                          disabled={isSubmitting}
                          className="w-full rounded border-gray-300 text-xs text-center focus:ring-primary focus:border-primary"
                        />
                      </td>
<td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                           <input
                             type="number"
                             value={item.unitPrice}
                             onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                             min="0"
                             step="0.01"
                             disabled={isSubmitting}
                             className="w-24 rounded border-gray-300 text-xs text-right focus:ring-primary focus:border-primary disabled:opacity-50 disabled:bg-gray-50"
                             placeholder="Enter price"
                           />
                          {item.materialId && (
                            <button
                              type="button"
                              onClick={() => {
                                const selectedItem = inventoryItems.find(i => i.id === item.materialId);
                                if (selectedItem) {
                                  updateItem(item.id, 'unitPrice', selectedItem.unitCost || 0);
                                }
                              }}
                              className="text-xs text-primary hover:underline disabled:opacity-50"
                              disabled={isSubmitting}
                              title="Reset to inventory unit cost"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        KES {(item.quantity * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          disabled={isSubmitting || items.length === 1}
                          className="h-7 w-7 text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end pt-2">
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-medium">Grand Total</p>
                <p className="text-xl font-bold text-gray-900">
                  <span className="text-sm font-normal mr-1">KES</span>
                  {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter any additional notes"
              rows={3}
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="gap-2 bg-primary hover:bg-primary/90 text-white px-6 min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Purchase Order
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => router.back()} 
              disabled={isSubmitting}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
