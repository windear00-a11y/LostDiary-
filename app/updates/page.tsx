import { UpdatesSection } from '@/components/updates/updates-section';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';

export default function UpdatesPage() {
  return (
    <AppLayout>
      <div className="mb-8">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to App
        </Link>
      </div>
      <UpdatesSection />
    </AppLayout>
  );
}
