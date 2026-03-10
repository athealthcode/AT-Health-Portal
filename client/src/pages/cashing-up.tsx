import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Calendar, CheckCircle2, ArrowLeft, ArrowRight, Lock, Edit2, FileCheck, Landmark } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useSubmittedDays } from "@/hooks/use-submitted-days";
import { useAuth } from "@/state/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

function normalizeMoney(v: string) {
  if (v === "") return "";
  return v.replace(/[^0-9.]/g, "");
}

function formatCurrency(v: string | number) {
  const num = typeof v === 'string' ? parseFloat(v) : v;
  if (Number.isNaN(num)) return "£0.00";
  return `£${num.toFixed(2)}`;
}

export default function CashingUp() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { session } = useAuth();

  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Custom mock data for historical view
  const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
  const [submittedData, setSubmittedData] = useState<Record<string, any>>({
     "2026-03-01": { 
        user: "John Smith", 
        timestamp: new Date().getTime() - 86400000, 
        inputs: { vatStandard: "120.00", vatExempt: "0.00", vatZero: "50.00", vatLow: "0.00", vatNone: "0.00", toBeBanked: "50.00", readingCard: "120.00", userVariance: "0.00" },
        payouts: [{ id: "1", type: "locum", label: "Dr Sarah", amount: "250.00", invoiceUploaded: true }],
        banking: [{ id: "b1", amount: "500.00", location: "Barclays High St" }]
     }
  });

  const existingRecord = submittedData[formattedDate];
  const isHeadOffice = session.scope.type === "headoffice";
  const [isEditingMode, setIsEditingMode] = useState(!existingRecord);

  useEffect(() => {
     setIsEditingMode(!submittedData[formattedDate] || isHeadOffice);
  }, [formattedDate, submittedData, isHeadOffice]);
  
  const [inputs, setInputs] = useState<Record<string, string | number>>({
    toBeBanked: "",
    readingCard: "",
    vatStandard: "",
    vatExempt: "",
    vatZero: "",
    vatLow: "",
    vatNone: "", // New Field
    userVariance: "", 
  });

  const [payouts, setPayouts] = useState<Array<{ id: string; type: string; label: string; amount: string | number; location?: string; invoiceUploaded?: boolean }>>([
    { id: "p1", type: "expense", label: "", amount: "" },
  ]);
  
  const [banking, setBanking] = useState<Array<{ id: string; amount: string | number; location: string }>>([]);

  // Load existing data
  useEffect(() => {
     if (existingRecord && existingRecord.inputs) {
        setInputs({
           toBeBanked: "", readingCard: "", vatStandard: "", vatExempt: "", vatZero: "", vatLow: "", vatNone: "", userVariance: "", 
           ...existingRecord.inputs 
        });
        setPayouts(existingRecord.payouts || [{ id: "p1", type: "expense", label: "", amount: "" }]);
        setBanking(existingRecord.banking || []);
     } else {
        setInputs({
           toBeBanked: "", readingCard: "", vatStandard: "", vatExempt: "", vatZero: "", vatLow: "", vatNone: "", userVariance: "", 
        });
        setPayouts([{ id: "p1", type: "expense", label: "", amount: "" }]);
        setBanking([]);
     }
  }, [formattedDate, existingRecord]);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [notCompletedReason, setNotCompletedReason] = useState("");
  const [notCompletedOpen, setNotCompletedOpen] = useState(false);

  // System Calculations
  const totalPayouts = useMemo(() => payouts.reduce((a, p) => a + (Number(p.amount) || 0), 0), [payouts]);
  const totalBanking = useMemo(() => banking.reduce((a, b) => a + (Number(b.amount) || 0), 0), [banking]);
  
  const grossTaking = (Number(inputs.vatStandard)||0) + (Number(inputs.vatExempt)||0) + (Number(inputs.vatZero)||0) + (Number(inputs.vatLow)||0) + (Number(inputs.vatNone)||0);
  const actualTaking = (Number(inputs.toBeBanked)||0) + (Number(inputs.readingCard)||0) + totalPayouts;
  const systemVariance = Math.round((grossTaking - actualTaking) * 100) / 100;
  
  // Mock Store Cash Logic
  const initialStoreCash = 1250.00;
  const storeCashAfterDay = initialStoreCash + (Number(inputs.toBeBanked)||0) - totalBanking;

  const updateInput = (key: keyof typeof inputs, val: string) => {
    setInputs(prev => ({ ...prev, [key]: normalizeMoney(val) }));
    if (validationErrors[key]) {
       setValidationErrors(prev => { const n = {...prev}; delete n[key]; return n; });
    }
    setGlobalError(null);
  };

  const handleBlur = (key: keyof typeof inputs) => {
     if (inputs[key] !== "") {
        const num = parseFloat(inputs[key] as string);
        if (!Number.isNaN(num)) {
           setInputs(s => ({ ...s, [key]: num.toFixed(2) }));
        }
     }
  };

  const handlePayoutChange = (id: string, field: string, value: any) => {
     setPayouts(s => s.map(p => p.id === id ? { ...p, [field]: field === "amount" ? normalizeMoney(value) : value } : p));
  };

  const handlePayoutBlur = (id: string) => {
     setPayouts(s => s.map(p => {
        if (p.id === id && p.amount !== "") {
           const num = parseFloat(p.amount as string);
           return { ...p, amount: Number.isNaN(num) ? "" : num.toFixed(2) };
        }
        return p;
     }));
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    let hasMissing = false;

    if (!date) return { global: "Date is required.", errors };

    // Require explicit 0s for all core input fields
    Object.keys(inputs).forEach(k => {
       if (inputs[k as keyof typeof inputs] === "") {
          errors[k] = "Required. Enter 0 if none.";
          hasMissing = true;
       }
    });

    // Payout Validations
    payouts.forEach((p, i) => {
       if (p.amount !== "" && Number(p.amount) > 0) {
          if (!p.label) errors[`payout_${i}_label`] = "Detail required";
          if (p.type === "locum" && !p.invoiceUploaded) {
             errors[`payout_${i}_invoice`] = "Invoice confirmation required for locum payouts";
          }
       }
    });
    
    // Banking Validations
    banking.forEach((b, i) => {
       if (b.amount !== "" && Number(b.amount) > 0 && !b.location) {
          errors[`banking_${i}_location`] = "Bank location required";
       }
    });

    // Variance Check
    const userVar = Number(inputs.userVariance || 0);
    if (Math.abs(userVar - systemVariance) > 0.01) {
       errors["userVariance"] = "Does not match calculated system variance";
    }

    if (hasMissing) {
       return { global: "Missing fields. Ensure all input fields have a value (0).", errors };
    }

    if (Object.keys(errors).length > 0) {
       return { global: "Please fix the highlighted errors.", errors };
    }

    return { global: null, errors: {} };
  };

  const handleSubmit = () => {
    const { global, errors } = validate();
    
    if (global || Object.keys(errors).length > 0) {
       setValidationErrors(errors);
       setGlobalError(global);
       toast({ title: "Validation Error", description: global || "Fix errors below.", variant: "destructive" });
       return;
    }

    setSubmittedData(prev => ({
       ...prev,
       [formattedDate]: {
          user: session.staff?.name || session.userEmail || "Unknown",
          timestamp: Date.now(),
          inputs: { ...inputs },
          payouts: [...payouts],
          banking: [...banking],
       }
    }));
    
    setIsEditingMode(false);
    toast({ title: "Submitted", description: `Cashing up saved for ${format(date!, "PPP")}.` });
  };

  const handleMarkNotCompleted = () => {
     if (!notCompletedReason) return;
     
     setSubmittedData(prev => ({
        ...prev,
        [formattedDate]: {
           user: session.staff?.name || session.userEmail || "Unknown",
           timestamp: Date.now(),
           status: "not_completed",
           reason: notCompletedReason,
        }
     }));
     
     setNotCompletedOpen(false);
     setIsEditingMode(false);
     toast({ title: "Status Updated", description: "Marked as not completed." });
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div>
          <div className="font-serif text-2xl tracking-tight" data-testid="text-cashing-up-title">Cashing Up</div>
          <div className="text-sm text-muted-foreground" data-testid="text-cashing-up-subtitle">
            Enter daily trading figures. Explicit 0 required for all fields.
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
             {/* HEADER STRIP */}
             <Card className={`p-4 flex items-center gap-4 border shadow-sm ${existingRecord ? (existingRecord.status === 'not_completed' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200') : 'bg-primary/5 border-primary/20'}`}>
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
                         <Button variant="outline" className="w-[180px] justify-start text-left font-normal bg-background">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                         </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                         <CalendarComponent mode="single" selected={date} onSelect={setDate} initialFocus />
                      </PopoverContent>
                   </Popover>

                   {(session.role === "Pharmacy Manager" || isHeadOffice) && !existingRecord && (
                      <Dialog open={notCompletedOpen} onOpenChange={setNotCompletedOpen}>
                         <DialogTrigger asChild>
                            <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50">
                               Mark Not Completed
                            </Button>
                         </DialogTrigger>
                         <DialogContent>
                            <DialogHeader>
                               <DialogTitle>Mark Day as Not Completed</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                               <Label>Reason</Label>
                               <Textarea value={notCompletedReason} onChange={e => setNotCompletedReason(e.target.value)} className="mt-2" />
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
                   <AlertCircle className="h-4 w-4 shrink-0" /> {globalError}
                </div>
             )}

             {existingRecord && existingRecord.status === 'not_completed' ? (
                <Card className="p-8 text-center border-dashed bg-muted/30">
                   <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                   <h3 className="font-semibold text-lg">Marked as Not Completed</h3>
                   <p className="text-muted-foreground mt-1">{existingRecord.reason}</p>
                   {isHeadOffice && (
                      <Button variant="outline" className="mt-4" onClick={() => setIsEditingMode(true)}>
                         <Edit2 className="h-4 w-4 mr-2" /> Override & Enter Data
                      </Button>
                   )}
                </Card>
             ) : (
                <div className={!isEditingMode ? "pointer-events-none opacity-80 space-y-4" : "space-y-4"}>
                  {!isEditingMode && !isHeadOffice && (
                     <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl flex items-center gap-3 text-sm">
                        <Lock className="h-4 w-4 shrink-0" /> Figures have been submitted for this date and are view-only.
                     </div>
                  )}

                  <Card className="rounded-2xl border bg-card/60 p-5 shadow-sm">
                     <div className="text-sm font-semibold mb-4">VAT Analysis (Gross Components)</div>
                     <div className="grid gap-4 sm:grid-cols-5">
                        {["Standard", "Exempt", "Zero", "Low", "None"].map(v => {
                           const key = `vat${v}` as keyof typeof inputs;
                           return (
                              <div key={key} className="space-y-1 relative">
                                 <Label className="text-xs">{v === "Standard" ? "Standard (20%)" : v === "Low" ? "5% VAT" : v === "None" ? "No VAT" : v}</Label>
                                 <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">£</span>
                                    <Input 
                                       className={`pl-6 h-10 font-mono ${validationErrors[key] ? "border-destructive ring-destructive/20" : ""}`}
                                       value={inputs[key]} onChange={e => updateInput(key, e.target.value)} onBlur={() => handleBlur(key)}
                                       readOnly={!isEditingMode}
                                    />
                                 </div>
                                 {validationErrors[key] && <div className="text-[10px] text-destructive leading-tight absolute -bottom-4">{validationErrors[key]}</div>}
                              </div>
                           )
                        })}
                     </div>
                  </Card>

                  <div className="grid md:grid-cols-2 gap-4">
                     <Card className="rounded-2xl border bg-card/60 p-5 shadow-sm">
                        <div className="space-y-1 relative">
                           <Label className="text-sm font-semibold">To Be Banked (Cash)</Label>
                           <div className="relative mt-2">
                              <span className="absolute left-3 top-3 text-xs text-muted-foreground">£</span>
                              <Input 
                                 className={`pl-6 h-11 font-mono ${validationErrors["toBeBanked"] ? "border-destructive ring-destructive/20" : ""}`}
                                 value={inputs.toBeBanked} onChange={e => updateInput("toBeBanked", e.target.value)} onBlur={() => handleBlur("toBeBanked")}
                                 readOnly={!isEditingMode}
                              />
                           </div>
                           {validationErrors["toBeBanked"] && <div className="text-[10px] text-destructive absolute -bottom-4">{validationErrors["toBeBanked"]}</div>}
                        </div>
                     </Card>
                     
                     <Card className="rounded-2xl border bg-card/60 p-5 shadow-sm">
                        <div className="space-y-1 relative">
                           <Label className="text-sm font-semibold">Reading Card</Label>
                           <div className="relative mt-2">
                              <span className="absolute left-3 top-3 text-xs text-muted-foreground">£</span>
                              <Input 
                                 className={`pl-6 h-11 font-mono ${validationErrors["readingCard"] ? "border-destructive ring-destructive/20" : ""}`}
                                 value={inputs.readingCard} onChange={e => updateInput("readingCard", e.target.value)} onBlur={() => handleBlur("readingCard")}
                                 readOnly={!isEditingMode}
                              />
                           </div>
                           {validationErrors["readingCard"] && <div className="text-[10px] text-destructive absolute -bottom-4">{validationErrors["readingCard"]}</div>}
                        </div>
                     </Card>
                  </div>

                  {/* PAYOUTS & BANKING */}
                  <Card className="rounded-2xl border bg-card/60 p-5 shadow-sm">
                     <div className="flex justify-between items-center mb-4">
                        <Label className="text-sm font-semibold">Pay Outs & Banking</Label>
                     </div>
                     
                     <div className="space-y-6">
                        <div className="space-y-3">
                           <div className="text-xs font-semibold text-muted-foreground uppercase">Till Payouts</div>
                           {payouts.map((p, i) => (
                             <div key={p.id} className="bg-background/50 p-3 rounded-xl border flex flex-col gap-3">
                               <div className="flex gap-2 items-start">
                                 <Select disabled={!isEditingMode} value={p.type} onValueChange={v => handlePayoutChange(p.id, "type", v)}>
                                    <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                       <SelectItem value="expense">Expense</SelectItem>
                                       <SelectItem value="locum">Locum Payout</SelectItem>
                                    </SelectContent>
                                 </Select>
                                 
                                 <div className="flex-1 space-y-1">
                                    <Input placeholder={p.type === 'locum' ? "Locum Full Name" : "Detail"} value={p.label} onChange={e => handlePayoutChange(p.id, "label", e.target.value)} className={validationErrors[`payout_${i}_label`] ? "border-destructive" : ""} readOnly={!isEditingMode} />
                                    {validationErrors[`payout_${i}_label`] && <div className="text-[10px] text-destructive">{validationErrors[`payout_${i}_label`]}</div>}
                                 </div>
                                 
                                 <div className="relative w-32 shrink-0">
                                    <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">£</span>
                                    <Input placeholder="0.00" value={p.amount} onChange={e => handlePayoutChange(p.id, "amount", e.target.value)} onBlur={() => handlePayoutBlur(p.id)} className="pl-6 font-mono" readOnly={!isEditingMode} />
                                 </div>
                                 <Button variant="ghost" size="icon" onClick={() => setPayouts(s => s.filter(x => x.id !== p.id))} disabled={payouts.length === 1 || !isEditingMode}>×</Button>
                               </div>
                               
                               {p.type === 'locum' && (
                                  <div className="flex items-center space-x-2 pl-1">
                                     <Checkbox id={`inv-${p.id}`} checked={p.invoiceUploaded} onCheckedChange={(c) => handlePayoutChange(p.id, "invoiceUploaded", c)} disabled={!isEditingMode} />
                                     <Label htmlFor={`inv-${p.id}`} className={`text-xs ${validationErrors[`payout_${i}_invoice`] ? "text-destructive" : "text-muted-foreground"}`}>
                                        I confirm I have uploaded the locum invoice
                                     </Label>
                                  </div>
                               )}
                             </div>
                           ))}
                           {isEditingMode && <Button variant="secondary" size="sm" onClick={() => setPayouts(s => [...s, {id: Date.now().toString(), type: "expense", label: "", amount: ""}])}>Add Payout</Button>}
                        </div>

                        <Separator />

                        <div className="space-y-3">
                           <div className="flex justify-between items-center">
                              <div className="text-xs font-semibold text-muted-foreground uppercase">Bank Deposits</div>
                           </div>
                           {banking.length === 0 ? (
                              <div className="text-xs text-muted-foreground italic pl-1">No banking entries today.</div>
                           ) : banking.map((b, i) => (
                             <div key={b.id} className="flex gap-2 items-start">
                               <div className="flex-1 space-y-1">
                                  <Input placeholder="Bank Location (e.g. Barclays High St)" value={b.location} onChange={e => setBanking(s => s.map(x => x.id === b.id ? {...x, location: e.target.value} : x))} className={validationErrors[`banking_${i}_location`] ? "border-destructive" : ""} readOnly={!isEditingMode} />
                                  {validationErrors[`banking_${i}_location`] && <div className="text-[10px] text-destructive">{validationErrors[`banking_${i}_location`]}</div>}
                               </div>
                               <div className="relative w-32 shrink-0">
                                  <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">£</span>
                                  <Input placeholder="0.00" value={b.amount} onChange={e => setBanking(s => s.map(x => x.id === b.id ? {...x, amount: normalizeMoney(e.target.value)} : x))} onBlur={() => {
                                     setBanking(s => s.map(x => {
                                        if (x.id === b.id && x.amount) {
                                           const n = parseFloat(x.amount as string);
                                           return {...x, amount: isNaN(n) ? "" : n.toFixed(2)};
                                        } return x;
                                     }));
                                  }} className="pl-6 font-mono" readOnly={!isEditingMode} />
                               </div>
                               <Button variant="ghost" size="icon" onClick={() => setBanking(s => s.filter(x => x.id !== b.id))} disabled={!isEditingMode}>×</Button>
                             </div>
                           ))}
                           {isEditingMode && <Button variant="secondary" size="sm" onClick={() => setBanking(s => [...s, {id: Date.now().toString(), location: "", amount: ""}])}>Add Bank Deposit</Button>}
                        </div>
                     </div>
                  </Card>

                  {/* VARIANCE CHECK */}
                  <div className={`rounded-xl border p-5 ${validationErrors["userVariance"] ? 'border-destructive/50 bg-destructive/5' : 'bg-card/60 shadow-sm'}`}>
                     <Label className="text-sm font-semibold">Cash Up Variance (Double Check)</Label>
                     <div className="text-xs text-muted-foreground mb-3">Calculate the variance manually and enter it here to verify against the system.</div>
                     <div className="relative space-y-1">
                        <div className="relative">
                           <span className="absolute left-3 top-3 text-xs text-muted-foreground">£</span>
                           <Input 
                              className={`pl-6 h-11 font-mono ${validationErrors["userVariance"] ? "border-destructive ring-destructive/20" : ""}`} 
                              value={inputs.userVariance} onChange={e => updateInput("userVariance", e.target.value)} onBlur={() => handleBlur("userVariance")}
                              readOnly={!isEditingMode} placeholder="0.00"
                           />
                        </div>
                        {validationErrors["userVariance"] && (
                           <div className="flex items-center gap-1.5 mt-1 text-xs text-destructive font-medium">
                              <AlertCircle className="h-3.5 w-3.5" /> Mismatch check system variance.
                           </div>
                        )}
                     </div>
                  </div>
                  
                  {isEditingMode && (
                     <div className="mt-6 flex gap-2">
                        <Button className="h-12 w-full text-lg" onClick={handleSubmit}>
                           Submit Cashing Up
                        </Button>
                     </div>
                  )}
                </div>
             )}
          </div>

          <div className="grid gap-4 content-start">
             <Card className="rounded-2xl border bg-card/60 p-5 shadow-sm sticky top-6">
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

             <Card className="rounded-2xl border bg-card/60 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                   <Landmark className="h-4 w-4 text-primary" />
                   <div className="text-sm font-semibold">Store Cash Monitor</div>
                </div>
                <div className="space-y-3 text-sm">
                   <div className="flex justify-between text-muted-foreground text-xs">
                      <span>Start of Day</span>
                      <span className="font-mono">{formatCurrency(initialStoreCash)}</span>
                   </div>
                   <div className="flex justify-between text-muted-foreground text-xs">
                      <span>To Bank Today</span>
                      <span className="font-mono text-emerald-600">+{formatCurrency(inputs.toBeBanked)}</span>
                   </div>
                   <div className="flex justify-between text-muted-foreground text-xs">
                      <span>Banked Today</span>
                      <span className="font-mono text-red-500">-{formatCurrency(totalBanking)}</span>
                   </div>
                   <Separator />
                   <div>
                      <div className="flex justify-between font-semibold mb-1">
                         <span>Month to Date Cash</span>
                         <span className="font-mono text-lg">{formatCurrency(storeCashAfterDay)}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground text-right">Physical cash currently in store</div>
                   </div>
                </div>
             </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
