import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/state/auth";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { signIn, session } = useAuth();

  const [step, setStep] = useState<"login" | "mfa">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
                Invited users only. After you sign in, you’ll confirm your identity using a staff PIN.
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="secondary" data-testid="badge-security">
                MFA required
              </Badge>
              <Badge variant="secondary" data-testid="badge-audit">
                Audit-tracked actions
              </Badge>
              <Badge variant="secondary" data-testid="badge-pharmacies">
                Bowland • Denton • Wilmslow • Head Office
              </Badge>
            </div>

            <div className="mt-10 space-y-2 text-xs text-muted-foreground">
              <div data-testid="text-security-note">
                This is a frontend prototype. Security policies (IP allowlist, lockouts, trusted device, Teams/email hooks)
                are represented in the UI and flows.
              </div>
            </div>
          </div>

          <Card className="surface rounded-2xl p-6 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold tracking-tight" data-testid="text-login-title">
                  {step === "login" ? "Email and password" : "Two‑factor authentication"}
                </div>
                <div className="text-sm text-muted-foreground" data-testid="text-login-subtitle">
                  {step === "login"
                    ? "Use your invite email."
                    : "Enter the 6‑digit code from Microsoft Authenticator."}
                </div>
              </div>
              <Badge variant="outline" className="pill" data-testid="badge-environment">
                Prototype
              </Badge>
            </div>

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
                      placeholder="name@company.com"
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
                      try {
                        const res = await signIn({ email, password });
                        if (res.next === "mfa") {
                          setStep("mfa");
                          toast({ title: "MFA required", description: "Enter your 6-digit code." });
                        }
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    Continue
                  </Button>

                  <Alert className="mt-2" data-testid="alert-login-info">
                    <div className="text-sm">
                      <span className="font-medium">Invited users only.</span> If you can’t sign in, contact Head Office.
                    </div>
                  </Alert>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label data-testid="label-mfa-code">Authenticator code</Label>
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
                      Compatible with Microsoft Authenticator (TOTP).
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
                          const res = await signIn({ email, password, totp: code });
                          if (res.next === "pin") setLocation("/pin");
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                    >
                      Verify
                    </Button>
                  </div>

                  <div className="rounded-xl border bg-card/50 p-4" data-testid="panel-backup-codes">
                    <div className="text-sm font-medium">Backup codes</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      If you’ve lost your authenticator, use a backup code (one-time use).
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Input
                        placeholder="Enter backup code"
                        className="h-10"
                        data-testid="input-backup-code"
                      />
                      <Button variant="outline" className="h-10" data-testid="button-use-backup">
                        Use
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
              <button
                className="underline underline-offset-4 hover:text-foreground transition"
                data-testid="button-forgot-password"
                onClick={() =>
                  toast({
                    title: "Password reset",
                    description: "In production, Head Office can trigger a reset for invited users.",
                  })
                }
              >
                Forgot password?
              </button>
              <div data-testid="text-session-timeout">Auto-logout on inactivity</div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
