import { Badge } from "@/components/ui/badge";
import type { AuditLogRecord } from "@/types/domain";

export function AuditTimeline({ audits }: { audits: AuditLogRecord[] }) {
  return (
    <div className="space-y-3">
      {audits.map((audit) => (
        <div key={audit.auditId} className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_auto]">
          <div>
            <div className="text-sm font-medium">{audit.eventType.replaceAll("_", " ")}</div>
            <div className="mt-1 text-xs text-muted-foreground">{audit.auditId} - {audit.createdAt || "pending timestamp"}</div>
          </div>
          <div className="flex items-center gap-2">
            {audit.riskLevel ? <Badge variant={audit.riskLevel.toLowerCase() as "low" | "medium" | "high" | "critical"}>{audit.riskLevel}</Badge> : null}
            <Badge variant={audit.integrityStatus === "VERIFIED" ? "low" : audit.integrityStatus === "FAILED" ? "critical" : "medium"}>{audit.integrityStatus}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
