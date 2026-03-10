import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/state/auth";
import { ClipboardList, CheckCircle2, Circle, Clock, Upload, AlertCircle, FileText, Building2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const PQS_DOMAINS = [
  {
    id: "d1",
    name: "Risk Management and Safety",
    weight: 20,
    criteria: [
      { id: "c1", title: "Update CPPE Risk Management training", status: "completed", owner: "Pharmacist", due: "15 Oct 2026" },
      { id: "c2", title: "Complete safety report and share with team", status: "in_progress", owner: "Manager", due: "30 Oct 2026" },
      { id: "c3", title: "Review NPSA alerts", status: "completed", owner: "Pharmacist", due: "15 Oct 2026" }
    ]
  },
  {
    id: "d2",
    name: "Respiratory Domain",
    weight: 25,
    criteria: [
      { id: "c4", title: "Inhaler technique checks (min 20 patients)", status: "in_progress", owner: "Pharmacist", due: "30 Nov 2026", progress: 60 },
      { id: "c5", title: "Return of unwanted inhalers audit", status: "not_started", owner: "Dispenser", due: "30 Nov 2026" },
      { id: "c6", title: "Asthma action plan referrals", status: "not_started", owner: "Pharmacist", due: "30 Nov 2026" }
    ]
  },
  {
    id: "d3",
    name: "Healthy Living Pharmacy",
    weight: 15,
    criteria: [
      { id: "c7", title: "Maintain HLP Level 1 status", status: "completed", owner: "Manager", due: "31 Dec 2026" },
      { id: "c8", title: "Health promotion zone updated", status: "completed", owner: "Dispenser", due: "31 Dec 2026" }
    ]
  }
];

export default function PQS() {
  const { session } = useAuth();
  const isHeadOffice = session.scope.type === "headoffice";
  const [year, setYear] = useState("2026/27");
  const [pharmacy, setPharmacy] = useState(isHeadOffice ? "bowland" : session.scope.pharmacyId);

  const calculateOverallProgress = () => {
    let total = 0;
    let completed = 0;
    PQS_DOMAINS.forEach(d => {
      d.criteria.forEach(c => {
        total++;
        if (c.status === "completed") completed++;
      });
    });
    return Math.round((completed / total) * 100);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "completed": return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "in_progress": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none"><Clock className="w-3 h-3 mr-1" /> In Progress</Badge>;
      case "not_started": return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none"><Circle className="w-3 h-3 mr-1" /> Not Started</Badge>;
      default: return null;
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="font-serif text-2xl tracking-tight flex items-center gap-2">
               <ClipboardList className="h-6 w-6 text-primary" />
               PQS Tracker
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Pharmacy Quality Scheme requirements and evidence tracking.
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {isHeadOffice && (
                <Select value={pharmacy} onValueChange={setPharmacy}>
                   <SelectTrigger className="w-[180px]">
                      <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="bowland">Bowland Pharmacy</SelectItem>
                      <SelectItem value="denton">Denton Pharmacy</SelectItem>
                      <SelectItem value="wilmslow">Wilmslow Pharmacy</SelectItem>
                   </SelectContent>
                </Select>
             )}
             <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[140px]">
                   <SelectValue />
                </SelectTrigger>
                <SelectContent>
                   <SelectItem value="2026/27">2026/27 Scheme</SelectItem>
                   <SelectItem value="2025/26">2025/26 Scheme</SelectItem>
                </SelectContent>
             </Select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
           <Card className="p-6 border bg-card/60 shadow-sm md:col-span-1 flex flex-col justify-center items-center text-center rounded-2xl">
              <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Overall Completion</div>
              <div className="relative w-32 h-32 flex items-center justify-center">
                 <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                       className="text-muted/30"
                       d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                       fill="none"
                       stroke="currentColor"
                       strokeWidth="3"
                    />
                    <path
                       className="text-primary transition-all duration-1000 ease-out"
                       strokeDasharray={`${calculateOverallProgress()}, 100`}
                       d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                       fill="none"
                       stroke="currentColor"
                       strokeWidth="3"
                    />
                 </svg>
                 <div className="absolute flex flex-col items-center justify-center text-2xl font-bold font-mono text-primary">
                    {calculateOverallProgress()}%
                 </div>
              </div>
           </Card>

           <Card className="p-6 border bg-card/60 shadow-sm md:col-span-3 rounded-2xl">
              <h3 className="font-semibold mb-4">Domain Progress</h3>
              <div className="grid sm:grid-cols-3 gap-6">
                 {PQS_DOMAINS.map(domain => {
                    const total = domain.criteria.length;
                    const done = domain.criteria.filter(c => c.status === "completed").length;
                    const pct = Math.round((done/total) * 100);
                    return (
                       <div key={domain.id} className="space-y-2">
                          <div className="flex justify-between text-sm font-medium">
                             <span className="line-clamp-1" title={domain.name}>{domain.name}</span>
                             <span className="text-muted-foreground">{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-2" indicatorClassName={pct === 100 ? "bg-emerald-500" : "bg-primary"} />
                          <div className="text-xs text-muted-foreground">{done} of {total} criteria met</div>
                       </div>
                    );
                 })}
              </div>
           </Card>
        </div>

        <div className="space-y-4">
           <h3 className="font-serif text-xl mt-2">Scheme Criteria</h3>
           {PQS_DOMAINS.map((domain) => (
              <Card key={domain.id} className="border bg-card/60 shadow-sm overflow-hidden">
                 <div className="p-4 border-b bg-background/50 flex items-center justify-between">
                    <div>
                       <h4 className="font-semibold text-lg">{domain.name}</h4>
                       <p className="text-xs text-muted-foreground">Weighting: {domain.weight} points</p>
                    </div>
                 </div>
                 <div className="divide-y">
                    {domain.criteria.map((criterion) => (
                       <div key={criterion.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                          <div className="flex-1">
                             <div className="font-medium text-sm mb-1">{criterion.title}</div>
                             <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> Due: {criterion.due}</span>
                                <span>Owner: {criterion.owner}</span>
                             </div>
                             {criterion.progress !== undefined && (
                                <div className="mt-2 flex items-center gap-2 max-w-xs">
                                   <Progress value={criterion.progress} className="h-1.5 flex-1" />
                                   <span className="text-[10px] font-medium">{criterion.progress}%</span>
                                </div>
                             )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                             {getStatusBadge(criterion.status)}
                             <Button variant="outline" size="sm" className="h-8">
                                <Upload className="w-3.5 h-3.5 mr-1.5" /> Evidence
                             </Button>
                             {isHeadOffice && criterion.status === "completed" && (
                                <Button variant="secondary" size="sm" className="h-8 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                                   Review
                                </Button>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
              </Card>
           ))}
        </div>
      </div>
    </AppShell>
  );
}