import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/state/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3, Coins, ShieldCheck, Download, FileText, Calendar } from "lucide-react";

type ReportType = "figures" | "cashing-up" | "audit";

export default function Reports() {
  const { toast } = useToast();
  const { session } = useAuth();

  const [dateRange, setDateRange] = useState({ from: "2026-02-01", to: "2026-02-09" });
  const [selectedPharmacies, setSelectedPharmacies] = useState<string[]>(["all"]);
  
  // Report Configuration State
  const [figuresType, setFiguresType] = useState("mtd_summary");
  const [cashingUpType, setCashingUpType] = useState("mtd_summary");
  const [auditType, setAuditType] = useState("logins");

  const isHeadOffice = session.scope.type === "headoffice";
  const canExport = session.role === "Finance" || session.role === "Head Office Admin" || session.role === "Super Admin";

  const pharmacies = [
     { id: "bowland", name: "Bowland Pharmacy" },
     { id: "denton", name: "Denton Pharmacy" },
     { id: "wilmslow", name: "Wilmslow Pharmacy" },
  ];

  const handleDownload = (reportName: string) => {
     if (!canExport) return;
     toast({ title: "Report Generated", description: `${reportName} has been downloaded.` });
     // Mock download
  };

  const PharmacySelector = () => (
     <div className="flex flex-col gap-2">
        <Label>Pharmacy Scope</Label>
        {isHeadOffice ? (
           <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                 <Checkbox 
                    id="all" 
                    checked={selectedPharmacies.includes("all")}
                    onCheckedChange={(c) => setSelectedPharmacies(c ? ["all"] : [])}
                 />
                 <label htmlFor="all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    All Pharmacies
                 </label>
              </div>
              {pharmacies.map(p => (
                 <div key={p.id} className="flex items-center space-x-2">
                    <Checkbox 
                       id={p.id} 
                       checked={selectedPharmacies.includes("all") || selectedPharmacies.includes(p.id)}
                       disabled={selectedPharmacies.includes("all")}
                       onCheckedChange={(c) => {
                          if (c) setSelectedPharmacies(prev => [...prev, p.id]);
                          else setSelectedPharmacies(prev => prev.filter(id => id !== p.id));
                       }}
                    />
                    <label htmlFor={p.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                       {p.name}
                    </label>
                 </div>
              ))}
           </div>
        ) : (
           <Input value={session.scope.type === "pharmacy" ? session.scope.pharmacyName : "Head Office"} disabled />
        )}
     </div>
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <div className="font-serif text-2xl tracking-tight" data-testid="text-reports-title">Reports & Analytics</div>
          <div className="text-sm text-muted-foreground" data-testid="text-reports-subtitle">
            Generate detailed exports for Figures, Cashing Up, and Audit logs.
          </div>
        </div>

        {/* SHARED CONTROLS */}
        <Card className="p-5 rounded-2xl border bg-card/60">
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                 <Label>Date Range</Label>
                 <div className="flex gap-2">
                    <Input type="date" value={dateRange.from} onChange={e => setDateRange(s => ({...s, from: e.target.value}))} />
                    <Input type="date" value={dateRange.to} onChange={e => setDateRange(s => ({...s, to: e.target.value}))} />
                 </div>
              </div>
              <PharmacySelector />
              <div className="flex items-end">
                 {!canExport && (
                    <div className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded w-full">
                       Note: Your role has view-only access. Exports are disabled.
                    </div>
                 )}
              </div>
           </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
           
           {/* FIGURES REPORTS */}
           <Card className="p-5 rounded-2xl border bg-card/60 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                 <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                 </div>
                 <div>
                    <div className="font-semibold">Figures Report</div>
                    <div className="text-xs text-muted-foreground">Services & Item Volume</div>
                 </div>
              </div>
              <div className="space-y-4 flex-1">
                 <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select value={figuresType} onValueChange={setFiguresType}>
                       <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="mtd_summary">Month-to-Date Summary</SelectItem>
                          <SelectItem value="daily_breakdown">Daily Breakdown</SelectItem>
                          <SelectItem value="eps_paper">EPS vs Paper Split</SelectItem>
                          <SelectItem value="paid_exempt">Paid vs Exempt Split</SelectItem>
                          <SelectItem value="services">Services (NMS, PF, etc.)</SelectItem>
                          <SelectItem value="comparison">Month vs Previous Month</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="text-xs text-muted-foreground min-h-[40px]">
                    {figuresType === "mtd_summary" && "Summary of totals for the selected period."}
                    {figuresType === "daily_breakdown" && "Row-by-row daily entries."}
                    {figuresType === "services" && "Focus on clinical service performance."}
                 </div>
              </div>
              <Button className="w-full mt-4" disabled={!canExport} onClick={() => handleDownload("Figures Report")}>
                 <Download className="h-4 w-4 mr-2" /> Download CSV
              </Button>
           </Card>

           {/* CASHING UP REPORTS */}
           <Card className="p-5 rounded-2xl border bg-card/60 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                 <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Coins className="h-5 w-5" />
                 </div>
                 <div>
                    <div className="font-semibold">Cashing Up Report</div>
                    <div className="text-xs text-muted-foreground">Financial Reconciliation</div>
                 </div>
              </div>
              <div className="space-y-4 flex-1">
                 <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select value={cashingUpType} onValueChange={setCashingUpType}>
                       <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="mtd_summary">Month-to-Date Summary</SelectItem>
                          <SelectItem value="daily_breakdown">Daily Breakdown</SelectItem>
                          <SelectItem value="vat_summary">VAT Category Summary</SelectItem>
                          <SelectItem value="payouts">Payouts Analysis</SelectItem>
                          <SelectItem value="variance">Variance Exceptions</SelectItem>
                          <SelectItem value="comparison">Month vs Previous Month</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="text-xs text-muted-foreground min-h-[40px]">
                    {cashingUpType === "mtd_summary" && "Total takings and banking summary."}
                    {cashingUpType === "payouts" && "Detailed list of all petty cash payouts."}
                    {cashingUpType === "variance" && "Days with non-zero variance."}
                 </div>
              </div>
              <Button className="w-full mt-4" disabled={!canExport} onClick={() => handleDownload("Cashing Up Report")}>
                 <Download className="h-4 w-4 mr-2" /> Download CSV
              </Button>
           </Card>

           {/* AUDIT REPORTS */}
           <Card className="p-5 rounded-2xl border bg-card/60 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                 <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                 </div>
                 <div>
                    <div className="font-semibold">Audit Report</div>
                    <div className="text-xs text-muted-foreground">Security & Compliance</div>
                 </div>
              </div>
              <div className="space-y-4 flex-1">
                 <div className="space-y-2">
                    <Label>Report Type</Label>
                    <Select value={auditType} onValueChange={setAuditType}>
                       <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="logins">Logins & Access</SelectItem>
                          <SelectItem value="edits">Edits Only</SelectItem>
                          <SelectItem value="deletions">Deletions Only</SelectItem>
                          <SelectItem value="problems">Problem Tickets</SelectItem>
                          <SelectItem value="full_dump">Full System Dump</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="text-xs text-muted-foreground min-h-[40px]">
                    {auditType === "logins" && "User sessions and failed attempts."}
                    {auditType === "edits" && "Changes to historical records."}
                    {auditType === "deletions" && "User or branch deletion events."}
                 </div>
              </div>
              <Button className="w-full mt-4" disabled={!canExport} onClick={() => handleDownload("Audit Report")}>
                 <Download className="h-4 w-4 mr-2" /> Download CSV
              </Button>
           </Card>

        </div>

        {/* PREVIEW TABLE */}
        <Card className="p-5 rounded-2xl border bg-card/60">
           <div className="text-sm font-semibold mb-4">Recent Generated Reports</div>
           <div className="overflow-hidden rounded-xl border bg-background/40">
              <Table>
                 <TableHeader>
                    <TableRow>
                       <TableHead>Report Name</TableHead>
                       <TableHead>Generated By</TableHead>
                       <TableHead>Date</TableHead>
                       <TableHead>Scope</TableHead>
                       <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    <TableRow>
                       <TableCell>Figures Report (Jan 2026)</TableCell>
                       <TableCell>Finance Team</TableCell>
                       <TableCell>2026-02-01 09:00</TableCell>
                       <TableCell>All Pharmacies</TableCell>
                       <TableCell className="text-right"><Button size="sm" variant="ghost">Re-download</Button></TableCell>
                    </TableRow>
                    <TableRow>
                       <TableCell>Cashing Up Variance</TableCell>
                       <TableCell>Ahmed</TableCell>
                       <TableCell>2026-02-05 14:20</TableCell>
                       <TableCell>Bowland Pharmacy</TableCell>
                       <TableCell className="text-right"><Button size="sm" variant="ghost">Re-download</Button></TableCell>
                    </TableRow>
                 </TableBody>
              </Table>
           </div>
        </Card>
      </div>
    </AppShell>
  );
}
