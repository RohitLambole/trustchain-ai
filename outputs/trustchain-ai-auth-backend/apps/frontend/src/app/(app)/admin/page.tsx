"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Blocks, KeyRound, Server, Shield, Users } from "lucide-react";
import { RiskScoreCard } from "@/components/security/risk-score-card";
import { AuditTimeline } from "@/components/security/audit-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminApi, blockchainApi } from "@/lib/api/resources";

export default function AdminDashboardPage() {
  const { data: dashboard } = useQuery({ queryKey: ["admin-dashboard"], queryFn: adminApi.dashboard });
  const { data: audits = [] } = useQuery({ queryKey: ["admin-audit-events"], queryFn: blockchainApi.auditEvents });
  const stats = dashboard?.stats;
  const users = dashboard?.recentUsers ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Administration</h1>
        <p className="text-sm text-muted-foreground">Users, roles, permissions, device inventory, audit evidence, and system health.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <RiskScoreCard title="Users" value={stats?.users ?? 0} level="low" icon={Users} />
        <RiskScoreCard title="Roles" value={stats?.roles ?? 0} level="low" icon={Shield} />
        <RiskScoreCard title="Permissions" value={stats?.permissions ?? 0} level="low" icon={KeyRound} />
        <RiskScoreCard title="Devices" value={stats?.devices ?? 0} level="medium" icon={Activity} />
        <RiskScoreCard title="Audit Events" value={stats?.auditEvents ?? audits.length} level="high" icon={Blocks} />
        <RiskScoreCard title="Health" value={stats?.health ?? "Unknown"} level={stats?.health === "OK" ? "low" : "medium"} icon={Server} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Users, Roles, Permissions</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}><TableCell>{user.email}</TableCell><TableCell>{user.roles.join(", ") || "No roles"}</TableCell><TableCell>{user.status}</TableCell></TableRow>
                ))}
                {!users.length ? <TableRow><TableCell colSpan={3} className="text-sm text-muted-foreground">No users found.</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Blockchain Audit Events</CardTitle></CardHeader>
          <CardContent><AuditTimeline audits={audits} /></CardContent>
        </Card>
      </div>
    </div>
  );
}
