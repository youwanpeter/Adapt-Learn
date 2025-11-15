// Single source of truth for API calls

import axios from "axios";

/* ---------- API base resolver (adds /api exactly once) ---------- */
export const resolveApiBase = () => {
  const raw =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_URL &&
      String(import.meta.env.VITE_API_URL).trim()) ||
    "http://127.0.0.1:4000";
  const base = raw.replace(/\/+$/, "");
  return /\/api$/.test(base) ? base : `${base}/api`;
};

export const API_BASE = resolveApiBase();

// One axios instance used everywhere
export const http = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Attach bearer token automatically (reads latest from localStorage)
http.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
