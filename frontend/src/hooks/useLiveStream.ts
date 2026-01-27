import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { CONFIG } from '@/config';
import { youtubeService } from '@/services/youtubeService';

export interface Message {
    _id?: string;
    comment_id: string;
    video_id: string;
    author_id: string;
    author_name: string;
    author_image: string;
    message: string;
    published_at: string;
    toxic_label: string;
    toxic_category: string;
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
    toxic_count: number;
    unique_viewers: number;
}

interface State {
    messages: Message[];
    leaderboard: LeaderboardUser[];
    metrics: MetricData[];
    crawlerStatus: string | null;
}

type Action =
    | { type: 'SET_INITIAL_COMMENTS'; payload: Message[] }
    | { type: 'ADD_NEW_COMMENTS'; payload: Message[] }
    | { type: 'SET_LEADERBOARD'; payload: LeaderboardUser[] }
    | { type: 'SET_INITIAL_METRICS'; payload: MetricData[] }
    | { type: 'UPDATE_METRICS'; payload: MetricData }
    | { type: 'SET_CRAWLER_STATUS'; payload: string | null }
    | { type: 'RESET_STATE' };

const initialState: State = {
    messages: [],
    leaderboard: [],
    metrics: [],
    crawlerStatus: null,
};

function liveStreamReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'SET_INITIAL_COMMENTS':
            return { ...state, messages: action.payload };
        case 'ADD_NEW_COMMENTS':
            return {
                ...state,
                messages: [...action.payload, ...state.messages].slice(0, CONFIG.MAX_MESSAGES_CACHE)
            };
        case 'SET_LEADERBOARD':
            return { ...state, leaderboard: action.payload };
        case 'SET_INITIAL_METRICS':
            return { ...state, metrics: action.payload };
        case 'UPDATE_METRICS': {
            const metric = action.payload;
            const dataMap = new Map(state.metrics.map(item => [item.window_start, item]));
            dataMap.set(metric.window_start, metric);

            const updatedMetrics = Array.from(dataMap.values())
                .sort((a, b) => new Date(a.window_start).getTime() - new Date(b.window_start).getTime())
                .slice(-CONFIG.CHART_POINTS_LIMIT);

            return { ...state, metrics: updatedMetrics };
        }
        case 'SET_CRAWLER_STATUS':
            return { ...state, crawlerStatus: action.payload };
        case 'RESET_STATE':
            return initialState;
        default:
            return state;
    }
}

export const useLiveStream = (url: string, isTracking: boolean) => {
    const [state, dispatch] = useReducer(liveStreamReducer, initialState);

    // Extract video ID from YouTube URL
    const extractVideoId = useCallback((url: string) => {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    }, []);

    const videoId = useMemo(() => extractVideoId(url), [url, extractVideoId]);

    useEffect(() => {
        if (!isTracking) {
            dispatch({ type: 'RESET_STATE' });
            return;
        }

        if (!videoId) return;

        // --- Khởi tạo SSE Connection ---
        const eventSource = youtubeService.sseStreamEvents(videoId);

        eventSource.onopen = () => {
            console.log('SSE connected to video:', videoId);
        };

        // Comments ban đầu
        eventSource.addEventListener('initial_comments', (event: any) => {
            const comments = JSON.parse(event.data);
            const formatted: Message[] = comments.map((c: any) => ({
                comment_id: c.comment_id,
                video_id: c.video_id,
                author_id: c.author_id,
                author_name: c.author_name,
                author_image: c.author_image,
                message: c.message,
                published_at: c.published_at,
                toxic_label: c.toxic_label,
                toxic_category: c.toxic_category,
                recommended_action: c.recommended_action,
            }));
            dispatch({ type: 'SET_INITIAL_COMMENTS', payload: formatted });
        });

        // Comment mới (batched)
        eventSource.addEventListener('new_comments', (event: any) => {
            const comments: Message[] = JSON.parse(event.data);
            dispatch({ type: 'ADD_NEW_COMMENTS', payload: comments });
        });

        // Leaderboard
        eventSource.addEventListener('leaderboard:update', (event: any) => {
            const data: LeaderboardUser[] = JSON.parse(event.data);
            dispatch({ type: 'SET_LEADERBOARD', payload: data });
        });

        // Metrics ban đầu
        eventSource.addEventListener('initial_metrics', (event: any) => {
            const data: any[] = JSON.parse(event.data);
            const formatted: MetricData[] = data.map((m: any) => ({
                video_id: m.video_id,
                window_start: m.window_start,
                total_comments: m.total_comments,
                toxic_count: m.toxic_count || 0,
                unique_viewers: m.unique_viewers || 0
            }));
            dispatch({ type: 'SET_INITIAL_METRICS', payload: formatted });
        });

        // Metrics update
        eventSource.addEventListener('metric_update', (event: any) => {
            const metric: any = JSON.parse(event.data);
            const formatted: MetricData = {
                video_id: metric.video_id,
                window_start: metric.window_start,
                total_comments: metric.total_comments,
                toxic_count: metric.toxic_count || 0,
                unique_viewers: metric.unique_viewers || 0
            };
            dispatch({ type: 'UPDATE_METRICS', payload: formatted });
        });

        // Trạng thái crawler
        eventSource.addEventListener('crawler_status', (event: any) => {
            const data: { type: string } = JSON.parse(event.data);
            console.log('Crawler status update:', data.type);
            dispatch({ type: 'SET_CRAWLER_STATUS', payload: data.type });
            if (data.type === 'stopped') {
                eventSource.close();
            }
        });

        eventSource.onerror = (error) => {
            console.error('SSE Error:', error);
        };

        return () => {
            console.log('Closing SSE connection');
            eventSource.close();
        };
    }, [isTracking, videoId]);

    return {
        ...state,
        videoId
    };
};
