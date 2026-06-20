"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const setTotpRequired = useAuthStore((state) => state.setTotpRequired);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await authApi.login(email, password);
      if (response.requiresTotp) {
        setTotpRequired(email);
        router.push("/totp");
        return;
      }
      if (response.user) {
        setAuth(response.user, response);
        router.push(params.get("next") ?? "/dashboard");
      }
    } catch {
      setError("Unable to sign in with those credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Sign in" description="Use your TrustChain AI account to continue.">
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button className="w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
        <div className="flex justify-between text-sm text-muted-foreground">
          <Link href="/forgot-password">Forgot password</Link>
          <Link href="/register">Create account</Link>
        </div>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
