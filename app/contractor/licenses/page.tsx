'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
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
  ExternalLink,
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { getApiError, getErrorMessage } from '@/lib/toast-utils';
import { useRouter } from 'next/navigation';
import { useSite } from '@/hooks/use-site';

interface License {
  id: string;
  name: string;
  licenseNumber: string;
  issuingAuthority: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  type: string | null;
  category: string | null;
  status: string;
  fileName: string | null;
  fileData: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function LicensesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { activeSite } = useSite();
  
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const [licenseToDelete, setLicenseToDelete] = useState<License | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLicenses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/web/api/licenses?page=${currentPage}&limit=${limit}&search=${searchQuery}${activeSite ? `&siteId=${activeSite.id}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch licenses');
      const data = await response.json();
      setLicenses(data.licenses);
      setTotalPages(data.pagination.pages);
      setTotalCount(data.pagination.total);
    } catch (err: any) {
      setError(getErrorMessage(err, "Unable to load licenses. Please refresh the page and try again."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else fetchLicenses();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeSite]);

  useEffect(() => {
    fetchLicenses();
  }, [currentPage]);

  const handleDelete = async () => {
    if (!licenseToDelete) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/web/api/licenses/${licenseToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Deleted",
          description: "License has been removed",
          variant: "success",
          action: (
            <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          ),
        });
        setIsDeleteDialogOpen(false);
        if (licenses.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          fetchLicenses();
        }
      } else {
        throw new Error('Unable to delete the license. Please try again.');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Unable to delete the license. Please check your connection and try again."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
      'expired': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
      'expiring-soon': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100' 
    };
    
    return (
      <Badge variant="secondary" className={`${config.bg} ${config.text} ${config.border} border-none text-[10px] font-black uppercase px-2 py-0`}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Compliance Records</h1>
          <p className="text-muted-foreground mt-1">Monitor license renewals, permits, and regulatory certificates.</p>
        </div>
        <Button asChild className="gap-2 bg-primary hover:bg-primary/90">
          <Link href="/contractor/licenses/create">
            <Plus className="w-4 h-4" />
            <span>Add License</span>
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by license # or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-none h-10 text-sm shadow-sm"
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 hover:bg-background hover:text-primary transition-colors"
              onClick={fetchLicenses}
              disabled={isLoading}
            >
              <RotateCcw className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground italic">Loading licenses...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchLicenses} className="mt-2 text-destructive hover:text-destructive">
                Try Again
              </Button>
            </div>
          ) : licenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <FileText className="h-8 w-8 opacity-20" />
              <p className="text-sm italic">No licenses found.</p>
              <Button asChild variant="link" className="text-primary p-0">
                <Link href="/contractor/licenses/create">Register your first license</Link>
              </Button>
            </div>
          ) : (
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
                          <span className="font-bold text-foreground text-sm">{license.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground tracking-tighter">{license.licenseNumber}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-xs">
                        <Building2 className="w-3 h-3 mr-2 text-muted-foreground" />
                        {license.issuingAuthority || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center text-[10px] text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-1" />
                          {license.issueDate ? new Date(license.issueDate).toLocaleDateString() : 'N/A'} — {license.expiryDate ? new Date(license.expiryDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(license.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild className="gap-2 cursor-pointer">
                            <Link href={`/contractor/licenses/edit/${license.id}`}>
                              <Pencil className="w-4 h-4 mr-2" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          {license.fileData && (
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = license.fileData!;
                                link.download = license.fileName || 'document';
                                link.click();
                              }}
                            >
                              <ExternalLink className="w-4 h-4" /> Download Document
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="gap-2 text-destructive"
                            onClick={() => {
                              setLicenseToDelete(license);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-muted/5">
            <p className="text-sm text-muted-foreground italic">
              Showing <span className="font-bold">{(currentPage - 1) * limit + 1}</span> to <span className="font-bold">{Math.min(currentPage * limit, totalCount)}</span> of <span className="font-bold">{totalCount}</span> results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || isLoading}
                className="gap-1 h-8 px-3"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={currentPage === p ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(p)}
                    disabled={isLoading}
                    className={`h-8 w-8 p-0 ${currentPage === p ? 'bg-primary text-white' : ''}`}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || isLoading}
                className="gap-1 h-8 px-3"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete License
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-bold text-foreground">"{licenseToDelete?.name}"</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete License
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
