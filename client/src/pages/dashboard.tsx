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
  Calendar,
  BarChart3,
  Award,
  Users
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  const { session } = useAuth();
  const [tasks] = useState([
    { id: 1, title: "Submit Daily Figures", due: "Today, 6:00 PM", urgency: "high", href: "/daily-figures" },
    { id: 2, title: "Complete Cashing Up", due: "Today, 6:30 PM", urgency: "medium", href: "/cashing-up" },
  ]);

  const isAhmed = session.userEmail?.toLowerCase() === "ahmed@at-health.co.uk";
  
  if (isAhmed) {
     // AHMED'S GLOBAL DASHBOARD
     return (
        <AppShell>
           <div className="flex flex-col gap-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                 <div>
                    <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-foreground mb-2">
                       Good afternoon, Ahmed
                    </h1>
                    <p className="text-muted-foreground">
                       Network Performance Overview • {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    </p>
                 </div>
                 <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-background/50">Month to Date</Badge>
                 </div>
              </div>

              {/* KPI CARDS GLOBAL */}
              <div className="grid gap-4 md:grid-cols-4">
                 <Card className="p-5 rounded-2xl border bg-card/60">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Total Items</div>
                    <div className="text-3xl font-bold font-mono">24,812</div>
                    <div className="text-xs text-emerald-600 flex items-center mt-1"><ArrowUpRight className="h-3 w-3 mr-1"/> +4.2% vs last mth</div>
                 </Card>
                 <Card className="p-5 rounded-2xl border bg-card/60">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Total NMS</div>
                    <div className="text-3xl font-bold font-mono">142</div>
                    <div className="text-xs text-emerald-600 flex items-center mt-1"><ArrowUpRight className="h-3 w-3 mr-1"/> +12 vs last mth</div>
                 </Card>
                 <Card className="p-5 rounded-2xl border bg-card/60">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Pharmacy First</div>
                    <div className="text-3xl font-bold font-mono">89</div>
                    <div className="text-xs text-emerald-600 flex items-center mt-1"><ArrowUpRight className="h-3 w-3 mr-1"/> +5 vs last mth</div>
                 </Card>
                 <Card className="p-5 rounded-2xl border bg-card/60">
                    <div className="text-sm font-medium text-muted-foreground mb-2">Nominations</div>
                    <div className="text-3xl font-bold font-mono">12,450</div>
                    <div className="text-xs text-emerald-600 flex items-center mt-1"><ArrowUpRight className="h-3 w-3 mr-1"/> +128 vs last mth</div>
                 </Card>
              </div>

              {/* LEADERBOARDS */}
              <div className="grid gap-6 lg:grid-cols-2">
                 <Card className="p-6 rounded-2xl border bg-card/60">
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="font-semibold flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Service Performance</h3>
                       <span className="text-xs text-muted-foreground">Highest to Lowest</span>
                    </div>
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <div className="text-xs font-semibold uppercase text-muted-foreground">Total NMS</div>
                          {[{n:"Bowland", v:62}, {n:"Denton", v:48}, {n:"Wilmslow", v:32}].map((x, i) => (
                             <div key={x.n} className="flex items-center justify-between p-2 rounded-lg bg-background/40">
                                <div className="flex items-center gap-2">
                                   <div className="text-xs font-mono text-muted-foreground w-4">{i+1}</div>
                                   <div className="text-sm font-medium">{x.n}</div>
                                </div>
                                <div className="font-mono font-bold">{x.v}</div>
                             </div>
                          ))}
                       </div>
                       <Separator />
                       <div className="space-y-2">
                          <div className="text-xs font-semibold uppercase text-muted-foreground">Pharmacy First</div>
                          {[{n:"Denton", v:41}, {n:"Bowland", v:30}, {n:"Wilmslow", v:18}].map((x, i) => (
                             <div key={x.n} className="flex items-center justify-between p-2 rounded-lg bg-background/40">
                                <div className="flex items-center gap-2">
                                   <div className="text-xs font-mono text-muted-foreground w-4">{i+1}</div>
                                   <div className="text-sm font-medium">{x.n}</div>
                                </div>
                                <div className="font-mono font-bold">{x.v}</div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </Card>

                 <Card className="p-6 rounded-2xl border bg-card/60">
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Growth Metrics</h3>
                       <span className="text-xs text-muted-foreground">Highest to Lowest</span>
                    </div>
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <div className="text-xs font-semibold uppercase text-muted-foreground">Nominations (Growth)</div>
                          {[{n:"Wilmslow", v:"+42"}, {n:"Bowland", v:"+38"}, {n:"Denton", v:"+15"}].map((x, i) => (
                             <div key={x.n} className="flex items-center justify-between p-2 rounded-lg bg-background/40">
                                <div className="flex items-center gap-2">
                                   <div className="text-xs font-mono text-muted-foreground w-4">{i+1}</div>
                                   <div className="text-sm font-medium">{x.n}</div>
                                </div>
                                <div className="font-mono font-bold text-emerald-600">{x.v}</div>
                             </div>
                          ))}
                       </div>
                       <Separator />
                       <div className="space-y-2">
                          <div className="text-xs font-semibold uppercase text-muted-foreground">Items Dispensed</div>
                          {[{n:"Bowland", v:"9,120"}, {n:"Denton", v:"8,405"}, {n:"Wilmslow", v:"7,287"}].map((x, i) => (
                             <div key={x.n} className="flex items-center justify-between p-2 rounded-lg bg-background/40">
                                <div className="flex items-center gap-2">
                                   <div className="text-xs font-mono text-muted-foreground w-4">{i+1}</div>
                                   <div className="text-sm font-medium">{x.n}</div>
                                </div>
                                <div className="font-mono font-bold">{x.v}</div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </Card>
              </div>
           </div>
        </AppShell>
     );
  }

  // PHARMACY DASHBOARD (Existing view + Updates)
  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* WELCOME HERO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl tracking-tight text-foreground mb-2">
              Good afternoon, {session.staff?.name.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening at {session.scope.type === "pharmacy" ? session.scope.pharmacyName : "Head Office"}.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium bg-primary/5 text-primary px-3 py-1.5 rounded-full">
            <Calendar className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </div>

        {/* QUICK ACTIONS GRID */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           <Link href="/daily-figures">
              <Card className="p-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group h-full">
                 <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <FileText className="h-5 w-5" />
                 </div>
                 <div className="font-semibold text-lg mb-1">Daily Figures</div>
                 <p className="text-xs text-muted-foreground mb-3">Submit NHS & private service volumes</p>
                 <div className="flex items-center text-xs font-bold text-primary opacity-60 group-hover:opacity-100">
                    Open <ArrowRight className="ml-1 h-3 w-3" />
                 </div>
              </Card>
           </Link>

           <Link href="/cashing-up">
              <Card className="p-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group h-full">
                 <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Coins className="h-5 w-5" />
                 </div>
                 <div className="font-semibold text-lg mb-1">Cashing Up</div>
                 <p className="text-xs text-muted-foreground mb-3">Reconcile till and card totals</p>
                 <div className="flex items-center text-xs font-bold text-primary opacity-60 group-hover:opacity-100">
                    Open <ArrowRight className="ml-1 h-3 w-3" />
                 </div>
              </Card>
           </Link>

           <Link href="/documents">
              <Card className="p-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group h-full">
                 <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Files className="h-5 w-5" />
                 </div>
                 <div className="font-semibold text-lg mb-1">Documents</div>
                 <p className="text-xs text-muted-foreground mb-3">SOPs and guidance</p>
                 <div className="flex items-center text-xs font-bold text-primary opacity-60 group-hover:opacity-100">
                    View <ArrowRight className="ml-1 h-3 w-3" />
                 </div>
              </Card>
           </Link>

           <Link href="/reports">
              <Card className="p-4 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group h-full">
                 <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-5 w-5" />
                 </div>
                 <div className="font-semibold text-lg mb-1">Reports</div>
                 <p className="text-xs text-muted-foreground mb-3">View historical data</p>
                 <div className="flex items-center text-xs font-bold text-primary opacity-60 group-hover:opacity-100">
                    Analyze <ArrowRight className="ml-1 h-3 w-3" />
                 </div>
              </Card>
           </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
           {/* PENDING TASKS */}
           <Card className="lg:col-span-2 p-6 rounded-2xl border bg-card/60">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-semibold">Pending Tasks</h3>
                 <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">2 Due</Badge>
              </div>
              <div className="space-y-3">
                 {tasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-4 rounded-xl border bg-background/50 hover:bg-background transition-colors group">
                       <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${task.urgency === 'high' ? 'bg-destructive' : 'bg-amber-500'}`} />
                          <div>
                             <div className="font-medium">{task.title}</div>
                             <div className="text-xs text-muted-foreground">Due: {task.due}</div>
                          </div>
                       </div>
                       <Link href={task.href}>
                          <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                             Start <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                       </Link>
                    </div>
                 ))}
              </div>
           </Card>

           {/* MONTHLY METRICS VS PREVIOUS */}
           <Card className="p-6 rounded-2xl border bg-card/60 flex flex-col justify-between">
              <div className="mb-4">
                 <h3 className="font-semibold mb-1">Performance (MTD)</h3>
                 <div className="text-xs text-muted-foreground">vs Previous Month</div>
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-sm">Items</span>
                    <div className="text-right">
                       <div className="font-mono font-bold">9,120</div>
                       <div className="text-[10px] text-emerald-600 flex items-center justify-end"><ArrowUpRight className="h-2 w-2 mr-1"/> +2.1%</div>
                    </div>
                 </div>
                 <Separator />
                 <div className="flex items-center justify-between">
                    <span className="text-sm">NMS</span>
                    <div className="text-right">
                       <div className="font-mono font-bold">62</div>
                       <div className="text-[10px] text-emerald-600 flex items-center justify-end"><ArrowUpRight className="h-2 w-2 mr-1"/> +8</div>
                    </div>
                 </div>
                 <Separator />
                 <div className="flex items-center justify-between">
                    <span className="text-sm">Nominations</span>
                    <div className="text-right">
                       <div className="font-mono font-bold">4,120</div>
                       <div className="text-[10px] text-emerald-600 flex items-center justify-end"><ArrowUpRight className="h-2 w-2 mr-1"/> +12</div>
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </AppShell>
  );
}
