import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
   Building2, Users, Palette, CheckCircle2, ArrowRight
} from "lucide-react";
import { useState } from "react";

export default function Onboarding() {
   const [step, setStep] = useState(1);

   return (
      <AppShell>
         <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="text-center space-y-2 mb-4">
               <Badge variant="outline" className="mb-2 uppercase tracking-wider text-[10px]">Super Admin Only</Badge>
               <h1 className="font-serif text-3xl tracking-tight text-foreground">Organisation Onboarding</h1>
               <p className="text-sm text-muted-foreground">
                  Create and configure a new tenant organisation on the platform.
               </p>
            </div>

            <div className="flex items-center justify-between mb-8 relative">
               <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-muted -z-10 -translate-y-1/2" />
               {[
                  { num: 1, label: "Organisation", icon: Building2 },
                  { num: 2, label: "Branding", icon: Palette },
                  { num: 3, label: "Modules", icon: CheckCircle2 },
               ].map((s) => (
                  <div key={s.num} className="flex flex-col items-center gap-2 bg-background px-2">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${step >= s.num ? 'border-primary bg-primary text-primary-foreground' : 'border-muted bg-background text-muted-foreground'}`}>
                        <s.icon className="w-5 h-5" />
                     </div>
                     <span className={`text-xs font-medium ${step >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
                  </div>
               ))}
            </div>

            <Card className="p-6 md:p-8 rounded-2xl shadow-sm border bg-card/60">
               {step === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                     <div>
                        <h2 className="text-xl font-semibold mb-1">Organisation Details</h2>
                        <p className="text-sm text-muted-foreground">Basic information about the pharmacy group.</p>
                     </div>
                     <div className="grid gap-4">
                        <div className="grid gap-2">
                           <Label>Organisation Name</Label>
                           <Input placeholder="e.g. AT Health Pharmacy Group" />
                        </div>
                        <div className="grid gap-2">
                           <Label>Primary Contact Email</Label>
                           <Input type="email" placeholder="admin@example.com" />
                        </div>
                        <div className="grid gap-2">
                           <Label>Number of Branches</Label>
                           <Input type="number" placeholder="e.g. 5" />
                        </div>
                     </div>
                     <div className="flex justify-end pt-4">
                        <Button onClick={() => setStep(2)}>Next Step <ArrowRight className="w-4 h-4 ml-2" /></Button>
                     </div>
                  </div>
               )}

               {step === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                     <div>
                        <h2 className="text-xl font-semibold mb-1">White-labelling & Branding</h2>
                        <p className="text-sm text-muted-foreground">Customise the platform's appearance for this tenant.</p>
                     </div>
                     <div className="grid gap-6">
                        <div className="grid gap-2">
                           <Label>Brand Primary Colour (Hex)</Label>
                           <div className="flex gap-3">
                              <Input placeholder="#0f172a" defaultValue="#0ea5e9" className="font-mono" />
                              <div className="w-10 h-10 rounded-lg bg-emerald-500 border shadow-sm"></div>
                           </div>
                        </div>
                        <div className="grid gap-2">
                           <Label>Logo Upload</Label>
                           <div className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
                              <p className="text-sm text-muted-foreground">Click or drag logo image here (PNG/SVG, max 2MB)</p>
                           </div>
                        </div>
                        <div className="grid gap-2">
                           <Label>Email Sender Name</Label>
                           <Input placeholder="e.g. AT Health Portal" />
                        </div>
                     </div>
                     <div className="flex justify-between pt-4">
                        <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                        <Button onClick={() => setStep(3)}>Next Step <ArrowRight className="w-4 h-4 ml-2" /></Button>
                     </div>
                  </div>
               )}

               {step === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                     <div>
                        <h2 className="text-xl font-semibold mb-1">Module Entitlements</h2>
                        <p className="text-sm text-muted-foreground">Select which features this organisation has access to.</p>
                     </div>
                     <div className="grid gap-3">
                        {['Daily Figures', 'Cashing Up', 'Bookkeeping', 'Banking Reconciliation', 'PQS Tracker', 'Bonus & Performance', 'Incident Management', 'Private Clinic'].map((mod, i) => (
                           <div key={i} className="flex items-center justify-between p-3 border rounded-xl bg-background/50">
                              <span className="text-sm font-medium">{mod}</span>
                              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-muted text-primary focus:ring-primary" />
                           </div>
                        ))}
                     </div>
                     <div className="flex justify-between pt-4">
                        <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">Create Tenant Organisation</Button>
                     </div>
                  </div>
               )}
            </Card>
         </div>
      </AppShell>
   );
}
