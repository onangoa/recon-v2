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
  Globe,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
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
import { useSite } from '@/hooks/use-site';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface Site {
  id: string;
  name: string;
  location: string;
  description: string | null;
  plan: string;
  contractorId: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function SitesManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { sites: activeSites, activeSite, setActiveSite } = useSite();
  
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Delete states
  const [isDeleting, setIsDeleting] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchSites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/web/api/sites?page=${currentPage}&limit=${limit}&search=${searchQuery}`);
      if (!response.ok) throw new Error('Failed to fetch sites');
      const data = await response.json();
      setSites(data.sites);
      setTotalPages(data.pagination.pages);
      setTotalCount(data.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else fetchSites();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    fetchSites();
  }, [currentPage]);

  const handleDeleteSite = async () => {
    if (!siteToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/web/api/sites/${siteToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Site has been decommissioned successfully.",
          variant: "success",
          action: (
            <div className="flex items-center justify-center p-1 bg-white/20 rounded-full">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          ),
        });
        setIsDeleteDialogOpen(false);
        if (sites.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          fetchSites();
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to decommission site.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setSiteToDelete(null);
    }
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
            <BreadcrumbPage>Site Management</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Manage Sites</h1>
          <p className="text-muted-foreground mt-1 text-sm italic">Oversee all active, pending, and completed construction locations.</p>
        </div>
        <Button asChild className="gap-2 bg-primary hover:bg-primary/90 text-white">
          <Link href="/contractor/sites/create">
            <Plus className="size-4" /> Add New Site
          </Link>
        </Button>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="p-4 md:p-6 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-none h-10 text-sm shadow-sm"
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 hover:bg-background hover:text-primary transition-colors"
              onClick={fetchSites}
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
              <p className="text-sm text-muted-foreground italic">Loading sites...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchSites} className="mt-2 text-destructive hover:text-destructive">
                Try Again
              </Button>
            </div>
          ) : sites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Construction className="h-8 w-8 opacity-20" />
              <p className="text-sm italic">No sites found.</p>
              <Button asChild variant="link" className="text-primary p-0">
                <Link href="/contractor/sites/create">Create your first site</Link>
              </Button>
            </div>
          ) : (
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
                          <div className="flex items-center gap-1">
                            {site.isPrimary && <Badge variant="secondary" className="text-[9px] font-black bg-primary/10 text-primary border-primary/20 uppercase px-1 h-3.5">Primary</Badge>}
                            {activeSite?.id === site.id && <span className="text-[9px] font-black text-emerald-600 uppercase">Active</span>}
                          </div>
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
                            Switch
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="size-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem 
                              className="gap-2 cursor-pointer"
                              onClick={() => router.push(`/contractor/sites/edit/${site.id}`)}
                            >
                              <Pencil className="size-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2 text-destructive cursor-pointer"
                              onClick={() => {
                                setSiteToDelete(site);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
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
          )}
        </CardContent>

        {/* Pagination */}
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
              <Trash2 className="w-5 h-5" /> Decommission Site
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to decommission <span className="font-bold text-foreground">"{siteToDelete?.name}"</span>? 
              This action can only be performed if the site has no related records (tasks, materials, equipment, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteSite();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Decommission Site
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
