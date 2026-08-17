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
  Upload
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

export default function CreateMachinePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeSite } = useSite();
  
  const [formData, setFormData] = useState({
    name: '',
    machineType: '',
    model: '',
    serialNumber: '',
    condition: '',
    purchaseDate: '',
    purchasePrice: '',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    status: '',
    notes: '',
    image: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [customMachineType, setCustomMachineType] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setImageFile(selected);
      setFormData((prev) => ({ ...prev, image: '' }));
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || formData.image) return formData.image || null;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', imageFile);
      const response = await fetch('/web/api/upload', { method: 'POST', body: fd });
      if (!response.ok) throw new Error('Unable to upload the image. Please try again.');
      const data = await response.json();
      setFormData((prev) => ({ ...prev, image: data.url }));
      return data.url;
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: getErrorMessage(error, "Unable to upload the image. Please try again."),
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeSite) {
      toast({
        title: "Error",
        description: "Please select an active site first.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Equipment name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.machineType.trim() && !customMachineType.trim()) {
      toast({
        title: "Validation Error", 
        description: "Machine type is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = formData.image || null;
      if (imageFile && !imageUrl) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          toast({
            title: "Upload Error",
            description: "The image could not be uploaded. Please try again or remove it.",
            variant: "destructive",
          });
          return;
        }
      }

      const response = await fetch('/web/api/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          machineType: formData.machineType === '__other__' ? customMachineType.trim() : formData.machineType,
          image: imageUrl,
          siteId: activeSite.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: `Equipment "${result.name}" has been created.`,
          variant: "success",
          action: (
            <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          ),
        });
        router.push('/contractor/equipment');
        router.refresh();
      } else {
        throw new Error(getApiError(result, 'Unable to create the equipment. Please verify the details and try again.'));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Unable to create the equipment. Please verify the details and try again."),
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
            <BreadcrumbLink href="/contractor/equipment">Equipment</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create Equipment</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Equipment</h1>
          <p className="text-sm text-gray-500">Add new equipment to your inventory.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Simplified Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
          {/* Name and Type Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter equipment name"
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Machine Type *</label>
              <select
                value={formData.machineType}
                onChange={(e) => setFormData({ ...formData, machineType: e.target.value })}
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="">Select Machine Type</option>
                <option value="excavator">Excavator</option>
                <option value="crane">Crane</option>
                <option value="mixer">Mixer</option>
                <option value="dozer">Dozer</option>
                <option value="generator">Generator</option>
                <option value="general">General</option>
                <option value="__other__">Other (specify)</option>
              </select>
              {formData.machineType === '__other__' && (
                <input
                  type="text"
                  value={customMachineType}
                  onChange={(e) => setCustomMachineType(e.target.value)}
                  placeholder="Enter machine type"
                  disabled={isSubmitting}
                  className="w-full mt-2 rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
              )}
            </div>
          </div>

          {/* Model and Serial Number Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Enter model"
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Serial Number</label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                placeholder="Enter serial number"
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>

          {/* Condition and Status Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Condition <span className="text-red-500">*</span></label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="">Select Condition</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="needs-repair">Needs Repair</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Initial Status</label>
              <select
                value={formData.status || 'idle'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="idle">Idle</option>
                <option value="in-use">In Use</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Purchase Date and Price Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Purchase Date</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Purchase Price (KES)</label>
              <input
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="0.00"
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>

          {/* Maintenance Dates Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Last Maintenance Date</label>
              <input
                type="date"
                value={formData.lastMaintenanceDate}
                onChange={(e) => setFormData({ ...formData, lastMaintenanceDate: e.target.value })}
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Next Maintenance Date</label>
              <input
                type="date"
                value={formData.nextMaintenanceDate}
                onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>

          {/* Equipment Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Equipment Image</label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isUploading || isSubmitting}
                  className="flex-1 text-sm file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary/10 file:text-primary file:font-medium hover:file:bg-primary/20"
                />
                {isUploading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
              {imageFile && !formData.image && !isUploading && (
                <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  Image will be uploaded when you save.
                </p>
              )}
              {formData.image && (
                <div className="flex items-center gap-3">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-muted/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={formData.image} alt="Equipment preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Image ready!</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setFormData((prev) => ({ ...prev, image: '' })); setImageFile(null); }}
                      className="text-destructive hover:bg-destructive/10 h-7 px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Enter any additional notes"
              rows={4}
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          {/* Buttons */}
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
                  Save Equipment
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
