'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { useLiveStream } from '@/hooks/useLiveStream';
import { CrawlControl } from '@/components/CrawlControl';
import { ToxicityChart } from '@/components/ToxicityChart';
import { ToxicLeaderboard } from '@/components/ToxicLeaderboard';
import { MessageList } from '@/components/MessageList';
import { youtubeService } from '@/services/youtubeService';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Custom Hook to manage all Live logic (Socket, Metrics, Messages, Leaderboard)
  const { messages, leaderboard, metrics, crawlerStatus } = useLiveStream(url, isTracking);
  const handleStart = async () => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setIsLoading(true);
      try {
        await youtubeService.startTracking(url);
        setIsTracking(true);
      } catch (error) {
        alert('Failed to start tracking. Please check the backend.');
      } finally {
        setIsLoading(false);
      }
    } else {
      alert('Please enter a valid YouTube Live URL');
    }
  };
  const handleStop = async () => {
    setIsLoading(true);
    try {
      await youtubeService.stopTracking(url, 'stop');
      setIsTracking(false);
    } catch (error) {
      console.error('Failed to stop tracking:', error);
      setIsTracking(false); // Force stop in UI even if API fails
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] transition-colors duration-500 overflow-x-hidden">
      {/* Background patterns */}
      <div className="fixed inset-0 pointer-events-none opacity-30 dark:opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]"></div>
      </div>

      <AnimatePresence mode="wait">
        {!isTracking ? (
          /* HERO LAYOUT */
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="relative flex flex-col items-center justify-center min-h-screen px-4 py-12"
          >
            <main className="z-10 w-full max-w-2xl text-center space-y-10">
              <div className="space-y-6">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-center gap-3"
                >
                  <div className="bg-[#FF0000] p-2.5 rounded-2xl shadow-xl shadow-red-500/20 rotate-3 transition-transform hover:rotate-0">
                    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z" />
                    </svg>
                  </div>
                  <div className="flex flex-col items-start translate-y-1 text-left">
                    <span className="text-[10px] font-black text-[#FF0000] uppercase tracking-widest px-2 py-0.5 bg-red-100 dark:bg-red-900/40 rounded-md">Realtime</span>
                    <span className="text-xs font-bold text-gray-400">Stream Guard v1.0</span>
                  </div>
                </motion.div>

                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-500 bg-clip-text text-5xl font-black tracking-tight text-transparent dark:from-white dark:via-gray-100 dark:to-gray-500 sm:text-7xl leading-[1.1]"
                >
                  Clean Your Stream <br /> <span className="text-[#FF0000]">In Seconds.</span>
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mx-auto max-w-[600px] text-lg text-gray-500 dark:text-gray-400 sm:text-xl font-medium"
                >
                  The ultimate AI-powered toxicity detection for YouTube Live creators. Keep your community safe and positive.
                </motion.p>
              </div>

              <motion.div
                layoutId="crawl-input-container"
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="w-full"
              >
                <CrawlControl
                  url={url}
                  setUrl={setUrl}
                  isTracking={isTracking}
                  isLoading={isLoading}
                  onStart={handleStart}
                  onStop={handleStop}
                  variant="hero"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap items-center justify-center gap-8 pt-8 grayscale hover:grayscale-0 transition-all duration-700"
              >
                <div className="flex items-center gap-2 text-sm font-bold">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse"></div>
                  FAST
                </div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></div>
                  SMART
                </div>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-600 animate-pulse"></div>
                  SECURE
                </div>
              </motion.div>
            </main>
          </motion.div>
        ) : (
          /* DASHBOARD LAYOUT */
          crawlerStatus !== null && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative flex flex-col min-h-screen"
            >
              {/* Top Navigation Bar */}
              <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-md dark:border-gray-800">
                <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 gap-4">
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="bg-[#FF0000] p-1.5 rounded-lg active:scale-95 transition-transform cursor-pointer">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z" />
                      </svg>
                    </div>
                    <h2 className="hidden text-base font-black tracking-tight dark:text-white lg:block uppercase">Stream Guard</h2>
                  </div>

                  <motion.div
                    layoutId="crawl-input-container"
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className="flex-grow max-w-xl text-center"
                  >
                    <CrawlControl
                      url={url}
                      setUrl={setUrl}
                      isTracking={isTracking}
                      isLoading={isLoading}
                      onStart={handleStart}
                      onStop={handleStop}
                      variant="topbar"
                    />
                  </motion.div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={`flex h-9 items-center gap-2 rounded-full border px-4 text-[10px] font-black uppercase transition-colors ${crawlerStatus === 'running'
                      ? 'border-green-100 bg-green-50 text-green-600 dark:border-green-900/30 dark:bg-green-900/20'
                      : crawlerStatus === 'stopped' || crawlerStatus === 'ended'
                        ? 'border-orange-100 bg-orange-50 text-orange-600 dark:border-orange-900/30 dark:bg-orange-900/20'
                        : 'border-red-100 bg-red-50 text-red-600 dark:border-red-900/30 dark:bg-red-900/20'
                      }`}>
                      <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${crawlerStatus === 'running' ? 'bg-green-600' : 'bg-red-600'
                        }`}></div>
                      {crawlerStatus || 'TRACKING'}
                    </div>
                  </div>
                </div>
              </header>

              {/* Main Content Area */}
              <main className="flex-grow p-6">
                <div className="mx-auto max-w-[1600px] space-y-6">
                  {/* Top Row: Chart & Leaderboard */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="lg:col-span-2 min-h-[300px]"
                    >
                      <ToxicityChart data={metrics} />
                    </motion.div>
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="min-h-[300px]"
                    >
                      <ToxicLeaderboard data={leaderboard} />
                    </motion.div>
                  </div>

                  {/* Bottom Row: Message List */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="min-h-[400px]"
                  >
                    <MessageList messages={messages} totalMessages={messages.length} />
                  </motion.div>
                </div>
              </main>
            </motion.div>
          )
        )}
      </AnimatePresence>

      {!isTracking && (
        <footer className="absolute bottom-8 w-full text-center text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em]">
          Designed for <span className="text-[#FF0000]">YouTube Live</span> Content Creators
        </footer>
      )}
    </div>
  );
}
