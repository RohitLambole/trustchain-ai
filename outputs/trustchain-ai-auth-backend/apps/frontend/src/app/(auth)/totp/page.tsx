"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

export default function TotpPage() {
  const router = useRouter();
  const email = useAuthStore((state) => state.pendingEmail);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email) return router.replace("/login");
    try {
      const response = await authApi.login(email, password, code);
      if (response.user) {
        setAuth(response.user, response);
        router.push("/dashboard");
      }
    } catch {
      setError("The verification code could not be accepted.");
    }
  }

  return (
    <AuthCard title="TOTP verification" description="Enter the six-digit Google Authenticator code.">
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
        <div className="space-y-2"><Label>Code</Label><Input inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)} /></div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button className="w-full">Verify</Button>
      </form>
    </AuthCard>
  );
}
