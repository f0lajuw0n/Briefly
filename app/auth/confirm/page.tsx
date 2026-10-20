"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { BrieflyLogo } from "@/components/briefly-logo";

export default function ConfirmEmail() {
  const [status, setStatus] = useState("Confirming your email…");
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) { setStatus("Authentication is not configured. Please return to sign in."); return; }
    client.auth.getSession().then(({ data, error }) => {
      setStatus(!error && data.session ? "Your email is confirmed. You can open the workspace." : "This confirmation link is invalid or has expired. Please sign in or request a new link.");
    }).catch(() => setStatus("Could not confirm your email. Please try again."));
  }, []);
  return <div className="auth-page"><header className="auth-header"><Link className="site-brand" href="/"><BrieflyLogo className="site-logo" /> <span>Briefly</span></Link></header><main className="auth-main"><section className="auth-card auth-confirm-links" aria-labelledby="confirm-title"><div className="auth-intro"><span className="auth-symbol" aria-hidden="true">B</span><h1 id="confirm-title">Almost there</h1><p role="status">{status}</p></div><Link href="/workspace" className="site-button site-button-dark">Open workspace</Link><Link href="/sign-in">Back to sign in</Link></section></main></div>;
}
