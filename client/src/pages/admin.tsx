import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Pharmacy = {
  id: string;
  name: string;
  openingHours: string;
  ipAllowlist: string[];
};

export default function Admin() {
  const { toast } = useToast();

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>(() => [
    { id: "bowland", name: "Bowland Pharmacy", openingHours: "Mon–Fri 09:00–18:00; Sat 09:00–13:00", ipAllowlist: ["81.100.10.0/24"] },
    { id: "denton", name: "Denton Pharmacy", openingHours: "Mon–Fri 09:00–18:00", ipAllowlist: ["81.100.11.0/24"] },
    { id: "wilmslow", name: "Wilmslow Pharmacy", openingHours: "Mon–Fri 09:00–18:00; Sat 10:00–14:00", ipAllowlist: ["81.100.12.0/24"] },
  ]);

  const [users, setUsers] = useState(() => [
    { id: "u1", email: "helen.carter@athealth.co.uk", role: "Head Office Admin", scope: "Head Office" },
    { id: "u2", email: "finance@athealth.co.uk", role: "Finance", scope: "Head Office" },
    { id: "u3", email: "sarah.ahmed@athealth.co.uk", role: "Pharmacy Manager", scope: "Bowland" },
  ]);

  const [pins, setPins] = useState(() => [
    { id: "p1", staff: "Sarah Ahmed", role: "Pharmacy Manager", pin: "••••" },
    { id: "p2", staff: "James Miller", role: "Pharmacy Login", pin: "••••" },
  ]);

  const [targets, setTargets] = useState(() => [
    { id: "t1", kpi: "Dispensed items", bowland: 1200, denton: 900, wilmslow: 980 },
    { id: "t2", kpi: "Services total", bowland: 70, denton: 55, wilmslow: 60 },
  ]);

  const [notifications, setNotifications] = useState(() => [
    { id: "n1", name: "Late submission", channels: "Email + Teams", enabled: true },
    { id: "n2", name: "PIN lockout", channels: "Email + Teams", enabled: true },
    { id: "n3", name: "Variance flagged", channels: "Email + Teams", enabled: true },
  ]);

  const [auditFilter, setAuditFilter] = useState("");

  const audits = useMemo(
    () => [
      { id: "a1", ts: "2026-01-29 18:01", actor: "Sarah Ahmed", action: "Submitted Daily Figures", scope: "Bowland", ref: "DF-2026-01-29" },
      { id: "a2", ts: "2026-01-29 18:12", actor: "Finance Team", action: "Generated Report", scope: "All", ref: "RPT-2026-01" },
      { id: "a3", ts: "2026-01-29 18:20", actor: "Helen Carter", action: "Updated IP allowlist", scope: "Wilmslow", ref: "IP-CHG-014" },
    ],
    [],
  );

  const filteredAudits = audits.filter((a) =>
    JSON.stringify(a).toLowerCase().includes(auditFilter.trim().toLowerCase()),
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div>
          <div className="font-serif text-2xl tracking-tight" data-testid="text-admin-title">Admin</div>
          <div className="text-sm text-muted-foreground" data-testid="text-admin-subtitle">
            Manage pharmacies, opening hours (trading days), IP allowlists, users/roles, staff PINs, KPI targets,
            audit logs, and notifications.
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-pharmacies">
            <div className="text-sm font-semibold" data-testid="text-pharmacies-title">Pharmacies</div>
            <div className="mt-3 grid gap-3">
              {pharmacies.map((p) => (
                <div key={p.id} className="rounded-xl border bg-background/40 p-4" data-testid={`card-pharmacy-${p.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium" data-testid={`text-pharmacy-name-${p.id}`}>{p.name}</div>
                      <div className="text-xs text-muted-foreground" data-testid={`text-pharmacy-hours-${p.id}`}>{p.openingHours}</div>
                    </div>
                    <Badge variant="secondary" className="pill" data-testid={`badge-pharmacy-${p.id}`}>Trading days</Badge>
                  </div>

                  <Separator className="my-3" />

                  <div className="text-xs font-semibold text-muted-foreground" data-testid={`text-allowlist-${p.id}`}>IP allowlist</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.ipAllowlist.map((cidr, idx) => (
                      <Badge key={idx} variant="outline" className="pill" data-testid={`badge-ip-${p.id}-${idx}`}>{cidr}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-users">
            <div className="text-sm font-semibold" data-testid="text-users-title">Users & roles</div>
            <div className="mt-3 overflow-hidden rounded-xl border bg-background/40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                      <TableCell data-testid={`text-user-email-${u.id}`}>{u.email}</TableCell>
                      <TableCell data-testid={`text-user-role-${u.id}`}>{u.role}</TableCell>
                      <TableCell data-testid={`text-user-scope-${u.id}`}>{u.scope}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`button-edit-user-${u.id}`}
                          onClick={() => toast({ title: "Edit user (prototype)", description: "Invite-only + role assignment." })}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-pins">
            <div className="text-sm font-semibold" data-testid="text-pins-title">Staff PINs</div>
            <div className="mt-3 overflow-hidden rounded-xl border bg-background/40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>PIN</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pins.map((p) => (
                    <TableRow key={p.id} data-testid={`row-pin-${p.id}`}>
                      <TableCell data-testid={`text-pin-staff-${p.id}`}>{p.staff}</TableCell>
                      <TableCell data-testid={`text-pin-role-${p.id}`}>{p.role}</TableCell>
                      <TableCell data-testid={`text-pin-masked-${p.id}`}>{p.pin}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`button-reset-pin-${p.id}`}
                          onClick={() => toast({ title: "Reset PIN (prototype)", description: "PIN policies enforced server-side." })}
                        >
                          Reset
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-targets">
            <div className="text-sm font-semibold" data-testid="text-targets-title">KPI targets</div>
            <div className="mt-3 overflow-hidden rounded-xl border bg-background/40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>KPI</TableHead>
                    <TableHead>Bowland</TableHead>
                    <TableHead>Denton</TableHead>
                    <TableHead>Wilmslow</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targets.map((t) => (
                    <TableRow key={t.id} data-testid={`row-target-${t.id}`}>
                      <TableCell data-testid={`text-target-kpi-${t.id}`}>{t.kpi}</TableCell>
                      <TableCell data-testid={`text-target-bowland-${t.id}`}>{t.bowland}</TableCell>
                      <TableCell data-testid={`text-target-denton-${t.id}`}>{t.denton}</TableCell>
                      <TableCell data-testid={`text-target-wilmslow-${t.id}`}>{t.wilmslow}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-notifications">
            <div className="text-sm font-semibold" data-testid="text-notifications-title">Notifications</div>
            <div className="mt-3 grid gap-3">
              {notifications.map((n) => (
                <div key={n.id} className="rounded-xl border bg-background/40 p-4" data-testid={`row-notification-${n.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium" data-testid={`text-notification-name-${n.id}`}>{n.name}</div>
                    <Badge variant={n.enabled ? "secondary" : "outline"} className="pill" data-testid={`badge-notification-enabled-${n.id}`}>
                      {n.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground" data-testid={`text-notification-channels-${n.id}`}>{n.channels}</div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`button-toggle-notification-${n.id}`}
                      onClick={() =>
                        setNotifications((s) => s.map((x) => (x.id === n.id ? { ...x, enabled: !x.enabled } : x)))
                      }
                    >
                      Toggle
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      data-testid={`button-edit-hook-${n.id}`}
                      onClick={() => toast({ title: "Edit hooks (prototype)", description: "Email/Teams integration is server-side." })}
                    >
                      Edit hooks
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="rounded-2xl border bg-card/60 p-5 lg:col-span-2" data-testid="card-audit">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm font-semibold" data-testid="text-audit-title">Audit logs</div>
              <div className="flex items-center gap-2">
                <Label className="text-xs" data-testid="label-audit-search">Search</Label>
                <Input
                  className="h-10 w-[260px]"
                  value={auditFilter}
                  onChange={(e) => setAuditFilter(e.target.value)}
                  placeholder="staff, action, reference..."
                  data-testid="input-audit-search"
                />
              </div>
            </div>
            <Separator className="my-4" />

            <div className="overflow-hidden rounded-xl border bg-background/40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAudits.map((a) => (
                    <TableRow key={a.id} data-testid={`row-audit-${a.id}`}>
                      <TableCell data-testid={`text-audit-ts-${a.id}`}>{a.ts}</TableCell>
                      <TableCell data-testid={`text-audit-actor-${a.id}`}>{a.actor}</TableCell>
                      <TableCell data-testid={`text-audit-action-${a.id}`}>{a.action}</TableCell>
                      <TableCell data-testid={`text-audit-scope-${a.id}`}>{a.scope}</TableCell>
                      <TableCell data-testid={`text-audit-ref-${a.id}`}>{a.ref}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 rounded-xl border bg-background/40 p-4" data-testid="panel-retention">
              <div className="text-sm font-medium">Retention</div>
              <div className="text-xs text-muted-foreground mt-1">
                Audit logs retained indefinitely in production.
              </div>
            </div>

            <div className="mt-4 rounded-xl border bg-background/40 p-4" data-testid="panel-impersonation">
              <div className="text-sm font-medium">Super Admin troubleshooting</div>
              <div className="text-xs text-muted-foreground mt-1">
                Only Super Admin can impersonate, and a reason is mandatory. All impersonation is audited.
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <Input placeholder="Reason" data-testid="input-impersonation-reason" />
                <Button
                  variant="outline"
                  data-testid="button-start-impersonation"
                  onClick={() => toast({ title: "Impersonation (prototype)", description: "Reason captured and audited." })}
                >
                  Start impersonation
                </Button>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border bg-card/60 p-5 lg:col-span-2" data-testid="card-bookkeeping">
            <div className="text-sm font-semibold" data-testid="text-bookkeeping-title">Bookkeeping (monthly totals)</div>
            <div className="text-sm text-muted-foreground mt-1" data-testid="text-bookkeeping-subtitle">
              Per-supplier templates are maintained by Head Office. Finance can lock months.
            </div>
            <Separator className="my-4" />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border bg-background/40 p-4" data-testid="panel-suppliers">
                <div className="text-sm font-medium">Supplier totals template</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Example fields: Wholesaler, OTCSupplier, ServicesSupplier, Utilities, Rent, Rates.
                </div>
                <Textarea className="mt-3 min-h-[96px]" data-testid="textarea-suppliers-template" defaultValue="Wholesaler\nOTC Supplier\nServices Supplier\nUtilities\nRent\nRates\n" />
              </div>
              <div className="rounded-xl border bg-background/40 p-4" data-testid="panel-finance-lock">
                <div className="text-sm font-medium">Finance month lock</div>
                <div className="text-xs text-muted-foreground mt-1">When locked, edits are disabled.</div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <Input type="month" defaultValue="2026-01" data-testid="input-lock-month" />
                  <Button
                    variant="secondary"
                    data-testid="button-lock-month"
                    onClick={() => toast({ title: "Month locked (prototype)", description: "Server-side enforcement." })}
                  >
                    Lock month
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
