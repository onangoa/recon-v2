'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Coins,
  Lock
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
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function EditWalletPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const resolvedParams = use(params);
  const walletId = resolvedParams.id;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    paymentOptions: {
      paybill: false,
      till: false,
      pochi: false,
      mpesa: false,
    },
    dailySpendLimit: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWallet();
  }, [walletId]);

  const fetchWallet = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/web/api/wallets/${walletId}`);
      if (!response.ok) throw new Error('Failed to fetch wallet');
      const data = await response.json();
      setFormData({
        name: data.name,
        description: data.description || '',
        paymentOptions: data.paymentOptions || {
          paybill: false,
          till: false,
          pochi: false,
          mpesa: false,
        },
        dailySpendLimit: data.dailySpendLimit?.toString() || '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Wallet name is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/web/api/wallets/${walletId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          paymentOptions: formData.paymentOptions,
          dailySpendLimit: formData.dailySpendLimit ? parseFloat(formData.dailySpendLimit) : null,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: `Wallet "${result.name}" has been updated.`,
          variant: "success",
          action: (
            <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          ),
        });
        router.push('/contractor/wallets');
        router.refresh();
      } else {
        throw new Error(result.error || 'Failed to update wallet');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
        action: (
          <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
            <AlertCircle className="h-5 w-5 text-white" />
          </div>
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-destructive">
        <AlertCircle className="h-8 w-8" />
        <p className="text-sm font-medium">{error}</p>
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
            <BreadcrumbLink href="/contractor/wallets">Wallets</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Wallet</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Wallet</h1>
          <p className="text-sm text-gray-500">Update wallet details and settings.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Wallet Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter wallet name"
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the purpose of this wallet"
              rows={4}
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Supported Payment Methods</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { id: 'paybill', label: 'M-Pesa Paybill' },
                { id: 'till', label: 'Buy Goods Till' },
                { id: 'pochi', label: 'Pochi La Biashara' },
                { id: 'mpesa', label: 'Direct Mobile No' },
              ].map((option) => (
                <div key={option.id} className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-transparent hover:border-gray-300 transition-colors cursor-pointer">
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
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Daily Spend Limit (KES)</label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    placeholder="0.00"
                    value={formData.dailySpendLimit}
                    onChange={(e) => setFormData({ ...formData, dailySpendLimit: e.target.value })}
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 pl-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                </div>
                <p className="text-xs text-gray-500 italic mt-1">Leave empty for no limit (not recommended)</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100">
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
                  Update Wallet
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