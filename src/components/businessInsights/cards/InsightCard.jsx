import { Card, CardContent } from '@/components/ui/card';

export default function InsightCard({ icon: Icon, label, value, subtext, color }) {
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