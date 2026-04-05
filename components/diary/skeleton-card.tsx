import { motion } from 'motion/react';

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] border border-gray-100 dark:border-[#2E2E2E] shadow-sm overflow-hidden p-6 sm:p-8 space-y-4 relative">
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent animate-[shimmer_2s_infinite] pointer-events-none" />
      
      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-3 flex-1">
          {/* Date skeleton */}
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
          
          {/* Title/Summary skeleton */}
          <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          
          {/* Mood and reading time skeleton */}
          <div className="flex items-center gap-3 pt-1">
            <div className="h-4 w-4 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse ml-2" />
          </div>
        </div>
        
        {/* Menu button skeleton */}
        <div className="h-8 w-8 bg-gray-100 dark:bg-gray-800/50 rounded-full animate-pulse" />
      </div>
      
      {/* Content lines skeleton */}
      <div className="space-y-2 pt-2">
        <div className="h-3 w-full bg-gray-100 dark:bg-gray-800/30 rounded-full animate-pulse" />
        <div className="h-3 w-5/6 bg-gray-100 dark:bg-gray-800/30 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

export function DiarySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <SkeletonCard />
        </motion.div>
      ))}
    </div>
  );
}
