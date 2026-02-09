import { useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CheckCircle2, ChevronRight, FileCheck } from "lucide-react";
import { useAuth } from "@/state/auth";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

// Mock Checklist Template
const CHECKLIST_TEMPLATE = [
  { id: "mys_submission", label: "MYS Submission Completed", group: "MYS" },
  { id: "mys_check", label: "MYS Claims Checked", group: "MYS" },
  { id: "inhouse_cleaning", label: "Dispensary Cleaning Log", group: "In House" },
  { id: "inhouse_fridge", label: "Fridge Temperature Log", group: "In House" },
  { id: "inhouse_date_checking", label: "Date Checking Completed", group: "In House" },
  { id: "inv_phoenix", label: "Phoenix Invoices Uploaded", group: "Invoices" },
  { id: "inv_aah", label: "AAH Invoices Uploaded", group: "Invoices" },
  { id: "inv_alliance", label: "Alliance Invoices Uploaded", group: "Invoices" },
  { id: "inv_sigma", label: "Sigma Invoices Uploaded", group: "Invoices" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

type ChecklistEntry = {
  itemId: string;
  completed: boolean;
  completedBy?: string; // Staff Name
  completedAt?: number;
  note?: string;
};

export default function Bookkeeping() {
  const { session } = useAuth();
  const { toast } = useToast();
  
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  
  // Mock Store for Checklist Data (In-memory)
  const [checklistData, setChecklistData] = useState<Record<string, ChecklistEntry>>({});

  const toggleItem = (itemId: string) => {
    const key = `${year}-${selectedMonth}-${itemId}`;
    setChecklistData(prev => {
      const current = prev[key];
      if (current?.completed) {
        // Uncheck
        const next = { ...prev };
        delete next[key];
        return next;
      } else {
        // Check
        return {
          ...prev,
          [key]: {
            itemId,
            completed: true,
            completedBy: session.staff?.name || "Unknown Staff",
            completedAt: Date.now(),
            note: ""
          }
        };
      }
    });
  };

  const updateNote = (itemId: string, note: string) => {
    const key = `${year}-${selectedMonth}-${itemId}`;
    setChecklistData(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { itemId, completed: false, completedBy: session.staff?.name }),
        note
      }
    }));
  };

  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof CHECKLIST_TEMPLATE> = {};
    CHECKLIST_TEMPLATE.forEach(item => {
      groups[item.group] ||= [];
      groups[item.group].push(item);
    });
    return groups;
  }, []);

  const progress = useMemo(() => {
    const monthPrefix = `${year}-${selectedMonth}`;
    const completedCount = CHECKLIST_TEMPLATE.filter(i => checklistData[`${monthPrefix}-${i.id}`]?.completed).length;
    return Math.round((completedCount / CHECKLIST_TEMPLATE.length) * 100);
  }, [checklistData, year, selectedMonth]);

  return (
    <AppShell>
      <div className="flex flex-col gap-5 h-[calc(100vh-140px)]">
        <div>
          <div className="font-serif text-2xl tracking-tight">Bookkeeping Checklist</div>
          <div className="text-sm text-muted-foreground">
            Monthly compliance and task tracking for {session.scope.type === "pharmacy" ? session.scope.pharmacyName : "Head Office View"}.
          </div>
        </div>

        <div className="grid lg:grid-cols-[250px_1fr] gap-6 h-full">
          {/* Sidebar / Navigation */}
          <Card className="rounded-2xl border bg-card/60 flex flex-col h-full overflow-hidden">
             <div className="p-4 border-b">
                <Select value={year} onValueChange={setYear}>
                   <SelectTrigger>
                      <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2025">2025</SelectItem>
                   </SelectContent>
                </Select>
             </div>
             <ScrollArea className="flex-1">
                <div className="p-2 grid gap-1">
                   {MONTHS.map(month => (
                      <Button
                         key={month}
                         variant={selectedMonth === month ? "secondary" : "ghost"}
                         className={`justify-between w-full font-normal ${selectedMonth === month ? "bg-primary/10 text-primary hover:bg-primary/15" : ""}`}
                         onClick={() => setSelectedMonth(month)}
                      >
                         {month}
                         {selectedMonth === month && <ChevronRight className="h-4 w-4 opacity-50" />}
                      </Button>
                   ))}
                </div>
             </ScrollArea>
          </Card>

          {/* Checklist Content */}
          <Card className="rounded-2xl border bg-card/60 p-6 flex flex-col h-full overflow-hidden">
             <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <FileCheck className="h-5 w-5" />
                   </div>
                   <div>
                      <div className="font-semibold text-lg">{selectedMonth} {year}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                         <span>Overall Progress:</span>
                         <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                         </div>
                         <span className="font-medium">{progress}%</span>
                      </div>
                   </div>
                </div>
             </div>
             
             <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-6 pb-6">
                   {Object.entries(groupedItems).map(([group, items]) => (
                      <div key={group} className="space-y-3">
                         <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-card/95 backdrop-blur py-2 z-10 border-b">
                            {group}
                         </div>
                         <div className="grid gap-3">
                            {items.map(item => {
                               const key = `${year}-${selectedMonth}-${item.id}`;
                               const entry = checklistData[key];
                               const isChecked = !!entry?.completed;

                               return (
                                  <div 
                                     key={item.id} 
                                     className={`group rounded-xl border p-4 transition-all hover:border-primary/20 ${isChecked ? "bg-primary/5 border-primary/20" : "bg-background/40"}`}
                                  >
                                     <div className="flex items-start gap-3">
                                        <Checkbox 
                                           id={item.id} 
                                           checked={isChecked}
                                           onCheckedChange={() => toggleItem(item.id)}
                                           className="mt-1"
                                        />
                                        <div className="flex-1 space-y-2">
                                           <div className="flex items-start justify-between">
                                              <Label htmlFor={item.id} className="text-base font-medium cursor-pointer leading-tight">
                                                 {item.label}
                                              </Label>
                                              {isChecked && (
                                                 <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-background/50">
                                                    <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                                                    {entry.completedBy} • {format(entry.completedAt!, "d MMM")}
                                                 </Badge>
                                              )}
                                           </div>
                                           
                                           <div className="relative">
                                              <Textarea 
                                                 placeholder="Add optional note..." 
                                                 className="min-h-[40px] h-[40px] py-2 text-xs resize-none bg-transparent border-transparent hover:border-input focus:border-input focus:bg-background transition-all"
                                                 value={entry?.note || ""}
                                                 onChange={e => updateNote(item.id, e.target.value)}
                                              />
                                           </div>
                                        </div>
                                     </div>
                                  </div>
                               );
                            })}
                         </div>
                      </div>
                   ))}
                </div>
             </ScrollArea>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
