"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { DiaryList } from "@/components/diary/DiaryList";
import { DiaryInput } from "@/components/diary/DiaryInput";
import { Milestones } from "@/components/diary/Milestones";
import { AppLayout } from "@/components/layout/AppLayout";

const supabase = createClient();

export default function DashboardPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('entries')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEntries(data || []);
      } catch (err) {
        console.error("ERROR:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>;
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        <Milestones entries={entries} />
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <DiaryList entries={entries} />
          </div>
          <div>
            <DiaryInput onEntryAdded={() => window.location.reload()} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
