"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, ShieldCheck, Smartphone } from "lucide-react";
import { AlertWidget } from "@/components/security/alert-widget";
import { DeviceTrustChart } from "@/components/security/device-trust-chart";
import { RiskScoreCard } from "@/components/security/risk-score-card";
import { TrustScoreGauge } from "@/components/security/trust-score-gauge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deviceApi, riskApi } from "@/lib/api/resources";
import { useAuthStore } from "@/stores/auth-store";

function riskLevelFromTrust(score?: number) {
  if (score === undefined) return "No data";
  if (score >= 75) return "LOW";
  if (score >= 45) return "MEDIUM";
  return "HIGH";
}

function cardLevel(score?: number): "low" | "medium" | "high" | "critical" {
  if (score === undefined || score >= 75) return "low";
  if (score >= 45) return "medium";
  return "high";
}

export default function CustomerDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data: devices = [] } = useQuery({ queryKey: ["devices"], queryFn: deviceApi.list });
  const { data: events = [] } = useQuery({ queryKey: ["risk-events"], queryFn: riskApi.events });
  const { data: trustScore } = useQuery({
    queryKey: ["trust-score", user?.id],
    queryFn: () => riskApi.trustScore(user!.id),
    enabled: Boolean(user?.id)
  });
  useQuery({ queryKey: ["risk-dashboard"], queryFn: riskApi.dashboard });

  const averageDeviceTrust = useMemo(() => {
    if (!devices.length) return undefined;
    return Math.round(devices.reduce((sum, device) => sum + device.trustScore, 0) / devices.length);
  }, [devices]);

  const recoveryEvents = useMemo(
    () => events.filter((event) => event.eventCategory === "ACCOUNT_RECOVERY" || event.eventType.includes("RECOVERY")),
    [events]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Customer Security</h1>
        <p className="text-sm text-muted-foreground">Identity trust, device health, and recent account activity.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Trust Score</CardTitle></CardHeader>
          <CardContent>
            {trustScore ? <TrustScoreGauge score={trustScore.currentTrustScore} /> : <p className="text-sm text-muted-foreground">No trust score available.</p>}
          </CardContent>
        </Card>
        <RiskScoreCard title="Risk Level" value={riskLevelFromTrust(trustScore?.currentTrustScore)} level={cardLevel(trustScore?.currentTrustScore)} icon={ShieldCheck} />
        <RiskScoreCard title="Device Trust" value={averageDeviceTrust ?? "No devices"} level={cardLevel(averageDeviceTrust)} icon={Smartphone} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader><CardTitle>Trusted Devices</CardTitle></CardHeader>
          <CardContent><DeviceTrustChart devices={devices} /></CardContent>
        </Card>
        <AlertWidget title="Security Alerts" events={events} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Login Activity</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Device</TableHead><TableHead>IP</TableHead><TableHead>Trust</TableHead></TableRow></TableHeader>
              <TableBody>
                {devices.slice(0, 5).map((device) => (
                  <TableRow key={device._id}><TableCell>{device.browser} on {device.os}</TableCell><TableCell>{device.lastIpAddress}</TableCell><TableCell>{device.trustScore}</TableCell></TableRow>
                ))}
                {!devices.length ? <TableRow><TableCell colSpan={3} className="text-sm text-muted-foreground">No device activity found.</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" />Recovery Requests</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recoveryEvents.map((event) => (
              <div className="rounded-md border p-3 text-sm" key={event._id}>{event.eventType.replaceAll("_", " ")}</div>
            ))}
            {!recoveryEvents.length ? <p className="text-sm text-muted-foreground">No recovery events found.</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
