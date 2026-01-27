import { apiClient } from './apiClient';
import { CONFIG } from '@/config';

export const youtubeService = {
    startTracking: async (videoUrl: string) => {
        const response = await apiClient.post('/youtube/live-chat', { url: videoUrl });
        return response.data;
    },

    stopTracking: async (videoUrl: string, action: string) => {
        const response = await apiClient.post('/youtube/stop-crawler', { url: videoUrl, action: action });
        return response.data;
    },
    sseStreamEvents: (videoId: string) => {
        return new EventSource(`${CONFIG.API_URL}/api/youtube/events/${videoId}`);
    },
};
