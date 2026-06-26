// @ts-nocheck
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Gift, Cake, Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

const RESTAURANT_ID = 'pit_stop_mobile';

const emptyRewardForm = {
  name: '',
  description: '',
  points_required: '',
  image_url: '',
  is_birthday_reward: false,
  is_active: true,
  sort_order: 0,
};

const emptyCustomerForm = {
  name: '',
  email: '',
  phone: '',
  birthday: '',
  points_balance: 0,
};

function makeCustomerCode() {
  return `PIT-${Date.now().toString().slice(-6)}`;
}

function getCustomerName(customers, transaction) {
  return (
    transaction.customer_name ||
    customers.find((customer) => customer.customer_code === transaction.customer_code)
      ?.name ||
    transaction.customer_code ||
    'Customer'
  );
}

export default function RewardsManagement() {
  const queryClient = useQueryClient();

  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyRewardForm);

  const [customerDialog, setCustomerDialog] = useState(false);
  const [customerForm, setCustomerForm] = useState(emptyCustomerForm);

  const [adjustDialog, setAdjustDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDesc, setAdjustDesc] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const { data: rewards = [], isLoading: rewardsLoading } = useQuery({
    queryKey: ['adminRewards', RESTAURANT_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('restaurant_id', RESTAURANT_ID)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['adminRewardsCustomers', RESTAURANT_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', RESTAURANT_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
  queryKey: ['adminPointTransactions', RESTAURANT_ID],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('restaurant_id', RESTAURANT_ID)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    return Array.isArray(data) ? data : [];
  },
});

  const refreshRewards = () => {
    queryClient.invalidateQueries({ queryKey: ['adminRewards', RESTAURANT_ID] });
    queryClient.invalidateQueries({ queryKey: ['rewards', RESTAURANT_ID] });
  };

  const refreshCustomers = () => {
    queryClient.invalidateQueries({ queryKey: ['adminRewardsCustomers', RESTAURANT_ID] });
    queryClient.invalidateQueries({ queryKey: ['customerProfile'] });
  };

  const refreshTransactions = () => {
    queryClient.invalidateQueries({
      queryKey: ['adminPointTransactions', RESTAURANT_ID],
    });
  };

  const createReward = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('rewards').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      refreshRewards();
      setDialog(false);
      toast.success('Reward created!');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Could not create reward.');
    },
  });

  const updateReward = useMutation({
    mutationFn: async ({ id, data }) => {
      const { error } = await supabase
        .from('rewards')
        .update(data)
        .eq('id', id)
        .eq('restaurant_id', RESTAURANT_ID);

      if (error) throw error;
    },
    onSuccess: () => {
      refreshRewards();
      setDialog(false);
      toast.success('Reward updated!');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Could not update reward.');
    },
  });

  const deactivateReward = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('rewards')
        .update({ is_active: false })
        .eq('id', id)
        .eq('restaurant_id', RESTAURANT_ID);

      if (error) throw error;
    },
    onSuccess: () => {
      refreshRewards();
      toast.success('Reward deactivated.');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Could not deactivate reward.');
    },
  });

  const createCustomer = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from('customers').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      refreshCustomers();
      setCustomerDialog(false);
      toast.success('Customer added!');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Could not add customer.');
    },
  });

  const adjustPoints = useMutation({
    mutationFn: async ({ customer, points, description }) => {
      const newBalance = Math.max(0, Number(customer.points_balance || 0) + points);
      const newLifetimePoints =
        points > 0
          ? Number(customer.lifetime_points || 0) + points
          : Number(customer.lifetime_points || 0);

      const { error: customerError } = await supabase
        .from('customers')
        .update({
          points_balance: newBalance,
          lifetime_points: newLifetimePoints,
        })
        .eq('id', customer.id)
        .eq('restaurant_id', RESTAURANT_ID);

      if (customerError) throw customerError;

      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert([
          {
            restaurant_id: RESTAURANT_ID,
            customer_code: customer.customer_code,
            customer_name: customer.name || null,
            transaction_type: points >= 0 ? 'earned' : 'redeemed',
            points_amount: points,
            note: description || 'Manual adjustment',
            employee_name: 'Admin',
          },
        ]);

      if (transactionError) throw transactionError;
    },
    onSuccess: () => {
      refreshCustomers();
      refreshTransactions();

      setAdjustDialog(false);
      setAdjustAmount('');
      setAdjustDesc('');
      setSelectedCustomer(null);

      toast.success('Points adjusted!');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Could not adjust points.');
    },
  });

  const openDialog = (reward = null) => {
    setEditing(reward);

    setForm(
      reward
        ? {
            name: reward.name || '',
            description: reward.description || '',
            points_required: reward.points_required || '',
            image_url: reward.image_url || '',
            is_birthday_reward: reward.is_birthday_reward ?? false,
            is_active: reward.is_active ?? true,
            sort_order: reward.sort_order || 0,
          }
        : emptyRewardForm
    );

    setDialog(true);
  };

  const handleSave = () => {
    const data = {
      restaurant_id: RESTAURANT_ID,
      name: form.name?.trim(),
      description: form.description?.trim() || null,
      points_required: parseInt(form.points_required) || 0,
      image_url: form.image_url?.trim() || null,
      is_birthday_reward: form.is_birthday_reward ?? false,
      is_active: form.is_active ?? true,
      sort_order: parseInt(form.sort_order) || 0,
    };

    if (!data.name) {
      toast.error('Reward name is required.');
      return;
    }

    if (editing) {
      updateReward.mutate({ id: editing.id, data });
    } else {
      createReward.mutate(data);
    }
  };

  const openCustomerDialog = () => {
    setCustomerForm(emptyCustomerForm);
    setCustomerDialog(true);
  };

  const handleSaveCustomer = () => {
    const startingPoints = parseInt(customerForm.points_balance) || 0;

    const data = {
      restaurant_id: RESTAURANT_ID,
      customer_code: makeCustomerCode(),
      name: customerForm.name?.trim(),
      email: customerForm.email?.trim() || null,
      phone: customerForm.phone?.trim() || null,
      birthday: customerForm.birthday || null,
      points_balance: startingPoints,
      lifetime_points: startingPoints,
      lifetime_spend: 0,
      visit_count: 0,
      active: true,
    };

    if (!data.name) {
      toast.error('Customer name is required.');
      return;
    }

    createCustomer.mutate(data);
  };

  const applyPointAdjustment = () => {
    const points = parseInt(adjustAmount);

    if (!selectedCustomer || Number.isNaN(points)) {
      toast.error('Enter a valid point amount.');
      return;
    }

    adjustPoints.mutate({
      customer: selectedCustomer,
      points,
      description: adjustDesc,
    });
  };

  const sortedRewards = [...rewards].sort(
    (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
  );

  const filteredCustomers = customers.filter((customer) => {
    const term = customerSearch.toLowerCase();

    return (
      !term ||
      customer.name?.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term) ||
      customer.phone?.toLowerCase().includes(term) ||
      customer.customer_code?.toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">
            Rewards Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create rewards, manage customers, and adjust loyalty points.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={openCustomerDialog} variant="outline" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Add Customer
          </Button>

          <Button onClick={() => openDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Reward
          </Button>
        </div>
      </div>

      <Tabs defaultValue="rewards">
        <TabsList>
          <TabsTrigger value="rewards">Rewards ({rewards.length})</TabsTrigger>
          <TabsTrigger value="points">Customers ({customers.length})</TabsTrigger>
          <TabsTrigger value="history">History ({transactions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="rewards">
          <div className="space-y-2">
            {rewardsLoading ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">Loading rewards...</CardContent></Card>
            ) : rewards.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No rewards yet</CardContent></Card>
            ) : (
              sortedRewards.map((reward) => (
                <Card key={reward.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {reward.is_birthday_reward ? <Cake className="w-5 h-5 text-primary" /> : <Gift className="w-5 h-5 text-primary" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{reward.name}</h3>

                        {reward.is_birthday_reward && (
                          <Badge className="text-[10px] bg-pink-500/10 text-pink-600">
                            Birthday
                          </Badge>
                        )}

                        {!reward.is_active && (
                          <Badge variant="secondary" className="text-[10px]">
                            Inactive
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {reward.description || 'No description'}
                      </p>

                      <p className="text-sm font-bold text-primary mt-0.5">
                        {reward.points_required} points
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(reward)}>
                        <Pencil className="w-4 h-4" />
                      </Button>

                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deactivateReward.mutate(reward.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="points">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer Points</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {customersLoading ? (
                  <div className="py-10 text-center text-muted-foreground">Loading customers...</div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">No customers yet.</div>
                ) : (
                  filteredCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{customer.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.email || customer.phone || customer.customer_code || 'No contact info'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{customer.points_balance || 0} pts</Badge>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setAdjustDialog(true);
                          }}
                        >
                          Adjust
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Point History</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transactionsLoading ? (
                  <div className="py-10 text-center text-muted-foreground">Loading history...</div>
                ) : transactions.length === 0 ? (
                  <div className="py-10 text-center text-muted-foreground">No point history yet.</div>
                ) : (
                  transactions.map((transaction) => {
                    const amount = Number(transaction.points_amount || 0);
                    const customerName = getCustomerName(customers, transaction);

                    return (
                      <div key={transaction.id} className="flex items-center justify-between p-3 rounded-xl border border-border">
                        <div>
                          <p className="text-sm font-medium">
                            {customerName}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {transaction.note || transaction.transaction_type || 'Point transaction'}
                          </p>

                          {transaction.created_at && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(transaction.created_at).toLocaleString()}
                            </p>
                          )}
                        </div>

                        <Badge variant={amount >= 0 ? 'outline' : 'secondary'}>
                          {amount >= 0 ? '+' : ''}
                          {amount} pts
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Reward' : 'Add Reward'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" placeholder="Free Drink" />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" placeholder="Redeem for one free fountain drink." />
            </div>

            <div>
              <Label>Points Required *</Label>
              <Input type="number" value={form.points_required || ''} onChange={(e) => setForm({ ...form, points_required: e.target.value })} className="mt-1" placeholder="50" />
            </div>

            <div>
              <Label>Image URL</Label>
              <Input value={form.image_url || ''} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="mt-1" />
            </div>

            <div>
              <Label>Sort Order</Label>
              <Input type="number" value={form.sort_order || 0} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="mt-1" />
            </div>

            <div className="flex items-center justify-between">
              <Label>Birthday Reward</Label>
              <Switch checked={form.is_birthday_reward ?? false} onCheckedChange={(v) => setForm({ ...form, is_birthday_reward: v })} />
            </div>

            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.is_active ?? true} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || createReward.isPending || updateReward.isPending}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={customerDialog} onOpenChange={setCustomerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={customerForm.name || ''} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} className="mt-1" />
            </div>

            <div>
              <Label>Email</Label>
              <Input value={customerForm.email || ''} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} className="mt-1" />
            </div>

            <div>
              <Label>Phone</Label>
              <Input value={customerForm.phone || ''} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} className="mt-1" />
            </div>

            <div>
              <Label>Birthday</Label>
              <Input type="date" value={customerForm.birthday || ''} onChange={(e) => setCustomerForm({ ...customerForm, birthday: e.target.value })} className="mt-1" />
            </div>

            <div>
              <Label>Starting Points</Label>
              <Input type="number" value={customerForm.points_balance || ''} onChange={(e) => setCustomerForm({ ...customerForm, points_balance: e.target.value })} className="mt-1" placeholder="0" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomerDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveCustomer} disabled={!customerForm.name || createCustomer.isPending}>Create Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustDialog} onOpenChange={setAdjustDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Adjust Points for {selectedCustomer?.name || 'Customer'}
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Current balance: {selectedCustomer?.points_balance || 0} pts
          </p>

          <div className="space-y-4">
            <div>
              <Label>Points</Label>
              <Input type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} className="mt-1" placeholder="Example: 50 or -25" />
            </div>

            <div>
              <Label>Reason</Label>
              <Input value={adjustDesc} onChange={(e) => setAdjustDesc(e.target.value)} className="mt-1" placeholder="Manual adjustment" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog(false)}>Cancel</Button>
            <Button onClick={applyPointAdjustment} disabled={!adjustAmount || adjustPoints.isPending}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}