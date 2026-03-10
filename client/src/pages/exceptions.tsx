import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, AlertTriangle, Clock, Calendar as CalendarIcon, FileWarning, Search, Filter, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/state/auth";
import { useLocation } from "wouter";

type Exception = {
  id: string;
  date: string;
  pharmacyId: string;
  pharmacyName: string;
  type: string;
  description: string;
  severity: "high" | "medium" | "low";
  link: string;
};

const MOCK_EXCEPTIONS: Exception[] = [
  { id: "e1", date: "2026-03-10", pharmacyId: "bowland", pharmacyName: "Bowland Pharmacy", type: "Daily Figures Missing", description: "Daily Figures not entered for today.", severity: "high", link: "/daily-figures" },
  { id: "e2", date: "2026-03-10", pharmacyId: "denton", pharmacyName: "Denton Pharmacy", type: "Cashing Up Missing", description: "Cashing Up not entered for today.", severity: "high", link: "/cashing-up" },
  { id: "e3", date: "2026-03-09", pharmacyId: "wilmslow", pharmacyName: "Wilmslow Pharmacy", type: "Missing Invoice", description: "Banking entry missing locum invoice confirmation.", severity: "medium", link: "/banking-reconciliation" },
  { id: "e4", date: "2026-03-01", pharmacyId: "bowland", pharmacyName: "Bowland Pharmacy", type: "Not Completed", description: "Manager marked Daily Figures as Not Completed.", severity: "low", link: "/daily-figures" },
  { id: "e5", date: "2026-03-05", pharmacyId: "denton", pharmacyName: "Denton Pharmacy", type: "Bookkeeping Incomplete", description: "Mandatory MYS items missing for current month.", severity: "medium", link: "/bookkeeping" },
  { id: "e6", date: "2026-02-28", pharmacyId: "wilmslow", pharmacyName: "Wilmslow Pharmacy", type: "Bonus Unapproved", description: "Bonus month (Feb) is locked but unapproved.", severity: "medium", link: "/bonus-performance" },
  { id: "e7", date: "2026-03-08", pharmacyId: "bowland", pharmacyName: "Bowland Pharmacy", type: "PQS Overdue", description: "Asthma domain criteria overdue for submission.", severity: "high", link: "/pqs" },
  { id: "e8", date: "2026-03-07", pharmacyId: "denton", pharmacyName: "Denton Pharmacy", type: "Unresolved Incident", description: "Fridge Temp Excursion open for > 48 hours.", severity: "high", link: "/incidents" },
  { id: "e9", date: "2026-03-06", pharmacyId: "wilmslow", pharmacyName: "Wilmslow Pharmacy", type: "SOP Compliance", description: "3 Staff members overdue on Information Governance SOP.", severity: "medium", link: "/documents" },
  { id: "e10", date: "2026-03-09", pharmacyId: "bowland", pharmacyName: "Bowland Pharmacy", type: "Stock Transfer", description: "Excess stock of Apixaban awaiting transfer action.", severity: "low", link: "/stock-transfer" }
];

export default function Exceptions() {
  const { session } = useAuth();
  const [, setLocation] = useLocation();
  const [dateFilter, setDateFilter] = useState("all");
  const [pharmacyFilter, setPharmacyFilter] = useState("all");

  const filteredExceptions = MOCK_EXCEPTIONS.filter((e) => {
     if (pharmacyFilter !== "all" && e.pharmacyId !== pharmacyFilter) return false;
     
     if (dateFilter === "today") {
        return e.date === "2026-03-10";
     } else if (dateFilter === "week") {
        // Mock simple week check
        return e.date >= "2026-03-04" && e.date <= "2026-03-10";
     } else if (dateFilter === "month") {
        return e.date.startsWith("2026-03");
     }
     return true;
  });

  const getSeverityBadge = (severity: string) => {
     switch (severity) {
        case "high": return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">High</Badge>;
        case "medium": return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Medium</Badge>;
        case "low": return <Badge variant="outline" className="text-muted-foreground">Low</Badge>;
        default: return <Badge>Unknown</Badge>;
     }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-5 h-[calc(100vh-140px)]">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-serif text-2xl tracking-tight text-destructive flex items-center gap-2">
               <AlertTriangle className="h-6 w-6" /> Exceptions & Alerts
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Operational tasks that are missing, incomplete, or require Head Office attention.
            </div>
          </div>
        </div>

        <Card className="rounded-2xl border bg-card/60 flex flex-col h-full overflow-hidden shadow-sm">
           <div className="p-4 border-b bg-background/50 flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                 <Filter className="h-4 w-4" /> Filters:
              </div>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                 <SelectTrigger className="w-[160px] h-9">
                    <SelectValue placeholder="Date Range" />
                 </SelectTrigger>
                 <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                 </SelectContent>
              </Select>

              <Select value={pharmacyFilter} onValueChange={setPharmacyFilter}>
                 <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="Pharmacy" />
                 </SelectTrigger>
                 <SelectContent>
                    <SelectItem value="all">All Pharmacies</SelectItem>
                    <SelectItem value="bowland">Bowland Pharmacy</SelectItem>
                    <SelectItem value="denton">Denton Pharmacy</SelectItem>
                    <SelectItem value="wilmslow">Wilmslow Pharmacy</SelectItem>
                 </SelectContent>
              </Select>
           </div>

           <div className="flex-1 overflow-auto">
              <Table>
                 <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                    <TableRow>
                       <TableHead>Date</TableHead>
                       <TableHead>Pharmacy</TableHead>
                       <TableHead>Severity</TableHead>
                       <TableHead>Exception Type</TableHead>
                       <TableHead>Description</TableHead>
                       <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {filteredExceptions.length === 0 ? (
                       <TableRow>
                          <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                             <div className="flex flex-col items-center gap-2">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-50" />
                                <span>No exceptions found for these filters.</span>
                             </div>
                          </TableCell>
                       </TableRow>
                    ) : (
                       filteredExceptions.map((ex) => (
                          <TableRow key={ex.id} className="hover:bg-muted/50 transition-colors">
                             <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">{ex.date}</TableCell>
                             <TableCell className="font-medium text-sm">{ex.pharmacyName}</TableCell>
                             <TableCell>{getSeverityBadge(ex.severity)}</TableCell>
                             <TableCell className="font-semibold text-sm">{ex.type}</TableCell>
                             <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate" title={ex.description}>
                                {ex.description}
                             </TableCell>
                             <TableCell className="text-right">
                                <Button 
                                   variant="ghost" 
                                   size="sm" 
                                   className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                                   onClick={() => setLocation(ex.link)}
                                >
                                   View Record <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                                </Button>
                             </TableCell>
                          </TableRow>
                       ))
                    )}
                 </TableBody>
              </Table>
           </div>
           
           <div className="p-3 border-t bg-muted/30 text-xs text-muted-foreground flex justify-between shrink-0">
              <div>Total Exceptions: {filteredExceptions.length}</div>
              <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Last checked: Just now</div>
           </div>
        </Card>
      </div>
    </AppShell>
  );
}
