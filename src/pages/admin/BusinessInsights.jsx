// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Cake,
  Coins,
  DollarSign,
  Gift,
  ShoppingBag,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { supabase } from '@/lib/supabaseClient';

const RESTAURANT_ID = 'pit_stop_mobile';

function money(value) {
  return Number(value || 0).toFixed(2);
}

function compactMoney(value) {
  const amount = Number(value || 0);

  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }

  if (Math.abs(amount) >= 10000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }

  return `$${money(amount)}`;
}

function number(value) {
  return Number(value || 0).toLocaleString();
}

function getOrderTotal(order) {
  return Number(order?.total_amount ?? 0);
}

function getPointAmount(transaction) {
  return Number(transaction?.points_amount ?? 0);
}

function getCustomerLabel(customer) {
  return customer.name || customer.email || customer.customer_code || 'Customer';
}

function InsightCard({ icon: Icon, label, value, subtext, color }) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardContent className="p-4 min-h-[138px] flex flex-col justify-between">
        <div className="flex items-start gap-2">
          <div className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center shrink-0">
            <Icon className={`w-4 h-4 ${color}`} />
          </div>

          <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-tight pt-1">
            {label}
          </p>
        </div>

        <div className="mt-4">
          <p className="text-2xl font-display font-bold leading-none break-words">
            {value}
          </p>

          {subtext && (
            <p className="text-[11px] text-muted-foreground mt-2 leading-snug">
              {subtext}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">
          {title}
        </h2>

        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 leading-snug">
            {subtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {children}
      </div>
    </section>
  );
}

export default function BusinessInsights() {
  const monthStart = startOfMonth(new Date()).toISOString();
  const monthEnd = endOfMonth(new Date()).toISOString();
  const yearStart = startOfYear(new Date()).toISOString();
  const yearEnd = endOfYear(new Date()).toISOString();

  const { data = {}, isLoading } = useQuery({
    queryKey: ['businessInsights', RESTAURANT_ID, monthStart, yearStart],
    queryFn: async () => {
      const [
        monthOrdersResult,
        yearOrdersResult,
        monthCustomersResult,
        allCustomersResult,
        monthTransactionsResult,
        monthCheckoutRewardsResult,
        topCustomersResult,
      ] = await Promise.all([
        supabase
          .from('orders')
          .select('id, total_amount, customer_code, order_status, created_at')
          .eq('restaurant_id', RESTAURANT_ID)
          .eq('order_status', 'completed')
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd),

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
          .eq('restaurant_id', RESTAURANT_ID)
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd),

        supabase
          .from('customers')
          .select(
            'id, customer_code, name, email, points_balance, lifetime_spend, visit_count, birthday_reward_redeemed_at, created_at'
          )
          .eq('restaurant_id', RESTAURANT_ID),

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

      if (monthOrdersResult.error) console.error('Month orders error:', monthOrdersResult.error);
      if (yearOrdersResult.error) console.error('Year orders error:', yearOrdersResult.error);
      if (monthCustomersResult.error) console.error('Month customers error:', monthCustomersResult.error);
      if (allCustomersResult.error) console.error('All customers error:', allCustomersResult.error);
      if (monthTransactionsResult.error) console.error('Month transactions error:', monthTransactionsResult.error);
      if (monthCheckoutRewardsResult.error) console.error('Month rewards error:', monthCheckoutRewardsResult.error);
      if (topCustomersResult.error) console.error('Top customers error:', topCustomersResult.error);

      const monthOrders = monthOrdersResult.data || [];
      const yearOrders = yearOrdersResult.data || [];
      const monthCustomers = monthCustomersResult.data || [];
      const allCustomers = allCustomersResult.data || [];
      const monthTransactions = monthTransactionsResult.data || [];
      const monthCheckoutRewards = monthCheckoutRewardsResult.data || [];
      const topCustomers = topCustomersResult.data || [];

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

      const returningCustomerCodes = new Set(
        monthOrders
          .map((order) => order.customer_code)
          .filter(Boolean)
      );

      const birthdayRewardsRedeemedThisMonth = allCustomers.filter((customer) => {
        if (!customer.birthday_reward_redeemed_at) return false;

        const redeemedAt = new Date(customer.birthday_reward_redeemed_at);

        return (
          redeemedAt >= new Date(monthStart) &&
          redeemedAt <= new Date(monthEnd)
        );
      }).length;

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
        monthSales,
        yearSales,
        monthOrderCount,
        averageTicket,
        newMembersThisMonth: monthCustomers.length,
        returningCustomersThisMonth: returningCustomerCodes.size,
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
          Mobile-friendly CRM analytics for sales, customers, rewards, and loyalty trends.
        </p>

        <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/10 p-3">
          <p className="text-xs text-primary font-semibold">
            Viewing: {format(new Date(), 'MMMM yyyy')}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Sales use completed orders only. Reward metrics use completed checkout redemptions and point history.
          </p>
        </div>
      </div>

      <Section
        title="Sales Performance"
        subtitle="How much money is coming through completed checkouts."
      >
        <InsightCard
          icon={DollarSign}
          label="Sales This Month"
          value={isLoading ? '...' : compactMoney(data.monthSales)}
          subtext="Completed order revenue"
          color="text-emerald-400"
        />

        <InsightCard
          icon={TrendingUp}
          label="Sales This Year"
          value={isLoading ? '...' : compactMoney(data.yearSales)}
          subtext="Year-to-date revenue"
          color="text-green-400"
        />

        <InsightCard
          icon={ShoppingBag}
          label="Orders This Month"
          value={isLoading ? '...' : number(data.monthOrderCount)}
          subtext="Completed customer checkouts"
          color="text-blue-400"
        />

        <InsightCard
          icon={Wallet}
          label="Average Ticket"
          value={isLoading ? '...' : `$${money(data.averageTicket)}`}
          subtext="Average order value"
          color="text-violet-400"
        />
      </Section>

      <Section
        title="Rewards Analytics"
        subtitle="How customers are using the loyalty program."
      >
        <InsightCard
          icon={Cake}
          label="Birthday Rewards"
          value={isLoading ? '...' : number(data.birthdayRewardsRedeemedThisMonth)}
          subtext="Redeemed this month"
          color="text-pink-400"
        />

        <InsightCard
          icon={Gift}
          label="Rewards Redeemed"
          value={isLoading ? '...' : number(data.rewardsRedeemedThisMonth)}
          subtext="Completed reward redemptions"
          color="text-purple-400"
        />

        <InsightCard
          icon={Star}
          label="Points Issued"
          value={isLoading ? '...' : number(data.pointsIssuedThisMonth)}
          subtext="Points customers earned"
          color="text-amber-400"
        />

        <InsightCard
          icon={Coins}
          label="Points Redeemed"
          value={isLoading ? '...' : number(data.pointsRedeemedThisMonth)}
          subtext="Points spent on rewards"
          color="text-orange-400"
        />
      </Section>

      <Section
        title="Customer Analytics"
        subtitle="Customer growth, return visits, and loyalty health."
      >
        <InsightCard
          icon={Users}
          label="New Members"
          value={isLoading ? '...' : number(data.newMembersThisMonth)}
          subtext="Customers who joined this month"
          color="text-blue-400"
        />

        <InsightCard
          icon={BarChart3}
          label="Returning Customers"
          value={isLoading ? '...' : number(data.returningCustomersThisMonth)}
          subtext="Customers with orders this month"
          color="text-cyan-400"
        />

        <InsightCard
          icon={TrendingUp}
          label="Average Visits"
          value={isLoading ? '...' : Number(data.averageVisits || 0).toFixed(1)}
          subtext="Visits per customer"
          color="text-emerald-400"
        />

        <InsightCard
          icon={Coins}
          label="Outstanding Points"
          value={isLoading ? '...' : number(data.outstandingPoints)}
          subtext="Unredeemed customer points"
          color="text-amber-400"
        />
      </Section>

      <Card className="border-border/60 bg-card/80">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-orange-400" />
            <div>
              <h2 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">
                Top Customers
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ranked by lifetime spend
              </p>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading customers...</p>
          ) : data.topCustomers?.length > 0 ? (
            <div className="space-y-3">
              {data.topCustomers.map((customer, index) => (
                <div
                  key={customer.id || customer.customer_code || index}
                  className="flex items-center justify-between gap-3 border-b border-border/50 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {getCustomerLabel(customer)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {Number(customer.visit_count || 0)} visits
                      </p>
                    </div>
                  </div>

                  <p className="text-sm font-bold text-primary shrink-0">
                    ${money(customer.lifetime_spend)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-5 text-center">
              <p className="text-sm font-semibold">No spending data yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Top customers will appear after completed checkouts are recorded.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
