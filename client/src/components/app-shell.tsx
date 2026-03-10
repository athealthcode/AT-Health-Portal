import { PropsWithChildren, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FileText,
  Coins,
  BarChart3,
  Files,
  Settings,
  LogOut,
  Building2,
  ChevronDown,
  BookOpen,
  Award,
  Shield,
  AlertTriangle,
  ShieldCheck,
  ClipboardList,
  Wallet,
  CheckSquare,
  Activity,
  BriefcaseMedical,
  Truck,
  HeartPulse
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/state/auth";
import { useOrg } from "@/state/org";
import logo from "@/assets/at-health-logo.png";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  testId: string;
  requiresRole?: (role: string | undefined) => boolean;
  moduleKey?: keyof ReturnType<typeof useOrg>['modules'];
};

export function AppShell({ children }: PropsWithChildren) {
  const [location] = useLocation();
  const { session, signOut, selectStaff } = useAuth();
  const { settings, modules } = useOrg();
  const [open, setOpen] = useState(false);

  const navItems: NavItem[] = useMemo(
    () => [
      { 
         href: "/control-centre", 
         label: "Control Centre", 
         icon: Activity, 
         testId: "link-nav-control-centre",
         requiresRole: (r) => r === "Head Office Admin" || r === "Super Admin",
      },
      { href: "/", label: "Dashboard", icon: LayoutDashboard, testId: "link-nav-dashboard" },
      { href: "/daily-figures", label: "Daily Figures", icon: FileText, testId: "link-nav-daily-figures" },
      { href: "/cashing-up", label: "Cashing Up", icon: Coins, testId: "link-nav-cashing-up" },
      { 
         href: "/bookkeeping", 
         label: "Bookkeeping", 
         icon: BookOpen, 
         testId: "link-nav-bookkeeping" 
      },
      {
         href: "/incidents",
         label: "Incidents",
         icon: BriefcaseMedical,
         testId: "link-nav-incidents",
      },
      {
        href: "/exceptions",
        label: "Exceptions",
        icon: AlertTriangle,
        testId: "link-nav-exceptions",
        requiresRole: (r) => r === "Head Office Admin" || r === "Super Admin",
      },
      {
        href: "/compliance",
        label: "Compliance",
        icon: ShieldCheck,
        testId: "link-nav-compliance",
      },
      {
        href: "/pqs",
        label: "PQS Tracker",
        icon: ClipboardList,
        testId: "link-nav-pqs",
      },
      {
        href: "/private-clinic",
        label: "Private Clinic",
        icon: HeartPulse,
        testId: "link-nav-private-clinic",
      },
      {
        href: "/stock-transfer",
        label: "Stock Transfers",
        icon: Truck,
        testId: "link-nav-stock-transfer",
      },
      {
        href: "/banking-reconciliation",
        label: "Banking Recon",
        icon: Wallet,
        testId: "link-nav-banking-recon",
        requiresRole: (r) => r === "Finance" || r === "Head Office Admin" || r === "Super Admin",
      },
      {
        href: "/monthly-close",
        label: "Monthly Close",
        icon: CheckSquare,
        testId: "link-nav-monthly-close",
        requiresRole: (r) => r === "Pharmacy Manager" || r === "Head Office Admin" || r === "Super Admin",
      },
      {
        href: "/reports",
        label: "Reports",
        icon: BarChart3,
        testId: "link-nav-reports",
        requiresRole: (r) => r === "Finance" || r === "Head Office Admin" || r === "Super Admin",
      },
      {
        href: "/bonus-performance",
        label: "Bonus & Performance",
        icon: Award,
        testId: "link-nav-bonus",
        requiresRole: (r) => r === "Head Office Admin" || r === "Super Admin",
      },
      {
        href: "/documents",
        label: "Documents & SOPs",
        icon: Files,
        testId: "link-nav-documents",
      },
      {
        href: "/access-overview",
        label: "Access Overview",
        icon: Shield,
        testId: "link-nav-access",
        requiresRole: (r) => r === "Head Office Admin" || r === "Super Admin",
      },
      {
        href: "/admin",
        label: "Platform Settings",
        icon: Settings,
        testId: "link-nav-admin",
        requiresRole: (r) => r === "Head Office Admin" || r === "Super Admin",
      },
      {
         href: "/onboarding",
         label: "Org Onboarding",
         icon: Building2,
         testId: "link-nav-onboarding",
         requiresRole: (r) => r === "Super Admin",
      }
    ],
    [],
  );

  const visibleNav = navItems.filter((n) => {
    if (n.requiresRole && !n.requiresRole(session.role)) return false;
    if (n.moduleKey && modules[n.moduleKey] === false) return false;
    return true;
  });

  const scopeLabel =
    session.scope.type === "pharmacy" ? session.scope.pharmacyName : "Head Office";

  const header = (
    <div className="flex flex-col gap-4">
      <div className="bg-primary/5 rounded-xl p-4 flex items-center justify-center">
         {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.name} className="h-10 w-auto object-contain" />
         ) : (
            <img src={logo} alt="AT Health" className="h-10 w-auto object-contain" />
         )}
      </div>

      <div className="px-1">
        <div className="font-medium text-sm text-foreground" data-testid="text-scope">{scopeLabel}</div>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="pill bg-background/50 text-[10px] h-5" data-testid="badge-role">
            {session.role ?? "Guest"}
          </Badge>
          {session.staff && (
             <Badge variant="outline" className="pill bg-background/50 text-[10px] h-5" data-testid="badge-staff">
                {session.staff.name}
             </Badge>
          )}
        </div>
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
                "group flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition font-medium",
                "hover:bg-primary/10 hover:text-primary",
                active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground",
              )}
              data-testid={item.testId}
            >
              <Icon className={cn("h-4 w-4", active ? "opacity-100" : "opacity-70 group-hover:opacity-100")} />
              <span>{item.label}</span>
              {active && !compact ? (
                <motion.span
                  layoutId="nav-active"
                  className="ml-auto h-2 w-2 rounded-full bg-white/20"
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
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <div className="surface rounded-2xl p-4 sticky top-6">
              {header}
              <Separator className="my-4" />
              <NavLinks />
              <Separator className="my-4" />
              <div className="space-y-1">
                 {session.staff && (
                    <button
                       className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-colors text-left"
                       onClick={() => selectStaff(null as any)}
                    >
                       <LogOut className="h-3.5 w-3.5" />
                       Log out of {session.staff.name.split(' ')[0]}
                    </button>
                 )}
                 <button
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-colors text-left"
                    data-testid="button-signout-shell"
                    onClick={() => signOut("branch")}
                 >
                    <LogOut className="h-3.5 w-3.5" />
                    Log out of Branch
                 </button>
              </div>
            </div>
          </aside>

          <div className="lg:hidden">
            <div className="surface rounded-2xl p-4">
              <div className="flex items-center justify-between">
                 {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt={settings.name} className="h-8 w-auto object-contain" />
                 ) : (
                    <img src={logo} alt="AT Health" className="h-8 w-auto object-contain" />
                 )}
                <Sheet open={open} onOpenChange={setOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="h-10" data-testid="button-open-nav">
                      Menu <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px]">
                    <div className="pt-6">
                      <div className="mb-6">{header}</div>
                      <NavLinks compact />
                      <Separator className="my-4" />
                      <div className="space-y-2">
                          {session.staff && (
                             <Button
                                variant="ghost"
                                className="w-full justify-start text-muted-foreground"
                                onClick={() => {
                                   selectStaff(null as any);
                                   setOpen(false);
                                }}
                             >
                                <LogOut className="h-4 w-4 mr-2" /> 
                                Log out User
                             </Button>
                          )}
                          <Button
                             variant="secondary"
                             className="w-full justify-start text-destructive hover:text-destructive"
                             onClick={() => {
                                signOut("branch");
                                setOpen(false);
                             }}
                          >
                             <LogOut className="h-4 w-4 mr-2" /> 
                             Log out Branch
                          </Button>
                      </div>
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
              className="surface rounded-2xl p-5 md:p-7 min-h-[calc(100vh-100px)]"
            >
              {children}
            </motion.div>

            <div className="mt-3 text-xs text-muted-foreground flex justify-between px-2" data-testid="text-footer">
              <div>
                 {session.scope.type === "pharmacy" ? session.scope.pharmacyName : "Head Office"}
                 <span className="mx-1">•</span>
                 Trusted Device Active
              </div>
              <div className="opacity-50">v0.5.2</div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
