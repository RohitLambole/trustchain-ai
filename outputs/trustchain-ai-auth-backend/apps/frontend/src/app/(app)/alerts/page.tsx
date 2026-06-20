"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertWidget } from "@/components/security/alert-widget";
import { riskApi } from "@/lib/api/resources";

export default function AlertCenterPage() {
  const { data: events = [] } = useQuery({ queryKey: ["alert-center"], queryFn: riskApi.events });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Alert Center</h1>
        <p className="text-sm text-muted-foreground">Account takeover, recovery fraud, and insider threat queues.</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <AlertWidget title="Account Takeover Alerts" events={events.filter((event) => event.eventCategory === "AUTHENTICATION" || event.eventType.includes("LOGIN"))} />
        <AlertWidget title="Recovery Fraud Alerts" events={events.filter((event) => event.eventCategory === "ACCOUNT_RECOVERY" || event.eventType.includes("RECOVERY"))} />
        <AlertWidget title="Insider Threat Alerts" events={events.filter((event) => event.eventCategory === "INSIDER_THREAT")} />
      </div>
    </div>
  );
}
