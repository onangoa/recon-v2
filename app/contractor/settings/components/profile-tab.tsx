'use client';

import { useState, useEffect, useRef } from 'react';
import { User, Loader2, Save, Camera } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfileTab() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [contractor, setContractor] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/web/api/contractors?limit=1');
      const data = await response.json();
      const profile = data.contractors[0];
      
      if (profile) {
        setContractor(profile);
        setFormData({
          name: profile.user.name,
          email: profile.user.email,
          phoneNumber: profile.phoneNumber,
        });
        setAvatarUrl(profile.user.avatar || '');
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "File size must be less than 5MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/web/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) throw new Error('Failed to upload image');

      const data = await response.json();
      setAvatarUrl(data.url);
      
      toast({ title: "Success", description: "Profile picture uploaded. Click Save to apply changes." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractor) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/web/api/contractors/${contractor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber,
          user: {
            update: {
              name: formData.name,
              email: formData.email,
              avatar: avatarUrl,
            }
          }
        }),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      toast({ title: "Success", description: "Profile updated successfully" });
      window.location.reload();
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
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarUrl} alt="Profile" />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                  {formData.name?.charAt(0).toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-2"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  Upload Photo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 5MB.</p>
            </div>

            <div className="flex-1 space-y-6">
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
