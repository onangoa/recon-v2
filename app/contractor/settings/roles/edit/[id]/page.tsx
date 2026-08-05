'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Loader2 } from 'lucide-react';
import RoleForm from '../../../components/role-form';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/toast-utils';

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const [roleData, setRoleData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [id, setId] = useState<string>('');

  useEffect(() => {
    params.then(({ id: paramId }) => setId(paramId));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    const fetchRole = async () => {
      try {
        const response = await fetch(`/web/api/roles/${id}`);
        if (!response.ok) throw new Error('Failed to fetch role');
        const data = await response.json();
        setRoleData({
          id: data.id,
          name: data.name,
          description: data.description || '',
          permissionIds: data.permissions.map((p: any) => p.id),
        });
      } catch (err: any) {
        toast({ title: "Error", description: getErrorMessage(err, "Unable to load role details."), variant: "destructive" });
        router.push('/contractor/settings?tab=roles');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRole();
  }, [id, router, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
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
            <BreadcrumbLink href="/contractor/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Role</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Edit Custom Role</h1>
          <p className="text-muted-foreground mt-1 text-sm">Modify permissions and access levels for this role.</p>
        </div>
      </div>

      <RoleForm initialData={roleData} isEditing={true} />
    </div>
  );
}
