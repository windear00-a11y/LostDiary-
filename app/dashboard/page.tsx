"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase";

const supabase = createClient();

const AIUsageDashboard = dynamic(
  () => import("@/components/diary/AIUsageDashboard"),
  { ssr: false }
);

type Entry = {
  id: string;
  content: string;
  created_at: string;
};

export default function Dashboard() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from("entries")
      .select("id, content, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) console.error(error);

    setEntries(data || []);
  };

  return (
    <div>
      <h1>Dashboard</h1>

      <AIUsageDashboard />

      <div>
        {entries.map((entry) => (
          <div key={entry.id}>
            <p>{entry.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
