import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, FileText, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Calendar, Lock, MessageSquareWarning } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useSubmittedDays } from "@/hooks/use-submitted-days";
import { useAuth } from "@/state/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Link, useLocation } from "wouter";

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
  // Allow simple typing like "9.9" or "9.90"
  // Just strip illegal chars but keep dot
  return v.replace(/[^0-9.]/g, "");
}

function formatCurrency(v: string | number) {
  const num = typeof v === 'string' ? parseFloat(v) : v;
  if (Number.isNaN(num)) return "£0.00";
  return `£${num.toFixed(2)}`;
}

export default function DailyFigures() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { session } = useAuth();
  const { isSubmitted, markSubmitted } = useSubmittedDays("figures");
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"form" | "summary">("form");
  const [lastSubmittedValues, setLastSubmittedValues] = useState<Record<string, string | number> | null>(null);

  // Initialize with empty strings
  const [values, setValues] = useState<Record<string, string | number>>(() => {
    const init: Record<string, string | number> = {};
    PRESCRIPTION_FIELDS.forEach(f => {
      init[f.epsKey] = "";
      init[f.paperKey] = "";
    });
    OTHER_FIELDS.forEach(f => { init[f.key] = ""; });
    return init;
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [highlightMissing, setHighlightMissing] = useState(false);
  
  // Problem Report State
  const [reportOpen, setReportOpen] = useState(false);
  const [problemMessage, setProblemMessage] = useState("");

  const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
  const submissionRecord = useMemo(() => isSubmitted(formattedDate), [formattedDate, isSubmitted]);

  // Computed NMS Total (handling empty strings as 0 for display)
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
      setValidationError(null);
      setHighlightMissing(false);
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
     if (!date) return "Trading date is required.";

     // Check for empty fields
     const missing = [...PRESCRIPTION_FIELDS.flatMap(f => [f.epsKey, f.paperKey]), ...OTHER_FIELDS.map(f => f.key)]
        .filter(k => values[k] === "");
     
     if (missing.length > 0) {
        setHighlightMissing(true);
        return "Field not filled in. Please ensure all fields have a value (enter 0 if none).";
     }

     // Currency validation (multiples of 9.90)
     const nhsPrep = Number(values["nhs_prepayment"]);
     const fp57 = Number(values["fp57_refund"]);

     const isValidMultiple = (val: number) => {
        if (val === 0) return true;
        const ratio = val / 9.90;
        return Math.abs(ratio - Math.round(ratio)) < 0.001;
     };

     if (!isValidMultiple(nhsPrep)) return "NHS Prepayment must be a multiple of £9.90 (or 0).";
     if (!isValidMultiple(fp57)) return "FP57 Refund must be a multiple of £9.90 (or 0).";

     return null;
  };

  const handleSubmit = () => {
     const error = validate();
     if (error) {
        setValidationError(error);
        toast({ title: "Validation Error", description: error, variant: "destructive" });
        return;
     }

     markSubmitted(formattedDate, session.staff?.name || "Unknown");
     setLastSubmittedValues({ ...values });
     setView("summary");
     
     // Reset Form for next entry
     const next: Record<string, string | number> = {};
     PRESCRIPTION_FIELDS.forEach(f => { next[f.epsKey] = ""; next[f.paperKey] = ""; });
     OTHER_FIELDS.forEach(f => { next[f.key] = ""; });
     setValues(next);
     setHighlightMissing(false);
  };

  const handleRaiseProblem = () => {
     toast({ title: "Problem Reported", description: "Head Office has been notified." });
     setReportOpen(false);
     setProblemMessage("");
  };

  // If already submitted and user is trying to view form for that day
  if (submissionRecord && view === "form" && !lastSubmittedValues) {
     return (
        <AppShell>
           <div className="flex flex-col gap-6 max-w-3xl mx-auto mt-10">
              <div className="flex items-center gap-4">
                 <Button variant="ghost" onClick={() => window.history.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                 </Button>
                 <h1 className="font-serif text-2xl">Daily Figures</h1>
              </div>

              <Card className="p-8 border-l-4 border-l-blue-500 bg-blue-50/50">
                 <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                       <Lock className="h-6 w-6" />
                    </div>
                    <div className="space-y-2 flex-1">
                       <h2 className="text-lg font-semibold text-blue-900">Already Submitted</h2>
                       <p className="text-blue-800/80">
                          Figures for <span className="font-medium">{format(date!, "PPP")}</span> were already submitted by <span className="font-medium">{submissionRecord.user}</span> on {new Date(submissionRecord.timestamp).toLocaleTimeString()}.
                       </p>
                       <p className="text-sm text-blue-800/60">
                          Only one submission is allowed per trading day. If this is incorrect, please raise a problem.
                       </p>
                    </div>
                 </div>
                 
                 <div className="mt-6 flex gap-3">
                    <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                       <DialogTrigger asChild>
                          <Button variant="outline" className="text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/5">
                             <MessageSquareWarning className="h-4 w-4 mr-2" />
                             Raise a problem
                          </Button>
                       </DialogTrigger>
                       <DialogContent>
                          <DialogHeader>
                             <DialogTitle>Raise a Problem</DialogTitle>
                             <DialogDescription>
                                Describe the issue with this submission. Head Office will be notified.
                             </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                             <div className="grid gap-2">
                                <Label>Message</Label>
                                <Textarea 
                                   value={problemMessage} 
                                   onChange={e => setProblemMessage(e.target.value)} 
                                   placeholder="e.g. Incorrect totals entered by mistake..."
                                />
                             </div>
                          </div>
                          <DialogFooter>
                             <Button onClick={handleRaiseProblem}>Send Report</Button>
                          </DialogFooter>
                       </DialogContent>
                    </Dialog>
                    
                    <Button variant="secondary" onClick={() => setDate(new Date())}>
                       Select Different Date
                    </Button>
                 </div>
              </Card>
           </div>
        </AppShell>
     );
  }

  if (view === "summary" && lastSubmittedValues) {
     const prescriptionTotal = PRESCRIPTION_FIELDS.reduce((acc, f) => 
        acc + Number(lastSubmittedValues[f.epsKey] || 0) + Number(lastSubmittedValues[f.paperKey] || 0), 0
     );

     return (
        <AppShell>
           <div className="flex flex-col gap-6 max-w-2xl mx-auto items-center justify-center min-h-[60vh]">
              <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                 <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="text-center space-y-2">
                 <h2 className="text-3xl font-semibold tracking-tight">Submission Complete</h2>
                 <p className="text-muted-foreground">
                    Daily figures for <span className="font-medium text-foreground">{date ? format(date, "PPP") : "Unknown Date"}</span> have been recorded.
                 </p>
              </div>

              <Card className="w-full p-6 mt-4 bg-card/60">
                 <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Summary of Entry</h3>
                 <div className="grid grid-cols-2 gap-4 text-sm">
                    {PRESCRIPTION_FIELDS.map(f => (
                       <>
                          <div className="flex justify-between border-b pb-2 text-muted-foreground" key={`${f.epsKey}-label`}>
                             <span>EPS {f.label} ({f.type})</span>
                             <span className="font-mono font-medium text-foreground">{lastSubmittedValues[f.epsKey]}</span>
                          </div>
                          <div className="flex justify-between border-b pb-2 text-muted-foreground" key={`${f.paperKey}-label`}>
                             <span>Paper {f.label} ({f.type})</span>
                             <span className="font-mono font-medium text-foreground">{lastSubmittedValues[f.paperKey]}</span>
                          </div>
                       </>
                    ))}
                    
                    {OTHER_FIELDS.map(f => (
                       <div key={f.key} className="flex justify-between border-b pb-2">
                          <span>{f.label}</span>
                          <span className="font-mono font-medium">
                             {f.isCurrency ? formatCurrency(lastSubmittedValues[f.key]) : lastSubmittedValues[f.key]}
                          </span>
                       </div>
                    ))}
                 </div>
              </Card>

              <div className="flex gap-4 w-full">
                 <Button variant="outline" className="flex-1 h-12" onClick={() => setLocation("/")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                 </Button>
                 <Button className="flex-1 h-12" onClick={() => { setView("form"); setLastSubmittedValues(null); setDate(undefined); }}>
                    Enter Another Day <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
              </div>
           </div>
        </AppShell>
     );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div>
          <div className="font-serif text-2xl tracking-tight" data-testid="text-daily-figures-title">Daily Figures</div>
          <div className="text-sm text-muted-foreground" data-testid="text-daily-figures-subtitle">
            Enter today's running totals. All fields are mandatory (please enter 0 if none).
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            
            {/* DATE SELECTOR */}
            <Card className="p-4 flex items-center gap-4 bg-primary/5 border-primary/20">
               <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Calendar className="h-5 w-5" />
               </div>
               <div className="flex-1">
                  <div className="text-sm font-medium">Trading Date</div>
                  <div className="text-xs text-muted-foreground">Ensure this matches the day you are reporting for.</div>
               </div>
               <Popover>
                  <PopoverTrigger asChild>
                     <Button
                        variant="outline"
                        className={`w-[200px] justify-start text-left font-normal bg-background ${!date && "text-muted-foreground"}`}
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
                     />
                  </PopoverContent>
               </Popover>
            </Card>

            {/* PRESCRIPTION FIGURES GRID */}
            <Card className="rounded-2xl border bg-card/60 p-5 overflow-hidden" data-testid="card-group-prescription">
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
                          <Input 
                             className={`h-10 text-center font-mono ${highlightMissing && values["eps_rx_paid"] === "" ? "border-destructive ring-destructive/20" : "border-primary/20 focus-visible:ring-primary/20"}`}
                             value={values["eps_rx_paid"]}
                             onChange={e => updateValue("eps_rx_paid", e.target.value)}
                             placeholder=""
                          />
                          <Input 
                             className={`h-10 text-center font-mono ${highlightMissing && values["paper_rx_paid"] === "" ? "border-destructive ring-destructive/20" : ""}`}
                             value={values["paper_rx_paid"]}
                             onChange={e => updateValue("paper_rx_paid", e.target.value)}
                             placeholder=""
                          />
                      </div>
                      <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center bg-slate-50/50 p-2 rounded-lg border border-transparent hover:border-border transition-colors">
                          <div className="text-sm font-medium text-muted-foreground">Items</div>
                          <Input 
                             className={`h-10 text-center font-mono ${highlightMissing && values["eps_items_paid"] === "" ? "border-destructive ring-destructive/20" : "border-primary/20 focus-visible:ring-primary/20"}`}
                             value={values["eps_items_paid"]}
                             onChange={e => updateValue("eps_items_paid", e.target.value)}
                             placeholder=""
                          />
                          <Input 
                             className={`h-10 text-center font-mono ${highlightMissing && values["paper_items_paid"] === "" ? "border-destructive ring-destructive/20" : ""}`}
                             value={values["paper_items_paid"]}
                             onChange={e => updateValue("paper_items_paid", e.target.value)}
                             placeholder=""
                          />
                      </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                      <div className="text-xs font-bold text-foreground px-2">Exempt</div>
                      <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center bg-slate-50/50 p-2 rounded-lg border border-transparent hover:border-border transition-colors">
                          <div className="text-sm font-medium text-muted-foreground">Prescriptions (Rx)</div>
                          <Input 
                             className={`h-10 text-center font-mono ${highlightMissing && values["eps_rx_exempt"] === "" ? "border-destructive ring-destructive/20" : "border-primary/20 focus-visible:ring-primary/20"}`}
                             value={values["eps_rx_exempt"]}
                             onChange={e => updateValue("eps_rx_exempt", e.target.value)}
                             placeholder=""
                          />
                          <Input 
                             className={`h-10 text-center font-mono ${highlightMissing && values["paper_rx_exempt"] === "" ? "border-destructive ring-destructive/20" : ""}`}
                             value={values["paper_rx_exempt"]}
                             onChange={e => updateValue("paper_rx_exempt", e.target.value)}
                             placeholder=""
                          />
                      </div>
                      <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center bg-slate-50/50 p-2 rounded-lg border border-transparent hover:border-border transition-colors">
                          <div className="text-sm font-medium text-muted-foreground">Items</div>
                          <Input 
                             className={`h-10 text-center font-mono ${highlightMissing && values["eps_items_exempt"] === "" ? "border-destructive ring-destructive/20" : "border-primary/20 focus-visible:ring-primary/20"}`}
                             value={values["eps_items_exempt"]}
                             onChange={e => updateValue("eps_items_exempt", e.target.value)}
                             placeholder=""
                          />
                          <Input 
                             className={`h-10 text-center font-mono ${highlightMissing && values["paper_items_exempt"] === "" ? "border-destructive ring-destructive/20" : ""}`}
                             value={values["paper_items_exempt"]}
                             onChange={e => updateValue("paper_items_exempt", e.target.value)}
                             placeholder=""
                          />
                      </div>
                  </div>
               </div>
            </Card>

            {Object.entries(groupedOther).map(([group, groupFields]) => (
              <Card key={group} className="rounded-2xl border bg-card/60 p-5" data-testid={`card-group-${group}`}>
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
                    <div key={f.key} className="space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground" data-testid={`label-${f.key}`}>
                        {f.label}
                      </Label>
                      <Input
                        inputMode={f.isCurrency ? "decimal" : "numeric"}
                        value={values[f.key]}
                        onChange={(e) => updateValue(f.key, e.target.value, f.isCurrency)}
                        onBlur={() => handleBlur(f.key, !!f.isCurrency)}
                        className={`h-10 font-mono bg-background/50 ${highlightMissing && values[f.key] === "" ? "border-destructive ring-destructive/20" : ""}`}
                        data-testid={`input-${f.key}`}
                        placeholder=""
                      />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-3">
             <Card className="rounded-2xl border bg-card/60 p-5 sticky top-4">
                <div className="text-sm font-semibold mb-4">Actions</div>
                
                {validationError && (
                   <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {validationError}
                   </div>
                )}

                <div className="space-y-2">
                  <Button
                    className="w-full h-11"
                    onClick={handleSubmit}
                  >
                    Save Figures
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full h-11"
                    onClick={() => {
                      const next: Record<string, string | number> = {};
                      PRESCRIPTION_FIELDS.forEach(f => {
                          next[f.epsKey] = "";
                          next[f.paperKey] = "";
                      });
                      OTHER_FIELDS.forEach(f => { next[f.key] = ""; });
                      setValues(next);
                      setValidationError(null);
                      setHighlightMissing(false);
                    }}
                  >
                    Reset All
                  </Button>
                </div>
                
                <Separator className="my-4" />
                <div className="text-xs text-muted-foreground">
                   Note: Variance reporting has been removed. Please ensure accuracy before saving.
                </div>
             </Card>
             
             <Card className="rounded-2xl border bg-card/60 p-5">
               <div className="text-sm font-semibold mb-2">Nominations (Weekly)</div>
               <div className="text-xs text-muted-foreground mb-3">
                  Week ending {new Date().toLocaleDateString('en-GB')}
               </div>
               <div className="rounded-lg bg-background/50 p-3 flex justify-between items-center">
                  <div>
                    <div className="text-xs text-muted-foreground">Active</div>
                    <div className="text-xl font-mono font-medium text-foreground">4,120</div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 shadow-none">
                    +12
                  </Badge>
               </div>
             </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
