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
import { AlertCircle, CheckCircle2, Lock, Unlock, Upload, FileSpreadsheet, TrendingUp, Download, ShieldCheck, FileText, ArrowRight, Save, History, Users } from "lucide-react";
import { format, getDaysInMonth, isWeekend } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";

type BonusStatus = "draft" | "approved" | "locked" | "not_completed";
type PharmacyId = "bowland" | "denton" | "wilmslow";

type CostItem = {
  id: string;
  serviceName: string;
  costPrice: number;
};

type PrivateExpense = {
  id: string;
  description: string;
  amount: number;
};

type MonthlyState = {
  status: BonusStatus;
  reason?: string;
  gates: Record<PharmacyId, { id: string; label: string; passed: boolean }[]>;
  privateSales: Record<PharmacyId, { service: string; quantity: number; revenue: number; category?: string }[]>;
  nhsPerformance: Record<PharmacyId, { items: number; nms: number; targetItems: number; targetNms: number; nominationsGrowth: number }>;
  expenses: Record<PharmacyId, { workingDays: number; googleAds: number; advertising: number; customExpenses: PrivateExpense[] }>;
  serviceCosts: CostItem[]; // Historic snapshot of costs for this month
  transactionLog: { user: string; action: string; timestamp: number }[];
};

const MASTER_COSTS: CostItem[] = [
  { id: "mc1", serviceName: "Ear Wax Removal (1 ear)", costPrice: 0.00 },
  { id: "mc2", serviceName: "Ear Wax Removal (2 ears)", costPrice: 0.00 },
  { id: "mc3", serviceName: "Chickenpox (Course)", costPrice: 65.00 },
  { id: "mc4", serviceName: "Chickenpox (Single)", costPrice: 32.50 },
  { id: "mc5", serviceName: "Weight Loss (Mounjaro 2.5mg)", costPrice: 125.00 },
  { id: "mc6", serviceName: "Weight Loss (Mounjaro 5mg)", costPrice: 125.00 },
  { id: "mc7", serviceName: "Weight Loss (Mounjaro 7.5mg)", costPrice: 135.00 },
  { id: "mc8", serviceName: "Travel - Typhoid", costPrice: 18.00 },
  { id: "mc9", serviceName: "Travel - Hep A", costPrice: 22.00 },
  { id: "mc10", serviceName: "Travel - Yellow Fever", costPrice: 45.00 },
  { id: "mc11", serviceName: "B12 Injection", costPrice: 15.00 },
  { id: "mc12", serviceName: "HPV Vaccine", costPrice: 120.00 },
  { id: "mc13", serviceName: "Private Flu", costPrice: 8.50 },
  { id: "mc14", serviceName: "UTI Treatment", costPrice: 12.00 },
  { id: "mc15", serviceName: "Period Delay", costPrice: 10.00 },
  { id: "mc16", serviceName: "Erectile Dysfunction (Sildenafil)", costPrice: 5.00 },
];

const DEFAULT_GATES = [
  { id: "mys", label: "MYS Submitted on Time (by 5th)", passed: false },
  { id: "staff_budget", label: "Staff Hours within Budget", passed: false },
  { id: "incidents", label: "No Critical Safety Incidents", passed: true },
  { id: "nominations", label: "Net Positive Nominations Growth", passed: false }, // New Gate
];

const DEFAULT_EXPENSES = { workingDays: 22, googleAds: 0, advertising: 0, customExpenses: [] };

const PHARMACIES: { id: PharmacyId; name: string }[] = [
  { id: "bowland", name: "Bowland Pharmacy" },
  { id: "denton", name: "Denton Pharmacy" },
  { id: "wilmslow", name: "Wilmslow Pharmacy" },
];

// Helper to calc working days
function getWorkingDays(yearMonth: string) {
   const [y, m] = yearMonth.split('-').map(Number);
   const daysInMonth = getDaysInMonth(new Date(y, m - 1));
   let workingDays = 0;
   for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(y, m - 1, i);
      // Assuming Mon-Fri for default, could add Saturdays based on location settings later
      if (!isWeekend(d)) workingDays++;
   }
   return workingDays;
}

export default function BonusPerformance() {
  const { session } = useAuth();
  const { toast } = useToast();
  
  const [selectedMonth, setSelectedMonth] = useState("2026-03");
  const [activeTab, setActiveTab] = useState("overview");

  // Mock global storage for historic data
  const [monthlyData, setMonthlyData] = useState<Record<string, MonthlyState>>({
     "2026-02": {
        status: "locked",
        gates: {
           bowland: [{ id: "mys", label: "MYS Submitted on Time", passed: true }, { id: "staff_budget", label: "Staff Hours within Budget", passed: true }, { id: "incidents", label: "No Critical Safety Incidents", passed: true }, { id: "nominations", label: "Net Positive Nominations", passed: true }],
           denton: [{ id: "mys", label: "MYS Submitted on Time", passed: true }, { id: "staff_budget", label: "Staff Hours within Budget", passed: false }, { id: "incidents", label: "No Critical Safety Incidents", passed: true }, { id: "nominations", label: "Net Positive Nominations", passed: true }],
           wilmslow: [{ id: "mys", label: "MYS Submitted on Time", passed: true }, { id: "staff_budget", label: "Staff Hours within Budget", passed: true }, { id: "incidents", label: "No Critical Safety Incidents", passed: true }, { id: "nominations", label: "Net Positive Nominations", passed: false }],
        },
        privateSales: { bowland: [], denton: [], wilmslow: [] },
        nhsPerformance: {
           bowland: { items: 8930, nms: 54, targetItems: 8800, targetNms: 50, nominationsGrowth: 38 }, 
           denton: { items: 8300, nms: 45, targetItems: 8500, targetNms: 45, nominationsGrowth: 15 },
           wilmslow: { items: 7100, nms: 30, targetItems: 7000, targetNms: 30, nominationsGrowth: -5 },
        },
        expenses: {
           bowland: { workingDays: 20, googleAds: 100, advertising: 50, customExpenses: [] },
           denton: { workingDays: 20, googleAds: 50, advertising: 0, customExpenses: [] },
           wilmslow: { workingDays: 20, googleAds: 150, advertising: 0, customExpenses: [] },
        },
        serviceCosts: [...MASTER_COSTS],
        transactionLog: [{ user: "ahmed@at-health.co.uk", action: "Month Locked", timestamp: Date.now() - 864000000 }]
     }
  });

  // Ensure current month exists or initialize it
  const currentData = useMemo(() => {
     if (monthlyData[selectedMonth]) return monthlyData[selectedMonth];
     
     // Initialize new month by copying previous month's costs, or master if none
     const prevMonthStr = format(new Date(new Date(selectedMonth).setMonth(new Date(selectedMonth).getMonth() - 1)), "yyyy-MM");
     const inheritedCosts = monthlyData[prevMonthStr]?.serviceCosts || [...MASTER_COSTS];
     const calcDays = getWorkingDays(selectedMonth);

     return {
        status: "draft" as BonusStatus,
        gates: { bowland: [...DEFAULT_GATES], denton: [...DEFAULT_GATES], wilmslow: [...DEFAULT_GATES] },
        privateSales: { bowland: [], denton: [], wilmslow: [] },
        nhsPerformance: { 
           bowland: { items: 0, nms: 0, targetItems: 8800, targetNms: 50, nominationsGrowth: 0 }, 
           denton: { items: 0, nms: 0, targetItems: 8500, targetNms: 45, nominationsGrowth: 0 }, 
           wilmslow: { items: 0, nms: 0, targetItems: 7000, targetNms: 30, nominationsGrowth: 0 } 
        },
        expenses: { 
           bowland: { workingDays: calcDays, googleAds: 0, advertising: 0, customExpenses: [] }, 
           denton: { workingDays: calcDays, googleAds: 0, advertising: 0, customExpenses: [] }, 
           wilmslow: { workingDays: calcDays, googleAds: 0, advertising: 0, customExpenses: [] } 
        },
        serviceCosts: inheritedCosts,
        transactionLog: [{ user: "System", action: "Month Initialized", timestamp: Date.now() }]
     };
  }, [monthlyData, selectedMonth]);

  const isLocked = currentData.status === "locked";
  const isHeadOffice = session.scope.type === "headoffice";
  
  // Can edit if Head Office OR if it's draft/approved (not locked)
  const canEdit = isHeadOffice || (!isLocked && currentData.status !== "not_completed");

  const updateMonth = (updater: (prev: MonthlyState) => MonthlyState) => {
     if (!canEdit) return;
     setMonthlyData(prev => ({
        ...prev,
        [selectedMonth]: updater(prev[selectedMonth] || currentData)
     }));
  };

  const [isSaving, setIsSaving] = useState(false);

  // Load saved state from DB when month changes
  useEffect(() => {
    fetch(`/api/bonus-months?month=${selectedMonth}`)
      .then((r: Response) => r.json())
      .then((rows: any[]) => {
        if (!Array.isArray(rows)) return;
        const row = rows.find((r: any) => r.month === selectedMonth && r.state_data);
        if (row?.state_data) {
          setMonthlyData(prev => ({ ...prev, [selectedMonth]: row.state_data as MonthlyState }));
        }
      })
      .catch(() => {});
  }, [selectedMonth]);

  const handleSaveToDb = async () => {
    setIsSaving(true);
    try {
      const existing = await fetch(`/api/bonus-months?month=${selectedMonth}`)
        .then((r: Response) => r.json())
        .then((rows: any[]) => Array.isArray(rows) ? rows.find((r: any) => r.month === selectedMonth) : null)
        .catch(() => null);
      const payload = {
        month: selectedMonth,
        status: currentData.status,
        state_data: currentData,
      };
      if (existing?.id) {
        await fetch(`/api/bonus-months/${existing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/bonus-months', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
    } catch (_) { /* silent */ } finally {
      setIsSaving(false);
    }
  };

  const handleGateToggle = (pharmacyId: PharmacyId, gateId: string) => {
     updateMonth(m => {
        const pGates = m.gates[pharmacyId].map(g => g.id === gateId ? { ...g, passed: !g.passed } : g);
        return { ...m, gates: { ...m.gates, [pharmacyId]: pGates } };
     });
  };

  const handleExpenseChange = (pharmacyId: PharmacyId, field: keyof typeof DEFAULT_EXPENSES, value: string) => {
     updateMonth(m => ({
        ...m,
        expenses: {
           ...m.expenses,
           [pharmacyId]: { ...m.expenses[pharmacyId], [field]: parseFloat(value) || 0 }
        }
     }));
  };

  const addCustomExpense = (pharmacyId: PharmacyId, description: string, amount: string) => {
     if (!description || !amount) return;
     updateMonth(m => ({
        ...m,
        expenses: {
           ...m.expenses,
           [pharmacyId]: {
              ...m.expenses[pharmacyId],
              customExpenses: [...m.expenses[pharmacyId].customExpenses, { id: `exp_${Date.now()}`, description, amount: parseFloat(amount) }]
           }
        }
     }));
  };

  const removeCustomExpense = (pharmacyId: PharmacyId, id: string) => {
     updateMonth(m => ({
        ...m,
        expenses: {
           ...m.expenses,
           [pharmacyId]: {
              ...m.expenses[pharmacyId],
              customExpenses: m.expenses[pharmacyId].customExpenses.filter(e => e.id !== id)
           }
        }
     }));
  };

  const handleCostUpdate = (id: string, val: string) => {
     if (!isHeadOffice) return;
     updateMonth(m => ({
        ...m,
        serviceCosts: m.serviceCosts.map(c => c.id === id ? { ...c, costPrice: parseFloat(val) || 0 } : c)
     }));
  };

  const getUnmappedServices = () => {
     const unmapped: string[] = [];
     PHARMACIES.forEach(p => {
        const sales = currentData.privateSales[p.id] || [];
        sales.forEach(sale => {
           if (!currentData.serviceCosts.find(c => c.serviceName === sale.service)) {
              if (!unmapped.includes(sale.service)) unmapped.push(sale.service);
           }
        });
     });
     return unmapped;
  };

  const handleLockStatus = () => {
     if (isLocked) {
        // Unlock
        if (!isHeadOffice) return;
        updateMonth(m => ({
           ...m, 
           status: "approved",
           transactionLog: [...m.transactionLog, { user: session.userEmail || "Admin", action: "Unlocked Month", timestamp: Date.now() }]
        }));
        toast({ title: "Unlocked", description: "Month is now editable." });
     } else {
        // Lock
        const unmapped = getUnmappedServices();
        if (unmapped.length > 0) {
           toast({ title: "Cannot Lock", description: `Unmapped services found: ${unmapped.join(", ")}.`, variant: "destructive" });
           setActiveTab("costs");
           return;
        }

        updateMonth(m => ({
           ...m, 
           status: "locked",
           transactionLog: [...m.transactionLog, { user: session.userEmail || "Admin", action: "Saved & Locked Month", timestamp: Date.now() }]
        }));
        toast({ title: "Saved & Locked", description: "Data preserved and locked." });
     }
  };

  const handleMarkNotCompleted = () => {
     if (!isHeadOffice) return;
     updateMonth(m => ({
        ...m, 
        status: "not_completed",
        reason: "Manager Override",
        transactionLog: [...m.transactionLog, { user: session.userEmail || "Admin", action: "Marked Not Completed", timestamp: Date.now() }]
     }));
     toast({ title: "Updated", description: "Month marked as not completed." });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, pharmacyId: PharmacyId) => {
     const file = e.target.files?.[0];
     if (!file) return;

     // Simulate CSV Parsing & Categorization
     const reader = new FileReader();
     reader.onload = (event) => {
        const mockParsed = [
           { service: "Chickenpox (Course)", quantity: 5, revenue: 325.00, category: "Vaccines" },
           { service: "Weight Loss (Mounjaro 2.5mg)", quantity: 12, revenue: 2160.00, category: "Weight Loss" },
           { service: "Ear Wax Removal (2 ears)", quantity: 8, revenue: 480.00, category: "Clinical" },
           { service: "B12 Injection", quantity: 15, revenue: 450.00, category: "Clinical" },
        ];
        
        updateMonth(m => ({
           ...m,
           privateSales: { ...m.privateSales, [pharmacyId]: mockParsed },
           transactionLog: [...m.transactionLog, { user: session.staff?.name || "Staff", action: `Uploaded CSV for ${pharmacyId}`, timestamp: Date.now() }]
        }));
        toast({ title: "Sales Uploaded", description: `Extracted ${mockParsed.length} records.` });
     };
     reader.readAsText(file);
  };

  // CALCULATIONS
  const PRIVATE_BONUS_RATE = 0.20; // 20%
  
  const calcPrivateStats = (pharmacyId: PharmacyId) => {
     const sales = currentData.privateSales[pharmacyId] || [];
     const exp = currentData.expenses[pharmacyId];
     
     let grossRevenue = 0;
     let totalCostOfGoods = 0;
     
     sales.forEach(sale => {
        const costItem = currentData.serviceCosts.find(c => c.serviceName === sale.service);
        const unitCost = costItem ? costItem.costPrice : 0;
        grossRevenue += sale.revenue;
        totalCostOfGoods += (unitCost * sale.quantity);
     });

     const customTotal = exp.customExpenses.reduce((a, e) => a + e.amount, 0);
     const totalExpenses = exp.googleAds + exp.advertising + customTotal;
     const netProfit = grossRevenue - totalCostOfGoods - totalExpenses;

     let bonus = 0;
     if (netProfit >= 500) bonus = netProfit * PRIVATE_BONUS_RATE;

     return { grossRevenue, totalCostOfGoods, totalExpenses, netProfit, bonus, customTotal };
  };

  const calculateNHSBonus = (pharmacyId: PharmacyId) => {
     // Nominations gate is automated based on nhsPerformance
     const perf = currentData.nhsPerformance[pharmacyId];
     const nomGatePassed = perf.nominationsGrowth > 0;
     
     const gatesPassed = currentData.gates[pharmacyId].every(g => {
        if (g.id === "nominations") return nomGatePassed;
        return g.passed;
     });
     
     if (!gatesPassed) return 0;
     if (!perf) return 0;

     let bonus = 500;
     if (perf.items >= perf.targetItems) bonus += 100;
     if (perf.nms >= perf.targetNms) bonus += 100;
     return bonus;
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
           <div>
              <div className="font-serif text-2xl tracking-tight">Bonus & Performance</div>
              <div className="text-sm text-muted-foreground">
                 Monthly performance tracking with historic preservation and mandatory gates.
              </div>
           </div>
           <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-card border rounded-lg p-1 shadow-sm">
                 <Button variant="ghost" size="sm" className="h-8" onClick={() => {
                    const d = new Date(selectedMonth); d.setMonth(d.getMonth() - 1); setSelectedMonth(format(d, "yyyy-MM"));
                 }}>←</Button>
                 <span className="font-mono font-medium text-sm w-24 text-center">{selectedMonth}</span>
                 <Button variant="ghost" size="sm" className="h-8" onClick={() => {
                     const d = new Date(selectedMonth); d.setMonth(d.getMonth() + 1); setSelectedMonth(format(d, "yyyy-MM"));
                 }}>→</Button>
              </div>
              
              {isHeadOffice && currentData.status !== "not_completed" && (
                 <Button variant="outline" className="h-10 text-amber-600 hover:bg-amber-50" onClick={handleMarkNotCompleted}>
                    Mark Not Completed
                 </Button>
              )}

              {canEdit ? (
                 <Button className="h-10 bg-emerald-600 hover:bg-emerald-700" onClick={handleLockStatus}>
                    <Save className="h-4 w-4 mr-2" /> Save & Lock Month
                 </Button>
              ) : (
                 isHeadOffice && isLocked && (
                    <Button variant="outline" className="h-10" onClick={handleLockStatus}>
                       <Unlock className="h-4 w-4 mr-2" /> Unlock for Edit
                    </Button>
                 )
              )}


               <Button
                  className="h-10 bg-blue-600 hover:bg-blue-700"
                  onClick={handleSaveToDb}
                  disabled={isSaving}
               >
                  {isSaving ? 'Saving...' : '💾 Save to Database'}
               </Button>           </div>
        </div>

        {currentData.status === "not_completed" ? (
           <Card className="p-12 text-center border-dashed bg-muted/30">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="font-semibold text-xl">Month Not Completed</h3>
              <p className="text-muted-foreground mt-2">This month was explicitly marked as not completed by management.</p>
              {isHeadOffice && (
                 <Button variant="outline" className="mt-6" onClick={() => updateMonth(m => ({ ...m, status: "draft" }))}>
                    Restore Month
                 </Button>
              )}
           </Card>
        ) : (
           <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4 w-full justify-start">
                 <TabsTrigger value="overview">Overview & Breakdown</TabsTrigger>
                 <TabsTrigger value="nhs">NHS Bonus</TabsTrigger>
                 <TabsTrigger value="private">Private Bonus</TabsTrigger>
                 <TabsTrigger value="costs">Monthly Service Costs</TabsTrigger>
                 <TabsTrigger value="audit">Transaction Log</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                 <div className="grid gap-6 md:grid-cols-3">
                    {PHARMACIES.map(p => {
                       const nhs = calculateNHSBonus(p.id);
                       const pStats = calcPrivateStats(p.id);
                       const total = nhs + pStats.bonus;
                       
                       const nomGatePassed = currentData.nhsPerformance[p.id].nominationsGrowth > 0;
                       const gatesPassed = currentData.gates[p.id].every(g => g.id === "nominations" ? nomGatePassed : g.passed);

                       return (
                          <Card key={p.id} className="p-5 rounded-2xl border bg-card/60 flex flex-col shadow-sm">
                             <div className="flex justify-between items-start mb-4">
                                <div className="font-semibold text-lg">{p.name}</div>
                                {gatesPassed ? 
                                   <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Gates Passed</Badge> :
                                   <Badge variant="destructive">Gates Failed</Badge>
                                }
                             </div>
                             
                             <div className="space-y-4 flex-1">
                                <div className="space-y-1">
                                   <div className="flex justify-between text-sm font-medium">
                                      <span>NHS Bonus</span>
                                      <span className="font-mono">£{nhs.toFixed(2)}</span>
                                   </div>
                                   <div className="text-[10px] text-muted-foreground ml-2">Base + Item/NMS Targets</div>
                                </div>
                                
                                <Separator />
                                
                                <div className="space-y-1">
                                   <div className="flex justify-between text-sm font-medium">
                                      <span>Private Bonus (20%)</span>
                                      <span className="font-mono">£{pStats.bonus.toFixed(2)}</span>
                                   </div>
                                   <div className="flex justify-between text-[10px] text-muted-foreground ml-2">
                                      <span>Gross Rev: £{pStats.grossRevenue.toFixed(2)}</span>
                                      <span>Net: £{pStats.netProfit.toFixed(2)}</span>
                                   </div>
                                </div>

                                <Separator />
                                <div className="flex justify-between font-bold items-center pt-2">
                                   <span>Total Payable</span>
                                   <span className="font-mono text-xl text-primary">£{total.toFixed(2)}</span>
                                </div>
                             </div>
                          </Card>
                       );
                    })}
                 </div>
              </TabsContent>

              <TabsContent value="nhs">
                 <div className="grid gap-6 lg:grid-cols-2">
                    {PHARMACIES.map(p => {
                       const perf = currentData.nhsPerformance[p.id];
                       return (
                       <Card key={p.id} className="p-6 rounded-2xl border bg-card/60 shadow-sm">
                          <div className="flex justify-between items-center mb-4">
                             <div className="font-semibold">{p.name}</div>
                             <div className="text-xs text-muted-foreground">Month Targets</div>
                          </div>
                          
                          <div className="space-y-4">
                             <div className="bg-background/50 rounded-xl p-4 border shadow-sm">
                                <div className="text-xs font-semibold uppercase text-muted-foreground mb-3">Mandatory Gates</div>
                                <div className="space-y-2">
                                   {currentData.gates[p.id].map(gate => {
                                      // Nominations is automated
                                      if (gate.id === "nominations") {
                                         const passed = perf.nominationsGrowth > 0;
                                         return (
                                            <div key={gate.id} className="flex items-center space-x-2 opacity-80">
                                               <Checkbox checked={passed} disabled />
                                               <Label className={`text-sm ${passed ? 'text-foreground' : 'text-destructive font-medium'}`}>
                                                  {gate.label} (Growth: {perf.nominationsGrowth}) [Auto]
                                               </Label>
                                            </div>
                                         )
                                      }
                                      
                                      return (
                                      <div key={gate.id} className="flex items-center space-x-2">
                                         <Checkbox 
                                            id={`${p.id}-${gate.id}`} checked={gate.passed} 
                                            onCheckedChange={() => handleGateToggle(p.id, gate.id)} disabled={!canEdit}
                                         />
                                         <Label htmlFor={`${p.id}-${gate.id}`} className={`text-sm ${gate.passed ? 'text-foreground' : 'text-destructive font-medium'}`}>
                                            {gate.label}
                                         </Label>
                                      </div>
                                   )})}
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                   <div className="text-xs text-muted-foreground">Items Dispensed</div>
                                   <div className="flex items-end gap-2">
                                      <div className="text-xl font-mono font-bold">{perf?.items}</div>
                                      <div className="text-xs text-muted-foreground mb-1">/ {perf?.targetItems}</div>
                                   </div>
                                </div>
                                <div className="space-y-1">
                                   <div className="text-xs text-muted-foreground">NMS Completed</div>
                                   <div className="flex items-end gap-2">
                                      <div className="text-xl font-mono font-bold">{perf?.nms}</div>
                                      <div className="text-xs text-muted-foreground mb-1">/ {perf?.targetNms}</div>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </Card>
                    )})}
                 </div>
              </TabsContent>

              <TabsContent value="private">
                 <div className="grid gap-6">
                    {PHARMACIES.map(p => {
                       const sales = currentData.privateSales[p.id] || [];
                       const exp = currentData.expenses[p.id];
                       const stats = calcPrivateStats(p.id);
                       
                       // Group sales by category for extract summary
                       const catSummary = sales.reduce((acc, curr) => {
                          const cat = curr.category || "Uncategorized";
                          acc[cat] = (acc[cat] || 0) + curr.revenue;
                          return acc;
                       }, {} as Record<string, number>);

                       const [newExpDesc, setNewExpDesc] = useState("");
                       const [newExpAmt, setNewExpAmt] = useState("");

                       return (
                          <Card key={p.id} className="p-6 rounded-2xl border bg-card/60 shadow-sm">
                             <div className="flex justify-between items-center mb-4">
                                <div className="font-semibold">{p.name}</div>
                                <div className="flex items-center gap-2">
                                   <Label htmlFor={`upload-${p.id}`} className="cursor-pointer">
                                      <div className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${!canEdit ? 'opacity-50 cursor-not-allowed bg-muted' : 'bg-background hover:bg-primary/5'}`}>
                                         <Upload className="h-3.5 w-3.5" />
                                         {sales.length > 0 ? "Replace CSV" : "Upload Sales CSV"}
                                      </div>
                                   </Label>
                                   <Input id={`upload-${p.id}`} type="file" accept=".csv" className="hidden" disabled={!canEdit} onChange={(e) => handleFileUpload(e, p.id)} />
                                </div>
                             </div>

                             <div className="grid lg:grid-cols-[1fr_300px] gap-6">
                                <div>
                                   {sales.length === 0 ? (
                                      <div className="text-center py-12 text-muted-foreground text-sm border-2 border-dashed rounded-xl h-full flex items-center justify-center bg-background/30">
                                         No sales data uploaded for this month.
                                      </div>
                                   ) : (
                                      <div className="space-y-4">
                                         {/* CSV Extraction Summary */}
                                         <div className="flex gap-2 overflow-x-auto pb-2">
                                            {Object.entries(catSummary).map(([cat, rev]) => (
                                               <Badge key={cat} variant="secondary" className="px-3 py-1 bg-primary/5 border-primary/20 whitespace-nowrap">
                                                  {cat}: £{rev.toFixed(2)}
                                               </Badge>
                                            ))}
                                         </div>
                                         
                                         <div className="overflow-hidden rounded-lg border bg-background/50 max-h-[300px] overflow-y-auto">
                                            <Table>
                                               <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur">
                                                  <TableRow>
                                                     <TableHead>Service</TableHead>
                                                     <TableHead className="text-right">Qty</TableHead>
                                                     <TableHead className="text-right">Revenue</TableHead>
                                                     <TableHead className="text-right">Margin</TableHead>
                                                  </TableRow>
                                               </TableHeader>
                                               <TableBody>
                                                  {sales.map((sale, i) => {
                                                     const costItem = currentData.serviceCosts.find(c => c.serviceName === sale.service);
                                                     const unitCost = costItem ? costItem.costPrice : 0;
                                                     const margin = sale.revenue - (unitCost * sale.quantity);
                                                     return (
                                                        <TableRow key={i}>
                                                           <TableCell className="font-medium text-xs">{sale.service}</TableCell>
                                                           <TableCell className="text-right font-mono text-xs">{sale.quantity}</TableCell>
                                                           <TableCell className="text-right font-mono text-xs">£{sale.revenue.toFixed(2)}</TableCell>
                                                           <TableCell className={`text-right font-mono text-xs font-bold ${margin > 0 ? 'text-emerald-600' : ''}`}>£{margin.toFixed(2)}</TableCell>
                                                        </TableRow>
                                                     );
                                                  })}
                                               </TableBody>
                                            </Table>
                                         </div>
                                      </div>
                                   )}
                                </div>

                                {/* EXPENSES SIDEBAR */}
                                <div className="space-y-4">
                                   <div className="p-4 bg-background/50 rounded-xl border shadow-sm">
                                      <div className="text-xs font-semibold uppercase text-muted-foreground mb-3 flex items-center justify-between">
                                         Monthly Expenses
                                         <span className="text-[10px] font-mono normal-case bg-muted px-1.5 py-0.5 rounded text-foreground">£{stats.totalExpenses.toFixed(2)}</span>
                                      </div>
                                      <div className="space-y-3">
                                         <div className="grid grid-cols-2 gap-2">
                                            <div>
                                               <Label className="text-[10px]">Working Days</Label>
                                               <Input className="h-8 font-mono text-xs" type="number" value={exp.workingDays} onChange={e => handleExpenseChange(p.id, "workingDays", e.target.value)} disabled={!canEdit} />
                                            </div>
                                            <div>
                                               <Label className="text-[10px]">Google Ads (£)</Label>
                                               <Input className="h-8 font-mono text-xs" type="number" value={exp.googleAds} onChange={e => handleExpenseChange(p.id, "googleAds", e.target.value)} disabled={!canEdit} />
                                            </div>
                                         </div>
                                         <div>
                                            <Label className="text-[10px]">Advertising (£)</Label>
                                            <Input className="h-8 font-mono text-xs" type="number" value={exp.advertising} onChange={e => handleExpenseChange(p.id, "advertising", e.target.value)} disabled={!canEdit} />
                                         </div>
                                         
                                         <Separator />
                                         <Label className="text-[10px] font-medium">Specific Expenses</Label>
                                         <div className="space-y-2">
                                            {exp.customExpenses.map(ce => (
                                               <div key={ce.id} className="flex items-center justify-between bg-card border rounded px-2 py-1 text-xs">
                                                  <span className="truncate pr-2">{ce.description}</span>
                                                  <div className="flex items-center gap-2 shrink-0">
                                                     <span className="font-mono">£{ce.amount.toFixed(2)}</span>
                                                     {canEdit && <Button variant="ghost" size="icon" className="h-4 w-4 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeCustomExpense(p.id, ce.id)}><Lock className="h-3 w-3 hidden" /><span className="text-sm">×</span></Button>}
                                                  </div>
                                               </div>
                                            ))}
                                            
                                            {canEdit && (
                                               <div className="flex gap-1 mt-2">
                                                  <Input placeholder="Desc" className="h-7 text-[10px]" value={newExpDesc} onChange={e=>setNewExpDesc(e.target.value)} />
                                                  <Input placeholder="£" className="h-7 w-16 text-[10px] font-mono" value={newExpAmt} onChange={e=>setNewExpAmt(e.target.value)} />
                                                  <Button size="sm" className="h-7 px-2" onClick={() => { addCustomExpense(p.id, newExpDesc, newExpAmt); setNewExpDesc(""); setNewExpAmt(""); }}>+</Button>
                                               </div>
                                            )}
                                         </div>
                                      </div>
                                   </div>

                                   <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-sm">
                                      <div className="flex justify-between mb-1">
                                         <span className="text-muted-foreground">Net Profit</span>
                                         <span className="font-mono font-bold">£{stats.netProfit.toFixed(2)}</span>
                                      </div>
                                      <div className="flex justify-between font-bold text-primary border-t border-primary/10 pt-2 mt-2">
                                         <span>Calculated Bonus</span>
                                         <span className="font-mono">£{stats.bonus.toFixed(2)}</span>
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </Card>
                       );
                    })}
                 </div>
              </TabsContent>

              <TabsContent value="costs">
                 <Card className="p-6 rounded-2xl border bg-card/60 shadow-sm flex flex-col h-[600px]">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                       <div>
                          <h3 className="font-semibold flex items-center gap-2">
                             Service Costs for {selectedMonth}
                             {isLocked && <Badge variant="outline" className="text-[10px]">Read Only Snapshot</Badge>}
                          </h3>
                          <p className="text-sm text-muted-foreground">Historic costs used for this specific month's calculations.</p>
                       </div>
                       <Button variant="outline" size="sm" className="gap-2">
                          <Download className="h-4 w-4" /> Export CSV
                       </Button>
                    </div>

                    <div className="flex-1 overflow-auto rounded-xl border bg-background/50">
                       <Table>
                          <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur z-10">
                             <TableRow>
                                <TableHead>Service Name</TableHead>
                                <TableHead className="w-[200px] text-right">Cost Price (£)</TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             {currentData.serviceCosts.map(cost => (
                                <TableRow key={cost.id}>
                                   <TableCell className="font-medium text-sm">{cost.serviceName}</TableCell>
                                   <TableCell className="text-right">
                                      {isHeadOffice && !isLocked ? (
                                         <Input 
                                            type="number" 
                                            value={cost.costPrice} 
                                            onChange={e => handleCostUpdate(cost.id, e.target.value)}
                                            className="h-8 w-24 ml-auto text-right font-mono text-sm"
                                         />
                                      ) : (
                                         <span className="font-mono text-sm">£{cost.costPrice.toFixed(2)}</span>
                                      )}
                                   </TableCell>
                                </TableRow>
                             ))}
                          </TableBody>
                       </Table>
                    </div>
                 </Card>
              </TabsContent>

              <TabsContent value="audit">
                 <Card className="p-6 rounded-2xl border bg-card/60 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                       <History className="h-5 w-5 text-primary" />
                       <h3 className="font-semibold">Transaction & Audit Log</h3>
                    </div>
                    
                    <div className="space-y-4">
                       {currentData.transactionLog.map((log, i) => (
                          <div key={i} className="flex gap-4 items-start p-3 rounded-xl border bg-background/40">
                             <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                             <div>
                                <div className="text-sm font-medium">{log.action}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                   By <span className="font-medium text-foreground">{log.user}</span> on {format(log.timestamp, "PPP 'at' p")}
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </Card>
              </TabsContent>
           </Tabs>
        )}
      </div>
    </AppShell>
  );
}
