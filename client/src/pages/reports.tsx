import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/state/auth";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, Clock, Database } from "lucide-react";

export default function Reports() {
  const { toast } = useToast();
  const { session } = useAuth();

  const [dateRange, setDateRange] = useState({ from: "2026-02-01", to: "2026-02-28" });
  const [selectedPharmacies, setSelectedPharmacies] = useState<string[]>(["all"]);
  
  const isHeadOffice = session.scope.type === "headoffice";
  const canExport = session.role === "Finance" || session.role === "Head Office Admin" || session.role === "Super Admin";

  const pharmacies = [
     { id: "bowland", name: "Bowland Pharmacy" },
     { id: "denton", name: "Denton Pharmacy" },
     { id: "wilmslow", name: "Wilmslow Pharmacy" },
  ];

  const handleDownload = (reportName: string) => {
     if (!canExport) return;
     toast({ title: "Export Started", description: `${reportName} is being generated and will download shortly.` });
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
          <div className="font-serif text-2xl tracking-tight">Reports & Exports</div>
          <div className="text-sm text-muted-foreground">
            Generate and download system data extracts and summary packs.
          </div>
        </div>

        <Card className="p-5 rounded-2xl border bg-card/60 shadow-sm">
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                 <Label>Date Range</Label>
                 <div className="flex gap-2">
                    <Input type="date" value={dateRange.from} onChange={e => setDateRange(s => ({...s, from: e.target.value}))} />
                    <Input type="date" value={dateRange.to} onChange={e => setDateRange(s => ({...s, to: e.target.value}))} />
                 </div>
              </div>
              <PharmacySelector />
              <div className="flex flex-col justify-end space-y-2">
                 <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg border">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Last Export: Today at 09:15 AM</span>
                 </div>
                 <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg border">
                    <Database className="h-3.5 w-3.5" />
                    <span>Last System Backup: Today at 03:00 AM</span>
                 </div>
              </div>
           </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           <Card className="p-5 rounded-xl border hover:border-primary/20 transition-colors flex flex-col">
              <div className="font-semibold mb-1">Module CSV Exports</div>
              <div className="text-xs text-muted-foreground mb-4 flex-1">Raw tabular data extracts per module.</div>
              <div className="grid grid-cols-2 gap-2">
                 <Button variant="outline" size="sm" onClick={() => handleDownload("Daily Figures CSV")}>Figures</Button>
                 <Button variant="outline" size="sm" onClick={() => handleDownload("Cashing Up CSV")}>Cash Up</Button>
                 <Button variant="outline" size="sm" onClick={() => handleDownload("Bookkeeping CSV")}>Bookkeeping</Button>
              </div>
           </Card>

           <Card className="p-5 rounded-xl border hover:border-primary/20 transition-colors flex flex-col">
              <div className="font-semibold mb-1">Financial Exports</div>
              <div className="text-xs text-muted-foreground mb-4 flex-1">Bonus tracking and historical service costs.</div>
              <div className="grid grid-cols-2 gap-2">
                 <Button variant="outline" size="sm" onClick={() => handleDownload("Bonus Export")}>Bonus CSV</Button>
                 <Button variant="outline" size="sm" onClick={() => handleDownload("Cost History Export")}>Cost History</Button>
              </div>
           </Card>

           <Card className="p-5 rounded-xl border hover:border-primary/20 transition-colors flex flex-col">
              <div className="font-semibold mb-1">Compliance & Audit</div>
              <div className="text-xs text-muted-foreground mb-4 flex-1">System activity and security logs.</div>
              <div className="grid grid-cols-1 gap-2">
                 <Button variant="outline" size="sm" onClick={() => handleDownload("Audit Log Export")}>
                    <Download className="h-4 w-4 mr-2" /> Audit Log CSV
                 </Button>
              </div>
           </Card>

           <Card className="p-5 rounded-xl border hover:border-primary/20 transition-colors lg:col-span-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary/5">
              <div>
                 <div className="font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Monthly Pharmacy Pack
                 </div>
                 <div className="text-xs text-muted-foreground mt-1">
                    A comprehensive PDF summary containing figures, financials, and completion statuses per pharmacy.
                 </div>
              </div>
              <Button onClick={() => handleDownload("Monthly Pack PDF")} className="shrink-0">
                 <Download className="h-4 w-4 mr-2" /> Download Monthly Pack
              </Button>
           </Card>

           <Card className="p-5 rounded-xl border hover:border-primary/20 transition-colors lg:col-span-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                 <div className="font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    PDF Summary Exports
                 </div>
                 <div className="text-xs text-muted-foreground mt-1">
                    Printable PDF summary of the selected date range.
                 </div>
              </div>
              <Button variant="secondary" onClick={() => handleDownload("PDF Summary")} className="shrink-0">
                 <Download className="h-4 w-4 mr-2" /> Download PDF Summary
              </Button>
           </Card>
        </div>
      </div>
    </AppShell>
  );
}