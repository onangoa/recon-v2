'use client';

import { 
  Bell, 
  ShieldCheck, 
  User, 
  CreditCard, 
  Lock,
  Fingerprint,
} from 'lucide-react';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'next/navigation';
import ProfileTab from './components/profile-tab';
import NotificationsTab from './components/notifications-tab';
import SecurityTab from './components/security-tab';
import SubscriptionTab from './components/subscription-tab';
import RolesTab from './components/roles-tab';
import DevicesTab from './components/devices-tab';

export default function ContractorSettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><span>Loading...</span></div>}>
      <ContractorSettingsContent />
    </Suspense>
  );
}

function ContractorSettingsContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'profile';

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
            <BreadcrumbPage>Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Configuration & Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your professional profile, security, and preferences.</p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} key={defaultTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 mb-8">
          <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary">
            <User className="w-4 h-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary">
            <Bell className="w-4 h-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary">
            <Lock className="w-4 h-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary">
            <CreditCard className="w-4 h-4" /> Subscription
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary">
            <ShieldCheck className="w-4 h-4" /> Roles & Permissions
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary">
            <Fingerprint className="w-4 h-4" /> Devices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationsTab />
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <SubscriptionTab />
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <RolesTab />
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <DevicesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
