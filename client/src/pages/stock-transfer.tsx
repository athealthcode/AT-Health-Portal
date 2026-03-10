import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
   Truck, Plus, ArrowRight, Package, Calendar, Tag
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function StockTransfer() {
   return (
      <AppShell>
         <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <div>
                  <h1 className="font-serif text-3xl tracking-tight text-foreground">Stock Transfers</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                     Manage short-dated stock and inter-branch transfers.
                  </p>
               </div>
               <div className="flex gap-2">
                  <Button variant="outline" className="gap-2">
                     <Package className="w-4 h-4" /> Declare Excess
                  </Button>
                  <Button className="gap-2">
                     <Plus className="w-4 h-4" /> Request Transfer
                  </Button>
               </div>
            </div>

            <Card className="rounded-2xl border bg-card/60 overflow-hidden">
               <div className="p-4 border-b bg-muted/20">
                  <h3 className="font-semibold text-sm">Active Transfer Requests</h3>
               </div>
               <Table>
                  <TableHeader>
                     <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>From → To</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {[
                        { item: "Apixaban 5mg tabs", qty: 2, from: "Bowland", to: "Denton", exp: "12/2026", status: "Pending Dispatch" },
                        { item: "Ozempic 5mg", qty: 1, from: "Wilmslow", to: "Bowland", exp: "08/2026", status: "In Transit" },
                        { item: "Levothyroxine 1mg", qty: 3, from: "Denton", to: "Wilmslow", exp: "10/2026", status: "Requested" },
                     ].map((t, i) => (
                        <TableRow key={i}>
                           <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                 <Tag className="w-4 h-4 text-muted-foreground" />
                                 {t.item}
                              </div>
                           </TableCell>
                           <TableCell>{t.qty}x</TableCell>
                           <TableCell>
                              <div className="flex items-center gap-2 text-xs">
                                 <Badge variant="outline">{t.from}</Badge>
                                 <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                 <Badge variant="outline">{t.to}</Badge>
                              </div>
                           </TableCell>
                           <TableCell className="text-xs flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" /> {t.exp}
                           </TableCell>
                           <TableCell>
                              <Badge className={t.status === 'Requested' ? 'bg-amber-500' : t.status === 'In Transit' ? 'bg-blue-500' : 'bg-emerald-500'}>
                                 {t.status}
                              </Badge>
                           </TableCell>
                           <TableCell className="text-right">
                              <Button variant="ghost" size="sm">View</Button>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </Card>
         </div>
      </AppShell>
   );
}
