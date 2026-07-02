import { Cake, Coins, Gift, Star } from 'lucide-react';
import InsightCard from './InsightCard';
import Section from './Section';
import { number } from '../utils/formatters';

export default function RewardsAnalyticsCard({ isLoading, data = {} }) {
  return (
    <Section
      title="Rewards Analytics"
      subtitle="How customers are using the loyalty program this month."
    >
      <InsightCard
        icon={Cake}
        label="Birthday Rewards"
        value={isLoading ? '...' : number(data.birthdayRewardsRedeemedThisMonth)}
        subtext="Customers who redeemed birthday rewards this month"
        color="text-pink-400"
      />

      <InsightCard
        icon={Gift}
        label="Rewards Redeemed"
        value={isLoading ? '...' : number(data.rewardsRedeemedThisMonth)}
        subtext="Completed reward redemptions this month"
        color="text-purple-400"
      />

      <InsightCard
        icon={Star}
        label="Points Issued"
        value={isLoading ? '...' : number(data.pointsIssuedThisMonth)}
        subtext="Points customers earned this month"
        color="text-amber-400"
      />

      <InsightCard
        icon={Coins}
        label="Points Redeemed"
        value={isLoading ? '...' : number(data.pointsRedeemedThisMonth)}
        subtext="Points customers spent this month"
        color="text-orange-400"
      />
    </Section>
  );
}