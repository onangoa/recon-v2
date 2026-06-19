'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Plus, Loader2, CheckCircle2, AlertCircle, Info, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Permission {
  id: string;
  name: string;
  module: string;
  action: string;
  description: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Permission[];
  contractorId: string | null;
}

export default function RolesTab() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/web/api/roles');
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles(data);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm('Are you sure you want to delete this custom role? This action cannot be undone.')) return;
    
    setIsDeleting(id);
    try {
      const response = await fetch(`/web/api/roles/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast({ title: "Success", description: "Role deleted successfully.", variant: "success" });
        fetchRoles();
      } else {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete role');
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground italic">Loading roles & permissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Roles & Permissions</h2>
          <p className="text-sm text-muted-foreground">Manage access levels for your team members.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/contractor/settings/roles/create">
            <Plus className="w-4 h-4" /> Create Custom Role
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <Card key={role.id} className="border-none shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                </div>
                {!role.contractorId && (
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold bg-blue-100 text-blue-700 border-none">
                    System Role
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs mt-1">
                {role.description || 'No description provided.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Permissions Overview</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.length > 20 ? (
                      <>
                        <Badge variant="outline" className="text-[10px] font-semibold border-primary/20 text-primary">
                          Full Access
                        </Badge>
                        <span className="text-[10px] text-muted-foreground italic mt-0.5 ml-1">
                          (Includes all {role.permissions.length} modules)
                        </span>
                      </>
                    ) : (
                      role.permissions.map((p) => (
                        <Badge key={p.id} variant="outline" className="text-[10px] font-semibold bg-muted/30">
                          {p.name}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-muted-foreground/5 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {role.contractorId ? 'Customized for your company' : 'Standard platform role'}
                  </span>
                  {role.contractorId && (
                    <div className="flex gap-2">
                      <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/5">
                        <Link href={`/contractor/settings/roles/edit/${role.id}`}>
                          <Pencil className="w-3 h-3" /> Edit
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/5"
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={isDeleting === role.id}
                      >
                        {isDeleting === role.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
