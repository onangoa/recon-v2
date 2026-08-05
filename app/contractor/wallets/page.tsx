'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { 
  Wallet, 
  Plus, 
  MoreVertical,
  Pencil,
  Trash2,
  ChevronRight
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
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { getApiError, getErrorMessage } from '@/lib/toast-utils';
import { useAuth } from '@/context/auth-context';
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

interface WalletData {
  id: string;
  name: string;
  description: string | null;
  balance: number;
  currency: string;
  status: string;
  lastTransaction: string;
  transactionCount: number;
}

export default function WalletsPage() {
  const { toast } = useToast();
  const { user, contractor, isLoading: authLoading } = useAuth();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletToDelete, setWalletToDelete] = useState<WalletData | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWallets = async () => {
    if (!contractor) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/web/api/wallets');
      if (!response.ok) throw new Error('Failed to fetch wallets');
      const data = await response.json();
      setWallets(data);
    } catch (err: any) {
      setError(getErrorMessage(err, "Unable to load the wallets. Please refresh the page and try again."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [contractor]);

  const handleDelete = async () => {
    if (!walletToDelete) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/web/api/wallets/${walletToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Deleted",
          description: "Wallet has been removed",
          variant: "success",
        });
        setIsDeleteDialogOpen(false);
        fetchWallets();
      } else {
        const data = await response.json();
        throw new Error(getApiError(data, "Unable to delete the wallet. Please try again."));
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: getErrorMessage(err, "Unable to delete the wallet. Please check your connection and try again."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !contractor) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to access wallets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/contractor">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Wallets</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-primary">Financial Wallets</h1>
          <p className="text-muted-foreground mt-1">Manage project funds, track balances, and monitor financial transactions.</p>
        </div>
        <Button asChild className="gap-2 bg-primary hover:bg-primary/90">
          <Link href="/contractor/wallets/create">
            <Plus className="w-4 h-4" />
            <span>Create New Wallet</span>
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Wallet className="h-8 w-8 animate-pulse text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-10 text-destructive">{error}</div>
      ) : wallets.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Link href="/contractor/wallets/create" className="group">
            <Card className="h-full border-2 border-dashed border-muted-foreground/20 bg-transparent flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer min-h-[200px]">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-muted-foreground group-hover:text-primary transition-colors">New Wallet</p>
                <p className="text-xs text-muted-foreground/60">Setup an additional project account</p>
              </div>
            </Card>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {wallets.map((wallet) => (
            <Card key={wallet.id} className="border-none shadow-lg bg-gradient-to-br from-primary to-accent text-primary-foreground relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Wallet className="w-24 h-24" />
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold">{wallet.name}</CardTitle>
                    <CardDescription className="text-primary-foreground/70 text-xs">{wallet.description || 'Project account'}</CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-none">
                    {wallet.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-widest opacity-80">Current Balance</span>
                  <span className="text-3xl font-black tracking-tighter">
                    {wallet.currency} {wallet.balance.toFixed(2)}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-4 gap-2 border-t border-primary-foreground/10 flex justify-between">
                <div className="flex gap-2">
                  <Link href={`/contractor/wallets/${wallet.id}`}>
                    <Button variant="secondary" size="sm" className="h-8 bg-primary-foreground/10 hover:bg-primary-foreground/20 border-none text-primary-foreground">
                      View Details
                    </Button>
                  </Link>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem 
                      className="gap-2 cursor-pointer"
                      asChild
                    >
                      <Link href={`/contractor/wallets/${wallet.id}/edit`}>
                        <Pencil className="w-4 h-4" /> Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="gap-2 text-destructive cursor-pointer"
                      onClick={() => {
                        setWalletToDelete(wallet);
                        setIsDeleteDialogOpen(true);
                      }}
                      disabled={wallet.transactionCount > 0}
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
          
          <Link href="/contractor/wallets/create" className="group">
            <Card className="h-full border-2 border-dashed border-muted-foreground/20 bg-transparent flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer min-h-[200px]">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-muted-foreground group-hover:text-primary transition-colors">New Wallet</p>
                <p className="text-xs text-muted-foreground/60">Setup an additional project account</p>
              </div>
            </Card>
          </Link>
        </div>
      )}

      {!isLoading && wallets.length > 0 && (
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-lg font-bold">Wallet Accounts List</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left font-bold px-6 py-3 text-xs uppercase">Wallet Detail</th>
                  <th className="text-left font-bold px-6 py-3 text-xs uppercase">Last Transaction</th>
                  <th className="text-right font-bold px-6 py-3 text-xs uppercase">Balance</th>
                  <th className="text-center font-bold px-6 py-3 text-xs uppercase">Status</th>
                  <th className="text-right w-[100px] font-bold px-6 py-3 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((wallet) => (
                  <tr key={wallet.id} className="hover:bg-muted/20 transition-colors border-b border-border/50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold">{wallet.name}</span>
                        <span className="text-[10px] text-muted-foreground">{wallet.description || 'Project account'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-muted-foreground">{wallet.lastTransaction}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-primary">
                      {wallet.currency} {wallet.balance.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-none hover:bg-emerald-500/20">
                        {wallet.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer"
                            asChild
                          >
                            <Link href={`/contractor/wallets/${wallet.id}`}>
                              View
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 cursor-pointer"
                            asChild
                          >
                            <Link href={`/contractor/wallets/${wallet.id}/edit`}>
                              <Pencil className="w-4 h-4" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 text-destructive cursor-pointer"
                            onClick={() => {
                              setWalletToDelete(wallet);
                              setIsDeleteDialogOpen(true);
                            }}
                            disabled={wallet.transactionCount > 0}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Delete Wallet
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-bold text-foreground">"{walletToDelete?.name}"</span>? 
              {walletToDelete?.transactionCount === 0 
                ? " This action cannot be undone."
                : " This wallet has related transaction records and cannot be deleted."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isSubmitting || (walletToDelete?.transactionCount ?? 0) > 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Wallet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}