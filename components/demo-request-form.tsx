"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function DemoRequestForm({ recipient }: { recipient: string }) {
  const [draftOpened, setDraftOpened] = useState(false);

  function prepareEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recipient) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const team = String(data.get("team") ?? "").trim();
    const interest = String(data.get("interest") ?? "").trim();
    const body = [
      "Hello Briefly team,",
      "",
      "I’d like to request a demo of Briefly.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      ...(team ? [`Studio or company: ${team}`] : []),
      ...(interest ? [`What I’d like to see: ${interest}`] : []),
    ].join("\n");
    window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent("Briefly demo request")}&body=${encodeURIComponent(body)}`;
    setDraftOpened(true);
  }

  return (
    <form onSubmit={prepareEmail}>
      <FieldGroup>
        <Field><FieldLabel htmlFor="demo-name">Name</FieldLabel><Input id="demo-name" name="name" autoComplete="name" placeholder="Your name" maxLength={100} required /></Field>
        <Field><FieldLabel htmlFor="demo-email">Email address</FieldLabel><Input id="demo-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required /></Field>
        <Field><FieldLabel htmlFor="demo-team">Studio or company <span className="demo-optional">Optional</span></FieldLabel><Input id="demo-team" name="team" autoComplete="organization" placeholder="Where you work" maxLength={100} /></Field>
        <Field><FieldLabel htmlFor="demo-interest">What would you like to see? <span className="demo-optional">Optional</span></FieldLabel><Input id="demo-interest" name="interest" placeholder="Tell us about your workflow" maxLength={300} /><FieldDescription>A few words about your feedback process or questions.</FieldDescription></Field>
        <Button type="submit" size="lg" disabled={!recipient}>Prepare demo request <ArrowUpRight data-icon="inline-end" /></Button>
        {!recipient && <p className="demo-message" role="status">Demo requests are temporarily unavailable. Please check back soon.</p>}
        {recipient && <p className="demo-message" role="status">{draftOpened ? "Your email app should open with a draft. Please send it to complete your request." : "This opens a draft in your email app. You’ll review and send it there."}</p>}
      </FieldGroup>
    </form>
  );
}
