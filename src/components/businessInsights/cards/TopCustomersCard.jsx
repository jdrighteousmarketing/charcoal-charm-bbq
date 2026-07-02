import { Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function money(value) {
  return Number(value || 0).toFixed(2);
}

function getCustomerLabel(customer) {
  return customer.name || customer.email || customer.customer_code || 'Customer';
}

export default function TopCustomersCard({ isLoading, customers = [] }) {
  return (
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
        ) : customers.length > 0 ? (
          <div className="space-y-3">
            {customers.map((customer, index) => (
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
  );
}