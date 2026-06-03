'use client';

import Link from 'next/link';
import { 
  Package, 
  Plus, 
  Search, 
  RotateCcw, 
  Trash2, 
  Settings2, 
  ChevronRight,
  Filter,
  MoreVertical,
  ArrowUpDown,
  FolderPlus,
  Layers
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
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export default function InventoryPage() {
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
            <BreadcrumbPage>Inventory</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage site materials and equipment stock levels.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/contractor/inventory/categories">
              <Layers className="w-4 h-4" />
              <span>Manage Categories</span>
            </Link>
          </Button>
          <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-white">
            <Link href="/contractor/inventory/create">
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory..."
                  className="pl-10 bg-muted/50 border-none h-9"
                />
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-destructive gap-2 h-9">
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete Selected</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 h-9">
                <Settings2 className="w-4 h-4 text-muted-foreground" />
                <span className="hidden sm:inline">Columns</span>
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
                <TableHead className="font-bold">
                  <div className="flex items-center gap-2">
                    Item Name
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="font-bold text-center">SKU</TableHead>
                <TableHead className="font-bold">Category</TableHead>
                <TableHead className="font-bold text-right">Stock Level</TableHead>
                <TableHead className="font-bold text-right">Unit Price</TableHead>
                <TableHead className="font-bold text-center">Status</TableHead>
                <TableHead className="text-right w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Empty State */}
              <TableRow>
                <TableCell colSpan={8} className="h-[300px] text-center">
                  <div className="flex flex-col items-center justify-center gap-4 py-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="w-8 h-8 text-primary opacity-60" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">No Inventory Items Found</h3>
                      <p className="text-sm text-muted-foreground max-w-[300px] mx-auto mt-1">
                        Your inventory list is currently empty. Start by adding new materials or equipment.
                      </p>
                    </div>
                    <Button asChild variant="outline" className="mt-2">
                      <Link href="/contractor/inventory/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Item
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
