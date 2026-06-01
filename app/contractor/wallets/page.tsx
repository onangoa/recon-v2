'use client';

import Link from 'next/link';
import { 
  Wallet, 
  Plus, 
  Search, 
  RotateCcw, 
  MoreVertical,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  Coins
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

export default function WalletsPage() {
  const wallets = [
    {
      id: '1',
      name: 'Project Wallet',
      description: 'Main wallet for project expenses',
      balance: '500,000.00',
      currency: 'KES',
      status: 'Active',
      lastTransaction: '2 hours ago'
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
            <BreadcrumbPage>Wallets</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {wallets.map((wallet) => (
          <Card key={wallet.id} className="border-none shadow-lg bg-gradient-to-br from-primary to-accent text-primary-foreground relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Coins className="w-24 h-24" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold">{wallet.name}</CardTitle>
                  <CardDescription className="text-primary-foreground/70 text-xs">{wallet.description}</CardDescription>
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
                  {wallet.currency} {wallet.balance}
                </span>
              </div>
            </CardContent>
            <CardFooter className="pt-4 gap-2 border-t border-primary-foreground/10 flex justify-between">
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="h-8 bg-primary-foreground/10 hover:bg-primary-foreground/20 border-none text-primary-foreground">
                  <ArrowUpRight className="w-3 h-3 mr-1" /> Deposit
                </Button>
                <Button variant="secondary" size="sm" className="h-8 bg-primary-foreground/10 hover:bg-primary-foreground/20 border-none text-primary-foreground">
                  <ArrowDownLeft className="w-3 h-3 mr-1" /> Withdraw
                </Button>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground">
                <History className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        {/* Add New Wallet Card */}
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

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-bold">Wallet Accounts List</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                className="pl-10 bg-background border-none h-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold">Wallet Detail</TableHead>
                <TableHead className="font-bold">Last Transaction</TableHead>
                <TableHead className="font-bold text-right">Balance</TableHead>
                <TableHead className="font-bold text-center">Status</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.map((wallet) => (
                <TableRow key={wallet.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold">{wallet.name}</span>
                      <span className="text-[10px] text-muted-foreground">{wallet.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{wallet.lastTransaction}</span>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">
                    {wallet.currency} {wallet.balance}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none hover:bg-emerald-500/20">
                      {wallet.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="gap-2">
                          <Pencil className="w-4 h-4" /> Rename Wallet
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <History className="w-4 h-4" /> Transaction History
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive">
                          <Trash2 className="w-4 h-4" /> Close Account
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
