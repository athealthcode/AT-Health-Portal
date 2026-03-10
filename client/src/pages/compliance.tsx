import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/state/auth";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  Filter,
  BarChart3,
  ShieldCheck
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const MOCK_DATA = {
  score: 88,
  previousScore: 82,
  metrics: {
    dailyFigures: 94,
    cashingUp: 89,
    bookkeeping: 100,
    missing: 3,
    late: 5,
    notCompleted: 2,
    exceptions: 1,
  },
  leagueTable: [
    { name: "Bowland Pharmacy", score: 96, trend: "+4" },
    { name: "Denton Pharmacy", score: 88, trend: "+6" },
    { name: "Wilmslow Pharmacy", score: 80, trend: "-2" },
  ],
  missedDates: [
    { date: "10 Mar 2026", pharmacy: "Wilmslow Pharmacy", type: "Daily Figures", reason: "Pending", status: "Missing" },
    { date: "09 Mar 2026", pharmacy: "Denton Pharmacy", type: "Cashing Up", reason: "Till issue", status: "Late" },
    { date: "05 Mar 2026", pharmacy: "Bowland Pharmacy", type: "Daily Figures", reason: "Bank Holiday", status: "Not Completed" },
  ]
};

export default function Compliance() {
  const { session } = useAuth();
  const isHeadOffice = session.scope.type === "headoffice";
  const [month, setMonth] = useState("March 2026");

  const scoreColor = MOCK_DATA.score >= 90 ? "text-emerald-600" : MOCK_DATA.score >= 80 ? "text-amber-500" : "text-red-500";
  const scoreBg = MOCK_DATA.score >= 90 ? "bg-emerald-50 border-emerald-200" : MOCK_DATA.score >= 80 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";
  const trendUp = MOCK_DATA.score >= MOCK_DATA.previousScore;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div>
            <div className="font-serif text-2xl tracking-tight flex items-center gap-2">
               <ShieldCheck className="h-6 w-6 text-primary" />
               Submission Compliance
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Track operational reporting and task completion rates.
            </div>
          </div>
          <Select value={month} onValueChange={setMonth}>
             <SelectTrigger className="w-[180px]">
                <SelectValue />
             </SelectTrigger>
             <SelectContent>
                <SelectItem value="March 2026">March 2026</SelectItem>
                <SelectItem value="February 2026">February 2026</SelectItem>
                <SelectItem value="January 2026">January 2026</SelectItem>
             </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className={`p-6 rounded-2xl border ${scoreBg} shadow-sm md:col-span-1 flex flex-col justify-center items-center text-center`}>
            <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Overall Compliance Score</div>
            <div className={`text-6xl font-bold font-mono ${scoreColor}`}>
               {MOCK_DATA.score}
               <span className="text-2xl text-muted-foreground opacity-50">/100</span>
            </div>
            <div className={`flex items-center gap-1 mt-4 font-medium text-sm ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
               {trendUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
               {Math.abs(MOCK_DATA.score - MOCK_DATA.previousScore)} points vs last month
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border bg-card/60 shadow-sm md:col-span-2">
            <h3 className="font-semibold mb-4">Submission Rates</h3>
            <div className="space-y-5">
               <div>
                  <div className="flex justify-between text-sm mb-1.5">
                     <span className="font-medium text-muted-foreground">Daily Figures On-Time Rate</span>
                     <span className="font-mono font-medium">{MOCK_DATA.metrics.dailyFigures}%</span>
                  </div>
                  <Progress value={MOCK_DATA.metrics.dailyFigures} className="h-2" indicatorClassName={MOCK_DATA.metrics.dailyFigures >= 90 ? "bg-emerald-500" : "bg-amber-500"} />
               </div>
               <div>
                  <div className="flex justify-between text-sm mb-1.5">
                     <span className="font-medium text-muted-foreground">Cashing Up On-Time Rate</span>
                     <span className="font-mono font-medium">{MOCK_DATA.metrics.cashingUp}%</span>
                  </div>
                  <Progress value={MOCK_DATA.metrics.cashingUp} className="h-2" indicatorClassName={MOCK_DATA.metrics.cashingUp >= 90 ? "bg-emerald-500" : "bg-amber-500"} />
               </div>
               <div>
                  <div className="flex justify-between text-sm mb-1.5">
                     <span className="font-medium text-muted-foreground">Bookkeeping Completion</span>
                     <span className="font-mono font-medium">{MOCK_DATA.metrics.bookkeeping}%</span>
                  </div>
                  <Progress value={MOCK_DATA.metrics.bookkeeping} className="h-2" indicatorClassName="bg-emerald-500" />
               </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4 border bg-card/60 shadow-sm text-center">
                   <div className="text-3xl font-mono font-bold text-red-500">{MOCK_DATA.metrics.missing}</div>
                   <div className="text-xs font-medium text-muted-foreground uppercase mt-1">Missing<br/>Submissions</div>
                </Card>
                <Card className="p-4 border bg-card/60 shadow-sm text-center">
                   <div className="text-3xl font-mono font-bold text-amber-500">{MOCK_DATA.metrics.late}</div>
                   <div className="text-xs font-medium text-muted-foreground uppercase mt-1">Late<br/>Submissions</div>
                </Card>
                <Card className="p-4 border bg-card/60 shadow-sm text-center">
                   <div className="text-3xl font-mono font-bold text-blue-500">{MOCK_DATA.metrics.notCompleted}</div>
                   <div className="text-xs font-medium text-muted-foreground uppercase mt-1">Marked Not<br/>Completed</div>
                </Card>
                <Card className="p-4 border bg-card/60 shadow-sm text-center">
                   <div className="text-3xl font-mono font-bold text-purple-500">{MOCK_DATA.metrics.exceptions}</div>
                   <div className="text-xs font-medium text-muted-foreground uppercase mt-1">Authorised<br/>Exceptions</div>
                </Card>
             </div>

             <Card className="border bg-card/60 shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-background/50 flex items-center justify-between">
                   <h3 className="font-semibold">Missed & Exceptional Dates</h3>
                   <div className="flex gap-2">
                      <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
                   </div>
                </div>
                <div className="p-0">
                   <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-muted-foreground">
                         <tr>
                            <th className="text-left font-medium p-3">Date</th>
                            {isHeadOffice && <th className="text-left font-medium p-3">Pharmacy</th>}
                            <th className="text-left font-medium p-3">Type</th>
                            <th className="text-left font-medium p-3">Status</th>
                            <th className="text-left font-medium p-3">Reason</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y">
                         {MOCK_DATA.missedDates.filter(d => isHeadOffice || d.pharmacy === session.scope.pharmacyName).map((row, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                               <td className="p-3 font-medium">{row.date}</td>
                               {isHeadOffice && <td className="p-3">{row.pharmacy}</td>}
                               <td className="p-3">{row.type}</td>
                               <td className="p-3">
                                  <Badge variant="outline" className={
                                     row.status === "Missing" ? "bg-red-50 text-red-600 border-red-200" :
                                     row.status === "Late" ? "bg-amber-50 text-amber-600 border-amber-200" :
                                     "bg-blue-50 text-blue-600 border-blue-200"
                                  }>
                                     {row.status}
                                  </Badge>
                               </td>
                               <td className="p-3 text-muted-foreground">{row.reason}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </Card>
          </div>

          {isHeadOffice && (
             <Card className="p-5 border bg-card/60 shadow-sm h-fit">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> League Table</h3>
                </div>
                <div className="space-y-4">
                   {MOCK_DATA.leagueTable.map((pharma, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="text-xs font-mono font-bold text-muted-foreground w-4">{idx + 1}</div>
                            <div className="text-sm font-medium">{pharma.name}</div>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-emerald-600">{pharma.trend}</span>
                            <Badge className={pharma.score >= 90 ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : pharma.score >= 80 ? "bg-amber-100 text-amber-700 hover:bg-amber-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                               {pharma.score}
                            </Badge>
                         </div>
                      </div>
                   ))}
                </div>
             </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}