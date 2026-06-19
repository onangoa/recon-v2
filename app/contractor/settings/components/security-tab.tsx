'use client';

import { useState } from 'react';
import { Lock, Loader2, Save, ShieldCheck, Eye, EyeOff } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';

export default function SecurityTab() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }

    if (formData.newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      // In a real app, this would hit /api/auth/change-password
      const response = await fetch('/web/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to update password');
      }

      toast({ title: "Success", description: "Password updated successfully" });
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-none shadow-md max-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          Account Security
        </CardTitle>
        <CardDescription>Manage your password and protect your account from unauthorized access.</CardDescription>
      </CardHeader>
      <form onSubmit={handlePasswordChange}>
        <CardContent className="space-y-6 pb-12">
          <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We recommend using a strong password that you don't use elsewhere. 
              At least 8 characters with a mix of letters, numbers, and symbols.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input 
                  id="currentPassword" 
                  type={showCurrent ? "text" : "password"}
                  value={formData.currentPassword} 
                  onChange={e => setFormData({...formData, currentPassword: e.target.value})}
                  className="bg-muted/30 border-none pr-10"
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input 
                  id="newPassword" 
                  type={showNew ? "text" : "password"}
                  value={formData.newPassword} 
                  onChange={e => setFormData({...formData, newPassword: e.target.value})}
                  className="bg-muted/30 border-none pr-10"
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  type={showConfirm ? "text" : "password"}
                  value={formData.confirmPassword} 
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  className="bg-muted/30 border-none pr-10"
                  required 
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/20 border-t justify-end p-4">
          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Change Password</span>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
