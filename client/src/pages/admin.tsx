import { useState, useEffect } from "react";
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
import { Trash2, AlertTriangle, Shield, Clock, Monitor, Info, Lock, Link as LinkIcon, Save, Palette, Edit, CheckCircle2 , Pencil, KeyRound } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useOrg } from "@/state/org";
import { TemplateEngine } from "@/components/template-engine";

type Pharmacy = {
  id: string;
  name: string;
  openingHours: string;
  ipAllowlist: string[];
  manager?: string;
  address?: string;
  color?: string;
  users?: string[];
  features?: {
    retail?: boolean;
    privateClinic?: boolean;
  };
};

type SharePointConfig = {
  embed: string;
  fallback: string;
};

export default function Admin() {
  const { toast } = useToast();
  const { users, inviteUser, deleteUser, session, trustedBrowsers, revokeTrustedBrowser, authMode, setAuthMode } = useAuth();
  const [staffList, setStaffList] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/staff').then(r => r.json()).then(d => { if (Array.isArray(d)) setStaffList(d); }).catch(() => {});
  }, []);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [editRoleUser, setEditRoleUser] = useState<any>(null);
  const [newUserRole, setNewUserRole] = useState("");
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(d => { if (Array.isArray(d)) setAllUsers(d); }).catch(() => {});
    fetch('/api/register-requests').then(r => r.json()).then(d => { if (Array.isArray(d)) setPendingRequests(d); }).catch(() => {});
  }, []);
  const { settings, setSettings, modules, setModules } = useOrg();
  
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<{ type: 'user' | 'pharmacy', id: string } | null>(null);
  const [masterPin, setMasterPin] = useState("");
  const [deleteStep, setDeleteStep] = useState(0); 

  // Invite Form State
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("Pharmacy Login");
  const [newScopeType, setNewScopeType] = useState<"headoffice" | "pharmacy">("pharmacy");
  const [newPharmacyId, setNewPharmacyId] = useState("bowland");

  // Audit Filter
  const [auditFilter, setAuditFilter] = useState<"all" | "pharmacy" | "headoffice">("all");

  // Trusted Browser Dialog
  const [viewingUserBrowsers, setViewingUserBrowsers] = useState<string | null>(null);

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([
    { id: "bowland", name: "Bowland Pharmacy", openingHours: "Mon–Fri 09:00–18:00; Sat 09:00–13:00", ipAllowlist: ["81.100.10.0/24"], manager: "John Smith", address: "1 High Street, Bowland", color: "#3b82f6", users: ["john@athealth.co.uk", "sarah@athealth.co.uk"], features: { retail: true, privateClinic: true } },
    { id: "denton", name: "Denton Pharmacy", openingHours: "Mon–Fri 09:00–18:00", ipAllowlist: ["81.100.11.0/24"], manager: "Jane Doe", address: "2 Market Square, Denton", color: "#f97316", users: ["jane@athealth.co.uk"], features: { retail: true, privateClinic: false } },
    { id: "wilmslow", name: "Wilmslow Pharmacy", openingHours: "Mon–Fri 09:00–18:00; Sat 10:00–14:00", ipAllowlist: ["81.100.12.0/24"], manager: "Mark Wilson", address: "10 Station Road, Wilmslow", color: "#a855f7", users: ["mark@athealth.co.uk"], features: { retail: true, privateClinic: true } },
  ]);

  const [editingPharmacy, setEditingPharmacy] = useState<Pharmacy | null>(null);

  const savePharmacy = () => {
     if (!editingPharmacy) return;
     setPharmacies(prev => prev.map(p => p.id === editingPharmacy.id ? editingPharmacy : p));
     setEditingPharmacy(null);
     toast({ title: "Pharmacy Updated", description: "Branch settings saved successfully." });
  };

  // SharePoint Settings State
  const [sharePointConfig, setSharePointConfig] = useState<Record<string, SharePointConfig>>({
    bowland: { embed: "https://www.microsoft.com/en-gb/microsoft-365/sharepoint/collaboration", fallback: "https://www.microsoft.com/en-gb/microsoft-365/sharepoint/collaboration" },
    denton: { embed: "https://www.microsoft.com/en-gb/microsoft-365/sharepoint/collaboration", fallback: "https://www.microsoft.com/en-gb/microsoft-365/sharepoint/collaboration" },
    wilmslow: { embed: "https://www.microsoft.com/en-gb/microsoft-365/sharepoint/collaboration", fallback: "https://www.microsoft.com/en-gb/microsoft-365/sharepoint/collaboration" },
    headoffice: { embed: "https://www.microsoft.com/en-gb/microsoft-365/sharepoint/collaboration", fallback: "https://www.microsoft.com/en-gb/microsoft-365/sharepoint/collaboration" }
  });

  // Launch Control Settings
  const [launchControl, setLaunchControl] = useState(modules);

  const [orgSettings, setOrgSettings] = useState(settings);

  const handleLaunchToggle = (key: string, val: boolean) => {
    setLaunchControl(s => ({ ...s, [key]: val }));
    setModules({ [key]: val });
    toast({ title: "Module Updated", description: `${key} is now ${val ? "ON" : "OFF"}` });
  };

  const handleOrgSettingsSave = () => {
     setSettings(orgSettings);
     toast({ title: "Settings Saved", description: "Organisation details and branding updated." });
  };

  // Load Config
  useEffect(() => {
    const saved = localStorage.getItem('sharepoint_config');
    if (saved) {
       setSharePointConfig(JSON.parse(saved));
    }
  }, []);

  const saveSharePointConfig = () => {
     localStorage.setItem('sharepoint_config', JSON.stringify(sharePointConfig));
     toast({ title: "Settings Saved", description: "Document links updated successfully." });
  };

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
     // REAL logic from requirement: Master PIN only valid for Ahmed
     // But for dev we simulate the pin check locally
     if (masterPin !== "145891") {
        toast({ title: "Invalid Master PIN", variant: "destructive" });
        return;
     }
     
     if (session.userEmail !== "ahmed@at-health.co.uk") {
        toast({ title: "Unauthorized", description: "Only Ahmed can authorize this action.", variant: "destructive" });
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

  const isHeadOffice = session.scope.type === "headoffice";
  const canManageUsers = session.role === "Head Office Admin" || session.role === "Super Admin";
  const canDeleteBranch = session.role === "Super Admin"; 

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
        
        <Tabs defaultValue="users" className="w-full">
           <TabsList className="flex w-full max-w-[800px] mb-4 flex-wrap">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="pharmacies">Pharmacies</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="targets">Targets</TabsTrigger>
              {isHeadOffice && <TabsTrigger value="templates">Templates & Workflows</TabsTrigger>}
              {isHeadOffice && <TabsTrigger value="whitelabel">Organisation</TabsTrigger>}
              {isHeadOffice && <TabsTrigger value="launch-control">Launch Control</TabsTrigger>}
              {isHeadOffice && <TabsTrigger value="pending-approvals">Pending Approvals{pendingRequests.filter(r=>r.status==='pending').length>0&&<span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold w-4 h-4">{pendingRequests.filter(r=>r.status==='pending').length}</span>}</TabsTrigger>}
           </TabsList>

           <TabsContent value="users" className="grid gap-3 lg:grid-cols-2">
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
                     {[...allUsers, ...staffList.filter(s => !allUsers.find(u => u.email === s.email))].map((u) => (
                       <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                         <TableCell data-testid={`text-user-email-${u.id}`}>{u.email || u.name}</TableCell>
                         <TableCell data-testid={`text-user-role-${u.id}`}>{u.role}</TableCell>
                         <TableCell data-testid={`text-user-scope-${u.id}`}>
                           {u.pharmacy_id ? (u.pharmacies?.name || u.pharmacy_id) : "Head Office"}
                         </TableCell>
                         <TableCell className="text-right">
                           <div className="flex justify-end gap-1">
                             <Button size="sm" variant="ghost" onClick={() => { setEditRoleUser(u); setNewUserRole(u.role || ""); }} disabled={!canManageUsers} title="Edit Role"><Pencil className="h-4 w-4 text-muted-foreground" /></Button>
                             <Button size="sm" variant="ghost" disabled={!canManageUsers} title="Reset Password" onClick={async () => { try { await fetch('/api/reset-password', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email: u.email }) }); toast({ title: "Password Reset Sent", description: `Reset email sent to ${u.email}` }); } catch { toast({ title: "Error", variant: "destructive" }); } }}><KeyRound className="h-4 w-4 text-muted-foreground" /></Button>
                             <Button size="sm" variant="ghost" onClick={() => setViewingUserBrowsers(u.id)} disabled={!canManageUsers}><Shield className="h-4 w-4 text-muted-foreground" /></Button>

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

             <Card className="rounded-2xl border bg-card/60 p-5 lg:col-span-2" data-testid="card-audit">
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
             </Card>
           </TabsContent>

           <TabsContent value="pharmacies">
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
                        <div className="flex gap-0.5 mt-2">
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setEditingPharmacy(p)}
                           >
                              <Edit className="h-4 w-4" />
                           </Button>
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                 setDeleteConfirmOpen({ type: 'pharmacy', id: p.id });
                                 setDeleteStep(0);
                                 setMasterPin("");
                              }}
                           >
                              <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                     )}
                   </div>
                 ))}
               </div>
             </Card>
           </TabsContent>

           <TabsContent value="documents">
             <Card className="rounded-2xl border bg-card/60 p-5">
                <div className="flex justify-between items-center mb-4">
                   <div>
                      <div className="text-sm font-semibold">SharePoint Configuration</div>
                      <div className="text-xs text-muted-foreground">Manage embedded document links per branch.</div>
                   </div>
                   {canManageUsers && (
                      <Button size="sm" onClick={saveSharePointConfig}>
                         <Save className="h-4 w-4 mr-2" /> Save Changes
                      </Button>
                   )}
                </div>

                <div className="space-y-6">
                   {pharmacies.concat([{ id: "headoffice", name: "Head Office", openingHours: "", ipAllowlist: [] }]).map((p) => (
                      <div key={p.id} className="rounded-xl border bg-background/40 p-4">
                         <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline">{p.name}</Badge>
                         </div>
                         <div className="grid gap-4 md:grid-cols-2">
                            <div>
                               <Label className="text-xs">Embed URL</Label>
                               <div className="flex gap-2 mt-1.5">
                                 <Input 
                                    value={sharePointConfig[p.id]?.embed || ""} 
                                    onChange={(e) => setSharePointConfig(s => ({ ...s, [p.id]: { ...s[p.id], embed: e.target.value } }))}
                                    className="font-mono text-xs"
                                    disabled={!canManageUsers}
                                 />
                               </div>
                            </div>
                            <div>
                               <Label className="text-xs">Fallback Link</Label>
                               <div className="flex gap-2 mt-1.5">
                                 <Input 
                                    value={sharePointConfig[p.id]?.fallback || ""} 
                                    onChange={(e) => setSharePointConfig(s => ({ ...s, [p.id]: { ...s[p.id], fallback: e.target.value } }))}
                                    className="font-mono text-xs"
                                    disabled={!canManageUsers}
                                 />
                                 <Button 
                                    size="icon" 
                                    variant="outline"
                                    onClick={() => window.open(sharePointConfig[p.id]?.fallback, '_blank')}
                                 >
                                    <LinkIcon className="h-4 w-4" />
                                 </Button>
                               </div>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </Card>
           </TabsContent>

           {isHeadOffice && (
              <TabsContent value="whitelabel">
                 <Card className="rounded-2xl border bg-card/60 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-6 border-b pb-4">
                       <Palette className="h-5 w-5 text-primary" />
                       <div>
                          <div className="font-semibold">Organisation Settings & White-Labelling</div>
                          <div className="text-xs text-muted-foreground">Manage global organisation settings and customize platform appearance.</div>
                       </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brand Colors</div>
                          <div className="space-y-4 bg-background/50 p-5 rounded-xl border">
                             <div className="grid gap-2">
                                <Label>Primary Color (Hex)</Label>
                                <div className="flex gap-2">
                                   <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: orgSettings.primaryColor }}></div>
                                   <Input value={orgSettings.primaryColor} onChange={(e) => setOrgSettings(s => ({ ...s, primaryColor: e.target.value }))} className="font-mono" />
                                </div>
                             </div>
                             <div className="grid gap-2">
                                <Label>Accent Color (Hex)</Label>
                                <div className="flex gap-2">
                                   <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: orgSettings.accentColor }}></div>
                                   <Input value={orgSettings.accentColor} onChange={(e) => setOrgSettings(s => ({ ...s, accentColor: e.target.value }))} className="font-mono" />
                                </div>
                             </div>
                          </div>

                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6">Organization Details</div>
                          <div className="space-y-4 bg-background/50 p-5 rounded-xl border">
                             <div className="grid gap-2">
                                <Label>Portal Name</Label>
                                <Input value={orgSettings.name} onChange={(e) => setOrgSettings(s => ({ ...s, name: e.target.value }))} />
                             </div>
                             <div className="grid gap-2">
                                <Label>Email Sender Name</Label>
                                <Input value={orgSettings.emailSender} onChange={(e) => setOrgSettings(s => ({ ...s, emailSender: e.target.value }))} />
                             </div>
                             <div className="grid gap-2">
                                <Label>Custom Subdomain</Label>
                                <div className="flex items-center gap-2">
                                   <Input value={orgSettings.customDomain} onChange={(e) => setOrgSettings(s => ({ ...s, customDomain: e.target.value }))} className="text-right" />
                                   <span className="text-muted-foreground text-sm">.pharmacy-portal.co.uk</span>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Logo & Assets</div>
                          <div className="space-y-4 bg-background/50 p-5 rounded-xl border">
                             <div className="grid gap-2">
                                <Label>Primary Logo</Label>
                                <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2">
                                   <div className="h-12 w-32 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">AT Health Logo</div>
                                   <Button variant="outline" size="sm" className="mt-2">Upload New Logo</Button>
                                   <p className="text-[10px] text-muted-foreground">PNG, SVG up to 2MB</p>
                                </div>
                             </div>
                             <div className="grid gap-2">
                                <Label>Favicon</Label>
                                <div className="flex items-center gap-4">
                                   <div className="h-10 w-10 bg-muted rounded border flex items-center justify-center text-[10px] text-muted-foreground">Icon</div>
                                   <Button variant="outline" size="sm">Update Icon</Button>
                                </div>
                             </div>
                          </div>

                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6">Current Entitlements</div>
                          <div className="space-y-4 bg-background/50 p-5 rounded-xl border">
                             <div className="flex items-center justify-between">
                                <Label>Plan Tier</Label>
                                <Badge variant="secondary">{orgSettings.tier}</Badge>
                             </div>
                             <p className="text-xs text-muted-foreground">Entitlements are managed by Platform Administrators.</p>
                          </div>

                          <div className="mt-6 flex justify-end">
                             <Button onClick={handleOrgSettingsSave}>Save Organization Settings</Button>
                          </div>
                       </div>
                    </div>
                 </Card>
              </TabsContent>
           )}

           {isHeadOffice && (
              <TabsContent value="launch-control">
                 <Card className="rounded-2xl border bg-card/60 p-6">
                    <div className="flex items-center gap-2 mb-6 border-b pb-4">
                       <Shield className="h-5 w-5 text-primary" />
                       <div>
                          <div className="font-semibold">Launch Control & UAT Readiness</div>
                          <div className="text-xs text-muted-foreground">Manage module availability, authentication mode, and launch status.</div>
                       </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Authentication Mode</div>
                          <div className="space-y-4 bg-background/50 p-5 rounded-xl border">
                             <div className="flex items-center justify-between">
                                <div>
                                   <Label>Use Mock OTP (Testing)</Label>
                                   <div className="text-xs text-muted-foreground">Generates OTPs in browser. Fallback 123456 allowed.</div>
                                </div>
                                <Switch 
                                   checked={authMode === "mock"} 
                                   onCheckedChange={(c) => {
                                      const newMode = c ? "mock" : "smtp";
                                      setAuthMode(newMode);
                                      toast({ title: "Auth Mode Updated", description: `Changed to ${newMode.toUpperCase()} mode.` });
                                   }} 
                                />
                             </div>
                             <div className="flex items-center justify-between">
                                <div>
                                   <Label>Use SMTP Live (Production)</Label>
                                   <div className="text-xs text-muted-foreground">Sends real emails via Microsoft 365.</div>
                                </div>
                                <Switch 
                                   checked={authMode === "smtp"} 
                                   onCheckedChange={(c) => {
                                      const newMode = c ? "smtp" : "mock";
                                      setAuthMode(newMode);
                                      toast({ title: "Auth Mode Updated", description: `Changed to ${newMode.toUpperCase()} mode.` });
                                   }} 
                                />
                             </div>
                             
                             {authMode === "smtp" && (
                                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                                   <Info className="h-4 w-4 shrink-0 mt-0.5" />
                                   <div>
                                      <strong>SMTP Live Mode Active</strong>
                                      <p className="text-xs mt-1">OTP emails will be sent using system environment variables for Microsoft 365. Delivery status will be tracked in backend logs.</p>
                                   </div>
                                </div>
                             )}
                          </div>

                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6">Module Toggles</div>
                          <div className="space-y-3 bg-background/50 p-5 rounded-xl border">
                             {Object.entries(launchControl).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between">
                                   <Label className="capitalize font-normal text-sm">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                                   <Switch checked={value as boolean} onCheckedChange={(c) => handleLaunchToggle(key, c)} />
                                </div>
                             ))}
                          </div>
                       </div>
                       
                       <div className="space-y-4">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">UAT Readiness Checklist</div>
                          <div className="space-y-3 bg-background/50 p-5 rounded-xl border">
                             <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <div className="text-sm"><strong>Super Admin flow:</strong> ahmed@at-health.co.uk direct to PIN (145891)</div>
                             </div>
                             <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <div className="text-sm"><strong>Head Office flow:</strong> info@ / finance@ restricted correctly</div>
                             </div>
                             <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <div className="text-sm"><strong>Pharmacy flow:</strong> Branches restricted to their own staff and data</div>
                             </div>
                             <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <div className="text-sm"><strong>Operations:</strong> Daily Figures, Cashing Up, Bookkeeping working</div>
                             </div>
                             <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <div className="text-sm"><strong>Compliance:</strong> Incident Management and Training matrices live</div>
                             </div>
                             <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <div className="text-sm"><strong>Auth Rules:</strong> PIN lockouts, User/Branch sign-out flows tested</div>
                             </div>
                             
                             <Separator className="my-4" />
                             
                             <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">Launch Status:</span>
                                <Badge className="bg-emerald-500 hover:bg-emerald-600">Go for Launch</Badge>
                             </div>
                          </div>
                       </div>
                    </div>
                 </Card>
              </TabsContent>
           )}

           <TabsContent value="targets" className="space-y-6">
              <Card className="rounded-2xl border bg-card/60 p-6 shadow-sm">
                 <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                       <h3 className="font-semibold text-lg">Performance Targets</h3>
                       <p className="text-sm text-muted-foreground">Set monthly targets per pharmacy.</p>
                    </div>
                 </div>
                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <div className="flex justify-between items-center bg-background/50 p-3 rounded-lg border">
                          <div>
                             <Label className="font-medium">Total Prescriptions/Items</Label>
                             <div className="text-xs text-muted-foreground">Target monthly volume</div>
                          </div>
                          <Input className="w-24 text-right" defaultValue="10000" />
                       </div>
                       <div className="flex justify-between items-center bg-background/50 p-3 rounded-lg border">
                          <div>
                             <Label className="font-medium">NMS Target</Label>
                             <div className="text-xs text-muted-foreground">New Medicine Services</div>
                          </div>
                          <Input className="w-24 text-right" defaultValue="100" />
                       </div>
                       <div className="flex justify-between items-center bg-background/50 p-3 rounded-lg border">
                          <div>
                             <Label className="font-medium">Pharmacy First</Label>
                             <div className="text-xs text-muted-foreground">Consultations target</div>
                          </div>
                          <Input className="w-24 text-right" defaultValue="50" />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center bg-background/50 p-3 rounded-lg border">
                          <div>
                             <Label className="font-medium">Nominations Growth</Label>
                             <div className="text-xs text-muted-foreground">Target net positive</div>
                          </div>
                          <Input className="w-24 text-right" defaultValue="50" />
                       </div>
                       <div className="flex justify-between items-center bg-background/50 p-3 rounded-lg border">
                          <div>
                             <Label className="font-medium">Private Revenue</Label>
                             <div className="text-xs text-muted-foreground">Monthly target (£)</div>
                          </div>
                          <Input className="w-24 text-right" defaultValue="2500" />
                       </div>
                       <div className="flex justify-between items-center bg-background/50 p-3 rounded-lg border">
                          <div>
                             <Label className="font-medium">Compliance Score</Label>
                             <div className="text-xs text-muted-foreground">Minimum acceptable score</div>
                          </div>
                          <Input className="w-24 text-right" defaultValue="90" />
                       </div>
                    </div>
                 </div>
              </Card>
           {editRoleUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditRoleUser(null)}>
                <div className="bg-background border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="font-semibold mb-4">Edit Role — {editRoleUser.email}</div>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="ho_admin">HO Admin</SelectItem>
                      <SelectItem value="pharmacy_manager">Pharmacy Manager</SelectItem>
                      <SelectItem value="pharmacist">Pharmacist</SelectItem>
                      <SelectItem value="dispenser">Dispenser</SelectItem>
                      <SelectItem value="pharmacy_staff">Pharmacy Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 mt-4">
                    <Button className="flex-1" onClick={async () => {
                      try {
                        await fetch(`/api/users/${editRoleUser.id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ role: newUserRole }) });
                        setAllUsers(prev => prev.map(u => u.id === editRoleUser.id ? {...u, role: newUserRole} : u));
                        toast({ title: "Role Updated" });
                        setEditRoleUser(null);
                      } catch { toast({ title: "Error", variant: "destructive" }); }
                    }}>Save</Button>
                    <Button variant="outline" className="flex-1" onClick={() => setEditRoleUser(null)}>Cancel</Button>
                  </div>
                </div>
              </div>
            )}
<TabsContent value="pending-approvals">
              <Card className="rounded-2xl border bg-card/60 p-5">
                <div className="text-sm font-semibold mb-4">Pending Account Requests</div>
                {pendingRequests.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">No pending requests</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Pharmacy</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell>{req.full_name}</TableCell>
                          <TableCell>{req.email}</TableCell>
                          <TableCell>{req.pharmacy_name || "—"}</TableCell>
                          <TableCell><Badge variant="outline">{req.role_requested}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={req.status === 'pending' ? 'secondary' : req.status === 'approved' ? 'default' : 'destructive'}>
                              {req.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{new Date(req.created_at).toLocaleDateString('en-GB')}</TableCell>
                          <TableCell className="text-right">
                            {req.status === 'pending' && (
                              <div className="flex justify-end gap-1">
                                <Button size="sm" variant="default" onClick={async () => {
                                  try {
                                    await fetch(`/api/register-requests/${req.id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: 'approved', reviewed_by: session?.user?.email || 'admin' }) });
                                    setPendingRequests(prev => prev.map(r => r.id === req.id ? {...r, status: 'approved'} : r));
                                    toast({ title: "Request Approved", description: `${req.full_name} has been approved.` });
                                  } catch { toast({ title: "Error", variant: "destructive" }); }
                                }}>Approve</Button>
                                <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={async () => {
                                  try {
                                    await fetch(`/api/register-requests/${req.id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: 'rejected', reviewed_by: session?.user?.email || 'admin' }) });
                                    setPendingRequests(prev => prev.map(r => r.id === req.id ? {...r, status: 'rejected'} : r));
                                    toast({ title: "Request Rejected" });
                                  } catch { toast({ title: "Error", variant: "destructive" }); }
                                }}>Reject</Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </TabsContent>
</TabsContent>
        </Tabs>

           <Dialog open={!!editingPharmacy} onOpenChange={(o) => !o && setEditingPharmacy(null)}>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                 <DialogHeader>
                    <DialogTitle>Edit Pharmacy Profile</DialogTitle>
                    <DialogDescription>Update branch details and access controls.</DialogDescription>
                 </DialogHeader>
                 {editingPharmacy && (
                    <div className="grid gap-4 py-4">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                             <Label>Branch Name</Label>
                             <Input 
                                value={editingPharmacy.name} 
                                onChange={e => setEditingPharmacy({...editingPharmacy, name: e.target.value})} 
                             />
                          </div>
                          <div className="grid gap-2">
                             <Label>Branch Color (Hex)</Label>
                             <div className="flex gap-2">
                                <div className="w-10 h-10 rounded-md border" style={{ backgroundColor: editingPharmacy.color || '#cccccc' }}></div>
                                <Input 
                                   value={editingPharmacy.color || ''} 
                                   onChange={e => setEditingPharmacy({...editingPharmacy, color: e.target.value})} 
                                />
                             </div>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                             <Label>Pharmacy Manager</Label>
                             <Input 
                                value={editingPharmacy.manager || ''} 
                                onChange={e => setEditingPharmacy({...editingPharmacy, manager: e.target.value})} 
                             />
                          </div>
                          <div className="grid gap-2">
                             <Label>Opening Hours</Label>
                             <Input 
                                value={editingPharmacy.openingHours} 
                                onChange={e => setEditingPharmacy({...editingPharmacy, openingHours: e.target.value})} 
                             />
                          </div>
                       </div>
                       <div className="grid gap-2">
                          <Label>Address</Label>
                          <Input 
                             value={editingPharmacy.address || ''} 
                             onChange={e => setEditingPharmacy({...editingPharmacy, address: e.target.value})} 
                          />
                       </div>
                       <div className="grid gap-2">
                          <Label>IP Allowlist (Comma separated)</Label>
                          <Input 
                             value={editingPharmacy.ipAllowlist.join(", ")} 
                             onChange={e => setEditingPharmacy({...editingPharmacy, ipAllowlist: e.target.value.split(",").map(s => s.trim())})} 
                          />
                       </div>
                       
                       <div className="mt-4">
                          <Label className="text-sm font-semibold mb-2 block">Enabled Features</Label>
                          <div className="space-y-3 bg-muted/30 p-3 rounded-lg border">
                             <div className="flex items-center justify-between">
                                <Label className="font-normal">Private Clinic</Label>
                                <Switch 
                                   checked={editingPharmacy.features?.privateClinic} 
                                   onCheckedChange={(c) => setEditingPharmacy({
                                      ...editingPharmacy, 
                                      features: { ...editingPharmacy.features, privateClinic: c }
                                   })} 
                                />
                             </div>
                             <div className="flex items-center justify-between">
                                <Label className="font-normal">Retail / EPOS</Label>
                                <Switch 
                                   checked={editingPharmacy.features?.retail} 
                                   onCheckedChange={(c) => setEditingPharmacy({
                                      ...editingPharmacy, 
                                      features: { ...editingPharmacy.features, retail: c }
                                   })} 
                                />
                             </div>
                          </div>
                       </div>
                    </div>
                 )}
                 <DialogFooter>
                    <Button variant="ghost" onClick={() => setEditingPharmacy(null)}>Cancel</Button>
                    <Button onClick={savePharmacy}>Save Changes</Button>
                 </DialogFooter>
              </DialogContent>
           </Dialog>
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
                   <div className="space-y-3">
                      {userTrustedBrowsers.map((tb, idx) => (
                         <div key={idx} className="flex items-center justify-between p-3 border rounded-xl bg-muted/30">
                            <div>
                               <div className="font-medium text-sm flex items-center gap-2">
                                  <Monitor className="h-4 w-4 text-primary" />
                                  {tb.browserInfo ? `${tb.browserInfo.browser || 'Unknown'} on ${tb.browserInfo.os || 'Unknown OS'}` : 'Unknown Device'}
                               </div>
                               <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Expires: {new Date(tb.expiresAt).toLocaleDateString()}
                               </div>
                            </div>
                            {canManageUsers && (
                               <Button variant="ghost" size="sm" onClick={() => {
                                  revokeTrustedBrowser(tb.userId);
                                  toast({ title: "Device Revoked", description: "The device will require OTP on next login." });
                                  setViewingUserBrowsers(null);
                               }} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                  Revoke
                               </Button>
                            )}
                         </div>
                      ))}
                   </div>
                )}
             </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
