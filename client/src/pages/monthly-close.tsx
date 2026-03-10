import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/state/auth";
import { CalendarIcon, CheckCircle2, AlertTriangle, ArrowRight, Lock, FileText, Check, Unlock, CheckSquare } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MOCK_MONTHS = [
  { month: "February 2026", status: "closed", completedBy: "info@at-health.co.uk", date: "02 Mar 2026" },
  { month: "March 2026", status: "open" }
];

export default function MonthlyClose() {
  const { session } = useAuth();
  const isHeadOffice = session.scope.type === "headoffice";
  const [pharmacy, setPharmacy] = useState<string>(isHeadOffice ? "bowland" : session.scope.type === "pharmacy" ? session.scope.pharmacyId : "bowland");
  
  const [checks, setChecks] = useState({
    dailyFigures: true,
    cashingUp: true,
    bookkeeping: true,
    banking: false,
    bonus: false,
    pqs: true
  });

  const allChecked = Object.values(checks).every(Boolean);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div>
            <div className="font-serif text-2xl tracking-tight flex items-center gap-2">
               <CheckSquare className="h-6 w-6 text-primary" />
               Monthly Close Workflow
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Finalise and lock month-end reporting per pharmacy.
            </div>
          </div>
          {isHeadOffice && (
             <Select value={pharmacy} onValueChange={setPharmacy}>
                <SelectTrigger className="w-[180px]">
                   <SelectValue />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="bowland">Bowland Pharmacy</SelectItem>
                   <SelectItem value="denton">Denton Pharmacy</SelectItem>
                   <SelectItem value="wilmslow">Wilmslow Pharmacy</SelectItem>
                </SelectContent>
             </Select>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
           <Card className="md:col-span-2 rounded-2xl border bg-card/60 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="font-semibold text-lg">March 2026 Close</h3>
                    <p className="text-xs text-muted-foreground">Complete all checks to lock the month.</p>
                 </div>
                 <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Open</Badge>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                       <div className={`w-6 h-6 rounded-full flex items-center justify-center ${checks.dailyFigures ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {checks.dailyFigures ? <Check className="w-4 h-4" /> : <span className="text-xs">1</span>}
                       </div>
                       <div>
                          <div className="font-medium text-sm">All Daily Figures Submitted</div>
                          <div className="text-xs text-muted-foreground">31/31 days entered</div>
                       </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setChecks(s => ({...s, dailyFigures: !s.dailyFigures}))}>
                       {checks.dailyFigures ? 'Unverify' : 'Verify'}
                    </Button>
                 </div>

                 <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                       <div className={`w-6 h-6 rounded-full flex items-center justify-center ${checks.cashingUp ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {checks.cashingUp ? <Check className="w-4 h-4" /> : <span className="text-xs">2</span>}
                       </div>
                       <div>
                          <div className="font-medium text-sm">All Cashing Up Submitted</div>
                          <div className="text-xs text-muted-foreground">31/31 days entered</div>
                       </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setChecks(s => ({...s, cashingUp: !s.cashingUp}))}>
                       {checks.cashingUp ? 'Unverify' : 'Verify'}
                    </Button>
                 </div>

                 <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                       <div className={`w-6 h-6 rounded-full flex items-center justify-center ${checks.bookkeeping ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {checks.bookkeeping ? <Check className="w-4 h-4" /> : <span className="text-xs">3</span>}
                       </div>
                       <div>
                          <div className="font-medium text-sm">Bookkeeping Completed</div>
                          <div className="text-xs text-muted-foreground">All mandatory items ticked</div>
                       </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setChecks(s => ({...s, bookkeeping: !s.bookkeeping}))}>
                       {checks.bookkeeping ? 'Unverify' : 'Verify'}
                    </Button>
                 </div>

                 <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                       <div className={`w-6 h-6 rounded-full flex items-center justify-center ${checks.banking ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {checks.banking ? <Check className="w-4 h-4" /> : <span className="text-xs">4</span>}
                       </div>
                       <div>
                          <div className="font-medium text-sm">Banking Reconciled</div>
                          <div className="text-xs text-muted-foreground text-amber-500">Unreconciled difference: -£20.25</div>
                       </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setChecks(s => ({...s, banking: !s.banking}))}>
                       {checks.banking ? 'Unverify' : 'Verify'}
                    </Button>
                 </div>

                 <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                    <div className="flex items-center gap-3">
                       <div className={`w-6 h-6 rounded-full flex items-center justify-center ${checks.bonus ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                          {checks.bonus ? <Check className="w-4 h-4" /> : <span className="text-xs">5</span>}
                       </div>
                       <div>
                          <div className="font-medium text-sm">Bonus Reviewed</div>
                          <div className="text-xs text-muted-foreground">Currently in Draft status</div>
                       </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setChecks(s => ({...s, bonus: !s.bonus}))}>
                       {checks.bonus ? 'Unverify' : 'Verify'}
                    </Button>
                 </div>
              </div>

              <div className="mt-6 pt-6 border-t flex justify-end">
                 <Button disabled={!allChecked} className="gap-2">
                    <Lock className="w-4 h-4" /> Close & Lock March 2026
                 </Button>
              </div>
           </Card>

           <div className="space-y-6">
              <Card className="rounded-2xl border bg-card/60 shadow-sm p-5">
                 <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Historical Closes</h3>
                 <div className="space-y-3">
                    {MOCK_MONTHS.filter(m => m.status === 'closed').map(m => (
                       <div key={m.month} className="p-3 bg-background/50 rounded-lg border flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                             <div className="font-medium text-sm">{m.month}</div>
                             <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none h-5 text-[10px]">
                                <Lock className="w-3 h-3 mr-1" /> Closed
                             </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground flex justify-between">
                             <span>By {m.completedBy}</span>
                             <span>{m.date}</span>
                          </div>
                          {isHeadOffice && (
                             <Button variant="outline" size="sm" className="w-full mt-2 text-xs h-7">
                                <Unlock className="w-3 h-3 mr-1" /> Reopen Month
                             </Button>
                          )}
                       </div>
                    ))}
                 </div>
              </Card>
           </div>
        </div>
      </div>
    </AppShell>
  );
}