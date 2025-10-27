// Align API base with backend (defaults to 4000 if not provided)
const resolveApiBase = () => {
  // Read from Vite env first
  const raw =
    (typeof import.meta !== "undefined" &&
      import.meta.env &&
      import.meta.env.VITE_API_URL &&
      String(import.meta.env.VITE_API_URL).trim()) ||
    "http://localhost:4000";

  // Remove trailing slashes for safety
  const base = raw.replace(/\/+$/, "");
  // Always ensure /api suffix is present once
  return /\/api$/.test(base) ? base : `${base}/api`;
};

const BASE_URL = resolveApiBase();

/**
 * Generic request helper using Fetch
 */
async function request(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include", // only needed if backend uses httpOnly cookies
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Throw custom errors for non-2xx responses
  if (!res.ok) {
    let errMsg = `Request failed: ${res.status}`;
    try {
      const err = await res.json();
      if (err.message) errMsg = err.message;
    } catch {
      /* ignore non-JSON errors */
    }
    throw new Error(errMsg);
  }

  // Return parsed JSON response
  return res.json();
}

/**
 * API Endpoints (same naming as backend routes)
 */
export const api = {
  register: (data) => request("/auth/register", { method: "POST", body: data }),
  login: (data) => request("/auth/login", { method: "POST", body: data }),
  me: (token) => request("/auth/me", { token }),
};

// Optional: quick debug
if (import.meta.env?.DEV) {
  console.log("✅ Using API base:", BASE_URL);
}
