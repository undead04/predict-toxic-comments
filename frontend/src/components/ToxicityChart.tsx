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
                            <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
                            domain={[0, 1]}
                            tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                        />
                        <Tooltip
                            labelFormatter={(time) => new Date(time).toLocaleString()}
                            formatter={(value: any) => [`${(Number(value || 0) * 100).toFixed(1)}%`, 'Toxicity Rate']}
                            contentStyle={{
                                backgroundColor: '#1f2937',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '12px',
                            }}
                            itemStyle={{ color: '#ef4444' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="toxic_rate"
                            stroke="#ef4444"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorLevel)"
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
