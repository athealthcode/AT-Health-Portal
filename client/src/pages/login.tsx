import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/state/auth";
import { ShieldCheck, Mail, Network } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { signIn, session, setSimulatedIp } = useAuth();

  const [step, setStep] = useState<"login" | "mfa">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [networkMessage, setNetworkMessage] = useState<string | null>(null);

  // Dev: State for IP simulation
  const [devIp, setDevIp] = useState("81.100.10.15");
  const [showDev, setShowDev] = useState(false);

  useEffect(() => {
    if (session.isAuthenticated) setLocation("/pin");
  }, [session.isAuthenticated, setLocation]);

  const invitedHint = useMemo(() => {
    const e = email.trim().toLowerCase();
    if (!e) return null;
    if (e.endsWith("@athealth.co.uk") || e.endsWith("@at-health.co.uk")) return "Company email detected";
    return "External email supported (invite required)";
  }, [email]);

  return (
    <div className="min-h-dvh app-bg relative">
      <div className="noise-overlay" />
      <div className="mx-auto max-w-6xl px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="flex flex-col justify-center">
            <div className="inline-flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-lg">
                <span className="font-mono text-sm">AT</span>
              </div>
              <div>
                <div className="font-serif text-2xl tracking-tight">AT Health Portal</div>
                <div className="text-sm text-muted-foreground">Intranet for pharmacies and head office</div>
              </div>
            </div>

            <div className="mt-7 space-y-3">
              <div className="text-3xl font-semibold tracking-tight">Sign in</div>
              <div className="text-muted-foreground leading-relaxed">
                Invited users only. Registration is disabled.
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="secondary" data-testid="badge-security">
                <ShieldCheck className="h-3 w-3 mr-1" />
                IP Allowlisted
              </Badge>
              <Badge variant="secondary" data-testid="badge-mfa">
                <Mail className="h-3 w-3 mr-1" />
                Email OTP Required
              </Badge>
            </div>

            <div className="mt-10 space-y-2 text-xs text-muted-foreground">
              <div data-testid="text-security-note">
                Security: Pre-created users only. IP allowlist enforced server-side.
              </div>
              <div className="pt-4 cursor-pointer hover:text-primary" onClick={() => setShowDev(!showDev)}>
                 Build v0.4.2 {showDev ? "(Dev Mode Active)" : ""}
              </div>
              {showDev && (
                 <div className="p-3 border rounded bg-background/50 backdrop-blur-sm space-y-2 max-w-xs">
                    <div className="font-mono font-bold">Simulate Network</div>
                    <div className="flex gap-2">
                       <Input value={devIp} onChange={e => setDevIp(e.target.value)} className="h-8 font-mono text-xs" />
                       <Button size="sm" variant="outline" className="h-8" onClick={() => {
                          setSimulatedIp(devIp);
                          toast({ title: "IP Changed", description: `Simulated IP: ${devIp}` });
                       }}>Set IP</Button>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                       Current: {session.currentIp}
                    </div>
                 </div>
              )}
            </div>
          </div>

          <Card className="surface rounded-2xl p-6 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold tracking-tight" data-testid="text-login-title">
                  {step === "login" ? "Company Sign In" : "Email Verification"}
                </div>
                <div className="text-sm text-muted-foreground" data-testid="text-login-subtitle">
                  {step === "login"
                    ? "Enter your credentials."
                    : `Enter the code sent to ${email}`}
                </div>
              </div>
            </div>

            {networkMessage && (
               <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2 text-sm text-amber-900 animate-in fade-in slide-in-from-top-1">
                  <Network className="h-4 w-4" />
                  {networkMessage}
               </div>
            )}

            <div className="mt-6 space-y-4">
              {step === "login" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" data-testid="label-email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@athealth.co.uk"
                      className="h-11"
                      data-testid="input-email"
                      autoComplete="email"
                    />
                    {invitedHint ? (
                      <div className="text-xs text-muted-foreground" data-testid="text-invite-hint">{invitedHint}</div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" data-testid="label-password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11"
                      data-testid="input-password"
                      autoComplete="current-password"
                    />
                  </div>

                  <Button
                    className="h-11 w-full"
                    data-testid="button-login"
                    disabled={!email.trim() || password.length < 6 || isLoading}
                    onClick={async () => {
                      setIsLoading(true);
                      setNetworkMessage(null);
                      try {
                        const res = await signIn({ email, password });
                        if (res.next === "mfa") {
                          setStep("mfa");
                          toast({ title: "OTP Sent", description: "Check your email for the code." });
                          if (res.message) setNetworkMessage(res.message);
                        }
                      } catch (e) {
                         toast({ title: "Access Denied", description: "Invalid credentials or not invited.", variant: "destructive" });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    Continue
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label data-testid="label-mfa-code">Email OTP</Label>
                    <div className="flex items-center justify-between gap-3">
                      <InputOTP
                        maxLength={6}
                        value={code}
                        onChange={setCode}
                        data-testid="input-mfa"
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 6 }).map((_, i) => (
                            <InputOTPSlot key={i} index={i} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid="text-mfa-hint">
                      One-time code sent to your registered email.
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 py-2">
                    <Checkbox 
                      id="trust" 
                      checked={trustDevice} 
                      onCheckedChange={(c) => setTrustDevice(!!c)} 
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="trust"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Trust this browser for 7 days
                      </Label>
                      <p className="text-[0.8rem] text-muted-foreground">
                        Only works on this device and network.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Button
                      variant="secondary"
                      className="h-11"
                      data-testid="button-back-login"
                      onClick={() => {
                        setStep("login");
                        setCode("");
                        setNetworkMessage(null);
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      className="h-11"
                      data-testid="button-verify-mfa"
                      disabled={code.length !== 6 || isLoading}
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          const res = await signIn({ email, password, otp: code, trustDevice });
                          if (res.next === "staff-picker") setLocation("/pin");
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                    >
                      Verify
                    </Button>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                 <ShieldCheck className="h-3 w-3" />
                 <span>Official Use Only</span>
              </div>
              <div data-testid="text-session-timeout">Inactivity timeout enabled</div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
