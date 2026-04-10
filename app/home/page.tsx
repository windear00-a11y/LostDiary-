'use client';

import { ChatInterface } from "@/features/home/ChatInterface";
import { Header } from "@/components/ui/Header";
import { motion } from 'motion/react';

export default function AssistantPage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="min-h-screen bg-[#fdfcfb] dark:bg-[#0d0d0d] transition-colors duration-700"
    >
      <Header />
      <main className="h-[calc(100vh-4rem)] flex flex-col">
        <ChatInterface />
      </main>
    </motion.div>
  );
}
