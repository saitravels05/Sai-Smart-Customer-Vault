import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sai_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const branchId = localStorage.getItem('sai_active_branch_id');
    if (branchId) {
      config.headers['X-Branch-Id'] = branchId;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error?.message || error.message || 'Network request failed';
    return Promise.reject(new Error(message));
  },
);
