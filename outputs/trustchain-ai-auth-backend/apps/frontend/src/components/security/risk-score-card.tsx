import { ArrowUpRight, LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function RiskScoreCard({ title, value, level, icon: Icon }: { title: string; value: string | number; level: "low" | "medium" | "high" | "critical"; icon: LucideIcon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="text-2xl font-semibold">{value}</div>
          <Badge variant={level}>{level.toUpperCase()}</Badge>
        </div>
        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <ArrowUpRight className="h-3 w-3" />
          Updated from live risk context
        </div>
      </CardContent>
    </Card>
  );
}
