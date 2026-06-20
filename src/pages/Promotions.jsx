import { useMemo, useState } from 'react';
import { Tag, Clock, Ticket, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useCustomerProfile } from '@/hooks/useCustomerProfile';

const RESTAURANT_ID = 'pit_stop_mobile';

const typeConfig = {
  promotion: { icon: Tag, label: 'Promotion', color: 'bg-primary/10 text-primary' },
  coupon: { icon: Ticket, label: 'Coupon', color: 'bg-violet-500/10 text-violet-600' },
  limited_time: { icon: Clock, label: 'Limited Time', color: 'bg-amber-500/10 text-amber-600' },
};

function getDiscountLabel(promo) {
  if (promo.discount_type === 'percentage') return `${promo.discount_value}% Off`;
  if (promo.discount_type === 'fixed') return `$${promo.discount_value} Off`;
  if (promo.discount_type === 'bogo') return 'BOGO';
  if (promo.discount_type === 'points') return '2X Points';
  return 'Free Item';
}

export default function Promotions() {
  const queryClient = useQueryClient();
  const [redeemingId, setRedeemingId] = useState(null);

  const { data: customerProfile } = useCustomerProfile();

  const customerId = customerProfile?.id;

  const { data: promotions = [], isLoading: promotionsLoading } = useQuery({
    queryKey: ['promotions', RESTAURANT_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('restaurant_id', RESTAURANT_ID)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Could not load promotions:', error);
        throw error;
      }

      return data || [];
    },
  });

  const { data: redemptions = [], isLoading: redemptionsLoading } = useQuery({
    queryKey: ['promotionRedemptions', RESTAURANT_ID, customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotion_redemptions')
        .select('promotion_id')
        .eq('restaurant_id', RESTAURANT_ID)
        .eq('customer_id', customerId);

      if (error) {
        console.error('Could not load promotion redemptions:', error);
        throw error;
      }

      return data || [];
    },
  });

  const redeemedPromotionIds = useMemo(() => {
    return new Set(redemptions.map((r) => r.promotion_id));
  }, [redemptions]);

  const activePromos = useMemo(() => {
    const now = new Date();

    return promotions.filter((promo) => {
      if (redeemedPromotionIds.has(promo.id)) return false;
      if (promo.end_date && new Date(promo.end_date) < now) return false;
      if (promo.start_date && new Date(promo.start_date) > now) return false;
      return true;
    });
  }, [promotions, redeemedPromotionIds]);

  const redeemMutation = useMutation({
    mutationFn: async (promo) => {
      if (!customerId) {
        throw new Error('Customer profile not loaded.');
      }

      const { error } = await supabase.from('promotion_redemptions').insert({
        promotion_id: promo.id,
        customer_id: customerId,
        restaurant_id: RESTAURANT_ID,
      });

      if (error) throw error;

      return promo.id;
    },
    onMutate: (promo) => {
      setRedeemingId(promo.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['promotionRedemptions', RESTAURANT_ID, customerId],
      });
    },
    onError: (error) => {
      console.error('Could not redeem promotion:', error);
      alert('This coupon could not be redeemed. Please try again.');
    },
    onSettled: () => {
      setRedeemingId(null);
    },
  });

  const isLoading = promotionsLoading || redemptionsLoading;

  return (
    <div className="pb-4">
      <div className="px-5 pt-12 pb-2">
        <h1 className="text-2xl font-display font-bold">Deals & Promotions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Don't miss out on these offers
        </p>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">
            Loading promotions...
          </div>
        ) : activePromos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 text-muted-foreground"
          >
            <p className="text-4xl mb-3">🏷️</p>
            <p className="font-medium">No active promotions</p>
            <p className="text-sm mt-1">Check back soon for new deals!</p>
          </motion.div>
        ) : (
          activePromos.map((promo, i) => {
            const config = typeConfig[promo.promotion_type] || typeConfig.promotion;
            const Icon = config.icon;

            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                {promo.image_url && (
                  <img
                    src={promo.image_url}
                    alt={promo.title}
                    className="w-full h-40 object-cover"
                  />
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge className={`${config.color} border-0`}>
                      <Icon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>

                    <div className="flex items-center gap-1 text-primary font-bold text-sm">
                      <Percent className="w-3.5 h-3.5" />
                      {getDiscountLabel(promo)}
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-base">
                    {promo.title}
                  </h3>

                  {promo.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {promo.description}
                    </p>
                  )}

            

                  <Button
                    className="w-full mt-4"
                    disabled={!customerId || redeemingId === promo.id}
                    onClick={() => redeemMutation.mutate(promo)}
                  >
                    {redeemingId === promo.id ? 'Redeeming...' : 'Redeem Coupon'}
                  </Button>

                  {promo.end_date && (
                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expires {format(new Date(promo.end_date), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}