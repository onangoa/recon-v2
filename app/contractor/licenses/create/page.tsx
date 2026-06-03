'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  X, 
  FileText, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  Upload, 
  HardHat,
  CheckCircle2,
  Info
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
import { Separator } from '@/components/ui/separator';

export default function CreateLicensePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    licenseNumber: '',
    licenseType: '',
    issuingAuthority: '',
    issueDate: '',
    expiryDate: '',
  });

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
            <BreadcrumbLink href="/contractor/licenses">Compliance</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Register License</BreadcrumbPage>
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">New Compliance Entry</h1>
            <p className="text-muted-foreground mt-1 text-sm italic">Maintain project legality and regulatory standards</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => router.back()}>
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-white" onClick={handleSubmit}>
            <Save className="w-4 h-4" />
            <span>Record License</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                License Particulars
              </CardTitle>
              <CardDescription>Core regulatory and identification information.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold">License / Permit Number *</Label>
                  <Input 
                    placeholder="e.g. NCA-2024-XXXX" 
                    className="bg-muted/30 border-none h-10 font-mono focus-visible:ring-primary"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Classification Type *</Label>
                  <Select value={formData.licenseType} onValueChange={(val) => setFormData({ ...formData, licenseType: val })}>
                    <SelectTrigger className="bg-muted/30 border-none h-10">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contractor">Contractor License</SelectItem>
                      <SelectItem value="safety">Safety Certificate</SelectItem>
                      <SelectItem value="environmental">Environmental Permit (NEMA)</SelectItem>
                      <SelectItem value="occupational">Occupational Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="w-3 h-3 text-muted-foreground" /> Issuing Authority *
                  </Label>
                  <Input 
                    placeholder="e.g. National Construction Authority" 
                    className="bg-muted/30 border-none h-10"
                    value={formData.issuingAuthority}
                    onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <HardHat className="w-3 h-3 text-muted-foreground" /> Site Application
                  </Label>
                  <Input defaultValue="Karen Plains Road Project" disabled className="bg-muted/10 border-none h-10 italic" />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-muted-foreground" /> Date of Issue *
                  </Label>
                  <Input 
                    type="date" 
                    className="bg-muted/30 border-none h-10"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-muted-foreground" /> Expiry Date *
                  </Label>
                  <Input 
                    type="date" 
                    className="bg-muted/30 border-none h-10 border-red-100"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <Upload className="w-5 h-5" />
                Evidence & Documentation
              </CardTitle>
              <CardDescription>Upload a scanned copy or digital certificate.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-12 text-center hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary-foreground" />
                </div>
                <h4 className="font-bold text-foreground">Click to upload or drag & drop</h4>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG or PNG (max. 10MB)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-md overflow-hidden bg-emerald-50 border-emerald-100">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-emerald-700 font-bold">Compliance Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-background p-4 border border-emerald-100 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Automatic Monitoring
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  Once registered, the system will provide alerts 30 days before the expiry date to ensure timely renewals.
                </p>
              </div>
              <div className="flex items-start gap-2 p-3 bg-white/50 rounded-lg">
                <Info className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-emerald-800">
                  This document will be visible in the project's compliance dashboard.
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-12 text-base font-bold shadow-lg border-none"
                onClick={handleSubmit}
              >
                <Save className="w-4 h-4" /> Register License
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
