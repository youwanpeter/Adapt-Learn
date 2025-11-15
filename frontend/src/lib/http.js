// src/lib/http.js
import axios from "axios";

/* Resolve API base and ensure it ends with /api exactly once */
const resolveApiBase = () => {
  const raw =
    (import.meta.env?.VITE_API_URL &&
      String(import.meta.env.VITE_API_URL).trim()) ||
    "http://127.0.0.1:4000";
  const base = raw.replace(/\/+$/, "");
  return /\/api$/.test(base) ? base : `${base}/api`;
};

export const API_BASE = resolveApiBase();

export const http = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { Accept: "application/json" },
});

// Attach token for every request (pulled fresh each time)
http.interceptors.request.use((cfg) => {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
