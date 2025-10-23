import React, { useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// ✅ use relative paths so it works without an alias
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Planner from "./pages/Planner";
import Community from "./pages/Community";
import Settings from "./pages/Settings";
import Summarizer from "./pages/Summarizer";
import Reminders from "./pages/Reminders";
import Upload from "./pages/Upload";
import AuthPage from "./pages/AuthPage"; // make sure this file exists

function PrivateRoute({ children }) {
  const token = localStorage.getItem("accessToken");
  return token ? children : <Navigate to="/auth" replace />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("accessToken")
  );
  const location = useLocation();

  // Keep state in sync if token is added/removed elsewhere (e.g., another tab)
  useEffect(() => {
    const sync = () =>
      setIsAuthenticated(!!localStorage.getItem("accessToken"));
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  // Optionally, re-check on mount/route change
  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("accessToken"));
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public route for auth */}
        <Route
          path="/auth"
          element={
            <AuthPage
              // When AuthPage succeeds (after login/signup), mark authed
              onAuth={() => setIsAuthenticated(true)}
            />
          }
        />

        {/* Protected app shell */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* Dashboard as index */}
          <Route index element={<Dashboard />} />
          {/* Alias: /dashboard also goes to Dashboard */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="planner" element={<Planner />} />
          <Route path="community" element={<Community />} />
          <Route path="settings" element={<Settings />} />
          <Route path="summarizer" element={<Summarizer />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="upload" element={<Upload />} />
        </Route>

        {/* Fallback: unknown paths → if authed go home, else to auth */}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
