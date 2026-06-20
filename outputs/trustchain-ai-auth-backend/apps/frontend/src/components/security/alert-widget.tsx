import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RiskEvent } from "@/types/domain";

export function AlertWidget({ title, events }: { title: string; events: RiskEvent[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event) => (
          <div key={event._id} className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">{event.eventType.replaceAll("_", " ")}</div>
              <div className="text-xs text-muted-foreground">{event.eventCategory}</div>
            </div>
            <Badge variant={event.severity.toLowerCase() as "low" | "medium" | "high" | "critical"}>{event.severity}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
