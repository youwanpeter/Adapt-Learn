import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  BookOpen,
  Calendar,
  Bot,
  FileText,
  Bell,
  Settings,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";

const navItems = [
  { to: "/", icon: Home, label: "Dashboard" },

  { to: "/planner", icon: Calendar, label: "Planner" },
  { to: "/summarizer", icon: FileText, label: "Summarizer" },
];

const Sidebar = () => {
  return (
    <aside className="w-20 bg-background/50 border-r border-white/10 p-4 flex flex-col justify-between items-center transition-all duration-300">
      <div>
        <div className="flex items-center justify-center gap-2 mb-10 w-full">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <Bot className="h-10 w-10 text-primary" />
          </motion.div>
        </div>
        <TooltipProvider>
          <nav className="flex flex-col gap-3 w-full items-center">
            {navItems.map((item) => (
              <Tooltip key={item.to} delayDuration={0}>
                <TooltipTrigger asChild>
                  <NavLink
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-4 p-3 rounded-lg w-12 h-12 justify-center transition-colors duration-200 ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </nav>
        </TooltipProvider>
      </div>

      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-4 p-3 rounded-lg w-12 h-12 justify-center transition-colors duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`
              }
            >
              <Settings className="h-5 w-5" />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Settings</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </aside>
  );
};

export default Sidebar;
