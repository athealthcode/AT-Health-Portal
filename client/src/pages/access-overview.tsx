import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, KeyRound, Check, X } from "lucide-react";

export default function AccessOverview() {
  const users = [
    {
      email: "ahmed@at-health.co.uk",
      role: "Super Admin",
      flow: "OTP → PIN",
      scope: "Head Office or Pharmacy",
      master: true,
    },
    {
      email: "info@at-health.co.uk",
      role: "Head Office Admin",
      flow: "OTP → PIN",
      scope: "Head Office",
      master: false,
    },
    {
      email: "finance@at-health.co.uk",
      role: "Finance",
      flow: "OTP → Staff Picker → PIN",
      scope: "Head Office",
      master: false,
    },
    {
      email: "info@bowlandpharmacy.co.uk",
      role: "Pharmacy Login",
      flow: "OTP → Staff Picker → PIN",
      scope: "Bowland",
      master: false,
    },
    {
      email: "info@dentonpharmacy.co.uk",
      role: "Pharmacy Login",
      flow: "OTP → Staff Picker → PIN",
      scope: "Denton",
      master: false,
    },
    {
      email: "info@wilmslowpharmacy.co.uk",
      role: "Pharmacy Login",
      flow: "OTP → Staff Picker → PIN",
      scope: "Wilmslow",
      master: false,
    },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-5xl">
        <div>
          <h1 className="font-serif text-3xl tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Access Overview
          </h1>
          <p className="text-muted-foreground mt-2">
            Head Office security configurations, login flows, and master capabilities. 
            Passwords and PINs are strictly hidden from all views.
          </p>
        </div>

        <Card className="rounded-2xl border bg-card/60 p-1 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold text-foreground">Email / Account</TableHead>
                <TableHead className="font-semibold text-foreground">Role</TableHead>
                <TableHead className="font-semibold text-foreground">Login Flow</TableHead>
                <TableHead className="font-semibold text-foreground">Scope</TableHead>
                <TableHead className="font-semibold text-foreground text-center">Master Capabilities</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10">
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                      <KeyRound className="h-3.5 w-3.5" />
                      {u.flow}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.scope}</TableCell>
                  <TableCell className="text-center">
                    {u.master ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                        <Check className="h-3 w-3 mr-1" /> Master
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground flex justify-center"><X className="h-4 w-4 opacity-30" /></span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 text-sm text-blue-800">
           <h3 className="font-semibold mb-2 text-blue-900">Security Notes</h3>
           <ul className="list-disc pl-5 space-y-1">
              <li><strong>OTP:</strong> Handled securely during the login flow. Head Office emails require an emailed one-time passcode if not on a trusted device.</li>
              <li><strong>Staff Picker:</strong> Displays available staff for the authenticated branch or department.</li>
              <li><strong>PIN Restrictions:</strong> PIN entry is blanked, enforcing 4-8 digits. The <strong>Master PIN (145891)</strong> is explicitly restricted to only work when the underlying email session belongs to <code>ahmed@at-health.co.uk</code>. Staff use branch-specific or standard PINs.</li>
           </ul>
        </div>
      </div>
    </AppShell>
  );
}
