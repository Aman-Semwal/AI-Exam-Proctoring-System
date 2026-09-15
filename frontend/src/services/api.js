import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// JWT automatically every request
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

// If token expires / unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // Only redirect to login when the backend explicitly signals an auth failure
    // (expired/invalid token). A 401 on /api/auth/* endpoints (wrong password, etc.)
    // should NOT trigger a logout redirect — those are handled by the page itself.
    if (status === 401) {
      const requestUrl = error.config?.url || "";
      const isAuthEndpoint = requestUrl.startsWith("/auth");

      if (!isAuthEndpoint) {
        // Token is invalid or expired — clear session and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login?reason=session_expired";
      }
    }

    // For 500 errors, attach a readable message so pages can display it
    // without crashing. Do NOT log out on 500 — it's a server-side bug, not
    // a session problem.
    if (status === 500) {
      const serverMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "An unexpected server error occurred. Please try again.";
      error.userMessage = serverMessage;
    }

    return Promise.reject(error);
  }
);

export default api;
