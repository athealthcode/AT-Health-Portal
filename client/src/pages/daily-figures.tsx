import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, FileText, CheckCircle2 } from "lucide-react";

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

export default function DailyFigures() {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    PRESCRIPTION_FIELDS.forEach(f => {
      init[f.epsKey] = 0;
      init[f.paperKey] = 0;
    });
    OTHER_FIELDS.forEach(f => { init[f.key] = 0; });
    return init;
  });

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
  };

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
                
                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                   <CalendarIcon className="h-4 w-4" />
                   <span>Jan 2026 (Month-to-date)</span>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full h-11"
                    onClick={() =>
                      toast({
                        title: "Figures Saved",
                        description: "Running totals updated for today.",
                      })
                    }
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
               <div className="text-xs text-muted-foreground mb-3">View active nominations.</div>
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
