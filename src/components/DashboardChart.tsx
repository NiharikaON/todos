"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Task } from "@/types";

interface ChartData {
  name: string;
  completed: number;
}

export function DashboardChart({ tasks = [] }: { tasks?: Task[] }) {
  // Generate the last 7 days including today
  const generateTrendData = (): ChartData[] => {
    const data: ChartData[] = [];
    const now = new Date();
    
    // Create an array of the last 7 days (starting from 6 days ago up to today)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0); // Start of day
      
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1); // Start of next day
      
      // Count completed tasks updated on this day
      const completedOnDay = tasks.filter(t => {
        if (t.status !== "COMPLETED") return false;
        // Use updatedAt as a proxy for completion time
        const completedDate = new Date(t.updatedAt);
        return completedDate >= d && completedDate < nextDay;
      }).length;

      data.push({
        name: d.toLocaleDateString(undefined, { weekday: 'short' }),
        completed: completedOnDay
      });
    }
    return data;
  };

  const data = generateTrendData();
  return (
    <div className="h-full w-full min-h-[150px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#9ca3af" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#9ca3af" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `${value}`} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }}
            itemStyle={{ color: "#fff" }}
          />
          <Line 
            type="monotone" 
            dataKey="completed" 
            stroke="#6366f1" 
            strokeWidth={3} 
            dot={{ r: 4, strokeWidth: 2 }} 
            activeDot={{ r: 6, strokeWidth: 0 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
