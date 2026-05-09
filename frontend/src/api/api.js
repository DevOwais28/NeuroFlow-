import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || "Something went wrong";
    console.error("API Error:", message);
    return Promise.reject(error);
  }
);

// Auth APIs - backend controlled auth
export const authAPI = {
  signup: (data) => api.post("/auth/signup", data),
  verifyToken: (idToken) => api.post("/auth/verify-token", { id_token: idToken }),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  getUser: (uid) => api.get(`/auth/me/${uid}`),
  getFirebaseConfig: () => api.get("/auth/firebase-config"),
};

// Health check
export const healthAPI = {
  check: () => api.get("/health"),
};

export default api;
