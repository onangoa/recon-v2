'use client';

import { useState, useEffect } from 'react';
import { Bell, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function NotificationsTab() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [contractorId, setContractorId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<any[]>([]);

  const fetchPreferences = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/contractors?limit=1');
      const data = await resp.json();
      const contractor = data.contractors[0];
      
      if (contractor) {
        setContractorId(contractor.id);
        const prefResp = await fetch(`/api/contractors/${contractor.id}/notification-preferences`);
        const prefData = await prefResp.json();
        setPreferences(prefData);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load preferences", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  const handleToggle = (type: string, field: 'emailEnabled' | 'pushEnabled') => {
    setPreferences(prev => prev.map(p => 
      p.type === type ? { ...p, [field]: !p[field] } : p
    ));
  };

  const handleSave = async () => {
    if (!contractorId) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/contractors/${contractorId}/notification-preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) throw new Error('Failed to save preferences');
      toast({ title: "Success", description: "Preferences saved successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading preferences...</p>
        </CardContent>
      </Card>
    );
  }

  const types = [
    { key: 'payroll', label: 'Payroll & Payments', desc: 'Updates on salary processing and contractor payouts.' },
    { key: 'safety', label: 'Safety Incidents', desc: 'Real-time alerts for reported safety concerns on site.' },
    { key: 'inventory', label: 'Inventory & Stock', desc: 'Alerts for low stock levels and material deliveries.' },
    { key: 'team', label: 'Team Management', desc: 'Updates on team member status and role changes.' },
  ];

  return (
    <Card className="border-none shadow-md max-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notification Preferences
        </CardTitle>
        <CardDescription>Control how you receive alerts and updates. Every setting is saved independently.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          {types.map((type, index) => {
            const pref = preferences.find(p => p.type === type.key) || { emailEnabled: true, pushEnabled: true };
            return (
              <div key={type.key}>
                <div className="flex flex-col space-y-4">
                  <div className="space-y-1">
                    <Label className="text-base font-bold">{type.label}</Label>
                    <p className="text-xs text-muted-foreground">{type.desc}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 ml-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${type.key}-email`} className="text-sm cursor-pointer">Email Notifications</Label>
                      <Switch 
                        id={`${type.key}-email`} 
                        checked={pref.emailEnabled} 
                        onCheckedChange={() => handleToggle(type.key, 'emailEnabled')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${type.key}-push`} className="text-sm cursor-pointer">Push Notifications</Label>
                      <Switch 
                        id={`${type.key}-push`} 
                        checked={pref.pushEnabled} 
                        onCheckedChange={() => handleToggle(type.key, 'pushEnabled')}
                      />
                    </div>
                  </div>
                </div>
                {index < types.length - 1 && <Separator className="mt-6" />}
              </div>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/20 border-t justify-end p-4">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Preferences</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
