'use client';

import { 
  Settings, 
  Building2, 
  Bell, 
  ShieldCheck, 
  User, 
  CreditCard, 
  Lock,
  Save,
  Globe,
  Mail,
  Smartphone
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
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export default function ContractorSettingsPage() {
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
          <p className="text-muted-foreground mt-1 text-sm">Manage your professional profile, company details, and preferences.</p>
        </div>
        <Button className="gap-2 bg-primary hover:bg-primary/90">
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </Button>
      </div>

      <Tabs defaultValue="company" className="w-full">
        <TabsList className="bg-muted/50 p-1 mb-8">
          <TabsTrigger value="company" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary">
            <Building2 className="w-4 h-4" /> Company
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary">
            <User className="w-4 h-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary">
            <Bell className="w-4 h-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary">
            <Lock className="w-4 h-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2 data-[state=active]:bg-background data-[state=active]:text-primary">
            <CreditCard className="w-4 h-4" /> Subscription
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6 max-w-4xl">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Company Information
              </CardTitle>
              <CardDescription>Primary details for your construction business.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Registered Company Name</Label>
                  <Input id="companyName" defaultValue="Nairobi Builders Ltd" className="bg-muted/30 border-none" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNo">NCA License Number</Label>
                  <Input id="licenseNo" defaultValue="LIC-001-2024" className="bg-muted/30 border-none" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Headquarters Location</Label>
                  <Input id="location" defaultValue="Nairobi" className="bg-muted/30 border-none" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border-r-0 border-muted bg-muted/50 text-muted-foreground text-xs font-mono">https://</span>
                    <Input id="website" defaultValue="nairobibuilders.ke" className="rounded-l-none bg-muted/30 border-none h-9" />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="bio">Company Bio / Description</Label>
                <textarea 
                  id="bio"
                  className="flex min-h-[100px] w-full rounded-md border-none bg-muted/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue="Leading construction and engineering firm based in Nairobi, specializing in large-scale road projects and urban infrastructure."
                ></textarea>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t justify-end p-4">
              <Button size="sm" className="bg-primary hover:bg-primary/90">Update Company Info</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 max-w-2xl">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Control how you receive alerts and updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground text-balance">Receive daily digests and project status reports via email.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">SMS Alerts</Label>
                    <p className="text-xs text-muted-foreground text-balance">Critical safety alerts sent directly to your phone.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Task Reminders</Label>
                    <p className="text-xs text-muted-foreground text-balance">Automated reminders for pending and overdue site tasks.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Safety Incidents</Label>
                    <p className="text-xs text-muted-foreground text-balance">Real-time alerts for reported safety concerns on site.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Other tabs remain under construction or similar placeholder structure */}
        <TabsContent value="security" className="space-y-6 max-w-2xl">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Account Security
              </CardTitle>
              <CardDescription>Manage password and authentication settings.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Security module loading...</p>
              <Button variant="outline" size="sm" className="border-primary/20 text-primary hover:bg-primary/5">Change Password</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
