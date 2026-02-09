import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/state/auth";
import { Network, ArrowRight, Mail } from "lucide-react";
import atLogo from "@/assets/at-health-logo.png";

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
    <div className="min-h-dvh app-bg flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="noise-overlay" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-md z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 mb-4 bg-white/90 backdrop-blur rounded-2xl shadow-sm p-4 flex items-center justify-center">
            <img src={atLogo} alt="AT Health Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">AT Health Portal</h1>
          <p className="text-sm text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <Card className="surface rounded-2xl p-6 md:p-8 shadow-xl">
          {networkMessage && (
             <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2 text-sm text-amber-900 animate-in fade-in slide-in-from-top-1">
                <Network className="h-4 w-4" />
                {networkMessage}
             </div>
          )}

          <div className="space-y-4">
            {step === "login" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground/80">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@athealth.co.uk"
                    className="h-11 bg-background"
                    autoComplete="email"
                  />
                  {invitedHint && (
                    <div className="text-xs text-muted-foreground">{invitedHint}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground/80">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 bg-background"
                    autoComplete="current-password"
                  />
                </div>

                <Button
                  className="h-11 w-full text-base font-medium mt-2"
                  disabled={!email.trim() || password.length < 6 || isLoading}
                  onClick={async () => {
                    setIsLoading(true);
                    setNetworkMessage(null);
                    try {
                      const res = await signIn({ email, password });
                      if (res.next === "mfa") {
                        setStep("mfa");
                        toast({ title: "OTP Sent", description: "Check your email (or console in dev)." });
                        if (res.message) setNetworkMessage(res.message);
                      }
                    } catch (e) {
                       toast({ title: "Access Denied", description: "Invalid credentials or not invited.", variant: "destructive" });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-4 text-center mb-6">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Enter Verification Code</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
                    </p>
                  </div>
                </div>

                <div className="flex justify-center py-2">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={setCode}
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <InputOTPSlot key={i} index={i} className="h-12 w-10 sm:h-14 sm:w-12 text-lg" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="flex items-start space-x-3 py-3 px-1">
                  <Checkbox 
                    id="trust" 
                    checked={trustDevice} 
                    onCheckedChange={(c) => setTrustDevice(!!c)}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="trust"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Trust this browser for 7 days
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Only enable this on devices you own.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 pt-2">
                  <Button
                    className="h-11 w-full text-base"
                    disabled={code.length !== 6 || isLoading}
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        const res = await signIn({ email, password, otp: code, trustDevice });
                        if (res.next === "staff-picker") setLocation("/pin");
                      } catch (e) {
                         toast({ title: "Invalid Code", variant: "destructive" });
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    Verify & Sign In
                  </Button>
                  <Button
                    variant="ghost"
                    className="h-11 w-full text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setStep("login");
                      setCode("");
                      setNetworkMessage(null);
                    }}
                  >
                    Back to Login
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>

        <div className="mt-8 text-center space-y-4">
           <div className="text-xs text-muted-foreground flex justify-center gap-4">
              <span>Secure Connection</span>
              <span>•</span>
              <span>Privacy Policy</span>
              <span>•</span>
              <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => setShowDev(!showDev)}>v0.4.3</span>
           </div>
           
           {showDev && (
             <motion.div 
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: "auto" }}
               className="mx-auto max-w-xs p-3 border rounded-lg bg-white/50 backdrop-blur-sm text-left"
             >
                <div className="font-mono text-xs font-bold mb-2">Dev: Network Simulation</div>
                <div className="flex gap-2">
                   <Input value={devIp} onChange={e => setDevIp(e.target.value)} className="h-8 font-mono text-xs bg-white" />
                   <Button size="sm" variant="outline" className="h-8" onClick={() => {
                      setSimulatedIp(devIp);
                      toast({ title: "IP Changed", description: `Simulated IP: ${devIp}` });
                   }}>Set</Button>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                   Current: {session.currentIp}
                </div>
             </motion.div>
           )}
        </div>
      </motion.div>
    </div>
  );
}
