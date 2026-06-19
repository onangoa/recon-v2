'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  DoorOpen,
  Upload,
  FileText
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
import { useSite } from '@/hooks/use-site';

export default function CreateVisitorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeSite } = useSite();
  
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    purpose: '',
    checkInTime: new Date().toISOString().slice(0, 16),
    notes: '',
    attachmentName: '',
    attachmentUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const response = await fetch('/web/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (response.ok) {
        const result = await response.json();
        setFormData(prev => ({
          ...prev,
          attachmentName: result.fileName,
          attachmentUrl: result.fileData
        }));
        toast({
          title: "File Uploaded",
          description: `${file.name} uploaded successfully.`,
          variant: "success",
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to upload file.",
        variant: "destructive",
      });
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
        description: "Visitor name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.purpose.trim()) {
      toast({
        title: "Validation Error", 
        description: "Purpose is required.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/web/api/visitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          siteId: activeSite.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: `Visitor "${result.name}" has been checked in.`,
          variant: "success",
          action: (
            <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          ),
        });
        router.push('/contractor/visitors');
        router.refresh();
      } else {
        throw new Error(result.error || 'Failed to check in visitor');
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

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor/visitors">Visitors</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Check In Visitor</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Check In Visitor</h1>
          <p className="text-sm text-gray-500">Record a new visitor entry.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Visitor Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter visitor name"
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Company</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Enter company name (optional)"
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Purpose *</label>
            <select
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="">Select Purpose</option>
              <option value="inspection">Inspection</option>
              <option value="meeting">Meeting</option>
              <option value="delivery">Delivery</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Check In Time</label>
            <input
              type="datetime-local"
              value={formData.checkInTime}
              onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes about the visitor..."
              rows={3}
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Attachment (e.g. ID, Permit)</label>
            <div className="mt-1 flex items-center gap-4">
              <div className="relative flex-1">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isSubmitting || isUploading}
                  className="hidden"
                  id="visitor-attachment"
                />
                <label
                  htmlFor="visitor-attachment"
                  className={`flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    formData.attachmentName 
                      ? 'border-primary/50 bg-primary/5 text-primary' 
                      : 'border-gray-300 hover:border-primary/50 text-gray-500'
                  }`}
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : formData.attachmentName ? (
                    <FileText className="w-5 h-5" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  <span className="text-sm font-medium">
                    {isUploading ? 'Uploading...' : formData.attachmentName || 'Click to upload document'}
                  </span>
                </label>
              </div>
              {formData.attachmentName && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, attachmentName: '', attachmentUrl: '' }))}
                  type="button"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
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
                  Check In
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