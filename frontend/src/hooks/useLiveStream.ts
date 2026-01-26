import { useState, useEffect, useCallback } from 'react';
import { CONFIG } from '@/config';
import { youtubeService } from '@/services/youtubeService';

export interface Message {
    comment_id: string;
    video_id: string;
    author_id: string;
    author_name: string;
    author_image: string;
    message: string;
    published_at: string;
    toxic_label: string;
    recommended_action: string;
}

export interface LeaderboardUser {
    author_id: string;
    author_name: string;
    author_image: string;
    toxic_count: number;
}

export interface MetricData {
    video_id: string;
    window_start: string;
    total_comments: number;
    toxic_comments: number;
    toxic_rate: number;
    unique_users: number;
}

export const useLiveStream = (url: string, isTracking: boolean) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [metrics, setMetrics] = useState<MetricData[]>([]);
    const [crawlerStatus, setCrawlerStatus] = useState<string | null>(null);

    // Extract video ID from YouTube URL
    const extractVideoId = useCallback((url: string) => {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    }, []);

    useEffect(() => {
        if (!isTracking) {
            setMessages([]);
            setLeaderboard([]);
            setMetrics([]);
            setCrawlerStatus(null);
            return;
        }

        const videoId = extractVideoId(url);
        if (!videoId) return;

        // --- Khởi tạo SSE Connection ---
        const eventSource = youtubeService.sseStreamEvents(videoId);

        eventSource.onopen = () => {
            console.log('SSE connected to video:', videoId);
        };

        // Comments ban đầu
        eventSource.addEventListener('initial_comments', (event: any) => {
            const comments = JSON.parse(event.data);
            const formatted: Message[] = comments.map((c: Message) => ({
                comment_id: c.comment_id,
                video_id: c.video_id,
                author_id: c.author_id,
                author_name: c.author_name,
                author_image: c.author_image,
                message: c.message,
                published_at: c.published_at,
                toxic_label: c.toxic_label,
                recommended_action: c.recommended_action,
            }));
            setMessages(formatted);
        });

        // Comment mới
        eventSource.addEventListener('new_comment', (event: any) => {
            const comment: Message = JSON.parse(event.data);
            const formatted: Message = {
                comment_id: comment.comment_id,
                video_id: comment.video_id,
                author_id: comment.author_id,
                author_name: comment.author_name,
                author_image: comment.author_image,
                message: comment.message,
                published_at: comment.published_at,
                toxic_label: comment.toxic_label,
                recommended_action: comment.recommended_action,
            };
            setMessages(prev => [formatted, ...prev].slice(0, CONFIG.MAX_MESSAGES_CACHE));
        });

        // Leaderboard
        eventSource.addEventListener('leaderboard:update', (event: any) => {
            const data: LeaderboardUser[] = JSON.parse(event.data);
            setLeaderboard(data);
        });

        // Metrics ban đầu
        eventSource.addEventListener('initial_metrics', (event: any) => {
            const data: MetricData[] = JSON.parse(event.data);
            const formatted: MetricData[] = data.map((m: MetricData) => ({
                video_id: m.video_id,
                window_start: m.window_start,
                total_comments: m.total_comments,
                toxic_comments: m.toxic_comments,
                toxic_rate: m.toxic_rate,
                unique_users: m.unique_users
            }));
            setMetrics(formatted);
        });

        // Metrics update
        eventSource.addEventListener('metric_update', (event: any) => {
            const metric: MetricData = JSON.parse(event.data);
            const formatted: MetricData = {
                video_id: metric.video_id,
                window_start: metric.window_start,
                total_comments: metric.total_comments,
                toxic_comments: metric.toxic_comments,
                toxic_rate: metric.toxic_rate,
                unique_users: metric.unique_users
            };
            setMetrics(prev => [...prev, formatted].slice(-CONFIG.CHART_POINTS_LIMIT));
        });

        // Trạng thái crawler
        eventSource.addEventListener('crawler_status', (event: any) => {
            const data: { type: string } = JSON.parse(event.data);
            console.log('Crawler status update:', data.type);
            setCrawlerStatus(data.type);
        });

        eventSource.onerror = (error) => {
            console.error('SSE Error:', error);
            eventSource.close();
        };

        return () => {
            console.log('Closing SSE connection');
            eventSource.close();
        };
    }, [isTracking, url, extractVideoId]);

    return {
        messages,
        leaderboard,
        metrics,
        crawlerStatus,
        videoId: extractVideoId(url)
    };
};
