"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

const supabase = createClient();

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) throw error;

        console.log("REAL USER:", data);

        setUser(data.user);
      } catch (err) {
        console.error("ERROR:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // ✅ loading safe
  if (loading) {
    return <p style={{ padding: 20 }}>Loading dashboard...</p>;
  }

  // ❌ agar user null hai to crash mat hone do
  if (!user) {
    return <p style={{ padding: 20 }}>No user data found</p>;
  }

  // ✅ SAFE render
  return (
    <div style={{ padding: 20 }}>
      <h1>Dashboard</h1>
      <p>Name: {user?.user_metadata?.name || "No Name"}</p>
      <p>Email: {user?.email || "No Email"}</p>

      {/* DEBUG */}
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}
