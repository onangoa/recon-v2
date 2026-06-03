'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Package, 
  Info,
  Building2,
  HardHat,
  Truck,
  Layers,
  Barcode,
  Scale,
  DollarSign,
  MapPin,
  CheckCircle2
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
import { useToast } from '@/hooks/use-toast';
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
import { Separator } from '@/components/ui/separator';

export default function CreateInventoryItemPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Item Registered",
      description: "Inventory item has been successfully added to the site registry.",
    });
    setTimeout(() => router.push('/contractor/inventory'), 1500);
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
            <BreadcrumbLink href="/contractor/inventory">Inventory</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Add New Item</BreadcrumbPage>
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Add Inventory Item</h1>
            <p className="text-muted-foreground mt-1 text-sm italic">New resource registration for Karen Plains Road Project</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => router.back()}>
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-white" onClick={handleSave}>
            <Save className="w-4 h-4" />
            <span>Save Item</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Basic Information
              </CardTitle>
              <CardDescription>Core details of the inventory item.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="w-3 h-3 text-muted-foreground" /> Company
                  </Label>
                  <Input defaultValue="Nairobi Builders Ltd" className="bg-muted/30 border-none h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <HardHat className="w-3 h-3 text-muted-foreground" /> Site Project
                  </Label>
                  <Input defaultValue="Karen Plains Road Project" disabled className="bg-muted/10 border-none h-10 italic" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Layers className="w-3 h-3 text-muted-foreground" /> Category *
                  </Label>
                  <Select>
                    <SelectTrigger className="bg-muted/30 border-none h-10">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="materials">Materials</SelectItem>
                      <SelectItem value="equipment">Heavy Equipment</SelectItem>
                      <SelectItem value="tools">Hand Tools</SelectItem>
                      <SelectItem value="safety">Safety Gear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Truck className="w-3 h-3 text-muted-foreground" /> Preferred Supplier
                  </Label>
                  <Select>
                    <SelectTrigger className="bg-muted/30 border-none h-10">
                      <SelectValue placeholder="Select Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="s1">BuildMart Supplies</SelectItem>
                      <SelectItem value="s2">Nairobi Steel & Glass</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-1">
                  <Label className="flex items-center gap-2 font-bold">
                    Item Name *
                  </Label>
                  <Input placeholder="e.g. Portland Cement 50kg" className="bg-muted/30 border-none h-10 focus-visible:ring-primary" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Barcode className="w-3 h-3 text-muted-foreground" /> SKU / Serial No
                  </Label>
                  <Input placeholder="AUTO-GENERATE" className="bg-muted/30 border-none h-10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Detailed Description</Label>
                <Textarea 
                  placeholder="Additional specs, brand details, or storage requirements..." 
                  className="bg-muted/30 border-none min-h-[100px] focus-visible:ring-primary"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                Stock & Pricing
              </CardTitle>
              <CardDescription>Manage quantities and unit costs.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Measuring Unit *</Label>
                  <Input placeholder="Bags, Tons, m³..." className="bg-muted/30 border-none h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Current Stock *</Label>
                  <Input type="number" placeholder="0.00" className="bg-muted/30 border-none h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Min. Threshold *</Label>
                  <Input type="number" placeholder="Alert limit" className="bg-muted/30 border-none h-10 border-red-100" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-3 h-3 text-muted-foreground" /> Unit Price (KES) *
                  </Label>
                  <Input type="number" placeholder="0.00" className="bg-muted/30 border-none h-10 font-mono font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-muted-foreground" /> Warehouse / Location
                  </Label>
                  <Input placeholder="e.g. Store Room B" className="bg-muted/30 border-none h-10" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Status/Quick Actions */}
        <div className="space-y-8">
          <Card className="border-none shadow-md overflow-hidden bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-primary font-bold">Item Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select defaultValue="active">
                <SelectTrigger className="bg-background border-none h-10 ring-1 ring-primary/20">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">On Hold</SelectItem>
                  <SelectItem value="discontinued">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <div className="rounded-lg bg-background p-4 border border-primary/10">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  System Check
                </div>
                <p className="text-[10px] leading-tight text-muted-foreground">
                  Upon saving, this item will be visible to site supervisors and available for material requisitions.
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white gap-2 h-11" onClick={handleSave}>
                <Save className="w-4 h-4" /> Save Registration
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
