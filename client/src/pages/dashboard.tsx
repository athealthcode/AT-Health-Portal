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
  Calendar
} from "lucide-react";

export default function Dashboard() {
  const { session } = useAuth();
  const [tasks] = useState([
    { id: 1, title: "Submit Daily Figures", due: "Today, 6:00 PM", urgency: "high", href: "/daily-figures" },
    { id: 2, title: "Complete Cashing Up", due: "Today, 6:30 PM", urgency: "medium", href: "/cashing-up" },
  ]);

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

           {/* NOMINATIONS WIDGET */}
           <Card className="p-6 rounded-2xl border bg-card/60 flex flex-col justify-between">
              <div>
                 <div className="text-sm font-medium text-muted-foreground mb-1">Weekly Nominations</div>
                 <div className="text-3xl font-bold font-mono text-foreground">4,120</div>
                 <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200 shadow-none">
                       <ArrowUpRight className="h-3 w-3 mr-1" />
                       +12
                    </Badge>
                    <span className="text-xs text-muted-foreground">vs last week</span>
                 </div>
              </div>
              <div className="mt-8 pt-4 border-t text-xs text-muted-foreground">
                 Week ending: {new Date().toLocaleDateString('en-GB')}
              </div>
           </Card>
        </div>
      </div>
    </AppShell>
  );
}
