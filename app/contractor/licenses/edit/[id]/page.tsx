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
import { Input } from '@/components/ui/input';
import { useSite } from '@/hooks/use-site';

interface License {
  id: string;
  name: string;
  licenseNumber: string;
  issuingAuthority: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  type: string | null;
  category: string | null;
  status: string;
  fileName: string | null;
  fileData: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function EditLicensePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { activeSite } = useSite();
  const id = params.id as string;
  
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    issuingAuthority: '',
    issueDate: '',
    expiryDate: '',
    type: '',
    category: '',
    status: 'active',
    fileName: '',
    fileData: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchLicense();
  }, [id]);

  const fetchLicense = async () => {
    try {
      const response = await fetch(`/web/api/licenses/${id}`);
      if (!response.ok) throw new Error('Failed to fetch license');
      const license: License = await response.json();
      
      setFormData({
        name: license.name,
        licenseNumber: license.licenseNumber,
        issuingAuthority: license.issuingAuthority || '',
        issueDate: license.issueDate ? license.issueDate.toString().split('T')[0] : '',
        expiryDate: license.expiryDate ? license.expiryDate.toString().split('T')[0] : '',
        type: license.type || '',
        category: license.category || '',
        status: license.status,
        fileName: license.fileName || '',
        fileData: license.fileData || '',
        notes: license.notes || '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch license',
        variant: 'destructive',
      });
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file first.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/web/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, fileName: data.fileName, fileData: data.fileData }));
      
      toast({
        title: "Success",
        description: "File uploaded successfully!",
        variant: "success",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/web/api/licenses/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          licenseNumber: formData.licenseNumber,
          issuingAuthority: formData.issuingAuthority || null,
          issueDate: formData.issueDate ? new Date(formData.issueDate) : null,
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : null,
          type: formData.type || null,
          category: formData.category || null,
          status: formData.status,
          fileName: formData.fileName || null,
          fileData: formData.fileData || null,
          notes: formData.notes || null,
          siteId: activeSite?.id || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update license');
      }

      toast({
        title: 'Success',
        description: 'License updated successfully',
      });

      router.push('/contractor/licenses');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update license',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
            <BreadcrumbLink href="/contractor/licenses">Licenses</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit License</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit License</h1>
          <p className="text-muted-foreground mt-1">Update license details</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/contractor/licenses">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">License Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Construction License"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">License Number *</label>
            <Input
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              required
              placeholder="e.g., LIC-2024-001"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Issuing Authority</label>
            <Input
              value={formData.issuingAuthority}
              onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
              placeholder="e.g., Ministry of Roads"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <Input
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              placeholder="e.g., Building, Electrical"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Class A, Class B"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="expiring-soon">Expiring Soon</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Issue Date</label>
            <Input
              type="date"
              value={formData.issueDate}
              onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Expiry Date</label>
            <Input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Additional notes about this license..."
          />
        </div>

        <div className="space-y-4 p-6 border rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium">Document Upload</label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleUpload}
                disabled={!file || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" /> Upload
                  </>
                )}
              </Button>
            </div>
            {formData.fileData && (
              <p className="text-sm text-muted-foreground">
                Current file: {formData.fileName}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}