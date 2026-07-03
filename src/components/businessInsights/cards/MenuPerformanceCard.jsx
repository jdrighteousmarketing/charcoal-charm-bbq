// @ts-nocheck
import { BarChart3, PieChart, ShoppingBag, Trophy } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

function money(value) {
  return Number(value || 0).toFixed(2);
}

function number(value) {
  return new Intl.NumberFormat('en-US').format(Number(value || 0));
}

function compactMoney(value) {
  const amount = Number(value || 0);

  if (Math.abs(amount) >= 1000) {
    return `$${new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount)}`;
  }

  return `$${money(amount)}`;
}

function getItemLabel(item) {
  return item.itemName || item.item_name || item.name || 'Menu Item';
}

function getCategoryLabel(category) {
  return category.categoryName || category.category_name || category.name || 'Uncategorized';
}

function getQuantity(item) {
  return Number(item.quantity || item.total_quantity || item.items_sold || 0);
}

function getRevenue(item) {
  return Number(item.revenue || item.total_price || item.total_revenue || 0);
}

function truncateLabel(value, maxLength = 16) {
  const label = String(value || 'Item');
  return label.length > maxLength ? `${label.slice(0, maxLength)}...` : label;
}

const PIE_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
];

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-5 text-center">
      <p className="text-sm font-semibold">No menu sales data yet</p>
      <p className="text-xs text-muted-foreground mt-1">
        Menu performance will appear after completed checkouts include menu items.
      </p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-background/95 px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold mb-1">{label}</p>
      {payload.map((entry, index) => {
        const isRevenue = String(entry.name || entry.dataKey || '')
          .toLowerCase()
          .includes('revenue');

        return (
          <p key={index} className="text-xs text-muted-foreground">
            {entry.name}: {isRevenue ? compactMoney(entry.value) : number(entry.value)}
          </p>
        );
      })}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];

  return (
    <div className="rounded-xl border border-border bg-background/95 px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold mb-1">{entry.name}</p>
      <p className="text-xs text-muted-foreground">
        Revenue: {compactMoney(entry.value)}
      </p>
    </div>
  );
}

export default function MenuPerformanceCard({ isLoading, data = {} }) {
  const topSellingItems = Array.isArray(data.topSellingItems) ? data.topSellingItems : [];
  const topRevenueItems = Array.isArray(data.topRevenueItems) ? data.topRevenueItems : [];
  const salesByCategory = Array.isArray(data.salesByCategory) ? data.salesByCategory : [];

  const totalItemsSold = Number(data.totalItemsSold || 0);
  const menuRevenue = Number(data.menuRevenue || 0);

  const topSellingChartData = topSellingItems.map((item) => ({
    ...item,
    itemLabel: getItemLabel(item),
    sold: getQuantity(item),
  }));

  const categoryChartData = salesByCategory.map((category) => ({
    ...category,
    categoryLabel: getCategoryLabel(category),
    revenue: getRevenue(category),
  }));

  const topRevenueChartData = topRevenueItems.map((item) => ({
    ...item,
    itemLabel: getItemLabel(item),
    sold: getQuantity(item),
    revenue: getRevenue(item),
  }));

  const hasData =
    topSellingChartData.length > 0 ||
    categoryChartData.length > 0 ||
    topRevenueChartData.length > 0;

  return (
    <Card className="border-border/60 bg-card/80">
      <CardContent className="p-5 space-y-5">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">
              Menu Performance
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Item sales and category revenue from completed checkouts this month
            </p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading menu performance...</p>
        ) : hasData ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs text-muted-foreground">Items Sold</p>
                <p className="text-2xl font-bold mt-1">{number(totalItemsSold)}</p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/40 p-4">
                <p className="text-xs text-muted-foreground">Menu Revenue</p>
                <p className="text-2xl font-bold mt-1">{compactMoney(menuRevenue)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <p className="text-sm font-semibold">Top Selling Items</p>
              </div>

              {topSellingChartData.length > 0 ? (
                <div className="h-80 rounded-2xl border border-border/60 bg-background/30 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topSellingChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 8, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="itemLabel"
                        tick={{ fontSize: 11 }}
                        width={105}
                        tickFormatter={(value) => truncateLabel(value, 15)}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(59,130,246,.12)' }}
                        content={<CustomTooltip />}
                      />
                      <Bar
                        dataKey="sold"
                        name="Sold"
                        radius={[0, 8, 8, 0]}
                        fill="#3b82f6"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-violet-400" />
                <p className="text-sm font-semibold">Sales by Category</p>
              </div>

              {categoryChartData.length > 0 ? (
                <div className="h-80 rounded-2xl border border-border/60 bg-background/30 p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryChartData}
                        dataKey="revenue"
                        nameKey="categoryLabel"
                        innerRadius={55}
                        outerRadius={100}
                        paddingAngle={2}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell
                            key={`${entry.categoryLabel}-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-orange-400" />
                <p className="text-sm font-semibold">Highest Revenue Items</p>
              </div>

              {topRevenueChartData.length > 0 ? (
                <div className="space-y-3">
                  {topRevenueChartData.map((item, index) => (
                    <div
                      key={`${item.itemLabel}-${index}`}
                      className="flex items-center justify-between gap-3 border-b border-border/50 pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {item.itemLabel}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {number(item.sold)} sold
                          </p>
                        </div>
                      </div>

                      <p className="text-sm font-bold text-primary shrink-0">
                        {compactMoney(item.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  );
}