import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, FileText, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, Edit2, Calendar, Lock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isFuture } from "date-fns";
import { useAuth } from "@/state/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type ServiceField = { key: string; label: string; group: string; isCurrency?: boolean; subGroup?: string };

const PRESCRIPTION_FIELDS = [
  { type: "Paid", epsKey: "eps_rx_paid", paperKey: "paper_rx_paid", label: "Prescriptions (Rx)" },
  { type: "Exempt", epsKey: "eps_rx_exempt", paperKey: "paper_rx_exempt", label: "Prescriptions (Rx)" },
  { type: "Paid", epsKey: "eps_items_paid", paperKey: "paper_items_paid", label: "Items" },
  { type: "Exempt", epsKey: "eps_items_exempt", paperKey: "paper_items_exempt", label: "Items" },
];

const OTHER_FIELDS: ServiceField[] = [
  { key: "ssp", label: "SSP", group: "Figures" },
  { key: "nhs_prepayment", label: "NHS Prepayment (£)", group: "Figures", isCurrency: true },
  { key: "fp57_refund", label: "FP57 Refund (£)", group: "Figures", isCurrency: true },
  { key: "nms_intervention", label: "NMS Intervention", group: "NMS" },
  { key: "nms_follow_up", label: "NMS Follow-up", group: "NMS" },
  { key: "dms_stage_1", label: "Stage 1", group: "DMS" },
  { key: "dms_stage_2", label: "Stage 2", group: "DMS" },
  { key: "dms_stage_3", label: "Stage 3", group: "DMS" },
  { key: "hypertension_case", label: "Case Finding", group: "Hypertension" },
  { key: "abpm_fitting", label: "ABPM Fitting", group: "Hypertension" },
  { key: "oral_contraception", label: "Oral Contraception", group: "Contraception" },
  { key: "emergency_contraception", label: "Emergency Contraception", group: "Contraception" },
  { key: "flu", label: "Flu", group: "Vaccinations" },
  { key: "covid", label: "COVID", group: "Vaccinations" },
  { key: "mas", label: "Minor Ailments Supply", group: "Local Services" },
  { key: "needle_syringe", label: "Needle & Syringe Supply", group: "Local Services" },
  { key: "naloxone", label: "Naloxone Supply", group: "Local Services" },
  { key: "supervised_consumption", label: "Supervised Consumption", group: "Local Services" },
  { key: "lfd", label: "Lateral Flow Device", group: "Local Services" },
];

function normalizeInt(v: string) {
  if (v === "") return "";
  const n = Number.parseInt(v.replace(/[^0-9-]/g, ""), 10);
  if (!Number.isFinite(n)) return "";
  return n;
}

function normalizeFloat(v: string) {
  if (v === "") return "";
  return v.replace(/[^0-9.]/g, "");
}

export default function DailyFigures() {
  const { toast } = useToast();
  const { session } = useAuth();
  
  // Custom mock data hook for historical view
  const [submittedData, setSubmittedData] = useState<Record<string, any>>({
     "2026-03-01": { 
        user: "John Smith", 
        timestamp: new Date().getTime() - 86400000, 
        values: { eps_rx_paid: 120, eps_rx_exempt: 340, paper_rx_paid: 10, paper_rx_exempt: 15, eps_items_paid: 150, eps_items_exempt: 500, paper_items_paid: 12, paper_items_exempt: 20, nhs_prepayment: "32.05" }
     }
  });

  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
  const existingRecord = submittedData[formattedDate];
  
  // Is this Head Office/Ahmed who can edit any day?
  const isHeadOffice = session.scope.type === "headoffice";
  
  const isFutureDate = date ? isFuture(date) && format(date, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd") : false;

  const [isEditingMode, setIsEditingMode] = useState(!existingRecord);

  // Re-evaluate editing mode when date changes
  useEffect(() => {
     if (isFutureDate) {
        setIsEditingMode(false);
     } else {
        setIsEditingMode(!submittedData[formattedDate] || isHeadOffice);
     }
  }, [formattedDate, submittedData, isHeadOffice, isFutureDate]);

  // Values State
  const [values, setValues] = useState<Record<string, string | number>>(() => {
    const init: Record<string, string | number> = {};
    PRESCRIPTION_FIELDS.forEach(f => {
      init[f.epsKey] = "";
      init[f.paperKey] = "";
    });
    OTHER_FIELDS.forEach(f => { init[f.key] = ""; });
    return init;
  });

  // Load existing data if available
  useEffect(() => {
     if (existingRecord) {
        // Merge with empty to ensure all fields exist
        const init: Record<string, string | number> = {};
        PRESCRIPTION_FIELDS.forEach(f => {
          init[f.epsKey] = "";
          init[f.paperKey] = "";
        });
        OTHER_FIELDS.forEach(f => { init[f.key] = ""; });
        setValues({ ...init, ...existingRecord.values });
     } else {
        // Reset to blank strings
        const init: Record<string, string | number> = {};
        PRESCRIPTION_FIELDS.forEach(f => {
          init[f.epsKey] = "";
          init[f.paperKey] = "";
        });
        OTHER_FIELDS.forEach(f => { init[f.key] = ""; });
        setValues(init);
     }
  }, [formattedDate, existingRecord]);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  const [notCompletedReason, setNotCompletedReason] = useState("");
  const [notCompletedOpen, setNotCompletedOpen] = useState(false);

  const nmsTotal = (Number(values["nms_intervention"] || 0)) + (Number(values["nms_follow_up"] || 0));

  const groupedOther = useMemo(() => {
    const groups: Record<string, ServiceField[]> = {};
    for (const f of OTHER_FIELDS) {
      groups[f.group] ||= [];
      groups[f.group].push(f);
    }
    return groups;
  }, []);

  const updateValue = (key: string, valStr: string, isCurrency = false) => {
      const val = isCurrency ? normalizeFloat(valStr) : normalizeInt(valStr);
      setValues(s => ({ ...s, [key]: val }));
      
      // Clear specific error on change
      if (validationErrors[key]) {
         setValidationErrors(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
         });
      }
      setGlobalError(null);
  };

  const handleBlur = (key: string, isCurrency: boolean) => {
     if (isCurrency && values[key] !== "") {
        const num = parseFloat(values[key] as string);
        if (!Number.isNaN(num)) {
           setValues(s => ({ ...s, [key]: num.toFixed(2) }));
        }
     }
  };

  const validate = () => {
     const errors: Record<string, string> = {};
     let hasMissing = false;

     if (!date) return { global: "Trading date is required.", errors };
     if (isFutureDate) return { global: "Cannot enter data for future dates.", errors };

     // Check missing fields (MUST explicitly enter 0)
     const allKeys = [...PRESCRIPTION_FIELDS.flatMap(f => [f.epsKey, f.paperKey]), ...OTHER_FIELDS.map(f => f.key)];
     
     allKeys.forEach(k => {
        if (values[k] === "") {
           errors[k] = "Field is required. Enter 0 if none.";
           hasMissing = true;
        }
     });

     // Currency validation logic
     const validatePrepMult = (key: string) => {
        if (values[key] === "" || values[key] == "0" || values[key] == "0.00") return;
        const val = Number(values[key]);
        const m1 = 32.05;
        const m2 = 114.50;
        const m3 = 19.80; 
        
        const isM1 = Math.abs(val % m1) < 0.01;
        const isM2 = Math.abs(val % m2) < 0.01;
        const isM3 = Math.abs(val % m3) < 0.01;
        
        if (!isM1 && !isM2 && !isM3) {
           errors[key] = `Must be a multiple of £32.05, £114.50, or £19.80`;
        }
     };

     validatePrepMult("nhs_prepayment");

     // FP57 is typically multiples of £9.90
     if (values["fp57_refund"] !== "" && values["fp57_refund"] !== "0" && values["fp57_refund"] !== "0.00") {
        const fp57 = Number(values["fp57_refund"]);
        const ratio = fp57 / 9.90;
        if (Math.abs(ratio - Math.round(ratio)) > 0.001) {
           errors["fp57_refund"] = "Must be a multiple of £9.90";
        }
     }

     if (hasMissing) {
        return { global: "Missing fields. Please ensure all fields have a value (enter 0 if none).", errors };
     }
     
     if (Object.keys(errors).length > 0) {
        return { global: "Please fix the validation errors in the highlighted fields.", errors };
     }

     return { global: null, errors: {} };
  };

  const handleSubmit = () => {
     const { global, errors } = validate();
     
     if (global || Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setGlobalError(global);
        toast({ title: "Validation Error", description: global || "Please fix errors.", variant: "destructive" });
        return;
     }

     // Save
     setSubmittedData(prev => ({
        ...prev,
        [formattedDate]: {
           user: session.staff?.name || session.userEmail || "Unknown",
           timestamp: Date.now(),
           values: { ...values }
        }
     }));

     setIsEditingMode(false);
     toast({ title: "Figures Submitted", description: `Daily figures for ${format(date!, "PPP")} have been saved.` });
  };

  const handleMarkNotCompleted = () => {
     if (!notCompletedReason) {
        toast({ title: "Reason Required", description: "You must provide a reason.", variant: "destructive" });
        return;
     }
     
     setSubmittedData(prev => ({
        ...prev,
        [formattedDate]: {
           user: session.staff?.name || session.userEmail || "Unknown",
           timestamp: Date.now(),
           status: "not_completed",
           reason: notCompletedReason,
           values: {}
        }
     }));
     
     setNotCompletedOpen(false);
     setIsEditingMode(false);
     toast({ title: "Status Updated", description: "Marked as not completed." });
  };

  // MTD Summaries Mock Data
  const mtdSummary = [
     { label: "Total Prescriptions/Items", value: "9,120", prev: "8,930", change: "+2.1%", up: true },
     { label: "Total NMS", value: "62", prev: "54", change: "+14.8%", up: true },
     { label: "Total DMS", value: "14", prev: "18", change: "-22.2%", up: false },
     { label: "Hypertension Case Finding", value: "45", prev: "40", change: "+12.5%", up: true },
     { label: "ABPM", value: "8", prev: "8", change: "0%", up: true },
     { label: "Contraception", value: "112", prev: "95", change: "+17.8%", up: true },
     { label: "Vaccinations", value: "320", prev: "210", change: "+52.3%", up: true },
     { label: "Local Services", value: "85", prev: "90", change: "-5.5%", up: false },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <div className="font-serif text-2xl tracking-tight">Daily Figures</div>
          <div className="text-sm text-muted-foreground">
            Enter today's running totals. You must explicitly enter 0 for fields with no activity.
          </div>
        </div>

        {/* MTD Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
           {mtdSummary.map((m, i) => (
              <Card key={i} className="p-3 rounded-xl border bg-card/60 shadow-sm flex flex-col justify-between">
                 <div className="text-[10px] font-semibold uppercase text-muted-foreground leading-tight mb-2 h-8 line-clamp-2">
                    {m.label}
                 </div>
                 <div>
                    <div className="font-mono font-bold text-lg">{m.value}</div>
                    <div className={`text-[10px] flex items-center mt-0.5 font-medium ${m.up ? "text-emerald-600" : "text-red-500"}`}>
                       {m.up ? <ArrowUpRight className="h-3 w-3 mr-0.5"/> : <ArrowDownRight className="h-3 w-3 mr-0.5"/>}
                       {m.change}
                    </div>
                 </div>
              </Card>
           ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            
            {/* DATE SELECTOR & STATUS */}
            <Card className={`p-4 flex items-center gap-4 border ${existingRecord ? (existingRecord.status === 'not_completed' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200') : 'bg-primary/5 border-primary/20'}`}>
               <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${existingRecord ? (existingRecord.status === 'not_completed' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600') : 'bg-primary/10 text-primary'}`}>
                  {existingRecord ? <CheckCircle2 className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
               </div>
               <div className="flex-1">
                  <div className="text-sm font-medium flex items-center gap-2">
                     Trading Date
                     {existingRecord ? (
                        <Badge variant="outline" className={`h-5 text-[10px] ${existingRecord.status === 'not_completed' ? 'border-amber-500 text-amber-600' : 'border-emerald-500 text-emerald-600'}`}>
                           {existingRecord.status === 'not_completed' ? 'Not Completed' : 'Entered'}
                        </Badge>
                     ) : (
                        <Badge variant="outline" className="h-5 text-[10px] border-red-500 text-red-600">Not Entered</Badge>
                     )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                     {existingRecord 
                        ? `Last updated by ${existingRecord.user}` 
                        : "Ensure this matches the day you are reporting for."}
                  </div>
               </div>
               
               <div className="flex items-center gap-2">
                  <Popover>
                     <PopoverTrigger asChild>
                        <Button
                           variant="outline"
                           className={`w-[180px] justify-start text-left font-normal bg-background ${!date && "text-muted-foreground"}`}
                        >
                           <CalendarIcon className="mr-2 h-4 w-4" />
                           {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-auto p-0" align="end">
                        <CalendarComponent
                           mode="single"
                           selected={date}
                           onSelect={setDate}
                           initialFocus
                           disabled={(d) => isFuture(d) && format(d, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd")}
                        />
                     </PopoverContent>
                  </Popover>

                  {/* Manager Only: Mark not completed */}
                  {(session.role === "Pharmacy Manager" || isHeadOffice) && !existingRecord && !isFutureDate && (
                     <Dialog open={notCompletedOpen} onOpenChange={setNotCompletedOpen}>
                        <DialogTrigger asChild>
                           <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50">
                              Mark Not Completed
                           </Button>
                        </DialogTrigger>
                        <DialogContent>
                           <DialogHeader>
                              <DialogTitle>Mark Day as Not Completed</DialogTitle>
                              <DialogDescription>
                                 This will flag the trading day as deliberately skipped. Authorisation tracked.
                              </DialogDescription>
                           </DialogHeader>
                           <div className="py-4">
                              <Label>Reason</Label>
                              <Textarea 
                                 value={notCompletedReason} 
                                 onChange={e => setNotCompletedReason(e.target.value)} 
                                 placeholder="e.g. Closed due to bank holiday"
                                 className="mt-2"
                              />
                           </div>
                           <DialogFooter>
                              <Button onClick={handleMarkNotCompleted}>Confirm & Save</Button>
                           </DialogFooter>
                        </DialogContent>
                     </Dialog>
                  )}
               </div>
            </Card>

            {globalError && (
               <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {globalError}
               </div>
            )}

            {isFutureDate ? (
               <Card className="p-12 text-center border-dashed bg-muted/30">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold text-lg text-muted-foreground">Future Date</h3>
                  <p className="text-sm text-muted-foreground mt-1">Data cannot be entered for future dates.</p>
               </Card>
            ) : existingRecord && existingRecord.status === 'not_completed' ? (
               <Card className="p-8 text-center border-dashed bg-muted/30">
                  <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-lg">Marked as Not Completed</h3>
                  <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                     Reason: {existingRecord.reason}
                  </p>
                  {isHeadOffice && (
                     <Button variant="outline" className="mt-4" onClick={() => setIsEditingMode(true)}>
                        <Edit2 className="h-4 w-4 mr-2" /> Override & Enter Data
                     </Button>
                  )}
               </Card>
            ) : !isEditingMode ? (
               // VIEW ONLY SUMMARY MODE
               <div className="space-y-4">
                  {!isHeadOffice && (
                     <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl flex items-center gap-3 text-sm">
                        <Lock className="h-4 w-4 shrink-0" /> Figures have been submitted for this date and are view-only.
                     </div>
                  )}

                  <Card className="rounded-2xl border bg-card/60 p-6 shadow-sm">
                     <div className="flex items-center justify-between mb-6 border-b pb-4">
                        <h3 className="font-semibold text-lg">Daily Figures Summary</h3>
                        {isHeadOffice && (
                           <Button variant="outline" size="sm" onClick={() => setIsEditingMode(true)}>
                              <Edit2 className="h-4 w-4 mr-2" /> Edit Data
                           </Button>
                        )}
                     </div>

                     <div className="grid md:grid-cols-2 gap-8">
                        {/* Prescription Stats */}
                        <div className="space-y-4">
                           <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prescriptions & Items</div>
                           
                           <div className="bg-background/50 rounded-xl border p-4 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <div className="text-[10px] text-muted-foreground uppercase mb-1">Total Rx</div>
                                    <div className="font-mono text-xl font-medium">
                                       {(Number(values["eps_rx_paid"] || 0) + Number(values["eps_rx_exempt"] || 0) + Number(values["paper_rx_paid"] || 0) + Number(values["paper_rx_exempt"] || 0)).toLocaleString()}
                                    </div>
                                 </div>
                                 <div>
                                    <div className="text-[10px] text-muted-foreground uppercase mb-1">Total Items</div>
                                    <div className="font-mono text-xl font-medium">
                                       {(Number(values["eps_items_paid"] || 0) + Number(values["eps_items_exempt"] || 0) + Number(values["paper_items_paid"] || 0) + Number(values["paper_items_exempt"] || 0)).toLocaleString()}
                                    </div>
                                 </div>
                              </div>
                              
                              <Separator />
                              
                              <div className="space-y-2">
                                 <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Paid Rx / Items</span>
                                    <span className="font-mono">
                                       {(Number(values["eps_rx_paid"] || 0) + Number(values["paper_rx_paid"] || 0))} / {(Number(values["eps_items_paid"] || 0) + Number(values["paper_items_paid"] || 0))}
                                    </span>
                                 </div>
                                 <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Exempt Rx / Items</span>
                                    <span className="font-mono">
                                       {(Number(values["eps_rx_exempt"] || 0) + Number(values["paper_rx_exempt"] || 0))} / {(Number(values["eps_items_exempt"] || 0) + Number(values["paper_items_exempt"] || 0))}
                                    </span>
                                 </div>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-4 mt-4">
                              <div className="bg-background/50 rounded-xl border p-3">
                                 <div className="text-xs text-muted-foreground mb-1">NHS Prepayment</div>
                                 <div className="font-mono font-medium text-lg">£{Number(values["nhs_prepayment"] || 0).toFixed(2)}</div>
                              </div>
                              <div className="bg-background/50 rounded-xl border p-3">
                                 <div className="text-xs text-muted-foreground mb-1">FP57 Refund</div>
                                 <div className="font-mono font-medium text-lg">£{Number(values["fp57_refund"] || 0).toFixed(2)}</div>
                              </div>
                           </div>
                        </div>

                        {/* Services Stats */}
                        <div className="space-y-4">
                           <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clinical Services</div>
                           
                           <div className="bg-background/50 rounded-xl border p-4 space-y-3">
                              {Object.entries(groupedOther).filter(([g]) => g !== "Figures").map(([group, fields]) => {
                                 const groupTotal = fields.reduce((sum, f) => sum + Number(values[f.key] || 0), 0);
                                 if (groupTotal === 0) return null;
                                 
                                 return (
                                    <div key={group}>
                                       <div className="flex justify-between items-end mb-1">
                                          <span className="text-xs font-medium">{group}</span>
                                          <span className="font-mono font-bold text-sm">{groupTotal}</span>
                                       </div>
                                       <div className="space-y-1 ml-2">
                                          {fields.filter(f => Number(values[f.key] || 0) > 0).map(f => (
                                             <div key={f.key} className="flex justify-between text-[10px] text-muted-foreground">
                                                <span>{f.label}</span>
                                                <span className="font-mono">{values[f.key]}</span>
                                             </div>
                                          ))}
                                       </div>
                                    </div>
                                 )
                              })}
                              {Object.entries(groupedOther).filter(([g]) => g !== "Figures").every(([g, fields]) => fields.reduce((s, f) => s + Number(values[f.key] || 0), 0) === 0) && (
                                 <div className="text-sm text-muted-foreground italic py-2">No clinical services recorded today.</div>
                              )}
                           </div>
                        </div>
                     </div>
                  </Card>
               </div>
            ) : (
               <div className="space-y-4">
                  {/* EDIT MODE */}
                  <Card className="rounded-2xl border bg-card/60 p-5 overflow-hidden shadow-sm" data-testid="card-group-prescription">
                     <div className="flex items-center gap-2 mb-5">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                           <FileText className="h-4 w-4" />
                        </div>
                        <div className="text-sm font-semibold tracking-wide uppercase text-foreground">Prescription Figures</div>
                     </div>

                     <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 mb-2 px-2">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</div>
                        <div className="text-xs font-semibold text-primary uppercase tracking-wider text-center bg-primary/5 rounded py-1">EPS (Electronic)</div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center bg-muted/50 rounded py-1">Paper</div>
                     </div>
                     
                     <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="text-xs font-bold text-foreground px-2">Paid</div>
                            <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center bg-slate-50/50 p-2 rounded-lg border border-transparent hover:border-border transition-colors">
                                <div className="text-sm font-medium text-muted-foreground">Prescriptions (Rx)</div>
                                <div className="space-y-1">
                                   <Input 
                                      className={`h-10 text-center font-mono ${validationErrors["eps_rx_paid"] ? "border-destructive ring-destructive/20 focus-visible:ring-destructive/20" : "border-primary/20 focus-visible:ring-primary/20"}`}
                                      value={values["eps_rx_paid"]}
                                      onChange={e => updateValue("eps_rx_paid", e.target.value)}
                                   />
                                   {validationErrors["eps_rx_paid"] && <div className="text-[10px] text-destructive text-center">{validationErrors["eps_rx_paid"]}</div>}
                                </div>
                                <div className="space-y-1">
                                   <Input 
                                      className={`h-10 text-center font-mono ${validationErrors["paper_rx_paid"] ? "border-destructive ring-destructive/20" : ""}`}
                                      value={values["paper_rx_paid"]}
                                      onChange={e => updateValue("paper_rx_paid", e.target.value)}
                                   />
                                   {validationErrors["paper_rx_paid"] && <div className="text-[10px] text-destructive text-center">{validationErrors["paper_rx_paid"]}</div>}
                                </div>
                            </div>
                            <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center bg-slate-50/50 p-2 rounded-lg border border-transparent hover:border-border transition-colors">
                                <div className="text-sm font-medium text-muted-foreground">Items</div>
                                <div className="space-y-1">
                                   <Input 
                                      className={`h-10 text-center font-mono ${validationErrors["eps_items_paid"] ? "border-destructive ring-destructive/20" : "border-primary/20"}`}
                                      value={values["eps_items_paid"]}
                                      onChange={e => updateValue("eps_items_paid", e.target.value)}
                                   />
                                   {validationErrors["eps_items_paid"] && <div className="text-[10px] text-destructive text-center">{validationErrors["eps_items_paid"]}</div>}
                                </div>
                                <div className="space-y-1">
                                   <Input 
                                      className={`h-10 text-center font-mono ${validationErrors["paper_items_paid"] ? "border-destructive ring-destructive/20" : ""}`}
                                      value={values["paper_items_paid"]}
                                      onChange={e => updateValue("paper_items_paid", e.target.value)}
                                   />
                                   {validationErrors["paper_items_paid"] && <div className="text-[10px] text-destructive text-center">{validationErrors["paper_items_paid"]}</div>}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <div className="text-xs font-bold text-foreground px-2">Exempt</div>
                            <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center bg-slate-50/50 p-2 rounded-lg border border-transparent hover:border-border transition-colors">
                                <div className="text-sm font-medium text-muted-foreground">Prescriptions (Rx)</div>
                                <div className="space-y-1">
                                   <Input 
                                      className={`h-10 text-center font-mono ${validationErrors["eps_rx_exempt"] ? "border-destructive ring-destructive/20" : "border-primary/20"}`}
                                      value={values["eps_rx_exempt"]}
                                      onChange={e => updateValue("eps_rx_exempt", e.target.value)}
                                   />
                                   {validationErrors["eps_rx_exempt"] && <div className="text-[10px] text-destructive text-center">{validationErrors["eps_rx_exempt"]}</div>}
                                </div>
                                <div className="space-y-1">
                                   <Input 
                                      className={`h-10 text-center font-mono ${validationErrors["paper_rx_exempt"] ? "border-destructive ring-destructive/20" : ""}`}
                                      value={values["paper_rx_exempt"]}
                                      onChange={e => updateValue("paper_rx_exempt", e.target.value)}
                                   />
                                   {validationErrors["paper_rx_exempt"] && <div className="text-[10px] text-destructive text-center">{validationErrors["paper_rx_exempt"]}</div>}
                                </div>
                            </div>
                            <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center bg-slate-50/50 p-2 rounded-lg border border-transparent hover:border-border transition-colors">
                                <div className="text-sm font-medium text-muted-foreground">Items</div>
                                <div className="space-y-1">
                                   <Input 
                                      className={`h-10 text-center font-mono ${validationErrors["eps_items_exempt"] ? "border-destructive ring-destructive/20" : "border-primary/20"}`}
                                      value={values["eps_items_exempt"]}
                                      onChange={e => updateValue("eps_items_exempt", e.target.value)}
                                   />
                                   {validationErrors["eps_items_exempt"] && <div className="text-[10px] text-destructive text-center">{validationErrors["eps_items_exempt"]}</div>}
                                </div>
                                <div className="space-y-1">
                                   <Input 
                                      className={`h-10 text-center font-mono ${validationErrors["paper_items_exempt"] ? "border-destructive ring-destructive/20" : ""}`}
                                      value={values["paper_items_exempt"]}
                                      onChange={e => updateValue("paper_items_exempt", e.target.value)}
                                   />
                                   {validationErrors["paper_items_exempt"] && <div className="text-[10px] text-destructive text-center">{validationErrors["paper_items_exempt"]}</div>}
                                </div>
                            </div>
                        </div>
                     </div>
                  </Card>

                  {/* OTHER SECTIONS */}
                  {Object.entries(groupedOther).map(([group, groupFields]) => (
                    <Card key={group} className="rounded-2xl border bg-card/60 p-5 shadow-sm" data-testid={`card-group-${group}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-semibold tracking-wide text-foreground uppercase">
                          {group}
                        </div>
                        {group === "NMS" && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">Combined: {nmsTotal}</Badge>
                        )}
                      </div>
                      
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {groupFields.map((f) => (
                          <div key={f.key} className="space-y-1.5 relative">
                            <Label className="text-xs font-medium text-muted-foreground" data-testid={`label-${f.key}`}>
                              {f.label}
                            </Label>
                            <div className="relative">
                               {f.isCurrency && <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">£</span>}
                               <Input
                                 className={`font-mono h-10 ${f.isCurrency ? "pl-6" : ""} ${validationErrors[f.key] ? "border-destructive ring-destructive/20 focus-visible:ring-destructive/20" : ""}`}
                                 value={values[f.key]}
                                 onChange={(e) => updateValue(f.key, e.target.value, f.isCurrency)}
                                 onBlur={() => handleBlur(f.key, f.isCurrency || false)}
                                 data-testid={`input-${f.key}`}
                               />
                            </div>
                            {validationErrors[f.key] && (
                               <div className="text-[10px] text-destructive leading-tight absolute -bottom-4 left-0">
                                  {validationErrors[f.key]}
                               </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                  
                  <div className="mt-6 flex justify-end">
                     <Button size="lg" className="w-full md:w-auto px-8" onClick={handleSubmit}>
                        Submit Daily Figures
                     </Button>
                  </div>
               </div>
            )}
          </div>

          <div className="hidden lg:block space-y-4">
             <Card className="rounded-2xl border bg-card/60 p-5 shadow-sm sticky top-6">
                <div className="text-sm font-semibold mb-4">Form Guide</div>
                <div className="space-y-4 text-xs text-muted-foreground">
                   <p><strong>0 Required:</strong> If no activity occurred for a specific metric, you must explicitly enter <code>0</code>.</p>
                   <p><strong>NHS Prepayments:</strong> Ensure this matches the exact certificate cost (£32.05, £114.50, or £19.80). Validations enforce exact multiples.</p>
                   <p><strong>FP57:</strong> Must be a multiple of £9.90.</p>
                   <Separator />
                   <p className="font-medium text-foreground">Need help?</p>
                   <p>Contact Head Office or raise an IT ticket if forms fail to submit.</p>
                </div>
             </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}