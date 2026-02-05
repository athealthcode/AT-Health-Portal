import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

function normalizeMoney(v: string) {
  const cleaned = v.replace(/[^0-9.-]/g, "");
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export default function CashingUp() {
  const { toast } = useToast();

  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const [inputs, setInputs] = useState({
    toBeBanked: 0,
    readingCard: 0,
    vatStandard: 0,
    vatExempt: 0,
    vatZero: 0,
    vatLow: 0,
    userVariance: 0, // Staff entered variance check
  });

  const [payouts, setPayouts] = useState<Array<{ id: string; label: string; amount: number }>>([
    { id: "p1", label: "", amount: 0 },
  ]);

  // System Calculations
  const totalPayouts = useMemo(() => payouts.reduce((a, p) => a + (p.amount || 0), 0), [payouts]);
  const grossTaking = inputs.vatStandard + inputs.vatExempt + inputs.vatZero + inputs.vatLow;
  const actualTaking = inputs.toBeBanked + inputs.readingCard + totalPayouts;
  const systemVariance = Math.round((grossTaking - actualTaking) * 100) / 100;
  
  // Validation: User entered variance must match system variance
  const varianceMatch = inputs.userVariance === systemVariance;
  const varianceError = !varianceMatch;

  const updateInput = (key: keyof typeof inputs, val: string) => {
    setInputs(prev => ({ ...prev, [key]: normalizeMoney(val) }));
  };

  const handleSubmit = () => {
    if (!date) {
      toast({ title: "Date Required", description: "Please select a trading date.", variant: "destructive" });
      return;
    }
    toast({ title: "Submitted", description: `Cashing up saved for ${format(date, "PPP")}.` });
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div>
          <div className="font-serif text-2xl tracking-tight" data-testid="text-cashing-up-title">Cashing Up</div>
          <div className="text-sm text-muted-foreground" data-testid="text-cashing-up-subtitle">
            Enter daily trading figures. Month-to-date reports available in Reporting.
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_360px]">
          <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-cashing-up-form">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm font-semibold">Inputs</div>
              
              <div className="flex items-center gap-2">
                 <Label className="text-xs text-muted-foreground uppercase tracking-wider">Trading Day:</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                       <Button
                          variant="outline"
                          className={`w-[200px] justify-start text-left font-normal ${!date && "text-muted-foreground"}`}
                       >
                          <Calendar className="mr-2 h-4 w-4" />
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
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid gap-6 md:grid-cols-2">
              {/* VAT BUCKETS (GROSS) */}
              <div className="space-y-4 rounded-xl border bg-background/40 p-4 md:col-span-2">
                 <div className="text-xs font-semibold text-muted-foreground uppercase">VAT Analysis (Gross Components)</div>
                 <div className="grid gap-4 sm:grid-cols-4">
                    <div>
                      <Label className="text-xs">Standard (20%)</Label>
                      <Input className="mt-1 h-10 font-mono" value={inputs.vatStandard} onChange={e => updateInput("vatStandard", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Exempt</Label>
                      <Input className="mt-1 h-10 font-mono" value={inputs.vatExempt} onChange={e => updateInput("vatExempt", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">Zero</Label>
                      <Input className="mt-1 h-10 font-mono" value={inputs.vatZero} onChange={e => updateInput("vatZero", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">5% VAT</Label>
                      <Input className="mt-1 h-10 font-mono" value={inputs.vatLow} onChange={e => updateInput("vatLow", e.target.value)} />
                    </div>
                 </div>
                 <div className="text-right text-sm font-medium">Gross Taking: £{grossTaking.toFixed(2)}</div>
              </div>

              {/* ACTUAL COMPONENTS */}
              <div className="rounded-xl border bg-background/40 p-4">
                 <Label className="text-sm">To Be Banked</Label>
                 <Input className="mt-2 h-11 font-mono" value={inputs.toBeBanked} onChange={e => updateInput("toBeBanked", e.target.value)} />
              </div>

              <div className="rounded-xl border bg-background/40 p-4">
                 <Label className="text-sm">Reading Card</Label>
                 <Input className="mt-2 h-11 font-mono" value={inputs.readingCard} onChange={e => updateInput("readingCard", e.target.value)} />
              </div>

              {/* PAYOUTS */}
              <div className="rounded-xl border bg-background/40 p-4 md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                   <Label className="text-sm">Pay Outs</Label>
                   <span className="text-xs text-muted-foreground">Total: £{totalPayouts.toFixed(2)}</span>
                </div>
                <div className="space-y-2">
                  {payouts.map((p) => (
                    <div key={p.id} className="flex gap-2">
                      <Input placeholder="Detail" value={p.label} onChange={e => setPayouts(s => s.map(x => x.id === p.id ? {...x, label: e.target.value} : x))} className="h-10" />
                      <Input placeholder="£" value={p.amount} onChange={e => setPayouts(s => s.map(x => x.id === p.id ? {...x, amount: normalizeMoney(e.target.value)} : x))} className="h-10 font-mono w-32" />
                      <Button variant="ghost" size="icon" onClick={() => setPayouts(s => s.filter(x => x.id !== p.id))} disabled={payouts.length === 1}>×</Button>
                    </div>
                  ))}
                  <Button variant="secondary" size="sm" onClick={() => setPayouts(s => [...s, {id: Date.now().toString(), label: "", amount: 0}])}>Add Payout</Button>
                </div>
              </div>

              {/* VARIANCE CHECK */}
              <div className={`rounded-xl border p-4 md:col-span-2 ${varianceError ? 'border-destructive/50 bg-destructive/5' : 'bg-background/40'}`}>
                 <Label className="text-sm">Cash Up Variance (Double Check)</Label>
                 <div className="text-xs text-muted-foreground mb-2">Please calculate the variance manually and enter it here to verify.</div>
                 <Input className="h-11 font-mono" value={inputs.userVariance} onChange={e => updateInput("userVariance", e.target.value)} />
                 {varianceError && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-destructive font-medium">
                       <AlertCircle className="h-4 w-4" />
                       Mismatch. Please check your entries.
                    </div>
                 )}
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button 
                className="h-11 w-full" 
                disabled={varianceError || !date}
                onClick={handleSubmit}
              >
                Submit Cashing Up
              </Button>
            </div>
          </Card>

          <div className="grid gap-3">
             <Card className="rounded-2xl border bg-card/60 p-5">
                <div className="text-sm font-semibold mb-3">System Calculations</div>
                <div className="space-y-3 text-sm">
                   <div className="flex justify-between">
                      <span className="text-muted-foreground">Gross Taking</span>
                      <span className="font-mono">£{grossTaking.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-muted-foreground">Actual Taking</span>
                      <span className="font-mono">£{actualTaking.toFixed(2)}</span>
                   </div>
                   <Separator />
                   <div className="flex justify-between font-medium">
                      <span>System Variance</span>
                      <span className={`font-mono ${systemVariance !== 0 ? 'text-destructive' : ''}`}>£{systemVariance.toFixed(2)}</span>
                   </div>
                </div>
             </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
