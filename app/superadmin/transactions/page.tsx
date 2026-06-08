'use client';

import { useState, useEffect } from 'react';
import { 
  Wallet, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  Download,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  walletId: string;
  wallet: {
    name: string;
  };
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  referenceNumber: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

interface WalletItem {
  id: string;
  name: string;
  balance: number;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    walletId: '',
    amount: '',
    type: 'credit',
    description: '',
    referenceNumber: '',
    status: 'completed',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txRes, walletsRes] = await Promise.all([
        fetch('/api/superadmin/transactions'),
        fetch('/api/wallets'), // Assuming this exists or I'll need to create it
      ]);
      const txData = await txRes.json();
      const walletsData = await walletsRes.json();
      setTransactions(txData);
      setWallets(Array.isArray(walletsData) ? walletsData : []);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/superadmin/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success('Transaction added successfully');
        setIsAddDialogOpen(false);
        setFormData({ walletId: '', amount: '', type: 'credit', description: '', referenceNumber: '', status: 'completed' });
        fetchData();
      } else {
        toast.error('Failed to add transaction');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const filteredTx = Array.isArray(transactions) ? transactions.filter(t => 
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.wallet?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Transactions</h1>
          <p className="text-muted-foreground">Comprehensive log of all platform financial movements.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Download className="w-4 h-4" /> Export logs
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-2 bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4" /> Manual Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Manual Transaction Entry</DialogTitle>
                <DialogDescription>Record a manual adjustment or offline payment.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddTransaction} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="wallet">Select Wallet</Label>
                  <Select value={formData.walletId} onValueChange={val => setFormData({...formData, walletId: val})}>
                    <SelectTrigger id="wallet">
                      <SelectValue placeholder="Choose wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name} (KES {w.balance.toLocaleString()})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Transaction Type</Label>
                    <Select value={formData.type} onValueChange={val => setFormData({...formData, type: val as 'credit' | 'debit'})}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit">Credit (+)</SelectItem>
                        <SelectItem value="debit">Debit (-)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (KES)</Label>
                    <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="e.g. Subscription top-up" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ref">Reference Number</Label>
                  <Input id="ref" value={formData.referenceNumber} onChange={e => setFormData({...formData, referenceNumber: e.target.value})} placeholder="M-Pesa Ref or Internal ID" />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button type="submit">Post Transaction</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search description, reference..." 
                className="pl-9 h-10 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-9 gap-2">
                <Filter className="w-4 h-4" /> Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Transaction ID</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Wallet / Entity</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Description</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Amount</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Status</TableHead>
                <TableHead className="font-bold text-[11px] uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-right font-bold text-[11px] uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredTx.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTx.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-mono text-[10px] text-muted-foreground">
                      {tx.referenceNumber || tx.id.substring(0, 12)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-muted/50 border border-border">
                          <Wallet className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{tx.wallet?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">{tx.description}</span>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1.5 font-bold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'credit' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        KES {tx.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          tx.status === 'completed' ? 'default' : 
                          tx.status === 'failed' ? 'destructive' : 'secondary'
                        }
                        className="text-[10px] font-bold px-2 py-0 h-5"
                      >
                        {tx.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5 mr-1" />}
                        {tx.status === 'failed' && <XCircle className="w-2.5 h-2.5 mr-1" />}
                        {tx.status === 'pending' && <Clock className="w-2.5 h-2.5 mr-1" />}
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
