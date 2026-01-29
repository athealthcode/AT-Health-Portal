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

function normalizeMoney(v: string) {
  const cleaned = v.replace(/[^0-9.-]/g, "");
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

type VatKey = "exempt_nhs" | "low_5" | "standard_20" | "zero";

export default function CashingUp() {
  const { toast } = useToast();

  const [numbers, setNumbers] = useState<Record<string, number>>({
    till_count_actual: 0,
    gross_takings: 0,
    card_takings: 0,
    cash_to_bank: 0,
    deposit_amount: 0,
  });

  const [vat, setVat] = useState<Record<VatKey, number>>({
    exempt_nhs: 0,
    low_5: 0,
    standard_20: 0,
    zero: 0,
  });

  const [payingInRef, setPayingInRef] = useState("");
  const [payouts, setPayouts] = useState<Array<{ id: string; label: string; amount: number }>>([
    { id: "p1", label: "", amount: 0 },
  ]);

  const [varianceReason, setVarianceReason] = useState("");

  const vatTotal = useMemo(() => Object.values(vat).reduce((a, b) => a + b, 0), [vat]);
  const payoutsTotal = useMemo(() => payouts.reduce((a, p) => a + (p.amount || 0), 0), [payouts]);

  const actualTakings = useMemo(() => numbers.till_count_actual, [numbers.till_count_actual]);
  const variance = useMemo(() => Math.round((actualTakings - numbers.gross_takings) * 100) / 100, [actualTakings, numbers.gross_takings]);
  const hasVariance = variance !== 0;

  const canSubmit = !hasVariance || !!varianceReason.trim();

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div>
          <div className="font-serif text-2xl tracking-tight" data-testid="text-cashing-up-title">Cashing Up</div>
          <div className="text-sm text-muted-foreground" data-testid="text-cashing-up-subtitle">
            Single page. Mandatory numeric fields default to 0. Actual is the till count.
            Any variance requires a reason. VAT breakdown is included. EMIS removed.
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
          <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-cashing-up-form">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold" data-testid="text-cashup-form">Takings</div>
              <Badge variant={hasVariance && !varianceReason.trim() ? "destructive" : "secondary"} className="pill" data-testid="badge-cashup-variance">
                {hasVariance ? (varianceReason.trim() ? "Variance explained" : "Variance needs reason") : "No variance"}
              </Badge>
            </div>

            <Separator className="my-4" />

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border bg-background/40 p-4" data-testid="card-gross">
                <Label className="text-sm" data-testid="label-gross">Gross takings</Label>
                <Input
                  className="mt-2 h-11 font-mono"
                  value={String(numbers.gross_takings)}
                  onChange={(e) => setNumbers((s) => ({ ...s, gross_takings: normalizeMoney(e.target.value) }))}
                  onBlur={() => setNumbers((s) => ({ ...s, gross_takings: Number.isFinite(s.gross_takings) ? s.gross_takings : 0 }))}
                  data-testid="input-gross-takings"
                />
              </div>

              <div className="rounded-xl border bg-background/40 p-4" data-testid="card-actual">
                <Label className="text-sm" data-testid="label-actual">Actual takings (till count)</Label>
                <Input
                  className="mt-2 h-11 font-mono"
                  value={String(numbers.till_count_actual)}
                  onChange={(e) => setNumbers((s) => ({ ...s, till_count_actual: normalizeMoney(e.target.value) }))}
                  onBlur={() => setNumbers((s) => ({ ...s, till_count_actual: Number.isFinite(s.till_count_actual) ? s.till_count_actual : 0 }))}
                  data-testid="input-till-count"
                />
              </div>

              <div className="rounded-xl border bg-background/40 p-4" data-testid="card-cardtakings">
                <Label className="text-sm" data-testid="label-card">Card takings</Label>
                <Input
                  className="mt-2 h-11 font-mono"
                  value={String(numbers.card_takings)}
                  onChange={(e) => setNumbers((s) => ({ ...s, card_takings: normalizeMoney(e.target.value) }))}
                  onBlur={() => setNumbers((s) => ({ ...s, card_takings: Number.isFinite(s.card_takings) ? s.card_takings : 0 }))}
                  data-testid="input-card-takings"
                />
              </div>

              <div className="rounded-xl border bg-background/40 p-4" data-testid="card-cash-to-bank">
                <Label className="text-sm" data-testid="label-cash-bank">Cash to be banked</Label>
                <Input
                  className="mt-2 h-11 font-mono"
                  value={String(numbers.cash_to_bank)}
                  onChange={(e) => setNumbers((s) => ({ ...s, cash_to_bank: normalizeMoney(e.target.value) }))}
                  onBlur={() => setNumbers((s) => ({ ...s, cash_to_bank: Number.isFinite(s.cash_to_bank) ? s.cash_to_bank : 0 }))}
                  data-testid="input-cash-to-bank"
                />
              </div>

              <div className="rounded-xl border bg-background/40 p-4 md:col-span-2" data-testid="card-deposit">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-sm" data-testid="label-deposit">Deposit amount</Label>
                    <Input
                      className="mt-2 h-11 font-mono"
                      value={String(numbers.deposit_amount)}
                      onChange={(e) => setNumbers((s) => ({ ...s, deposit_amount: normalizeMoney(e.target.value) }))}
                      onBlur={() => setNumbers((s) => ({ ...s, deposit_amount: Number.isFinite(s.deposit_amount) ? s.deposit_amount : 0 }))}
                      data-testid="input-deposit-amount"
                    />
                  </div>
                  <div>
                    <Label className="text-sm" data-testid="label-paying-in">Paying-in reference</Label>
                    <Input
                      className="mt-2 h-11"
                      value={payingInRef}
                      onChange={(e) => setPayingInRef(e.target.value)}
                      placeholder="e.g. 29-01-2026-WIL"
                      data-testid="input-paying-in-reference"
                    />
                  </div>
                </div>
              </div>
            </div>

            {hasVariance ? (
              <div className="mt-4 rounded-xl border bg-background/40 p-4" data-testid="card-variance-reason">
                <Label className="text-sm" data-testid="label-variance">Variance reason (required)</Label>
                <Textarea
                  className="mt-2 min-h-[84px]"
                  value={varianceReason}
                  onChange={(e) => setVarianceReason(e.target.value)}
                  placeholder="Explain why actual differs from gross"
                  data-testid="textarea-variance-reason"
                />
              </div>
            ) : null}

            <div className="mt-4 rounded-2xl border bg-background/40 p-4" data-testid="card-vat">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold" data-testid="text-vat-title">VAT breakdown</div>
                <div className="text-xs text-muted-foreground" data-testid="text-vat-total">Total: £{vatTotal.toFixed(2)}</div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <Label className="text-sm" data-testid="label-vat-exempt">Exempt NHS</Label>
                  <Input
                    className="mt-2 h-11 font-mono"
                    value={String(vat.exempt_nhs)}
                    onChange={(e) => setVat((s) => ({ ...s, exempt_nhs: normalizeMoney(e.target.value) }))}
                    onBlur={() => setVat((s) => ({ ...s, exempt_nhs: Number.isFinite(s.exempt_nhs) ? s.exempt_nhs : 0 }))}
                    data-testid="input-vat-exempt"
                  />
                </div>
                <div>
                  <Label className="text-sm" data-testid="label-vat-low">Low (5%)</Label>
                  <Input
                    className="mt-2 h-11 font-mono"
                    value={String(vat.low_5)}
                    onChange={(e) => setVat((s) => ({ ...s, low_5: normalizeMoney(e.target.value) }))}
                    onBlur={() => setVat((s) => ({ ...s, low_5: Number.isFinite(s.low_5) ? s.low_5 : 0 }))}
                    data-testid="input-vat-low"
                  />
                </div>
                <div>
                  <Label className="text-sm" data-testid="label-vat-standard">Standard (20%)</Label>
                  <Input
                    className="mt-2 h-11 font-mono"
                    value={String(vat.standard_20)}
                    onChange={(e) => setVat((s) => ({ ...s, standard_20: normalizeMoney(e.target.value) }))}
                    onBlur={() => setVat((s) => ({ ...s, standard_20: Number.isFinite(s.standard_20) ? s.standard_20 : 0 }))}
                    data-testid="input-vat-standard"
                  />
                </div>
                <div>
                  <Label className="text-sm" data-testid="label-vat-zero">Zero rated</Label>
                  <Input
                    className="mt-2 h-11 font-mono"
                    value={String(vat.zero)}
                    onChange={(e) => setVat((s) => ({ ...s, zero: normalizeMoney(e.target.value) }))}
                    onBlur={() => setVat((s) => ({ ...s, zero: Number.isFinite(s.zero) ? s.zero : 0 }))}
                    data-testid="input-vat-zero"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border bg-background/40 p-4" data-testid="card-payouts">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold" data-testid="text-payouts-title">Payouts (flexible)</div>
                <div className="text-xs text-muted-foreground" data-testid="text-payouts-total">Total: £{payoutsTotal.toFixed(2)}</div>
              </div>
              <div className="mt-3 grid gap-2">
                {payouts.map((p, idx) => (
                  <div key={p.id} className="grid gap-2 md:grid-cols-[1fr_180px_auto]" data-testid={`row-payout-${p.id}`}>
                    <Input
                      value={p.label}
                      onChange={(e) =>
                        setPayouts((s) => s.map((x) => (x.id === p.id ? { ...x, label: e.target.value } : x)))
                      }
                      placeholder={`Payout ${idx + 1} label`}
                      className="h-11"
                      data-testid={`input-payout-label-${p.id}`}
                    />
                    <Input
                      value={String(p.amount)}
                      onChange={(e) =>
                        setPayouts((s) =>
                          s.map((x) => (x.id === p.id ? { ...x, amount: normalizeMoney(e.target.value) } : x)),
                        )
                      }
                      className="h-11 font-mono"
                      data-testid={`input-payout-amount-${p.id}`}
                    />
                    <Button
                      variant="outline"
                      className="h-11"
                      data-testid={`button-remove-payout-${p.id}`}
                      onClick={() => setPayouts((s) => s.filter((x) => x.id !== p.id))}
                      disabled={payouts.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  className="h-11"
                  data-testid="button-add-payout"
                  onClick={() => setPayouts((s) => [...s, { id: `p${Date.now()}`, label: "", amount: 0 }])}
                >
                  Add payout
                </Button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                className="h-11"
                data-testid="button-submit-cashing-up"
                disabled={!canSubmit}
                onClick={() =>
                  toast({
                    title: "Submitted (prototype)",
                    description: "In production this would lock edits by role and write audit logs.",
                  })
                }
              >
                Submit
              </Button>
              <Button
                variant="secondary"
                className="h-11"
                data-testid="button-reset-cashing-up"
                onClick={() => {
                  setNumbers({ till_count_actual: 0, gross_takings: 0, card_takings: 0, cash_to_bank: 0, deposit_amount: 0 });
                  setVat({ exempt_nhs: 0, low_5: 0, standard_20: 0, zero: 0 });
                  setPayingInRef("");
                  setPayouts([{ id: "p1", label: "", amount: 0 }]);
                  setVarianceReason("");
                }}
              >
                Reset to 0
              </Button>
            </div>
          </Card>

          <div className="grid gap-3">
            <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-cashup-summary">
              <div className="text-sm font-semibold" data-testid="text-cashup-summary">Summary</div>
              <div className="mt-3 grid gap-2">
                <div className="flex items-center justify-between" data-testid="row-cashup-actual">
                  <div className="text-sm text-muted-foreground">Actual takings</div>
                  <div className="font-mono" data-testid="text-cashup-actual">£{actualTakings.toFixed(2)}</div>
                </div>
                <div className="flex items-center justify-between" data-testid="row-cashup-variance">
                  <div className="text-sm text-muted-foreground">Variance</div>
                  <div className="font-mono" data-testid="text-cashup-variance">£{variance.toFixed(2)}</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-muted-foreground" data-testid="text-cashup-note">
                Variance is any value not 0 and requires a reason.
              </div>
            </Card>

            <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-cashup-reporting">
              <div className="text-sm font-semibold" data-testid="text-cashup-report-title">Reporting</div>
              <div className="mt-3 text-sm text-muted-foreground" data-testid="text-cashup-report-note">
                Report exports include gross, actual, variance, card, cash to bank, deposit and VAT totals.
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
