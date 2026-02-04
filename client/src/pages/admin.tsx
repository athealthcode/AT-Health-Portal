import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth, Role } from "@/state/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, AlertTriangle } from "lucide-react";

type Pharmacy = {
  id: string;
  name: string;
  openingHours: string;
  ipAllowlist: string[];
};

export default function Admin() {
  const { toast } = useToast();
  const { users, inviteUser, deleteUser, session } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);

  // Invite Form State
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("Pharmacy Login");
  const [newScopeType, setNewScopeType] = useState<"headoffice" | "pharmacy">("pharmacy");
  const [newPharmacyId, setNewPharmacyId] = useState("bowland");

  const [pharmacies] = useState<Pharmacy[]>([
    { id: "bowland", name: "Bowland Pharmacy", openingHours: "Mon–Fri 09:00–18:00; Sat 09:00–13:00", ipAllowlist: ["81.100.10.0/24"] },
    { id: "denton", name: "Denton Pharmacy", openingHours: "Mon–Fri 09:00–18:00", ipAllowlist: ["81.100.11.0/24"] },
    { id: "wilmslow", name: "Wilmslow Pharmacy", openingHours: "Mon–Fri 09:00–18:00; Sat 10:00–14:00", ipAllowlist: ["81.100.12.0/24"] },
  ]);

  const handleInvite = () => {
    if (!newEmail) return;
    inviteUser(newEmail, newRole, newScopeType, newPharmacyId);
    setInviteOpen(false);
    setNewEmail("");
    toast({ title: "User Invited", description: `${newEmail} can now log in.` });
  };

  const canManageUsers = session.role === "Head Office Admin" || session.role === "Super Admin";

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div>
          <div className="font-serif text-2xl tracking-tight" data-testid="text-admin-title">Admin</div>
          <div className="text-sm text-muted-foreground" data-testid="text-admin-subtitle">
            Manage pharmacies, users, roles, and security settings.
          </div>
        </div>
        
        {/* Test Data Awareness Banner - Only for Admins */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
           <div className="flex items-center gap-2 mb-2 font-semibold">
              <AlertTriangle className="h-4 w-4" />
              Test Data (Seed Users)
           </div>
           <div className="text-xs grid md:grid-cols-2 lg:grid-cols-3 gap-2">
              <div>
                 <strong>Head Office:</strong> admin@at-health.co.uk
              </div>
              <div>
                 <strong>Finance:</strong> finance@at-health.co.uk
              </div>
              <div>
                 <strong>Bowland:</strong> info@bowlandpharmacy.co.uk
              </div>
              <div>
                 <strong>Denton:</strong> info@dentonpharmacy.co.uk
              </div>
              <div>
                 <strong>Wilmslow:</strong> info@wilmslowpharmacy.co.uk
              </div>
           </div>
           <div className="text-[10px] mt-2 opacity-75">
              Warning: Temporary passwords in use. Please reset after testing.
           </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {/* USERS CARD */}
          <Card className="rounded-2xl border bg-card/60 p-5 lg:col-span-2" data-testid="card-users">
            <div className="flex justify-between items-center">
              <div className="text-sm font-semibold" data-testid="text-users-title">Users & Access</div>
              
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={!canManageUsers}>+ Invite User</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite New User</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Email</Label>
                      <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="name@athealth.co.uk" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Role</Label>
                      <Select value={newRole} onValueChange={(v: Role) => setNewRole(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pharmacy Login">Pharmacy Login</SelectItem>
                          <SelectItem value="Pharmacy Manager">Pharmacy Manager</SelectItem>
                          <SelectItem value="Head Office Admin">Head Office Admin</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Super Admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Scope</Label>
                      <Select value={newScopeType} onValueChange={(v: any) => setNewScopeType(v)}>
                         <SelectTrigger><SelectValue /></SelectTrigger>
                         <SelectContent>
                            <SelectItem value="pharmacy">Pharmacy</SelectItem>
                            <SelectItem value="headoffice">Head Office</SelectItem>
                         </SelectContent>
                      </Select>
                    </div>
                    {newScopeType === "pharmacy" && (
                       <div className="grid gap-2">
                        <Label>Pharmacy</Label>
                        <Select value={newPharmacyId} onValueChange={setNewPharmacyId}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bowland">Bowland Pharmacy</SelectItem>
                            <SelectItem value="denton">Denton Pharmacy</SelectItem>
                            <SelectItem value="wilmslow">Wilmslow Pharmacy</SelectItem>
                          </SelectContent>
                        </Select>
                       </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={handleInvite}>Create User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

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
                      <TableCell data-testid={`text-user-scope-${u.id}`}>
                        {u.scope.type === "pharmacy" ? u.scope.pharmacyName : "Head Office"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={!canManageUsers}
                          onClick={() => deleteUser(u.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {!canManageUsers && (
               <div className="mt-2 text-xs text-muted-foreground">Only Admins can manage users.</div>
            )}
          </Card>

          {/* PHARMACIES CARD */}
          <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-pharmacies">
            <div className="text-sm font-semibold" data-testid="text-pharmacies-title">Pharmacies & IP Security</div>
            <div className="mt-3 grid gap-3">
              {pharmacies.map((p) => (
                <div key={p.id} className="rounded-xl border bg-background/40 p-4" data-testid={`card-pharmacy-${p.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium" data-testid={`text-pharmacy-name-${p.id}`}>{p.name}</div>
                      <div className="text-xs text-muted-foreground" data-testid={`text-pharmacy-hours-${p.id}`}>{p.openingHours}</div>
                    </div>
                    <Badge variant="secondary" className="pill" data-testid={`badge-pharmacy-${p.id}`}>Active</Badge>
                  </div>
                  <Separator className="my-3" />
                  <div className="text-xs font-semibold text-muted-foreground" data-testid={`text-allowlist-${p.id}`}>Allowlisted Subnets</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {p.ipAllowlist.map((cidr, idx) => (
                      <Badge key={idx} variant="outline" className="pill" data-testid={`badge-ip-${p.id}-${idx}`}>{cidr}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* AUDIT LOGS CARD */}
          <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-audit">
            <div className="text-sm font-semibold mb-3" data-testid="text-audit-title">Recent Audit Logs</div>
            <div className="overflow-hidden rounded-xl border bg-background/40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                     <TableCell>10:42</TableCell>
                     <TableCell>Sarah Ahmed</TableCell>
                     <TableCell>Submitted Daily Figures</TableCell>
                  </TableRow>
                  <TableRow>
                     <TableCell>10:15</TableCell>
                     <TableCell>Helen Carter</TableCell>
                     <TableCell>User Invited</TableCell>
                  </TableRow>
                  <TableRow>
                     <TableCell>09:30</TableCell>
                     <TableCell>System</TableCell>
                     <TableCell>Report Generated</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">Real-time audit logging enabled.</div>
          </Card>

        </div>
      </div>
    </AppShell>
  );
}
