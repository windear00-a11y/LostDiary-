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
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold" }}>Dashboard</h1>

      <div style={{
        marginTop: 20,
        padding: 20,
        borderRadius: 12,
        background: "#f5f5f5"
      }}>
        <img
          src={user?.user_metadata?.avatar_url}
          alt="avatar"
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            marginBottom: 10
          }}
        />

        <p><b>Name:</b> {user?.user_metadata?.full_name}</p>
        <p><b>Email:</b> {user?.email}</p>
      </div>
    </div>
  );
}
