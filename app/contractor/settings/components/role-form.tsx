'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Save, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getApiError, getErrorMessage } from '@/lib/toast-utils';

interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  description: string | null;
}

interface RoleFormProps {
  initialData?: {
    id: string;
    name: string;
    description: string;
    permissionIds: string[];
  };
  isEditing?: boolean;
}

export default function RoleForm({ initialData, isEditing = false }: RoleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    permissionIds: initialData?.permissionIds || [] as string[],
  });

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await fetch('/web/api/permissions');
        if (!response.ok) throw new Error('Failed to fetch permissions');
        const data = await response.json();
        setPermissions(data);
      } catch (err: any) {
        toast({
          title: "Error",
          description: getErrorMessage(err, "Unable to load role permissions. Please refresh the page and try again."),
          variant: "destructive",
        });
      } finally {
        setIsLoadingPermissions(false);
      }
    };
    fetchPermissions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Validation Error", description: "Role name is required.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = isEditing ? `/web/api/roles/${initialData?.id}` : '/web/api/roles';
      const method = isEditing ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Role ${isEditing ? 'updated' : 'created'} successfully.`,
          variant: "success",
        });
        router.push('/contractor/settings?tab=roles');
        router.refresh();
      } else {
        const error = await response.json();
        throw new Error(getApiError(error, "Unable to save the role. Please verify the details and try again."));
      }
    } catch (err: any) {
      toast({ title: "Error", description: getErrorMessage(err, "Unable to save the role. Please verify the details and try again."), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (id: string) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(id)
        ? prev.permissionIds.filter(pid => pid !== id)
        : [...prev.permissionIds, id]
    }));
  };

  // ---- Bulk selection helpers ----
  const toggleModulePermissions = (modulePermissions: Permission[]) => {
    const moduleIds = modulePermissions.map((p) => p.id);
    setFormData((prev) => {
      const allSelected = moduleIds.every((id) => prev.permissionIds.includes(id));
      return {
        ...prev,
        permissionIds: allSelected
          ? prev.permissionIds.filter((pid) => !moduleIds.includes(pid))
          : Array.from(new Set([...prev.permissionIds, ...moduleIds])),
      };
    });
  };

  const selectAllPermissions = () => {
    setFormData((prev) => ({ ...prev, permissionIds: permissions.map((p) => p.id) }));
  };

  const clearAllPermissions = () => {
    setFormData((prev) => ({ ...prev, permissionIds: [] }));
  };

  const moduleCheckState = (modulePermissions: Permission[]): boolean | 'indeterminate' => {
    const selectedCount = modulePermissions.filter((p) => formData.permissionIds.includes(p.id)).length;
    if (selectedCount === 0) return false;
    if (selectedCount === modulePermissions.length) return true;
    return 'indeterminate';
  };

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (isLoadingPermissions) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground italic">Loading permissions...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Role Basics</CardTitle>
          <CardDescription>Give your role a name and description.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Project Manager"
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What can people with this role do?"
              disabled={isSubmitting}
              className="h-24"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Permissions & Access</CardTitle>
          <CardDescription>Select what actions this role can perform across different modules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              <span className="font-bold text-foreground">{formData.permissionIds.length}</span> of{' '}
              {permissions.length} permissions selected
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={selectAllPermissions}
                disabled={isSubmitting || permissions.length === 0 || formData.permissionIds.length === permissions.length}
              >
                Select all
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={clearAllPermissions}
                disabled={isSubmitting || formData.permissionIds.length === 0}
              >
                Clear all
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
              <div key={module} className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-xs font-black text-primary uppercase tracking-widest">
                    {module}
                  </h3>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <Checkbox
                      checked={moduleCheckState(modulePermissions)}
                      onCheckedChange={() => toggleModulePermissions(modulePermissions)}
                      disabled={isSubmitting}
                      aria-label={`Select all ${module} permissions`}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      All
                    </span>
                  </label>
                </div>
                <div className="space-y-3">
                  {modulePermissions.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={permission.id}
                        checked={formData.permissionIds.includes(permission.id)}
                        onCheckedChange={() => togglePermission(permission.id)}
                        disabled={isSubmitting}
                        className="mt-0.5"
                      />
                      <div className="grid gap-1 leading-none">
                        <Label
                          htmlFor={permission.id}
                          className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.action}
                        </Label>
                        <p className="text-[10px] text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 pt-4">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="gap-2 px-8"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Update Role' : 'Create Role'}</span>
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
          <span>Cancel</span>
        </Button>
      </div>
    </form>
  );
}
