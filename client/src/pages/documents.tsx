import { useMemo, useState, useEffect } from "react";
import { ExternalLink, ShieldCheck, CheckCircle2, Clock, FileText, Bell } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/state/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const DEFAULT_CONFIG = {
  bowland: {
    embed: "https://www.microsoft.com/en-gb/microsoft-365/sharepoint/collaboration",
    fallback: "https://www.microsoft.com/en-gb/microsoft-365/sharepoint/collaboration",
  },
  denton: {
    embed: "https://www.microsoft.com/en-gb/microsoft-365/sharepoint/collaboration",
    fallback: "https://www.microsoft.com/en-gb/microsoft-365/sharepoint/collaboration",
  },
  wilmslow: {
    embed: "https://www.microsoft.com/en-gb/microsoft-365/sharepoint/collaboration",
    fallback: "https://www.microsoft.com/en-gb/microsoft-365/sharepoint/collaboration",
  },
  headoffice: {
    embed: "https://www.microsoft.com/en-gb/microsoft-365/sharepoint/collaboration",
    fallback: "https://www.microsoft.com/en-gb/microsoft-365/sharepoint/collaboration",
  },
};

const PHARMACIES = [
  { id: "bowland", name: "Bowland Pharmacy" },
  { id: "denton", name: "Denton Pharmacy" },
  { id: "wilmslow", name: "Wilmslow Pharmacy" },
];

const MOCK_SOPS = [
  { id: "sop1", title: "Information Governance v4.2", published: "2026-03-01", due: "2026-03-15", status: "pending", readAt: null },
  { id: "sop2", title: "Controlled Drugs Handling", published: "2026-02-15", due: "2026-02-28", status: "read", readAt: "2026-02-20" },
  { id: "sop3", title: "Locum Induction Checklist", published: "2026-01-10", due: "2026-01-30", status: "read", readAt: "2026-01-12" },
  { id: "sop4", title: "Emergency Contraception PGD", published: "2026-03-05", due: "2026-03-10", status: "overdue", readAt: null },
];

export default function Documents() {
  const { session } = useAuth();
  const [fallbackOnly, setFallbackOnly] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  
  // Head Office Selector State
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>("bowland");

  useEffect(() => {
     const saved = localStorage.getItem('sharepoint_config');
     if (saved) {
        setConfig(JSON.parse(saved));
     }
  }, []);

  const isHeadOffice = session.scope.type === "headoffice";
  
  // Determine which config key to use
  const scopeKey = isHeadOffice ? selectedPharmacyId : (session.scope.type === "pharmacy" ? session.scope.pharmacyId : "headoffice");
  const scopeLabel = isHeadOffice 
     ? PHARMACIES.find(p => p.id === selectedPharmacyId)?.name || "Selected Pharmacy"
     : (session.scope.type === "pharmacy" ? session.scope.pharmacyName : "Head Office");

  const cfg = useMemo(() => config[scopeKey as keyof typeof config] || DEFAULT_CONFIG.headoffice, [config, scopeKey]);

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="font-serif text-2xl tracking-tight" data-testid="text-documents-title">Documents & SOPs</div>
            <div className="text-sm text-muted-foreground" data-testid="text-documents-subtitle">
              Access embedded SharePoint documents and complete SOP acknowledgements.
            </div>
          </div>
          
          {isHeadOffice ? (
             <div className="flex items-center gap-2">
                <Label>View for:</Label>
                <Select value={selectedPharmacyId} onValueChange={setSelectedPharmacyId}>
                   <SelectTrigger className="w-[200px]">
                      <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                      {PHARMACIES.map(p => (
                         <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                   </SelectContent>
                </Select>
             </div>
          ) : (
             <Badge variant="secondary" className="pill" data-testid="badge-documents-scope">Scope: {scopeLabel}</Badge>
          )}
        </div>

        <Tabs defaultValue="sops" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="sops">SOP Acknowledgements</TabsTrigger>
            <TabsTrigger value="sharepoint">SharePoint Repository</TabsTrigger>
          </TabsList>

          <TabsContent value="sops" className="mt-4 space-y-4">
             <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-4 rounded-2xl border bg-card/60 shadow-sm flex flex-col justify-center items-center text-center">
                   <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Compliance Rate</div>
                   <div className="text-4xl font-bold font-mono text-emerald-600">75%</div>
                   <Progress value={75} className="h-1.5 w-full max-w-[150px] mt-3" />
                </Card>
                <Card className="p-4 rounded-2xl border bg-card/60 shadow-sm flex flex-col justify-center items-center text-center">
                   <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pending Reading</div>
                   <div className="text-4xl font-bold font-mono text-amber-500">1</div>
                   <div className="text-xs text-muted-foreground mt-2">Documents to review</div>
                </Card>
                <Card className="p-4 rounded-2xl border bg-card/60 shadow-sm flex flex-col justify-center items-center text-center">
                   <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Overdue</div>
                   <div className="text-4xl font-bold font-mono text-red-500">1</div>
                   <div className="text-xs text-muted-foreground mt-2">Action required immediately</div>
                </Card>
             </div>

             <Card className="rounded-2xl border bg-card/60 overflow-hidden shadow-sm">
                <div className="p-4 border-b bg-background/50 flex items-center justify-between">
                   <h3 className="font-semibold flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Assigned Documents</h3>
                   {isHeadOffice && <Button size="sm" variant="outline">Publish New SOP</Button>}
                </div>
                <div className="divide-y">
                   {MOCK_SOPS.map(sop => (
                      <div key={sop.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                         <div className="flex items-start gap-3">
                            <div className={`mt-1 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${sop.status === 'read' ? 'bg-emerald-100 text-emerald-600' : sop.status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                               <FileText className="h-4 w-4" />
                            </div>
                            <div>
                               <div className="font-medium">{sop.title}</div>
                               <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                  <span>Published: {sop.published}</span>
                                  <span className={sop.status === 'overdue' ? 'text-red-500 font-medium' : ''}>Due: {sop.due}</span>
                                  {sop.readAt && <span className="text-emerald-600">Acknowledged: {sop.readAt}</span>}
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-3 shrink-0">
                            {sop.status === 'read' ? (
                               <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Acknowledged</Badge>
                            ) : sop.status === 'overdue' ? (
                               <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none">Overdue</Badge>
                            ) : (
                               <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
                            )}
                            <Button variant={sop.status === 'read' ? "outline" : "default"} size="sm">
                               {sop.status === 'read' ? 'View Document' : 'Read & Acknowledge'}
                            </Button>
                         </div>
                      </div>
                   ))}
                </div>
             </Card>
          </TabsContent>

          <TabsContent value="sharepoint" className="mt-4 space-y-4">
            <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-documents-settings">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm font-semibold" data-testid="text-documents-access">Access: {scopeLabel}</div>
                <Badge variant="outline" className="pill" data-testid="badge-readonly">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> View/download only
                </Badge>
              </div>
              <Separator className="my-4" />
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label data-testid="label-sharepoint-url">SharePoint embed URL</Label>
                  <Input value={cfg.embed} readOnly className="mt-2 h-11" data-testid="input-sharepoint-embed" />
                </div>
                <div>
                  <Label data-testid="label-sharepoint-fallback">Fallback link</Label>
                  <Input value={cfg.fallback} readOnly className="mt-2 h-11" data-testid="input-sharepoint-fallback" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant={fallbackOnly ? "default" : "outline"}
                  className="h-10"
                  data-testid="button-fallback-only"
                  onClick={() => setFallbackOnly((s) => !s)}
                >
                  {fallbackOnly ? "Showing fallback" : "Show fallback"}
                </Button>
                <Button
                  variant="secondary"
                  className="h-10"
                  data-testid="button-open-sharepoint"
                  onClick={() => window.open(cfg.fallback, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" /> Open in new tab
                </Button>
              </div>
            </Card>

            <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-documents-embed">
              <div className="text-sm font-semibold" data-testid="text-embed-title">SharePoint Repository</div>
              <div className="mt-3">
                {fallbackOnly ? (
                  <div className="rounded-xl border bg-background/40 p-4" data-testid="panel-fallback">
                    <div className="text-sm">Your browser may block embeds. Use the link below:</div>
                    <div className="mt-2">
                      <a
                        className="underline underline-offset-4"
                        href={cfg.fallback}
                        target="_blank"
                        rel="noreferrer"
                        data-testid="link-sharepoint-fallback"
                      >
                        Open SharePoint for {scopeLabel}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border bg-background/40" data-testid="frame-sharepoint">
                    <iframe
                      title="SharePoint"
                      src={cfg.embed}
                      className="h-[640px] w-full"
                      data-testid="iframe-sharepoint"
                    />
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
