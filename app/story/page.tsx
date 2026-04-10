'use client';

import { BookView } from "@/features/story/BookView";
import { motion } from 'motion/react';

export default function BookPage() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="min-h-screen bg-[#fdfcfb] dark:bg-[#0d0d0d] transition-colors duration-700"
    >
      <main className="max-w-4xl mx-auto">
        <BookView />
      </main>
    </motion.div>
  );
}
