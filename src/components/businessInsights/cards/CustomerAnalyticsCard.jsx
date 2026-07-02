import {
  UserPlus,
  Repeat2,
  TrendingUp,
  Coins,
  Users,
  Trophy,
} from 'lucide-react';

import InsightCard from './InsightCard';
import Section from './Section';
import { number } from '../utils/formatters';

export default function CustomerAnalyticsCard({
  isLoading,
  data = {},
}) {
  return (
    <Section
      title="Customer Analytics"
      subtitle="Customer growth, activity, and loyalty health."
    >
      <InsightCard
        icon={UserPlus}
        label="New Members"
        value={isLoading ? '...' : number(data.newMembersThisMonth)}
        subtext="Customers who joined this month"
        color="text-blue-400"
      />

      <InsightCard
        icon={Repeat2}
        label="Active Customers"
        value={isLoading ? '...' : number(data.activeCustomersThisMonth)}
        subtext="Unique customers with completed orders this month"
        color="text-cyan-400"
      />

      <InsightCard
        icon={TrendingUp}
        label="Average Visits"
        value={isLoading ? '...' : Number(data.averageVisits || 0).toFixed(1)}
        subtext="Average visits across all customers"
        color="text-emerald-400"
      />

      <InsightCard
        icon={Coins}
        label="Outstanding Points"
        value={isLoading ? '...' : number(data.outstandingPoints)}
        subtext="Unredeemed customer point balances"
        color="text-amber-400"
      />

      <InsightCard
        icon={Users}
        label="Total Members"
        value={isLoading ? '...' : number(data.totalCustomers)}
        subtext="All customers in this restaurant"
        color="text-indigo-400"
      />

      <InsightCard
        icon={Trophy}
        label="Top Customer List"
        value={isLoading ? '...' : number(data.topCustomers?.length || 0)}
        subtext="Top customers shown below"
        color="text-orange-400"
      />
    </Section>
  );
}