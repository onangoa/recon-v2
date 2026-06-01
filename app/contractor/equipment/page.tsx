'use client';

import Link from 'next/link';
import { 
  Hammer, 
  Plus, 
  Search, 
  RotateCcw, 
  Trash2, 
  Settings2, 
  MoreVertical,
  Wrench,
  Activity,
  Calendar,
  Fuel,
  MapPin,
  Construction
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function EquipmentPage() {
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
            <BreadcrumbPage>Machines & Equipment</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Heavy Machinery & Equipment</h1>
          <p className="text-muted-foreground mt-1">Monitor, track maintenance, and manage site equipment inventory.</p>
        </div>
        <Button asChild className="gap-2 bg-primary hover:bg-primary/90">
          <Link href="/contractor/equipment/create">
            <Plus className="w-4 h-4" />
            <span>Register Equipment</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md bg-muted/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Operational</p>
                <h3 className="text-2xl font-bold">12 Items</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-muted/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Wrench className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Maintenance</p>
                <h3 className="text-2xl font-bold">3 Items</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-muted/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Fuel className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Value</p>
                <h3 className="text-2xl font-bold">KES 4.2M</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search equipment by name or ID..."
                  className="pl-10 bg-muted/50 border-none h-9 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 h-9 border-muted-foreground/20">
                <Construction className="w-4 h-4" />
                <span>Filter Category</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold text-xs uppercase">Equipment Details</TableHead>
                <TableHead className="font-bold text-xs uppercase text-center">Location</TableHead>
                <TableHead className="font-bold text-xs uppercase text-center">Health</TableHead>
                <TableHead className="font-bold text-xs uppercase text-right">Daily Rate</TableHead>
                <TableHead className="text-right w-[80px] font-bold text-xs uppercase">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="h-[200px] text-center">
                  <div className="flex flex-col items-center justify-center gap-4 py-8">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Hammer className="w-6 h-6 text-muted-foreground opacity-30" />
                    </div>
                    <p className="text-muted-foreground text-sm font-medium italic">Equipment tracking interface - detailed management coming soon</p>
                    <Button variant="link" className="text-primary font-bold">Learn more about equipment tracking</Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
