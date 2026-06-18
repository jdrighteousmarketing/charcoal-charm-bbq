import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Plus, CheckCircle, Gift, ShoppingCart, Trash2 } from 'lucide-react';
import NativeHeader from '@/components/customer/NativeHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function CustomerPointsManagement() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addPoints, setAddPoints] = useState('');
  const [addDesc, setAddDesc] = useState('');

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => base44.entities.CustomerProfile.get(customerId),
    enabled: !!customerId,
  });

  const { data: activeCart } = useQuery({
    queryKey: ['customerCart', customerId],
    queryFn: async () => {
      const carts = await base44.entities.Cart.filter({
        customer_profile_id: customerId,
        status: 'active'
      });
      return carts[0] || null;
    },
    enabled: !!customerId,
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['adminRewardsList'],
    queryFn: () => base44.entities.Reward.list(),
    initialData: [],
  });

  const { data: recentTxns = [] } = useQuery({
    queryKey: ['customerTxns', customerId],
    queryFn: () => base44.entities.PointTransaction.filter({ customer_profile_id: customerId }),
    initialData: [],
  });

  const addPointsMutation = useMutation({
    mutationFn: async () => {
      const pts = parseInt(addPoints);
      if (!pts || pts <= 0) throw new Error('Enter a positive number');
      await base44.entities.PointTransaction.create({
        customer_profile_id: customerId,
        points: pts,
        type: 'earned',
        description: addDesc || 'Staff added points',
      });
      const updated = await base44.entities.CustomerProfile.update(customerId, {
        points_balance: (customer.points_balance || 0) + pts,
        total_points_earned: (customer.total_points_earned || 0) + pts,
      });
      return { updated, pts };
    },
    onSuccess: ({ updated, pts }) => {
      queryClient.setQueryData(['customer', customerId], updated);
      queryClient.invalidateQueries({ queryKey: ['customerTxns', customerId] });
      queryClient.invalidateQueries({ queryKey: ['adminCustomersList'] });
      setAddPoints('');
      setAddDesc('');
      toast.success(`+${pts} points added!`);
    },
    onError: (e) => toast.error(e.message),
  });

  const redeemRewardMutation = useMutation({
    mutationFn: async (reward) => {
      if ((customer.points_balance || 0) < reward.points_required) {
        throw new Error('Not enough points');
      }
      await base44.entities.PointTransaction.create({
        customer_profile_id: customerId,
        points: -reward.points_required,
        type: 'redeemed',
        description: `Redeemed: ${reward.name}`,
        reward_id: reward.id,
      });
      const updated = await base44.entities.CustomerProfile.update(customerId, {
        points_balance: (customer.points_balance || 0) - reward.points_required,
      });
      return updated;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['customer', customerId], updated);
      queryClient.invalidateQueries({ queryKey: ['customerTxns', customerId] });
      queryClient.invalidateQueries({ queryKey: ['adminCustomersList'] });
      toast.success('Reward redeemed!');
    },
    onError: (e) => toast.error(e.message),
  });

  const completeCartMutation = useMutation({
    mutationFn: async () => {
      if (!activeCart) return null;
      const pointsToEarn = activeCart.points_to_earn || 0;
      
      if (pointsToEarn <= 0) {
        throw new Error('No points to award');
      }
      
      await base44.entities.PointTransaction.create({
        customer_profile_id: customerId,
        points: pointsToEarn,
        type: 'earned',
        description: `Purchase reward - $${activeCart.total.toFixed(2)}`
      });
      
      await base44.entities.CustomerProfile.update(customerId, {
        points_balance: (customer.points_balance || 0) + pointsToEarn,
        total_points_earned: (customer.total_points_earned || 0) + pointsToEarn
      });
      
      await base44.entities.Cart.update(activeCart.id, { status: 'completed' });
      
      return { pointsToEarn };
    },
    onSuccess: ({ pointsToEarn }) => {
      queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customerCart', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customerTxns', customerId] });
      toast.success(`${pointsToEarn} points awarded!`);
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelCartMutation = useMutation({
    mutationFn: async () => {
      if (!activeCart) return null;
      await base44.entities.Cart.update(activeCart.id, { status: 'cancelled' });
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerCart', customerId] });
      toast.success('Cart cancelled');
    },
  });

  const activeRewards = rewards
    .filter(r => r.is_active && !r.is_birthday_reward)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const recentSorted = [...recentTxns]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Customer not found</p>
            <Button onClick={() => navigate('/admin/scanner')} className="mt-4">
              Back to Scanner
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <NativeHeader title={customer.name || 'Customer'} backTo="/admin/scanner" />
      <div className="p-6 space-y-6">

      {/* Active Cart */}
      {activeCart && activeCart.items && activeCart.items.length > 0 ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Current Order</h2>
              </div>
              <Badge variant="default" className="bg-primary">
                {activeCart.items.reduce((sum, item) => sum + item.quantity, 0)} items
              </Badge>
            </div>
            
            <div className="space-y-2">
              {activeCart.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                  </div>
                  <p className="text-sm font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${(activeCart.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>${(activeCart.tax_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${(activeCart.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-primary">
                <span>Points to earn</span>
                <span>{activeCart.points_to_earn || 0} pts</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => completeCartMutation.mutate()}>
                <CheckCircle className="w-5 h-5 mr-1" /> Complete
              </Button>
              <Button variant="outline" onClick={() => cancelCartMutation.mutate()}>
                <Trash2 className="w-5 h-5 mr-1" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="p-6 text-center">
            <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No active order</p>
            <p className="text-xs text-muted-foreground mt-1">Customer will add items to cart before checkout</p>
          </CardContent>
        </Card>
      )}

      {/* Points Balance */}
      <Card className="bg-primary/10 border-primary/20">
        <CardContent className="p-6 text-center">
          <Star className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-4xl font-display font-bold text-primary">{customer.points_balance || 0}</p>
          <p className="text-sm text-muted-foreground mt-1">Current Points Balance</p>
          <p className="text-xs text-muted-foreground mt-2">
            Lifetime earned: {customer.total_points_earned || 0} pts
          </p>
        </CardContent>
      </Card>

      {/* Add Points */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Add Points</h2>
          </div>
          <div className="space-y-3">
            <div className="flex flex-col gap-3">
              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="0"
                  value={addPoints}
                  onChange={e => setAddPoints(e.target.value)}
                  className="h-11"
                />
              </div>
              <div>
                <Label>Reason (optional)</Label>
                <Input
                  placeholder="e.g., Purchase reward"
                  value={addDesc}
                  onChange={e => setAddDesc(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button
                className="w-full h-11"
                onClick={() => addPointsMutation.mutate()}
                disabled={!addPoints || addPointsMutation.isPending}
              >
                {addPointsMutation.isPending ? 'Adding...' : 'Add Points'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redeem Rewards */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Redeem Rewards</h2>
          </div>
          <div className="space-y-2">
            {activeRewards.map(reward => {
              const canRedeem = (customer.points_balance || 0) >= reward.points_required;
              return (
                <div
                  key={reward.id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    canRedeem ? 'border-border' : 'border-border/50 opacity-60'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{reward.name}</p>
                    <p className="text-xs text-muted-foreground">{reward.points_required} pts required</p>
                  </div>
                  <Button
                    size="sm"
                    variant={canRedeem ? 'outline' : 'ghost'}
                    disabled={!canRedeem}
                    onClick={() => redeemRewardMutation.mutate(reward)}
                  >
                    Redeem
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      {recentSorted.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="font-semibold">Recent Activity</h2>
            <div className="space-y-2">
              {recentSorted.map(txn => (
                <div key={txn.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <p className="text-sm text-muted-foreground">{txn.description || txn.type}</p>
                  <Badge
                    variant="outline"
                    className={txn.points > 0 ? 'text-emerald-600 border-emerald-600/30' : 'text-destructive border-destructive/30'}
                  >
                    {txn.points > 0 ? '+' : ''}{txn.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}