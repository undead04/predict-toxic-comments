'use client';

import React from 'react';
import { Play, Square } from 'lucide-react';

interface CrawlControlProps {
    url: string;
    setUrl: (url: string) => void;
    isTracking: boolean;
    onStart: () => void;
    onStop: () => void;
    variant?: 'hero' | 'topbar';
    isLoading?: boolean;
}

export const CrawlControl: React.FC<CrawlControlProps> = ({
    url,
    setUrl,
    isTracking,
    onStart,
    onStop,
    variant = 'hero',
    isLoading = false,
}) => {
    const isHero = variant === 'hero';

    return (
        <div className={`flex flex-col gap-4 sm:flex-row sm:items-center ${isHero ? 'w-full' : 'w-auto'}`}>
            <div className="group relative flex-grow">
                {!isTracking && isHero && (
                    <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-[#FF0000] to-red-400 opacity-20 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200"></div>
                )}
                <div className="relative flex items-center">
                    <input
                        type="text"
                        placeholder="Paste YouTube Livestream URL here..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={isTracking || isLoading}
                        className={`relative flex w-full rounded-2xl border transition-all focus:outline-none dark:bg-[#0f0f0f]/80 dark:text-white ${isHero
                            ? 'h-14 border-gray-200 bg-white/80 px-6 py-4 text-base shadow-sm focus:border-[#FF0000] focus:ring-4 focus:ring-red-500/10 dark:border-[#333333]'
                            : 'h-10 border-gray-200 bg-white/50 px-4 py-2 text-sm focus:border-[#FF0000] dark:border-gray-800'
                            } ${isTracking ? 'cursor-not-allowed opacity-70' : ''}`}
                    />
                </div>
            </div>
            <button
                onClick={isTracking ? onStop : onStart}
                disabled={(!url && !isTracking) || isLoading}
                className={`group relative overflow-hidden rounded-2xl font-semibold text-white transition-all disabled:cursor-not-allowed disabled:grayscale disabled:opacity-50 sm:w-auto cursor-pointer ${isTracking
                    ? 'bg-gray-800 hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600'
                    : 'bg-[#FF0000] hover:bg-[#CC0000]'
                    } ${isHero ? 'h-14 px-8 text-base w-full' : 'h-10 px-6 text-sm'}`}
            >
                <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? 'Processing...' : (isTracking ? 'Stop Tracking' : 'Start Tracking')}
                    {isLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    ) : (
                        isTracking ? (
                            <Square size={isHero ? 20 : 16} fill="currentColor" />
                        ) : (
                            <Play size={isHero ? 20 : 16} fill="currentColor" />
                        )
                    )}
                </span>
            </button>
        </div>
    );
};
