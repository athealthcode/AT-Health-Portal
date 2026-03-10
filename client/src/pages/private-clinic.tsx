import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
   HeartPulse, FileSpreadsheet, TrendingUp, DollarSign, Activity, Upload
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/state/auth";

export default function PrivateClinic() {
   const { session } = useAuth();
   
   return (
      <AppShell>
         <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <div>
                  <h1 className="font-serif text-3xl tracking-tight text-foreground">Private Clinic</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                     Manage private service revenue, costs, and category profitability.
                  </p>
               </div>
               <Button className="gap-2">
                  <Upload className="w-4 h-4" /> Upload Sales CSV
               </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <Card className="p-5 border-l-4 border-l-blue-500 rounded-xl shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</p>
                  <h2 className="text-3xl font-bold mt-1">£4,250</h2>
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
                     <TrendingUp className="w-3 h-3" /> +15% vs last month
                  </p>
               </Card>
               <Card className="p-5 border-l-4 border-l-rose-500 rounded-xl shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Direct Costs</p>
                  <h2 className="text-3xl font-bold mt-1">£1,850</h2>
                  <p className="text-xs text-rose-600 mt-2 flex items-center gap-1 font-medium">
                     <TrendingUp className="w-3 h-3" /> +5% vs last month
                  </p>
               </Card>
               <Card className="p-5 border-l-4 border-l-amber-500 rounded-xl shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Other Expenses</p>
                  <h2 className="text-3xl font-bold mt-1">£250</h2>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                     Marketing & Consumables
                  </p>
               </Card>
               <Card className="p-5 border-l-4 border-l-emerald-500 rounded-xl shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Profit</p>
                  <h2 className="text-3xl font-bold mt-1">£2,150</h2>
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
                     50.5% margin
                  </p>
               </Card>
            </div>

            <Card className="rounded-2xl border bg-card/60 overflow-hidden">
               <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
                  <h3 className="font-semibold text-sm">Category Profitability</h3>
               </div>
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Direct Cost</TableHead>
                        <TableHead className="text-right">Gross Profit</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {[
                        { cat: "Weight Loss (Mounjaro/Wegovy)", rev: 2500, cost: 1200 },
                        { cat: "Travel Clinic & Vaccines", rev: 850, cost: 350 },
                        { cat: "Ear Wax Removal", rev: 450, cost: 50 },
                        { cat: "Blood Testing", rev: 300, cost: 150 },
                        { cat: "Private Prescriptions", rev: 150, cost: 100 },
                     ].map((row, i) => {
                        const gp = row.rev - row.cost;
                        const margin = Math.round((gp / row.rev) * 100);
                        return (
                           <TableRow key={i}>
                              <TableCell className="font-medium">{row.cat}</TableCell>
                              <TableCell className="text-right">£{row.rev}</TableCell>
                              <TableCell className="text-right">£{row.cost}</TableCell>
                              <TableCell className="text-right font-medium">£{gp}</TableCell>
                              <TableCell className="text-right">
                                 <Badge variant={margin > 40 ? 'default' : 'secondary'} className={margin > 40 ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                                    {margin}%
                                 </Badge>
                              </TableCell>
                           </TableRow>
                        );
                     })}
                  </TableBody>
               </Table>
            </Card>
         </div>
      </AppShell>
   );
}
