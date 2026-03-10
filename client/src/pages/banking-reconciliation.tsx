import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/state/auth";
import { FileSearch, CheckCircle2, AlertTriangle, ArrowRight, Wallet, Download } from "lucide-react";

const MOCK_RECONCILIATION = [
  { date: "2026-03-01", expected: 1200.50, actual: 1200.50, diff: 0, status: "matched", notes: "Barclays High St" },
  { date: "2026-03-02", expected: 850.00, actual: 850.00, diff: 0, status: "matched", notes: "Barclays High St" },
  { date: "2026-03-03", expected: 1420.25, actual: 1400.00, diff: -20.25, status: "unreconciled", notes: "Pending resolution" },
  { date: "2026-03-04", expected: 910.00, actual: 910.00, diff: 0, status: "matched", notes: "Natwest" },
  { date: "2026-03-05", expected: 1100.00, actual: 0, diff: -1100.00, status: "missing", notes: "Not banked yet" },
];

export default function BankingReconciliation() {
  const { session } = useAuth();
  const isHeadOffice = session.scope.type === "headoffice";
  const [pharmacy, setPharmacy] = useState<string>(isHeadOffice ? "bowland" : session.scope.type === "pharmacy" ? session.scope.pharmacyId : "bowland");
  const [month, setMonth] = useState("2026-03");

  const totalExpected = MOCK_RECONCILIATION.reduce((acc, row) => acc + row.expected, 0);
  const totalActual = MOCK_RECONCILIATION.reduce((acc, row) => acc + row.actual, 0);
  const totalDiff = totalActual - totalExpected;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div>
            <div className="font-serif text-2xl tracking-tight flex items-center gap-2">
               <Wallet className="h-6 w-6 text-primary" />
               Banking Reconciliation
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Match Cashing Up entries against actual bank deposits.
            </div>
          </div>
          <div className="flex items-center gap-3">
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
             <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[160px]">
                   <SelectValue />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="2026-03">March 2026</SelectItem>
                   <SelectItem value="2026-02">February 2026</SelectItem>
                </SelectContent>
             </Select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
           <Card className="p-5 border bg-card/60 shadow-sm">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Expected Cash (System)</div>
              <div className="text-3xl font-mono font-bold">£{totalExpected.toFixed(2)}</div>
           </Card>
           <Card className="p-5 border bg-card/60 shadow-sm">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Banked Cash (Actual)</div>
              <div className="text-3xl font-mono font-bold text-emerald-600">£{totalActual.toFixed(2)}</div>
           </Card>
           <Card className="p-5 border bg-card/60 shadow-sm">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Unreconciled Difference</div>
              <div className={`text-3xl font-mono font-bold ${totalDiff < 0 ? 'text-red-500' : totalDiff > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                 {totalDiff < 0 ? '-' : '+'}£{Math.abs(totalDiff).toFixed(2)}
              </div>
           </Card>
           <Card className="p-5 border bg-card/60 shadow-sm">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Month Status</div>
              <div className="text-lg font-bold flex items-center gap-2 mt-2">
                 <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 text-sm py-1">In Progress</Badge>
              </div>
           </Card>
        </div>

        <Card className="border bg-card/60 shadow-sm overflow-hidden">
           <div className="p-4 border-b bg-background/50 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2"><FileSearch className="h-4 w-4" /> Reconciliation Ledger</h3>
              <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
           </div>
           <Table>
              <TableHeader>
                 <TableRow>
                    <TableHead>Date Banked</TableHead>
                    <TableHead>Expected (From Cash Up)</TableHead>
                    <TableHead>Actual Banked</TableHead>
                    <TableHead>Difference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {MOCK_RECONCILIATION.map((row, i) => (
                    <TableRow key={i}>
                       <TableCell className="font-mono text-sm">{row.date}</TableCell>
                       <TableCell className="font-mono">£{row.expected.toFixed(2)}</TableCell>
                       <TableCell className="font-mono font-medium">£{row.actual.toFixed(2)}</TableCell>
                       <TableCell className={`font-mono ${row.diff < 0 ? 'text-red-500 font-bold' : row.diff === 0 ? 'text-muted-foreground' : 'text-amber-500'}`}>
                          {row.diff !== 0 ? `£${row.diff.toFixed(2)}` : '-'}
                       </TableCell>
                       <TableCell>
                          {row.status === 'matched' ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Matched</Badge> :
                           row.status === 'unreconciled' ? <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none"><AlertTriangle className="w-3 h-3 mr-1" /> Unreconciled</Badge> :
                           <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">Missing</Badge>}
                       </TableCell>
                       <TableCell className="text-sm text-muted-foreground">{row.notes}</TableCell>
                       <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Edit <ArrowRight className="h-3.5 w-3.5 ml-1" /></Button>
                       </TableCell>
                    </TableRow>
                 ))}
              </TableBody>
           </Table>
        </Card>
      </div>
    </AppShell>
  );
}