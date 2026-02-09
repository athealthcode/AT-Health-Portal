import { useMemo, useState, useEffect } from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/state/auth";

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

export default function Documents() {
  const { session } = useAuth();
  const [fallbackOnly, setFallbackOnly] = useState(false);
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
     const saved = localStorage.getItem('sharepoint_config');
     if (saved) {
        setConfig(JSON.parse(saved));
     }
  }, []);

  const scopeKey = session.scope.type === "pharmacy" ? session.scope.pharmacyId : "headoffice";
  const scopeLabel = session.scope.type === "pharmacy" ? session.scope.pharmacyName : "Head Office";

  const cfg = useMemo(() => config[scopeKey as keyof typeof config] || DEFAULT_CONFIG.headoffice, [config, scopeKey]);

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="font-serif text-2xl tracking-tight" data-testid="text-documents-title">Documents</div>
            <div className="text-sm text-muted-foreground" data-testid="text-documents-subtitle">
              Embedded SharePoint per pharmacy (view/download only) with a fallback link.
            </div>
          </div>
          <Badge variant="secondary" className="pill" data-testid="badge-documents-scope">Scope: {scopeLabel}</Badge>
        </div>

        <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-documents-settings">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm font-semibold" data-testid="text-documents-access">Access</div>
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
          <div className="text-sm font-semibold" data-testid="text-embed-title">SharePoint</div>
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
      </div>
    </AppShell>
  );
}
