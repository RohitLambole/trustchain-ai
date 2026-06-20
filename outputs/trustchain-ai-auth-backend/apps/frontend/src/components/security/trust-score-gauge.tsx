"use client";

import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

export function TrustScoreGauge({ score }: { score: number }) {
  const data = [{ name: "Trust", value: score, fill: score >= 75 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444" }];
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer>
        <RadialBarChart innerRadius="70%" outerRadius="100%" data={data} startAngle={180} endAngle={-180}>
          <RadialBar dataKey="value" cornerRadius={8} background />
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-3xl font-semibold">
            {score}
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}
