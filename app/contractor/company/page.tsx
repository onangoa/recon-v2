'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Plus,
  Edit,
  Trash2,
  Loader2
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  description: string | null;
  taxId: string | null;
  registrationNumber: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CompaniesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch companies.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch companies.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/companies/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Company has been deleted.",
        });
        fetchCompanies();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete company.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete company.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (company: Company) => {
    router.push(`/contractor/company/edit/${company.id}`);
  };

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
            <BreadcrumbPage>Companies</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Companies</h1>
          <p className="text-muted-foreground mt-1 text-sm italic">Manage all companies associated with your contractor account.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => router.push('/contractor/company/create')}
            className="bg-primary hover:bg-primary/90 text-white gap-2"
          >
            <Plus className="size-4" />
            Add Company
          </Button>
        </div>
      </div>

      {/* Companies Table */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted/20 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            Company Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase">Company Name</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Contact Information</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Location</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Registration</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <div className="space-y-2">
                        <Building2 className="size-12 mx-auto text-muted-foreground/50" />
                        <p className="text-lg font-medium">No companies found</p>
                        <p className="text-sm">Get started by adding your first company.</p>
                        <Button 
                          onClick={() => router.push('/contractor/company/create')}
                          className="mt-4"
                        >
                          <Plus className="size-4 mr-2" />
                          Add Company
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  companies.map((company) => (
                    <TableRow key={company.id} className="hover:bg-muted/5">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="size-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{company.name}</p>
                            {company.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {company.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {company.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="size-3 text-muted-foreground" />
                              <span className="truncate">{company.email}</span>
                            </div>
                          )}
                          {company.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="size-3 text-muted-foreground" />
                              <span>{company.phone}</span>
                            </div>
                          )}
                          {company.website && (
                            <div className="flex items-center gap-2 text-sm">
                              <Globe className="size-3 text-muted-foreground" />
                              <a 
                                href={company.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline truncate"
                              >
                                {company.website}
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {company.address && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="size-3 text-muted-foreground" />
                              <span className="truncate">{company.address}</span>
                            </div>
                          )}
                          {(company.city || company.country) && (
                            <p className="text-sm text-muted-foreground">
                              {company.city}{company.city && company.country ? ', ' : ''}{company.country}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {company.registrationNumber && (
                            <Badge variant="outline" className="text-xs">
                              Reg: {company.registrationNumber}
                            </Badge>
                          )}
                          {company.taxId && (
                            <Badge variant="secondary" className="text-xs">
                              Tax: {company.taxId}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(company)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(company.id)}
                            disabled={deletingId === company.id}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            {deletingId === company.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-md bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Companies</p>
                <h4 className="text-2xl font-black">{companies.length}</h4>
              </div>
              <Building2 className="size-8 text-primary/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-emerald-800/60 uppercase">Active</p>
                <h4 className="text-2xl font-black text-emerald-900">{companies.length}</h4>
              </div>
              <div className="size-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <div className="size-4 rounded-full bg-emerald-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-blue-800/60 uppercase">With Email</p>
                <h4 className="text-2xl font-black text-blue-900">
                  {companies.filter(c => c.email).length}
                </h4>
              </div>
              <Mail className="size-8 text-blue/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-md bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-purple-800/60 uppercase">With Website</p>
                <h4 className="text-2xl font-black text-purple-900">
                  {companies.filter(c => c.website).length}
                </h4>
              </div>
              <Globe className="size-8 text-purple/40" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
