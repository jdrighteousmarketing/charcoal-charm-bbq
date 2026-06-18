import { useMemo, useState } from 'react';
import {
  X,
  Star,
  CheckCircle,
  ShoppingCart,
  Receipt,
  Zap,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

function readJSON(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

export default function CustomerRewardsPanel({ checkoutData, onClose }) {
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const demoUser = useMemo(() => readJSON('pitstop_demo_user', {}), []);

  const customerName =
    checkoutData?.customerName || demoUser?.name || 'Customer';

  const customerEmail =
    checkoutData?.customerEmail || demoUser?.email || '';

  const customerCode =
    checkoutData?.customerCode ||
    checkoutData?.customerId ||
    demoUser?.customer_id_code ||
    'PIT-12345';

  const currentPoints = Number(demoUser?.points_balance ?? 125);
  const lifetimePoints = Number(demoUser?.total_points_earned ?? 125);

  const items = Array.isArray(checkoutData?.items) ? checkoutData.items : [];

  const subtotal = Number(checkoutData?.subtotal || 0);
  const taxAmount = Number(checkoutData?.taxAmount || 0);
  const total = Number(checkoutData?.total || 0);
  const pointsToEarn = Number(checkoutData?.pointsToEarn || 0);

  const handleCompleteCheckout = () => {
    if (checkoutDone || isProcessing) return;

    setIsProcessing(true);

    try {
      const latestUser = readJSON('pitstop_demo_user', {});

      const updatedUser = {
        ...latestUser,
        loggedIn: latestUser?.loggedIn ?? true,
        name: latestUser?.name || customerName,
        email: latestUser?.email || customerEmail,
        customer_id_code: latestUser?.customer_id_code || customerCode,
        points_balance: Number(latestUser?.points_balance ?? 125) + pointsToEarn,
        total_points_earned:
          Number(latestUser?.total_points_earned ?? 125) + pointsToEarn,
      };

      saveJSON('pitstop_demo_user', updatedUser);

      const transaction = {
        id: `txn_${Date.now()}`,
        customer_profile_id: customerCode,
        customer_name: customerName,
        points: pointsToEarn,
        type: 'earned',
        description: `Purchase — $${money(total)}`,
        order_total: total,
        created_at: new Date().toISOString(),
      };

      const oldTransactions = readJSON('pitStopPointTransactions', []);
      saveJSON('pitStopPointTransactions', [transaction, ...oldTransactions]);

      const order = {
        id: `order_${Date.now()}`,
        customer_profile_id: customerCode,
        customer_name: customerName,
        items,
        subtotal,
        tax_amount: taxAmount,
        total,
        points_earned: pointsToEarn,
        status: 'completed',
        created_at: new Date().toISOString(),
      };

      const oldOrders = readJSON('pitStopOrderHistory', []);
      saveJSON('pitStopOrderHistory', [order, ...oldOrders]);

      localStorage.removeItem('pitStopActiveCart');

      setCheckoutDone(true);
      toast.success(`Checkout complete! +${pointsToEarn} points awarded.`);
    } catch (error) {
      console.error(error);
      toast.error('Could not complete checkout.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        className="bg-card text-card-foreground w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border border-border overflow-hidden max-h-[92vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-lg">
              Rewards Checkout
            </h2>
            <p className="text-xs text-muted-foreground">
              Review order and award points
            </p>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          <div className="bg-muted/40 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>

              <div className="min-w-0">
                <p className="font-semibold truncate">{customerName}</p>

                {customerEmail && (
                  <p className="text-xs text-muted-foreground truncate">
                    {customerEmail}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  Code: {customerCode}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-primary/10 rounded-2xl p-4 text-center">
            <Star className="w-6 h-6 text-primary mx-auto mb-1" />

            <p className="text-3xl font-display font-bold text-primary">
              {checkoutDone ? currentPoints + pointsToEarn : currentPoints}
            </p>

            <p className="text-sm text-muted-foreground">
              Current Points Balance
            </p>

            <p className="text-xs text-muted-foreground mt-1">
              Lifetime earned:{' '}
              {checkoutDone ? lifetimePoints + pointsToEarn : lifetimePoints} pts
            </p>
          </div>

          {!checkoutDone ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-emerald-400">
                <ShoppingCart className="w-4 h-4" />
                Active Checkout
              </h3>

              {items.length === 0 ? (
                <div className="rounded-xl border border-border bg-background/40 p-3 text-sm text-muted-foreground">
                  No item details were found in this QR code.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {items.map((item, index) => {
                    const quantity = Number(item?.quantity || 1);
                    const price = Number(item?.price || 0);
                    const name = item?.name || 'Item';

                    return (
                      <div
                        key={`${name}-${index}`}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="min-w-0 truncate">
                          {quantity > 1 && (
                            <span className="text-muted-foreground mr-1">
                              {quantity}×
                            </span>
                          )}
                          {name}
                        </span>

                        <span className="text-muted-foreground shrink-0">
                          ${money(price * quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-emerald-500/20 pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${money(subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${money(taxAmount)}</span>
                </div>

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${money(total)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-primary/15 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Points to award</span>
                </div>

                <Badge className="text-sm">+{pointsToEarn} pts</Badge>
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleCompleteCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  'Processing...'
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    Complete & Award {pointsToEarn} pts
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />

              <div>
                <p className="font-semibold text-emerald-400">
                  Checkout Complete!
                </p>
                <p className="text-xs text-muted-foreground">
                  Points were awarded and order history was saved.
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}