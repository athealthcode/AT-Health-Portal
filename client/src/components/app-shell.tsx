import { PropsWithChildren, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FileText,
  Coins,
  BarChart3,
  Files,
  Shield,
  LogOut,
  Building2,
  ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/state/auth";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  testId: string;
  requiresRole?: (role: string | undefined) => boolean;
};

export function AppShell({ children }: PropsWithChildren) {
  const [location] = useLocation();
  const { session, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const navItems: NavItem[] = useMemo(
    () => [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, testId: "link-nav-dashboard" },
      { href: "/daily-figures", label: "Daily Figures", icon: FileText, testId: "link-nav-daily-figures" },
      { href: "/cashing-up", label: "Cashing Up", icon: Coins, testId: "link-nav-cashing-up" },
      {
        href: "/reports",
        label: "Reports",
        icon: BarChart3,
        testId: "link-nav-reports",
        requiresRole: (r) => r === "Finance" || r === "Head Office Admin" || r === "Super Admin",
      },
      {
        href: "/documents",
        label: "Documents",
        icon: Files,
        testId: "link-nav-documents",
      },
      {
        href: "/admin",
        label: "Admin",
        icon: Shield,
        testId: "link-nav-admin",
        requiresRole: (r) => r === "Head Office Admin" || r === "Super Admin",
      },
    ],
    [],
  );

  const visibleNav = navItems.filter((n) => (n.requiresRole ? n.requiresRole(session.role) : true));

  const scopeLabel =
    session.scope.type === "pharmacy" ? session.scope.pharmacyName : "Head Office";

  const header = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-md">
          <span className="font-mono text-sm">AT</span>
        </div>
        <div className="leading-tight">
          <div className="font-serif text-xl tracking-tight" data-testid="text-app-title">AT Health Portal</div>
          <div className="text-xs text-muted-foreground" data-testid="text-scope">{scopeLabel}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="pill" data-testid="badge-role">
          <Building2 className="h-3.5 w-3.5 mr-1.5" />
          {session.role ?? "—"}
        </Badge>
        <Badge variant="outline" className="pill" data-testid="badge-staff">
          {session.staff ? session.staff.name : "Staff: not set"}
        </Badge>
      </div>
    </div>
  );

  function NavLinks({ compact }: { compact?: boolean }) {
    return (
      <nav className={cn("grid gap-1", compact ? "" : "mt-3")}> 
        {visibleNav.map((item) => {
          const active = location === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "group flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                "hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                active ? "bg-sidebar-accent text-sidebar-foreground" : "text-sidebar-foreground/80",
              )}
              data-testid={item.testId}
            >
              <Icon className={cn("h-4 w-4", active ? "opacity-100" : "opacity-70 group-hover:opacity-100")} />
              <span className="font-medium">{item.label}</span>
              {active ? (
                <motion.span
                  layoutId="nav-active"
                  className="ml-auto h-2 w-2 rounded-full bg-sidebar-primary"
                />
              ) : null}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="min-h-dvh app-bg relative">
      <div className="noise-overlay" />

      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-8">
        <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
          <aside className="hidden lg:block">
            <div className="surface rounded-2xl p-4">
              {header}
              <Separator className="my-4" />
              <NavLinks />
              <Separator className="my-4" />
              <div className="flex items-center justify-between text-xs text-sidebar-foreground/70">
                <div data-testid="text-security-chip">Trusted device • IP allowlist • MFA</div>
                <button
                  className="inline-flex items-center gap-1 text-sidebar-foreground/80 hover:text-sidebar-foreground transition"
                  data-testid="button-signout-shell"
                  onClick={signOut}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          </aside>

          <div className="lg:hidden">
            <div className="surface rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">{header}</div>
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="h-10" data-testid="button-open-nav">
                      Menu <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[340px] bg-sidebar text-sidebar-foreground">
                    <div className="pt-3">
                      <NavLinks compact />
                      <Separator className="my-4 bg-sidebar-border" />
                      <Button
                        variant="secondary"
                        className="w-full"
                        data-testid="button-signout-mobile"
                        onClick={() => {
                          signOut();
                          setOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" /> Sign out
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>

          <main>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              className="surface rounded-2xl p-5 md:p-7"
            >
              {children}
            </motion.div>

            <div className="mt-3 text-xs text-muted-foreground" data-testid="text-footer">
              Actions are attributed to: <span className="font-medium">{session.staff?.name ?? "—"}</span>
              {session.staff?.role ? (
                <span className=""> ({session.staff.role})</span>
              ) : null}
              <span className=""> • </span>
              {session.scope.type === "pharmacy" ? session.scope.pharmacyName : "Head Office"}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
