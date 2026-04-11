import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ArrowLeft } from "lucide-react";
import atLogo from "@/assets/at-health-logo.png";

const ROLES = [
  { value: "pharmacist", label: "Pharmacist" },
  { value: "pharmacy_technician", label: "Pharmacy Technician" },
  { value: "dispenser", label: "Dispenser" },
  { value: "pharmacy_manager", label: "Pharmacy Manager" },
  { value: "pharmacy_staff", label: "Other Pharmacy Staff" },
];

export default function RegisterRequest() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [roleRequested, setRoleRequested] = useState("pharmacy_staff");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isValid = fullName.trim().length > 1 && email.includes("@");

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/register-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          pharmacy_name: pharmacyName.trim() || null,
          role_requested: roleRequested,
          message: message.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Submission failed");
      }
      setSubmitted(true);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={atLogo} alt="AT Health" className="h-12 w-auto" />
          </div>

          <Card className="p-8 shadow-xl border border-border/60">
            {submitted ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
                <h2 className="font-serif text-2xl tracking-tight">Request Submitted</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Your account request has been sent to the AT Health team. You will receive an email once your access has been reviewed.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 w-full"
                  onClick={() => setLocation("/login")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="font-serif text-2xl tracking-tight">Request Access</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Submit your details and a member of the AT Health team will review your request.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="full-name">Full Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="full-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Smith"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@pharmacy.co.uk"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07700 900000"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pharmacy">Pharmacy Name</Label>
                    <Input
                      id="pharmacy"
                      value={pharmacyName}
                      onChange={(e) => setPharmacyName(e.target.value)}
                      placeholder="e.g. AT Health Holloway"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select value={roleRequested} onValueChange={setRoleRequested}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message">Additional Notes</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Any additional context for your request..."
                      rows={3}
                      className="resize-none"
                    />
                  </div>

                  <Button
                    className="h-11 w-full text-base font-medium mt-2"
                    disabled={!isValid || isLoading}
                    onClick={handleSubmit}
                  >
                    {isLoading ? "Submitting..." : "Submit Request"}
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => setLocation("/login")}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </div>
              </>
            )}
          </Card>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <button
              className="underline hover:text-foreground transition-colors"
              onClick={() => setLocation("/login")}
            >
              Sign in
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
