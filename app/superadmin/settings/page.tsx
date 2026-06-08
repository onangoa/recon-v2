'use client';

import { useState } from 'react';
import { 
  Settings, 
  Shield, 
  CreditCard, 
  Bell, 
  Globe, 
  Save,
  Lock,
  Mail,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSave = async (section: string) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast.success(`${section} settings saved successfully`);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Platform Settings</h1>
        <p className="text-muted-foreground">Configure global platform parameters, security, and integrations.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mb-8">
          <TabsTrigger value="general" className="gap-2"><Settings className="w-4 h-4" /> General</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield className="w-4 h-4" /> Security</TabsTrigger>
          <TabsTrigger value="mpesa" className="gap-2"><Smartphone className="w-4 h-4" /> M-Pesa</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" /> Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Global Information</CardTitle>
              <CardDescription>Main platform branding and identification.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input id="platform-name" defaultValue="RECONHUB" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Global Support Email</Label>
                  <Input id="support-email" type="email" defaultValue="support@reconhub.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="base-url">Base Platform URL</Label>
                <Input id="base-url" defaultValue="https://app.reconhub.com" />
              </div>
            </CardContent>
            <CardFooter className="border-t border-border pt-4">
              <Button onClick={() => handleSave('General')} disabled={loading} className="gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>Configure currency and locale defaults.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currency">Base Currency</Label>
                  <Input id="currency" defaultValue="KES" readOnly />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Input id="timezone" defaultValue="Africa/Nairobi (GMT+3)" readOnly />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Authentication Security</CardTitle>
              <CardDescription>Manage password policies and session behavior.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Multi-Factor Authentication (MFA)</Label>
                  <p className="text-sm text-muted-foreground">Require MFA for all super administrator accounts.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Session Timeout</Label>
                  <p className="text-sm text-muted-foreground">Automatically log out inactive users after 30 minutes.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Strict Password Policy</Label>
                  <p className="text-sm text-muted-foreground">Require uppercase, symbols, and minimum 12 characters.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
            <CardFooter className="border-t border-border pt-4">
              <Button onClick={() => handleSave('Security')} disabled={loading} className="gap-2">
                <Save className="w-4 h-4" /> Update Policies
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="mpesa" className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Safaricom Daraja API</CardTitle>
              <CardDescription>Configure credentials for M-Pesa STK Push and C2B payments.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="shortcode">Business Shortcode</Label>
                  <Input id="shortcode" defaultValue="174379" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passkey">LNM Passkey</Label>
                  <div className="relative">
                    <Input id="passkey" type={showApiKey ? "text" : "password"} defaultValue="bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919" />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-0 top-0 h-full px-3" 
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="consumer-key">Consumer Key</Label>
                <Input id="consumer-key" defaultValue="h9v8u7...3b2a1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consumer-secret">Consumer Secret</Label>
                <Input id="consumer-secret" type="password" defaultValue="secret_key_here" />
              </div>
            </CardContent>
            <CardFooter className="border-t border-border pt-4">
              <div className="flex gap-3">
                <Button onClick={() => handleSave('M-Pesa')} disabled={loading} className="gap-2">
                  <Save className="w-4 h-4" /> Save Credentials
                </Button>
                <Button variant="outline" className="gap-2">
                  Test Connection
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Configure which events trigger notifications to admins.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> New Subscriptions</Label>
                  <p className="text-sm text-muted-foreground">Notify when a new contractor subscribes to a plan.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2"><Shield className="w-4 h-4" /> Security Breaches</Label>
                  <p className="text-sm text-muted-foreground">Notify on multiple failed login attempts.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2"><Smartphone className="w-4 h-4" /> M-Pesa Failures</Label>
                  <p className="text-sm text-muted-foreground">Notify when a payment request fails at the gateway.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
            <CardFooter className="border-t border-border pt-4">
              <Button onClick={() => handleSave('Notifications')} disabled={loading} className="gap-2">
                <Save className="w-4 h-4" /> Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
