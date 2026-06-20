"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DeviceTrustChart } from "@/components/security/device-trust-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deviceApi } from "@/lib/api/resources";

export default function DeviceManagementPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("ALL");
  const { data: devices = [] } = useQuery({ queryKey: ["devices"], queryFn: deviceApi.list });
  const trustMutation = useMutation({ mutationFn: deviceApi.trust, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] }) });
  const blockMutation = useMutation({ mutationFn: (id: string) => deviceApi.block(id, "Blocked from analyst console"), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] }) });
  const unblockMutation = useMutation({ mutationFn: deviceApi.unblock, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["devices"] }) });

  const filtered = useMemo(() => devices.filter((device) => status === "ALL" || device.trustLevel === status), [devices, status]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Device Management</h1>
        <p className="text-sm text-muted-foreground">Trusted, unknown, suspicious, and blocked device inventory.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Device Trust Distribution</CardTitle></CardHeader>
        <CardContent><DeviceTrustChart devices={devices} /></CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Devices</CardTitle><Select className="w-44" value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">All devices</option><option value="TRUSTED">Trusted</option><option value="UNKNOWN">Unknown</option><option value="SUSPICIOUS">Suspicious</option><option value="BLOCKED">Blocked</option></Select></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Device</TableHead><TableHead>IP</TableHead><TableHead>Status</TableHead><TableHead>Trust</TableHead><TableHead>Signals</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((device) => (
                <TableRow key={device._id}>
                  <TableCell>{device.browser} on {device.os}</TableCell>
                  <TableCell>{device.lastIpAddress}</TableCell>
                  <TableCell><Badge variant={device.trustLevel === "TRUSTED" ? "low" : device.trustLevel === "BLOCKED" ? "critical" : "medium"}>{device.trustLevel}</Badge></TableCell>
                  <TableCell>{device.trustScore}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{device.riskFlags.join(", ") || "none"}</TableCell>
                  <TableCell className="space-x-2"><Button size="sm" variant="outline" onClick={() => trustMutation.mutate(device._id)}>Trust</Button><Button size="sm" variant="destructive" onClick={() => blockMutation.mutate(device._id)}>Block</Button><Button size="sm" variant="ghost" onClick={() => unblockMutation.mutate(device._id)}>Unblock</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
