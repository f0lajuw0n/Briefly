"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { BrieflyLogo } from "@/components/briefly-logo";

type Mode = "sign-in" | "sign-up" | "forgot-password" | "reset-password";
const copy: Record<Mode, { title: string; description: string; action: string }> = {
  "sign-in": { title: "Welcome back", description: "Sign in to return to your workplan.", action: "Sign in" },
  "sign-up": { title: "Create your account", description: "Start turning feedback into a clear plan.", action: "Create account" },
  "forgot-password": { title: "Reset your password", description: "Enter your email and we’ll send a reset link.", action: "Send reset link" },
  "reset-password": { title: "Choose a new password", description: "Set a new password for your Briefly account.", action: "Update password" },
};

export function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const config = copy[mode];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Sign-in is not configured yet. You can still try the workspace."); return; }
    setLoading(true);
    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.push("/workspace");
      } else if (mode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/auth/confirm` } });
        if (error) throw error;
        if (data.session) router.push("/workspace");
        else setMessage("Check your email for a confirmation link, then sign in.");
      } else if (mode === "forgot-password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setMessage("If an account exists for this email, a reset link is on its way.");
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage("Your password has been updated. You can now open the workspace.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  }

  const alternate = mode === "sign-in"
    ? <>New to Briefly? <Link href="/sign-up">Create an account</Link></>
    : mode === "sign-up"
      ? <>Already have an account? <Link href="/sign-in">Sign in</Link></>
      : <Link href="/sign-in">Back to sign in</Link>;

  return <div className="auth-page"><header className="auth-header"><Link className="site-brand" href="/"><BrieflyLogo className="site-logo" /> <span>Briefly</span></Link></header>
    <main className="auth-main"><section className="auth-card" aria-labelledby="auth-title"><div className="auth-intro"><span className="auth-symbol" aria-hidden="true">B</span><h1 id="auth-title">{config.title}</h1><p>{config.description}</p><p className="auth-switch">{alternate}</p></div>
      <form onSubmit={submit}><FieldGroup>
        {mode !== "reset-password" && <Field><FieldLabel htmlFor="auth-email">Email address</FieldLabel><Input id="auth-email" type="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={(event) => setEmail(event.target.value)} /></Field>}
        {mode !== "forgot-password" && <Field><div className="auth-label-row"><FieldLabel htmlFor="auth-password">Password</FieldLabel>{mode === "sign-in" && <Link href="/forgot-password">Forgot password?</Link>}</div><div className="auth-password"><Input id="auth-password" type={showPassword ? "text" : "password"} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={mode === "sign-in" ? undefined : 6} required value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>{mode === "sign-up" && <span className="auth-hint">At least 6 characters.</span>}</Field>}
        {error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-success" role="status">{message}</p>}
        <Button type="submit" size="lg" disabled={loading}>{loading ? "Please wait…" : config.action}</Button>
      </FieldGroup></form>
      {mode === "sign-up" && <p className="auth-card-note">Your feedback and brief are used to create the workplan you review. Nothing is sent to your client automatically.</p>}
      </section>
      {(mode === "sign-in" || mode === "sign-up") && <p className="auth-guest">Want to explore first? <Link href="/workspace">Open the workspace</Link></p>}
    </main></div>;
}
