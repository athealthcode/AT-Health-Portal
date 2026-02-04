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
import { User, Lock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Pin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { session, verifyStaffPin, signOut, availableStaff, selectStaff } = useAuth();

  const [pin, setPin] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);

  const locked = !!(session.pinLockoutUntil && Date.now() < session.pinLockoutUntil);
  const secondsLeft = useMemo(() => {
    if (!session.pinLockoutUntil) return 0;
    return Math.max(0, Math.ceil((session.pinLockoutUntil - Date.now()) / 1000));
  }, [session.pinLockoutUntil]);

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
            {!selectedStaff ? (
              // STEP 1: STAFF PICKER
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold tracking-tight" data-testid="text-picker-title">
                      Who is logging in?
                    </div>
                    <div className="text-sm text-muted-foreground" data-testid="text-picker-subtitle">
                      Select your identity for {selectedPharmacyLabel}.
                    </div>
                  </div>
                  <Badge variant="outline" className="pill">
                    <Users className="h-3 w-3 mr-1" /> Staff
                  </Badge>
                </div>

                <div className="mt-6 grid gap-2">
                  {availableStaff.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedStaff(s.id);
                        selectStaff(s.id);
                      }}
                      className="flex items-center gap-3 w-full rounded-xl border bg-background/50 p-4 text-left transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      data-testid={`btn-staff-${s.id}`}
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 grid place-items-center text-primary font-medium">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.role}</div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      signOut();
                      setLocation("/login");
                    }}
                  >
                    Cancel / Sign Out
                  </Button>
                </div>
              </>
            ) : (
              // STEP 2: PIN ENTRY
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold tracking-tight" data-testid="text-pin-title">
                      Enter PIN
                    </div>
                    <div className="text-sm text-muted-foreground" data-testid="text-pin-subtitle">
                      Verifying as <strong>{availableStaff.find(s => s.id === selectedStaff)?.name}</strong>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("pill", locked ? "bg-destructive/10 text-destructive" : "")} data-testid="badge-pin-tries">
                    {locked ? `Locked (${secondsLeft}s)` : `${session.pinAttemptsLeft} tries left`}
                  </Badge>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pin" data-testid="label-pin">
                      Staff PIN (4–8 digits)
                    </Label>
                    <Input
                      id="pin"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                      placeholder="••••"
                      className="h-11 font-mono tracking-widest text-center text-lg"
                      data-testid="input-staff-pin"
                      disabled={locked}
                      autoFocus
                      type="password"
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Button
                      variant="secondary"
                      className="h-11"
                      onClick={() => {
                        setSelectedStaff(null);
                        setPin("");
                      }}
                    >
                      Back
                    </Button>
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
                              title: "Welcome",
                              description: `Signed in as ${res.staff?.name}`,
                            });
                            setLocation("/");
                          } else {
                            setPin("");
                            if (res.lockedOut) {
                              toast({
                                title: "Locked out",
                                description: "Too many attempts. Head Office alerted.",
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
                      Sign In
                    </Button>
                  </div>
                </div>
              </>
            )}
            
            <div className="mt-6 text-xs text-center text-muted-foreground" data-testid="text-trusted-device">
              IP: {session.lastLoginIp || "Simulated"} • Secure Session
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
