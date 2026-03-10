import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/state/auth";
import { Link } from "wouter";
import { 
  ArrowRight, 
  FileText, 
  Coins, 
  TrendingUp,
  Files,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
  Users,
  ShieldCheck,
  ClipboardList
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const PHARMACY_COLORS: Record<string, string> = {
  Bowland: "text-blue-700 bg-blue-100 border-blue-200",
  Denton: "text-orange-700 bg-orange-100 border-orange-200",
  Wilmslow: "text-purple-700 bg-purple-100 border-purple-200",
};

export default function Dashboard() {
  const { session } = useAuth();
  
  const isHeadOffice = session.scope.type === "headoffice";
  
  // Pending tasks logic
  const [tasks] = useState([
    { id: 1, title: "Submit Daily Figures", due: "Today, 6:00 PM", urgency: "high", href: "/daily-figures" },
    { id: 2, title: "Complete Cashing Up", due: "Today, 6:30 PM", urgency: "medium", href: "/cashing-up" },
  ]);

  const globalMetrics = {
    items: { value: "24,812", pct: "+4.2%", num: "+1,005", up: true },
    nms: { value: "142", pct: "+9.2%", num: "+12", up: true },
    pharmacyFirst: { value: "89", pct: "+5.9%", num: "+5", up: true },
    nominations: { value: "12,450", weeklyPct: "+1.2%", weeklyNum: "+128", up: true }
  };
  
  const myPharmacyMetrics = {
     items: { value: "9,120", pct: "+2.1%", num: "+187", up: true },
     nms: { value: "62", pct: "+14.8%", num: "+8", up: true },
     nominations: { value: "4,120", weeklyPct: "+0.9%", weeklyNum: "+38", up: true }
  };

  const leaderboards = {
     nms: [{n:"Bowland", v:62}, {n:"Denton", v:48}, {n:"Wilmslow", v:32}],
     pharmacyFirst: [{n:"Denton", v:41}, {n:"Bowland", v:30}, {n:"Wilmslow", v:18}],
     nominationsGrowth: [{n:"Wilmslow", v:"+42"}, {n:"Bowland", v:"+38"}, {n:"Denton", v:"+15"}],
     items: [{n:"Bowland", v:"9,120"}, {n:"Denton", v:"8,405"}, {n:"Wilmslow", v:"7,287"}]
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
           <div>
              <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-foreground mb-2">
                 Good afternoon, {session.staff?.name.split(' ')[0] || session.userEmail?.split('@')[0]}
              </h1>
              <p className="text-muted-foreground">
                 {isHeadOffice ? "Network Performance Overview" : `Here's what's happening at ${session.scope.type === 'pharmacy' ? session.scope.pharmacyName : 'your pharmacy'}`} • {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
           </div>
           
           <div className="flex items-center gap-3">
              <Link href="/daily-figures">
                 <Button variant="outline" className="gap-2 bg-background/50 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors">
                    <FileText className="h-4 w-4" /> Submit Daily Figures
                 </Button>
              </Link>
              <Link href="/cashing-up">
                 <Button className="gap-2 shadow-sm">
                    <Coins className="h-4 w-4" /> Submit Cash Up
                 </Button>
              </Link>
           </div>
        </div>

        {isHeadOffice ? (
           <>
              {/* HEAD OFFICE / AHMED KPI CARDS */}
              <div className="grid gap-4 md:grid-cols-4">
                 <Card className="p-5 rounded-2xl border bg-card/60">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Total Prescriptions/Items</div>
                    <div className="text-3xl font-bold font-mono">{globalMetrics.items.value}</div>
                    <div className={`text-xs flex items-center mt-1 font-medium ${globalMetrics.items.up ? "text-emerald-600" : "text-red-600"}`}>
                       {globalMetrics.items.up ? <ArrowUpRight className="h-3 w-3 mr-1"/> : <ArrowDownRight className="h-3 w-3 mr-1"/>}
                       {globalMetrics.items.pct} ({globalMetrics.items.num}) vs last mth
                    </div>
                 </Card>
                 <Card className="p-5 rounded-2xl border bg-card/60">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Total NMS</div>
                    <div className="text-3xl font-bold font-mono">{globalMetrics.nms.value}</div>
                    <div className={`text-xs flex items-center mt-1 font-medium ${globalMetrics.nms.up ? "text-emerald-600" : "text-red-600"}`}>
                       {globalMetrics.nms.up ? <ArrowUpRight className="h-3 w-3 mr-1"/> : <ArrowDownRight className="h-3 w-3 mr-1"/>}
                       {globalMetrics.nms.pct} ({globalMetrics.nms.num}) vs last mth
                    </div>
                 </Card>
                 <Card className="p-5 rounded-2xl border bg-card/60">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Pharmacy First</div>
                    <div className="text-3xl font-bold font-mono">{globalMetrics.pharmacyFirst.value}</div>
                    <div className={`text-xs flex items-center mt-1 font-medium ${globalMetrics.pharmacyFirst.up ? "text-emerald-600" : "text-red-600"}`}>
                       {globalMetrics.pharmacyFirst.up ? <ArrowUpRight className="h-3 w-3 mr-1"/> : <ArrowDownRight className="h-3 w-3 mr-1"/>}
                       {globalMetrics.pharmacyFirst.pct} ({globalMetrics.pharmacyFirst.num}) vs last mth
                    </div>
                 </Card>
                 <Card className="p-5 rounded-2xl border bg-card/60">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Total Nominations</div>
                    <div className="text-3xl font-bold font-mono">{globalMetrics.nominations.value}</div>
                    <div className={`text-xs flex items-center mt-1 font-medium ${globalMetrics.nominations.up ? "text-emerald-600" : "text-red-600"}`}>
                       {globalMetrics.nominations.up ? <ArrowUpRight className="h-3 w-3 mr-1"/> : <ArrowDownRight className="h-3 w-3 mr-1"/>}
                       Weekly Growth: {globalMetrics.nominations.weeklyNum} ({globalMetrics.nominations.weeklyPct})
                    </div>
                 </Card>
              </div>

              {/* LEADERBOARDS */}
              <div className="grid gap-6 lg:grid-cols-2">
                 <Card className="p-6 rounded-2xl border bg-card/60 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary/70" /> Service Performance</h3>
                       <span className="text-xs text-muted-foreground">Highest to Lowest</span>
                    </div>
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider ml-1">Total NMS</div>
                          {leaderboards.nms.map((x, i) => (
                             <div key={x.n} className="flex items-center justify-between p-2.5 rounded-xl bg-background/50 border border-transparent hover:border-border transition-colors">
                                <div className="flex items-center gap-3">
                                   <div className="text-xs font-mono text-muted-foreground w-4 text-center">{i+1}</div>
                                   <Badge variant="outline" className={`px-2.5 py-0.5 shadow-sm ${PHARMACY_COLORS[x.n] || ""}`}>{x.n}</Badge>
                                </div>
                                <div className="font-mono font-bold text-base">{x.v}</div>
                             </div>
                          ))}
                       </div>
                       <Separator className="my-2" />
                       <div className="space-y-2">
                          <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider ml-1">Pharmacy First</div>
                          {leaderboards.pharmacyFirst.map((x, i) => (
                             <div key={x.n} className="flex items-center justify-between p-2.5 rounded-xl bg-background/50 border border-transparent hover:border-border transition-colors">
                                <div className="flex items-center gap-3">
                                   <div className="text-xs font-mono text-muted-foreground w-4 text-center">{i+1}</div>
                                   <Badge variant="outline" className={`px-2.5 py-0.5 shadow-sm ${PHARMACY_COLORS[x.n] || ""}`}>{x.n}</Badge>
                                </div>
                                <div className="font-mono font-bold text-base">{x.v}</div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </Card>

                 <Card className="p-6 rounded-2xl border bg-card/60 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary/70" /> Growth Metrics</h3>
                       <span className="text-xs text-muted-foreground">Highest to Lowest</span>
                    </div>
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider ml-1">Nominations (Growth)</div>
                          {leaderboards.nominationsGrowth.map((x, i) => (
                             <div key={x.n} className="flex items-center justify-between p-2.5 rounded-xl bg-background/50 border border-transparent hover:border-border transition-colors">
                                <div className="flex items-center gap-3">
                                   <div className="text-xs font-mono text-muted-foreground w-4 text-center">{i+1}</div>
                                   <Badge variant="outline" className={`px-2.5 py-0.5 shadow-sm ${PHARMACY_COLORS[x.n] || ""}`}>{x.n}</Badge>
                                </div>
                                <div className="font-mono font-bold text-emerald-600 text-base">{x.v}</div>
                             </div>
                          ))}
                       </div>
                       <Separator className="my-2" />
                       <div className="space-y-2">
                          <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider ml-1">Total Prescriptions/Items</div>
                          {leaderboards.items.map((x, i) => (
                             <div key={x.n} className="flex items-center justify-between p-2.5 rounded-xl bg-background/50 border border-transparent hover:border-border transition-colors">
                                <div className="flex items-center gap-3">
                                   <div className="text-xs font-mono text-muted-foreground w-4 text-center">{i+1}</div>
                                   <Badge variant="outline" className={`px-2.5 py-0.5 shadow-sm ${PHARMACY_COLORS[x.n] || ""}`}>{x.n}</Badge>
                                </div>
                                <div className="font-mono font-bold text-base">{x.v}</div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </Card>
              </div>

              {/* COMPLIANCE WIDGET FOR HEAD OFFICE */}
              <div className="grid gap-6 lg:grid-cols-2 mt-6">
                 <Card className="p-6 rounded-2xl border bg-card/60 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Submission Compliance</h3>
                       <Link href="/compliance">
                          <Button variant="ghost" size="sm" className="h-8">View All <ArrowRight className="h-3 w-3 ml-1" /></Button>
                       </Link>
                    </div>
                    <div className="flex items-center gap-6 mb-4">
                       <div className="flex flex-col">
                          <span className="text-3xl font-mono font-bold text-emerald-600">88%</span>
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">Network Score</span>
                       </div>
                       <div className="flex-1 space-y-2">
                          <div>
                             <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Daily Figures</span><span className="font-medium">94%</span></div>
                             <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[94%]" /></div>
                          </div>
                          <div>
                             <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Cashing Up</span><span className="font-medium">89%</span></div>
                             <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-amber-500 w-[89%]" /></div>
                          </div>
                       </div>
                    </div>
                 </Card>

                 <Card className="p-6 rounded-2xl border bg-card/60 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="font-semibold flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> PQS Readiness (2026/27)</h3>
                       <Link href="/pqs">
                          <Button variant="ghost" size="sm" className="h-8">Tracker <ArrowRight className="h-3 w-3 ml-1" /></Button>
                       </Link>
                    </div>
                    <div className="flex items-center gap-6 mb-4">
                       <div className="flex flex-col">
                          <span className="text-3xl font-mono font-bold text-primary">45%</span>
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">Network Avg</span>
                       </div>
                       <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                          <div className="p-2 bg-background/50 rounded-lg border text-center">
                             <div className="font-mono font-bold text-amber-500">12</div>
                             <div className="text-[10px] text-muted-foreground uppercase">Overdue Actions</div>
                          </div>
                          <div className="p-2 bg-background/50 rounded-lg border text-center">
                             <div className="font-mono font-bold text-red-500">5</div>
                             <div className="text-[10px] text-muted-foreground uppercase">Missing Evidence</div>
                          </div>
                       </div>
                    </div>
                 </Card>
              </div>
           </>
        ) : (
           <>
              {/* PHARMACY DASHBOARD */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                 <Link href="/daily-figures">
                    <Card className="p-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group h-full shadow-sm">
                       <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <FileText className="h-5 w-5" />
                       </div>
                       <div className="font-semibold text-lg mb-1 text-foreground">Daily Figures</div>
                       <p className="text-xs text-muted-foreground mb-3 leading-relaxed">Submit NHS & private service volumes</p>
                       <div className="flex items-center text-xs font-bold text-primary opacity-60 group-hover:opacity-100 transition-opacity">
                          Open <ArrowRight className="ml-1 h-3 w-3" />
                       </div>
                    </Card>
                 </Link>

                 <Link href="/cashing-up">
                    <Card className="p-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group h-full shadow-sm">
                       <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Coins className="h-5 w-5" />
                       </div>
                       <div className="font-semibold text-lg mb-1 text-foreground">Cashing Up</div>
                       <p className="text-xs text-muted-foreground mb-3 leading-relaxed">Reconcile till and card totals</p>
                       <div className="flex items-center text-xs font-bold text-primary opacity-60 group-hover:opacity-100 transition-opacity">
                          Open <ArrowRight className="ml-1 h-3 w-3" />
                       </div>
                    </Card>
                 </Link>

                 <Link href="/documents">
                    <Card className="p-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group h-full shadow-sm">
                       <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <Files className="h-5 w-5" />
                       </div>
                       <div className="font-semibold text-lg mb-1 text-foreground">Documents</div>
                       <p className="text-xs text-muted-foreground mb-3 leading-relaxed">SOPs and guidance</p>
                       <div className="flex items-center text-xs font-bold text-primary opacity-60 group-hover:opacity-100 transition-opacity">
                          View <ArrowRight className="ml-1 h-3 w-3" />
                       </div>
                    </Card>
                 </Link>

                 <Link href="/reports">
                    <Card className="p-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group h-full shadow-sm">
                       <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <TrendingUp className="h-5 w-5" />
                       </div>
                       <div className="font-semibold text-lg mb-1 text-foreground">Reports</div>
                       <p className="text-xs text-muted-foreground mb-3 leading-relaxed">View historical data</p>
                       <div className="flex items-center text-xs font-bold text-primary opacity-60 group-hover:opacity-100 transition-opacity">
                          Analyze <ArrowRight className="ml-1 h-3 w-3" />
                       </div>
                    </Card>
                 </Link>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                 <Card className="lg:col-span-2 p-6 rounded-2xl border bg-card/60 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                       <h3 className="font-semibold">Pending Tasks</h3>
                       <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">2 Due</Badge>
                    </div>
                    <div className="space-y-3">
                       {tasks.map(task => (
                          <div key={task.id} className="flex items-center justify-between p-4 rounded-xl border bg-background/50 hover:bg-background transition-colors group">
                             <div className="flex items-center gap-4">
                                <div className={`h-2.5 w-2.5 rounded-full shadow-sm ${task.urgency === 'high' ? 'bg-destructive' : 'bg-amber-500'}`} />
                                <div>
                                   <div className="font-medium text-[15px]">{task.title}</div>
                                   <div className="text-xs text-muted-foreground mt-0.5">Due: {task.due}</div>
                                </div>
                             </div>
                             <Link href={task.href}>
                                <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                   Start <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                </Button>
                             </Link>
                          </div>
                       ))}
                    </div>
                 </Card>

                 <Card className="p-6 rounded-2xl border bg-card/60 flex flex-col justify-between shadow-sm">
                    <div className="mb-4">
                       <h3 className="font-semibold mb-1">Performance (MTD)</h3>
                       <div className="text-xs text-muted-foreground">vs Previous Month</div>
                    </div>
                    
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                       <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Prescriptions/Items</span>
                          <div className="text-right">
                             <div className="font-mono font-bold text-lg">{myPharmacyMetrics.items.value}</div>
                             <div className="text-[10px] text-emerald-600 flex items-center justify-end font-medium">
                                <ArrowUpRight className="h-3 w-3 mr-1"/>
                                {myPharmacyMetrics.items.pct} ({myPharmacyMetrics.items.num})
                             </div>
                          </div>
                       </div>
                       <Separator />
                       <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total NMS</span>
                          <div className="text-right">
                             <div className="font-mono font-bold text-lg">{myPharmacyMetrics.nms.value}</div>
                             <div className="text-[10px] text-emerald-600 flex items-center justify-end font-medium">
                                <ArrowUpRight className="h-3 w-3 mr-1"/>
                                {myPharmacyMetrics.nms.pct} ({myPharmacyMetrics.nms.num})
                             </div>
                          </div>
                       </div>
                       <Separator />
                       <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Nominations</span>
                          <div className="text-right">
                             <div className="font-mono font-bold text-lg">{myPharmacyMetrics.nominations.value}</div>
                             <div className="text-[10px] text-emerald-600 flex items-center justify-end font-medium">
                                <ArrowUpRight className="h-3 w-3 mr-1"/>
                                {myPharmacyMetrics.nominations.weeklyPct} weekly ({myPharmacyMetrics.nominations.weeklyNum})
                             </div>
                          </div>
                       </div>
                    </div>
                 </Card>
              </div>

              {/* COMPLIANCE & PQS FOR PHARMACY */}
              <div className="grid gap-6 lg:grid-cols-2 mt-2">
                 <Card className="p-5 rounded-2xl border bg-card/60 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                       <h3 className="font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Compliance Score</h3>
                       <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">96%</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">You are currently ranked #1 out of 3 pharmacies for on-time submissions.</p>
                    <div className="grid grid-cols-3 gap-2">
                       <div className="p-2 bg-background/50 rounded-lg border text-center">
                          <div className="font-mono font-bold text-emerald-600">100%</div>
                          <div className="text-[10px] text-muted-foreground mt-1 leading-tight">Daily<br/>Figures</div>
                       </div>
                       <div className="p-2 bg-background/50 rounded-lg border text-center">
                          <div className="font-mono font-bold text-emerald-600">92%</div>
                          <div className="text-[10px] text-muted-foreground mt-1 leading-tight">Cashing<br/>Up</div>
                       </div>
                       <div className="p-2 bg-background/50 rounded-lg border text-center">
                          <div className="font-mono font-bold text-emerald-600">100%</div>
                          <div className="text-[10px] text-muted-foreground mt-1 leading-tight">Book-<br/>keeping</div>
                       </div>
                    </div>
                 </Card>
                 
                 <Card className="p-5 rounded-2xl border bg-card/60 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                       <h3 className="font-semibold flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> PQS 2026/27</h3>
                       <Link href="/pqs"><Button variant="ghost" size="sm" className="h-7 text-xs px-2">Open <ArrowRight className="w-3 h-3 ml-1"/></Button></Link>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                             <path className="text-muted/30" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                             <path className="text-primary" strokeDasharray="60, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                          </svg>
                          <div className="absolute text-sm font-bold text-primary">60%</div>
                       </div>
                       <div className="flex-1 space-y-1.5">
                          <div className="flex justify-between text-xs items-center p-1.5 bg-background/50 rounded border">
                             <span className="text-muted-foreground">In Progress</span>
                             <span className="font-medium">4 criteria</span>
                          </div>
                          <div className="flex justify-between text-xs items-center p-1.5 bg-background/50 rounded border">
                             <span className="text-muted-foreground">Not Started</span>
                             <span className="font-medium">2 criteria</span>
                          </div>
                       </div>
                    </div>
                 </Card>
              </div>
           </>
        )}
      </div>
    </AppShell>
  );
}
