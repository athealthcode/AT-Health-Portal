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
  CheckSquare,
  Activity,
  BriefcaseMedical,
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
  roles?: string[];
  icon: React.ComponentType<{ className?: string }>;
  testId: string;
  requiresRole?: (role: string | undefined) => boolean;
  moduleKey?: keyof ReturnType<typeof useOrg>['modules'];
  section?: string;
};

export function AppShell({ children }: PropsWithChildren) {
  const [location] = useLocation();
  const { session, signOut, selectStaff } = useAuth();
  const { settings, modules } = useOrg();
  const [open, setOpen] = useState(false);
  const isHO = session.scope?.type === "headoffice";
  const isManager = session.staff?.role === "Pharmacy Manager";
  const isManagerOrHO = isHO || isManager;

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
         testId: "link-nav-bookkeeping",
         roles: ["manager", "headoffice"],
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
        href: "/private-clinic",
        label: "Private Clinic",
        icon: HeartPulse,
        testId: "link-nav-private-clinic",
        roles: ["manager", "headoffice"],
      },
      {
        href: "/monthly-close",
        label: "Monthly Close",
        icon: CheckSquare,
        testId: "link-nav-monthly-close",
      },
      {
        href: "/reports",
        label: "Reports",
        icon: BarChart3,
        testId: "link-nav-reports",
        roles: ["headoffice"],
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
        href: "/access-overview",
        label: "Access Overview",
        icon: Shield,
        testId: "link-nav-access",
        roles: ["headoffice"],
        requiresRole: (r) => r === "Head Office Admin" || r === "Super Admin",
      },
      {
        href: "/admin",
        label: "Platform Settings",
        icon: Settings,
        testId: "link-nav-admin",
        roles: ["headoffice"],
        requiresRole: (r) => r === "Head Office Admin" || r === "Super Admin",
      },
    ],
    [session, modules]
  );
  const sectionMap: Record<string, string> = {
    "/control-centre": "Head Office",
    "/": "Operations",
    "/daily-figures": "Operations",
    "/cashing-up": "Banking",
    "/bookkeeping": "Banking",
    "/incidents": "Compliance",
    "/exceptions": "Compliance",
    "/compliance": "Compliance",
    "/private-clinic": "Operations",
    "/monthly-close": "Banking",
    "/reports": "Reports",
    "/bonus-performance": "Bonus",
    "/access-overview": "Settings",
    "/admin": "Settings",
  };
  const groupedNav = navItems.reduce((acc: Record<string, NavItem[]>, item) => {
    const section = item.section || sectionMap[item.href] || "Other";
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);
  // Filter nav items by role
  const filteredGroupedNav = Object.fromEntries(
    Object.entries(filteredGroupedNav)
      .map(([section, items]) => [
        section,
        items.filter(item => !item.roles ||
          (isHO && item.roles.includes("headoffice")) ||
          (isManagerOrHO && item.roles.includes("manager"))
        ),
      ])
      .filter(([_, items]) => (items as NavItem[]).length > 0)
  ) as Record<string, NavItem[]>;


  function NavLinks({ compact = false }: { compact?: boolean }) {
    const sectionOrder = ["Head Office", "Operations", "Banking", "Bonus", "Compliance", "Reports", "Documents", "Settings", "Other"];

    return (
      <div className={cn("flex flex-col gap-4", compact ? "" : "mt-2")}> 
        {sectionOrder.map(section => {
           if (!filteredGroupedNav[section] || filteredGroupedNav[section].length === 0) return null;
           
           return (
              <div key={section} className="space-y-1">
                 {section !== "Other" && section !== "Head Office" && (
                    <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                       {section}
                    </div>
                 )}
                 <nav className="grid gap-0.5">
                    {filteredGroupedNav[section].map((item) => {
                      const active = location === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "group flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors font-medium",
                            "hover:bg-primary/10 hover:text-primary",
                            active ? "bg-primary/10 text-primary" : "text-muted-foreground",
                          )}
                          data-testid={item.testId}
                        >
                          <Icon className={cn("h-4 w-4", active ? "opacity-100" : "opacity-70 group-hover:opacity-100")} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                 </nav>
              </div>
           )
        })}
      </div>
    );
  }

  const header = (
    <div className="flex items-center gap-3 px-2 py-1">
      <img src={logo} alt="AT Health" className="h-8 w-auto" />
    </div>
  );

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
                       onClick={() => signOut("user")}
                    >
                       <LogOut className="h-3.5 w-3.5" />
                       Log out of {session.staff.name.split(' ')[0]}
                    </button>
                 )}
                 <button
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-colors text-left"
                    data-testid="button-signout-shell"
                    onClick={() => signOut("full")}
                 >
                    <LogOut className="h-3.5 w-3.5" />
                    Log out completely
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
