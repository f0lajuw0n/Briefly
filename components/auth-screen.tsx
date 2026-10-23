"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { ClienteseLogo } from "@/components/clientese-logo";

type Mode = "sign-in" | "sign-up" | "forgot-password" | "reset-password";
const copy: Record<Mode, { title: string; description: string; action: string }> = {
  "sign-in": { title: "Welcome back", description: "Sign in to return to your workplan.", action: "Sign in" },
  "sign-up": { title: "Create your account", description: "Start turning feedback into a clear plan.", action: "Create account" },
  "forgot-password": { title: "Reset your password", description: "Enter your email and we’ll send a reset link.", action: "Send reset link" },
  "reset-password": { title: "Choose a new password", description: "Set a new password for your CLIENTESE account.", action: "Update password" },
};

export function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
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
    if (mode === "sign-up" && !fullName.trim()) { setError("Enter your name to create an account."); return; }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Sign-in is not configured yet. You can still try the workspace."); return; }
    setLoading(true);
    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.push("/workspace");
      } else if (mode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName.trim() }, emailRedirectTo: `${window.location.origin}/auth/confirm` } });
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

  async function signUpWithGoogle() {
    setError(""); setMessage("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Authentication is not configured yet. You can still try the workspace."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/workspace` },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-up could not start. Please try again.");
      setLoading(false);
    }
  }

  const alternate = mode === "sign-in"
    ? <>New to CLIENTESE? <Link href="/sign-up">Create an account</Link></>
    : mode === "sign-up"
      ? <>Already have an account? <Link href="/sign-in">Sign in</Link></>
      : <Link href="/sign-in">Back to sign in</Link>;

  return <div className="auth-page"><header className="auth-header"><Link className="site-brand" href="/" aria-label="CLIENTESE home"><ClienteseLogo className="site-logo" /> <span className="brand-wordmark">CLIENTESE</span></Link></header>
    <main className="auth-main"><section className="auth-card" aria-labelledby="auth-title"><div className="auth-intro"><ClienteseLogo className="auth-symbol" aria-hidden="true" /><h1 id="auth-title">{config.title}</h1><p>{config.description}</p><p className="auth-switch">{alternate}</p></div>
      <form onSubmit={submit}><FieldGroup>
        {mode === "sign-up" && <><Button type="button" variant="outline" size="lg" className="auth-google-button" disabled={loading} onClick={signUpWithGoogle}><GoogleIcon />Sign up with Google</Button><div className="auth-or-divider" aria-hidden="true"><span>or sign up with email</span></div></>}
        {mode === "sign-up" && <Field><FieldLabel htmlFor="auth-name">Full name</FieldLabel><Input id="auth-name" type="text" autoComplete="name" placeholder="Your name" required value={fullName} onChange={(event) => setFullName(event.target.value)} /></Field>}
        {mode !== "reset-password" && <Field><FieldLabel htmlFor="auth-email">Email address</FieldLabel><Input id="auth-email" type="email" autoComplete="email" placeholder="you@example.com" required value={email} onChange={(event) => setEmail(event.target.value)} /></Field>}
        {mode !== "forgot-password" && <Field><FieldLabel htmlFor="auth-password">Password</FieldLabel><div className="auth-password"><Input id="auth-password" type={showPassword ? "text" : "password"} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={mode === "sign-in" ? undefined : 6} required value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>{mode === "sign-in" && <Link className="auth-forgot-password" href="/forgot-password">Forgot password?</Link>}{mode === "sign-up" && <span className="auth-hint">At least 6 characters.</span>}</Field>}
        {error && <p className="auth-error" role="alert">{error}</p>}{message && <p className="auth-success" role="status">{message}</p>}
        <Button type="submit" size="lg" disabled={loading}>{loading ? "Please wait…" : config.action}</Button>
      </FieldGroup></form>
      {mode === "sign-up" && <p className="auth-card-note">Your feedback and brief are used to create the workplan you review. Nothing is sent to your client automatically.</p>}
      </section>
      {(mode === "sign-in" || mode === "sign-up") && <p className="auth-guest">Want to explore first? <Link href="/workspace">Open the workspace</Link></p>}
    </main></div>;
}

function GoogleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.5a4.7 4.7 0 0 1-2 3.1v2.4h3.2c1.9-1.8 3.1-4.3 3.1-7.2Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.5l-3.2-2.4c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3H2.9v2.5A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.2 13.7A6 6 0 0 1 5.9 12c0-.6.1-1.2.3-1.7V7.8H2.9A10 10 0 0 0 2 12c0 1.6.4 3.1.9 4.2l3.3-2.5Z"/><path fill="#EA4335" d="M12 6c1.5 0 2.9.5 3.9 1.5l2.9-2.9A10 10 0 0 0 2.9 7.8l3.3 2.5C7 7.8 9.3 6 12 6Z"/></svg>;
}
