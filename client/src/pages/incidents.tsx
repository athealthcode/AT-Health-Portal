import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/state/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
   AlertTriangle, ShieldAlert, Plus, MessageSquare, Clock, ArrowRight, Activity, Thermometer, BriefcaseMedical, ChevronRight, User, Calendar as CalendarIcon, Filter, Building2, AlignLeft, CheckCircle2, Monitor
} from "lucide-react";
import { format } from "date-fns";

type IncidentStatus = "Open" | "Investigating" | "HO Review" | "Waiting on Branch" | "Closed";
type IncidentSeverity = "Low" | "Medium" | "High" | "Critical";

interface Incident {
   id: string;
   branch: string;
   branchId: string;
   category: string;
   severity: IncidentSeverity;
   title: string;
   description: string;
   status: IncidentStatus;
   daysOpen: number;
   createdAt: number;
   createdBy: string;
   dueDate: number;
   owner: string;
   notes: Array<{date: number, text: string, user: string}>;
}



const CATEGORIES = [
  "Near miss", "Dispensing incident", "Complaint", "Compliance breach", 
  "Staffing issue", "Fridge temperature issue", "Banking issue", "IT issue", "Other"
];

function getCategoryIcon(category: string) {
   switch (category) {
      case "Fridge Temp": case "Fridge temperature issue": return Thermometer;
      case "Near Miss": case "Dispensing incident": return Activity;
      case "Patient Complaint": case "Complaint": return MessageSquare;
      case "IT Issue": case "IT issue": return Monitor;
      case "Staffing": case "Staffing issue": return User;
      case "Banking issue": return AlertTriangle;
      case "Compliance breach": return ShieldAlert;
      default: return BriefcaseMedical;
   }
}

export default function Incidents() {
   const { session } = useAuth();
  // Load incidents from DB
  useEffect(() => {
    const phId = session?.scope?.pharmacyId;
    const qp = phId && !isHeadOffice ? `?pharmacy_id=${phId}` : "";
    fetch(`/api/incidents${qp}`)
      .then(r => r.json())
      .then(rows => { if (Array.isArray(rows)) setIncidents(rows as Incident[]); })
      .catch(() => {});
  }, [session?.scope?.pharmacyId, isHeadOffice]);
   const isHeadOffice = session.scope.type === "headoffice";
   
   const [incidents, setIncidents] = useState<Incident[]>([]);
   const [selectedBranch, setSelectedBranch] = useState<string>("all");
   const [statusFilter, setStatusFilter] = useState<string>("open");
   
   // Form State
   const [isCreateOpen, setIsCreateOpen] = useState(false);
   const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
   const [isViewOpen, setIsViewOpen] = useState(false);
   
   // Filters
   const filteredIncidents = incidents.filter(inc => {
      // 1. Scope filter
      if (!isHeadOffice && inc.branchId !== session.scope.pharmacyId) return false;
      if (isHeadOffice && selectedBranch !== "all" && inc.branchId !== selectedBranch) return false;
      
      // 2. Status filter
      if (statusFilter === "open" && inc.status === "Closed") return false;
      if (statusFilter === "closed" && inc.status !== "Closed") return false;
      if (statusFilter === "overdue" && (inc.status === "Closed" || inc.dueDate > Date.now())) return false;
      if (statusFilter === "ho_review" && inc.status !== "HO Review") return false;
      
      return true;
   });

   const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      
      const newInc: Incident = {
         id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
         branch: isHeadOffice ? (fd.get("branchId") as string) : session.scope.pharmacyName,
         branchId: isHeadOffice ? (fd.get("branchId") as string) : session.scope.pharmacyId,
         category: fd.get("category") as string,
         severity: fd.get("severity") as IncidentSeverity,
         title: fd.get("title") as string,
         description: fd.get("description") as string,
         status: "Open",
         daysOpen: 0,
         createdAt: Date.now(),
         createdBy: session.staff?.name || session.userEmail || "Unknown User",
         dueDate: Date.now() + 86400000 * 7, // 7 days by default
         owner: "Unassigned",
         notes: []
      };
      
      fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pharmacy_id: newInc.branchId,
        pharmacy_name: newInc.branch,
        category: newInc.category,
        severity: newInc.severity,
        title: newInc.title,
        description: newInc.description,
        status: newInc.status,
        created_by: newInc.createdBy,
        owner: newInc.owner,
        due_date: new Date(newInc.dueDate).toISOString(),
      })
    }).then(r => r.json()).then(saved => {
      if (saved && saved.id) setIncidents(prev => [{ ...newInc, id: saved.id }, ...prev]);
      else setIncidents(prev => [newInc, ...prev]);
    }).catch(() => setIncidents(prev => [newInc, ...prev]));
    
      setIsCreateOpen(false);
   };

   return (
      <AppShell>
         <div className="flex flex-col gap-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                  <h1 className="font-serif text-3xl tracking-tight text-foreground">Incident Management</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                     Report, track, and resolve operational and compliance cases.
                  </p>
               </div>
               
               <div className="flex items-center gap-3 w-full md:w-auto">
                  {isHeadOffice && (
                     <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                        <SelectTrigger className="w-[180px] h-10">
                           <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                           <SelectValue placeholder="All Branches" />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">All Branches</SelectItem>
                           <SelectItem value="bowland">Bowland Pharmacy</SelectItem>
                           <SelectItem value="denton">Denton Pharmacy</SelectItem>
                           <SelectItem value="wilmslow">Wilmslow Pharmacy</SelectItem>
                        </SelectContent>
                     </Select>
                  )}
                  
                  <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                     <DialogTrigger asChild>
                        <Button className="gap-2 shrink-0">
                           <Plus className="w-4 h-4" /> Report Case
                        </Button>
                     </DialogTrigger>
                     <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                           <DialogTitle>Report New Incident / Case</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="grid gap-4 py-4">
                           {isHeadOffice && (
                              <div className="grid gap-2">
                                 <Label>Branch</Label>
                                 <Select name="branchId" required defaultValue="bowland">
                                    <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="bowland">Bowland Pharmacy</SelectItem>
                                       <SelectItem value="denton">Denton Pharmacy</SelectItem>
                                       <SelectItem value="wilmslow">Wilmslow Pharmacy</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>
                           )}
                           
                           <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                 <Label>Category</Label>
                                 <Select name="category" required defaultValue={CATEGORIES[0]}>
                                    <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                    <SelectContent>
                                       {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                 </Select>
                              </div>
                              <div className="grid gap-2">
                                 <Label>Severity</Label>
                                 <Select name="severity" required defaultValue="Medium">
                                    <SelectTrigger><SelectValue placeholder="Select Severity" /></SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="Low">Low</SelectItem>
                                       <SelectItem value="Medium">Medium</SelectItem>
                                       <SelectItem value="High">High</SelectItem>
                                       <SelectItem value="Critical">Critical</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>
                           </div>
                           
                           <div className="grid gap-2">
                              <Label>Title / Short Summary</Label>
                              <Input name="title" required placeholder="e.g. Fridge temperature out of range" />
                           </div>
                           
                           <div className="grid gap-2">
                              <Label>Detailed Description</Label>
                              <Textarea name="description" required rows={4} placeholder="Provide full details of what happened, immediate actions taken, and any parties involved." />
                           </div>
                           
                           <DialogFooter className="mt-4">
                              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                              <Button type="submit">Submit Report</Button>
                           </DialogFooter>
                        </form>
                     </DialogContent>
                  </Dialog>
               </div>
            </div>

            {/* Quick Filters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               <Card 
                  className={`p-3 border cursor-pointer transition-colors ${statusFilter === 'open' ? 'bg-primary/5 border-primary/30 shadow-sm' : 'hover:border-primary/30'}`}
                  onClick={() => setStatusFilter('open')}
               >
                  <div className="flex items-center justify-between mb-1">
                     <span className="text-xs font-semibold text-muted-foreground uppercase">All Open</span>
                     <Activity className="w-4 h-4 text-primary opacity-70" />
                  </div>
                  <div className="text-xl font-bold">{incidents.filter(i => (isHeadOffice || i.branchId === session.scope.pharmacyId) && i.status !== 'Closed').length}</div>
               </Card>
               
               <Card 
                  className={`p-3 border cursor-pointer transition-colors ${statusFilter === 'overdue' ? 'bg-rose-50 border-rose-200 shadow-sm' : 'hover:border-rose-200'}`}
                  onClick={() => setStatusFilter('overdue')}
               >
                  <div className="flex items-center justify-between mb-1">
                     <span className="text-xs font-semibold text-rose-600/80 uppercase">Overdue</span>
                     <Clock className="w-4 h-4 text-rose-500 opacity-70" />
                  </div>
                  <div className="text-xl font-bold text-rose-600">{incidents.filter(i => (isHeadOffice || i.branchId === session.scope.pharmacyId) && i.status !== 'Closed' && i.dueDate < Date.now()).length}</div>
               </Card>
               
               <Card 
                  className={`p-3 border cursor-pointer transition-colors ${statusFilter === 'ho_review' ? 'bg-purple-50 border-purple-200 shadow-sm' : 'hover:border-purple-200'}`}
                  onClick={() => setStatusFilter('ho_review')}
               >
                  <div className="flex items-center justify-between mb-1">
                     <span className="text-xs font-semibold text-purple-600/80 uppercase">Requires HO</span>
                     <ShieldAlert className="w-4 h-4 text-purple-500 opacity-70" />
                  </div>
                  <div className="text-xl font-bold text-purple-600">{incidents.filter(i => (isHeadOffice || i.branchId === session.scope.pharmacyId) && i.status === 'HO Review').length}</div>
               </Card>
               
               <Card 
                  className={`p-3 border cursor-pointer transition-colors ${statusFilter === 'closed' ? 'bg-slate-50 border-slate-200 shadow-sm' : 'hover:border-slate-200'}`}
                  onClick={() => setStatusFilter('closed')}
               >
                  <div className="flex items-center justify-between mb-1">
                     <span className="text-xs font-semibold text-slate-600/80 uppercase">Closed Cases</span>
                     <CheckCircle2 className="w-4 h-4 text-slate-500 opacity-70" />
                  </div>
                  <div className="text-xl font-bold text-slate-600">{incidents.filter(i => (isHeadOffice || i.branchId === session.scope.pharmacyId) && i.status === 'Closed').length}</div>
               </Card>
            </div>

            {/* List */}
            <div className="grid gap-3">
               {filteredIncidents.length === 0 ? (
                  <Card className="p-12 text-center border-dashed bg-muted/20">
                     <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                     <h3 className="font-semibold text-lg text-muted-foreground">No cases found</h3>
                     <p className="text-sm text-muted-foreground mt-1">There are no incidents matching your current filters.</p>
                  </Card>
               ) : (
                  filteredIncidents.map((inc) => {
                     const Icon = getCategoryIcon(inc.category);
                     const isOverdue = inc.status !== 'Closed' && inc.dueDate < Date.now();
                     
                     return (
                        <Card 
                           key={inc.id} 
                           className={`p-4 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-shadow group cursor-pointer border-l-4 ${isOverdue ? 'border-l-rose-500' : 'border-l-transparent'}`}
                           onClick={() => { setSelectedIncident(inc); setIsViewOpen(true); }}
                        >
                           <div className="flex items-start gap-4 mb-4 md:mb-0">
                              <div className={`p-2.5 rounded-xl shrink-0 mt-1 ${
                                 inc.status === 'Closed' ? 'bg-slate-100 text-slate-500' :
                                 inc.severity === 'Critical' ? 'bg-rose-100 text-rose-700' : 
                                 inc.severity === 'High' ? 'bg-orange-100 text-orange-600' : 
                                 inc.severity === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                 <Icon className="w-5 h-5" />
                              </div>
                              <div>
                                 <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                    <span className="text-xs font-mono text-muted-foreground font-medium">{inc.id}</span>
                                    {isHeadOffice && (
                                       <Badge variant="secondary" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                                          {inc.branch}
                                       </Badge>
                                    )}
                                    <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground">{inc.category}</Badge>
                                    {isOverdue && <Badge variant="destructive" className="text-[10px] uppercase h-5">Overdue</Badge>}
                                 </div>
                                 <h3 className="font-medium text-base group-hover:text-primary transition-colors leading-snug">{inc.title}</h3>
                                 <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {inc.owner}</span>
                                    <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> Due {format(inc.dueDate, "d MMM")}</span>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="flex items-center justify-between md:justify-end gap-6 md:w-auto w-full pt-2 md:pt-0 border-t md:border-0 border-border/50">
                              <div className="flex flex-col items-start md:items-end gap-1.5">
                                 <Badge className={`
                                    ${inc.status === 'Open' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                                    ${inc.status === 'Investigating' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                                    ${inc.status === 'HO Review' ? 'bg-purple-500 hover:bg-purple-600' : ''}
                                    ${inc.status === 'Waiting on Branch' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                                    ${inc.status === 'Closed' ? 'bg-slate-500 hover:bg-slate-600' : ''}
                                 `}>
                                    {inc.status}
                                 </Badge>
                                 <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                                    {inc.status !== 'Closed' && <Clock className="w-3 h-3" />}
                                    {inc.status === 'Closed' ? 'Resolved' : `${inc.daysOpen} days open`}
                                 </div>
                              </div>
                              <Button variant="ghost" size="icon" className="shrink-0 -mr-2 text-muted-foreground group-hover:text-primary group-hover:bg-primary/5">
                                 <ChevronRight className="w-5 h-5" />
                              </Button>
                           </div>
                        </Card>
                     )
                  })
               )}
            </div>
         </div>

         {/* VIEW / EDIT MODAL */}
         <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
               {selectedIncident && (
                  <>
                     <div className={`p-6 pb-4 border-b ${
                        selectedIncident.status === 'Closed' ? 'bg-slate-50/80' :
                        selectedIncident.severity === 'High' || selectedIncident.severity === 'Critical' ? 'bg-rose-50/50' : 'bg-muted/30'
                     }`}>
                        <div className="flex items-start justify-between gap-4 mb-3">
                           <div>
                              <div className="flex items-center gap-2 mb-2">
                                 <Badge variant="outline" className="font-mono bg-background shadow-sm">{selectedIncident.id}</Badge>
                                 <Badge variant="secondary" className={
                                    selectedIncident.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                                    selectedIncident.status === 'Investigating' ? 'bg-amber-100 text-amber-700' :
                                    selectedIncident.status === 'HO Review' ? 'bg-purple-100 text-purple-700' :
                                    selectedIncident.status === 'Closed' ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700'
                                 }>{selectedIncident.status}</Badge>
                                 <Badge variant="outline" className="text-muted-foreground bg-background">{selectedIncident.category}</Badge>
                              </div>
                              <DialogTitle className="text-xl leading-tight">{selectedIncident.title}</DialogTitle>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-sm">
                           <div>
                              <div className="text-muted-foreground text-xs mb-1 uppercase tracking-wider font-semibold">Branch</div>
                              <div className="font-medium truncate">{selectedIncident.branch}</div>
                           </div>
                           <div>
                              <div className="text-muted-foreground text-xs mb-1 uppercase tracking-wider font-semibold">Severity</div>
                              <div className="font-medium flex items-center gap-1">
                                 <div className={`w-2 h-2 rounded-full ${
                                    selectedIncident.severity === 'Critical' ? 'bg-rose-600' :
                                    selectedIncident.severity === 'High' ? 'bg-orange-500' :
                                    selectedIncident.severity === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'
                                 }`} />
                                 {selectedIncident.severity}
                              </div>
                           </div>
                           <div>
                              <div className="text-muted-foreground text-xs mb-1 uppercase tracking-wider font-semibold">Reported</div>
                              <div className="font-medium">{format(selectedIncident.createdAt, "d MMM yyyy")}</div>
                           </div>
                           <div>
                              <div className="text-muted-foreground text-xs mb-1 uppercase tracking-wider font-semibold">Owner</div>
                              <div className="font-medium">{selectedIncident.owner}</div>
                           </div>
                        </div>
                     </div>

                     <div className="p-6 max-h-[60vh] overflow-y-auto">
                        <div className="space-y-6">
                           <div>
                              <h4 className="font-semibold flex items-center gap-2 mb-2">
                                 <AlignLeft className="w-4 h-4 text-muted-foreground" /> Details
                              </h4>
                              <div className="text-sm bg-muted/20 p-4 rounded-xl border whitespace-pre-wrap">
                                 {selectedIncident.description}
                              </div>
                           </div>
                           
                           <div>
                              <h4 className="font-semibold flex items-center gap-2 mb-3">
                                 <MessageSquare className="w-4 h-4 text-muted-foreground" /> Updates & Audit Trail
                              </h4>
                              <div className="space-y-4 pl-2 border-l-2 border-muted ml-2">
                                 <div className="relative pl-6">
                                    <div className="absolute w-3 h-3 bg-muted rounded-full -left-[7px] top-1 border-2 border-background" />
                                    <div className="text-xs text-muted-foreground mb-0.5">
                                       {format(selectedIncident.createdAt, "d MMM HH:mm")} • <span className="font-medium text-foreground">{selectedIncident.createdBy}</span>
                                    </div>
                                    <div className="text-sm bg-background border rounded-lg p-2 mt-1 shadow-sm">
                                       Incident reported and logged.
                                    </div>
                                 </div>
                                 
                                 {selectedIncident.notes.map((note, i) => (
                                    <div key={i} className="relative pl-6">
                                       <div className="absolute w-3 h-3 bg-primary/20 rounded-full -left-[7px] top-1 border-2 border-background" />
                                       <div className="text-xs text-muted-foreground mb-0.5">
                                          {format(note.date, "d MMM HH:mm")} • <span className="font-medium text-foreground">{note.user}</span>
                                       </div>
                                       <div className="text-sm bg-background border rounded-lg p-2 mt-1 shadow-sm">
                                          {note.text}
                                       </div>
                                    </div>
                                 ))}
                              </div>
                              
                              {selectedIncident.status !== 'Closed' && (
                                 <div className="mt-6 flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-sm font-semibold">
                                       {session.staff?.name.charAt(0) || session.userEmail.charAt(0)}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                       <Textarea placeholder="Add an update or internal note..." className="min-h-[80px]" />
                                       <div className="flex justify-end">
                                          <Button size="sm">Add Update</Button>
                                       </div>
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                     
                     <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
                        {selectedIncident.status !== 'Closed' && isHeadOffice ? (
                           <div className="flex items-center gap-2">
                              <Select defaultValue={selectedIncident.status}>
                                 <SelectTrigger className="w-[180px] h-9">
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="Open">Open</SelectItem>
                                    <SelectItem value="Investigating">Investigating</SelectItem>
                                    <SelectItem value="Waiting on Branch">Waiting on Branch</SelectItem>
                                    <SelectItem value="HO Review">HO Review</SelectItem>
                                    <SelectItem value="Closed">Closed</SelectItem>
                                 </SelectContent>
                              </Select>
                              <Button variant="outline" size="sm">Update Status</Button>
                           </div>
                        ) : (
                           <div /> // spacer
                        )}
                        <Button variant="ghost" onClick={() => setIsViewOpen(false)}>Close Window</Button>
                     </div>
                  </>
               )}
            </DialogContent>
         </Dialog>
      </AppShell>
   );
}
