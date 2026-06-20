"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface RiskTrendPoint {
  day: string;
  login: number;
  anomaly: number;
  insider: number;
}

export function AnomalyTrendChart({ data }: { data: RiskTrendPoint[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="login" stackId="1" stroke="#0891b2" fill="#0891b2" fillOpacity={0.35} />
          <Area type="monotone" dataKey="anomaly" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.35} />
          <Area type="monotone" dataKey="insider" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.35} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
