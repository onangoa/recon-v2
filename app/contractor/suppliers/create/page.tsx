'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Handshake, 
  Building, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  CreditCard,
  Notebook,
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
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export default function CreateSupplierPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Supplier Registered",
      description: "New supplier has been added to your partner network.",
    });
    setTimeout(() => router.push('/contractor/suppliers'), 1500);
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
            <BreadcrumbLink href="/contractor/suppliers">Suppliers</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Add New Supplier</BreadcrumbPage>
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Register New Supplier</h1>
            <p className="text-muted-foreground mt-1 text-sm italic">Establishing professional partnerships for project excellence</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => router.back()}>
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-white">
            <Save className="w-4 h-4" />
            <span>Save Supplier</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                Business Details
              </CardTitle>
              <CardDescription>Primary identification and legal information.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold">Supplier Name *</Label>
                  <Input placeholder="e.g. ABC Construction Supplies" className="bg-muted/30 border-none h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-3 h-3 text-muted-foreground" /> Primary Contact Person
                  </Label>
                  <Input placeholder="Full Name" className="bg-muted/30 border-none h-10" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-muted-foreground" /> Official Email
                  </Label>
                  <Input type="email" placeholder="email@supplier.co.ke" className="bg-muted/30 border-none h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-muted-foreground" /> Contact Phone
                  </Label>
                  <Input type="tel" placeholder="+254 7..." className="bg-muted/30 border-none h-10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-muted-foreground" /> Physical Address
                </Label>
                <Textarea placeholder="Headquarters or main branch location..." className="bg-muted/30 border-none min-h-[80px]" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <CreditCard className="w-5 h-5" />
                Compliance & Terms
              </CardTitle>
              <CardDescription>Legal and financial parameters for procurement.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-3 h-3 text-muted-foreground" /> KRA PIN
                  </Label>
                  <Input placeholder="P0..." className="bg-muted/30 border-none h-10 uppercase font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>Payment Terms</Label>
                  <Select>
                    <SelectTrigger className="bg-muted/30 border-none h-10">
                      <SelectValue placeholder="Select Terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="net30">Net 30 Days</SelectItem>
                      <SelectItem value="cod">Cash on Delivery</SelectItem>
                      <SelectItem value="prepaid">Pre-paid</SelectItem>
                      <SelectItem value="eom">End of Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Notebook className="w-3 h-3 text-muted-foreground" /> Internal Notes
                </Label>
                <Textarea placeholder="Reliability notes, special discounts, or past history..." className="bg-muted/30 border-none min-h-[80px]" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-md overflow-hidden bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-primary font-bold">Supplier Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select defaultValue="active">
                <SelectTrigger className="bg-background border-none h-10 ring-1 ring-primary/20">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active / Preferred</SelectItem>
                  <SelectItem value="pending">Under Review</SelectItem>
                  <SelectItem value="inactive">Blacklisted</SelectItem>
                </SelectContent>
              </Select>
              <div className="rounded-lg bg-background p-4 border border-primary/10">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Verification
                </div>
                <p className="text-[10px] leading-tight text-muted-foreground">
                  By registering this supplier, they will become available for generating purchase orders and logging material deliveries.
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white gap-2 h-11">
                <Save className="w-4 h-4" /> Save Supplier
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
