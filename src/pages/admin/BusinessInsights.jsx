// Phase 3 planning placeholder
// Use the uploaded file as base. Add chart components in next rewrite.
// @ts-nocheck
import CustomerAnalyticsCard from '@/components/businessInsights/cards/CustomerAnalyticsCard';
import RewardsAnalyticsCard from '@/components/businessInsights/cards/RewardsAnalyticsCard';
import SalesAnalyticsCard from '@/components/businessInsights/cards/SalesAnalyticsCard';
import TopCustomersCard from '@/components/businessInsights/cards/TopCustomersCard';
import { useQuery } from '@tanstack/react-query';

import {
  BarChart3,
  Cake,
  CalendarDays,
  Coins,
  DollarSign,
  Gift,
  Repeat2,
  ShoppingBag,
  Star,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';

import {
  number,
} from '@/components/businessInsights/utils/formatters';

import {
  getOrderTotal,
  getPointAmount,
  isInRange,
} from '@/components/businessInsights/utils/calculations';
import { Card, CardContent } from '@/components/ui/card';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { supabase } from '@/lib/supabaseClient';

const RESTAURANT_ID = 'pit_stop_mobile';

export default function BusinessInsights() {
  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
  const monthStart = startOfMonth(new Date()).toISOString();
  const monthEnd = endOfMonth(new Date()).toISOString();
  const yearStart = startOfYear(new Date()).toISOString();
  const yearEnd = endOfYear(new Date()).toISOString();

  const { data = {}, isLoading } = useQuery({
    queryKey: [
      'businessInsightsPhase2',
      RESTAURANT_ID,
      todayStart,
      weekStart,
      monthStart,
      yearStart,
    ],
    queryFn: async () => {
      const [
        yearOrdersResult,
        allCustomersResult,
        monthCustomersResult,
        monthTransactionsResult,
        monthCheckoutRewardsResult,
        topCustomersResult,
      ] = await Promise.all([
        supabase
          .from('orders')
          .select('id, total_amount, customer_code, order_status, created_at')
          .eq('restaurant_id', RESTAURANT_ID)
          .eq('order_status', 'completed')
          .gte('created_at', yearStart)
          .lte('created_at', yearEnd),

        supabase
          .from('customers')
          .select(
            'id, customer_code, name, email, points_balance, lifetime_spend, visit_count, birthday_reward_redeemed_at, created_at'
          )
          .eq('restaurant_id', RESTAURANT_ID),

        supabase
          .from('customers')
          .select(
            'id, customer_code, name, email, points_balance, lifetime_spend, visit_count, birthday_reward_redeemed_at, created_at'
          )
          .eq('restaurant_id', RESTAURANT_ID)
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd),

        supabase
          .from('points_transactions')
          .select('id, transaction_type, points_amount, note, created_at')
          .eq('restaurant_id', RESTAURANT_ID)
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd),

        supabase
          .from('customer_checkout_rewards')
          .select('id, reward_name, points_required, status, redeemed_at, created_at')
          .eq('restaurant_id', RESTAURANT_ID)
          .eq('status', 'redeemed')
          .gte('redeemed_at', monthStart)
          .lte('redeemed_at', monthEnd),

        supabase
          .from('customers')
          .select('id, customer_code, name, email, lifetime_spend, visit_count')
          .eq('restaurant_id', RESTAURANT_ID)
          .order('lifetime_spend', { ascending: false })
          .limit(5),
      ]);

      if (yearOrdersResult.error) console.error('Year orders error:', yearOrdersResult.error);
      if (allCustomersResult.error) console.error('All customers error:', allCustomersResult.error);
      if (monthCustomersResult.error) console.error('Month customers error:', monthCustomersResult.error);
      if (monthTransactionsResult.error) console.error('Month transactions error:', monthTransactionsResult.error);
      if (monthCheckoutRewardsResult.error) console.error('Month rewards error:', monthCheckoutRewardsResult.error);
      if (topCustomersResult.error) console.error('Top customers error:', topCustomersResult.error);

      const yearOrders = yearOrdersResult.data || [];
      const allCustomers = allCustomersResult.data || [];
      const monthCustomers = monthCustomersResult.data || [];
      const monthTransactions = monthTransactionsResult.data || [];
      const monthCheckoutRewards = monthCheckoutRewardsResult.data || [];
      const topCustomers = topCustomersResult.data || [];

      const todayOrders = yearOrders.filter((order) =>
        isInRange(order.created_at, todayStart, todayEnd)
      );

      const weekOrders = yearOrders.filter((order) =>
        isInRange(order.created_at, weekStart, weekEnd)
      );

      const monthOrders = yearOrders.filter((order) =>
        isInRange(order.created_at, monthStart, monthEnd)
      );

      const todaySales = todayOrders.reduce(
        (sum, order) => sum + getOrderTotal(order),
        0
      );

      const weekSales = weekOrders.reduce(
        (sum, order) => sum + getOrderTotal(order),
        0
      );

      const monthSales = monthOrders.reduce(
        (sum, order) => sum + getOrderTotal(order),
        0
      );

      const yearSales = yearOrders.reduce(
        (sum, order) => sum + getOrderTotal(order),
        0
      );

      const monthOrderCount = monthOrders.length;
      const averageTicket =
        monthOrderCount > 0 ? monthSales / monthOrderCount : 0;

      const activeCustomerCodes = new Set(
        monthOrders
          .map((order) => order.customer_code)
          .filter(Boolean)
      );

      const birthdayRewardsRedeemedThisMonth = allCustomers.filter((customer) =>
        isInRange(customer.birthday_reward_redeemed_at, monthStart, monthEnd)
      ).length;

      const pointsIssuedThisMonth = monthTransactions
        .filter((transaction) => getPointAmount(transaction) > 0)
        .reduce((sum, transaction) => sum + getPointAmount(transaction), 0);

      const pointsRedeemedThisMonth = Math.abs(
        monthTransactions
          .filter((transaction) => getPointAmount(transaction) < 0)
          .reduce((sum, transaction) => sum + getPointAmount(transaction), 0)
      );

      const rewardsRedeemedThisMonth = monthCheckoutRewards.length;

      const outstandingPoints = allCustomers.reduce(
        (sum, customer) => sum + Number(customer.points_balance || 0),
        0
      );

      const averageVisits =
        allCustomers.length > 0
          ? allCustomers.reduce(
              (sum, customer) => sum + Number(customer.visit_count || 0),
              0
            ) / allCustomers.length
          : 0;

      return {
        todaySales,
        weekSales,
        monthSales,
        yearSales,
        todayOrderCount: todayOrders.length,
        monthOrderCount,
        averageTicket,
        newMembersThisMonth: monthCustomers.length,
        activeCustomersThisMonth: activeCustomerCodes.size,
        averageVisits,
        birthdayRewardsRedeemedThisMonth,
        rewardsRedeemedThisMonth,
        pointsIssuedThisMonth,
        pointsRedeemedThisMonth,
        outstandingPoints,
        totalCustomers: allCustomers.length,
        topCustomers,
      };
    },
  });

  return (
    <div className="space-y-8 pb-6">
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-primary/70 mb-1">
          Owner CRM
        </p>

        <h1 className="text-3xl font-display font-bold tracking-wide">
          ⭐ Business Insights
        </h1>

        <p className="text-sm text-muted-foreground mt-1 leading-snug">
          Phase 2 analytics: clearer sales, customer, and rewards numbers that are easier to trust.
        </p>

        <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/10 p-3">
          <p className="text-xs text-primary font-semibold">
            Viewing: {format(new Date(), 'MMMM yyyy')}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Sales use completed orders only. Customer activity counts unique customers with completed orders this month.
          </p>
        </div>
      </div>

      <SalesAnalyticsCard
  isLoading={isLoading}
  data={data}
/>
<RewardsAnalyticsCard
  isLoading={isLoading}
  data={data}
/>
<CustomerAnalyticsCard
  isLoading={isLoading}
  data={data}
/>

      <TopCustomersCard
  isLoading={isLoading}
  customers={data.topCustomers}
/>
    </div>
  );
}
