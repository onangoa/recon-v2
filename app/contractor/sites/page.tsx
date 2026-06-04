'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Plus, 
  Search, 
  RotateCcw, 
  Construction, 
  Building2, 
  MoreVertical,
  ExternalLink,
  Pencil,
  Trash2,
  Calendar,
  Navigation,
  Globe
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useSite } from '@/hooks/use-site';

export default function SitesManagementPage() {
  const { sites, activeSite, setActiveSite } = useSite();

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Site Management</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Project Sites</h1>
          <p className="text-muted-foreground mt-1 text-sm italic">Oversee all active, pending, and completed construction locations.</p>
        </div>
        <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <Link href="/contractor/sites/create">
            <Plus className="size-4" /> Add New Site
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Navigation className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Sites</p>
                <h4 className="text-xl font-black">{sites.length}</h4>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter by name or location..."
                className="pl-8 bg-background border-none h-9 text-xs"
              />
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <RotateCcw className="size-4 text-muted-foreground" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold text-xs uppercase">Site Identity</TableHead>
                <TableHead className="font-bold text-xs uppercase">Location</TableHead>
                <TableHead className="font-bold text-xs uppercase text-center">Category</TableHead>
                <TableHead className="font-bold text-xs uppercase text-center">Status</TableHead>
                <TableHead className="text-right w-[120px] font-bold text-xs uppercase">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => (
                <TableRow key={site.id} className={`hover:bg-muted/20 transition-colors ${activeSite?.id === site.id ? 'bg-primary/5' : ''}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${activeSite?.id === site.id ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground'}`}>
                        {site.name.includes('Road') ? <Construction className="size-4" /> : <Building2 className="size-4" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">{site.name}</span>
                        {activeSite?.id === site.id && <span className="text-[9px] font-black text-primary uppercase">Current Active</span>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {site.location}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-[10px] py-0 border-primary/20 text-primary/70">{site.plan}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] uppercase font-bold px-2 py-0">Active</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {activeSite?.id !== site.id && (
                        <Button variant="ghost" size="sm" className="text-[10px] h-7 font-bold text-primary px-2" onClick={() => setActiveSite(site)}>
                          Activate
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="size-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem className="gap-2">
                            <ExternalLink className="size-4" /> View Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Pencil className="size-4" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive">
                            <Trash2 className="size-4" /> Decommission
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
