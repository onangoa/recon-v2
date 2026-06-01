'use client';

import Link from 'next/link';
import { 
  Upload, 
  Plus, 
  Search, 
  RotateCcw, 
  Trash2, 
  Settings2, 
  FileText,
  Image as ImageIcon,
  MoreVertical,
  Star,
  FolderOpen
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

export default function SiteUploadsPage() {
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
            <BreadcrumbLink href="/contractor/projects">Sites</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Karen Plains Road Project</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <FolderOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Site Documents</h1>
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <p className="text-muted-foreground mt-1 text-sm">Karen Plains Road Project Uploads & Documentation</p>
          </div>
        </div>
        <Button asChild className="gap-2 bg-primary hover:bg-primary/90">
          <Link href="/contractor/uploads/create">
            <Plus className="w-4 h-4" />
            <span>Upload New File</span>
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 rounded-xl border border-primary/10">
        <ImageIcon className="w-5 h-5 text-primary" />
        <span className="font-semibold text-primary text-sm">Media & Assets</span>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="pb-3 bg-muted/20 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search project files..."
                  className="pl-10 bg-background border-none h-9 text-sm"
                />
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-destructive gap-2 h-9 hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-semibold uppercase">Delete</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 h-9">
                <Settings2 className="w-4 h-4 text-muted-foreground" />
                <span className="hidden sm:inline text-xs font-semibold uppercase">Columns</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[50px]">
                  <input type="checkbox" className="rounded border-muted-foreground/30 accent-primary" />
                </TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">File</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Title / Description</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">File Size</TableHead>
                <TableHead className="text-right w-[100px] text-xs uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="h-[300px] text-center">
                  <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="w-8 h-8 text-muted-foreground opacity-40" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">No files uploaded yet</h3>
                      <p className="text-sm text-muted-foreground max-w-[300px] mx-auto mt-1">
                        Any photos, blueprints, or documents uploaded from the site will appear here.
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="mt-2 border-primary/20 text-primary hover:bg-primary/5">
                      <Link href="/contractor/uploads/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Start Uploading
                      </Link>
                    </Button>
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
