import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
            Manage pharmacies, opening hours (trading days), IP allowlists, users/roles, staff PINs, and audit logs.
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
            <div className="flex justify-between items-center">
              <div className="text-sm font-semibold" data-testid="text-users-title">Users & roles</div>
              <Button size="sm" variant="outline" onClick={() => toast({ title: "Invite User", description: "Opens invite dialog." })}>+ Invite</Button>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border bg-background/40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                      <TableCell data-testid={`text-user-email-${u.id}`}>{u.email}</TableCell>
                      <TableCell data-testid={`text-user-role-${u.id}`}>{u.role}</TableCell>
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
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
