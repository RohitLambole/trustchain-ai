"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await authApi.requestPasswordReset(email);
    setMessage(response.message ?? "If the account exists, reset instructions were issued.");
  }

  return (
    <AuthCard title="Reset password" description="Request a secure account recovery flow.">
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <Button className="w-full">Send reset instructions</Button>
        <Link className="block text-center text-sm text-muted-foreground" href="/login">Back to sign in</Link>
      </form>
    </AuthCard>
  );
}
