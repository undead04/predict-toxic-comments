'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Message } from '@/hooks/useLiveStream';

interface MessageListProps {
    messages: Message[];
    totalMessages: number;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, totalMessages }) => {
    return (
        <div className="flex h-full w-full flex-col rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-[#121212]">
            <div className="flex items-center justify-between border-b border-gray-50 p-5 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <MessageCircle className="h-5 w-5 text-gray-400" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Live Messages</h2>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-gray-50 dark:bg-white/5 px-4 py-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Messages</span>
                        <span className="text-sm font-black text-gray-900 dark:text-white">{totalMessages.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="flex-grow min-h-0 overflow-hidden">
                <div className="h-[500px] overflow-y-auto p-5 scroll-smooth custom-scrollbar">
                    {messages.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center text-gray-400">
                            <p className="text-sm font-medium">Listening for incoming chat...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {messages.map((msg) => {
                                const isToxic = msg.toxic_label === 'Toxic';
                                return (
                                    <div
                                        key={msg.comment_id}
                                        className={`relative flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all hover:shadow-md ${isToxic
                                            ? 'border-red-100 bg-red-50/20 dark:border-red-900/30 dark:bg-red-900/10'
                                            : 'border-transparent bg-gray-50 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4 flex-grow">
                                            <div className={`h-10 w-10 flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold ${isToxic ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                {msg.author_image ? (
                                                    <img src={msg.author_image} alt={msg.author_name} className="h-full w-full object-cover" />
                                                ) : (
                                                    msg.author_name.substring(0, 2).toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-200">
                                                        {msg.author_name}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(msg.published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {msg.message}
                                                </p>
                                            </div>
                                        </div>

                                        {isToxic && (
                                            <div className="flex-shrink-0">
                                                <span className="rounded-md bg-red-100 px-2 py-1 text-[10px] font-black text-red-600 dark:bg-red-500/20 dark:text-red-400 uppercase">
                                                    {msg.toxic_label}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
