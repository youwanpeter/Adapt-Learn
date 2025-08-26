import React, { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
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

function App() {
  // Replace with real auth logic (e.g., read token/cookie)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  if (!isAuthenticated) {
    // Ensure your AuthPage accepts onAuth prop and calls it on success
    return <AuthPage onAuth={() => setIsAuthenticated(true)} />;
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="planner" element={<Planner />} />
          <Route path="community" element={<Community />} />
          <Route path="settings" element={<Settings />} />
          <Route path="summarizer" element={<Summarizer />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="upload" element={<Upload />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default App;
