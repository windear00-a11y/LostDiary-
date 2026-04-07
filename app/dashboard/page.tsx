"use client";

import dynamic from "next/dynamic";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDiaryActions } from "@/features/diary/use-diary-actions";
import { RetentionWidget } from "@/components/retention/RetentionWidget";

const DiaryInput = dynamic(() => import("@/features/diary/DiaryInput").then(mod => ({ default: mod.DiaryInput })), { ssr: false });
const DiaryList = dynamic(() => import("@/features/diary/DiaryList").then(mod => ({ default: mod.DiaryList })), { ssr: false });
const BottomSheet = dynamic(() => import("@/components/ui/bottom-sheet").then(mod => ({ default: mod.BottomSheet })), { ssr: false });

export default function DashboardPage() {
  const {
    loading,
    isBottomSheetOpen,
    setBottomSheetOpen,
    handleCreate,
    handleUpdate,
    handleDelete,
  } = useDiaryActions();

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>

          <div className="space-y-8">
            <BottomSheet isOpen={isBottomSheetOpen} onClose={() => setBottomSheetOpen(false)}>
              <DiaryInput 
                handleCreate={handleCreate}
                handleUpdate={handleUpdate}
              />
            </BottomSheet>
            
            <DiaryList 
              isLoadingEntries={loading}
              deleteEntry={handleDelete}
            />
          </div>
        </div>

        <div className="space-y-8">
          <RetentionWidget />
        </div>
      </div>
    </AppLayout>
  );
}
