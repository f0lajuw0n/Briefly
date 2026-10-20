"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function AccountStatus() {
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    client.auth.getSession().then(({ data }) => setEmail(data.session?.user.email ?? null)).catch(() => setError("Could not check account status."));
    const { data } = client.auth.onAuthStateChange((_event, session) => setEmail(session?.user.email ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  async function signOut() {
    const result = await getSupabaseBrowserClient()?.auth.signOut();
    if (result?.error) setError("Could not sign out. Please try again.");
    else { setEmail(null); setError(""); }
  }
  return <div className="account-status">{email ? <><span title={email}>{email}</span><button type="button" onClick={signOut}>Sign out</button></> : <Link href="/sign-in" target="_blank" rel="noopener noreferrer">Sign in (opens a new tab)</Link>}{error && <span role="alert">{error}</span>}</div>;
}
