"use client";

import React, { useEffect, useState } from "react";
import { getWorkspaceAnalytics, AnalyticsData } from "@/services/analyticsService";
import { Loader2, TrendingUp, CheckCircle, BarChart3, Users } from "lucide-react";
import {
  RadialBarChart, RadialBar, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Cell, LabelList
} from "recharts";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function AnalyticsClient({ workspaceId }: { workspaceId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getWorkspaceAnalytics(workspaceId);
        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-96 items-center justify-center text-muted-foreground">
        Failed to load analytics data.
      </div>
    );
  }

  const { summary, projectsByStatus, tasksByStatus, tasksByPriority, tasksByUser } = data;

  const workloadChartData = tasksByUser.map(user => ({
    ...user,
    active: user.assigned - user.completed
  }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Total Projects</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold">{summary.totalProjects}</div>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Total Tasks</span>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold">{summary.totalTasks}</div>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Tasks Completed</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold">{summary.completedTasks}</div>
        </div>

        <div className="bg-card border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Team Members</span>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold">{summary.totalMembers}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Donut */}
        <div className="bg-card border rounded-xl p-4 sm:p-6 shadow-sm">
          <h3 className="font-semibold mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            Task Status Distribution
          </h3>
          <div className="h-[300px] w-full">
            {tasksByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="20%" 
                  outerRadius="100%" 
                  barSize={15} 
                  data={tasksByStatus.map((d, i) => ({ ...d, fill: COLORS[i % COLORS.length] }))}
                >
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={10}
                  />
                  <Legend iconSize={10} layout="horizontal" verticalAlign="bottom" />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No task data available</div>
            )}
          </div>
        </div>

        {/* Task Priority Donut */}
        <div className="bg-card border rounded-xl p-4 sm:p-6 shadow-sm">
          <h3 className="font-semibold mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Task Priority Distribution
          </h3>
          <div className="h-[300px] w-full -ml-2 sm:ml-0">
            {tasksByPriority.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tasksByPriority}
                  margin={isMobile ? { top: 10, right: 20, left: 0, bottom: 0 } : { top: 20, right: 30, left: 20, bottom: 5 }}
                  barSize={isMobile ? 25 : 40}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--foreground))', fontSize: isMobile ? 11 : 13, fontWeight: 500 }}
                    tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ')}
                    width={isMobile ? 60 : 90}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" name="Total Tasks" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="value" position="right" fill="hsl(var(--muted-foreground))" fontSize={12} />
                    {tasksByPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No task data available</div>
            )}
          </div>
        </div>

        {/* Member Workload Bar Chart */}
        <div className="bg-card border rounded-xl p-4 sm:p-6 shadow-sm lg:col-span-2">
          <h3 className="font-semibold mb-6  flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            Member Workload & Velocity
          </h3>
          <div className="h-[350px] w-full -ml-4 sm:ml-0">
            {workloadChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={workloadChartData}
                  margin={isMobile ? { top: 10, right: 10, left: -20, bottom: 0 } : { top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: isMobile ? 10 : 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    dx={-10}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', display:'flex',justifyContent:'center',marginInlineStart:'40px' }} />
                  <Area type="monotone" dataKey="active" name="Active Tasks" stroke="#6366f1" fillOpacity={1} fill="url(#colorActive)" />
                  <Area type="monotone" dataKey="completed" name="Completed Tasks" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No workload data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
