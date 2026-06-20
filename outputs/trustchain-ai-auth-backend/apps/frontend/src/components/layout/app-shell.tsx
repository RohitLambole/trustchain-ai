"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Bell, Blocks, Gauge, LayoutDashboard, LogOut, Moon, Shield, Smartphone, UserCog, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/devices", label: "Devices", icon: Smartphone },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/audit", label: "Audit", icon: Blocks },
  { href: "/analyst", label: "Analyst", icon: Activity, roles: ["SECURITY_ANALYST", "FRAUD_ANALYST", "SOC_MANAGER", "SUPER_ADMIN"] },
  { href: "/admin", label: "Admin", icon: UserCog, roles: ["PRIVILEGED_ADMIN", "SUPER_ADMIN"] }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const visibleNav = nav.filter((item) => !item.roles || item.roles.some((role) => user?.roles.includes(role)));

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r bg-card lg:block">
        <div className="flex h-16 items-center gap-3 border-b px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">TrustChain AI</div>
            <div className="text-xs text-muted-foreground">Identity Trust Ops</div>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground", pathname === item.href && "bg-muted text-foreground")}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3">
            <Gauge className="h-5 w-5 text-primary" />
            <div>
              <div className="text-sm font-medium">Continuous Trust Dashboard</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => document.documentElement.classList.toggle("dark")}>
              <Moon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
