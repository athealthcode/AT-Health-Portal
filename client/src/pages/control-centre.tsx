import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/state/auth";
import { 
   AlertTriangle, ShieldAlert, HeartPulse, Activity, CheckCircle2,
   TrendingUp, DollarSign, Users, AlertCircle, Clock, FileWarning, ClipboardX
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ControlCentre() {
   const { session } = useAuth();
   
   return (
      <AppShell>
         <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <div>
                  <div className="flex items-center gap-3">
                     <h1 className="font-serif text-3xl tracking-tight text-foreground">Control Centre</h1>
                     <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">AT Health</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                     Network-wide operational overview and action centre.
                  </p>
               </div>
               <div className="text-right">
                  <div className="text-sm font-medium">Month End Readiness</div>
                  <div className="flex items-center gap-2 mt-1">
                     <Progress value={65} className="w-32 h-2" />
                     <span className="text-xs text-muted-foreground font-mono">65%</span>
                  </div>
               </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <Card className="p-5 border-l-4 border-l-amber-500 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Missing Submissions</p>
                        <h2 className="text-3xl font-bold mt-1">12</h2>
                     </div>
                     <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                        <FileWarning className="w-5 h-5" />
                     </div>
                  </div>
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1 font-medium">
                     <AlertCircle className="w-3 h-3" /> 3 branches require action
                  </p>
               </Card>
               
               <Card className="p-5 border-l-4 border-l-rose-500 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Incidents</p>
                        <h2 className="text-3xl font-bold mt-1">4</h2>
                     </div>
                     <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                        <ShieldAlert className="w-5 h-5" />
                     </div>
                  </div>
                  <p className="text-xs text-rose-600 mt-2 flex items-center gap-1 font-medium">
                     <AlertTriangle className="w-3 h-3" /> 1 high severity
                  </p>
               </Card>

               <Card className="p-5 border-l-4 border-l-blue-500 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Compliance</p>
                        <h2 className="text-3xl font-bold mt-1">94%</h2>
                     </div>
                     <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Activity className="w-5 h-5" />
                     </div>
                  </div>
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
                     <TrendingUp className="w-3 h-3" /> +2% vs last month
                  </p>
               </Card>

               <Card className="p-5 border-l-4 border-l-emerald-500 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unreconciled Cash</p>
                        <h2 className="text-3xl font-bold mt-1">£245</h2>
                     </div>
                     <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <DollarSign className="w-5 h-5" />
                     </div>
                  </div>
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
                     <CheckCircle2 className="w-3 h-3" /> 2 issues resolving
                  </p>
               </Card>
            </div>

            {/* Action Required Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 space-y-6">
                  <Card className="p-0 overflow-hidden border shadow-sm">
                     <div className="p-4 border-b bg-muted/20">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                           <AlertCircle className="w-4 h-4 text-amber-500" />
                           Critical Network Alerts
                        </h3>
                     </div>
                     <div className="divide-y">
                        {[
                           { branch: "Denton Pharmacy", issue: "Daily Figures not submitted for 2 days", type: "Missing", time: "2h ago", urgent: true },
                           { branch: "Bowland Pharmacy", issue: "Fridge Temp Excursion reported", type: "Incident", time: "4h ago", urgent: true },
                           { branch: "Wilmslow Pharmacy", issue: "£150 unbanked discrepancy", type: "Banking", time: "1d ago", urgent: false },
                           { branch: "Denton Pharmacy", issue: "3 Staff members overdue on IG SOP", type: "Compliance", time: "2d ago", urgent: false },
                        ].map((alert, i) => (
                           <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                              <div className="flex items-start gap-3">
                                 <div className={`mt-0.5 p-1.5 rounded-full ${alert.urgent ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {alert.urgent ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                 </div>
                                 <div>
                                    <div className="text-sm font-medium">{alert.branch}</div>
                                    <div className="text-xs text-muted-foreground">{alert.issue}</div>
                                 </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                 <Badge variant="outline" className="text-[10px] uppercase">{alert.type}</Badge>
                                 <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </Card>
               </div>
               
               <div className="space-y-6">
                  <Card className="p-5 border shadow-sm">
                     <h3 className="font-semibold text-sm mb-4">Branch League Table</h3>
                     <div className="space-y-4">
                        {[
                           { name: "Wilmslow Pharmacy", score: 98, trend: "up" },
                           { name: "Bowland Pharmacy", score: 92, trend: "flat" },
                           { name: "Denton Pharmacy", score: 85, trend: "down" }
                        ].map((b, i) => (
                           <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                    {i+1}
                                 </div>
                                 <span className="text-sm font-medium">{b.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <span className={`text-xs font-bold ${b.score < 90 ? 'text-rose-500' : b.score < 95 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {b.score}%
                                 </span>
                              </div>
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
