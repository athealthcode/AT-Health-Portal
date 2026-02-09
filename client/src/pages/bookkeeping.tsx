import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CheckCircle2, ChevronRight, FileCheck, Edit, Plus, Trash2, Lock, Unlock } from "lucide-react";
import { useAuth } from "@/state/auth";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Full Template from Checklist
const FULL_TEMPLATE = [
  // Main Wholesalers
  { id: "aah305", label: "AAH305", group: "Main Wholesalers" },
  { id: "aah606", label: "AAH606", group: "Main Wholesalers" },
  { id: "alliance", label: "Alliance", group: "Main Wholesalers" },
  { id: "bs", label: "B&S", group: "Main Wholesalers" },
  { id: "cavendish", label: "Cavendish", group: "Main Wholesalers" },
  { id: "eaststone", label: "EastStone (Manual)", group: "Main Wholesalers" },
  { id: "lexon", label: "Lexon", group: "Main Wholesalers" },
  { id: "medihealth", label: "MediHealth (Manual)", group: "Main Wholesalers" },
  { id: "numark", label: "Numark", group: "Main Wholesalers" },
  { id: "numark_benefit", label: "Numark Benefit", group: "Main Wholesalers" },
  { id: "nwos_agency", label: "NWOS Agency", group: "Main Wholesalers" },
  { id: "nwos_sales", label: "NWOS Sales", group: "Main Wholesalers" },
  { id: "phoenix", label: "Phoenix", group: "Main Wholesalers" },
  { id: "wardles", label: "Wardles", group: "Main Wholesalers" },

  // Sales
  { id: "sales_sheet", label: "Sales Sheet", group: "Sales" },
  { id: "cashing_up_sheet", label: "Cashing Up Sheet", group: "Sales" },
  { id: "patient_access", label: "Patient Access", group: "Sales" },
  { id: "dojo", label: "Dojo", group: "Sales" },
  { id: "pharmoutcomes_mcc", label: "Pharmoutcomes (MCC)", group: "Sales" },
  { id: "pharmoutcomes_gb", label: "Pharmoutcomes (GB)", group: "Sales" },
  { id: "private_clinic_report", label: "Private Clinic Report", group: "Sales" },

  // Others
  { id: "abbott", label: "Abbott", group: "Others" },
  { id: "amazon", label: "Amazon", group: "Others" },
  { id: "atlsystems", label: "ATLSystems", group: "Others" },
  { id: "barclay", label: "Barclay", group: "Others" },
  { id: "bnp_leasing", label: "BNP Leasing", group: "Others" },
  { id: "britannia", label: "Britannia", group: "Others" },
  { id: "business_waste", label: "Business Waste", group: "Others" },
  { id: "drugcomparison", label: "DrugComparison", group: "Others" },
  { id: "easylogcloud", label: "EasylogCloud", group: "Others" },
  { id: "emis_optum", label: "EMIS/Optum", group: "Others" },
  { id: "emt", label: "EMT", group: "Others" },
  { id: "googleads", label: "GoogleAds", group: "Others" },
  { id: "microsoft_office", label: "Microsoft Office", group: "Others" },
  { id: "octopus", label: "Octopus", group: "Others" },
  { id: "pharmdel", label: "PharmDel", group: "Others" },
  { id: "pharmsmart", label: "PharmSmart", group: "Others" },
  { id: "sanofi", label: "Sanofi", group: "Others" },
  { id: "three", label: "Three", group: "Others" },
  { id: "verisure", label: "Verisure", group: "Others" },
  { id: "worldpay", label: "Worldpay", group: "Others" },
  { id: "xero", label: "Xero", group: "Others" },

  // MYS & In House
  { id: "mounjaro_csv", label: "Mounjaro CSV", group: "MYS & In House" },
  { id: "safety_report", label: "Safety Report", group: "MYS & In House" },
  { id: "national_safety_alert", label: "National Safety Alert", group: "MYS & In House" },
  { id: "meeting_notes", label: "Meeting Notes", group: "MYS & In House" },
  { id: "signposting_form", label: "Signposting Form", group: "MYS & In House" },
  { id: "figures_submission", label: "Figures Submission", group: "MYS & In House" },
  { id: "nms", label: "NMS", group: "MYS & In House" },
  { id: "ssp", label: "SSP", group: "MYS & In House" },
  { id: "dms", label: "DMS", group: "MYS & In House" },
  { id: "pharmacy_first", label: "Pharmacy First", group: "MYS & In House" },
  { id: "contraceptive", label: "Contraceptive", group: "MYS & In House" },
  { id: "unpaid_items", label: "Unpaid Items", group: "MYS & In House" },
  { id: "covid", label: "COVID", group: "MYS & In House" },
  { id: "flu", label: "Flu", group: "MYS & In House" },
  { id: "child_flu", label: "Child Flu", group: "MYS & In House" },
  { id: "hypertension_case_finding", label: "Hypertension Case Finding", group: "MYS & In House" },
  { id: "local_services_figures", label: "Local services on Figures", group: "MYS & In House" },
  { id: "empty_stock_drawers", label: "Empty the Stock Drawers", group: "MYS & In House" },
  { id: "end_of_month_posted", label: "End of Month Posted?", group: "MYS & In House" },
  { id: "check_reclaimable", label: "Check RECLAIMABLE", group: "MYS & In House" },
  { id: "reconcile_credit_notes", label: "Reconcile credit notes", group: "MYS & In House" },
  { id: "scriptlife_audit", label: "SCRIPTLIFE AUDIT AND - Remove Scripts", group: "MYS & In House" },
  { id: "check_spine_claim", label: "Check Spine and Claim", group: "MYS & In House" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

type ChecklistEntry = {
  itemId: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: number;
  note?: string;
};

type TemplateItem = {
  id: string;
  label: string;
  group: string;
};

export default function Bookkeeping() {
  const { session } = useAuth();
  const { toast } = useToast();
  
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  
  // Mock Template State (In-memory) - Head Office can edit this
  const [template, setTemplate] = useState<TemplateItem[]>(FULL_TEMPLATE);
  const [checklistData, setChecklistData] = useState<Record<string, ChecklistEntry>>({});
  const [lockedMonths, setLockedMonths] = useState<string[]>([]);

  // Template Editor State
  const [editMode, setEditMode] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemGroup, setNewItemGroup] = useState("General");

  // Load from local storage on mount (simulation)
  useEffect(() => {
     const savedData = localStorage.getItem('bookkeeping_data');
     if (savedData) setChecklistData(JSON.parse(savedData));
     
     const savedLocks = localStorage.getItem('bookkeeping_locks');
     if (savedLocks) setLockedMonths(JSON.parse(savedLocks));
  }, []);

  const saveToStorage = (data: any, locks: any) => {
     localStorage.setItem('bookkeeping_data', JSON.stringify(data));
     localStorage.setItem('bookkeeping_locks', JSON.stringify(locks));
  };

  const isHeadOffice = session.scope.type === "headoffice";
  const monthKey = `${year}-${selectedMonth}`;
  const isLocked = lockedMonths.includes(monthKey);

  const toggleItem = (itemId: string) => {
    if (editMode || isLocked) return;
    const key = `${monthKey}-${itemId}`;
    
    setChecklistData(prev => {
      const current = prev[key];
      let next;
      if (current?.completed) {
        next = { ...prev };
        delete next[key];
      } else {
        next = {
          ...prev,
          [key]: {
            itemId,
            completed: true,
            completedBy: session.staff?.name || "Unknown Staff",
            completedAt: Date.now(),
            note: ""
          }
        };
      }
      saveToStorage(next, lockedMonths);
      return next;
    });
  };

  const updateNote = (itemId: string, note: string) => {
    if (editMode || isLocked) return;
    const key = `${monthKey}-${itemId}`;
    setChecklistData(prev => {
      const next = {
        ...prev,
        [key]: {
          ...(prev[key] || { itemId, completed: false, completedBy: session.staff?.name }),
          note
        }
      };
      saveToStorage(next, lockedMonths);
      return next;
    });
  };

  const handleLock = () => {
     if (isLocked) {
        // Unlock (Head Office Only)
        if (!isHeadOffice) return;
        const next = lockedMonths.filter(m => m !== monthKey);
        setLockedMonths(next);
        saveToStorage(checklistData, next);
        toast({ title: "Month Unlocked", description: "Edits can now be made." });
     } else {
        // Lock
        const next = [...lockedMonths, monthKey];
        setLockedMonths(next);
        saveToStorage(checklistData, next);
        toast({ title: "Month Locked", description: "This month is now read-only." });
     }
  };

  // Add Item to Template
  const addTemplateItem = () => {
     if (!newItemLabel) return;
     setTemplate(prev => [...prev, {
        id: `custom_${Date.now()}`,
        label: newItemLabel,
        group: newItemGroup
     }]);
     setNewItemLabel("");
     toast({ title: "Item Added", description: "Template updated for all branches." });
  };

  // Remove Item from Template
  const removeTemplateItem = (id: string) => {
     setTemplate(prev => prev.filter(i => i.id !== id));
  };

  const groupedItems = useMemo(() => {
    const groups: Record<string, TemplateItem[]> = {};
    // Ensure groups appear in correct order
    const orderedGroups = ["Main Wholesalers", "Sales", "Others", "MYS & In House", "General"];
    
    // Initialize
    orderedGroups.forEach(g => groups[g] = []);
    
    template.forEach(item => {
      groups[item.group] ||= [];
      groups[item.group].push(item);
    });
    
    // Clean up empty
    Object.keys(groups).forEach(key => {
       if (groups[key].length === 0) delete groups[key];
    });

    return groups;
  }, [template]);

  const progress = useMemo(() => {
    const completedCount = template.filter(i => checklistData[`${monthKey}-${i.id}`]?.completed).length;
    return Math.round((completedCount / template.length) * 100);
  }, [checklistData, monthKey, template]);

  return (
    <AppShell>
      <div className="flex flex-col gap-5 h-[calc(100vh-140px)]">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-serif text-2xl tracking-tight">Bookkeeping Checklist</div>
            <div className="text-sm text-muted-foreground">
              Monthly compliance and task tracking.
            </div>
          </div>
          
          <div className="flex gap-2">
             {isHeadOffice && (
               <Button variant={editMode ? "secondary" : "outline"} onClick={() => setEditMode(!editMode)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {editMode ? "Done Editing" : "Edit Template"}
               </Button>
             )}
          </div>
        </div>

        <div className="grid lg:grid-cols-[250px_1fr] gap-6 h-full overflow-hidden">
          {/* Sidebar / Navigation */}
          <Card className="rounded-2xl border bg-card/60 flex flex-col h-full overflow-hidden">
             <div className="p-4 border-b">
                <Select value={year} onValueChange={setYear}>
                   <SelectTrigger>
                      <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                   </SelectContent>
                </Select>
             </div>
             <ScrollArea className="flex-1">
                <div className="p-2 grid gap-1">
                   {MONTHS.map(month => (
                      <Button
                         key={month}
                         variant={selectedMonth === month ? "secondary" : "ghost"}
                         className={`justify-between w-full font-normal ${selectedMonth === month ? "bg-primary/10 text-primary hover:bg-primary/15" : ""}`}
                         onClick={() => setSelectedMonth(month)}
                      >
                         {month}
                         {selectedMonth === month && <ChevronRight className="h-4 w-4 opacity-50" />}
                      </Button>
                   ))}
                </div>
             </ScrollArea>
          </Card>

          {/* Checklist Content */}
          <Card className="rounded-2xl border bg-card/60 flex flex-col h-full overflow-hidden">
             <div className="flex items-center justify-between p-6 border-b shrink-0">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {isLocked ? <Lock className="h-5 w-5" /> : <FileCheck className="h-5 w-5" />}
                   </div>
                   <div>
                      <div className="font-semibold text-lg flex items-center gap-2">
                         {selectedMonth} {year}
                         {isLocked && <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">LOCKED</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                         <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                         </div>
                         <span className="font-medium">{progress}%</span>
                      </div>
                   </div>
                </div>
                
                <div className="flex items-center gap-2">
                   {!editMode && (
                      <Button 
                         variant={isLocked ? "outline" : "default"} 
                         onClick={handleLock}
                         disabled={isLocked && !isHeadOffice}
                         className={isLocked ? "border-amber-500/50 text-amber-600 hover:bg-amber-50" : ""}
                      >
                         {isLocked ? <><Unlock className="h-4 w-4 mr-2" /> Unlock Month</> : <><Lock className="h-4 w-4 mr-2" /> Save & Lock</>}
                      </Button>
                   )}

                   {editMode && (
                      <Dialog>
                         <DialogTrigger asChild>
                            <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
                         </DialogTrigger>
                         <DialogContent>
                            <DialogHeader><DialogTitle>Add Template Item</DialogTitle></DialogHeader>
                            <div className="grid gap-4 py-4">
                               <div className="grid gap-2">
                                  <Label>Item Name</Label>
                                  <Input value={newItemLabel} onChange={e => setNewItemLabel(e.target.value)} />
                               </div>
                               <div className="grid gap-2">
                                  <Label>Group</Label>
                                  <Select value={newItemGroup} onValueChange={setNewItemGroup}>
                                     <SelectTrigger><SelectValue /></SelectTrigger>
                                     <SelectContent>
                                        <SelectItem value="Main Wholesalers">Main Wholesalers</SelectItem>
                                        <SelectItem value="Sales">Sales</SelectItem>
                                        <SelectItem value="Others">Others</SelectItem>
                                        <SelectItem value="MYS & In House">MYS & In House</SelectItem>
                                        <SelectItem value="General">General</SelectItem>
                                     </SelectContent>
                                  </Select>
                               </div>
                            </div>
                            <DialogFooter><Button onClick={addTemplateItem}>Add</Button></DialogFooter>
                         </DialogContent>
                      </Dialog>
                   )}
                </div>
             </div>
             
             <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                   {Object.entries(groupedItems).map(([group, items]) => (
                      <div key={group} className="space-y-3">
                         <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2 sticky top-0 bg-card/95 backdrop-blur z-10">
                            {group}
                         </div>
                         <div className="grid gap-3 lg:grid-cols-2">
                            {items.map(item => {
                               const key = `${monthKey}-${item.id}`;
                               const entry = checklistData[key];
                               const isChecked = !!entry?.completed;

                               return (
                                  <div 
                                     key={item.id} 
                                     className={`group rounded-xl border p-3 transition-all ${isChecked ? "bg-primary/5 border-primary/20" : "bg-background/40 hover:border-primary/20"}`}
                                  >
                                     <div className="flex items-start gap-3">
                                        {!editMode && (
                                           <Checkbox 
                                              id={item.id} 
                                              checked={isChecked}
                                              disabled={isLocked}
                                              onCheckedChange={() => toggleItem(item.id)}
                                              className="mt-1"
                                           />
                                        )}
                                        
                                        <div className="flex-1 space-y-1.5 min-w-0">
                                           <div className="flex items-start justify-between">
                                              <Label 
                                                 htmlFor={item.id} 
                                                 className={`text-sm font-medium leading-tight break-words ${isLocked ? "" : "cursor-pointer"}`}
                                              >
                                                 {item.label}
                                              </Label>
                                              
                                              <div className="flex items-center gap-2 shrink-0">
                                                 {isChecked && !editMode && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-background/50 whitespace-nowrap">
                                                       <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                                                       {entry.completedBy}
                                                    </Badge>
                                                 )}
                                                 
                                                 {editMode && (
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => removeTemplateItem(item.id)}>
                                                       <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                 )}
                                              </div>
                                           </div>
                                           
                                           {!editMode && (
                                              <div className="relative">
                                                 <Input 
                                                    placeholder="Add optional note..." 
                                                    className="h-8 text-xs bg-transparent border-transparent hover:border-input focus:border-input focus:bg-background transition-all px-2"
                                                    value={entry?.note || ""}
                                                    disabled={isLocked}
                                                    onChange={e => updateNote(item.id, e.target.value)}
                                                 />
                                              </div>
                                           )}
                                        </div>
                                     </div>
                                  </div>
                               );
                            })}
                         </div>
                      </div>
                   ))}
                </div>
             </ScrollArea>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
