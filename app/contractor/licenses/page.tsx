'use client';

import Link from 'next/link';
import { 
  FileText, 
  Plus, 
  Search, 
  RotateCcw, 
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Building2,
  ExternalLink
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

export default function LicensesPage() {
  const licenses = [
    {
      id: '1',
      number: 'LIC-2024-001',
      type: 'Contractor License',
      issuingAuthority: 'Ministry of Works',
      issueDate: '2024-01-15',
      expiryDate: '2025-01-14',
      status: 'Active',
    },
    {
      id: '2',
      number: 'PER-2026-042',
      type: 'Environmental Permit',
      issuingAuthority: 'NEMA',
      issueDate: '2026-03-10',
      expiryDate: '2027-03-09',
      status: 'Active',
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
            <BreadcrumbPage>Compliance & Licenses</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Compliance Records</h1>
          <p className="text-muted-foreground mt-1">Monitor license renewals, permits, and regulatory certificates.</p>
        </div>
        <Button asChild className="gap-2 bg-primary hover:bg-primary/90">
          <Link href="/contractor/licenses/create">
            <Plus className="w-4 h-4" />
            <span>Register New License</span>
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-md bg-emerald-50 border-emerald-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Valid</p>
                <h3 className="text-2xl font-bold text-emerald-900">08</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-amber-50 border-amber-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Expiring Soon</p>
                <h3 className="text-2xl font-bold text-amber-900">02</h3>
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
                placeholder="Search by license # or type..."
                className="pl-10 bg-background border-none h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold text-xs uppercase tracking-wider">License Detail</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Issuing Body</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Validity Period</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                <TableHead className="text-right w-[80px] font-bold text-xs uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.map((license) => (
                <TableRow key={license.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-1.5 bg-primary/10 rounded">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm">{license.type}</span>
                        <span className="text-[10px] font-mono text-muted-foreground tracking-tighter">{license.number}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-xs">
                      <Building2 className="w-3 h-3 mr-2 text-muted-foreground" />
                      {license.issuingAuthority}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center text-[10px] text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        {license.issueDate} — {license.expiryDate}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none font-medium text-[10px] uppercase px-2 py-0">
                      {license.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem className="gap-2">
                          <ExternalLink className="w-4 h-4" /> View Document
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Pencil className="w-4 h-4" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive">
                          <Trash2 className="w-4 h-4" /> Revoke/Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
