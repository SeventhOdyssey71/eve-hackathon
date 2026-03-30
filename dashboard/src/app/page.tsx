"use client";

import { useState } from "react";
import { useCorridors, useDashboardStats, useActivity, useChartData } from "@/hooks/use-corridors";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { TopCorridors } from "@/components/dashboard/TopCorridors";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { VolumeChart } from "@/components/dashboard/VolumeChart";
import { SkeletonStatsGrid, SkeletonChart, SkeletonActivityList, SkeletonTable } from "@/components/ui/Skeleton";

export default function DashboardPage() {
  const { stats, isLoading } = useDashboardStats();
  const { corridors, isLoading: corridorsLoading } = useCorridors();
  const { events } = useActivity();
  const [chartRange, setChartRange] = useState("24h");
  const { data: chartData, eventLog, isLoading: chartLoading } = useChartData(chartRange);

  return (
    <div className="space-y-8 max-w-[1440px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-eve-muted mt-1">Frontier Exchange Network overview</p>
      </div>

      {isLoading ? <SkeletonStatsGrid /> : <StatsGrid stats={stats} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading && chartData.length === 0 ? (
            <SkeletonChart />
          ) : (
            <VolumeChart
              data={chartData}
              eventLog={eventLog}
              range={chartRange}
              onRangeChange={setChartRange}
              isLoading={chartLoading}
            />
          )}
        </div>
        <div>
          {isLoading ? <SkeletonActivityList /> : <RecentActivity events={events.slice(0, 6)} />}
        </div>
      </div>

      {corridorsLoading ? <SkeletonTable rows={3} /> : <TopCorridors corridors={corridors} />}
    </div>
  );
}
