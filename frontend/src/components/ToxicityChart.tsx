'use client';

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';
import { MetricData } from '@/hooks/useLiveStream';

interface ToxicityChartProps {
    data: MetricData[];
}

export const ToxicityChart: React.FC<ToxicityChartProps> = ({ data }) => {
    return (
        <div className="h-full w-full rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#121212]">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Toxicity Trend</h3>
                    <p className="text-xs text-gray-500">Real-time analysis of comment levels</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold text-red-600 dark:bg-red-500/10">
                    LIVE
                </div>
            </div>
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorToxic" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                        <XAxis
                            dataKey="window_start"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#888' }}
                            dy={10}
                            tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#888' }}
                            tickFormatter={(val) => `${val}`}
                        />
                        <Tooltip
                            labelFormatter={(time) => new Date(time).toLocaleString()}
                            contentStyle={{
                                backgroundColor: '#1f2937',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '12px',
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="total_comments"
                            name="Total Comments"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                            isAnimationActive={false}
                        />
                        <Area
                            type="monotone"
                            dataKey="unique_viewers"
                            name="Unique Viewers"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorUnique)"
                            isAnimationActive={false}
                        />
                        <Area
                            type="monotone"
                            dataKey="toxic_count"
                            name="Toxic Comments"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorToxic)"
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
