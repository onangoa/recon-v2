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
  Upload as UploadIcon,
  Plus,
  Trash2,
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
import { getApiError, getErrorMessage } from '@/lib/toast-utils';
import { useSite } from '@/hooks/use-site';

interface DocumentEntry {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  notes: string;
  isUploading: boolean;
  isUploaded: boolean;
}

export default function CreateDocumentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeSite } = useSite();
  
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const newEntries: DocumentEntry[] = Array.from(selectedFiles).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: 'other',
        fileUrl: '',
        notes: '',
        isUploading: false,
        isUploaded: false,
        file: file // Temporary storage for upload
      } as any));
      
      setDocuments(prev => [...prev, ...newEntries]);
    }
  };

  const uploadFile = async (entry: DocumentEntry & { file: File }) => {
    setDocuments(prev => prev.map(d => d.id === entry.id ? { ...d, isUploading: true } : d));
    
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', entry.file);

      const response = await fetch('/web/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) throw new Error('Failed to upload file');

      const data = await response.json();
      
      setDocuments(prev => prev.map(d => d.id === entry.id ? { 
        ...d, 
         fileUrl: data.url, 
        isUploading: false, 
        isUploaded: true 
      } : d));
    } catch (error: any) {
      setDocuments(prev => prev.map(d => d.id === entry.id ? { ...d, isUploading: false } : d));
      toast({
        title: "Upload Error",
        description: getErrorMessage(error, `Unable to upload "${entry.name}". Please try again.`),
        variant: "destructive",
      });
    }
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const updateDocument = (id: string, field: keyof DocumentEntry, value: string) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
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

    if (documents.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one document.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const pendingUploads = (documents as any[]).filter(d => !d.isUploaded && d.file);
      for (const doc of pendingUploads) {
        setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, isUploading: true } : d));
        try {
          const formDataUpload = new FormData();
          formDataUpload.append('file', doc.file);
          const uploadResponse = await fetch('/web/api/upload', {
            method: 'POST',
            body: formDataUpload,
          });
          if (!uploadResponse.ok) throw new Error('Unable to upload the file. Please try again.');
          const data = await uploadResponse.json();
          doc.fileUrl = data.url;
          doc.isUploaded = true;
          setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, fileUrl: data.url, isUploading: false, isUploaded: true } : d));
        } catch (error: any) {
          setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, isUploading: false } : d));
          throw new Error(`Unable to upload "${doc.name}". Please try again.`);
        }
      }

      const response = await fetch('/web/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documents.map(d => ({
          name: d.name,
          type: d.type,
          fileUrl: d.fileUrl,
          notes: d.notes,
          siteId: activeSite.id
        }))),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: `${documents.length} document(s) have been uploaded.`,
          variant: "success",
          action: (
            <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          ),
        });
        router.push('/contractor/uploads');
        router.refresh();
      } else {
        const result = await response.json();
        throw new Error(getApiError(result, "Unable to upload the documents. Please verify the details and try again."));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Unable to upload the documents. Please check your connection and try again."),
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
            <BreadcrumbLink href="/contractor/uploads">Uploads</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Upload Documents</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Site Documents</h1>
          <p className="text-sm text-gray-500">Add documents or files to your site. Bulk upload supported.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-muted/30 border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 text-center">
            <input
              type="file"
              id="file-upload"
              multiple
              className="hidden"
              onChange={handleFilesChange}
            />
            <label 
              htmlFor="file-upload"
              className="flex flex-col items-center cursor-pointer"
            >
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <UploadIcon className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">PDF, Images, Excel, or Word documents</p>
            </label>
          </div>

          {documents.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Document Queue ({documents.length})</h3>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50/50 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-white rounded border border-gray-100">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <input
                          type="text"
                          value={doc.name}
                          onChange={(e) => updateDocument(doc.id, 'name', e.target.value)}
                          className="text-sm font-medium bg-transparent border-none focus:ring-1 focus:ring-primary rounded px-1 flex-1"
                          placeholder="Document Name"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          value={doc.type}
                          onChange={(e) => updateDocument(doc.id, 'type', e.target.value)}
                          className="text-xs border-gray-200 rounded-md bg-white px-2 py-1 focus:ring-1 focus:ring-primary"
                        >
                          <option value="contract">Contract</option>
                          <option value="invoice">Invoice</option>
                          <option value="report">Report</option>
                          <option value="permit">Permit</option>
                          <option value="insurance">Insurance</option>
                          <option value="blueprint">Blueprint</option>
                          <option value="photo">Photo</option>
                          <option value="other">Other</option>
                        </select>
                        {!doc.isUploaded && !doc.isUploading && (
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="secondary"
                            onClick={() => uploadFile(doc as any)}
                            className="h-8 px-3"
                          >
                            Upload
                          </Button>
                        )}
                        {doc.isUploading && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Uploading...
                          </div>
                        )}
                        {doc.isUploaded && (
                          <div className="text-green-600">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDocument(doc.id)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <textarea
                        value={doc.notes}
                        onChange={(e) => updateDocument(doc.id, 'notes', e.target.value)}
                        placeholder="Add notes/description for this document..."
                        className="w-full text-xs border-gray-200 rounded-md bg-white px-3 py-2 focus:ring-1 focus:ring-primary"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <Button 
              type="submit" 
              disabled={isSubmitting || documents.length === 0}
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
                  Save Documents
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
