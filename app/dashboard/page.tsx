"use client";

import dynamic from "next/dynamic";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDiaryActions } from "@/features/diary/use-diary-actions";
import { WeeklyInsight } from "@/components/insights/WeeklyInsight";
import { useUIStore } from "@/lib/store/use-ui-store";
import { FAB } from "@/components/ui/FAB";
import { BottomSheet } from "@/components/ui/BottomSheet";

const DiaryInputModal = dynamic(() => import("@/features/diary/DiaryInputModal").then(mod => ({ default: mod.DiaryInputModal })), { ssr: false });
const DiaryList = dynamic(() => import("@/features/diary/DiaryList").then(mod => ({ default: mod.DiaryList })), { ssr: false });
const InsightsPanel = dynamic(() => import("@/components/insights/InsightsPanel").then(mod => ({ default: mod.InsightsPanel })), { ssr: false });

export default function DashboardPage() {
  const {
    loading,
    isBottomSheetOpen,
    setBottomSheetOpen,
    handleCreate,
    handleUpdate,
    handleDelete,
  } = useDiaryActions();

  const isInsightsOpen = useUIStore((state) => state.isInsightsOpen);
  const setInsightsOpen = useUIStore((state) => state.setInsightsOpen);

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8 relative min-h-[calc(100vh-120px)]">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Timeline</h1>
          <p className="text-gray-500 text-sm">Your journey, one thought at a time.</p>
        </div>

        <WeeklyInsight />

        <div className="space-y-8">
          <BottomSheet isOpen={isBottomSheetOpen} onClose={() => setBottomSheetOpen(false)}>
            <DiaryInputModal 
              handleCreate={handleCreate}
              handleUpdate={handleUpdate}
            />
          </BottomSheet>

          <BottomSheet isOpen={isInsightsOpen} onClose={() => setInsightsOpen(false)}>
            <InsightsPanel />
          </BottomSheet>
          
          <DiaryList 
            isLoadingEntries={loading}
            deleteEntry={handleDelete}
          />
        </div>

        <FAB onClick={() => setBottomSheetOpen(true)} />
      </div>
    </AppLayout>
  );
}
