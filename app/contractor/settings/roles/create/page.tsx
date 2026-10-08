'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import RoleForm from '../../components/role-form';
import { useAuth } from '@/context/auth-context';

export default function CreateRolePage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canCreateRoles = hasPermission('roles:create');

  useEffect(() => {
    if (!canCreateRoles) {
      router.replace('/contractor/settings?tab=roles');
    }
  }, [canCreateRoles, router]);

  if (!canCreateRoles) return null;

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
            <BreadcrumbPage>Create Role</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Create Custom Role</h1>
          <p className="text-muted-foreground mt-1 text-sm">Define a new set of permissions for your team members.</p>
        </div>
      </div>

      <RoleForm />
    </div>
  );
}
