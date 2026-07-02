// @ts-nocheck
import CustomerAnalyticsCard from '@/components/businessInsights/cards/CustomerAnalyticsCard';
import MenuPerformanceCard from '@/components/businessInsights/cards/MenuPerformanceCard';
import RewardsAnalyticsCard from '@/components/businessInsights/cards/RewardsAnalyticsCard';
import SalesAnalyticsCard from '@/components/businessInsights/cards/SalesAnalyticsCard';
import TopCustomersCard from '@/components/businessInsights/cards/TopCustomersCard';
import Section from '@/components/businessInsights/cards/Section';
import { useQuery } from '@tanstack/react-query';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Activity,
  BarChart3,
  LineChart as LineChartIcon,
  Repeat2,
  TrendingUp,
} from 'lucide-react';

import { money, number } from '@/components/businessInsights/utils/formatters';

import {
  getOrderTotal,
  getPointAmount,
  isInRange,
} from '@/components/businessInsights/utils/calculations';
import { Card, CardContent } from '@/components/ui/card';
import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
} from 'date-fns';
import { supabase } from '@/lib/supabaseClient';

const RESTAURANT_ID = 'pit_stop_mobile';

function EmptyChartState({ message = 'No chart data yet.' }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 text-center text-xs text-muted-foreground">
      {message}
    </div>
  );
}

function ChartCard({ icon: Icon, title, subtitle, children }) {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/90 shadow-sm">
      <CardContent className="p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold leading-tight">{title}</h3>
            {subtitle && (
              <p className="mt-1 text-xs leading-snug text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
      <p className="font-semibold">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="text-muted-foreground">
          {item.name}: ${money(item.value)}
        </p>
      ))}
    </div>
  );
}

function NumberTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
      <p className="font-semibold">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="text-muted-foreground">
          {item.name}: {number(item.value)}
        </p>
      ))}
    </div>
  );
}

function hasChartData(rows, keys = ['value']) {
  return rows?.some((row) => keys.some((key) => Number(row?.[key] || 0) > 0));
}

function buildDailySalesTrend(orders, startDate, endDate) {
  return eachDayOfInterval({ start: startDate, end: endDate }).map((day) => {
    const dayStart = startOfDay(day).toISOString();
    const dayEnd = endOfDay(day).toISOString();
    const dayOrders = orders.filter((order) => isInRange(order.created_at, dayStart, dayEnd));

    return {
      label: format(day, 'MMM d'),
      sales: dayOrders.reduce((sum, order) => sum + getOrderTotal(order), 0),
      orders: dayOrders.length,
    };
  });
}

function buildCustomerGrowth(customers, startDate, endDate) {
  return eachDayOfInterval({ start: startDate, end: endDate }).map((day) => {
    const dayEnd = endOfDay(day);
    const total = customers.filter((customer) => {
      if (!customer.created_at) return false;
      const createdAt = new Date(customer.created_at);
      return !Number.isNaN(createdAt.getTime()) && createdAt <= dayEnd;
    }).length;

    return {
      label: format(day, 'MMM d'),
      customers: total,
    };
  });
}

function buildBusyDays(orders) {
  const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const totals = weekdayOrder.reduce((acc, day) => ({ ...acc, [day]: 0 }), {});

  orders.forEach((orderRow) => {
    if (!orderRow.created_at) return;
    const day = format(new Date(orderRow.created_at), 'EEE');
    totals[day] = (totals[day] || 0) + 1;
  });

  return weekdayOrder.map((day) => ({ label: day, orders: totals[day] || 0 }));
}

function buildMenuPerformance(orderItems = []) {
  const itemTotals = {};
  const categoryTotals = {};

  orderItems.forEach((item) => {
    const itemName = item.item_name || 'Unknown Item';
    const categoryName = item.category_name || 'Uncategorized';
    const quantity = Number(item.quantity || 0);
    const revenue = Number(item.total_price || 0);

    if (!itemTotals[itemName]) {
      itemTotals[itemName] = {
        itemName,
        quantity: 0,
        revenue: 0,
      };
    }

    itemTotals[itemName].quantity += quantity;
    itemTotals[itemName].revenue += revenue;

    if (!categoryTotals[categoryName]) {
      categoryTotals[categoryName] = {
        categoryName,
        quantity: 0,
        revenue: 0,
      };
    }

    categoryTotals[categoryName].quantity += quantity;
    categoryTotals[categoryName].revenue += revenue;
  });

  const topSellingItems = Object.values(itemTotals)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 7);

  const topRevenueItems = Object.values(itemTotals)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const salesByCategory = Object.values(categoryTotals)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const totalItemsSold = Object.values(itemTotals).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const menuRevenue = Object.values(itemTotals).reduce(
    (sum, item) => sum + Number(item.revenue || 0),
    0
  );

  return {
    topSellingItems,
    topRevenueItems,
    salesByCategory,
    totalItemsSold,
    menuRevenue,
    uniqueItemsSold: Object.keys(itemTotals).length,
    uniqueCategoriesSold: Object.keys(categoryTotals).length,
  };
}

export default function BusinessInsights() {
  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = endOfDay(now).toISOString();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();
  const yearStart = startOfYear(now).toISOString();
  const yearEnd = endOfYear(now).toISOString();
  const chartStartDate = subDays(now, 29);

  const { data = {}, isLoading } = useQuery({
    queryKey: [
      'businessInsightsPhase4MenuPerformance',
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
        monthOrderItemsResult,
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

        supabase
          .from('order_items')
          .select('id, item_name, category_name, quantity, unit_price, total_price, created_at')
          .eq('restaurant_id', RESTAURANT_ID)
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd),
      ]);

      if (yearOrdersResult.error) console.error('Year orders error:', yearOrdersResult.error);
      if (allCustomersResult.error) console.error('All customers error:', allCustomersResult.error);
      if (monthCustomersResult.error) console.error('Month customers error:', monthCustomersResult.error);
      if (monthTransactionsResult.error) console.error('Month transactions error:', monthTransactionsResult.error);
      if (monthCheckoutRewardsResult.error) console.error('Month rewards error:', monthCheckoutRewardsResult.error);
      if (topCustomersResult.error) console.error('Top customers error:', topCustomersResult.error);
      if (monthOrderItemsResult.error) console.error('Month order items error:', monthOrderItemsResult.error);

      const yearOrders = yearOrdersResult.data || [];
      const allCustomers = allCustomersResult.data || [];
      const monthCustomers = monthCustomersResult.data || [];
      const monthTransactions = monthTransactionsResult.data || [];
      const monthCheckoutRewards = monthCheckoutRewardsResult.data || [];
      const topCustomers = topCustomersResult.data || [];
      const monthOrderItems = monthOrderItemsResult.data || [];

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

      const chartEndDate = now;
      const dailySalesTrend = buildDailySalesTrend(yearOrders, chartStartDate, chartEndDate);
      const customerGrowthTrend = buildCustomerGrowth(allCustomers, chartStartDate, chartEndDate);
      const busyDays = buildBusyDays(monthOrders);
      const menuPerformance = buildMenuPerformance(monthOrderItems);

      const rewardsUsage = [
        { label: 'Issued', value: pointsIssuedThisMonth },
        { label: 'Redeemed', value: pointsRedeemedThisMonth },
        { label: 'Rewards', value: rewardsRedeemedThisMonth },
      ];
      const revenueVsRewards = [
        { label: 'Revenue', value: monthSales },
        { label: 'Reward Points', value: pointsRedeemedThisMonth },
      ];

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
        dailySalesTrend,
        customerGrowthTrend,
        rewardsUsage,
        busyDays,
        revenueVsRewards,
        menuPerformance,
      };
    },
  });

  const dailySalesTrend = data.dailySalesTrend || [];
  const customerGrowthTrend = data.customerGrowthTrend || [];
  const rewardsUsage = data.rewardsUsage || [];
  const busyDays = data.busyDays || [];
  const revenueVsRewards = data.revenueVsRewards || [];

  return (
    <div className="space-y-8 pb-6">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary/70">
          Owner CRM
        </p>

        <h1 className="font-display text-3xl font-bold tracking-wide">
          ⭐ Business Insights
        </h1>

        <p className="mt-1 text-sm leading-snug text-muted-foreground">
          Phase 4 analytics: menu performance, sales, customers, rewards, and busy days.
        </p>

        <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/10 p-3">
          <p className="text-xs font-semibold text-primary">
            Viewing: {format(new Date(), 'MMMM yyyy')}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Sales use completed orders only. Menu performance uses completed checkout items for this restaurant.
          </p>
        </div>
      </div>

      <SalesAnalyticsCard isLoading={isLoading} data={data} />

      <Section
        title="Sales Charts"
        subtitle="Visual sales trends from completed customer checkouts."
      >
        <div className="col-span-2">
          <ChartCard
            icon={LineChartIcon}
            title="Sales Trend"
            subtitle="Daily revenue from the last 30 days."
          >
            {isLoading ? (
              <EmptyChartState message="Loading sales chart..." />
            ) : hasChartData(dailySalesTrend, ['sales']) ? (
              <div className="h-[270px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySalesTrend} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} tickMargin={8} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(value) => `$${value}`} />
                    <Tooltip content={<CurrencyTooltip />} />
                    <Area type="monotone" dataKey="sales" name="Sales" stroke="currentColor" fill="currentColor" fillOpacity={0.18} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChartState message="No completed sales in the last 30 days yet." />
            )}
          </ChartCard>
        </div>

        <ChartCard
          icon={BarChart3}
          title="Busy Days"
          subtitle="Completed orders by weekday this month."
        >
          {isLoading ? (
            <EmptyChartState message="Loading busy days..." />
          ) : hasChartData(busyDays, ['orders']) ? (
            <div className="h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={busyDays} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip content={<NumberTooltip />} />
                  <Bar dataKey="orders" name="Orders" radius={[8, 8, 0, 0]} fill="currentColor" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChartState message="No completed orders this month yet." />
          )}
        </ChartCard>

        <ChartCard
          icon={Activity}
          title="Revenue vs Rewards"
          subtitle="Monthly revenue compared with redeemed points."
        >
          {isLoading ? (
            <EmptyChartState message="Loading comparison..." />
          ) : hasChartData(revenueVsRewards, ['value']) ? (
            <div className="h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueVsRewards} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<NumberTooltip />} />
                  <Bar dataKey="value" name="Value" radius={[8, 8, 0, 0]} fill="currentColor" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChartState message="No revenue or reward data this month yet." />
          )}
        </ChartCard>
      </Section>

      <MenuPerformanceCard
        isLoading={isLoading}
        data={data.menuPerformance}
      />

      <RewardsAnalyticsCard isLoading={isLoading} data={data} />

      <Section
        title="Rewards Charts"
        subtitle="Points issued, points redeemed, and rewards redeemed this month."
      >
        <div className="col-span-2">
          <ChartCard
            icon={Repeat2}
            title="Rewards Usage"
            subtitle="Monthly rewards movement."
          >
            {isLoading ? (
              <EmptyChartState message="Loading rewards chart..." />
            ) : hasChartData(rewardsUsage, ['value']) ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rewardsUsage} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip content={<NumberTooltip />} />
                    <Bar dataKey="value" name="Amount" radius={[8, 8, 0, 0]} fill="currentColor" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChartState message="No rewards activity this month yet." />
            )}
          </ChartCard>
        </div>
      </Section>

      <CustomerAnalyticsCard isLoading={isLoading} data={data} />

      <Section
        title="Customer Charts"
        subtitle="Customer growth over the last 30 days."
      >
        <div className="col-span-2">
          <ChartCard
            icon={TrendingUp}
            title="Customer Growth"
            subtitle="Total customers over the last 30 days."
          >
            {isLoading ? (
              <EmptyChartState message="Loading customer growth..." />
            ) : customerGrowthTrend.length > 0 ? (
              <div className="h-[270px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={customerGrowthTrend} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} tickMargin={8} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip content={<NumberTooltip />} />
                    <Line type="monotone" dataKey="customers" name="Customers" stroke="currentColor" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChartState message="No customer data yet." />
            )}
          </ChartCard>
        </div>
      </Section>

      <TopCustomersCard isLoading={isLoading} customers={data.topCustomers} />
    </div>
  );
}
