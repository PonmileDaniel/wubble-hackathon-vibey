import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true
});

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if the error is due to an unauthorized request (expired token)
    if (error.response && error.response.status === 401) {
      // Clear any stored tokens
      localStorage.removeItem('creatorToken');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;