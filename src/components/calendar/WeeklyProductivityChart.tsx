"use client";

import React, { useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { Task } from "@/types";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from "date-fns";

interface WeeklyProductivityChartProps {
  tasks: Task[];
}

export function WeeklyProductivityChart({ tasks }: WeeklyProductivityChartProps) {
  const chartData = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 0 }); // Sunday start
    const end = endOfWeek(today, { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      // Find tasks created on this day (Added)
      const added = tasks.filter(t => isSameDay(new Date(t.createdAt), day)).length;
      
      // Find tasks completed on this day (Completed)
      // Note: we assume updatedAt represents completion time for COMPLETED tasks 
      // or we can use a simpler metric: how many tasks due this day are completed
      const completed = tasks.filter(t => 
        t.status === "COMPLETED" && 
        isSameDay(new Date(t.updatedAt), day)
      ).length;

      return {
        name: format(day, "EEE"), // Mon, Tue, Wed...
        Added: added,
        Completed: completed
      };
    });
  }, [tasks]);

  return (
    <div className="w-full h-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex flex-col">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Weekly Productivity
      </h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              dx={-10}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend 
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Bar dataKey="Added" fill="#94A3B8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Completed" fill="#4F46E5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
