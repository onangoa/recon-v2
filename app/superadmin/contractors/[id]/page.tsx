'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Phone, 
  Mail,
  ShieldCheck,
  Calendar,
  Users,
  DollarSign,
  Edit2,
  Trash2,
  FileText,
  CreditCard,
  Wallet,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";

interface Contractor {
  id: string;
  companyName: string;
  location: string;
  phoneNumber: string;
  licenseNo: string;
  subscriptionPlanId: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  subscriptionPlan: {
    name: string;
    price: number;
  };
  createdAt: string;
  employees?: any[];
  projects?: any[];
  invoices?: any[];
  wallets?: any[];
}

export default function ContractorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const id = params.id as string;

  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContractor();
  }, [id]);

  const fetchContractor = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/web/api/superadmin/contractors/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch contractor');
      }
      const data = await res.json();
      setContractor(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load contractor details",
        variant: "destructive",
      });
      router.push('/superadmin/contractors');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contractor? This will also delete their user account and all associated data.')) return;

    try {
      const res = await fetch(`/web/api/superadmin/contractors/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Deleted",
          description: "Contractor deleted successfully",
        });
        router.push('/superadmin/contractors');
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete contractor",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card className="border-none shadow-md">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Contractor not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/superadmin/contractors')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Contractor Details</h1>
            <p className="text-muted-foreground">View and manage contractor information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Edit2 className="w-4 h-4" /> Edit Profile
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-md md:col-span-2">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Company Name</label>
                <p className="text-lg font-semibold mt-1">{contractor.companyName}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">License Number</label>
                <p className="text-lg font-semibold mt-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  {contractor.licenseNo}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Location</label>
                <p className="text-lg font-semibold mt-1 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {contractor.location}
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Phone Number</label>
                <p className="text-lg font-semibold mt-1 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  {contractor.phoneNumber}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Contact Person
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Name</label>
              <p className="text-lg font-semibold mt-1">{contractor.user.name}</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Email Address</label>
              <p className="text-lg font-semibold mt-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                {contractor.user.email}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-md">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Subscription Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{contractor.subscriptionPlan.name}</p>
            <p className="text-muted-foreground mt-1">
              KES {contractor.subscriptionPlan.price?.toLocaleString() || 'N/A'}/month
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Employees
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{contractor.employees?.length || 0}</p>
            <p className="text-muted-foreground mt-1">Active employees</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">{contractor.projects?.length || 0}</p>
            <p className="text-muted-foreground mt-1">Active projects</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">
              KES {contractor.wallets?.[0]?.balance?.toLocaleString() || '0'}
            </p>
            <p className="text-muted-foreground mt-1">Available balance</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="border-b border-border/50">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Account Created</label>
              <p className="text-lg font-semibold mt-1">
                {new Date(contractor.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Account ID</label>
              <p className="text-lg font-semibold mt-1 font-mono">{contractor.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}