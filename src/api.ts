import axios from "axios";

// Since frontend and backend run on the same Origin/Port (Express proxies Vite on port 3000),
// we use relative routing for transparent, robust local API mapping.
const API_BASE = "/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically inject JWT token into requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept 401s to redirect or log out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear credentials on unauthorized/token expiration
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      // Optionally trigger reload/redirect
    }
    return Promise.reject(error);
  }
);

export default api;
