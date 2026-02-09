import { useMemo, useState } from "react";
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

type ReportMeta = {
  id: string;
  name: string;
  range: string;
  createdBy: string;
  createdAt: string;
  pharmacyScope: string;
  downloads: number;
};

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { toast } = useToast();
  const { session } = useAuth();

  const [mode, setMode] = useState<"range" | "month">("month");
  const [from, setFrom] = useState("2026-01-01");
  const [to, setTo] = useState("2026-01-29");
  const [month, setMonth] = useState("2026-01");
  const [auditFilter, setAuditFilter] = useState("all");

  const [reports, setReports] = useState<ReportMeta[]>(() => [
    {
      id: "rpt_001",
      name: "Cashing Up Report (Jan 2026)",
      range: "Monthly: 2026-01",
      createdBy: "Finance Team",
      createdAt: "2026-01-29 18:12",
      pharmacyScope: "All pharmacies",
      downloads: 2,
    },
  ]);

  const scopeLabel = session.scope.type === "pharmacy" ? session.scope.pharmacyName : "All pharmacies";

  const canExport = session.role === "Finance" || session.role === "Head Office Admin" || session.role === "Super Admin";

  const generatedName = useMemo(() => {
    if (mode === "month") return `Cashing Up Report (${month})`;
    return `Cashing Up Report (${from} to ${to})`;
  }, [mode, month, from, to]);

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="font-serif text-2xl tracking-tight" data-testid="text-reports-title">Reports</div>
            <div className="text-sm text-muted-foreground" data-testid="text-reports-subtitle">
              Generate financial reports and view system audit logs.
            </div>
          </div>
          <Badge variant="secondary" className="pill" data-testid="badge-reports-scope">Scope: {scopeLabel}</Badge>
        </div>

        <Tabs defaultValue="financial" className="w-full">
           <TabsList className="mb-4">
              <TabsTrigger value="financial">Financial Reports</TabsTrigger>
              <TabsTrigger value="audit">Audit Logs</TabsTrigger>
           </TabsList>

           <TabsContent value="financial" className="space-y-5">
              <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-reports-generator">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold" data-testid="text-generator-title">Generate Report</div>
                  <div className="flex gap-2">
                    <Button
                      variant={mode === "range" ? "default" : "outline"}
                      className="h-10"
                      data-testid="button-mode-range"
                      onClick={() => setMode("range")}
                    >
                      Date range
                    </Button>
                    <Button
                      variant={mode === "month" ? "default" : "outline"}
                      className="h-10"
                      data-testid="button-mode-month"
                      onClick={() => setMode("month")}
                    >
                      Monthly
                    </Button>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid gap-3 md:grid-cols-3">
                  {mode === "range" ? (
                    <>
                      <div>
                        <Label data-testid="label-from">From</Label>
                        <Input className="mt-2 h-11" type="date" value={from} onChange={(e) => setFrom(e.target.value)} data-testid="input-from" />
                      </div>
                      <div>
                        <Label data-testid="label-to">To</Label>
                        <Input className="mt-2 h-11" type="date" value={to} onChange={(e) => setTo(e.target.value)} data-testid="input-to" />
                      </div>
                    </>
                  ) : (
                    <div>
                      <Label data-testid="label-month">Month</Label>
                      <Input className="mt-2 h-11" type="month" value={month} onChange={(e) => setMonth(e.target.value)} data-testid="input-month" />
                    </div>
                  )}

                  <div className="md:col-span-1 flex items-end gap-2">
                    <Button
                      className="h-11 w-full"
                      data-testid="button-generate-report"
                      disabled={!canExport}
                      onClick={() => {
                        const meta: ReportMeta = {
                          id: `rpt_${Date.now()}`,
                          name: generatedName,
                          range: mode === "month" ? `Monthly: ${month}` : `Range: ${from} → ${to}`,
                          createdBy: session.staff?.name ?? "—",
                          createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
                          pharmacyScope: scopeLabel,
                          downloads: 0,
                        };
                        setReports((s) => [meta, ...s]);
                        toast({
                          title: "Report generated",
                          description: "Metadata stored. Audit log created.",
                        });
                      }}
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                {!canExport ? (
                  <div className="mt-3 text-sm text-muted-foreground" data-testid="text-reports-permission">
                    Your role can view reports but cannot generate exports.
                  </div>
                ) : null}
              </Card>

              <Card className="rounded-2xl border bg-card/60 p-5" data-testid="card-reports-history">
                <div className="text-sm font-semibold" data-testid="text-history-title">Report History</div>
                <div className="mt-3 overflow-hidden rounded-xl border bg-background/40">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Range</TableHead>
                        <TableHead>Scope</TableHead>
                        <TableHead>Created by</TableHead>
                        <TableHead>Downloads</TableHead>
                        <TableHead className="text-right">Export</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((r) => (
                        <TableRow key={r.id} data-testid={`row-report-${r.id}`}>
                          <TableCell data-testid={`text-report-name-${r.id}`}>{r.name}</TableCell>
                          <TableCell data-testid={`text-report-range-${r.id}`}>{r.range}</TableCell>
                          <TableCell data-testid={`text-report-scope-${r.id}`}>{r.pharmacyScope}</TableCell>
                          <TableCell data-testid={`text-report-createdby-${r.id}`}>{r.createdBy}</TableCell>
                          <TableCell data-testid={`text-report-downloads-${r.id}`}>{r.downloads}</TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-export-csv-${r.id}`}
                                disabled={!canExport}
                                onClick={() => {
                                  setReports((s) =>
                                    s.map((x) => (x.id === r.id ? { ...x, downloads: x.downloads + 1 } : x)),
                                  );
                                  downloadText(
                                    `${r.name}.csv`,
                                    "pharmacy,gross,actual,variance,card,cash_to_bank,deposit,vat_total,late_submissions,variance_days\nAll,0,0,0,0,0,0,0,0,0\n",
                                    "text/csv",
                                  );
                                  toast({ title: "CSV exported", description: "Audit log created." });
                                }}
                              >
                                CSV
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                data-testid={`button-export-pdf-${r.id}`}
                                disabled={!canExport}
                                onClick={() => {
                                  setReports((s) =>
                                    s.map((x) => (x.id === r.id ? { ...x, downloads: x.downloads + 1 } : x)),
                                  );
                                  downloadText(`${r.name}.txt`, "PDF export placeholder", "text/plain");
                                  toast({ title: "PDF exported", description: "Audit log created." });
                                }}
                              >
                                PDF
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
           </TabsContent>

           <TabsContent value="audit">
              <Card className="rounded-2xl border bg-card/60 p-5">
                 <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-semibold">System Audit Logs</div>
                    <div className="flex gap-2">
                       <Select value={auditFilter} onValueChange={setAuditFilter}>
                          <SelectTrigger className="w-[180px]">
                             <SelectValue placeholder="Filter by scope" />
                          </SelectTrigger>
                          <SelectContent>
                             <SelectItem value="all">All Scopes</SelectItem>
                             <SelectItem value="pharmacy">Pharmacy Only</SelectItem>
                             <SelectItem value="headoffice">Head Office Only</SelectItem>
                          </SelectContent>
                       </Select>
                       <Button variant="outline" onClick={() => downloadText("audit_log.csv", "Time,Actor,Action,Scope\n", "text/csv")}>
                          Export CSV
                       </Button>
                    </div>
                 </div>
                 
                 <div className="overflow-hidden rounded-xl border bg-background/40">
                    <Table>
                       <TableHeader>
                          <TableRow>
                             <TableHead>Time</TableHead>
                             <TableHead>Actor</TableHead>
                             <TableHead>Action</TableHead>
                             <TableHead>Scope</TableHead>
                             <TableHead>Result</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {[
                             { time: "2026-02-09 10:42", actor: "Sarah Ahmed", action: "Submitted Daily Figures", scope: "pharmacy", result: "Success" },
                             { time: "2026-02-09 10:15", actor: "Helen Carter", action: "User Invited", scope: "headoffice", result: "Success" },
                             { time: "2026-02-09 09:30", actor: "System", action: "Report Generated", scope: "headoffice", result: "Success" },
                             { time: "2026-02-08 17:55", actor: "James Wilson", action: "Cashing Up", scope: "pharmacy", result: "Success" },
                             { time: "2026-02-08 17:45", actor: "James Wilson", action: "Failed Login", scope: "pharmacy", result: "Failure" },
                          ]
                          .filter(l => auditFilter === "all" || l.scope === auditFilter)
                          .map((log, i) => (
                             <TableRow key={i}>
                                <TableCell className="text-xs font-mono">{log.time}</TableCell>
                                <TableCell className="text-sm font-medium">{log.actor}</TableCell>
                                <TableCell className="text-sm">{log.action}</TableCell>
                                <TableCell className="text-xs text-muted-foreground uppercase">{log.scope}</TableCell>
                                <TableCell>
                                   <Badge variant="outline" className={log.result === "Success" ? "text-emerald-600 bg-emerald-50 border-emerald-200" : "text-destructive bg-destructive/5 border-destructive/20"}>
                                      {log.result}
                                   </Badge>
                                </TableCell>
                             </TableRow>
                          ))}
                       </TableBody>
                    </Table>
                 </div>
                 <div className="mt-4 text-xs text-muted-foreground text-center">
                    Audit logs are retained indefinitely for compliance.
                 </div>
              </Card>
           </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
