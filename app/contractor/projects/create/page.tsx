'use client';

import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Construction, 
  MapPin, 
  Briefcase, 
  Info,
  Calendar,
  CheckCircle2,
  Building2,
  Navigation
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export default function CreateSitePage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor/projects">Sites</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Create Site</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 border border-muted-foreground/10 hover:bg-muted"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-5 text-muted-foreground" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Initialize New Site</h1>
            <p className="text-muted-foreground mt-1 text-sm italic">Define a new operational location for your construction projects.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
            <Save className="size-4" /> Launch Site
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Navigation className="size-5 text-primary" />
                Site Identity & Location
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label className="font-bold">Project Site Name *</Label>
                <Input placeholder="e.g. Karen Plains Road, Westlands Phase 2" className="bg-muted/30 border-none h-11 text-base focus-visible:ring-primary" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="size-3 text-muted-foreground" /> Primary Location / Region *
                  </Label>
                  <Select>
                    <SelectTrigger className="bg-muted/30 border-none h-10">
                      <SelectValue placeholder="Select Region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nairobi">Nairobi</SelectItem>
                      <SelectItem value="mombasa">Mombasa</SelectItem>
                      <SelectItem value="kisumu">Kisumu</SelectItem>
                      <SelectItem value="kiambu">Kiambu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="size-3 text-muted-foreground" /> Site Category *
                  </Label>
                  <Select>
                    <SelectTrigger className="bg-muted/30 border-none h-10">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="infrastructure">Infrastructure / Roads</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Info className="size-3 text-muted-foreground" /> Precise Coordinates (Optional)
                </Label>
                <Input placeholder="-1.286389, 36.817222" className="bg-muted/30 border-none h-10 font-mono text-xs" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="size-5 text-primary" />
                Operational Scope
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="size-3 text-muted-foreground" /> Commencement Date
                  </Label>
                  <Input type="date" className="bg-muted/30 border-none h-10" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="size-3 text-muted-foreground" /> Estimated Completion
                  </Label>
                  <Input type="date" className="bg-muted/30 border-none h-10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Site Objectives & Description</Label>
                <Textarea placeholder="High-level overview of the work to be performed at this site..." className="bg-muted/30 border-none min-h-[120px]" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-md overflow-hidden bg-primary/5">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-widest text-primary font-black">Activation Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-background p-4 border border-primary/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="size-4" />
                  Live Monitoring Ready
                </div>
                <p className="text-[10px] leading-relaxed text-muted-foreground font-medium">
                  Launching a site enables real-time worker attendance, material tracking, and equipment logging for this location.
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-lg">
                <Construction className="size-4 mr-2" /> Launch Site Instance
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
