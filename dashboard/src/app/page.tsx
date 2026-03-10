"use client";

import { useCorridors, useDashboardStats, useActivity, useChartData } from "@/hooks/use-corridors";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { TopCorridors } from "@/components/dashboard/TopCorridors";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { VolumeChart } from "@/components/dashboard/VolumeChart";

export default function DashboardPage() {
  const { stats } = useDashboardStats();
  const { corridors } = useCorridors();
  const { events } = useActivity();
  const { data: chartData } = useChartData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-eve-text-dim mt-1">Frontier Exchange Network overview</p>
      </div>

      <StatsGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VolumeChart data={chartData} />
        </div>
        <div>
          <RecentActivity events={events.slice(0, 6)} />
        </div>
      </div>

      <TopCorridors corridors={corridors} />
    </div>
  );
}
