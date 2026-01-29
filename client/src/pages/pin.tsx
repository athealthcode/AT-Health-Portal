import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/state/auth";

export default function Pin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { session, verifyStaffPin, signOut } = useAuth();

  const [pin, setPin] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const locked = !!(session.pinLockoutUntil && Date.now() < session.pinLockoutUntil);
  const secondsLeft = useMemo(() => {
    if (!session.pinLockoutUntil) return 0;
    return Math.max(0, Math.ceil((session.pinLockoutUntil - Date.now()) / 1000));
  }, [session.pinLockoutUntil]);

  const staffOptions = useMemo(
    () => [
      { name: "Sarah Ahmed", role: "Pharmacy Manager" },
      { name: "James Miller", role: "Pharmacy Login" },
      { name: "Helen Carter", role: "Head Office Admin" },
      { name: "Finance Team", role: "Finance" },
    ],
    [],
  );

  const selectedPharmacyLabel =
    session.scope.type === "pharmacy" ? session.scope.pharmacyName : "Head Office";

  return (
    <div className="min-h-dvh app-bg relative">
      <div className="noise-overlay" />
      <div className="mx-auto max-w-xl px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <Card className="surface rounded-2xl p-6 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div
                  className="text-lg font-semibold tracking-tight"
                  data-testid="text-pin-title"
                >
                  Staff PIN required
                </div>
                <div
                  className="text-sm text-muted-foreground"
                  data-testid="text-pin-subtitle"
                >
                  Confirm the named staff member for this session ({selectedPharmacyLabel}).
                </div>
              </div>
              <Badge variant="outline" className="pill" data-testid="badge-pin-tries">
                {locked ? `Locked (${secondsLeft}s)` : `${session.pinAttemptsLeft} tries left`}
              </Badge>
            </div>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin" data-testid="label-pin">
                  PIN (4–8 digits)
                </Label>
                <Input
                  id="pin"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="••••"
                  className="h-11 font-mono tracking-widest"
                  data-testid="input-staff-pin"
                  disabled={locked}
                  autoFocus
                />
                <div className="text-xs text-muted-foreground" data-testid="text-pin-policy">
                  3 retries then 10-minute lockout. Head Office alert triggered on lockout.
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  className="h-11"
                  data-testid="button-verify-pin"
                  disabled={locked || pin.length < 4 || isBusy}
                  onClick={async () => {
                    setIsBusy(true);
                    try {
                      const res = await verifyStaffPin(pin);
                      if (res.ok) {
                        toast({
                          title: "PIN verified",
                          description: `Signed in as ${res.staff?.name}`,
                        });
                        setLocation("/");
                      } else {
                        if (res.lockedOut) {
                          toast({
                            title: "Locked out",
                            description:
                              "Too many attempts. Try again later (Head Office alerted).",
                            variant: "destructive",
                          });
                        } else {
                          toast({
                            title: "Incorrect PIN",
                            description: `${res.attemptsLeft} attempt(s) remaining.`,
                            variant: "destructive",
                          });
                        }
                      }
                    } finally {
                      setIsBusy(false);
                    }
                  }}
                >
                  Continue
                </Button>

                <Button
                  variant="secondary"
                  className="h-11"
                  data-testid="button-signout"
                  onClick={() => {
                    signOut();
                    setLocation("/login");
                  }}
                >
                  Sign out
                </Button>
              </div>

              <Alert data-testid="alert-pin-capture">
                <div className="text-sm">
                  All actions in the portal are captured against the chosen staff identity.
                </div>
              </Alert>

              <div
                className="rounded-xl border bg-card/50 p-4"
                data-testid="panel-staff-preview"
              >
                <div className="text-sm font-medium">Example staff list (prototype)</div>
                <div className="mt-2 grid gap-2">
                  {staffOptions.map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center justify-between rounded-lg border bg-background/40 px-3 py-2"
                      data-testid={`row-staff-${s.name.replace(/\s+/g, "-").toLowerCase()}`}
                    >
                      <div
                        className="text-sm"
                        data-testid={`text-staff-name-${s.name
                          .replace(/\s+/g, "-")
                          .toLowerCase()}`}
                      >
                        {s.name}
                      </div>
                      <div
                        className="text-xs text-muted-foreground"
                        data-testid={`text-staff-role-${s.name
                          .replace(/\s+/g, "-")
                          .toLowerCase()}`}
                      >
                        {s.role}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-muted-foreground" data-testid="text-trusted-device">
                Trusted device cookie and per-pharmacy IP allowlist are enforced server-side in
                production.
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
