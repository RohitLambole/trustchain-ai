"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { authApi } from "@/lib/api/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    await authApi.register({ email, phone, password, roleNames: [role] });
    setMessage("Account created. You can sign in now.");
    setTimeout(() => router.push("/login"), 700);
  }

  return (
    <AuthCard title="Create account" description="Register a customer, analyst, or admin identity.">
      <form className="space-y-4" onSubmit={submit}>
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
        <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(event) => setPhone(event.target.value)} /></div>
        <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="CUSTOMER">Customer</option>
            <option value="SECURITY_ANALYST">Security Analyst</option>
            <option value="PRIVILEGED_ADMIN">Admin</option>
          </Select>
        </div>
        {message ? <p className="text-sm text-emerald-500">{message}</p> : null}
        <Button className="w-full">Register</Button>
        <Link className="block text-center text-sm text-muted-foreground" href="/login">Back to sign in</Link>
      </form>
    </AuthCard>
  );
}
