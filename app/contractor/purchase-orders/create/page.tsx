'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  X, 
  ClipboardList, 
  Plus, 
  Trash2, 
  FileText, 
  Building2, 
  HardHat, 
  Calendar, 
  Flag,
  ShoppingCart,
  Calculator,
  Truck
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
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

interface OrderItem {
  id: string;
  item: string;
  quantity: number;
  unitPrice: number;
}

export default function CreatePurchaseOrder() {
  const router = useRouter();
  const [supplier, setSupplier] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [priority, setPriority] = useState('Low');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([
    { id: '1', item: '', quantity: 1, unitPrice: 0 }
  ]);

  const addItem = () => {
    setItems([...items, {
      id: Math.random().toString(36).substr(2, 9),
      item: '',
      quantity: 1,
      unitPrice: 0
    }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
            <BreadcrumbLink href="/contractor/purchase-orders">Purchase Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create Order</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 border border-muted-foreground/10 hover:bg-muted"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">New Purchase Order</h1>
            <p className="text-muted-foreground mt-1 text-sm italic">Generate procurement request for site supplies</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => router.back()}>
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-white" onClick={handleSubmit}>
            <ShoppingCart className="w-4 h-4" />
            <span>Draft PO</span>
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Order Details Card */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/20 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              PO Context & Logistics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-3 h-3 text-muted-foreground" /> Target Supplier *
                </Label>
                <Select value={supplier} onValueChange={setSupplier}>
                  <SelectTrigger className="bg-muted/30 border-none h-10 focus-visible:ring-primary">
                    <SelectValue placeholder="Choose Supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BuildMart">BuildMart Supplies</SelectItem>
                    <SelectItem value="Steel">Steel & Co</SelectItem>
                    <SelectItem value="Cement">Cement Industries</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <HardHat className="w-3 h-3 text-muted-foreground" /> Delivery Location
                </Label>
                <Input defaultValue="Karen Plains Road Project" disabled className="bg-muted/10 border-none h-10 italic" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-muted-foreground" /> Requested Delivery Date
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="YYYY-MM-DD" 
                    className="pl-10 bg-muted/30 border-none h-10" 
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Flag className="w-3 h-3 text-muted-foreground" /> Order Priority
                </Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="bg-muted/30 border-none h-10 focus-visible:ring-primary">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Standard (Low)</SelectItem>
                    <SelectItem value="Medium">Expedited (Medium)</SelectItem>
                    <SelectItem value="High">Urgent (High)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Special Instructions / Notes</Label>
              <Textarea 
                placeholder="Include delivery time windows, offloading requirements, or specific brands..." 
                className="bg-muted/30 border-none min-h-[100px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Line Items Card */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/20 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Materials & Services
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
              <Plus className="w-4 h-4" /> Add Line Item
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase">Inventory Item</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-center w-[150px]">Quantity</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-right w-[180px]">Unit Price (KES)</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-right w-[180px]">Total</TableHead>
                  <TableHead className="text-right w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/5">
                    <TableCell>
                      <Select value={item.item} onValueChange={(val) => updateItem(item.id, 'item', val)}>
                        <SelectTrigger className="bg-transparent border-none focus:ring-0 px-0 h-auto font-medium">
                          <SelectValue placeholder="Select Material" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cement">Cement (50kg bags)</SelectItem>
                          <SelectItem value="Steel">Steel Rods (12mm)</SelectItem>
                          <SelectItem value="Bricks">Machine Cut Bricks</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      <Input 
                        type="number" 
                        value={item.quantity} 
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                        className="h-8 bg-muted/30 border-none text-center font-bold"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input 
                        type="number" 
                        value={item.unitPrice} 
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                        className="h-8 bg-muted/30 border-none text-right font-mono"
                      />
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm">
                      KES {(item.quantity * item.unitPrice).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-8 w-8 text-destructive/40 hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="bg-primary/5 border-t justify-end p-6">
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Estimated Total</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-muted-foreground italic">KES</span>
                  <span className="text-3xl font-black tracking-tighter text-primary">
                    {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold h-14 px-8 shadow-xl" onClick={handleSubmit}>
                Generate Purchase Order
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
