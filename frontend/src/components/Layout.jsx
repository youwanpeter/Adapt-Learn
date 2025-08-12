import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Toaster } from "@/components/ui/toaster";
import { motion } from 'framer-motion';

const Layout = () => {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <motion.div 
            className="absolute inset-0 z-0 aurora-bg"
            animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
                duration: 40,
                ease: "linear",
                repeat: Infinity,
            }}
        />
        <div className="relative z-10 flex flex-col h-full">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
              <Outlet />
            </main>
        </div>
      </div>
       <Toaster />
    </div>
  );
};

export default Layout;