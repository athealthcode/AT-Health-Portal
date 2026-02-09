import { useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CheckCircle2, ChevronRight, FileCheck, Edit, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/state/auth";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Updated template based on BookKeeping Sheet_Bowland.xlsx (Inferred Structure)
const DEFAULT_TEMPLATE = [
  // EOM - End of Month
  { id: "mys_submission", label: "MYS Submission Completed", group: "EOM Tasks" },
  { id: "mys_check", label: "MYS Claims Checked", group: "EOM Tasks" },
  { id: "eom_prescriptions", label: "End of Month Prescriptions Sorted", group: "EOM Tasks" },
  
  // Weekly Tasks
  { id: "controlled_drug_check", label: "Controlled Drug Balance Check", group: "Weekly Tasks" },
  { id: "date_checking", label: "Date Checking", group: "Weekly Tasks" },
  
  // Daily Logs / In House
  { id: "cleaning_log", label: "Dispensary Cleaning Log", group: "Daily Logs" },
  { id: "fridge_temp", label: "Fridge Temperature Log", group: "Daily Logs" },
  { id: "responsible_pharmacist", label: "Responsible Pharmacist Log", group: "Daily Logs" },
  
  // Invoices
  { id: "inv_phoenix", label: "Phoenix Invoices", group: "Invoices Uploaded" },
  { id: "inv_aah", label: "AAH Invoices", group: "Invoices Uploaded" },
  { id: "inv_alliance", label: "Alliance Invoices", group: "Invoices Uploaded" },
  { id: "inv_sigma", label: "Sigma Invoices", group: "Invoices Uploaded" },
  { id: "inv_cavendish", label: "Cavendish Invoices", group: "Invoices Uploaded" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

type ChecklistEntry = {
  itemId: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: number;
  note?: string;
};

type TemplateItem = {
  id: string;
  label: string;
  group: string;
};

export default function Bookkeeping() {
  const { session } = useAuth();
  const { toast } = useToast();
  
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  
  // Mock Template State (In-memory) - Head Office can edit this
  const [template, setTemplate] = useState<TemplateItem[]>(DEFAULT_TEMPLATE);
  const [checklistData, setChecklistData] = useState<Record<string, ChecklistEntry>>({});

  // Template Editor State
  const [editMode, setEditMode] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemGroup, setNewItemGroup] = useState("General");

  const isHeadOffice = session.scope.type === "headoffice";

  const toggleItem = (itemId: string) => {
    if (editMode) return;
    const key = `${year}-${selectedMonth}-${itemId}`;
    setChecklistData(prev => {
      const current = prev[key];
      if (current?.completed) {
        const next = { ...prev };
        delete next[key];
        return next;
      } else {
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
    if (editMode) return;
    const key = `${year}-${selectedMonth}-${itemId}`;
    setChecklistData(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { itemId, completed: false, completedBy: session.staff?.name }),
        note
      }
    }));
  };

  // Add Item to Template
  const addTemplateItem = () => {
     if (!newItemLabel) return;
     setTemplate(prev => [...prev, {
        id: `custom_${Date.now()}`,
        label: newItemLabel,
        group: newItemGroup
     }]);
     setNewItemLabel("");
     toast({ title: "Item Added", description: "Template updated for all branches." });
  };

  // Remove Item from Template
  const removeTemplateItem = (id: string) => {
     setTemplate(prev => prev.filter(i => i.id !== id));
  };

  const groupedItems = useMemo(() => {
    const groups: Record<string, TemplateItem[]> = {};
    template.forEach(item => {
      groups[item.group] ||= [];
      groups[item.group].push(item);
    });
    return groups;
  }, [template]);

  const progress = useMemo(() => {
    const monthPrefix = `${year}-${selectedMonth}`;
    const completedCount = template.filter(i => checklistData[`${monthPrefix}-${i.id}`]?.completed).length;
    return Math.round((completedCount / template.length) * 100);
  }, [checklistData, year, selectedMonth, template]);

  return (
    <AppShell>
      <div className="flex flex-col gap-5 h-[calc(100vh-140px)]">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-serif text-2xl tracking-tight">Bookkeeping Checklist</div>
            <div className="text-sm text-muted-foreground">
              Monthly compliance and task tracking.
            </div>
          </div>
          
          {isHeadOffice && (
             <Button variant={editMode ? "secondary" : "outline"} onClick={() => setEditMode(!editMode)}>
                <Edit className="h-4 w-4 mr-2" />
                {editMode ? "Done Editing" : "Edit Template"}
             </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-[250px_1fr] gap-6 h-full overflow-hidden">
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
          <Card className="rounded-2xl border bg-card/60 flex flex-col h-full overflow-hidden">
             <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <FileCheck className="h-5 w-5" />
                   </div>
                   <div>
                      <div className="font-semibold text-lg">{selectedMonth} {year}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                         <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                         </div>
                         <span className="font-medium">{progress}%</span>
                      </div>
                   </div>
                </div>
                
                {editMode && (
                   <Dialog>
                      <DialogTrigger asChild>
                         <Button size="sm"><Plus className="h-4 w-4 mr-2" /> Add Item</Button>
                      </DialogTrigger>
                      <DialogContent>
                         <DialogHeader><DialogTitle>Add Template Item</DialogTitle></DialogHeader>
                         <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                               <Label>Item Name</Label>
                               <Input value={newItemLabel} onChange={e => setNewItemLabel(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                               <Label>Group</Label>
                               <Select value={newItemGroup} onValueChange={setNewItemGroup}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                     <SelectItem value="EOM Tasks">EOM Tasks</SelectItem>
                                     <SelectItem value="Weekly Tasks">Weekly Tasks</SelectItem>
                                     <SelectItem value="Daily Logs">Daily Logs</SelectItem>
                                     <SelectItem value="Invoices Uploaded">Invoices Uploaded</SelectItem>
                                     <SelectItem value="General">General</SelectItem>
                                  </SelectContent>
                               </Select>
                            </div>
                         </div>
                         <DialogFooter><Button onClick={addTemplateItem}>Add</Button></DialogFooter>
                      </DialogContent>
                   </Dialog>
                )}
             </div>
             
             <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                   {Object.entries(groupedItems).map(([group, items]) => (
                      <div key={group} className="space-y-3">
                         <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b pb-2">
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
                                     className={`group rounded-xl border p-4 transition-all ${isChecked ? "bg-primary/5 border-primary/20" : "bg-background/40 hover:border-primary/20"}`}
                                  >
                                     <div className="flex items-start gap-3">
                                        {!editMode && (
                                           <Checkbox 
                                              id={item.id} 
                                              checked={isChecked}
                                              onCheckedChange={() => toggleItem(item.id)}
                                              className="mt-1"
                                           />
                                        )}
                                        
                                        <div className="flex-1 space-y-2 min-w-0">
                                           <div className="flex items-start justify-between">
                                              <Label htmlFor={item.id} className="text-base font-medium cursor-pointer leading-tight break-words">
                                                 {item.label}
                                              </Label>
                                              
                                              <div className="flex items-center gap-2 shrink-0">
                                                 {isChecked && !editMode && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-background/50 whitespace-nowrap">
                                                       <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                                                       {entry.completedBy} • {format(entry.completedAt!, "d MMM")}
                                                    </Badge>
                                                 )}
                                                 
                                                 {editMode && (
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => removeTemplateItem(item.id)}>
                                                       <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                 )}
                                              </div>
                                           </div>
                                           
                                           {!editMode && (
                                              <div className="relative">
                                                 <Textarea 
                                                    placeholder="Add optional note..." 
                                                    className="min-h-[40px] h-[40px] py-2 text-xs resize-none bg-transparent border-transparent hover:border-input focus:border-input focus:bg-background transition-all"
                                                    value={entry?.note || ""}
                                                    onChange={e => updateNote(item.id, e.target.value)}
                                                 />
                                              </div>
                                           )}
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
