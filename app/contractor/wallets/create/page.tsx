'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Wallet, 
  CreditCard, 
  FileText, 
  Coins, 
  Lock, 
  Smartphone,
  CheckCircle2,
  AlertCircle
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

export default function CreateWalletPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    walletName: '',
    description: '',
    paymentOptions: {
      paybill: false,
      till: false,
      pochi: false,
      mpesa: false,
    },
    dailySpendLimit: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
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
            <BreadcrumbLink href="/contractor/wallets">Wallets</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create Wallet</BreadcrumbPage>
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Setup Financial Wallet</h1>
            <p className="text-muted-foreground mt-1 text-sm italic">Initialize a new project account for controlled spending</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => router.back()}>
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-white" onClick={handleSubmit}>
            <Save className="w-4 h-4" />
            <span>Create Account</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Wallet Identity
              </CardTitle>
              <CardDescription>Define the name and purpose of this financial account.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label className="font-bold">Wallet Name *</Label>
                <Input 
                  placeholder="e.g. Petty Cash, Materials Fund, Payroll Account" 
                  className="bg-muted/30 border-none h-11 text-base focus-visible:ring-primary"
                  value={formData.walletName}
                  onChange={(e) => setFormData({ ...formData, walletName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-muted-foreground" /> Account Description
                </Label>
                <Textarea 
                  placeholder="What is this fund primarily for?" 
                  className="bg-muted/30 border-none min-h-[100px] focus-visible:ring-primary"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <CreditCard className="w-5 h-5" />
                Payment & Disbursement
              </CardTitle>
              <CardDescription>Configure how funds can be spent from this wallet.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Supported Payment Methods</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'paybill', label: 'M-Pesa Paybill' },
                    { id: 'till', label: 'Buy Goods Till' },
                    { id: 'pochi', label: 'Pochi La Biashara' },
                    { id: 'mpesa', label: 'Direct Mobile No' },
                  ].map((option) => (
                    <div key={option.id} className="flex items-center space-x-2 bg-muted/20 p-3 rounded-lg border border-transparent hover:border-primary/20 transition-colors cursor-pointer">
                      <Checkbox 
                        id={option.id} 
                        checked={formData.paymentOptions[option.id as keyof typeof formData.paymentOptions]}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          paymentOptions: {
                            ...formData.paymentOptions,
                            [option.id]: !!checked,
                          },
                        })}
                      />
                      <Label htmlFor={option.id} className="text-xs font-medium cursor-pointer leading-none">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <Label className="font-bold">Spending Controls</Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Daily Spend Limit (KES)</Label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pl-10 bg-muted/30 border-none h-10 font-mono"
                        value={formData.dailySpendLimit}
                        onChange={(e) => setFormData({ ...formData, dailySpendLimit: e.target.value })}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">Leave empty for no limit (not recommended)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-md overflow-hidden bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-primary font-bold">Account Guard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-background p-4 border border-primary/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  Compliance Ready
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  New wallets are subject to a 24-hour verification period for large disbursement limits.
                </p>
                <div className="flex items-start gap-2 text-[10px] text-amber-600 bg-amber-50 p-2 rounded">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  Multi-signature approval is required for spends exceeding KES 100,000.
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-white gap-2 h-12 text-base font-bold shadow-lg"
                onClick={handleSubmit}
              >
                <Smartphone className="w-5 h-5" /> Initialize Wallet
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
