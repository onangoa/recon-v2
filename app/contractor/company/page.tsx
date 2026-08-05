'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Edit,
  Loader2,
  AlertCircle
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getApiError, getErrorMessage } from '@/lib/toast-utils';

interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  licenseNo: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export default function CompaniesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const response = await fetch('/web/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
      } else {
        const errorData = await response.json();
        setError(getApiError(errorData, "Unable to load company information. Please refresh the page and try again."));
        toast({
          title: "Error",
          description: getApiError(errorData, "Unable to load company information. Please refresh the page and try again."),
          variant: "destructive",
        });
      }
    } catch (error) {
      setError(getErrorMessage(error, "Unable to load company information. Please refresh the page and try again."));
      toast({
        title: "Error",
        description: getErrorMessage(error, "Unable to load company information. Please check your connection and try again."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (company) {
      router.push(`/contractor/company/edit/${company.id}`);
    }
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
            <BreadcrumbPage>Company</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Company Information</h1>
          <p className="text-muted-foreground mt-1 text-sm italic">View and manage your contractor company details.</p>
        </div>
        {company && (
          <Button 
            onClick={handleEdit}
            className="bg-primary hover:bg-primary/90 text-white gap-2"
          >
            <Edit className="size-4" />
            Edit Company
          </Button>
        )}
      </div>

      {/* Company Details */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted/20 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            Company Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchCompany} className="mt-2 text-destructive hover:text-destructive">
                Try Again
              </Button>
            </div>
          ) : company ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Company Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Company Name</label>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="size-5 text-primary" />
                  </div>
                  <p className="font-bold text-lg">{company.name}</p>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="size-4 text-muted-foreground" />
                  <span>{company.email || 'N/A'}</span>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Phone Number</label>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-muted-foreground" />
                  <span>{company.phone || 'N/A'}</span>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Location</label>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span>{company.location || 'N/A'}</span>
                </div>
              </div>

              {/* License Number */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">License Number</label>
                <div>
                  <Badge variant="outline" className="text-sm">
                    {company.licenseNo || 'N/A'}
                  </Badge>
                </div>
              </div>

              {/* Registration Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Registered Since</label>
                <p className="text-sm">
                  {new Date(company.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="size-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">No company information found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}