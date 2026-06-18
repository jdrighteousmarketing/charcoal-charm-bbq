import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { useState } from 'react';
import { Search, Download, Users, Mail, Phone, PlusCircle, Cake, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function CustomerManagement() {
  const { isOwnerAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [sendingBirthdayTo, setSendingBirthdayTo] = useState(null);
  const [addingPointsDialogOpen, setAddingPointsDialogOpen] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [pointsDescription, setPointsDescription] = useState('');
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['adminAllCustomers'],
    queryFn: () => base44.entities.CustomerProfile.list('-created_date', 500),
    initialData: [],
  });

  const { data: allUsersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['adminAllUsers'],
    queryFn: () => base44.functions.invoke('getAllUsers', {}),
  });

  const isLoading = loadingProfiles || loadingUsers;

  // Merge: start with all profiles, then add any 'user' role users who don't have a profile yet
  const customers = (() => {
    const profileUserIds = new Set(profiles.map(p => p.user_id));
    const users = allUsersData?.data?.users || [];
    const missingUsers = users
      .filter(u => u.role === 'user' && !profileUserIds.has(u.id))
      .map(u => ({
        id: `user-${u.id}`,
        user_id: u.id,
        name: u.full_name || '',
        email: u.email || '',
        points_balance: 0,
        total_points_earned: 0,
        customer_id_code: '',
        created_date: u.created_date,
        _noProfile: true,
      }));
    return [...profiles, ...missingUsers];
  })();

  const sendBirthdayMutation = useMutation({
    mutationFn: async (customerId) => {
      setSendingBirthdayTo(customerId);
      const response = await base44.functions.invoke('sendBirthdayEmail', { customer_id: customerId });
      return response;
    },
    onSuccess: () => {
      toast.success('Birthday email sent!');
    },
    onError: (error) => {
      console.error('Send birthday mutation error:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to send email');
    },
    onSettled: () => {
      setSendingBirthdayTo(null);
    },
  });

  const filteredCustomers = customers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (c.name || '').toLowerCase().includes(s) ||
           (c.email || '').toLowerCase().includes(s) ||
           (c.phone || '').toLowerCase().includes(s) ||
           (c.customer_id_code || '').toLowerCase().includes(s);
  });

  const addPointsMutation = useMutation({
    mutationFn: ({ customerId, points, description }) => 
      base44.functions.invoke('addCustomerPoints', { 
        customer_id: customerId, 
        points: parseInt(points), 
        description 
      }),
    onSuccess: () => {
      toast.success('Points added successfully!');
      setPointsToAdd('');
      setPointsDescription('');
      setAddingPointsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['adminAllCustomers'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add points');
    },
  });

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Birthday', 'Address', 'Points Balance', 'Total Points Earned', 'Customer ID', 'Join Date'];
    const rows = customers.map(c => [
      c.name || '', c.email || '', c.phone || '', c.birthday || '', c.address || '',
      c.points_balance || 0, c.total_points_earned || 0, c.customer_id_code || '',
      c.created_date ? new Date(c.created_date).toLocaleDateString() : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const upcomingBirthdays = customers
    .filter(c => c.birthday)
    .map(c => {
      const [year, month, day] = c.birthday.split('-').map(Number);
      const now = new Date();
      const thisYear = new Date(now.getFullYear(), month - 1, day);
      if (thisYear < now) thisYear.setFullYear(now.getFullYear() + 1);
      return { ...c, nextBirthday: thisYear, daysUntil: Math.ceil((thisYear - now) / (1000 * 60 * 60 * 24)) };
    })
    .filter(c => c.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">{customers.length} total customers</p>
        </div>
        {isOwnerAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV} className="gap-2">
              <Download className="w-4 h-4" /> Export Customers
            </Button>
            <Button variant="outline" onClick={async () => {
              try {
                const response = await base44.functions.invoke('exportCustomerPurchases', {});
                const blob = new Blob([response.data], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'customer_purchases.csv';
                link.click();
                URL.revokeObjectURL(url);
                toast.success('Purchases exported successfully!');
              } catch (error) {
                toast.error('Failed to export purchases: ' + (error.message || 'Unknown error'));
              }
            }} className="gap-2">
              <Download className="w-4 h-4" /> Export Purchases
            </Button>
          </div>
        )}
      </div>

      {/* Upcoming birthdays - admin only */}
      {isOwnerAdmin && upcomingBirthdays.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Cake className="w-4 h-4 text-pink-500" /> Upcoming Birthdays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {upcomingBirthdays.map(c => (
                <div key={c.id} className="min-w-[180px] bg-pink-50 dark:bg-pink-950/20 rounded-xl p-3 border border-pink-200/50 dark:border-pink-800/30 flex flex-col">
                  <p className="text-sm font-medium truncate text-gray-900 dark:text-pink-100">{c.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-600 dark:text-pink-200 mt-1">{(() => { const [y, m, d] = c.birthday.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); })()}</p>
                  <Badge className="mt-2 text-[10px] bg-pink-500/10 text-pink-600 w-fit">{c.daysUntil === 0 ? 'Today!' : `${c.daysUntil}d`}</Badge>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      sendBirthdayMutation.mutate(c.id);
                    }}
                    disabled={sendingBirthdayTo === c.id}
                    className="mt-4 w-full h-8 text-xs bg-pink-500 text-white gap-1 inline-flex items-center justify-center rounded-md font-medium disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {sendingBirthdayTo === c.id ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" /> Send Email
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name, email, phone, or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Customer list */}
      <div className="space-y-2">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="h-16 bg-card rounded-xl border animate-pulse" />)
        ) : filteredCustomers.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No customers found</CardContent></Card>
        ) : (
          filteredCustomers.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(c => (
            <Card key={c.id} className={isOwnerAdmin ? "cursor-pointer hover:shadow-md transition-shadow" : ""} onClick={() => isOwnerAdmin && setSelectedCustomer(c)}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {(c.name || c.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{c.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline">{c.points_balance || 0} pts</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Joined {new Date(c.created_date).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Customer detail dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customer Profile</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {(selectedCustomer.name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold">{selectedCustomer.name || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">ID: {selectedCustomer.customer_id_code}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /><span>{selectedCustomer.email || '—'}</span></div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /><span>{selectedCustomer.phone || '—'}</span></div>
                <div className="flex items-center gap-2"><Cake className="w-4 h-4 text-muted-foreground" /><span>{selectedCustomer.birthday ? new Date(selectedCustomer.birthday).toLocaleDateString() : '—'}</span></div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /><span>{selectedCustomer.address || '—'}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-primary">{selectedCustomer.points_balance || 0}</p>
                  <p className="text-xs text-muted-foreground">Current Points</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold">{selectedCustomer.total_points_earned || 0}</p>
                  <p className="text-xs text-muted-foreground">Lifetime Points</p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => { setAddingPointsDialogOpen(true); setSelectedCustomer(null); }} className="gap-2">
                  <PlusCircle className="w-4 h-4" /> Add Points
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add points dialog */}
      <Dialog open={addingPointsDialogOpen} onOpenChange={setAddingPointsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Points to Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (selectedCustomer && pointsToAdd) {
              addPointsMutation.mutate({
                customerId: selectedCustomer.id,
                points: pointsToAdd,
                description: pointsDescription || 'Points added by staff'
              });
            }
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="points">Points to Add</Label>
              <Input
                id="points"
                type="number"
                value={pointsToAdd}
                onChange={(e) => setPointsToAdd(e.target.value)}
                placeholder="100"
                min="1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={pointsDescription}
                onChange={(e) => setPointsDescription(e.target.value)}
                placeholder="Purchase reward"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddingPointsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addPointsMutation.isPending || !pointsToAdd}>
                {addPointsMutation.isPending ? 'Adding...' : 'Add Points'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}