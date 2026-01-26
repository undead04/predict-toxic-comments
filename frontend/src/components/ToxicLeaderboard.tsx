'use client';
import React from 'react';
import { Trophy } from 'lucide-react';
import { LeaderboardUser } from '@/hooks/useLiveStream';
interface ToxicLeaderboardProps {
    data: LeaderboardUser[];
}
export const ToxicLeaderboard: React.FC<ToxicLeaderboardProps> = ({ data }) => {
    return (
        <div className="h-full w-full rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#121212]">
            <div className="mb-6 flex items-center gap-3">
                <div className="rounded-xl bg-amber-100 p-2 dark:bg-amber-500/10">
                    <Trophy className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Toxic Leaderboard</h3>
                    <p className="text-xs text-gray-500">Users with most toxic flags</p>
                </div>
            </div>
            <div className="space-y-4">
                {data.length === 0 ? (
                    <div className="flex h-40 items-center justify-center text-gray-400">
                        <p className="text-sm">No toxic activity detected yet.</p>
                    </div>
                ) : (
                    data.map((user, index) => (
                        <div key={user.author_id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold ${index === 0 ? 'bg-amber-100 text-amber-700' :
                                    index === 1 ? 'bg-slate-100 text-slate-700' :
                                        index === 2 ? 'bg-orange-100 text-orange-700' :
                                            'bg-gray-50 text-gray-500'
                                    }`}>
                                    #{index + 1}
                                </span>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {user.author_name}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <span className="block text-xs font-bold text-gray-900 dark:text-white">
                                        {user.toxic_count} <small className="text-[10px] font-normal text-gray-400">msgs</small>
                                    </span>
                                </div>
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                    <div
                                        className="h-full bg-red-500 transition-all group-hover:bg-red-600"
                                        style={{ width: `${Math.min((user.toxic_count / (data[0]?.toxic_count || 1)) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
