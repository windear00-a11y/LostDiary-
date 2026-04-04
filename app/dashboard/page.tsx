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

type User = {
  name: string;
};

export default function Dashboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
    loadUser();
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

  async function loadUser() {
    try {
      const res = await fetch("/api/user");
      const data = await res.json();

      console.log("USER DATA:", data);

      if (!data) {
        throw new Error("User not found");
      }

      setUser(data);
    } catch (err: any) {
      console.log("Dashboard error:", err.message);
      setError(err.message);
    }
  }

  if (error) {
    return (
      <div className="p-4">
        <div style={{ color: "red" }}>Error: {error}</div>
      </div>
    );
  }

  if (!user) {
    return <div className="p-4">Loading user...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome {user.name}</h1>
      
      <AIUsageDashboard />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Recent Entries</h2>
        {entries.map((entry) => (
          <div key={entry.id} className="mb-2 p-2 border rounded">
            <p>{entry.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
