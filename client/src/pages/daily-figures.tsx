import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon } from "lucide-react";

type ServiceField = { key: string; label: string; group: string; isCurrency?: boolean };

// Revised fields structure based on new requirements
const fields: ServiceField[] = [
  // FIGURES (Running totals)
  { key: "eps_rx_paid", label: "EPS Rx Paid", group: "Figures" },
  { key: "eps_rx_exempt", label: "EPS Rx Exempt", group: "Figures" },
  { key: "eps_items_paid", label: "EPS Items Paid", group: "Figures" },
  { key: "eps_items_exempt", label: "EPS Items Exempt", group: "Figures" },
  { key: "paper_rx_paid", label: "Paper Rx Paid", group: "Figures" },
  { key: "paper_rx_exempt", label: "Paper Rx Exempt", group: "Figures" },
  { key: "paper_items_paid", label: "Paper Items Paid", group: "Figures" },
  { key: "paper_items_exempt", label: "Paper Items Exempt", group: "Figures" },
  
  { key: "ssp", label: "SSP", group: "Figures" },
  { key: "nhs_prepayment", label: "NHS Prepayment (£)", group: "Figures", isCurrency: true },
  { key: "fp57_refund", label: "FP57 Refund (£)", group: "Figures", isCurrency: true },

  // NMS
  { key: "nms_intervention", label: "NMS Intervention", group: "NMS" },
  { key: "nms_follow_up", label: "NMS Follow-up", group: "NMS" },
  // Total NMS computed

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
    for (const f of fields) init[f.key] = 0;
    return init;
  });

  // Computed NMS Total
  const nmsTotal = (values["nms_intervention"] || 0) + (values["nms_follow_up"] || 0);

  const grouped = useMemo(() => {
    const groups: Record<string, ServiceField[]> = {};
    for (const f of fields) {
      groups[f.group] ||= [];
      groups[f.group].push(f);
    }
    return groups;
  }, []);

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
            {Object.entries(grouped).map(([group, groupFields]) => (
              <Card key={group} className="rounded-2xl border bg-card/60 p-5" data-testid={`card-group-${group}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                    {group}
                  </div>
                  {group === "NMS" && (
                    <Badge variant="secondary">Combined: {nmsTotal}</Badge>
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
                        onChange={(e) => {
                          const val = f.isCurrency 
                            ? normalizeFloat(e.target.value) 
                            : normalizeInt(e.target.value);
                          setValues((s) => ({ ...s, [f.key]: val }));
                        }}
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
                      for (const f of fields) next[f.key] = 0;
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
                    <div className="text-xl font-mono font-medium">4,120</div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20">
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
