"use client";

import React, { useMemo } from "react";
import { Sprint, Task } from "@/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface Props {
  sprint: Sprint;
  tasks: Task[];
}

export function BurndownChart({ sprint, tasks }: Props) {
  const data = useMemo(() => {
    if (!sprint.startDate || !sprint.endDate) return [];
    
    const start = new Date(sprint.startDate).getTime();
    const end = new Date(sprint.endDate).getTime();
    
    if (end <= start) return [];

    const totalStoryPoints = tasks.reduce((sum, task) => sum + (task.storyPoints || 1), 0);
    const dayMs = 1000 * 60 * 60 * 24;
    const days = Math.ceil((end - start) / dayMs);

    const chartData = [];
    let remainingPoints = totalStoryPoints;

    for (let i = 0; i <= days; i++) {
      const currentDayTime = start + i * dayMs;
      const dateStr = new Date(currentDayTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      // Calculate ideal trend
      const idealRemaining = Math.max(0, totalStoryPoints - (totalStoryPoints / days) * i);

      // In a real system, we'd need historical completed dates for tasks. 
      // Since our task model only has `updatedAt`, we'll simulate actual remaining points
      // by just subtracting points for tasks completed BEFORE this day.
      // (Assuming `updatedAt` is when it was completed).
      let completedPoints = 0;
      tasks.forEach(task => {
        if (task.status === "done" || task.status === "completed") {
          // If task.updatedAt <= currentDayTime
          // But actually we need task completion date.
          // Fallback: if today is past the updated date, count it as completed
          const updatedTime = new Date(task.updatedAt || Date.now()).getTime();
          if (updatedTime <= currentDayTime) {
            completedPoints += (task.storyPoints || 1);
          }
        }
      });

      let actualRemaining: number | null = totalStoryPoints - completedPoints;
      
      // Don't show actual trend for future dates
      if (currentDayTime > Date.now() + dayMs) {
        actualRemaining = null;
      }

      chartData.push({
        name: dateStr,
        Ideal: parseFloat(idealRemaining.toFixed(1)),
        Actual: actualRemaining !== null ? parseFloat(actualRemaining.toFixed(1)) : null
      });
    }

    return chartData;
  }, [sprint, tasks]);

  if (data.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground border rounded-xl bg-background/50">
        Start dates and End dates are required for the Burndown Chart.
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] bg-background/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold mb-6">Burndown Chart</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line 
            type="monotone" 
            dataKey="Ideal" 
            stroke="#94a3b8" 
            strokeWidth={2} 
            strokeDasharray="5 5" 
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="Actual" 
            stroke="#6366f1" 
            strokeWidth={3} 
            activeDot={{ r: 8 }}
            connectNulls={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
