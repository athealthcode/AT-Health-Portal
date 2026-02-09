import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, FileText, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

type ServiceField = { key: string; label: string; group: string; isCurrency?: boolean; subGroup?: string };

// Prescription Figures - Special handling for Table Layout
const PRESCRIPTION_FIELDS = [
  { type: "Paid", epsKey: "eps_rx_paid", paperKey: "paper_rx_paid", label: "Prescriptions (Rx)" },
  { type: "Exempt", epsKey: "eps_rx_exempt", paperKey: "paper_rx_exempt", label: "Prescriptions (Rx)" },
  { type: "Paid", epsKey: "eps_items_paid", paperKey: "paper_items_paid", label: "Items" },
  { type: "Exempt", epsKey: "eps_items_exempt", paperKey: "paper_items_exempt", label: "Items" },
];

const OTHER_FIELDS: ServiceField[] = [
  // FIGURES (Running totals)
  { key: "ssp", label: "SSP", group: "Figures" },
  { key: "nhs_prepayment", label: "NHS Prepayment (£)", group: "Figures", isCurrency: true },
  { key: "fp57_refund", label: "FP57 Refund (£)", group: "Figures", isCurrency: true },

  // NMS
  { key: "nms_intervention", label: "NMS Intervention", group: "NMS" },
  { key: "nms_follow_up", label: "NMS Follow-up", group: "NMS" },
  
  // DMS
  { key: "dms_stage_1", label: "Stage 1", group: "DMS" },
  { key: "dms_stage_2", label: "Stage 2", group: "DMS" },
  { key: "dms_stage_3", label: "Stage 3", group: "DMS" },

  // Hypertension
  { key: "hypertension_case", label: "Case Finding", group: "Hypertension" },
  { key: "abpm_fitting", label: "ABPM Fitting", group: "Hypertension" },

  // Contraception
  { key: "oral_contraception", label: "Oral Contraception", group: "Contraception" },
  { key: "emergency_contraception", label: "Emergency Contraception", group: "Contraception" },

  // Vaccinations
  { key: "flu", label: "Flu", group: "Vaccinations" },
  { key: "covid", label: "COVID", group: "Vaccinations" },

  // Local Services
  { key: "mas", label: "Minor Ailments Supply", group: "Local Services" },
  { key: "needle_syringe", label: "Needle & Syringe Supply", group: "Local Services" },
  { key: "naloxone", label: "Naloxone Supply", group: "Local Services" },
  { key: "supervised_consumption", label: "Supervised Consumption", group: "Local Services" },
  { key: "lfd", label: "Lateral Flow Device", group: "Local Services" },
];

function normalizeInt(v: string) {
  const n = Number.parseInt(v.replace(/[^0-9-]/g, ""), 10);
  if (!Number.isFinite(n)) return 0;
  return n;
}

function normalizeFloat(v: string) {
  const n = Number.parseFloat(v.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return n;
}

function formatCurrency(v: number) {
  return `£${v.toFixed(2)}`;
}

export default function DailyFigures() {
  const { toast } = useToast();
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"form" | "summary">("form");
  const [lastSubmittedValues, setLastSubmittedValues] = useState<Record<string, number> | null>(null);

  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    PRESCRIPTION_FIELDS.forEach(f => {
      init[f.epsKey] = 0;
      init[f.paperKey] = 0;
    });
    OTHER_FIELDS.forEach(f => { init[f.key] = 0; });
    return init;
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Computed NMS Total
  const nmsTotal = (values["nms_intervention"] || 0) + (values["nms_follow_up"] || 0);

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
  };

  const validate = () => {
     if (!date) return "Trading date is required.";

     // Currency validation (multiples of 9.90)
     // Floating point modulo can be tricky, so we use a small epsilon
     const nhsPrep = values["nhs_prepayment"] || 0;
     const fp57 = values["fp57_refund"] || 0;

     // Check multiples of 9.90 (approximate check)
     const isValidMultiple = (val: number) => {
        if (val === 0) return true;
        const ratio = val / 9.90;
        return Math.abs(ratio - Math.round(ratio)) < 0.001;
     };

     if (!isValidMultiple(nhsPrep)) {
        return "NHS Prepayment must be a multiple of £9.90 (or 0).";
     }
     if (!isValidMultiple(fp57)) {
        return "FP57 Refund must be a multiple of £9.90 (or 0).";
     }

     return null;
  };

  const handleSubmit = () => {
     const error = validate();
     if (error) {
        setValidationError(error);
        toast({ title: "Validation Error", description: error, variant: "destructive" });
        return;
     }

     // Simulate Save
     toast({ title: "Figures Saved", description: `Data saved for ${format(date!, "PPP")}.` });
     
     setLastSubmittedValues({ ...values });
     setView("summary");
     
     // Reset Form
     const next: Record<string, number> = {};
     PRESCRIPTION_FIELDS.forEach(f => { next[f.epsKey] = 0; next[f.paperKey] = 0; });
     OTHER_FIELDS.forEach(f => { next[f.key] = 0; });
     setValues(next);
  };

  if (view === "summary" && lastSubmittedValues) {
     return (
        <AppShell>
           <div className="flex flex-col gap-6 max-w-2xl mx-auto items-center justify-center min-h-[60vh]">
              <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                 <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="text-center space-y-2">
                 <h2 className="text-3xl font-semibold tracking-tight">Submission Successful</h2>
                 <p className="text-muted-foreground">
                    Daily figures for <span className="font-medium text-foreground">{date ? format(date, "PPP") : "Unknown Date"}</span> have been recorded.
                 </p>
              </div>

              <Card className="w-full p-6 mt-4 bg-card/60">
                 <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Summary of Entry</h3>
                 <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between border-b pb-2">
                       <span>NHS Prepayment</span>
                       <span className="font-mono font-medium">{formatCurrency(lastSubmittedValues["nhs_prepayment"])}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                       <span>FP57 Refund</span>
                       <span className="font-mono font-medium">{formatCurrency(lastSubmittedValues["fp57_refund"])}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                       <span>Total NMS</span>
                       <span className="font-mono font-medium">
                          {(lastSubmittedValues["nms_intervention"] || 0) + (lastSubmittedValues["nms_follow_up"] || 0)}
                       </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                       <span>Flu Vaccinations</span>
                       <span className="font-mono font-medium">{lastSubmittedValues["flu"]}</span>
                    </div>
                 </div>
              </Card>

              <div className="flex gap-4 w-full">
                 <Button variant="outline" className="flex-1 h-12" onClick={() => window.location.href = "/"}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                 </Button>
                 <Button className="flex-1 h-12" onClick={() => setView("form")}>
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
            Enter today's running totals. All fields are mandatory and default to 0.
            Monthly aggregation is handled automatically.
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
                             className="h-10 text-center font-mono border-primary/20 focus-visible:ring-primary/20" 
                             value={values["eps_rx_paid"]}
                             onChange={e => updateValue("eps_rx_paid", e.target.value)}
                             placeholder="0"
                          />
                          <Input 
                             className="h-10 text-center font-mono" 
                             value={values["paper_rx_paid"]}
                             onChange={e => updateValue("paper_rx_paid", e.target.value)}
                             placeholder="0"
                          />
                      </div>
                      <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center bg-slate-50/50 p-2 rounded-lg border border-transparent hover:border-border transition-colors">
                          <div className="text-sm font-medium text-muted-foreground">Items</div>
                          <Input 
                             className="h-10 text-center font-mono border-primary/20 focus-visible:ring-primary/20" 
                             value={values["eps_items_paid"]}
                             onChange={e => updateValue("eps_items_paid", e.target.value)}
                             placeholder="0"
                          />
                          <Input 
                             className="h-10 text-center font-mono" 
                             value={values["paper_items_paid"]}
                             onChange={e => updateValue("paper_items_paid", e.target.value)}
                             placeholder="0"
                          />
                      </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                      <div className="text-xs font-bold text-foreground px-2">Exempt</div>
                      <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center bg-slate-50/50 p-2 rounded-lg border border-transparent hover:border-border transition-colors">
                          <div className="text-sm font-medium text-muted-foreground">Prescriptions (Rx)</div>
                          <Input 
                             className="h-10 text-center font-mono border-primary/20 focus-visible:ring-primary/20" 
                             value={values["eps_rx_exempt"]}
                             onChange={e => updateValue("eps_rx_exempt", e.target.value)}
                             placeholder="0"
                          />
                          <Input 
                             className="h-10 text-center font-mono" 
                             value={values["paper_rx_exempt"]}
                             onChange={e => updateValue("paper_rx_exempt", e.target.value)}
                             placeholder="0"
                          />
                      </div>
                      <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center bg-slate-50/50 p-2 rounded-lg border border-transparent hover:border-border transition-colors">
                          <div className="text-sm font-medium text-muted-foreground">Items</div>
                          <Input 
                             className="h-10 text-center font-mono border-primary/20 focus-visible:ring-primary/20" 
                             value={values["eps_items_exempt"]}
                             onChange={e => updateValue("eps_items_exempt", e.target.value)}
                             placeholder="0"
                          />
                          <Input 
                             className="h-10 text-center font-mono" 
                             value={values["paper_items_exempt"]}
                             onChange={e => updateValue("paper_items_exempt", e.target.value)}
                             placeholder="0"
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
                        value={String(values[f.key] ?? 0)}
                        onChange={(e) => updateValue(f.key, e.target.value, f.isCurrency)}
                        onBlur={() => {
                          const cur = values[f.key];
                          if (cur === undefined || cur === null || Number.isNaN(cur)) {
                            setValues((s) => ({ ...s, [f.key]: 0 }));
                          }
                        }}
                        className="h-10 font-mono bg-background/50"
                        data-testid={`input-${f.key}`}
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
                      const next: Record<string, number> = {};
                      PRESCRIPTION_FIELDS.forEach(f => {
                          next[f.epsKey] = 0;
                          next[f.paperKey] = 0;
                      });
                      OTHER_FIELDS.forEach(f => { next[f.key] = 0; });
                      setValues(next);
                      setValidationError(null);
                    }}
                  >
                    Reset All to 0
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
