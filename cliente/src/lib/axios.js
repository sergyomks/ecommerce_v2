import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  withCredentials: true,
});

axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const path = window.location.pathname || "";
    const scope = path.startsWith("/admin") ? "admin" : "store";
    config.headers = config.headers || {};
    config.headers["X-Auth-Scope"] = scope;
  }
  return config;
});
