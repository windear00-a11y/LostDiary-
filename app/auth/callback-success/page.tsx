'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingSpace } from '@/components/ui/LoadingSpace';

function CallbackSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/home';

  useEffect(() => {
    // Check if we are in a popup
    const isPopup = window.opener && window.opener !== window;

    if (isPopup) {
      // Notify the opener that auth is complete
      window.opener.postMessage({ type: 'AUTH_COMPLETE', next }, window.location.origin);
      // Close the popup
      window.close();
    } else {
      // If not in a popup, just redirect
      router.push(next);
    }
  }, [router, next]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfcfb] dark:bg-[var(--color-bg-dark)] p-6">
      <div className="text-center space-y-4">
        <LoadingSpace message="Completing login..." />
        <p className="text-xs text-gray-400 font-serif italic">You will be redirected shortly.</p>
      </div>
    </div>
  );
}

export default function CallbackSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fdfcfb] dark:bg-[var(--color-bg-dark)]">
        <LoadingSpace />
      </div>
    }>
      <CallbackSuccessContent />
    </Suspense>
  );
}
