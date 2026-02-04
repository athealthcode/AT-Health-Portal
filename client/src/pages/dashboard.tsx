import { useMemo } from "react";
import { TrendingUp, TrendingDown, Clock, AlertTriangle, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/state/auth";

type KPI = {
  id: string;
  label: string;
  value: string;
  sub: string;
  delta: string;
  trend: "up" | "down" | "flat";
};

export default function Dashboard() {
  const { session } = useAuth();

  const scopeLabel = session.scope.type === "pharmacy" ? session.scope.pharmacyName : "All pharmacies";

  const kpis: KPI[] = useMemo(
    () => [
      { id: "items", label: "Dispensed Items", value: "8,420", sub: "Month to Date", delta: "+2.1% vs target", trend: "up" },
      { id: "services", label: "Services Total", value: "312", sub: "Month to Date", delta: "-5 vs target", trend: "down" },
      { id: "cash", label: "Gross Takings", value: "£14,240", sub: "Month to Date", delta: "On track", trend: "up" },
    ],
    [],
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-serif text-2xl tracking-tight" data-testid="text-dashboard-title">Dashboard</div>
            <div className="text-sm text-muted-foreground" data-testid="text-dashboard-scope">
              {scopeLabel} • {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="pill" data-testid="badge-trading-day">
              <Clock className="h-3.5 w-3.5 mr-1.5" /> Month-to-Date View
            </Badge>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.trend === "up" ? TrendingUp : k.trend === "down" ? TrendingDown : Clock;
            return (
              <Card key={k.id} className="rounded-2xl border bg-card/60 p-4" data-testid={`card-kpi-${k.id}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground" data-testid={`text-kpi-label-${k.id}`}>{k.label}</div>
                    <div className="mt-2 text-2xl font-semibold tracking-tight" data-testid={`text-kpi-value-${k.id}`}>{k.value}</div>
                    <div className="mt-1 text-xs text-muted-foreground" data-testid={`text-kpi-sub-${k.id}`}>{k.sub}</div>
                  </div>
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary grid place-items-center" data-testid={`icon-kpi-${k.id}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground" data-testid={`text-kpi-delta-${k.id}`}>{k.delta}</div>
              </Card>
            );
          })}
          
          {/* Nominations KPI */}
          <Card className="rounded-2xl border bg-card/60 p-4">
            <div className="flex items-start justify-between">
               <div>
                  <div className="text-sm text-muted-foreground">Nominations</div>
                  <div className="mt-2 text-2xl font-semibold tracking-tight">4,120</div>
                  <div className="mt-1 text-xs text-muted-foreground">Active Total</div>
               </div>
               <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
                  <FileText className="h-5 w-5" />
               </div>
            </div>
            <div className="mt-3 text-xs text-emerald-600 font-medium flex items-center gap-1">
               <TrendingUp className="h-3 w-3" /> +12 this week
            </div>
          </Card>
        </div>

        <Separator />

        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-actions">
            <div className="text-sm font-semibold" data-testid="text-actions-title">Quick actions</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button className="h-11" data-testid="button-go-daily-figures" onClick={() => (window.location.href = "/daily-figures")}>Daily Figures</Button>
              <Button variant="secondary" className="h-11" data-testid="button-go-cashing-up" onClick={() => (window.location.href = "/cashing-up")}>Cashing Up</Button>
              <Button variant="outline" className="h-11" data-testid="button-go-documents" onClick={() => (window.location.href = "/documents")}>Documents</Button>
              <Button variant="outline" className="h-11" data-testid="button-go-reports" onClick={() => (window.location.href = "/reports")}>Reports</Button>
            </div>
          </Card>

          <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-compliance">
            <div className="text-sm font-semibold" data-testid="text-compliance-title">Compliance snapshot</div>
            <div className="mt-3 grid gap-2">
              <div className="flex items-center justify-between rounded-xl border bg-background/40 px-3 py-3" data-testid="row-compliance-late">
                <div>
                  <div className="text-sm font-medium" data-testid="text-compliance-late-title">Late Submissions</div>
                  <div className="text-xs text-muted-foreground" data-testid="text-compliance-late-sub">Last 7 days</div>
                </div>
                <Badge variant="secondary" className="pill" data-testid="badge-compliance-late">0</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
