'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  FileText, 
  ShieldCheck, 
  Briefcase,
  Users,
  Settings,
  Pencil,
  Save,
  Globe,
  Mail,
  Camera,
  CheckCircle2
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function CompanyProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Company Profile</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Company Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm italic">Manage your corporate identity and operational credentials.</p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button className="bg-primary hover:bg-primary/90 text-white gap-2" onClick={() => setIsEditing(false)}>
                <Save className="size-4" /> Save Profile
              </Button>
            </>
          ) : (
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2" onClick={() => setIsEditing(true)}>
              <Pencil className="size-4" /> Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-md overflow-hidden">
            <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-primary/10 shadow-xl">
                  <AvatarImage src="/placeholder-logo.png" />
                  <AvatarFallback className="bg-primary/5 text-primary text-4xl font-black">NB</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="text-white size-8" />
                  </div>
                )}
              </div>
              <h2 className="mt-4 text-xl font-bold">Nairobi Builders Ltd</h2>
              <Badge variant="secondary" className="mt-1 bg-primary/10 text-primary border-none">General Contractor</Badge>
              
              <div className="w-full mt-8 space-y-4 text-left">
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="size-4 text-primary/60 shrink-0" />
                  <span className="truncate">www.nairobibuilders.ke</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="size-4 text-primary/60 shrink-0" />
                  <span className="truncate">ops@nairobibuilders.ke</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="size-4 text-primary/60 shrink-0" />
                  <span>+254 711 000 000</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-emerald-50 border-emerald-100 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-widest text-emerald-700 font-black">Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-800/60 uppercase">NCA Class</span>
                <span className="text-sm font-black text-emerald-900">NCA 1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-800/60 uppercase">Safety Score</span>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="size-3 text-emerald-600" />
                  <span className="text-sm font-black text-emerald-900">9.2/10</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                Corporate Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="font-bold text-muted-foreground uppercase text-[10px]">Legal Entity Name</Label>
                  {isEditing ? (
                    <Input defaultValue="Nairobi Builders Limited" className="bg-muted/30 border-none h-10" />
                  ) : (
                    <p className="text-lg font-bold">Nairobi Builders Limited</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-muted-foreground uppercase text-[10px]">Headquarters</Label>
                  {isEditing ? (
                    <Input defaultValue="Upper Hill, Nairobi" className="bg-muted/30 border-none h-10" />
                  ) : (
                    <p className="text-lg font-bold">Upper Hill, Nairobi</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="font-bold text-muted-foreground uppercase text-[10px]">Registration No / KRA PIN</Label>
                  <p className="text-lg font-mono font-bold">P051XXXXXXX</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-muted-foreground uppercase text-[10px]">Tax Compliance Status</Label>
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="size-5" />
                    <span className="font-bold">Active & Compliant</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="font-bold text-muted-foreground uppercase text-[10px]">Company Mission & Bio</Label>
                {isEditing ? (
                  <Textarea className="bg-muted/30 border-none min-h-[120px]" defaultValue="Pioneering infrastructure development across East Africa with a commitment to sustainable engineering and quality craftsmanship." />
                ) : (
                  <p className="text-base leading-relaxed italic text-muted-foreground">
                    "Pioneering infrastructure development across East Africa with a commitment to sustainable engineering and quality craftsmanship."
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-md bg-primary/5">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Briefcase className="size-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Active Projects</p>
                  <h4 className="text-2xl font-black">14</h4>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md bg-primary/5">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="size-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Workforce</p>
                  <h4 className="text-2xl font-black">320+</h4>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md bg-primary/5">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Settings className="size-6 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Fleet Size</p>
                  <h4 className="text-2xl font-black">45</h4>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
