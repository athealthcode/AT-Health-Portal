import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

type ServiceField = { key: string; label: string; group: string };

const fields: ServiceField[] = [
  { key: "dispensed_items", label: "Dispensed items", group: "Dispensing" },
  { key: "nms_intervention", label: "NMS intervention", group: "Services" },
  { key: "nms_follow_up", label: "NMS follow‑up", group: "Services" },
  { key: "nms_total", label: "NMS total", group: "Services" },
  { key: "dms_stage_1", label: "DMS stage 1", group: "Services" },
  { key: "dms_stage_2", label: "DMS stage 2", group: "Services" },
  { key: "dms_stage_3", label: "DMS stage 3", group: "Services" },
  { key: "bp", label: "BP", group: "Services" },
  { key: "abpm", label: "ABPM", group: "Services" },
  { key: "child_flu", label: "Child flu", group: "Vaccinations" },
  { key: "flu", label: "Flu", group: "Vaccinations" },
  { key: "contraception", label: "Contraception", group: "Services" },
  { key: "ssp", label: "SSP", group: "Services" },
  { key: "ehc", label: "EHC", group: "Services" },
  { key: "mas", label: "MAS", group: "Services" },
  { key: "nominations", label: "Nominations", group: "Services" },
  { key: "covid", label: "COVID", group: "Vaccinations" },
  { key: "lfd", label: "LFD", group: "Services" },
  { key: "supervised_consumption", label: "Supervised consumption", group: "Services" },
  { key: "nsp", label: "Needle & syringe programme", group: "Services" },
  { key: "clinical_pathway_consultations", label: "Clinical pathway consultations", group: "Clinical pathways" },
  { key: "clinical_pathway_items", label: "Clinical pathway items", group: "Clinical pathways" },
  { key: "urgent_meds_consultations", label: "Urgent medicines consultations", group: "Clinical pathways" },
  { key: "urgent_meds_items", label: "Urgent medicines items supplied", group: "Clinical pathways" },
  { key: "minor_illness_consultations", label: "Minor illness consultations", group: "Clinical pathways" },
  { key: "gp_minor_illness_consultations", label: "GP minor illness consultations", group: "Clinical pathways" },
  { key: "uec_minor_illness_consultations", label: "Urgent & emergency care minor illness consultations", group: "Clinical pathways" },
  { key: "uec_urgent_meds_consultations", label: "Urgent & emergency care urgent medicines consultations", group: "Clinical pathways" },
  { key: "uec_items_supplied", label: "Urgent & emergency care items supplied", group: "Clinical pathways" },
  { key: "naloxone", label: "Naloxone", group: "Services" },
  { key: "nhs_prepayment", label: "NHS prepayment", group: "Dispensing" },
  { key: "fp57_refund", label: "FP57 refund", group: "Dispensing" },
];

function normalizeInt(v: string) {
  const n = Number.parseInt(v.replace(/[^0-9-]/g, ""), 10);
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

  const [reasons, setReasons] = useState<Record<string, string>>({});

  const totals = useMemo(() => {
    const services = fields
      .filter((f) => f.group !== "Dispensing")
      .reduce((acc, f) => acc + (values[f.key] ?? 0), 0);
    return { services };
  }, [values]);

  const variances = useMemo(() => {
    const v: Record<string, boolean> = {};
    for (const f of fields) v[f.key] = (values[f.key] ?? 0) !== 0;
    return v;
  }, [values]);

  const missingReasons = useMemo(() => {
    const missing: string[] = [];
    for (const f of fields) {
      if (variances[f.key] && !(reasons[f.key] ?? "").trim()) missing.push(f.key);
    }
    return missing;
  }, [variances, reasons]);

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
            Single page. All numeric fields are mandatory and default to 0 (reverts to 0 on blur).
            Variance is anything that isn’t 0 and requires a reason.
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
          <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-daily-figures-form">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold" data-testid="text-form-section">Figures</div>
              <Badge variant={missingReasons.length ? "destructive" : "secondary"} className="pill" data-testid="badge-variance-status">
                {missingReasons.length ? `${missingReasons.length} reason(s) needed` : "All variances explained"}
              </Badge>
            </div>

            <Separator className="my-4" />

            <div className="grid gap-6">
              {Object.entries(grouped).map(([group, groupFields]) => (
                <div key={group} className="space-y-3" data-testid={`section-${group.toLowerCase().replace(/\s+/g, "-")}`}>
                  <div className="text-xs font-semibold tracking-wide text-muted-foreground" data-testid={`text-group-${group.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {group.toUpperCase()}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {groupFields.map((f) => {
                      const variance = variances[f.key];
                      return (
                        <div key={f.key} className="rounded-xl border bg-background/40 p-4" data-testid={`card-field-${f.key}`}>
                          <div className="flex items-center justify-between">
                            <Label className="text-sm" data-testid={`label-${f.key}`}>{f.label}</Label>
                            {variance ? (
                              <Badge variant="destructive" className="pill" data-testid={`badge-variance-${f.key}`}>Variance</Badge>
                            ) : (
                              <Badge variant="secondary" className="pill" data-testid={`badge-ok-${f.key}`}>OK</Badge>
                            )}
                          </div>

                          <div className="mt-3 grid gap-3">
                            <Input
                              inputMode="numeric"
                              value={String(values[f.key] ?? 0)}
                              onChange={(e) => {
                                const next = normalizeInt(e.target.value);
                                setValues((s) => ({ ...s, [f.key]: next }));
                              }}
                              onBlur={() => {
                                const cur = values[f.key];
                                if (cur === undefined || cur === null || Number.isNaN(cur)) {
                                  setValues((s) => ({ ...s, [f.key]: 0 }));
                                }
                              }}
                              className="h-11 font-mono"
                              data-testid={`input-${f.key}`}
                            />

                            {variance ? (
                              <div className="grid gap-2">
                                <Label className="text-xs" data-testid={`label-reason-${f.key}`}>Variance reason</Label>
                                <Textarea
                                  value={reasons[f.key] ?? ""}
                                  onChange={(e) => setReasons((s) => ({ ...s, [f.key]: e.target.value }))}
                                  placeholder="Explain why this figure is non-zero"
                                  className="min-h-[72px]"
                                  data-testid={`textarea-reason-${f.key}`}
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                className="h-11"
                data-testid="button-submit-daily-figures"
                disabled={missingReasons.length > 0}
                onClick={() =>
                  toast({
                    title: "Submitted (prototype)",
                    description: "In production this would create an audit event and lock edits by role.",
                  })
                }
              >
                Submit
              </Button>
              <Button
                variant="secondary"
                className="h-11"
                data-testid="button-reset-daily-figures"
                onClick={() => {
                  const next: Record<string, number> = {};
                  for (const f of fields) next[f.key] = 0;
                  setValues(next);
                  setReasons({});
                }}
              >
                Reset to 0
              </Button>
            </div>
          </Card>

          <div className="grid gap-3">
            <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-daily-figures-summary">
              <div className="text-sm font-semibold" data-testid="text-summary-title">Summary</div>
              <div className="mt-3 grid gap-2">
                <div className="flex items-center justify-between" data-testid="row-summary-services">
                  <div className="text-sm text-muted-foreground">Services total</div>
                  <div className="font-mono" data-testid="text-summary-services">{totals.services}</div>
                </div>
                <div className="flex items-center justify-between" data-testid="row-summary-variance">
                  <div className="text-sm text-muted-foreground">Variance fields</div>
                  <div className="font-mono" data-testid="text-summary-variance-count">
                    {Object.values(variances).filter(Boolean).length}
                  </div>
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground" data-testid="text-summary-note">
                Totals and variances are auto-calculated. Any variance requires a reason.
              </div>
            </Card>

            <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-trading-day">
              <div className="text-sm font-semibold" data-testid="text-trading-title">Trading day</div>
              <div className="mt-3 text-sm text-muted-foreground" data-testid="text-trading-note">
                Due by end of trading day + 1 hour. Late submissions generate notifications.
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
