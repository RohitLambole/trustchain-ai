"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

export function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    if (user && roles?.length && !roles.some((role) => user.roles.includes(role))) router.replace("/dashboard");
  }, [pathname, roles, router, user]);

  if (!user) return null;
  if (roles?.length && !roles.some((role) => user.roles.includes(role))) return null;
  return <>{children}</>;
}
