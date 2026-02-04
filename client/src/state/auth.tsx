import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";

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

export type TrustedBrowser = {
  id: string;
  userId: string;
  tokenHash: string; // simulating hash storage
  ipAddress: string;
  userAgent: string;
  createdAt: number;
  expiresAt: number;
  lastUsedAt: number;
  revokedAt: number | null;
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
  currentIp: string;
  lastLoginIp?: string;
};

type SignInInput = {
  email: string;
  password: string;
  otp?: string;
  trustDevice?: boolean;
};

type SignInResult = {
  next: "mfa" | "staff-picker";
  message?: string;
};

type AuthContextValue = {
  session: SessionState;
  signIn: (input: SignInInput) => Promise<SignInResult>; 
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
  
  // Trusted Browser Management
  trustedBrowsers: TrustedBrowser[];
  revokeTrustedBrowser: (id: string) => void;
  setSimulatedIp: (ip: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// SEEDED USERS
const INITIAL_USERS: UserAccount[] = [
  { 
    id: "u1", 
    email: "info@at-health.co.uk", 
    role: "Super Admin", 
    scope: { type: "headoffice" },
    status: "active"
  },
  { 
    id: "u2", 
    email: "finance@at-health.co.uk", 
    role: "Finance", 
    scope: { type: "headoffice" },
    status: "active"
  },
  { 
    id: "u3", 
    email: "info@bowlandpharmacy.co.uk", 
    role: "Pharmacy Login", 
    scope: { type: "pharmacy", pharmacyId: "bowland", pharmacyName: "Bowland Pharmacy" },
    status: "active"
  },
  { 
    id: "u4", 
    email: "info@dentonpharmacy.co.uk", 
    role: "Pharmacy Login", 
    scope: { type: "pharmacy", pharmacyId: "denton", pharmacyName: "Denton Pharmacy" },
    status: "active"
  },
  {
    id: "u5",
    email: "info@wilmslowpharmacy.co.uk", 
    role: "Pharmacy Login", 
    scope: { type: "pharmacy", pharmacyId: "wilmslow", pharmacyName: "Wilmslow Pharmacy" },
    status: "active"
  }
];

const STAFF_PIN = "1234";
const MASTER_PIN = "145891";
const DEFAULT_IP = "81.100.10.15";

const MOCK_STAFF_BY_SCOPE: Record<string, StaffIdentity[]> = {
  bowland: [
    { id: "b1", name: "John Smith", role: "Pharmacy Manager" },
    { id: "b2", name: "Barbara Thompson", role: "Pharmacy Login" },
  ],
  denton: [
    { id: "d1", name: "Dan Denton", role: "Pharmacy Manager" },
    { id: "d2", name: "Alice Denton", role: "Pharmacy Login" },
  ],
  wilmslow: [
    { id: "w1", name: "Will Wilmslow", role: "Pharmacy Manager" },
    { id: "w2", name: "Wendy Wilmslow", role: "Pharmacy Login" },
  ],
  headoffice: [
    { id: "h1", name: "Master User", role: "Super Admin" },
    { id: "h2", name: "Finance User", role: "Finance" },
  ]
};

const PHARMACY_NAMES: Record<string, string> = {
  bowland: "Bowland Pharmacy",
  denton: "Denton Pharmacy",
  wilmslow: "Wilmslow Pharmacy"
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [trustedBrowsers, setTrustedBrowsers] = useState<TrustedBrowser[]>([]);
  const [currentIp, setCurrentIp] = useState(DEFAULT_IP);
  
  const [session, setSession] = useState<SessionState>({
    isAuthenticated: false,
    staffPinVerified: false,
    scope: { type: "pharmacy", pharmacyId: "bowland", pharmacyName: "Bowland Pharmacy" },
    pinAttemptsLeft: 3,
    pinLockoutUntil: null,
    currentIp: DEFAULT_IP,
  });

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  // Sync currentIp to session
  useEffect(() => {
    setSession(s => ({ ...s, currentIp }));
  }, [currentIp]);

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
      currentIp,
    });
    setSelectedStaffId(null);
  }, [currentIp]);

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

  const revokeTrustedBrowser = useCallback((id: string) => {
    setTrustedBrowsers(prev => prev.map(tb => 
      tb.id === id ? { ...tb, revokedAt: Date.now() } : tb
    ));
  }, []);

  const signIn = useCallback(async (input: SignInInput) => {
    await new Promise((r) => setTimeout(r, 600)); // Simulate net lag
    
    const user = users.find(u => u.email.toLowerCase() === input.email.trim().toLowerCase());
    
    if (!user) throw new Error("Invalid credentials");
    if (user.status === "locked") throw new Error("Account locked");

    // Check Trusted Browser Cookie
    const storedToken = localStorage.getItem("trusted_browser_token");
    let trustVerified = false;
    let trustMessage = undefined;

    if (!input.otp && storedToken) {
      const tb = trustedBrowsers.find(t => t.tokenHash === storedToken && t.userId === user.id);
      
      if (tb) {
        if (tb.revokedAt) {
          // Revoked
        } else if (Date.now() > tb.expiresAt) {
          // Expired
        } else if (tb.ipAddress !== currentIp) {
           trustMessage = "OTP required because network changed";
        } else {
           // Trusted!
           trustVerified = true;
           // Rotate token (simulated by updating lastUsed)
           // In real app we'd issue new token here
           setTrustedBrowsers(prev => prev.map(t => 
             t.id === tb.id ? { ...t, lastUsedAt: Date.now() } : t
           ));
        }
      }
    }

    // If trusted, skip OTP
    if (trustVerified) {
       setSession((s) => ({
        ...s,
        isAuthenticated: true,
        staffPinVerified: false,
        userEmail: user.email,
        role: user.role,
        scope: user.scope,
        pinAttemptsLeft: 3,
        pinLockoutUntil: null,
        lastLoginIp: currentIp,
      }));
      return { next: "staff-picker" as const };
    }
    
    // Step 2: MFA (Email OTP) check
    if (!input.otp) {
      setSession((s) => ({
        ...s,
        userEmail: user.email,
        role: user.role,
        scope: user.scope,
      }));
      return { next: "mfa" as const, message: trustMessage };
    }

    // OTP Provided & Valid (simulated)
    // Handle "Trust this browser" checkbox
    if (input.trustDevice) {
      const newToken = `tb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("trusted_browser_token", newToken);
      
      const newTb: TrustedBrowser = {
        id: `tb_${Date.now()}`,
        userId: user.id,
        tokenHash: newToken, // Storing raw token as "hash" for mockup simplicity
        ipAddress: currentIp,
        userAgent: navigator.userAgent,
        createdAt: Date.now(),
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
        lastUsedAt: Date.now(),
        revokedAt: null
      };
      setTrustedBrowsers(prev => [...prev, newTb]);
    }

    setSession((s) => ({
      ...s,
      isAuthenticated: true,
      staffPinVerified: false,
      userEmail: user.email,
      role: user.role,
      scope: user.scope,
      pinAttemptsLeft: 3,
      pinLockoutUntil: null,
      lastLoginIp: currentIp,
    }));
    return { next: "staff-picker" as const };
  }, [users, trustedBrowsers, currentIp]);

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

    // Master PIN bypasses all checks except if trusted cookie + IP match required?
    // Requirement 6: "Master still requires OTP unless trusted cookie+IP match within 7 days."
    // This logic is handled at Login (MFA) stage. 
    // This function `verifyStaffPin` is for the STAFF PIN (User identification), not the Account Login.
    // So normal PIN logic applies here.
    
    const isMaster = pin === MASTER_PIN;
    const isCorrect = pin === STAFF_PIN || isMaster;

    if (!isCorrect) {
      const nextAttempts = Math.max(0, session.pinAttemptsLeft - 1);
      const lockedOut = nextAttempts === 0;
      const lockoutUntil = lockedOut ? now + 10 * 60 * 1000 : null;

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
      users, inviteUser, deleteUser,
      trustedBrowsers, revokeTrustedBrowser, setSimulatedIp: setCurrentIp
    }),
    [session, signIn, signOut, verifyStaffPin, selectStaff, availableStaff, users, inviteUser, deleteUser, trustedBrowsers, currentIp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}
