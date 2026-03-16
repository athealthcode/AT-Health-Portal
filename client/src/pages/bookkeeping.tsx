import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, ChevronRight, FileCheck, Lock, Unlock, X, AlertTriangle, Info, Clock, Building2 } from "lucide-react";
import { useAuth } from "@/state/auth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";

// Reordered template with MYS & In House first, and added descriptions
const FULL_TEMPLATE = [
  // MYS & In House
  { id: "mounjaro_csv", label: "Mounjaro CSV", group: "MYS & In House", required: true, description: "Upload the monthly Mounjaro dispensing CSV." },
  { id: "safety_report", label: "Safety Report", group: "MYS & In House", required: true, description: "Complete the patient safety report for the month." },
  { id: "national_safety_alert", label: "National Safety Alert", group: "MYS & In House", required: true, description: "Acknowledge and action any national safety alerts." },
  { id: "meeting_notes", label: "Meeting Notes", group: "MYS & In House", required: true, description: "Upload minutes from the monthly team meeting." },
  { id: "signposting_form", label: "Signposting Form", group: "MYS & In House", required: true, description: "Record signposting interactions for the month." },
  { id: "figures_submission", label: "Figures Submission", group: "MYS & In House", required: true, description: "Ensure all daily figures are submitted." },
  { id: "nms", label: "NMS", group: "MYS & In House", required: true, description: "Submit New Medicine Service claims via MYS." },
  { id: "ssp", label: "SSP", group: "MYS & In House", required: true, description: "Submit Serious Shortage Protocol claims." },
  { id: "dms", label: "DMS", group: "MYS & In House", required: true, description: "Discharge Medicines Service claims via MYS." },
  { id: "pharmacy_first", label: "Pharmacy First", group: "MYS & In House", required: true, description: "Submit Pharmacy First consultations via MYS." },
  { id: "contraceptive", label: "Contraceptive", group: "MYS & In House", required: true, description: "Submit Contraception service claims via MYS." },
  { id: "unpaid_items", label: "Unpaid Items", group: "MYS & In House", required: true, description: "Review and claim any unpaid prescription items." },
  { id: "covid", label: "COVID", group: "MYS & In House", required: true, description: "Submit COVID-19 vaccination claims." },
  { id: "flu", label: "Flu", group: "MYS & In House", required: true, description: "Submit NHS Flu vaccination claims." },
  { id: "child_flu", label: "Child Flu", group: "MYS & In House", required: true, description: "Submit Child Flu vaccination claims." },
  { id: "hypertension_case_finding", label: "Hypertension Case Finding", group: "MYS & In House", required: true, description: "Submit Hypertension service claims via MYS." },
  { id: "local_services_figures", label: "Local services on Figures", group: "MYS & In House", required: true, description: "Ensure local services match figures entered." },
  { id: "empty_stock_drawers", label: "Empty the Stock Drawers", group: "MYS & In House", required: true, description: "Complete the end-of-month stock drawer check." },
  { id: "end_of_month_posted", label: "End of Month Posted?", group: "MYS & In House", required: true, description: "Post end-of-month prescription bundle." },
  { id: "check_reclaimable", label: "Check RECLAIMABLE", group: "MYS & In House", required: true, description: "Check reclaimable prescriptions and items." },
  { id: "reconcile_credit_notes", label: "Reconcile credit notes", group: "MYS & In House", required: true, description: "Ensure all supplier credit notes are reconciled." },
  { id: "scriptlife_audit", label: "SCRIPTLIFE AUDIT AND - Remove Scripts", group: "MYS & In House", required: true, description: "Perform Scriptlife audit and remove old scripts." },
  { id: "check_spine_claim", label: "Check Spine and Claim", group: "MYS & In House", required: true, description: "Verify EPS claims against the Spine." },

  // Main Wholesalers
  { id: "aah305", label: "AAH305", group: "Main Wholesalers", description: "Download and save AAH305 monthly statement." },
  { id: "aah606", label: "AAH606", group: "Main Wholesalers", description: "Download and save AAH606 monthly statement." },
  { id: "alliance", label: "Alliance", group: "Main Wholesalers", description: "Download and save Alliance monthly statement." },
  { id: "bs", label: "B&S", group: "Main Wholesalers", description: "Download and save B&S monthly statement." },
  { id: "cavendish", label: "Cavendish", group: "Main Wholesalers", description: "Download and save Cavendish monthly statement." },
  { id: "eaststone", label: "EastStone (Manual)", group: "Main Wholesalers", description: "Download and save EastStone monthly statement." },
  { id: "lexon", label: "Lexon", group: "Main Wholesalers", description: "Download and save Lexon monthly statement." },
  { id: "medihealth", label: "MediHealth (Manual)", group: "Main Wholesalers", description: "Download and save MediHealth monthly statement." },
  { id: "numark", label: "Numark", group: "Main Wholesalers", description: "Download and save Numark monthly statement." },
  { id: "numark_benefit", label: "Numark Benefit", group: "Main Wholesalers", description: "Download and save Numark Benefit monthly statement." },
  { id: "nwos_agency", label: "NWOS Agency", group: "Main Wholesalers", description: "Download and save NWOS Agency monthly statement." },
  { id: "nwos_sales", label: "NWOS Sales", group: "Main Wholesalers", description: "Download and save NWOS Sales monthly statement." },
  { id: "phoenix", label: "Phoenix", group: "Main Wholesalers", description: "Download and save Phoenix monthly statement." },
  { id: "wardles", label: "Wardles", group: "Main Wholesalers", description: "Download and save Wardles monthly statement." },

  // Sales
  { id: "sales_sheet", label: "Sales Sheet", group: "Sales", description: "Export and save the monthly EPOS sales sheet." },
  { id: "cashing_up_sheet", label: "Cashing Up Sheet", group: "Sales", description: "Export the monthly Cashing Up summary." },
  { id: "patient_access", label: "Patient Access", group: "Sales", description: "Reconcile Patient Access sales." },
  { id: "dojo", label: "Dojo", group: "Sales", description: "Download the monthly Dojo transaction statement." },
  { id: "pharmoutcomes_mcc", label: "Pharmoutcomes (MCC)", group: "Sales", description: "Export Pharmoutcomes MCC report." },
  { id: "pharmoutcomes_gb", label: "Pharmoutcomes (GB)", group: "Sales", description: "Export Pharmoutcomes GB report." },
  { id: "private_clinic_report", label: "Private Clinic Report", group: "Sales", description: "Export the private clinic sales report." },

  // Others
  { id: "abbott", label: "Abbott", group: "Others", description: "Download Abbott statement." },
  { id: "amazon", label: "Amazon", group: "Others", description: "Download Amazon business statement." },
  { id: "atlsystems", label: "ATLSystems", group: "Others", description: "Download ATLSystems invoice." },
  { id: "barclay", label: "Barclay", group: "Others", description: "Download Barclaycard statement." },
  { id: "bnp_leasing", label: "BNP Leasing", group: "Others", description: "Download BNP Leasing invoice." },
  { id: "britannia", label: "Britannia", group: "Others", description: "Download Britannia invoice." },
  { id: "business_waste", label: "Business Waste", group: "Others", description: "Download Business Waste invoice." },
  { id: "drugcomparison", label: "DrugComparison", group: "Others", description: "Download DrugComparison invoice." },
  { id: "easylogcloud", label: "EasylogCloud", group: "Others", description: "Download EasylogCloud invoice." },
  { id: "emis_optum", label: "EMIS/Optum", group: "Others", description: "Download EMIS/Optum invoice." },
  { id: "emt", label: "EMT", group: "Others", description: "Download EMT invoice." },
  { id: "googleads", label: "GoogleAds", group: "Others", description: "Download Google Ads invoice." },
  { id: "microsoft_office", label: "Microsoft Office", group: "Others", description: "Download Microsoft Office invoice." },
  { id: "octopus", label: "Octopus", group: "Others", description: "Download Octopus energy invoice." },
  { id: "pharmdel", label: "PharmDel", group: "Others", description: "Download PharmDel invoice." },
  { id: "pharmsmart", label: "PharmSmart", group: "Others", description: "Download PharmSmart invoice." },
  { id: "sanofi", label: "Sanofi", group: "Others", description: "Download Sanofi invoice." },
  { id: "three", label: "Three", group: "Others", description: "Download Three network invoice." },
  { id: "verisure", label: "Verisure", group: "Others", description: "Download Verisure invoice." },
  { id: "worldpay", label: "Worldpay", group: "Others", description: "Download Worldpay statement." },
  { id: "xero", label: "Xero", group: "Others", description: "Download Xero subscription invoice." },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

// ItemState: 'completed' (ticked), 'not_used' (crossed), 'pending' (blank)
type ItemState = 'completed' | 'not_used' | 'pending';

type ChecklistEntry = {
  itemId: string;
  state: ItemState;
  completedBy?: string;
  completedAt?: number;
  saved: boolean; // Indicates if this entry has been committed/saved
};

type TemplateItem = {
  id: string;
  label: string;
  group: string;
  required?: boolean;
  description?: string;
};

export default function Bookkeeping() {
  const { session } = useAuth();
  const { toast } = useToast();
  
  const currentYear = new Date().getFullYear().toString();
  const currentMonthIdx = new Date().getMonth();
  const currentMonth = MONTHS[currentMonthIdx];
  
  const [year, setYear] = useState<string>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  
  const [checklistData, setChecklistData] = useState<Record<string, ChecklistEntry>>({});
  const [lockedMonths, setLockedMonths] = useState<string[]>([]);
  
  const [saveWarningOpen, setSaveWarningOpen] = useState(false);
  
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format as London GMT
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      setCurrentTime(formatter.format(now) + ' (GMT)');
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load from local storage
  useEffect(() => {
     const savedData = localStorage.getItem('bookkeeping_data_v2');
     if (savedData) setChecklistData(JSON.parse(savedData));
     
     const savedLocks = localStorage.getItem('bookkeeping_locks_v2');
     if (savedLocks) setLockedMonths(JSON.parse(savedLocks));
  }, []);

  const saveToStorage = (data: any, locks: any) => {
     localStorage.setItem('bookkeeping_data_v2', JSON.stringify(data));
     localStorage.setItem('bookkeeping_locks_v2', JSON.stringify(locks));
  };

  const isHeadOffice = session.scope.type === "headoffice";
  const monthKey = `${year}-${selectedMonth}`;
  const isLocked = lockedMonths.includes(monthKey);
  const isHistoric = (year < currentYear) || (year === currentYear && MONTHS.indexOf(selectedMonth) < currentMonthIdx);
  const isFuture = (year > currentYear) || (year === currentYear && MONTHS.indexOf(selectedMonth) > currentMonthIdx);
  
  // Can interact if:
  // Head Office -> Always yes (unless future)
  // Pharmacy -> Yes if month is not locked AND it's not a future month
  const canInteractMonth = (isHeadOffice || !isLocked) && !isFuture;

  const handleStateCycle = (itemId: string, itemRequired: boolean) => {
    if (!canInteractMonth) return;
    
    const key = `${monthKey}-${itemId}`;
    const entry = checklistData[key] || { itemId, state: 'pending', saved: false };
    
    // If it's saved and we're not Head Office, we can't change it
    if (entry.saved && !isHeadOffice) return;

    setChecklistData(prev => {
      let nextState: ItemState = 'pending';
      
      // Cycle: pending -> completed -> not_used -> pending
      // If required, cycle: pending -> completed -> pending (skip not_used)
      if (entry.state === 'pending') {
         nextState = 'completed';
      } else if (entry.state === 'completed') {
         nextState = itemRequired ? 'pending' : 'not_used';
      } else if (entry.state === 'not_used') {
         nextState = 'pending';
      }
      
      const next = {
        ...prev,
        [key]: {
          itemId,
          state: nextState,
          completedBy: nextState !== 'pending' ? session.staff?.name || session.userEmail : undefined,
          completedAt: nextState !== 'pending' ? Date.now() : undefined,
          saved: entry.saved // Preserve saved status
        }
      };
      
      return next;
    });
  };

  const handleSaveItems = () => {
     setChecklistData(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
           if (k.startsWith(`${monthKey}-`) && next[k].state !== 'pending') {
              next[k].saved = true;
           }
        });
        saveToStorage(next, lockedMonths);
        return next;
     });
     
     setSaveWarningOpen(false);
     toast({ title: "Progress Saved", description: "Marked items have been saved for this month." });
  };

  const handleLockMonth = () => {
     if (isLocked) {
        // Unlock (Head Office Only)
        if (!isHeadOffice) return;
        const next = lockedMonths.filter(m => m !== monthKey);
        setLockedMonths(next);
        saveToStorage(checklistData, next);
        toast({ title: "Month Unlocked", description: "Edits can now be made." });
     } else {
        // Enforce all mandatory items are 'completed'
        const mandatoryItems = FULL_TEMPLATE.filter(i => i.required);
        const missing = mandatoryItems.some(i => {
           const entry = checklistData[`${monthKey}-${i.id}`];
           return !entry || entry.state !== 'completed';
        });
        
        if (missing) {
           toast({ title: "Cannot Lock Month", description: "All MYS & In House items must be completed before locking the month.", variant: "destructive" });
           return;
        }

        // Lock
        const next = [...lockedMonths, monthKey];
        setLockedMonths(next);
        saveToStorage(checklistData, next);
        toast({ title: "Month Locked", description: "This month is now read-only." });
     }
  };

  const groupedItems = useMemo(() => {
    const groups: Record<string, TemplateItem[]> = {};
    const orderedGroups = ["MYS & In House", "Main Wholesalers", "Sales", "Others"];
    orderedGroups.forEach(g => groups[g] = []);
    FULL_TEMPLATE.forEach(item => groups[item.group].push(item));
    return groups;
  }, []);

  const progressCalc = useMemo(() => {
    const total = FULL_TEMPLATE.length;
    const completed = FULL_TEMPLATE.filter(i => {
       const state = checklistData[`${monthKey}-${i.id}`]?.state;
       return state === 'completed' || state === 'not_used';
    }).length;
    
    // Also calc section progress
    const sectionProgress: Record<string, number> = {};
    Object.entries(groupedItems).forEach(([group, items]) => {
       const sectionTotal = items.length;
       const sectionCompleted = items.filter(i => {
          const state = checklistData[`${monthKey}-${i.id}`]?.state;
          return state === 'completed' || state === 'not_used';
       }).length;
       sectionProgress[group] = Math.round((sectionCompleted / sectionTotal) * 100);
    });

    return {
       overall: Math.round((completed / total) * 100),
       sections: sectionProgress
    };
  }, [checklistData, monthKey, groupedItems]);

  return (
    <AppShell>
      <div className="flex flex-col gap-5 h-[calc(100vh-140px)]">
        <div className="flex justify-between items-end">
          <div>
            <div className="font-serif text-2xl tracking-tight">Bookkeeping Checklist</div>
            <div className="text-sm text-muted-foreground">
              Monthly compliance tracking. Click to toggle state.
            </div>
          </div>
          <div className="text-right">
             <div className="text-sm font-medium">{session.staff?.name || session.userEmail}</div>
             <div className="text-xs text-muted-foreground font-mono flex items-center justify-end gap-1 mt-0.5">
                <Clock className="h-3 w-3" /> {currentTime}
             </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[250px_1fr] gap-6 h-full overflow-hidden">
          {/* Sidebar */}
          <Card className="rounded-2xl border bg-card/60 flex flex-col h-full overflow-hidden shadow-sm">
             <div className="p-4 border-b">
                <Select value={year} onValueChange={setYear}>
                   <SelectTrigger><SelectValue /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                   </SelectContent>
                </Select>
             </div>
             <ScrollArea className="flex-1">
                <div className="p-2 grid gap-1">
                   {MONTHS.map((month, idx) => {
                      const isCurrent = month === currentMonth && year === currentYear;
                      const isFut = (year > currentYear) || (year === currentYear && idx > currentMonthIdx);
                      return (
                         <Button
                            key={month}
                            variant={selectedMonth === month ? "secondary" : "ghost"}
                            className={`justify-between w-full font-normal ${selectedMonth === month ? "bg-primary/10 text-primary hover:bg-primary/15" : ""} ${isCurrent ? "font-semibold" : ""} ${isFut ? "opacity-30 text-muted-foreground pointer-events-none" : ""}`}
                            onClick={() => !isFut && setSelectedMonth(month)}
                            disabled={isFut}
                         >
                            {month} {isCurrent && <span className="text-[10px] ml-1 opacity-50">(Current)</span>}
                            {selectedMonth === month && <ChevronRight className="h-4 w-4 opacity-50" />}
                         </Button>
                      )
                   })}
                </div>
             </ScrollArea>
          </Card>

          {/* Main List */}
          <Card className="rounded-2xl border bg-card/60 flex flex-col h-full overflow-hidden shadow-sm">
             <div className="flex items-center justify-between p-6 border-b shrink-0 bg-background/50">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {isLocked ? <Lock className="h-6 w-6" /> : <FileCheck className="h-6 w-6" />}
                   </div>
                   <div>
                      <div className="font-semibold text-lg flex items-center gap-2">
                         {selectedMonth} {year}
                         {isLocked && <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">LOCKED</Badge>}
                         {!isLocked && isHistoric && <Badge variant="outline" className="text-muted-foreground">Historical</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                         <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressCalc.overall}%` }} />
                         </div>
                         <span className="font-medium">{progressCalc.overall}% Complete</span>
                      </div>
                   </div>
                </div>
                
                <div className="flex items-center gap-3">
                   {/* Actions */}
                   {!isLocked && canInteractMonth && (
                      <Dialog open={saveWarningOpen} onOpenChange={setSaveWarningOpen}>
                         <DialogTrigger asChild>
                            <Button variant="secondary" className="border-primary/20 hover:bg-primary/5">
                               Save Progress
                            </Button>
                         </DialogTrigger>
                         <DialogContent>
                            <DialogHeader>
                               <DialogTitle>Double check all your entries</DialogTitle>
                               <DialogDescription>
                                  Saving will commit the currently ticked and marked items. For pharmacy users, saved items cannot be edited later.
                               </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                               <Button variant="outline" onClick={() => setSaveWarningOpen(false)}>Cancel</Button>
                               <Button onClick={handleSaveItems}>Confirm Save</Button>
                            </DialogFooter>
                         </DialogContent>
                      </Dialog>
                   )}

                   {(isHeadOffice || canInteractMonth) && !isFuture && (
                      <Button 
                         variant={isLocked ? "outline" : "default"} 
                         onClick={handleLockMonth}
                         disabled={isLocked && !isHeadOffice}
                         className={isLocked ? "border-amber-500/50 text-amber-600 hover:bg-amber-50" : ""}
                      >
                         {isLocked ? <><Unlock className="h-4 w-4 mr-2" /> Unlock Month</> : <><Lock className="h-4 w-4 mr-2" /> Lock Month</>}
                      </Button>
                   )}
                </div>
             </div>
             
             <ScrollArea className="flex-1">
                <div className="p-6 space-y-6">
                   {isFuture ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 py-12">
                         <Lock className="h-12 w-12 mb-4" />
                         <p>Future months cannot be edited.</p>
                      </div>
                   ) : (
                      Object.entries(groupedItems).map(([group, items]) => (
                         <Collapsible key={group} defaultOpen className="space-y-2">
                            <CollapsibleTrigger className="flex items-center justify-between w-full border-b pb-2 mb-3 bg-card/95 hover:bg-muted/50 transition-colors rounded-t-lg group-trigger cursor-pointer">
                               <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 px-1">
                                  <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                                  {group}
                               </div>
                               <div className="text-xs font-medium text-muted-foreground pr-2">
                                  {progressCalc.sections[group]}%
                               </div>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                               <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                                  {items.map(item => {
                                     const key = `${monthKey}-${item.id}`;
                                     const entry = checklistData[key] || { state: 'pending', saved: false };
                                     const isSaved = entry.saved && !isHeadOffice;
                                     const isReadOnly = isLocked || isSaved;

                                     return (
                                        <div key={item.id} className={`flex items-center py-1.5 px-2 rounded-lg transition-colors hover:bg-muted/50 ${entry.state === 'completed' ? 'bg-primary/5' : entry.state === 'not_used' ? 'bg-amber-500/5' : ''}`}>
                                           <button
                                              type="button"
                                              disabled={isReadOnly}
                                              onClick={() => handleStateCycle(item.id, !!item.required)}
                                              className={`flex items-center justify-center w-5 h-5 rounded border mr-3 shrink-0 transition-all ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${entry.state === 'completed' ? 'bg-emerald-500 border-emerald-500 text-white' : entry.state === 'not_used' ? 'bg-amber-400 border-amber-400 text-amber-950' : 'border-input hover:border-primary'}`}
                                           >
                                              {entry.state === 'completed' && <CheckCircle2 className="h-3.5 w-3.5" />}
                                              {entry.state === 'not_used' && <X className="h-3.5 w-3.5" />}
                                           </button>
                                           <TooltipProvider>
                                              <Tooltip delayDuration={300}>
                                                 <TooltipTrigger asChild>
                                                    <div className="flex-1 min-w-0 flex items-center justify-between cursor-help">
                                                       <span className={`text-sm truncate ${entry.state === 'pending' ? 'font-medium' : entry.state === 'completed' ? 'text-emerald-700 font-medium' : 'text-amber-700/70 line-through'}`}>
                                                          {item.label}
                                                       </span>
                                                       <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                          {item.required && <span className="text-[10px] text-destructive font-bold">*</span>}
                                                          {isHeadOffice && item.description && (
                                                             <Info className="h-3 w-3 text-muted-foreground opacity-50 hover:opacity-100" />
                                                          )}
                                                       </div>
                                                    </div>
                                                 </TooltipTrigger>
                                                 <TooltipContent side="bottom" className="max-w-[250px] text-xs">
                                                    {item.description || item.label}
                                                 </TooltipContent>
                                              </Tooltip>
                                           </TooltipProvider>
                                        </div>
                                     );
                                  })}
                               </div>
                            </CollapsibleContent>
                         </Collapsible>
                      ))
                   )}
                </div>
             </ScrollArea>
             
             <div className="p-3 bg-muted/30 border-t flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground shrink-0">
                <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-emerald-500 flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-white"/></div> = Received/Complete</div>
                <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-amber-400 border border-amber-400 flex items-center justify-center"><X className="w-3 h-3 text-amber-950"/></div> = Not used this month</div>
                <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded border border-input bg-card"></div> = Not done</div>
                <div className="flex items-center gap-1.5 text-destructive ml-4 font-medium">* = Mandatory</div>
             </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
