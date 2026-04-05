"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        // 👉 yaha apna actual auth code laga sakte ho
        const res = await fetch("/api/user"); // agar API hai
        const data = await res.json();

        console.log("USER DATA:", data);

        setUser(data);
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
      <p>Name: {user?.name || "Guest"}</p>
      <p>Email: {user?.email || "No Email"}</p>

      {/* DEBUG */}
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}
