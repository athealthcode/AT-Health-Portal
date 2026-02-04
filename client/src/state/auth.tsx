import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Role =
  | "Pharmacy Login"
  | "Pharmacy Manager"
  | "Head Office Admin"
  | "Finance"
  | "Super Admin";

export type Scope =
  | { type: "pharmacy"; pharmacyId: "bowland" | "denton" | "wilmslow"; pharmacyName: string }
  | { type: "headoffice" };

export type StaffIdentity = {
  id: string;
  name: string;
  role: Role;
};

export type SessionState = {
  isAuthenticated: boolean; // Email + Password + MFA passed
  staffPinVerified: boolean; // Staff PIN passed
  userEmail?: string;
  role?: Role;
  scope: Scope;

  staff?: StaffIdentity; // The selected staff member

  pinAttemptsLeft: number;
  pinLockoutUntil: number | null;
  
  // Audit simulation
  lastLoginIp?: string;
};

type SignInInput = {
  email: string;
  password: string;
  otp?: string;
};

type AuthContextValue = {
  session: SessionState;
  signIn: (input: SignInInput) => Promise<{ next: "mfa" | "staff-picker" }>; 
  signOut: () => void;
  selectStaff: (staffId: string) => void;
  verifyStaffPin: (
    pin: string,
  ) => Promise<
    | { ok: true; staff: StaffIdentity }
    | { ok: false; attemptsLeft: number; lockedOut: boolean }
  >;
  availableStaff: StaffIdentity[];
};

const AuthContext = createContext<AuthContextValue | null>(null);

function isInvited(email: string) {
  const e = email.trim().toLowerCase();
  return (
    e === "helen.carter@athealth.co.uk" ||
    e === "finance@athealth.co.uk" ||
    e === "sarah.ahmed@athealth.co.uk" ||
    e === "james.miller@athealth.co.uk" ||
    e === "external.auditor@example.com"
  );
}

function roleFor(email: string): { role: Role; scope: Scope } {
  const e = email.trim().toLowerCase();
  if (e === "helen.carter@athealth.co.uk") return { role: "Head Office Admin", scope: { type: "headoffice" } };
  if (e === "finance@athealth.co.uk") return { role: "Finance", scope: { type: "headoffice" } };
  if (e === "external.auditor@example.com") return { role: "Finance", scope: { type: "headoffice" } };
  if (e === "sarah.ahmed@athealth.co.uk")
    return { role: "Pharmacy Manager", scope: { type: "pharmacy", pharmacyId: "bowland", pharmacyName: "Bowland Pharmacy" } };
  return { role: "Pharmacy Login", scope: { type: "pharmacy", pharmacyId: "denton", pharmacyName: "Denton Pharmacy" } };
}

const STAFF_PIN = "1234";
const MASTER_PIN = "145891";

const MOCK_STAFF_BY_SCOPE: Record<string, StaffIdentity[]> = {
  bowland: [
    { id: "s1", name: "Sarah Ahmed", role: "Pharmacy Manager" },
    { id: "s2", name: "Duty Pharmacist", role: "Pharmacy Login" },
    { id: "s3", name: "Dispenser 1", role: "Pharmacy Login" },
  ],
  denton: [
    { id: "d1", name: "James Miller", role: "Pharmacy Login" },
    { id: "d2", name: "Denton Manager", role: "Pharmacy Manager" },
  ],
  wilmslow: [
    { id: "w1", name: "Wilmslow Manager", role: "Pharmacy Manager" },
  ],
  headoffice: [
    { id: "h1", name: "Helen Carter", role: "Head Office Admin" },
    { id: "h2", name: "Finance Team", role: "Finance" },
    { id: "h3", name: "Super Admin", role: "Super Admin" },
  ]
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>({
    isAuthenticated: false,
    staffPinVerified: false,
    scope: { type: "pharmacy", pharmacyId: "bowland", pharmacyName: "Bowland Pharmacy" },
    pinAttemptsLeft: 3,
    pinLockoutUntil: null,
  });

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const signOut = useCallback(() => {
    setSession({
      isAuthenticated: false,
      staffPinVerified: false,
      userEmail: undefined,
      role: undefined,
      staff: undefined,
      scope: { type: "pharmacy", pharmacyId: "bowland", pharmacyName: "Bowland Pharmacy" },
      pinAttemptsLeft: 3,
      pinLockoutUntil: null,
    });
    setSelectedStaffId(null);
  }, []);

  const signIn = useCallback(async (input: SignInInput) => {
    await new Promise((r) => setTimeout(r, 600)); // Simulate net lag
    if (!isInvited(input.email)) throw new Error("Not invited");

    const { role, scope } = roleFor(input.email);

    // Step 1: Email + Password check (simulated)
    // In real app, we'd verify password hash here.
    
    // Step 2: MFA (Email OTP) check
    if (!input.otp) {
      // If no OTP provided, ask for it
      setSession((s) => ({
        ...s,
        userEmail: input.email,
        role,
        scope,
      }));
      return { next: "mfa" as const };
    }

    // If OTP provided (simulated check)
    setSession((s) => ({
      ...s,
      isAuthenticated: true, // Email+Pass+OTP done
      staffPinVerified: false,
      userEmail: input.email,
      role,
      scope,
      pinAttemptsLeft: 3,
      pinLockoutUntil: null,
      lastLoginIp: "81.100.10.15", // Simulated Allowlisted IP
    }));
    return { next: "staff-picker" as const };
  }, []);

  const availableStaff = useMemo(() => {
    if (!session.scope) return [];
    const key = session.scope.type === "pharmacy" ? session.scope.pharmacyId : "headoffice";
    return MOCK_STAFF_BY_SCOPE[key] || [];
  }, [session.scope]);

  const selectStaff = useCallback((staffId: string) => {
    setSelectedStaffId(staffId);
  }, []);

  const verifyStaffPin = useCallback(async (pin: string) => {
    await new Promise((r) => setTimeout(r, 400));

    setSession((s) => {
      if (s.pinLockoutUntil && Date.now() < s.pinLockoutUntil) return s;
      return s;
    });

    const now = Date.now();
    if (session.pinLockoutUntil && now < session.pinLockoutUntil) {
      return { ok: false as const, attemptsLeft: session.pinAttemptsLeft, lockedOut: true };
    }

    const isMaster = pin === MASTER_PIN;
    const isCorrect = pin === STAFF_PIN || isMaster;

    if (!isCorrect) {
      const nextAttempts = Math.max(0, session.pinAttemptsLeft - 1);
      const lockedOut = nextAttempts === 0;
      const lockoutUntil = lockedOut ? now + 10 * 60 * 1000 : null; // 10 min lockout

      setSession((s) => ({
        ...s,
        pinAttemptsLeft: nextAttempts,
        pinLockoutUntil: lockoutUntil,
      }));

      return { ok: false as const, attemptsLeft: nextAttempts, lockedOut };
    }

    const staffUser = availableStaff.find(s => s.id === selectedStaffId);
    if (!staffUser) return { ok: false as const, attemptsLeft: 3, lockedOut: false };

    // If master PIN used, override role to Super Admin for this session if needed, 
    // or just log it. For now, we just allow entry.
    
    setSession((s) => ({
      ...s,
      staffPinVerified: true,
      staff: staffUser,
      pinAttemptsLeft: 3,
      pinLockoutUntil: null,
    }));

    return { ok: true as const, staff: staffUser };
  }, [session.pinAttemptsLeft, session.pinLockoutUntil, availableStaff, selectedStaffId]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, signIn, signOut, verifyStaffPin, selectStaff, availableStaff }),
    [session, signIn, signOut, verifyStaffPin, selectStaff, availableStaff],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}
