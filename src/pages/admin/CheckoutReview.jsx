import { useMemo, useState } from 'react';
import { ShoppingCart, CheckCircle, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

const RESTAURANT_ID = 'pit_stop_mobile';

function money(value) {
  return Number(value || 0).toFixed(2);
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export default function CheckoutReview() {
  const navigate = useNavigate();
  const location = useLocation();
  const [awarding, setAwarding] = useState(false);

  const checkoutData = useMemo(() => {
    const stateData = location.state?.checkoutData;

    if (stateData?.customerCode) {
      return stateData;
    }

    return safeJsonParse(localStorage.getItem('pitStopScannedCheckout'), {});
  }, [location.state]);

  const items = checkoutData.items || [];
  const claimedCoupon = checkoutData.claimedCoupon || null;

  const handleCompleteAward = async () => {
    setAwarding(true);

    try {
      const pointsToAdd = Number(checkoutData.pointsToEarn || 0);
      const customerCode = checkoutData.customerCode;

      if (!customerCode) {
        toast.error('Missing customer code. Cannot award points.');
        return;
      }

      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', RESTAURANT_ID)
        .eq('customer_code', customerCode)
        .single();

      if (fetchError || !customer) {
        console.error(fetchError);
        toast.error('Customer not found in Supabase.');
        return;
      }

      const newPointsBalance =
        Number(customer.points_balance || 0) + pointsToAdd;

      const newLifetimePoints =
        Number(customer.lifetime_points || 0) + pointsToAdd;

      const newLifetimeSpend =
        Number(customer.lifetime_spend || 0) + Number(checkoutData.total || 0);

      const newVisitCount = Number(customer.visit_count || 0) + 1;

      const orderNumber = `ORD-${Date.now()}`;

      const { error: customerUpdateError } = await supabase
        .from('customers')
        .update({
          points_balance: newPointsBalance,
          lifetime_points: newLifetimePoints,
          lifetime_spend: newLifetimeSpend,
          visit_count: newVisitCount,
        })
        .eq('restaurant_id', RESTAURANT_ID)
        .eq('customer_code', customerCode);

      if (customerUpdateError) {
        throw customerUpdateError;
      }

      const { error: orderInsertError } = await supabase.from('orders').insert([
        {
          restaurant_id: RESTAURANT_ID,
          customer_code: customerCode,
          order_number: orderNumber,
          subtotal: Number(checkoutData.subtotal || 0),
          tax_amount: Number(checkoutData.taxAmount || 0),
          total_amount: Number(checkoutData.total || 0),
          points_awarded: pointsToAdd,
          payment_method: 'outside_app',
          order_status: 'completed',
          employee_name: 'Employee',
        },
      ]);

      if (orderInsertError) {
        throw orderInsertError;
      }

      if (items.length > 0) {
        const orderItems = items.map((item) => ({
          restaurant_id: RESTAURANT_ID,
          order_number: orderNumber,
          customer_code: customerCode,
          item_name: item.name || 'Item',
          category_name: item.category || item.category_name || null,
          quantity: Number(item.quantity || 1),
          unit_price: Number(item.price || 0),
          total_price: Number(item.price || 0) * Number(item.quantity || 1),
        }));

        const { error: orderItemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (orderItemsError) {
          throw orderItemsError;
        }
      }

      const employeeUser = JSON.parse(
  localStorage.getItem('pitstop_employee_user') || '{}'
);

const adminUser = JSON.parse(
  localStorage.getItem('pitstop_demo_user') || '{}'
);

const staffUser = employeeUser?.loggedIn ? employeeUser : adminUser;

const { error: pointsError } = await supabase
  .from('points_transactions')
  .insert([
    {
      restaurant_id: RESTAURANT_ID,
      customer_code: customerCode,
      order_number: orderNumber,
      transaction_type: 'earned',
      points_amount: pointsToAdd,
      note: `Earned from order total $${money(checkoutData.total)}`,
      employee_name: staffUser?.name || staffUser?.email || 'Employee',
      awarded_by_employee_id: staffUser?.id || null,
      awarded_by_employee_auth_id: staffUser?.auth_user_id || null,
      awarded_by_employee_name: staffUser?.name || 'Employee',
      awarded_by_employee_email: staffUser?.email || null,
    },
  ]);

      if (pointsError) {
        throw pointsError;
      }

      if (claimedCoupon?.redemptionId) {
        const { error: couponError } = await supabase
          .from('promotion_redemptions')
          .update({
            status: 'used',
            used_at: new Date().toISOString(),
          })
          .eq('id', claimedCoupon.redemptionId)
          .eq('restaurant_id', RESTAURANT_ID)
          .eq('customer_id', customer.id)
          .eq('status', 'claimed');

        if (couponError) {
          throw couponError;
        }
      }

      const savedUser = safeJsonParse(
        localStorage.getItem('pitstop_demo_user'),
        {}
      );

      const savedCode = savedUser.customer_id_code || savedUser.customer_code;

      if (savedCode === customerCode) {
        localStorage.setItem(
          'pitstop_demo_user',
          JSON.stringify({
            ...savedUser,
            points_balance: newPointsBalance,
            lifetime_points: newLifetimePoints,
            total_points_earned: newLifetimePoints,
          })
        );
      }

      localStorage.removeItem('pitStopScannedCheckout');

      toast.success(`Awarded ${pointsToAdd} points to ${checkoutData.customerName}!`);

      navigate('/admin/scanner', { replace: true });
    } catch (error) {
      console.error(error);
      toast.error('Failed to complete checkout.');
    } finally {
      setAwarding(false);
    }
  };

  if (!checkoutData.customerCode) {
    return (
      <div className="p-6">
        <p>No checkout found.</p>
        <Button className="mt-4" onClick={() => navigate('/admin/scanner')}>
          Back to Scanner
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-display font-bold">Checkout Found</h1>

      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <div>
          <p className="font-bold">{checkoutData.customerName}</p>
          <p className="text-sm text-muted-foreground">
            Code: {checkoutData.customerCode}
          </p>
        </div>

        <div className="rounded-xl bg-muted/40 p-3 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <ShoppingCart className="w-4 h-4" />
            Items Purchased
          </div>

          {items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>
                {item.quantity}× {item.name}
              </span>
              <span>${money(Number(item.price || 0) * Number(item.quantity || 1))}</span>
            </div>
          ))}
        </div>

        {claimedCoupon && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-1">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Ticket className="w-4 h-4 text-primary" />
              Claimed Coupon
            </div>

            <p className="font-medium text-sm">{claimedCoupon.title}</p>

            {claimedCoupon.promoCode && (
              <p className="text-xs text-muted-foreground">
                Code: {claimedCoupon.promoCode}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              This coupon will be marked used when checkout is completed.
            </p>
          </div>
        )}

        <div className="border-t border-border pt-3 space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${money(checkoutData.subtotal)}</span>
          </div>

          <div className="flex justify-between">
            <span>Tax</span>
            <span>${money(checkoutData.taxAmount)}</span>
          </div>

          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${money(checkoutData.total)}</span>
          </div>

          <div className="flex justify-between text-primary font-bold">
            <span>Points to Award</span>
            <span>{checkoutData.pointsToEarn} pts</span>
          </div>
        </div>

        <button
          type="button"
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          onClick={handleCompleteAward}
          disabled={awarding}
        >
          <CheckCircle className="w-4 h-4" />
          {awarding ? 'Completing...' : 'Complete Checkout'}
        </button>
      </div>
    </div>
  );
}