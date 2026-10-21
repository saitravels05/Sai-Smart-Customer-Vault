import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
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
    const data = error.response?.data;
    const message = data?.error?.message || data?.message || error.message || 'Network request failed';
    const customError: any = new Error(message);
    customError.response = error.response;
    customError.data = data;
    customError.status = error.response?.status;
    customError.code = data?.error?.code;
    customError.isNotRegistered =
      data?.isNotRegistered ||
      data?.error?.code === 'EMAIL_NOT_REGISTERED' ||
      error.response?.status === 404;
    return Promise.reject(customError);
  },
);
