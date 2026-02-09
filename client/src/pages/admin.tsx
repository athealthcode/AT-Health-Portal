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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, AlertTriangle, Shield, Clock, Monitor, Info, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Pharmacy = {
  id: string;
  name: string;
  openingHours: string;
  ipAllowlist: string[];
};

export default function Admin() {
  const { toast } = useToast();
  const { users, inviteUser, deleteUser, session, trustedBrowsers, revokeTrustedBrowser } = useAuth();
  
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<{ type: 'user' | 'pharmacy', id: string } | null>(null);
  const [masterPin, setMasterPin] = useState("");
  const [deleteStep, setDeleteStep] = useState(0); // 0 = PIN, 1 = Confirm 1, 2 = Confirm 2, 3 = Final

  // Invite Form State
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("Pharmacy Login");
  const [newScopeType, setNewScopeType] = useState<"headoffice" | "pharmacy">("pharmacy");
  const [newPharmacyId, setNewPharmacyId] = useState("bowland");

  // Audit Filter
  const [auditFilter, setAuditFilter] = useState<"all" | "pharmacy" | "headoffice">("all");

  // Trusted Browser Dialog
  const [viewingUserBrowsers, setViewingUserBrowsers] = useState<string | null>(null);

  const [pharmacies] = useState<Pharmacy[]>([
    { id: "bowland", name: "Bowland Pharmacy", openingHours: "Mon–Fri 09:00–18:00; Sat 09:00–13:00", ipAllowlist: ["81.100.10.0/24"] },
    { id: "denton", name: "Denton Pharmacy", openingHours: "Mon–Fri 09:00–18:00", ipAllowlist: ["81.100.11.0/24"] },
    { id: "wilmslow", name: "Wilmslow Pharmacy", openingHours: "Mon–Fri 09:00–18:00; Sat 10:00–14:00", ipAllowlist: ["81.100.12.0/24"] },
  ]);

  // Auto-set scope based on role
  const handleRoleChange = (role: Role) => {
     setNewRole(role);
     if (role === "Head Office Admin" || role === "Finance" || role === "Super Admin") {
        setNewScopeType("headoffice");
     } else {
        setNewScopeType("pharmacy");
     }
  };

  const handleInvite = () => {
    if (!newEmail) return;
    inviteUser(newEmail, newRole, newScopeType, newPharmacyId);
    setInviteOpen(false);
    setNewEmail("");
    toast({ title: "User Invited", description: `${newEmail} can now log in.` });
  };

  const handleDeleteAttempt = () => {
     if (masterPin !== "123456") { // Mock Master PIN
        toast({ title: "Invalid Master PIN", variant: "destructive" });
        return;
     }
     if (deleteStep < 3) {
        setDeleteStep(s => s + 1);
        return;
     }
     
     if (deleteConfirmOpen?.type === "user") {
        deleteUser(deleteConfirmOpen.id);
        toast({ title: "User Deleted", description: "Audit log created. Notification sent to info@at-health.co.uk" });
     } else {
        toast({ title: "Pharmacy Deleted", description: "Branch removed." });
     }
     setDeleteConfirmOpen(null);
     setMasterPin("");
     setDeleteStep(0);
  };

  const canManageUsers = session.role === "Head Office Admin" || session.role === "Super Admin";
  const canDeleteBranch = session.role === "Super Admin"; // Only super admin can delete branch

  const viewingUser = users.find(u => u.id === viewingUserBrowsers);
  const userTrustedBrowsers = viewingUserBrowsers 
    ? trustedBrowsers.filter(tb => tb.userId === viewingUserBrowsers && !tb.revokedAt && Date.now() < tb.expiresAt)
    : [];

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div>
          <div className="font-serif text-2xl tracking-tight" data-testid="text-admin-title">Settings</div>
          <div className="text-sm text-muted-foreground" data-testid="text-admin-subtitle">
            Manage pharmacies, users, roles, and security settings.
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
                      <div className="flex items-center gap-2">
                         <Label>Role</Label>
                         <TooltipProvider>
                           <Tooltip>
                              <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                              <TooltipContent className="max-w-[300px] text-xs">
                                 <p><strong>Pharmacy Login:</strong> Daily figures, cashing up, standard reports.</p>
                                 <p><strong>Pharmacy Manager:</strong> Full branch access + staff management.</p>
                                 <p><strong>Head Office Admin:</strong> Global view, user management, all reports.</p>
                                 <p><strong>Finance:</strong> Read-only access to financial reports.</p>
                              </TooltipContent>
                           </Tooltip>
                         </TooltipProvider>
                      </div>
                      <Select value={newRole} onValueChange={(v: Role) => handleRoleChange(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pharmacy Login">Pharmacy Login</SelectItem>
                          <SelectItem value="Pharmacy Manager">Pharmacy Manager</SelectItem>
                          <SelectItem value="Head Office Admin">Head Office Admin</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Scope</Label>
                      <Select value={newScopeType} onValueChange={(v: any) => setNewScopeType(v)} disabled={newRole !== "Pharmacy Login" && newRole !== "Pharmacy Manager"}>
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
                        <div className="flex justify-end gap-1">
                          {/* Trusted Browsers View */}
                          <Button 
                             size="sm" 
                             variant="ghost" 
                             onClick={() => setViewingUserBrowsers(u.id)}
                             disabled={!canManageUsers}
                          >
                             <Shield className="h-4 w-4 text-muted-foreground" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={!canManageUsers}
                            onClick={() => {
                               setDeleteConfirmOpen({ type: 'user', id: u.id });
                               setDeleteStep(0);
                               setMasterPin("");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* MASTER PIN DELETE DIALOG */}
          <Dialog open={!!deleteConfirmOpen} onOpenChange={(o) => !o && setDeleteConfirmOpen(null)}>
             <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                   <DialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      {deleteStep === 0 ? "Confirm Deletion" : "ARE YOU SURE?"}
                   </DialogTitle>
                   <DialogDescription>
                      This action is permanent and will be audit logged.
                   </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                   <div className="grid gap-2">
                      <Label>Enter Master PIN to continue</Label>
                      <Input 
                         type="password" 
                         value={masterPin} 
                         onChange={e => setMasterPin(e.target.value)} 
                         placeholder="******" 
                         className="font-mono tracking-widest"
                      />
                   </div>
                   {deleteStep > 0 && (
                      <div className="text-sm font-bold text-destructive text-center p-2 bg-destructive/10 rounded">
                         CONFIRMATION STEP {deleteStep}/3
                      </div>
                   )}
                </div>
                <DialogFooter>
                   <Button variant="ghost" onClick={() => setDeleteConfirmOpen(null)}>Cancel</Button>
                   <Button variant="destructive" onClick={handleDeleteAttempt}>
                      {deleteStep < 3 ? "Confirm & Continue" : "DELETE PERMANENTLY"}
                   </Button>
                </DialogFooter>
             </DialogContent>
          </Dialog>

          {/* Trusted Devices Dialog */}
          <Dialog open={!!viewingUserBrowsers} onOpenChange={(o) => !o && setViewingUserBrowsers(null)}>
            <DialogContent>
               <DialogHeader>
                  <DialogTitle>Trusted Devices: {viewingUser?.email}</DialogTitle>
               </DialogHeader>
               <div className="py-4">
                  {userTrustedBrowsers.length === 0 ? (
                     <div className="text-sm text-muted-foreground">No active trusted devices.</div>
                  ) : (
                     <div className="grid gap-3">
                        {userTrustedBrowsers.map(tb => (
                           <div key={tb.id} className="flex items-start justify-between rounded-lg border p-3 text-sm">
                              <div>
                                 <div className="flex items-center gap-2 font-medium">
                                    <Monitor className="h-4 w-4" />
                                    {tb.ipAddress}
                                 </div>
                                 <div className="text-xs text-muted-foreground mt-1">
                                    Last used: {new Date(tb.lastUsedAt).toLocaleDateString()}
                                 </div>
                                 <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3" />
                                    Expires: {new Date(tb.expiresAt).toLocaleDateString()}
                                 </div>
                              </div>
                              <Button 
                                 size="sm" 
                                 variant="outline" 
                                 className="text-destructive hover:bg-destructive/10"
                                 onClick={() => {
                                    revokeTrustedBrowser(tb.id);
                                    toast({ title: "Device Revoked", description: "User will be prompted for OTP on next login." });
                                 }}
                              >
                                 Revoke
                              </Button>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </DialogContent>
          </Dialog>

          {/* PHARMACIES CARD */}
          <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-pharmacies">
            <div className="text-sm font-semibold" data-testid="text-pharmacies-title">Pharmacies & IP Security</div>
            <div className="mt-3 grid gap-3">
              {pharmacies.map((p) => (
                <div key={p.id} className="rounded-xl border bg-background/40 p-4 relative group" data-testid={`card-pharmacy-${p.id}`}>
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

                  {canDeleteBranch && (
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                        onClick={() => {
                           setDeleteConfirmOpen({ type: 'pharmacy', id: p.id });
                           setDeleteStep(0);
                           setMasterPin("");
                        }}
                     >
                        <Trash2 className="h-4 w-4" />
                     </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* AUDIT LOGS CARD */}
          <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-audit">
            <div className="flex items-center justify-between mb-4">
               <div className="text-sm font-semibold" data-testid="text-audit-title">Audit Logs</div>
               <Select value={auditFilter} onValueChange={(v: any) => setAuditFilter(v)}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">All Events</SelectItem>
                     <SelectItem value="pharmacy">Pharmacy Only</SelectItem>
                     <SelectItem value="headoffice">Head Office Only</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            
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
                  {[
                     { time: "10:42", actor: "Sarah Ahmed", action: "Submitted Daily Figures", scope: "pharmacy" },
                     { time: "10:15", actor: "Helen Carter", action: "User Invited", scope: "headoffice" },
                     { time: "09:30", actor: "System", action: "Report Generated", scope: "headoffice" },
                     { time: "Yesterday", actor: "James Wilson", action: "Cashing Up", scope: "pharmacy" },
                  ]
                  .filter(l => auditFilter === "all" || l.scope === auditFilter)
                  .map((log, i) => (
                     <TableRow key={i}>
                        <TableCell className="py-2 text-xs">{log.time}</TableCell>
                        <TableCell className="py-2 text-xs font-medium">{log.actor}</TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground">{log.action}</TableCell>
                     </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-3 text-[10px] text-muted-foreground text-center">
               Logs are retained indefinitely.
            </div>
          </Card>

        </div>
      </div>
    </AppShell>
  );
}
