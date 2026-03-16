import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/state/auth";
import { 
   AlertTriangle, ShieldAlert, HeartPulse, Activity, CheckCircle2,
   TrendingUp, DollarSign, Users, AlertCircle, Clock, FileWarning, ClipboardX, Filter, Target, Award, Shield, FileText, CheckSquare
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { useLocation } from "wouter";

export default function ControlCentre() {
   const { session } = useAuth();
   const [filterBranch, setFilterBranch] = useState("all");
   const [, navigate] = useLocation();
   
   // Mock Data - In a real app this would come from a unified dashboard API endpoint
   const branchStats = {
      bowland: { name: "Bowland Pharmacy", compliance: 92, targetVsActual: 85, missingDaily: 0, missingCash: 1, reconDiscrepancies: 2, unresolvedIncidents: 1, bonusPending: false },
      denton: { name: "Denton Pharmacy", compliance: 85, targetVsActual: 95, missingDaily: 2, missingCash: 2, reconDiscrepancies: 0, unresolvedIncidents: 3, bonusPending: true },
      wilmslow: { name: "Wilmslow Pharmacy", compliance: 98, targetVsActual: 110, missingDaily: 0, missingCash: 0, reconDiscrepancies: 0, unresolvedIncidents: 0, bonusPending: false }
   };

   return (
      <AppShell>
         <div className="flex flex-col gap-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div>
                  <div className="flex items-center gap-3">
                     <h1 className="font-serif text-3xl tracking-tight text-foreground">Control Centre</h1>
                     <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">Head Office</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                     Network-wide operational overview and action centre.
                  </p>
               </div>
               
               <div className="flex items-center gap-3">
                  <div className="text-right hidden md:block mr-4">
                     <div className="text-sm font-medium">Month End Readiness</div>
                     <div className="flex items-center gap-2 mt-1">
                        <Progress value={65} className="w-32 h-2" />
                        <span className="text-xs text-muted-foreground font-mono">65%</span>
                     </div>
                  </div>
                  <Select value={filterBranch} onValueChange={setFilterBranch}>
                     <SelectTrigger className="w-[200px]">
                        <div className="flex items-center gap-2">
                           <Filter className="h-4 w-4 text-muted-foreground" />
                           <SelectValue placeholder="All Branches" />
                        </div>
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        <SelectItem value="bowland">Bowland Pharmacy</SelectItem>
                        <SelectItem value="denton">Denton Pharmacy</SelectItem>
                        <SelectItem value="wilmslow">Wilmslow Pharmacy</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <Card className="p-5 border-l-4 border-l-amber-500 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/daily-figures")}>
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Missing Figures</p>
                        <h2 className="text-3xl font-bold mt-1">2</h2>
                     </div>
                     <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                        <FileWarning className="w-5 h-5" />
                     </div>
                  </div>
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1 font-medium">
                     <AlertCircle className="w-3 h-3" /> Denton 2 days behind
                  </p>
               </Card>
               
               <Card className="p-5 border-l-4 border-l-rose-500 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/incidents")}>
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
                     <AlertTriangle className="w-3 h-3" /> 1 high severity (Bowland)
                  </p>
               </Card>

               <Card className="p-5 border-l-4 border-l-blue-500 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/banking-reconciliation")}>
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recon Issues</p>
                        <h2 className="text-3xl font-bold mt-1">2</h2>
                     </div>
                     <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <DollarSign className="w-5 h-5" />
                     </div>
                  </div>
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1 font-medium">
                     <AlertCircle className="w-3 h-3" /> Unreconciled cash (Bowland)
                  </p>
               </Card>

               <Card className="p-5 border-l-4 border-l-emerald-500 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/compliance")}>
                  <div className="flex justify-between items-start">
                     <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Compliance</p>
                        <h2 className="text-3xl font-bold mt-1">91%</h2>
                     </div>
                     <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <Activity className="w-5 h-5" />
                     </div>
                  </div>
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
                     <TrendingUp className="w-3 h-3" /> Wilmslow leading (98%)
                  </p>
               </Card>
            </div>

            <Tabs defaultValue="operations" className="w-full">
               <TabsList className="mb-4">
                  <TabsTrigger value="operations">Daily Operations</TabsTrigger>
                  <TabsTrigger value="performance">Performance & Targets</TabsTrigger>
                  <TabsTrigger value="compliance">Compliance & Governance</TabsTrigger>
               </TabsList>

               <TabsContent value="operations" className="space-y-6 m-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <div className="lg:col-span-2 space-y-6">
                        <Card className="p-0 overflow-hidden border shadow-sm">
                           <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                 <AlertCircle className="w-4 h-4 text-amber-500" />
                                 Action Required (Next 48h)
                              </h3>
                              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => navigate("/exceptions")}>View All</Button>
                           </div>
                           <div className="divide-y">
                              {[
                                 { branch: "Denton Pharmacy", issue: "Daily Figures not submitted (12th & 13th)", type: "Missing", time: "2h ago", urgent: true, link: "/daily-figures" },
                                 { branch: "Denton Pharmacy", issue: "Cashing Up not submitted (13th)", type: "Missing", time: "2h ago", urgent: true, link: "/cashing-up" },
                                 { branch: "Bowland Pharmacy", issue: "£150 unbanked discrepancy in safe", type: "Banking", time: "1d ago", urgent: false, link: "/banking-reconciliation" },
                                 { branch: "Denton Pharmacy", issue: "March Bonus pending approval", type: "Approval", time: "2d ago", urgent: false, link: "/bonus-performance" },
                              ].filter(a => filterBranch === 'all' || a.branch.toLowerCase().includes(filterBranch)).map((alert, i) => (
                                 <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors cursor-pointer group" onClick={() => navigate(alert.link)}>
                                    <div className="flex items-start gap-3">
                                       <div className={`mt-0.5 p-1.5 rounded-full ${alert.urgent ? 'bg-rose-100 text-rose-600 group-hover:bg-rose-200' : 'bg-amber-100 text-amber-600 group-hover:bg-amber-200'} transition-colors`}>
                                          {alert.urgent ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                       </div>
                                       <div>
                                          <div className="text-sm font-medium group-hover:text-primary transition-colors">{alert.branch}</div>
                                          <div className="text-xs text-muted-foreground">{alert.issue}</div>
                                       </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                       <Badge variant="outline" className="text-[10px] uppercase bg-background">{alert.type}</Badge>
                                       <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </Card>

                        <div className="grid sm:grid-cols-2 gap-4">
                           <Card className="p-4 border shadow-sm">
                              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                 <CheckSquare className="w-4 h-4 text-primary" />
                                 Bookkeeping Status (Mar)
                              </h3>
                              <div className="space-y-3">
                                 <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Wilmslow</span>
                                    <span className="font-medium text-emerald-600">100%</span>
                                 </div>
                                 <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Bowland</span>
                                    <span className="font-medium text-amber-600">65%</span>
                                 </div>
                                 <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Denton</span>
                                    <span className="font-medium text-rose-600">20%</span>
                                 </div>
                                 <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => navigate("/bookkeeping")}>Review Bookkeeping</Button>
                              </div>
                           </Card>
                           
                           <Card className="p-4 border shadow-sm">
                              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                                 <Award className="w-4 h-4 text-primary" />
                                 Bonus Approvals
                              </h3>
                              <div className="flex flex-col items-center justify-center py-2 text-center h-[100px]">
                                 <div className="text-2xl font-bold text-amber-500">1</div>
                                 <div className="text-sm text-muted-foreground">Branch awaiting HO sign-off</div>
                              </div>
                              <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/bonus-performance")}>Review Bonuses</Button>
                           </Card>
                        </div>
                     </div>
                     
                     <div className="space-y-6">
                        <Card className="p-5 border shadow-sm">
                           <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4 text-rose-500" />
                              Unresolved Problems
                           </h3>
                           <div className="space-y-4">
                              <div className="p-3 bg-rose-50 rounded-lg border border-rose-100 cursor-pointer hover:border-rose-300 transition-colors" onClick={() => navigate("/incidents")}>
                                 <div className="flex justify-between items-start mb-1">
                                    <Badge variant="outline" className="bg-white text-rose-600 border-rose-200 text-[10px]">INCIDENT</Badge>
                                    <span className="text-[10px] text-muted-foreground">Bowland</span>
                                 </div>
                                 <p className="text-sm font-medium mt-1">Fridge Excursion (2-8°C broken)</p>
                                 <p className="text-xs text-muted-foreground mt-1">Reported 4h ago • Needs HO advice</p>
                              </div>
                              
                              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 cursor-pointer hover:border-amber-300 transition-colors" onClick={() => navigate("/exceptions")}>
                                 <div className="flex justify-between items-start mb-1">
                                    <Badge variant="outline" className="bg-white text-amber-600 border-amber-200 text-[10px]">EXCEPTION</Badge>
                                    <span className="text-[10px] text-muted-foreground">Denton</span>
                                 </div>
                                 <p className="text-sm font-medium mt-1">Late Cashing Up x3</p>
                                 <p className="text-xs text-muted-foreground mt-1">Triggered system alert</p>
                              </div>
                           </div>
                        </Card>

                        <Card className="p-4 border shadow-sm bg-primary/5">
                           <h3 className="font-semibold text-sm mb-2 text-primary">System Audit Log</h3>
                           <div className="space-y-3 mt-4">
                              <div className="flex gap-2 items-start">
                                 <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                                 <div>
                                    <div className="text-xs font-medium">Master PIN Used</div>
                                    <div className="text-[10px] text-muted-foreground">Ahmed • Delete Branch attempt • 1h ago</div>
                                 </div>
                              </div>
                              <div className="flex gap-2 items-start">
                                 <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5"></div>
                                 <div>
                                    <div className="text-xs font-medium">New User Invited</div>
                                    <div className="text-[10px] text-muted-foreground">HO Admin • Locum Pharmacist • 3h ago</div>
                                 </div>
                              </div>
                           </div>
                        </Card>
                     </div>
                  </div>
               </TabsContent>

               <TabsContent value="performance" className="space-y-6 m-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <Card className="p-5 border shadow-sm">
                        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                           <Target className="w-4 h-4 text-primary" />
                           Target vs Actual (MTD)
                        </h3>
                        <div className="space-y-6">
                           {[
                              { name: "Wilmslow", current: 9500, target: 8000, label: "Items", percent: 118 },
                              { name: "Bowland", current: 7200, target: 8500, label: "Items", percent: 85 },
                              { name: "Denton", current: 4100, target: 6000, label: "Items", percent: 68 }
                           ].map(b => (
                              <div key={b.name} className="space-y-2">
                                 <div className="flex justify-between text-sm">
                                    <span className="font-medium">{b.name}</span>
                                    <span className="text-muted-foreground">{b.current} / {b.target} {b.label} ({b.percent}%)</span>
                                 </div>
                                 <Progress value={Math.min(b.percent, 100)} className={`h-2 ${b.percent >= 100 ? '[&>div]:bg-emerald-500' : b.percent > 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-rose-500'}`} />
                              </div>
                           ))}
                        </div>
                     </Card>
                     
                     <Card className="p-5 border shadow-sm">
                        <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                           <HeartPulse className="w-4 h-4 text-primary" />
                           Clinical Services (Private & Pharmacy First)
                        </h3>
                        <div className="space-y-4">
                           <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                              <div>
                                 <div className="text-sm font-medium">Wilmslow Clinic</div>
                                 <div className="text-xs text-muted-foreground">Travel & Ear Wax</div>
                              </div>
                              <div className="text-right">
                                 <div className="font-bold text-emerald-600">£4,250</div>
                                 <div className="text-[10px] text-muted-foreground">MTD Revenue</div>
                              </div>
                           </div>
                           <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
                              <div>
                                 <div className="text-sm font-medium">Bowland Clinic</div>
                                 <div className="text-xs text-muted-foreground">Pharmacy First Consults</div>
                              </div>
                              <div className="text-right">
                                 <div className="font-bold text-emerald-600">85</div>
                                 <div className="text-[10px] text-muted-foreground">Completed</div>
                              </div>
                           </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => navigate("/private-clinic")}>View Full Report</Button>
                     </Card>
                  </div>
               </TabsContent>

               <TabsContent value="compliance" className="space-y-6 m-0">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <div className="lg:col-span-2">
                        <Card className="p-5 border shadow-sm">
                           <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                              <Shield className="w-4 h-4 text-primary" />
                              Branch League Table (Compliance)
                           </h3>
                           <div className="space-y-4">
                              {[
                                 { name: "Wilmslow Pharmacy", score: 98, trend: "up", missingSops: 0, missingTraining: 0 },
                                 { name: "Bowland Pharmacy", score: 92, trend: "flat", missingSops: 2, missingTraining: 1 },
                                 { name: "Denton Pharmacy", score: 85, trend: "down", missingSops: 5, missingTraining: 3 }
                              ].map((b, i) => (
                                 <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-muted/10 transition-colors cursor-pointer" onClick={() => navigate("/compliance")}>
                                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                       <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                                          {i+1}
                                       </div>
                                       <span className="font-medium">{b.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                       <div className="flex gap-3 text-xs text-muted-foreground">
                                          <span className={b.missingSops > 0 ? "text-amber-600 font-medium" : ""}>{b.missingSops} SOPs missing</span>
                                          <span className={b.missingTraining > 0 ? "text-amber-600 font-medium" : ""}>{b.missingTraining} Training overdue</span>
                                       </div>
                                       <Badge className={b.score < 90 ? 'bg-rose-100 text-rose-700 hover:bg-rose-100' : b.score < 95 ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'}>
                                          {b.score}%
                                       </Badge>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </Card>
                     </div>
                     <div>
                        <Card className="p-5 border shadow-sm">
                           <h3 className="font-semibold text-sm mb-4">PQS Readiness</h3>
                           <div className="space-y-4">
                              <div className="space-y-1">
                                 <div className="flex justify-between text-xs">
                                    <span>Wilmslow</span>
                                    <span className="text-emerald-600">Ready</span>
                                 </div>
                                 <Progress value={100} className="h-1.5 [&>div]:bg-emerald-500" />
                              </div>
                              <div className="space-y-1">
                                 <div className="flex justify-between text-xs">
                                    <span>Bowland</span>
                                    <span className="text-amber-600">In Progress</span>
                                 </div>
                                 <Progress value={70} className="h-1.5 [&>div]:bg-amber-500" />
                              </div>
                              <div className="space-y-1">
                                 <div className="flex justify-between text-xs">
                                    <span>Denton</span>
                                    <span className="text-rose-600">Action Needed</span>
                                 </div>
                                 <Progress value={30} className="h-1.5 [&>div]:bg-rose-500" />
                              </div>
                           </div>
                           <Button variant="outline" size="sm" className="w-full mt-6" onClick={() => navigate("/pqs")}>Open PQS Tracker</Button>
                        </Card>
                     </div>
                  </div>
               </TabsContent>
            </Tabs>
         </div>
      </AppShell>
   );
}
