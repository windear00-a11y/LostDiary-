import { LoadingSpace } from '@/components/ui/LoadingSpace';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-dark)]">
      <LoadingSpace />
    </div>
  );
}
