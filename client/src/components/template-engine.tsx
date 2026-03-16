import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical, Save, Eye, Settings, FileText, CheckSquare, Award, Copy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type TemplateType = "daily-figures" | "bookkeeping" | "bonus";

export function TemplateEngine() {
  const { toast } = useToast();
  const [activeTemplateType, setActiveTemplateType] = useState<TemplateType>("daily-figures");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("df_1");
  const [previewMode, setPreviewMode] = useState(false);

  // MOCK DATA for templates
  const [dailyFields, setDailyFields] = useState([
    { id: "df1", label: "NHS Items (Count)", type: "number", required: true },
    { id: "df2", label: "OTC Takings (£)", type: "currency", required: true },
    { id: "df3", label: "Private Clinic Takings (£)", type: "currency", required: false },
    { id: "df4", label: "Flu Vaccines (Count)", type: "number", required: false },
    { id: "df5", label: "Notes / Discrepancies", type: "text", required: false },
  ]);

  const [bookkeepingRows, setBookkeepingRows] = useState([
    { id: "bk1", section: "Essential", label: "MYS Declaration Completed", mandatory: true },
    { id: "bk2", section: "Essential", label: "In House Banking Recon", mandatory: true },
    { id: "bk3", section: "Invoices", label: "AAH Invoices Uploaded", mandatory: false },
    { id: "bk4", section: "Invoices", label: "Alliance Invoices Uploaded", mandatory: false },
  ]);

  const [bonusBands, setBonusBands] = useState([
    { id: "b1", threshold: "4000", rate: "100" },
    { id: "b2", threshold: "5000", rate: "200" },
    { id: "b3", threshold: "6000", rate: "400" },
  ]);

  const handleSave = () => {
    toast({ title: "Template Saved", description: "Changes have been successfully saved and audit logged." });
  };

  const renderDailyFiguresEditor = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
           <h3 className="text-lg font-semibold">Standard Pharmacy Template</h3>
           <p className="text-sm text-muted-foreground">Defines fields for Daily Figures & Cashing Up.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
              {previewMode ? <Settings className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {previewMode ? "Edit Mode" : "Preview"}
           </Button>
           <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-2" /> Save</Button>
        </div>
      </div>

      {previewMode ? (
         <Card className="p-6 bg-muted/20 border-dashed">
            <h4 className="font-semibold mb-4 text-primary border-b pb-2">End-User Preview: Daily Figures</h4>
            <div className="space-y-4 max-w-md">
               {dailyFields.map(f => (
                  <div key={f.id} className="space-y-1">
                     <Label className="flex items-center gap-1">
                        {f.label} {f.required && <span className="text-destructive">*</span>}
                     </Label>
                     <Input type={f.type === 'number' ? 'number' : 'text'} placeholder={f.type === 'currency' ? '£0.00' : ''} />
                  </div>
               ))}
               <Button className="w-full mt-4" disabled>Submit Form</Button>
            </div>
         </Card>
      ) : (
         <div className="space-y-4">
           {dailyFields.map((f, i) => (
             <Card key={f.id} className="p-4 flex items-center gap-4 bg-card/50">
               <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
               <div className="grid grid-cols-12 gap-4 flex-1 items-center">
                 <div className="col-span-5">
                   <Label className="text-xs mb-1 block">Field Label</Label>
                   <Input value={f.label} onChange={(e) => {
                      const nf = [...dailyFields];
                      nf[i].label = e.target.value;
                      setDailyFields(nf);
                   }} />
                 </div>
                 <div className="col-span-4">
                   <Label className="text-xs mb-1 block">Data Type</Label>
                   <Select value={f.type} onValueChange={(val) => {
                      const nf = [...dailyFields];
                      nf[i].type = val;
                      setDailyFields(nf);
                   }}>
                     <SelectTrigger><SelectValue /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="number">Number</SelectItem>
                       <SelectItem value="currency">Currency (£)</SelectItem>
                       <SelectItem value="text">Text (Short)</SelectItem>
                       <SelectItem value="boolean">Yes/No Toggle</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 <div className="col-span-2 flex flex-col items-center">
                   <Label className="text-xs mb-1 block">Required?</Label>
                   <Switch checked={f.required} onCheckedChange={(val) => {
                      const nf = [...dailyFields];
                      nf[i].required = val;
                      setDailyFields(nf);
                   }} />
                 </div>
                 <div className="col-span-1 flex justify-end">
                   <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => {
                      setDailyFields(dailyFields.filter(field => field.id !== f.id));
                   }}>
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             </Card>
           ))}
           <Button variant="outline" className="w-full border-dashed" onClick={() => {
              setDailyFields([...dailyFields, { id: `df${Date.now()}`, label: "New Field", type: "number", required: false }]);
           }}>
             <Plus className="h-4 w-4 mr-2" /> Add Field
           </Button>
         </div>
      )}
    </div>
  );

  const renderBookkeepingEditor = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
           <h3 className="text-lg font-semibold">Core Monthly Checklist</h3>
           <p className="text-sm text-muted-foreground">Rows and sections for the monthly close process.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
              {previewMode ? <Settings className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {previewMode ? "Edit Mode" : "Preview"}
           </Button>
           <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-2" /> Save</Button>
        </div>
      </div>

      {previewMode ? (
         <Card className="p-6 bg-muted/20 border-dashed">
            <h4 className="font-semibold mb-4 text-primary border-b pb-2">End-User Preview: Bookkeeping</h4>
            <div className="space-y-6 max-w-md">
               {['Essential', 'Invoices'].map(section => (
                  <div key={section} className="space-y-2">
                     <h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">{section}</h5>
                     {bookkeepingRows.filter(r => r.section === section).map(r => (
                        <div key={r.id} className="flex items-center justify-between bg-background p-3 rounded-lg border">
                           <span className="text-sm">{r.label} {r.mandatory && <span className="text-destructive">*</span>}</span>
                           <div className="flex gap-1">
                              <div className="h-6 w-6 border rounded flex items-center justify-center text-emerald-500 font-bold">✓</div>
                              <div className="h-6 w-6 border rounded flex items-center justify-center text-rose-500 font-bold">✗</div>
                           </div>
                        </div>
                     ))}
                  </div>
               ))}
            </div>
         </Card>
      ) : (
         <div className="space-y-4">
           {bookkeepingRows.map((r, i) => (
             <Card key={r.id} className="p-4 flex items-center gap-4 bg-card/50">
               <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
               <div className="grid grid-cols-12 gap-4 flex-1 items-center">
                 <div className="col-span-4">
                   <Label className="text-xs mb-1 block">Section / Category</Label>
                   <Input value={r.section} onChange={(e) => {
                      const nr = [...bookkeepingRows];
                      nr[i].section = e.target.value;
                      setBookkeepingRows(nr);
                   }} />
                 </div>
                 <div className="col-span-5">
                   <Label className="text-xs mb-1 block">Task Name</Label>
                   <Input value={r.label} onChange={(e) => {
                      const nr = [...bookkeepingRows];
                      nr[i].label = e.target.value;
                      setBookkeepingRows(nr);
                   }} />
                 </div>
                 <div className="col-span-2 flex flex-col items-center">
                   <Label className="text-xs mb-1 block">Mandatory?</Label>
                   <Switch checked={r.mandatory} onCheckedChange={(val) => {
                      const nr = [...bookkeepingRows];
                      nr[i].mandatory = val;
                      setBookkeepingRows(nr);
                   }} />
                 </div>
                 <div className="col-span-1 flex justify-end">
                   <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => {
                      setBookkeepingRows(bookkeepingRows.filter(row => row.id !== r.id));
                   }}>
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             </Card>
           ))}
           <Button variant="outline" className="w-full border-dashed" onClick={() => {
              setBookkeepingRows([...bookkeepingRows, { id: `bk${Date.now()}`, section: "General", label: "New Task", mandatory: false }]);
           }}>
             <Plus className="h-4 w-4 mr-2" /> Add Task Row
           </Button>
         </div>
      )}
    </div>
  );

  const renderBonusEditor = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
           <h3 className="text-lg font-semibold">Pharmacist Volume Bonus</h3>
           <p className="text-sm text-muted-foreground">Tiers and financial rewards for dispensing volume.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
              {previewMode ? <Settings className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {previewMode ? "Edit Mode" : "Preview"}
           </Button>
           <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-2" /> Save</Button>
        </div>
      </div>

      {previewMode ? (
         <Card className="p-6 bg-muted/20 border-dashed">
            <h4 className="font-semibold mb-4 text-primary border-b pb-2">End-User Preview: Bonus Scale</h4>
            <div className="space-y-2 max-w-md">
               {bonusBands.map((b, idx) => (
                  <div key={b.id} className="flex justify-between p-3 bg-background rounded border">
                     <span className="font-medium text-sm">Tier {idx + 1}: {b.threshold}+ Items</span>
                     <span className="font-bold text-emerald-600">£{b.rate} Bonus</span>
                  </div>
               ))}
               <div className="mt-4 text-xs text-muted-foreground bg-primary/5 p-3 rounded">
                  * Note: Bonuses are calculated automatically at month end based on approved Daily Figures.
               </div>
            </div>
         </Card>
      ) : (
         <div className="space-y-4">
           {bonusBands.map((b, i) => (
             <Card key={b.id} className="p-4 flex items-center gap-4 bg-card/50">
               <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
               <div className="grid grid-cols-12 gap-4 flex-1 items-center">
                 <div className="col-span-1 flex items-center justify-center font-bold text-muted-foreground">
                    #{i + 1}
                 </div>
                 <div className="col-span-5">
                   <Label className="text-xs mb-1 block">Item Threshold (Volume)</Label>
                   <Input type="number" value={b.threshold} onChange={(e) => {
                      const nb = [...bonusBands];
                      nb[i].threshold = e.target.value;
                      setBonusBands(nb);
                   }} />
                 </div>
                 <div className="col-span-5">
                   <Label className="text-xs mb-1 block">Bonus Amount (£)</Label>
                   <Input type="number" value={b.rate} onChange={(e) => {
                      const nb = [...bonusBands];
                      nb[i].rate = e.target.value;
                      setBonusBands(nb);
                   }} />
                 </div>
                 <div className="col-span-1 flex justify-end">
                   <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => {
                      setBonusBands(bonusBands.filter(band => band.id !== b.id));
                   }}>
                     <Trash2 className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
             </Card>
           ))}
           <Button variant="outline" className="w-full border-dashed" onClick={() => {
              setBonusBands([...bonusBands, { id: `b${Date.now()}`, threshold: "0", rate: "0" }]);
           }}>
             <Plus className="h-4 w-4 mr-2" /> Add Bonus Tier
           </Button>
         </div>
      )}
    </div>
  );

  return (
    <Card className="rounded-2xl border bg-card/60 overflow-hidden flex flex-col md:flex-row min-h-[700px] mb-6 shadow-sm">
       {/* Left Sidebar - Template Navigation */}
       <div className="w-full md:w-64 border-r bg-background/30 flex flex-col">
          <div className="p-4 border-b">
             <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Template Library</h2>
          </div>
          <ScrollArea className="flex-1">
             <div className="p-3 space-y-6">
                
                {/* Daily Figures Category */}
                <div className="space-y-2">
                   <div className="text-xs font-bold text-muted-foreground flex items-center gap-2 px-2">
                      <FileText className="h-3 w-3" />
                      Daily Figures
                   </div>
                   <div className="space-y-1">
                      <button 
                         onClick={() => { setActiveTemplateType("daily-figures"); setSelectedTemplateId("df_1"); setPreviewMode(false); }}
                         className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTemplateType === "daily-figures" && selectedTemplateId === "df_1" ? "bg-primary text-primary-foreground font-medium shadow-sm" : "hover:bg-muted text-muted-foreground"}`}
                      >
                         Standard Pharmacy
                      </button>
                      <button 
                         onClick={() => { setActiveTemplateType("daily-figures"); setSelectedTemplateId("df_2"); setPreviewMode(false); }}
                         className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTemplateType === "daily-figures" && selectedTemplateId === "df_2" ? "bg-primary text-primary-foreground font-medium shadow-sm" : "hover:bg-muted text-muted-foreground"}`}
                      >
                         Private Clinic specific
                      </button>
                   </div>
                </div>

                {/* Bookkeeping Category */}
                <div className="space-y-2">
                   <div className="text-xs font-bold text-muted-foreground flex items-center gap-2 px-2">
                      <CheckSquare className="h-3 w-3" />
                      Bookkeeping
                   </div>
                   <div className="space-y-1">
                      <button 
                         onClick={() => { setActiveTemplateType("bookkeeping"); setSelectedTemplateId("bk_1"); setPreviewMode(false); }}
                         className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTemplateType === "bookkeeping" && selectedTemplateId === "bk_1" ? "bg-primary text-primary-foreground font-medium shadow-sm" : "hover:bg-muted text-muted-foreground"}`}
                      >
                         Core Monthly Checklist
                      </button>
                   </div>
                </div>

                {/* Bonuses Category */}
                <div className="space-y-2">
                   <div className="text-xs font-bold text-muted-foreground flex items-center gap-2 px-2">
                      <Award className="h-3 w-3" />
                      Bonus Structures
                   </div>
                   <div className="space-y-1">
                      <button 
                         onClick={() => { setActiveTemplateType("bonus"); setSelectedTemplateId("bn_1"); setPreviewMode(false); }}
                         className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTemplateType === "bonus" && selectedTemplateId === "bn_1" ? "bg-primary text-primary-foreground font-medium shadow-sm" : "hover:bg-muted text-muted-foreground"}`}
                      >
                         Pharmacist Volume Bonus
                      </button>
                      <button 
                         onClick={() => { setActiveTemplateType("bonus"); setSelectedTemplateId("bn_2"); setPreviewMode(false); }}
                         className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeTemplateType === "bonus" && selectedTemplateId === "bn_2" ? "bg-primary text-primary-foreground font-medium shadow-sm" : "hover:bg-muted text-muted-foreground"}`}
                      >
                         Dispenser Volume Bonus
                      </button>
                   </div>
                </div>

             </div>
          </ScrollArea>
          <div className="p-4 border-t">
             <Button variant="outline" className="w-full text-xs" onClick={() => toast({ title: "Template Created", description: "A new blank template has been added."})}>
                <Plus className="h-3 w-3 mr-2" /> New Template
             </Button>
          </div>
       </div>

       {/* Right Main Editor Area */}
       <div className="flex-1 flex flex-col bg-background/10">
          {/* Template Toolbar */}
          <div className="p-4 border-b flex items-center justify-between bg-background/50">
             <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-primary/5">{activeTemplateType === 'daily-figures' ? 'Daily Figures' : activeTemplateType === 'bookkeeping' ? 'Bookkeeping' : 'Bonus'}</Badge>
                <div className="text-sm text-muted-foreground">Assigned to: <span className="font-medium text-foreground">All Branches (3)</span></div>
             </div>
             <div className="flex gap-2">
                <Button variant="ghost" size="sm" title="Assign to branches"><Share2 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" title="Duplicate template"><Copy className="h-4 w-4" /></Button>
             </div>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
             {activeTemplateType === "daily-figures" && renderDailyFiguresEditor()}
             {activeTemplateType === "bookkeeping" && renderBookkeepingEditor()}
             {activeTemplateType === "bonus" && renderBonusEditor()}
          </div>
       </div>
    </Card>
  );
}
