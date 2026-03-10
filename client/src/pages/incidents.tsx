import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
   AlertTriangle, ShieldAlert, Plus, MessageSquare, Clock, ArrowRight, Activity, Thermometer
} from "lucide-react";

export default function Incidents() {
   return (
      <AppShell>
         <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <div>
                  <h1 className="font-serif text-3xl tracking-tight text-foreground">Incident Management</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                     Track, investigate, and resolve operational and compliance issues.
                  </p>
               </div>
               <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Report Incident
               </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               {["All Open (4)", "High Severity (1)", "Overdue (2)", "Requires HO Review (1)"].map((filter, i) => (
                  <Card key={i} className={`p-4 border ${i === 0 ? 'bg-primary/5 border-primary/20' : ''} cursor-pointer hover:border-primary/50 transition-colors`}>
                     <div className="text-sm font-medium text-center">{filter}</div>
                  </Card>
               ))}
            </div>

            <div className="grid gap-3">
               {[
                  { id: "INC-1042", branch: "Bowland Pharmacy", category: "Fridge Temp", severity: "High", title: "Fridge 1 excursion: 9°C for 30 mins", status: "Investigating", days: 1, type: Thermometer },
                  { id: "INC-1041", branch: "Denton Pharmacy", category: "Near Miss", severity: "Medium", title: "Wrong strength picked during dispensing", status: "Open", days: 2, type: Activity },
                  { id: "INC-1039", branch: "Wilmslow Pharmacy", category: "Patient Complaint", severity: "Medium", title: "Delay in delivery causing missed dose", status: "HO Review", days: 5, type: MessageSquare },
                  { id: "INC-1035", branch: "Denton Pharmacy", category: "IT Issue", severity: "Low", title: "Scanner terminal disconnected", status: "Open", days: 7, type: AlertTriangle },
               ].map((inc, i) => {
                  const Icon = inc.type;
                  return (
                     <Card key={i} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow group">
                        <div className="flex items-start gap-4">
                           <div className={`p-2 rounded-lg ${inc.severity === 'High' ? 'bg-rose-100 text-rose-600' : inc.severity === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                              <Icon className="w-5 h-5" />
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                 <span className="text-xs font-mono text-muted-foreground">{inc.id}</span>
                                 <Badge variant="outline" className="text-[10px] uppercase">{inc.category}</Badge>
                                 <span className="text-xs font-medium text-foreground">{inc.branch}</span>
                              </div>
                              <h3 className="font-medium text-base mt-1 group-hover:text-primary transition-colors">{inc.title}</h3>
                           </div>
                        </div>
                        <div className="flex items-center gap-6 text-right">
                           <div className="flex flex-col items-end gap-1">
                              <Badge className={inc.status === 'Investigating' ? 'bg-amber-500' : inc.status === 'HO Review' ? 'bg-purple-500' : 'bg-slate-500'}>
                                 {inc.status}
                              </Badge>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                 <Clock className="w-3 h-3" /> {inc.days} days open
                              </div>
                           </div>
                           <Button variant="ghost" size="icon">
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                           </Button>
                        </div>
                     </Card>
                  )
               })}
            </div>
         </div>
      </AppShell>
   );
}
