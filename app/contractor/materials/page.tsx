'use client';

import Link from 'next/link';
import { 
  Truck, 
  Plus, 
  Search, 
  RotateCcw, 
  Package,
  Calendar,
  ChevronRight,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText
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

export default function MaterialsPage() {
  const deliveries = [
    {
      id: 'DEL-001',
      item: 'Cement (Bamburi)',
      quantity: '500 Bags',
      supplier: 'BuildMart',
      deliveryDate: '2026-06-01',
      status: 'Received',
    },
    {
      id: 'DEL-002',
      item: 'Steel Rods (12mm)',
      quantity: '2 Tons',
      supplier: 'Steel & Co',
      deliveryDate: '2026-06-05',
      status: 'Pending',
    },
  ];

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
            <BreadcrumbPage>Material Deliveries</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Material Supply Chain</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track deliveries, manage incoming stock, and verify material quality.</p>
        </div>
        <Button asChild className="gap-2 bg-primary hover:bg-primary/90">
          <Link href="/contractor/materials/create">
            <Plus className="w-4 h-4" />
            <span>Log New Delivery</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-md bg-muted/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Received</p>
                <h3 className="text-2xl font-bold">24</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-muted/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Expected Today</p>
                <h3 className="text-2xl font-bold">03</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-muted/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Delayed</p>
                <h3 className="text-2xl font-bold">01</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deliveries..."
                className="pl-10 bg-background border-none h-9 text-sm"
              />
            </div>
            <Button variant="ghost" size="sm" className="gap-2 h-9 border-muted-foreground/20">
              <Filter className="w-4 h-4" />
              <span>Filter Status</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Item & Delivery ID</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Quantity</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Supplier</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Delivery Date</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                <TableHead className="text-right w-[80px] font-bold text-xs uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveries.map((delivery) => (
                <TableRow key={delivery.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-1.5 bg-primary/10 rounded">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm">{delivery.item}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{delivery.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-sm">
                    {delivery.quantity}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{delivery.supplier}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center text-[10px] text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      {delivery.deliveryDate}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={`
                      text-[10px] uppercase font-bold px-2 py-0 border-none
                      ${delivery.status === 'Received' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}
                    `}>
                      {delivery.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={6} className="h-20 text-center bg-muted/5">
                  <p className="text-muted-foreground text-xs italic">Detailed material inventory tracking coming soon</p>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
