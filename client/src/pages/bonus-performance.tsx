import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/state/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, Lock, Upload, FileSpreadsheet, PoundSterling, TrendingUp, AlertTriangle, ShieldCheck, Download } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

// --- TYPES ---
type BonusStatus = "draft" | "approved" | "locked";

type PharmacyId = "bowland" | "denton" | "wilmslow";

type CostItem = {
  id: string;
  serviceName: string;
  costPrice: number;
};

type BonusGate = {
  id: string;
  label: string;
  passed: boolean;
};

type MonthlyState = {
  status: BonusStatus;
  gates: Record<PharmacyId, BonusGate[]>;
  privateSales: Record<PharmacyId, { service: string; quantity: number; revenue: number }[]>;
  nhsPerformance: Record<PharmacyId, { items: number; nms: number; targetItems: number; targetNms: number }>;
};

// --- MOCK DATA ---
const INITIAL_COSTS: CostItem[] = [
  { id: "c1", serviceName: "Chickenpox (Course)", costPrice: 65.00 },
  { id: "c2", serviceName: "Weight Loss (Mounjaro 2.5mg)", costPrice: 125.00 },
  { id: "c3", serviceName: "Weight Loss (Mounjaro 5mg)", costPrice: 125.00 },
  { id: "c4", serviceName: "Travel - Typhoid", costPrice: 18.00 },
  { id: "c5", serviceName: "Travel - Hep A", costPrice: 22.00 },
  { id: "c6", serviceName: "Ear Wax Removal (1 ear)", costPrice: 0.00 }, // Service time only
  { id: "c7", serviceName: "Ear Wax Removal (2 ears)", costPrice: 0.00 },
];

const DEFAULT_GATES: BonusGate[] = [
  { id: "mys", label: "MYS Submitted on Time (by 5th)", passed: false },
  { id: "staff_budget", label: "Staff Hours within Budget", passed: false },
  { id: "incidents", label: "No Critical Safety Incidents", passed: true }, // Default true for optimism
];

const PHARMACIES: { id: PharmacyId; name: string }[] = [
  { id: "bowland", name: "Bowland Pharmacy" },
  { id: "denton", name: "Denton Pharmacy" },
  { id: "wilmslow", name: "Wilmslow Pharmacy" },
];

export default function BonusPerformance() {
  const { session } = useAuth();
  const { toast } = useToast();
  
  // -- STATE --
  const [selectedMonth, setSelectedMonth] = useState("2026-02");
  const [costs, setCosts] = useState<CostItem[]>(INITIAL_COSTS);
  const [activeTab, setActiveTab] = useState("overview");

  // Mock persistence for monthly data
  const [monthlyData, setMonthlyData] = useState<Record<string, MonthlyState>>({
     "2026-02": {
        status: "draft",
        gates: {
           bowland: [...DEFAULT_GATES],
           denton: [...DEFAULT_GATES],
           wilmslow: [...DEFAULT_GATES],
        },
        privateSales: { bowland: [], denton: [], wilmslow: [] },
        nhsPerformance: {
           bowland: { items: 9120, nms: 62, targetItems: 8800, targetNms: 50 }, // 6-month avg simulated
           denton: { items: 8405, nms: 48, targetItems: 8500, targetNms: 45 },
           wilmslow: { items: 7287, nms: 32, targetItems: 7000, targetNms: 30 },
        }
     }
  });

  const currentMonthData = monthlyData[selectedMonth] || {
     status: "draft",
     gates: { bowland: [...DEFAULT_GATES], denton: [...DEFAULT_GATES], wilmslow: [...DEFAULT_GATES] },
     privateSales: { bowland: [], denton: [], wilmslow: [] },
     nhsPerformance: { bowland: { items: 0, nms: 0, targetItems: 0, targetNms: 0 }, denton: { items: 0, nms: 0, targetItems: 0, targetNms: 0 }, wilmslow: { items: 0, nms: 0, targetItems: 0, targetNms: 0 } }
  };

  const isLocked = currentMonthData.status === "locked";
  const isApproved = currentMonthData.status === "approved";

  // -- HANDLERS --

  const handleGateToggle = (pharmacyId: PharmacyId, gateId: string) => {
     if (isLocked) return;
     setMonthlyData(prev => {
        const m = prev[selectedMonth];
        const pGates = m.gates[pharmacyId].map(g => g.id === gateId ? { ...g, passed: !g.passed } : g);
        return { ...prev, [selectedMonth]: { ...m, gates: { ...m.gates, [pharmacyId]: pGates } } };
     });
  };

  const handleStatusChange = (newStatus: BonusStatus) => {
     setMonthlyData(prev => ({
        ...prev,
        [selectedMonth]: { ...prev[selectedMonth], status: newStatus }
     }));
     toast({ 
        title: `Status Updated: ${newStatus.toUpperCase()}`, 
        description: newStatus === 'locked' ? "Month is now read-only." : "Status changed successfully." 
     });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, pharmacyId: PharmacyId) => {
     if (isLocked) return;
     const file = e.target.files?.[0];
     if (!file) return;

     // Mock CSV Parse - in real app use papa-parse
     // Simulating reading "Service,Quantity,Revenue"
     const reader = new FileReader();
     reader.onload = (event) => {
        const text = event.target?.result as string;
        // Simple mock parse logic for prototype
        // Assuming user uploads the sample format
        const mockParsed = [
           { service: "Chickenpox (Course)", quantity: 5, revenue: 325.00 },
           { service: "Weight Loss (Mounjaro 2.5mg)", quantity: 12, revenue: 2160.00 },
           { service: "Ear Wax Removal (2 ears)", quantity: 8, revenue: 480.00 },
        ];
        
        setMonthlyData(prev => ({
           ...prev,
           [selectedMonth]: {
              ...prev[selectedMonth],
              privateSales: {
                 ...prev[selectedMonth].privateSales,
                 [pharmacyId]: mockParsed
              }
           }
        }));
        toast({ title: "Sales Uploaded", description: `Parsed ${mockParsed.length} records for ${PHARMACIES.find(p => p.id === pharmacyId)?.name}` });
     };
     reader.readAsText(file);
  };

  const handleCostUpdate = (id: string, val: string) => {
     setCosts(prev => prev.map(c => c.id === id ? { ...c, costPrice: parseFloat(val) || 0 } : c));
  };

  // -- CALCULATIONS --
  
  const calculatePrivateBonus = (pharmacyId: PharmacyId) => {
     const sales = currentMonthData.privateSales[pharmacyId] || [];
     let totalProfit = 0;
     
     sales.forEach(sale => {
        const costItem = costs.find(c => c.serviceName === sale.service);
        const unitCost = costItem ? costItem.costPrice : 0;
        const totalCost = unitCost * sale.quantity;
        const profit = sale.revenue - totalCost;
        totalProfit += profit;
     });

     // Bonus rule: 10% of profit if > £500 profit
     if (totalProfit < 500) return 0;
     return totalProfit * 0.10;
  };

  const calculateNHSBonus = (pharmacyId: PharmacyId) => {
     const gatesPassed = currentMonthData.gates[pharmacyId].every(g => g.passed);
     if (!gatesPassed) return 0;

     const perf = currentMonthData.nhsPerformance[pharmacyId];
     if (!perf) return 0;

     // Simple rule: Base £500 + £100 if Items > Target + £100 if NMS > Target
     let bonus = 500;
     if (perf.items >= perf.targetItems) bonus += 100;
     if (perf.nms >= perf.targetNms) bonus += 100;
     
     return bonus;
  };

  const totalBonus = (pharmacyId: PharmacyId) => calculateNHSBonus(pharmacyId) + calculatePrivateBonus(pharmacyId);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
           <div>
              <div className="font-serif text-2xl tracking-tight">Bonus & Performance</div>
              <div className="text-sm text-muted-foreground">
                 Monthly performance tracking, bonus calculations, and approval workflow.
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-card border rounded-lg p-1">
                 <Button variant="ghost" size="sm" onClick={() => {
                    const d = new Date(selectedMonth);
                    d.setMonth(d.getMonth() - 1);
                    setSelectedMonth(format(d, "yyyy-MM"));
                 }}>←</Button>
                 <span className="font-mono font-medium text-sm w-24 text-center">{selectedMonth}</span>
                 <Button variant="ghost" size="sm" onClick={() => {
                     const d = new Date(selectedMonth);
                     d.setMonth(d.getMonth() + 1);
                     setSelectedMonth(format(d, "yyyy-MM"));
                 }}>→</Button>
              </div>
              {currentMonthData.status === "draft" && (
                 <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleStatusChange("approved")}>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Approve Month
                 </Button>
              )}
              {currentMonthData.status === "approved" && (
                 <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => handleStatusChange("locked")}>
                    <Lock className="h-4 w-4 mr-2" /> Lock & Archive
                 </Button>
              )}
              {currentMonthData.status === "locked" && (
                 <Badge variant="outline" className="h-9 px-3 border-amber-500 text-amber-600 bg-amber-50">
                    <Lock className="h-3 w-3 mr-1" /> Month Locked
                 </Badge>
              )}
           </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
           <TabsList className="mb-4 w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="nhs">NHS Bonus</TabsTrigger>
              <TabsTrigger value="private">Private Bonus</TabsTrigger>
              <TabsTrigger value="costs">Service Costs</TabsTrigger>
           </TabsList>

           <TabsContent value="overview">
              <div className="grid gap-6 md:grid-cols-3">
                 {PHARMACIES.map(p => {
                    const nhs = calculateNHSBonus(p.id);
                    const pvt = calculatePrivateBonus(p.id);
                    const total = nhs + pvt;
                    const gatesPassed = currentMonthData.gates[p.id].every(g => g.passed);

                    return (
                       <Card key={p.id} className="p-5 rounded-2xl border bg-card/60 flex flex-col">
                          <div className="flex justify-between items-start mb-4">
                             <div className="font-semibold text-lg">{p.name}</div>
                             {gatesPassed ? 
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Gates Passed</Badge> :
                                <Badge variant="destructive">Gates Failed</Badge>
                             }
                          </div>
                          
                          <div className="space-y-4 flex-1">
                             <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">NHS Bonus</span>
                                <span className="font-mono font-medium">£{nhs.toFixed(2)}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Private Bonus</span>
                                <span className="font-mono font-medium">£{pvt.toFixed(2)}</span>
                             </div>
                             <Separator />
                             <div className="flex justify-between font-bold">
                                <span>Total Payable</span>
                                <span className="font-mono text-lg text-primary">£{total.toFixed(2)}</span>
                             </div>
                          </div>
                       </Card>
                    );
                 })}
              </div>
           </TabsContent>

           <TabsContent value="nhs">
              <div className="grid gap-6 lg:grid-cols-2">
                 {PHARMACIES.map(p => (
                    <Card key={p.id} className="p-6 rounded-2xl border bg-card/60">
                       <div className="flex justify-between items-center mb-4">
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-muted-foreground">6-Month Avg Targets</div>
                       </div>
                       
                       <div className="space-y-4">
                          <div className="bg-background/50 rounded-xl p-4 border">
                             <div className="text-xs font-semibold uppercase text-muted-foreground mb-3">Mandatory Gates</div>
                             <div className="space-y-2">
                                {currentMonthData.gates[p.id].map(gate => (
                                   <div key={gate.id} className="flex items-center space-x-2">
                                      <Checkbox 
                                         id={`${p.id}-${gate.id}`} 
                                         checked={gate.passed} 
                                         onCheckedChange={() => handleGateToggle(p.id, gate.id)}
                                         disabled={isLocked}
                                      />
                                      <Label 
                                         htmlFor={`${p.id}-${gate.id}`}
                                         className={`text-sm ${gate.passed ? 'text-foreground' : 'text-destructive font-medium'}`}
                                      >
                                         {gate.label}
                                      </Label>
                                   </div>
                                ))}
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Items Dispensed</div>
                                <div className="flex items-end gap-2">
                                   <div className="text-xl font-mono font-bold">{currentMonthData.nhsPerformance[p.id]?.items}</div>
                                   <div className="text-xs text-muted-foreground mb-1">/ {currentMonthData.nhsPerformance[p.id]?.targetItems} target</div>
                                </div>
                                {currentMonthData.nhsPerformance[p.id]?.items >= currentMonthData.nhsPerformance[p.id]?.targetItems && (
                                   <div className="text-[10px] text-emerald-600 font-medium flex items-center"><TrendingUp className="h-3 w-3 mr-1"/> Target Met</div>
                                )}
                             </div>
                             <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">NMS Completed</div>
                                <div className="flex items-end gap-2">
                                   <div className="text-xl font-mono font-bold">{currentMonthData.nhsPerformance[p.id]?.nms}</div>
                                   <div className="text-xs text-muted-foreground mb-1">/ {currentMonthData.nhsPerformance[p.id]?.targetNms} target</div>
                                </div>
                                {currentMonthData.nhsPerformance[p.id]?.nms >= currentMonthData.nhsPerformance[p.id]?.targetNms && (
                                   <div className="text-[10px] text-emerald-600 font-medium flex items-center"><TrendingUp className="h-3 w-3 mr-1"/> Target Met</div>
                                )}
                             </div>
                          </div>

                          <Separator />
                          <div className="flex justify-between items-center">
                             <span className="font-medium">Calculated NHS Bonus</span>
                             <span className="font-mono font-bold text-lg">£{calculateNHSBonus(p.id).toFixed(2)}</span>
                          </div>
                       </div>
                    </Card>
                 ))}
              </div>
           </TabsContent>

           <TabsContent value="private">
              <div className="grid gap-6">
                 {PHARMACIES.map(p => {
                    const sales = currentMonthData.privateSales[p.id] || [];
                    return (
                       <Card key={p.id} className="p-6 rounded-2xl border bg-card/60">
                          <div className="flex justify-between items-center mb-4">
                             <div className="font-semibold">{p.name}</div>
                             <div className="flex items-center gap-2">
                                <Label htmlFor={`upload-${p.id}`} className="cursor-pointer">
                                   <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${isLocked ? 'opacity-50 cursor-not-allowed bg-muted' : 'hover:bg-primary/5'}`}>
                                      <Upload className="h-3.5 w-3.5" />
                                      {sales.length > 0 ? "Replace CSV" : "Upload Sales CSV"}
                                   </div>
                                </Label>
                                <Input 
                                   id={`upload-${p.id}`} 
                                   type="file" 
                                   accept=".csv" 
                                   className="hidden" 
                                   disabled={isLocked}
                                   onChange={(e) => handleFileUpload(e, p.id)} 
                                />
                             </div>
                          </div>

                          {sales.length === 0 ? (
                             <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
                                No sales data uploaded for this month.
                             </div>
                          ) : (
                             <div className="overflow-hidden rounded-lg border">
                                <Table>
                                   <TableHeader>
                                      <TableRow className="bg-muted/50">
                                         <TableHead>Service</TableHead>
                                         <TableHead className="text-right">Qty</TableHead>
                                         <TableHead className="text-right">Revenue</TableHead>
                                         <TableHead className="text-right">Cost (Est)</TableHead>
                                         <TableHead className="text-right">Profit</TableHead>
                                      </TableRow>
                                   </TableHeader>
                                   <TableBody>
                                      {sales.map((sale, i) => {
                                         const costItem = costs.find(c => c.serviceName === sale.service);
                                         const unitCost = costItem ? costItem.costPrice : 0;
                                         const totalCost = unitCost * sale.quantity;
                                         const profit = sale.revenue - totalCost;
                                         return (
                                            <TableRow key={i}>
                                               <TableCell className="font-medium text-xs">{sale.service}</TableCell>
                                               <TableCell className="text-right font-mono text-xs">{sale.quantity}</TableCell>
                                               <TableCell className="text-right font-mono text-xs">£{sale.revenue.toFixed(2)}</TableCell>
                                               <TableCell className="text-right font-mono text-xs text-muted-foreground">£{totalCost.toFixed(2)}</TableCell>
                                               <TableCell className="text-right font-mono text-xs font-bold text-emerald-600">£{profit.toFixed(2)}</TableCell>
                                            </TableRow>
                                         );
                                      })}
                                   </TableBody>
                                </Table>
                             </div>
                          )}
                          
                          <div className="flex justify-end mt-4 gap-6">
                             <div className="text-sm">
                                <span className="text-muted-foreground mr-2">Total Profit:</span>
                                <span className="font-mono font-bold">
                                   £{sales.reduce((acc, s) => {
                                      const costItem = costs.find(c => c.serviceName === s.service);
                                      return acc + (s.revenue - ((costItem?.costPrice || 0) * s.quantity));
                                   }, 0).toFixed(2)}
                                </span>
                             </div>
                             <div className="text-sm">
                                <span className="text-muted-foreground mr-2">Calculated Bonus (10%):</span>
                                <span className="font-mono font-bold text-primary">£{calculatePrivateBonus(p.id).toFixed(2)}</span>
                             </div>
                          </div>
                       </Card>
                    );
                 })}
              </div>
           </TabsContent>

           <TabsContent value="costs">
              <Card className="p-6 rounded-2xl border bg-card/60">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                       <h3 className="font-semibold">Service Costs Master List</h3>
                       <p className="text-sm text-muted-foreground">Manage base costs for private services to calculate profit margins.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast({ title: "Saved", description: "Cost updates saved." })}>
                       Save Changes
                    </Button>
                 </div>

                 <Table>
                    <TableHeader>
                       <TableRow>
                          <TableHead>Service Name</TableHead>
                          <TableHead className="w-[200px]">Cost Price (£)</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {costs.map(cost => (
                          <TableRow key={cost.id}>
                             <TableCell className="font-medium">{cost.serviceName}</TableCell>
                             <TableCell>
                                <Input 
                                   type="number" 
                                   value={cost.costPrice} 
                                   onChange={e => handleCostUpdate(cost.id, e.target.value)}
                                   className="h-9 font-mono"
                                />
                             </TableCell>
                          </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </Card>
           </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
