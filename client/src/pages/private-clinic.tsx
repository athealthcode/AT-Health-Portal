import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  HeartPulse, TrendingUp, TrendingDown, PoundSterling, Activity, Plus, Trash2, BarChart3, ListChecks
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/state/auth";

const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

const COST_CATEGORIES = ["Locum / Staff", "Rent / Rates", "Utilities", "Consumables", "Marketing", "Equipment", "Software", "Other"];

const DEFAULT_MONTHLY: Record<string, { revenue: number; serviceCosts: number }> = {
  Apr: { revenue: 3200, serviceCosts: 1100 },
  May: { revenue: 3750, serviceCosts: 1250 },
  Jun: { revenue: 4100, serviceCosts: 1400 },
  Jul: { revenue: 4250, serviceCosts: 1500 },
  Aug: { revenue: 3900, serviceCosts: 1350 },
  Sep: { revenue: 4400, serviceCosts: 1550 },
  Oct: { revenue: 4800, serviceCosts: 1650 },
  Nov: { revenue: 5100, serviceCosts: 1800 },
  Dec: { revenue: 3600, serviceCosts: 1200 },
  Jan: { revenue: 3100, serviceCosts: 1050 },
  Feb: { revenue: 3700, serviceCosts: 1300 },
  Mar: { revenue: 4250, serviceCosts: 1480 },
};

const SERVICE_CATEGORIES = [
  { cat: "Travel Vaccinations", rev: 1850, cost: 620 },
  { cat: "Ear Microsuction", rev: 780, cost: 180 },
  { cat: "Blood Tests / Phlebotomy", rev: 520, cost: 210 },
  { cat: "Mounjaro / Weight Management", rev: 680, cost: 290 },
  { cat: "Minor Ailments (Private)", rev: 220, cost: 55 },
  { cat: "Other Private Services", rev: 200, cost: 80 },
];

export default function PrivateClinic() {
  const { session } = useAuth();
  const isHeadOffice = session.scope.type === "headoffice";

  const [selectedMonth, setSelectedMonth] = useState("Jul");

  // Operational Costs state
  const [opCosts, setOpCosts] = useState<Array<{id: string; category: string; description: string; amount: string}>>([
    { id: "1", category: "Locum / Staff", description: "Locum pharmacist cover", amount: "480.00" },
    { id: "2", category: "Consumables", description: "Needles, swabs, gloves", amount: "85.00" },
    { id: "3", category: "Marketing", description: "Leaflets & social media", amount: "60.00" },
  ]);

  const totalServiceRev = SERVICE_CATEGORIES.reduce((s, r) => s + r.rev, 0);
  const totalServiceCost = SERVICE_CATEGORIES.reduce((s, r) => s + r.cost, 0);
  const totalOpCosts = opCosts.reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const grossProfit = totalServiceRev - totalServiceCost;
  const netProfit = grossProfit - totalOpCosts;
  const netMargin = Math.round((netProfit / totalServiceRev) * 100);

  const addCostLine = () => {
    setOpCosts(prev => [...prev, { id: Date.now().toString(), category: "Other", description: "", amount: "" }]);
  };

  const updateCostLine = (id: string, field: string, value: string) => {
    setOpCosts(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCostLine = (id: string) => {
    setOpCosts(prev => prev.filter(c => c.id !== id));
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl tracking-tight text-foreground flex items-center gap-2">
              <HeartPulse className="h-7 w-7 text-rose-500" />
              Private Clinic
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track private service revenue, operational costs, and monthly profitability.
            </p>
          </div>
          {isHeadOffice && (
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m} 2025</SelectItem>)}</SelectContent>
            </Select>
          )}
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-5 border-l-4 border-l-blue-500 rounded-xl shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Service Revenue</p>
            <h2 className="text-3xl font-bold mt-1 font-mono">£{totalServiceRev.toLocaleString()}</h2>
            <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" /> +15% vs last month
            </p>
          </Card>
          <Card className="p-5 border-l-4 border-l-amber-500 rounded-xl shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Operational Costs</p>
            <h2 className="text-3xl font-bold mt-1 font-mono text-amber-600">£{totalOpCosts.toFixed(0)}</h2>
            <p className="text-xs text-muted-foreground mt-2">{opCosts.length} cost lines this month</p>
          </Card>
          <Card className="p-5 border-l-4 border-l-emerald-500 rounded-xl shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gross Profit</p>
            <h2 className="text-3xl font-bold mt-1 font-mono text-emerald-700">£{grossProfit.toLocaleString()}</h2>
            <p className="text-xs text-muted-foreground mt-2">After service costs</p>
          </Card>
          <Card className="p-5 border-l-4 border-l-primary rounded-xl shadow-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Profit</p>
            <h2 className={`text-3xl font-bold mt-1 font-mono ${netProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>£{netProfit.toFixed(0)}</h2>
            <p className={`text-xs mt-2 font-medium ${netMargin >= 40 ? 'text-emerald-600' : netMargin >= 20 ? 'text-amber-600' : 'text-red-500'}`}>
              {netMargin}% net margin
            </p>
          </Card>
        </div>

        <Tabs defaultValue="services">
          <TabsList className="mb-4">
            <TabsTrigger value="services"><Activity className="h-4 w-4 mr-2" />Service Breakdown</TabsTrigger>
            <TabsTrigger value="costs"><ListChecks className="h-4 w-4 mr-2" />Operational Costs</TabsTrigger>
            <TabsTrigger value="monthly"><BarChart3 className="h-4 w-4 mr-2" />Monthly Performance</TabsTrigger>
          </TabsList>

          {/* SERVICE BREAKDOWN TAB */}
          <TabsContent value="services">
            <Card className="rounded-2xl border bg-card/60 shadow-sm overflow-hidden">
              <div className="p-5 border-b">
                <div className="text-sm font-semibold">Revenue by Service Category</div>
                <div className="text-xs text-muted-foreground mt-0.5">Gross margin per service line for {selectedMonth}</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Category</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Direct Cost</TableHead>
                    <TableHead className="text-right">Gross Profit</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SERVICE_CATEGORIES.map((row, i) => {
                    const gp = row.rev - row.cost;
                    const margin = Math.round((gp / row.rev) * 100);
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.cat}</TableCell>
                        <TableCell className="text-right font-mono">£{row.rev.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">£{row.cost}</TableCell>
                        <TableCell className="text-right font-mono font-semibold text-emerald-700">£{gp}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={margin > 50 ? 'default' : 'secondary'} className={margin > 50 ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                            {margin}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/30 font-semibold border-t-2">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right font-mono">£{totalServiceRev.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono">£{totalServiceCost.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-700">£{grossProfit.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{Math.round((grossProfit/totalServiceRev)*100)}%</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* OPERATIONAL COSTS TAB */}
          <TabsContent value="costs">
            <Card className="rounded-2xl border bg-card/60 shadow-sm">
              <div className="p-5 border-b flex justify-between items-center">
                <div>
                  <div className="text-sm font-semibold">Operational Costs — {selectedMonth}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Fixed and variable costs to run the private clinic this month</div>
                </div>
                <Button size="sm" onClick={addCostLine}><Plus className="h-4 w-4 mr-1" />Add Cost</Button>
              </div>
              <div className="p-5 space-y-3">
                {opCosts.map((c) => (
                  <div key={c.id} className="grid grid-cols-[180px_1fr_130px_40px] gap-3 items-start bg-background/50 p-3 rounded-xl border">
                    <div>
                      <Label className="text-xs mb-1 block">Category</Label>
                      <Select value={c.category} onValueChange={v => updateCostLine(c.id, 'category', v)}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{COST_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Description</Label>
                      <Input value={c.description} onChange={e => updateCostLine(c.id, 'description', e.target.value)} placeholder="Brief description" className="h-9 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">£</span>
                        <Input value={c.amount} onChange={e => updateCostLine(c.id, 'amount', e.target.value)} className="h-9 pl-6 font-mono text-sm" placeholder="0.00" />
                      </div>
                    </div>
                    <div className="mt-5">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10" onClick={() => removeCostLine(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {opCosts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">No operational costs recorded. Click 'Add Cost' to start.</div>
                )}
              </div>
              <Separator />
              <div className="p-5 flex justify-between items-center bg-muted/20">
                <div className="text-sm font-semibold">Total Operational Costs</div>
                <div className="text-xl font-bold font-mono text-amber-600">£{totalOpCosts.toFixed(2)}</div>
              </div>
              <div className="px-5 pb-5 flex justify-between items-center bg-muted/10 rounded-b-2xl">
                <div className="text-sm text-muted-foreground">Net Profit (after all costs)</div>
                <div className={`text-xl font-bold font-mono ${netProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>£{netProfit.toFixed(2)}</div>
              </div>
            </Card>
          </TabsContent>

          {/* MONTHLY PERFORMANCE TAB */}
          <TabsContent value="monthly">
            <Card className="rounded-2xl border bg-card/60 shadow-sm overflow-hidden">
              <div className="p-5 border-b">
                <div className="text-sm font-semibold">Monthly Performance Overview</div>
                <div className="text-xs text-muted-foreground mt-0.5">12-month rolling view of private clinic financials</div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Service Costs</TableHead>
                    <TableHead className="text-right">Op Costs (est.)</TableHead>
                    <TableHead className="text-right">Net Profit</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead className="text-right">vs Prior</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MONTHS.map((m, i) => {
                    const d = DEFAULT_MONTHLY[m];
                    const opEst = Math.round(d.revenue * 0.15);
                    const net = d.revenue - d.serviceCosts - opEst;
                    const margin = Math.round((net / d.revenue) * 100);
                    const prev = i > 0 ? DEFAULT_MONTHLY[MONTHS[i-1]] : null;
                    const prevNet = prev ? prev.revenue - prev.serviceCosts - Math.round(prev.revenue * 0.15) : null;
                    const change = prevNet !== null ? Math.round(((net - prevNet) / Math.abs(prevNet)) * 100) : null;
                    return (
                      <TableRow key={m} className={m === selectedMonth ? 'bg-primary/5' : ''}>
                        <TableCell className="font-medium">
                          {m} 2025
                          {m === selectedMonth && <Badge className="ml-2 text-[10px] bg-primary/10 text-primary hover:bg-primary/10">Current</Badge>}
                        </TableCell>
                        <TableCell className="text-right font-mono">£{d.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">£{d.serviceCosts.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">£{opEst}</TableCell>
                        <TableCell className={`text-right font-mono font-semibold ${net >= 0 ? 'text-emerald-700' : 'text-red-500'}`}>£{net}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className={margin >= 40 ? 'bg-emerald-100 text-emerald-700' : margin >= 25 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}>
                            {margin}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs font-medium">
                          {change !== null ? (
                            <span className={`flex items-center justify-end gap-0.5 ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {change >= 0 ? '+' : ''}{change}%
                            </span>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
