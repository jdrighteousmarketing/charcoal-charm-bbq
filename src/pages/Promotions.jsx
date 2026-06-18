import { Tag, Clock, Ticket, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const typeConfig = {
  promotion: { icon: Tag, label: 'Promotion', color: 'bg-primary/10 text-primary' },
  coupon: { icon: Ticket, label: 'Coupon', color: 'bg-violet-500/10 text-violet-600' },
  limited_time: { icon: Clock, label: 'Limited Time', color: 'bg-amber-500/10 text-amber-600' },
};

export default function Promotions() {
  const promotions = [
    {
      id: 'promo-1',
      title: 'Free Fries with Any Burger',
      description: 'Order any burger and get a free side of seasoned fries.',
      promotion_type: 'coupon',
      discount_type: 'free_item',
      discount_value: null,
      promo_code: 'FREEFRIES',
      start_date: new Date().toISOString(),
      end_date: '2026-12-31',
      is_active: true,
      image_url: '',
    },
    {
      id: 'promo-2',
      title: '$5 Off Orders Over $25',
      description: 'Save $5 when your order total is $25 or more.',
      promotion_type: 'promotion',
      discount_type: 'fixed',
      discount_value: 5,
      promo_code: 'PIT5',
      start_date: new Date().toISOString(),
      end_date: '2026-12-31',
      is_active: true,
      image_url: '',
    },
    {
      id: 'promo-3',
      title: 'Double Points Tuesday',
      description: 'Earn double reward points every Tuesday.',
      promotion_type: 'limited_time',
      discount_type: 'points',
      discount_value: null,
      promo_code: '2XPOINTS',
      start_date: new Date().toISOString(),
      end_date: '2026-12-31',
      is_active: true,
      image_url: '',
    },
    {
      id: 'promo-4',
      title: 'Free Drink with Combo Meal',
      description: 'Get a free fountain drink when you order any combo meal.',
      promotion_type: 'coupon',
      discount_type: 'free_item',
      discount_value: null,
      promo_code: 'FREEDRINK',
      start_date: new Date().toISOString(),
      end_date: '2026-12-31',
      is_active: true,
      image_url: '',
    },
  ];

  const now = new Date();

  const activePromos = promotions.filter((p) => {
    if (p.end_date && new Date(p.end_date) < now) return false;
    if (p.start_date && new Date(p.start_date) > now) return false;
    return true;
  });

  return (
    <div className="pb-4">
      <div className="px-5 pt-12 pb-2">
        <h1 className="text-2xl font-display font-bold">Deals & Promotions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Don't miss out on these offers
        </p>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {activePromos.length === 0 ? (
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
                      {promo.discount_type === 'percentage'
                        ? `${promo.discount_value}% Off`
                        : promo.discount_type === 'fixed'
                        ? `$${promo.discount_value} Off`
                        : promo.discount_type === 'bogo'
                        ? 'BOGO'
                        : promo.discount_type === 'points'
                        ? '2X Points'
                        : 'Free Item'}
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-base">{promo.title}</h3>

                  {promo.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {promo.description}
                    </p>
                  )}

                  {promo.promo_code && (
                    <div className="mt-3 bg-muted/50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Promo Code
                      </p>
                      <p className="font-mono font-bold text-lg tracking-widest text-primary mt-0.5">
                        {promo.promo_code}
                      </p>
                    </div>
                  )}

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