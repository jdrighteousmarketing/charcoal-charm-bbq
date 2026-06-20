import { useMemo, useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, QrCode, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useCustomerProfile } from '@/hooks/useCustomerProfile';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

const RESTAURANT_ID = 'pit_stop_mobile';

function cleanQrText(value) {
  return encodeURIComponent(String(value || '').replace(/[|~,]/g, ' ').trim());
}

export default function CartSheet() {
  const { data: customerProfile, isLoading } = useCustomerProfile();
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart(
    customerProfile?.id
  );

  const [isOpen, setIsOpen] = useState(false);

  const customerId = customerProfile?.id;

  const { data: claimedCoupon } = useQuery({
    queryKey: ['claimedCouponForCart', RESTAURANT_ID, customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotion_redemptions')
        .select(`
          id,
          status,
          promotion_id,
          promotions (
            id,
            title,
            promo_code,
            discount_type,
            discount_value,
            description
          )
        `)
        .eq('restaurant_id', RESTAURANT_ID)
        .eq('customer_id', customerId)
        .eq('status', 'claimed')
        .is('used_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Could not load claimed coupon:', error);
        return null;
      }

      return data || null;
    },
  });

  const businessSettings = useMemo(() => {
    const saved =
      localStorage.getItem('businessSettings') ||
      localStorage.getItem('pitstop_business_settings');

    if (!saved) return { taxRate: 6, pointsPerDollar: 1 };

    try {
      return JSON.parse(saved);
    } catch {
      return { taxRate: 6, pointsPerDollar: 1 };
    }
  }, []);

  if (isLoading || !customerProfile) return null;

  const cartItems = cart?.items || [];

  const cartItemCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.quantity || 0);
  }, 0);

  const taxRate = Number(
    businessSettings.taxRate || businessSettings.tax_rate || 6
  );

  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const pointsPerDollar = Number(
    businessSettings.pointsPerDollar ||
      businessSettings.points_per_dollar ||
      1
  );

  const pointsToEarn = Math.floor(total * pointsPerDollar);

  const customerCode = customerProfile.customer_id_code || 'PIT-12345';
  const customerName =
    customerProfile.full_name || customerProfile.name || 'Customer';

  const itemText = cartItems
    .map((item) => {
      const name = cleanQrText(item.name);
      const quantity = Number(item.quantity || 0);
      const price = Number(item.price || 0).toFixed(2);

      return `${name}~${quantity}~${price}`;
    })
    .join(',');

  const couponText = claimedCoupon?.promotions
    ? [
        claimedCoupon.id,
        claimedCoupon.promotion_id,
        cleanQrText(claimedCoupon.promotions.title),
        cleanQrText(claimedCoupon.promotions.promo_code),
        cleanQrText(claimedCoupon.promotions.discount_type),
        claimedCoupon.promotions.discount_value ?? '',
      ].join('~')
    : '';

  // Short QR format:
  // PS|customerCode|customerName|subtotal|tax|total|points|items|coupon
  const qrValue = [
    'PS',
    cleanQrText(customerCode),
    cleanQrText(customerName),
    subtotal.toFixed(2),
    taxAmount.toFixed(2),
    total.toFixed(2),
    pointsToEarn,
    itemText,
    couponText,
  ].join('|');

  const handleClearCart = () => {
    clearCart();
    toast.success('Cart cleared.');
  };

  const handleCompletePurchase = () => {
    clearCart();
    setIsOpen(false);

    toast.success(
      'Purchase completed. Points will be awarded by an employee/admin after scanning your QR code.'
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="w-5 h-5" />
          {cartItemCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {cartItemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
          <SheetDescription>
            {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in your
            order
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.menu_item_id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${Number(item.price || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() =>
                        updateQuantity({
                          menuItemId: item.menu_item_id,
                          quantity: Number(item.quantity || 0) - 1,
                        })
                      }
                    >
                      <Minus className="w-3 h-3" />
                    </Button>

                    <span className="w-8 text-center text-sm">
                      {item.quantity}
                    </span>

                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() =>
                        updateQuantity({
                          menuItemId: item.menu_item_id,
                          quantity: Number(item.quantity || 0) + 1,
                        })
                      }
                    >
                      <Plus className="w-3 h-3" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeFromCart(item.menu_item_id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="mt-6 space-y-4 border-t border-border pt-4">
            {claimedCoupon?.promotions && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Ticket className="w-4 h-4 text-primary" />
                  Claimed Coupon Attached
                </div>
                <p className="text-sm mt-1 font-medium">
                  {claimedCoupon.promotions.title}
                </p>
                {claimedCoupon.promotions.promo_code && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Code: {claimedCoupon.promotions.promo_code}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm text-primary font-medium">
                <span>Points to earn</span>
                <span>{pointsToEarn} pts</span>
              </div>
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2 font-semibold">
                <QrCode className="w-4 h-4" />
                Rewards Checkout QR
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                Show this QR code to an employee or admin before tapping
                Complete Purchase.
              </p>

              <div className="flex justify-center bg-white rounded-lg p-3">
                <QRCodeSVG value={qrValue} size={180} level="L" includeMargin />
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                Employee/Admin will scan this and tap Complete to award your
                points.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleClearCart}
              >
                Clear Cart
              </Button>

              <Button className="w-full" onClick={handleCompletePurchase}>
                Complete Purchase
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}