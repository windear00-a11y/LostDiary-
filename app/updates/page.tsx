import { UpdatesSection } from '@/components/updates/updates-section';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UpdatesPage() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] dark:bg-[#111111] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-4">
        <Link 
          href="/app" 
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </Link>
      </div>
      <UpdatesSection />
    </main>
  );
}
