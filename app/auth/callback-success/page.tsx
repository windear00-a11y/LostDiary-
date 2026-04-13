'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfcfb] dark:bg-[#0d0d0d] p-6">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
        <h2 className="text-xl font-serif italic">Completing login...</h2>
        <p className="text-sm text-gray-500">You will be redirected shortly.</p>
      </div>
    </div>
  );
}

export default function CallbackSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fdfcfb] dark:bg-[#0d0d0d]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    }>
      <CallbackSuccessContent />
    </Suspense>
  );
}
