import axios from "axios";

const API_BASE = "/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: inject Authorization header on every request
api.interceptors.request.use(
  (config) => {
    // Retrieve token from localStorage; if missing, use the mock token used in the backend
    const storedToken = localStorage.getItem("token");
    const token = storedToken || "mock-jwt-token-admin";
    console.log("[API] Sending request with token:", token);
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
    }
    return Promise.reject(error);
  }
);

export default api;
