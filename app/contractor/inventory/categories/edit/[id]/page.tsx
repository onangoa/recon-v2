'use client';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  X, 
  FolderPlus, 
  Layers,
  Loader2,
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
import { useToast } from '@/hooks/use-toast';
import { getApiError, getErrorMessage } from '@/lib/toast-utils';

interface Category {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  parent?: {
    id: string;
    name: string;
  } | null;
}

interface ParentCategory {
  id: string;
  name: string;
}

export default function EditInventoryCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const categoryId = params.id as string;
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await fetch(`/web/api/inventory/categories/${categoryId}`);
        if (!response.ok) throw new Error('Failed to fetch category');
        
        const category: Category = await response.json();
        setName(category.name);
        setDescription(category.description || '');
        setParentId(category.parentId || 'none');
      } catch (error) {
        console.error('Failed to fetch category:', error);
        toast({
          title: "Error",
          description: "Unable to load the category for editing.",
          variant: "destructive",
        });
        router.push('/contractor/inventory/categories');
      }
    };

    const fetchParentCategories = async () => {
      try {
        const response = await fetch('/web/api/inventory/categories?limit=100');
        const data = await response.json();
        if (data.categories && Array.isArray(data.categories)) {
          // Only show top-level categories as potential parents, excluding current category and its children
          const filtered = data.categories.filter((cat: any) => 
            !cat.parentId && cat.id !== categoryId
          );
          setParentCategories(filtered);
        }
      } catch (error) {
        console.error('Failed to fetch parent categories:', error);
      }
    };

    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchCategory(), fetchParentCategories()]);
      setIsLoading(false);
    };

    loadData();
  }, [categoryId, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required.",
        variant: "destructive",
        action: (
          <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
            <AlertCircle className="h-5 w-5 text-white" />
          </div>
        ),
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/web/api/inventory/categories/${categoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          parentId: parentId === 'none' ? null : parentId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success!",
          description: `Category "${result.name}" has been updated.`,
          variant: "success",
          action: (
            <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          ),
        });
        router.push('/contractor/inventory/categories');
        router.refresh();
      } else {
        throw new Error(getApiError(result, 'Unable to update the category. Please verify the details and try again.'));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Unable to update the category. Please verify the details and try again."),
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <BreadcrumbLink href="/contractor/inventory/categories">Categories</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Category</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Inventory Category</h1>
          <p className="text-sm text-gray-500">Update category information and organization.</p>
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
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Category Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter category name"
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            {/* Parent Category Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Parent Category</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="">Select parent category</option>
                <option value="none">None (This will be a parent category)</option>
                {parentCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Description Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter category description"
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
                    Save Changes
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