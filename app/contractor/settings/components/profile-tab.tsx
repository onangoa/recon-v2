'use client';

import { useState, useEffect } from 'react';
import { User, Loader2, Save } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function ProfileTab() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [contractor, setContractor] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    companyName: '',
    phoneNumber: '',
    location: '',
    licenseNo: '',
  });

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      // In a real app, the ID would come from the session
      // For now, we'll fetch the first contractor for demo purposes
      const response = await fetch('/api/contractors?limit=1');
      const data = await response.json();
      const profile = data.contractors[0];
      
      if (profile) {
        setContractor(profile);
        setFormData({
          name: profile.user.name,
          email: profile.user.email,
          companyName: profile.companyName,
          phoneNumber: profile.phoneNumber,
          location: profile.location,
          licenseNo: profile.licenseNo,
        });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractor) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/contractors/${contractor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          phoneNumber: formData.phoneNumber,
          location: formData.location,
          licenseNo: formData.licenseNo,
          user: {
            update: {
              name: formData.name,
              email: formData.email,
            }
          }
        }),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      toast({ title: "Success", description: "Profile updated successfully" });
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
          <p className="text-sm text-muted-foreground">Loading your profile...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-md max-w-4xl">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          User Profile Details
        </CardTitle>
        <CardDescription>Manage your personal account information and contact details.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="space-y-8 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="bg-muted/30 border-none" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail Address</Label>
              <Input 
                id="email" 
                type="email"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="bg-muted/30 border-none" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input 
                id="phoneNumber" 
                value={formData.phoneNumber} 
                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                className="bg-muted/30 border-none" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Account Role</Label>
              <Input 
                id="role" 
                value={contractor?.user?.role || 'Contractor'} 
                disabled
                className="bg-muted/10 border-none italic opacity-70" 
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Company Association</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input 
                  id="companyName" 
                  value={formData.companyName} 
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                  className="bg-muted/30 border-none" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Headquarters Location</Label>
                <Input 
                  id="location" 
                  value={formData.location} 
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="bg-muted/30 border-none" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNo">NCA License Number</Label>
                <Input 
                  id="licenseNo" 
                  value={formData.licenseNo} 
                  onChange={e => setFormData({...formData, licenseNo: e.target.value})}
                  className="bg-muted/30 border-none" 
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/20 border-t justify-end p-4">
          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Profile Changes</span>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
