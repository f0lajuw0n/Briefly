import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { ClienteseLogo } from "@/components/clientese-logo";
import { DemoRequestForm } from "@/components/demo-request-form";

export default function RequestDemoPage() {
  const configuredEmail = process.env.DEMO_REQUEST_EMAIL?.trim() ?? "";
  const recipient = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail) ? configuredEmail : "";

  return (
    <div className="site-page demo-page">
      <header className="auth-header">
        <Link className="site-brand" href="/" aria-label="CLIENTESE home"><ClienteseLogo className="site-logo" /><span className="brand-wordmark">CLIENTESE</span></Link>
        <Link className="auth-back" href="/"><ArrowLeft size={16} /> Back to home</Link>
      </header>
      <main className="demo-main">
        <div className="demo-intro">
          <span className="demo-eyebrow"><span /> A closer look at CLIENTESE</span>
          <h1>See how feedback becomes a clearer plan.</h1>
          <p>Tell us a little about your work and what you’d like to see. We’ll use it to make the conversation relevant to you.</p>
          <div className="demo-details">
            <p><Check aria-hidden="true" /> See how CLIENTESE turns feedback into tasks</p>
            <p><Check aria-hidden="true" /> Explore questions, scope notes, and client replies</p>
            <p><Check aria-hidden="true" /> Ask about your own workflow</p>
          </div>
          <div className="demo-context"><ClienteseLogo /><p>Made for the work behind the work.<span>For independent designers and small studios.</span></p></div>
        </div>
        <section className="demo-card" aria-labelledby="demo-form-title">
          <div className="demo-card-heading"><h2 id="demo-form-title">Request a demo</h2><p>Share your details to prepare an email request.</p></div>
          <DemoRequestForm recipient={recipient} />
        </section>
      </main>
    </div>
  );
}
