import {
  BarChart3,
  CalendarDays,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import InsightCard from './InsightCard';
import Section from './Section';
import { compactMoney, money, number } from '../utils/formatters';

export default function SalesAnalyticsCard({ isLoading, data = {} }) {
  return (
    <Section
      title="Sales Performance"
      subtitle="Revenue from completed checkouts."
    >
      <InsightCard
        icon={DollarSign}
        label="Sales Today"
        value={isLoading ? '...' : compactMoney(data.todaySales)}
        subtext={`${isLoading ? '...' : number(data.todayOrderCount)} completed orders today`}
        color="text-emerald-400"
      />

      <InsightCard
        icon={CalendarDays}
        label="Sales This Week"
        value={isLoading ? '...' : compactMoney(data.weekSales)}
        subtext="Monday through Sunday"
        color="text-green-400"
      />

      <InsightCard
        icon={TrendingUp}
        label="Sales This Month"
        value={isLoading ? '...' : compactMoney(data.monthSales)}
        subtext={`${isLoading ? '...' : number(data.monthOrderCount)} completed orders this month`}
        color="text-blue-400"
      />

      <InsightCard
        icon={Wallet}
        label="Average Ticket"
        value={isLoading ? '...' : `$${money(data.averageTicket)}`}
        subtext="Average completed order value this month"
        color="text-violet-400"
      />

      <InsightCard
        icon={BarChart3}
        label="Sales This Year"
        value={isLoading ? '...' : compactMoney(data.yearSales)}
        subtext="Year-to-date completed order revenue"
        color="text-cyan-400"
      />

      <InsightCard
        icon={ShoppingBag}
        label="Orders This Month"
        value={isLoading ? '...' : number(data.monthOrderCount)}
        subtext="Completed customer checkouts"
        color="text-orange-400"
      />
    </Section>
  );
}