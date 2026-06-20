"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AuditTimeline } from "@/components/security/audit-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { blockchainApi } from "@/lib/api/resources";

export default function AuditExplorerPage() {
  const queryClient = useQueryClient();
  const { data: audits = [] } = useQuery({ queryKey: ["audit-events"], queryFn: blockchainApi.auditEvents });
  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState("ALL");
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
  const { data: selectedAudit } = useQuery({
    queryKey: ["audit-detail", selectedAuditId],
    queryFn: () => blockchainApi.getById(selectedAuditId!),
    enabled: Boolean(selectedAuditId)
  });
  const verifyMutation = useMutation({
    mutationFn: blockchainApi.verifyById,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["audit-events"] })
  });

  const filtered = useMemo(() => audits.filter((audit) => {
    const matchesSearch = `${audit.auditId} ${audit.eventType} ${audit.subjectId ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = risk === "ALL" || audit.riskLevel === risk;
    return matchesSearch && matchesRisk;
  }), [audits, risk, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Blockchain Audit Explorer</h1>
        <p className="text-sm text-muted-foreground">Search and verify immutable audit references anchored on-chain.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_180px]">
          <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search audit id, event type, user reference" /></div>
          <Select value={risk} onChange={(event) => setRisk(event.target.value)}>
            <option value="ALL">All risk levels</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option>
          </Select>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Audit Records</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Audit</TableHead><TableHead>Event Type</TableHead><TableHead>Risk</TableHead><TableHead>Verification</TableHead><TableHead>Timestamp</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map((audit) => (
                <TableRow key={audit.auditId}>
                  <TableCell className="font-mono text-xs">{audit.auditId}</TableCell>
                  <TableCell>{audit.eventType}</TableCell>
                  <TableCell>{audit.riskLevel ? <Badge variant={audit.riskLevel.toLowerCase() as "low" | "medium" | "high" | "critical"}>{audit.riskLevel}</Badge> : "None"}</TableCell>
                  <TableCell><Badge variant={audit.integrityStatus === "VERIFIED" ? "low" : audit.integrityStatus === "FAILED" ? "critical" : "medium"}>{audit.integrityStatus}</Badge></TableCell>
                  <TableCell>{audit.createdAt}</TableCell>
                  <TableCell className="space-x-2"><Button size="sm" variant="outline" onClick={() => setSelectedAuditId(audit.auditId)}>Details</Button><Button size="sm" onClick={() => verifyMutation.mutate(audit.auditId)}>Verify</Button></TableCell>
                </TableRow>
              ))}
              {!filtered.length ? <TableRow><TableCell colSpan={6} className="text-sm text-muted-foreground">No audit records found.</TableCell></TableRow> : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedAuditId ? (
        <Card>
          <CardHeader><CardTitle>Audit Detail</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>Audit ID: <span className="font-mono">{selectedAuditId}</span></div>
            <div>Payload Hash: <span className="font-mono">{selectedAudit?.localAudit?.payloadHash ?? selectedAudit?.audit?.eventHash ?? "Unavailable"}</span></div>
            <div>Transaction: <span className="font-mono">{selectedAudit?.localAudit?.blockchainTxHash ?? "Not anchored"}</span></div>
            <div>Block: {selectedAudit?.localAudit?.blockNumber ?? "Pending"}</div>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader><CardTitle>Audit Timeline</CardTitle></CardHeader>
        <CardContent><AuditTimeline audits={filtered} /></CardContent>
      </Card>
    </div>
  );
}
