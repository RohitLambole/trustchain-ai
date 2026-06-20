"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, BrainCircuit, Radar, ShieldAlert } from "lucide-react";
import { AnomalyTrendChart, type RiskTrendPoint } from "@/components/security/anomaly-trend-chart";
import { AlertWidget } from "@/components/security/alert-widget";
import { RiskScoreCard } from "@/components/security/risk-score-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { riskApi } from "@/lib/api/resources";
import type { RiskEvent } from "@/types/domain";

function trendFromEvents(events: RiskEvent[]): RiskTrendPoint[] {
  const byDay = new Map<string, RiskTrendPoint>();
  events.forEach((event) => {
    const day = new Date(event.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const current = byDay.get(day) ?? { day, login: 0, anomaly: 0, insider: 0 };
    if (event.eventCategory === "AUTHENTICATION" || event.eventType.includes("LOGIN")) current.login += 1;
    if (event.eventType.includes("ANOMALY") || event.eventCategory.includes("ML")) current.anomaly += 1;
    if (event.eventCategory === "INSIDER_THREAT") current.insider += 1;
    byDay.set(day, current);
  });
  return [...byDay.values()];
}

export default function AnalystDashboardPage() {
  const { data: dashboard } = useQuery({ queryKey: ["risk-dashboard"], queryFn: riskApi.dashboard });
  const { data: highRiskEvents = [] } = useQuery({ queryKey: ["analyst-high-risk-events"], queryFn: riskApi.highRiskEvents });

  const recentDecisions = dashboard?.recentDecisions ?? [];
  const events = highRiskEvents.length ? highRiskEvents : dashboard?.highRiskEvents ?? [];
  const riskTrendData = useMemo(() => trendFromEvents([...recentDecisions, ...highRiskEvents]), [highRiskEvents, recentDecisions]);
  const highRiskLogins = events.filter((event) => event.eventCategory === "AUTHENTICATION" || event.eventType.includes("LOGIN")).length;
  const insiderAlerts = events.filter((event) => event.eventCategory === "INSIDER_THREAT").length;
  const deviceSignals = recentDecisions.filter((event) => event.eventCategory === "DEVICE" || event.eventType.includes("DEVICE")).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Security Analyst</h1>
        <p className="text-sm text-muted-foreground">High-risk authentication, ML anomaly, insider threat, and device signal triage.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <RiskScoreCard title="High-Risk Logins" value={highRiskLogins} level="high" icon={ShieldAlert} />
        <RiskScoreCard title="ML Anomalies" value={dashboard?.anomalyCounts.total ?? 0} level="medium" icon={BrainCircuit} />
        <RiskScoreCard title="Insider Alerts" value={insiderAlerts} level="critical" icon={AlertTriangle} />
        <RiskScoreCard title="Device Signals" value={deviceSignals} level="medium" icon={Radar} />
      </div>
      <Card>
        <CardHeader><CardTitle>Risk Trend Charts</CardTitle></CardHeader>
        <CardContent>{riskTrendData.length ? <AnomalyTrendChart data={riskTrendData} /> : <p className="text-sm text-muted-foreground">No risk trend data found.</p>}</CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-3">
        <AlertWidget title="High-Risk Login Events" events={events.filter((event) => event.eventCategory === "AUTHENTICATION")} />
        <AlertWidget title="ML Anomaly Alerts" events={recentDecisions.filter((event) => event.eventType.includes("ANOMALY") || event.eventCategory.includes("ML"))} />
        <AlertWidget title="Insider Threat Alerts" events={events.filter((event) => event.eventCategory === "INSIDER_THREAT")} />
      </div>
    </div>
  );
}
