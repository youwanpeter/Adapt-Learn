import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App"; // was "@/App"
import "./index.css"; // was "@/index.css"
import { TooltipProvider } from "./components/ui/tooltip"; // was "@/components/ui/tooltip"
import { Toaster } from "./components/ui/toaster"; // was "@/components/ui/toaster"
import { HelmetProvider } from "react-helmet-async";

// If you actually have this file, keep it with a relative path.
// If you’re not using Supabase, remove the provider entirely.

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <HelmetProvider>
        <TooltipProvider>
          <App />
          <Toaster />
        </TooltipProvider>
      </HelmetProvider>
    </BrowserRouter>
  </React.StrictMode>
);
