import axios from 'axios';
import { CONFIG } from '@/config';

export const apiClient = axios.create({
    baseURL: CONFIG.API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Bạn có thể thêm interceptors ở đây nếu cần xử lý lỗi chung hoặc thêm token
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);
