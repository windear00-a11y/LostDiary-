'use client';
import { Menu } from 'lucide-react';

export const Header = ({ 
  toggleSidebar, 
  toggleMobileMenu 
}: { 
  toggleSidebar: () => void; 
  toggleMobileMenu: () => void; 
}) => (
  <header className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 justify-between bg-white dark:bg-[#1A1A1A]">
    <div className="flex items-center gap-4">
      <button onClick={toggleSidebar} className="hidden md:block p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
        <Menu className="w-6 h-6" />
      </button>
      <button onClick={toggleMobileMenu} className="md:hidden p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
        <Menu className="w-6 h-6" />
      </button>
      <h1 className="font-bold text-xl text-gray-900 dark:text-gray-100">WinDear</h1>
    </div>
  </header>
);
