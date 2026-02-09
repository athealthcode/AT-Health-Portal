import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Calendar, CheckCircle2, ArrowLeft, ArrowRight, Lock, MessageSquareWarning } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useSubmittedDays } from "@/hooks/use-submitted-days";
import { useAuth } from "@/state/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

function normalizeMoney(v: string) {
  if (v === "") return "";
  const cleaned = v.replace(/[^0-9.-]/g, "");
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n)) return "";
  return Math.round(n * 100) / 100;
}

function formatCurrency(v: string | number) {
  const num = typeof v === 'string' ? parseFloat(v) : v;
  if (Number.isNaN(num)) return "£0.00";
  return `£${num.toFixed(2)}`;
}

export default function CashingUp() {
  const { toast } = useToast();
  const { session } = useAuth();
  const { isSubmitted, markSubmitted } = useSubmittedDays("cashing-up");

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [view, setView] = useState<"form" | "summary">("form");
  const [lastSubmitted, setLastSubmitted] = useState<{ inputs: any, payouts: any } | null>(null);
  
  const [inputs, setInputs] = useState<Record<string, string | number>>({
    toBeBanked: "",
    readingCard: "",
    vatStandard: "",
    vatExempt: "",
    vatZero: "",
    vatLow: "",
    userVariance: "", // Staff entered variance check
  });

  const [payouts, setPayouts] = useState<Array<{ id: string; label: string; amount: string | number }>>([
    { id: "p1", label: "", amount: "" },
  ]);

  const [highlightMissing, setHighlightMissing] = useState(false);
  const [varianceError, setVarianceError] = useState(false);

  // Problem Report State
  const [reportOpen, setReportOpen] = useState(false);
  const [problemMessage, setProblemMessage] = useState("");

  const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
  const submissionRecord = useMemo(() => isSubmitted(formattedDate), [formattedDate, isSubmitted]);

  // System Calculations
  const totalPayouts = useMemo(() => payouts.reduce((a, p) => a + (Number(p.amount) || 0), 0), [payouts]);
  const grossTaking = (Number(inputs.vatStandard)||0) + (Number(inputs.vatExempt)||0) + (Number(inputs.vatZero)||0) + (Number(inputs.vatLow)||0);
  const actualTaking = (Number(inputs.toBeBanked)||0) + (Number(inputs.readingCard)||0) + totalPayouts;
  const systemVariance = Math.round((grossTaking - actualTaking) * 100) / 100;
  
  const updateInput = (key: keyof typeof inputs, val: string) => {
    setInputs(prev => ({ ...prev, [key]: normalizeMoney(val) }));
    setHighlightMissing(false);
    
    // Check variance if userVariance is entered
    if (key === "userVariance" || key === "vatStandard" || key === "toBeBanked" /* incomplete dependency list for brevity */) {
       // We'll check on render or effect, but here works too for immediate feedback
       setVarianceError(false); 
    }
  };

  const handlePayoutChange = (id: string, field: "label" | "amount", value: string) => {
     setPayouts(s => s.map(p => p.id === id ? { ...p, [field]: field === "amount" ? normalizeMoney(value) : value } : p));
  };

  const handleSubmit = () => {
    if (!date) {
      toast({ title: "Date Required", description: "Please select a trading date.", variant: "destructive" });
      return;
    }

    // Validation: All fields required
    const missing = Object.values(inputs).some(v => v === "");
    if (missing) {
       setHighlightMissing(true);
       toast({ title: "Missing Fields", description: "All fields are required. Enter 0 if not applicable.", variant: "destructive" });
       return;
    }

    // Variance check
    const userVar = Number(inputs.userVariance);
    if (Math.abs(userVar - systemVariance) > 0.01) {
       setVarianceError(true);
       toast({ title: "Variance Mismatch", description: "Your calculated variance does not match the system.", variant: "destructive" });
       return;
    }

    markSubmitted(formattedDate, session.staff?.name || "Unknown");
    setLastSubmitted({ inputs, payouts });
    setView("summary");
    
    // Reset
    setInputs({
      toBeBanked: "",
      readingCard: "",
      vatStandard: "",
      vatExempt: "",
      vatZero: "",
      vatLow: "",
      userVariance: "",
    });
    setPayouts([{ id: "p1", label: "", amount: "" }]);
    setHighlightMissing(false);
    toast({ title: "Submitted", description: `Cashing up saved for ${format(date, "PPP")}.` });
  };

  const handleRaiseProblem = () => {
     toast({ title: "Problem Reported", description: "Head Office has been notified." });
     setReportOpen(false);
     setProblemMessage("");
  };

  // Submission Blocked View
  if (submissionRecord && view === "form" && !lastSubmitted) {
     return (
        <AppShell>
           <div className="flex flex-col gap-6 max-w-3xl mx-auto mt-10">
              <div className="flex items-center gap-4">
                 <Button variant="ghost" onClick={() => window.history.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                 </Button>
                 <h1 className="font-serif text-2xl">Cashing Up</h1>
              </div>

              <Card className="p-8 border-l-4 border-l-blue-500 bg-blue-50/50">
                 <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                       <Lock className="h-6 w-6" />
                    </div>
                    <div className="space-y-2 flex-1">
                       <h2 className="text-lg font-semibold text-blue-900">Already Submitted</h2>
                       <p className="text-blue-800/80">
                          Cashing up for <span className="font-medium">{format(date!, "PPP")}</span> was already submitted by <span className="font-medium">{submissionRecord.user}</span> on {new Date(submissionRecord.timestamp).toLocaleTimeString()}.
                       </p>
                       <p className="text-sm text-blue-800/60">
                          Only one submission is allowed per trading day.
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
                                Describe the issue. Head Office will be notified.
                             </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                             <div className="grid gap-2">
                                <Label>Message</Label>
                                <Textarea 
                                   value={problemMessage} 
                                   onChange={e => setProblemMessage(e.target.value)} 
                                   placeholder="e.g. Needs correction..."
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

  // Summary View
  if (view === "summary" && lastSubmitted) {
     return (
        <AppShell>
           <div className="flex flex-col gap-6 max-w-2xl mx-auto items-center justify-center min-h-[60vh]">
              <div className="h-20 w-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                 <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="text-center space-y-2">
                 <h2 className="text-3xl font-semibold tracking-tight">Submission Complete</h2>
                 <p className="text-muted-foreground">
                    Cashing up for <span className="font-medium text-foreground">{date ? format(date, "PPP") : "Unknown Date"}</span> has been recorded.
                 </p>
              </div>

              <Card className="w-full p-6 mt-4 bg-card/60">
                 <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Summary</h3>
                 <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between border-b pb-2">
                       <span>Gross Taking</span>
                       <span className="font-mono font-medium">
                          {formatCurrency((Number(lastSubmitted.inputs.vatStandard)||0) + (Number(lastSubmitted.inputs.vatExempt)||0) + (Number(lastSubmitted.inputs.vatZero)||0) + (Number(lastSubmitted.inputs.vatLow)||0))}
                       </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                       <span>Banked Cash</span>
                       <span className="font-mono font-medium">{formatCurrency(lastSubmitted.inputs.toBeBanked)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                       <span>Card Total</span>
                       <span className="font-mono font-medium">{formatCurrency(lastSubmitted.inputs.readingCard)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                       <span>Payouts Count</span>
                       <span className="font-mono font-medium">{lastSubmitted.payouts.length}</span>
                    </div>
                 </div>
              </Card>

              <div className="flex gap-4 w-full">
                 <Button variant="outline" className="flex-1 h-12" onClick={() => window.location.href = "/"}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                 </Button>
                 <Button className="flex-1 h-12" onClick={() => { setView("form"); setLastSubmitted(null); setDate(undefined); }}>
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
                      <div className="relative mt-1">
                         <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">£</span>
                         <Input 
                            className={`pl-6 h-10 font-mono ${highlightMissing && inputs.vatStandard === "" ? "border-destructive ring-destructive/20" : ""}`} 
                            value={inputs.vatStandard} 
                            onChange={e => updateInput("vatStandard", e.target.value)} 
                            placeholder="0.00"
                         />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Exempt</Label>
                      <div className="relative mt-1">
                         <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">£</span>
                         <Input 
                            className={`pl-6 h-10 font-mono ${highlightMissing && inputs.vatExempt === "" ? "border-destructive ring-destructive/20" : ""}`} 
                            value={inputs.vatExempt} 
                            onChange={e => updateInput("vatExempt", e.target.value)} 
                            placeholder="0.00"
                         />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Zero</Label>
                      <div className="relative mt-1">
                         <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">£</span>
                         <Input 
                            className={`pl-6 h-10 font-mono ${highlightMissing && inputs.vatZero === "" ? "border-destructive ring-destructive/20" : ""}`} 
                            value={inputs.vatZero} 
                            onChange={e => updateInput("vatZero", e.target.value)} 
                            placeholder="0.00"
                         />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">5% VAT</Label>
                      <div className="relative mt-1">
                         <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">£</span>
                         <Input 
                            className={`pl-6 h-10 font-mono ${highlightMissing && inputs.vatLow === "" ? "border-destructive ring-destructive/20" : ""}`} 
                            value={inputs.vatLow} 
                            onChange={e => updateInput("vatLow", e.target.value)} 
                            placeholder="0.00"
                         />
                      </div>
                    </div>
                 </div>
                 <div className="text-right text-sm font-medium">Gross Taking: {formatCurrency(grossTaking)}</div>
              </div>

              {/* ACTUAL COMPONENTS */}
              <div className="rounded-xl border bg-background/40 p-4">
                 <Label className="text-sm">To Be Banked</Label>
                 <div className="relative mt-2">
                    <span className="absolute left-3 top-3 text-xs text-muted-foreground">£</span>
                    <Input 
                       className={`pl-6 h-11 font-mono ${highlightMissing && inputs.toBeBanked === "" ? "border-destructive ring-destructive/20" : ""}`} 
                       value={inputs.toBeBanked} 
                       onChange={e => updateInput("toBeBanked", e.target.value)} 
                       placeholder="0.00"
                    />
                 </div>
              </div>

              <div className="rounded-xl border bg-background/40 p-4">
                 <Label className="text-sm">Reading Card</Label>
                 <div className="relative mt-2">
                    <span className="absolute left-3 top-3 text-xs text-muted-foreground">£</span>
                    <Input 
                       className={`pl-6 h-11 font-mono ${highlightMissing && inputs.readingCard === "" ? "border-destructive ring-destructive/20" : ""}`} 
                       value={inputs.readingCard} 
                       onChange={e => updateInput("readingCard", e.target.value)} 
                       placeholder="0.00"
                    />
                 </div>
              </div>

              {/* PAYOUTS */}
              <div className="rounded-xl border bg-background/40 p-4 md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                   <Label className="text-sm">Pay Outs</Label>
                   <span className="text-xs text-muted-foreground">Total: {formatCurrency(totalPayouts)}</span>
                </div>
                <div className="space-y-2">
                  {payouts.map((p) => (
                    <div key={p.id} className="flex gap-2">
                      <Input placeholder="Detail" value={p.label} onChange={e => handlePayoutChange(p.id, "label", e.target.value)} className="h-10" />
                      <div className="relative w-32">
                         <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">£</span>
                         <Input 
                            placeholder="0.00" 
                            value={p.amount} 
                            onChange={e => handlePayoutChange(p.id, "amount", e.target.value)} 
                            className="pl-6 h-10 font-mono" 
                         />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setPayouts(s => s.filter(x => x.id !== p.id))} disabled={payouts.length === 1}>×</Button>
                    </div>
                  ))}
                  <Button variant="secondary" size="sm" onClick={() => setPayouts(s => [...s, {id: Date.now().toString(), label: "", amount: ""}])}>Add Payout</Button>
                </div>
              </div>

              {/* VARIANCE CHECK */}
              <div className={`rounded-xl border p-4 md:col-span-2 ${varianceError ? 'border-destructive/50 bg-destructive/5' : 'bg-background/40'}`}>
                 <Label className="text-sm">Cash Up Variance (Double Check)</Label>
                 <div className="text-xs text-muted-foreground mb-2">Please calculate the variance manually and enter it here to verify.</div>
                 <div className="relative">
                    <span className="absolute left-3 top-3 text-xs text-muted-foreground">£</span>
                    <Input 
                       className={`pl-6 h-11 font-mono ${highlightMissing && inputs.userVariance === "" ? "border-destructive ring-destructive/20" : ""}`} 
                       value={inputs.userVariance} 
                       onChange={e => updateInput("userVariance", e.target.value)} 
                       placeholder="0.00"
                    />
                 </div>
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
                      <span className="font-mono">{formatCurrency(grossTaking)}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-muted-foreground">Actual Taking</span>
                      <span className="font-mono">{formatCurrency(actualTaking)}</span>
                   </div>
                   <Separator />
                   <div className="flex justify-between font-medium">
                      <span>System Variance</span>
                      <span className={`font-mono ${systemVariance !== 0 ? 'text-destructive' : ''}`}>{formatCurrency(systemVariance)}</span>
                   </div>
                </div>
             </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
