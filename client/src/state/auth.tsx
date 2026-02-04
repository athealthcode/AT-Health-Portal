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

export type UserAccount = {
  id: string;
  email: string;
  role: Role;
  scope: Scope;
  status: "active" | "locked";
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
  
  // User Management
  users: UserAccount[];
  inviteUser: (email: string, role: Role, scopeType: "headoffice" | "pharmacy", pharmacyId?: string) => void;
  deleteUser: (id: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const INITIAL_USERS: UserAccount[] = [
  { 
    id: "u1", 
    email: "helen.carter@athealth.co.uk", 
    role: "Head Office Admin", 
    scope: { type: "headoffice" },
    status: "active"
  },
  { 
    id: "u2", 
    email: "finance@athealth.co.uk", 
    role: "Finance", 
    scope: { type: "headoffice" },
    status: "active"
  },
  { 
    id: "u3", 
    email: "sarah.ahmed@athealth.co.uk", 
    role: "Pharmacy Manager", 
    scope: { type: "pharmacy", pharmacyId: "bowland", pharmacyName: "Bowland Pharmacy" },
    status: "active"
  },
  { 
    id: "u4", 
    email: "james.miller@athealth.co.uk", 
    role: "Pharmacy Login", 
    scope: { type: "pharmacy", pharmacyId: "denton", pharmacyName: "Denton Pharmacy" },
    status: "active"
  },
  {
    id: "u5",
    email: "wilmslow.manager@athealth.co.uk",
    role: "Pharmacy Manager",
    scope: { type: "pharmacy", pharmacyId: "wilmslow", pharmacyName: "Wilmslow Pharmacy" },
    status: "active"
  },
  {
    id: "u6",
    email: "external.auditor@example.com",
    role: "Finance",
    scope: { type: "headoffice" },
    status: "active"
  }
];

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
    { id: "w2", name: "Duty Pharmacist", role: "Pharmacy Login" },
  ],
  headoffice: [
    { id: "h1", name: "Helen Carter", role: "Head Office Admin" },
    { id: "h2", name: "Finance Team", role: "Finance" },
    { id: "h3", name: "Super Admin", role: "Super Admin" },
  ]
};

const PHARMACY_NAMES: Record<string, string> = {
  bowland: "Bowland Pharmacy",
  denton: "Denton Pharmacy",
  wilmslow: "Wilmslow Pharmacy"
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  
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

  const inviteUser = useCallback((email: string, role: Role, scopeType: "headoffice" | "pharmacy", pharmacyId?: string) => {
    setUsers(prev => [
      ...prev,
      {
        id: `u${Date.now()}`,
        email,
        role,
        scope: scopeType === "pharmacy" && pharmacyId 
          ? { type: "pharmacy", pharmacyId: pharmacyId as any, pharmacyName: PHARMACY_NAMES[pharmacyId] } 
          : { type: "headoffice" },
        status: "active"
      }
    ]);
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  const signIn = useCallback(async (input: SignInInput) => {
    await new Promise((r) => setTimeout(r, 600)); // Simulate net lag
    
    const user = users.find(u => u.email.toLowerCase() === input.email.trim().toLowerCase());
    
    if (!user) throw new Error("Invalid credentials");
    if (user.status === "locked") throw new Error("Account locked");

    // Step 1: Email + Password check (simulated - accepts any password > 6 chars for mockup)
    // In real app, we'd verify password hash here.
    
    // Step 2: MFA (Email OTP) check
    if (!input.otp) {
      // If no OTP provided, ask for it
      setSession((s) => ({
        ...s,
        userEmail: user.email,
        role: user.role,
        scope: user.scope,
      }));
      return { next: "mfa" as const };
    }

    // If OTP provided (simulated check)
    setSession((s) => ({
      ...s,
      isAuthenticated: true, // Email+Pass+OTP done
      staffPinVerified: false,
      userEmail: user.email,
      role: user.role,
      scope: user.scope,
      pinAttemptsLeft: 3,
      pinLockoutUntil: null,
      lastLoginIp: "81.100.10.15", // Simulated Allowlisted IP
    }));
    return { next: "staff-picker" as const };
  }, [users]);

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
    () => ({ 
      session, signIn, signOut, verifyStaffPin, selectStaff, availableStaff,
      users, inviteUser, deleteUser 
    }),
    [session, signIn, signOut, verifyStaffPin, selectStaff, availableStaff, users, inviteUser, deleteUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}
