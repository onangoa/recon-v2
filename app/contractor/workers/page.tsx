'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  RotateCcw, 
  UserPlus,
  Mail,
  Phone,
  Shield,
  HardHat,
  MoreVertical,
  Filter,
  BadgeCheck,
  Clock,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useRouter } from 'next/navigation';

interface Worker {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  nationalId: string | null;
  status: string;
  designation: {
    title: string;
  } | null;
  joinedAt: string;
}

export default function WorkersPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchWorkers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/workers');
      if (!response.ok) throw new Error('Failed to fetch workers');
      const data = await response.json();
      setWorkers(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleDelete = async () => {
    if (!workerToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/workers/${workerToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Worker has been removed",
          variant: "default",
        });
        setIsDeleteDialogOpen(false);
        fetchWorkers();
      } else {
        throw new Error('Failed to delete worker');
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.designation?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.phone?.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Workers</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Workers Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your site workers, designations and payroll status.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/contractor/workers/designations">
              <Briefcase className="w-4 h-4" />
              <span>Designations</span>
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/contractor/workers/create">
              <UserPlus className="w-4 h-4" />
              <span>Add Worker</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-muted/20 border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total Workers</p>
                <h3 className="text-2xl font-bold">{workers.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <BadgeCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Active</p>
                <h3 className="text-2xl font-bold">{workers.filter(w => w.status === 'Active').length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HardHat className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">On-Site Today</p>
                <h3 className="text-2xl font-bold">{workers.filter(w => w.status === 'Active').length}</h3>
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
                placeholder="Search workers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-none h-10 text-sm shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={fetchWorkers}
                disabled={isLoading}
              >
                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading workers...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : filteredWorkers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Users className="h-8 w-8 opacity-20" />
              <p className="text-sm italic">No workers found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Worker</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">Designation</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider">ID / Phone</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Status</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkers.map((worker) => (
                  <TableRow key={worker.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{getInitials(worker.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{worker.name}</span>
                          <span className="text-[10px] text-muted-foreground">{worker.email || 'No email'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {worker.designation?.title || 'Unassigned'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground font-medium">
                        <div className="flex items-center">
                          <CreditCard className="w-3 h-3 mr-1 opacity-60" />
                          ID: {worker.nationalId || 'N/A'}
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-3 h-3 mr-1 opacity-60" />
                          {worker.phone || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`text-[10px] uppercase font-bold ${worker.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                        {worker.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/contractor/workers/edit/${worker.id}`)}>
                            <Pencil className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setWorkerToDelete(worker);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
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
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete worker <strong>{workerToDelete?.name}</strong> and all associated payroll records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Delete Worker'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
