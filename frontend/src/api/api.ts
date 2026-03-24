import axios from "axios";

// 1. Port ko 3000 se badal kar 5000 karein kyunki aapka server 5000 par hai
const API_URL = "/api"; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Cookies aur Auth tokens ke liye zaroori hai
});

// Request Interceptor (Token add karne ke liye)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;