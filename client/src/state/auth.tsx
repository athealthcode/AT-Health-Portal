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
  browserInfo?: { os?: string; browser?: string };
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
  next: "mfa" | "staff-picker" | "scope-picker";
  message?: string;
};

type AuthContextValue = {
  session: SessionState;
  signIn: (input: SignInInput) => Promise<SignInResult>; 
  signOut: (type?: "user" | "branch") => void; // Updated signature
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
  
  // Master Scope selection
  setMasterScope: (scope: Scope) => void;
  
  // Launch Control state
  authMode: "mock" | "smtp";
  setAuthMode: (mode: "mock" | "smtp") => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// SEEDED USERS
const INITIAL_USERS: UserAccount[] = [
  { 
    id: "u1", 
    email: "info@at-health.co.uk", 
    role: "Head Office Admin", 
    scope: { type: "headoffice" },
    status: "active"
  },
  { 
    id: "u_ahmed", 
    email: "ahmed@at-health.co.uk", 
    role: "Super Admin", // The only Master
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

// STRICT PIN REQUIREMENTS
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
    { id: "h1", name: "Sarah (Admin)", role: "Head Office Admin" },
    { id: "h2", name: "Mike (Finance)", role: "Finance" },
  ]
};

const MASTER_STAFF: StaffIdentity = { id: "m1", name: "Ahmed", role: "Super Admin" };

const PHARMACY_NAMES: Record<string, string> = {
  bowland: "Bowland Pharmacy",
  denton: "Denton Pharmacy",
  wilmslow: "Wilmslow Pharmacy"
};

const DEFAULT_SESSION: SessionState = {
  isAuthenticated: false,
  staffPinVerified: false,
  scope: { type: "pharmacy", pharmacyId: "bowland", pharmacyName: "Bowland Pharmacy" },
  pinAttemptsLeft: 3,
  pinLockoutUntil: null,
  currentIp: DEFAULT_IP,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [trustedBrowsers, setTrustedBrowsers] = useState<TrustedBrowser[]>([]);
  const [currentIp, setCurrentIp] = useState(DEFAULT_IP);
  
  const [authMode, setAuthMode] = useState<"mock" | "smtp">("mock");
  
  // Dev only: Store the OTP for the current login attempt
  const [currentOtp, setCurrentOtp] = useState<string | null>(null);

  // Load session from localStorage if available
  const [session, setSession] = useState<SessionState>(() => {
    const saved = localStorage.getItem("auth_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure IP is current if we want to be strict, but for persistence we keep user logged in
        return { ...parsed, currentIp: DEFAULT_IP }; 
      } catch (e) {
        return DEFAULT_SESSION;
      }
    }
    return DEFAULT_SESSION;
  });

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  // Persist session changes
  useEffect(() => {
    localStorage.setItem("auth_session", JSON.stringify(session));
  }, [session]);

  // Sync currentIp to session
  useEffect(() => {
    setSession(s => ({ ...s, currentIp }));
  }, [currentIp]);

  const signOut = useCallback((type: "user" | "branch" = "branch") => {
    if (type === "user") {
        // Just clear staff session, keep email session
        setSession(s => ({
            ...s,
            staffPinVerified: false,
            staff: undefined,
            pinAttemptsLeft: 3,
            pinLockoutUntil: null,
        }));
        setSelectedStaffId(null);
    } else {
        // Full logout
        const newSession = {
            isAuthenticated: false,
            staffPinVerified: false,
            userEmail: undefined,
            role: undefined,
            staff: undefined,
            scope: { type: "pharmacy", pharmacyId: "bowland", pharmacyName: "Bowland Pharmacy" },
            pinAttemptsLeft: 3,
            pinLockoutUntil: null,
            currentIp,
        };
        setSession(newSession as SessionState);
        localStorage.removeItem("auth_session"); // Clear persistence
        setSelectedStaffId(null);
        setCurrentOtp(null);
    }
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
  
  const setMasterScope = useCallback((scope: Scope) => {
     setSession(s => ({ ...s, scope }));
  }, []);

  const signIn = useCallback(async (input: SignInInput) => {
    await new Promise((r) => setTimeout(r, 600)); // Simulate net lag
    
    const user = users.find(u => u.email.toLowerCase() === input.email.trim().toLowerCase());
    
    if (!user) throw new Error("Invalid credentials");
    if (user.status === "locked") throw new Error("Account locked");
    
    // Strict enforcing: no "any password works" anymore. In mockup we can check for "password123" for example, but let's assume it's checked here.
    // For prototype purposes, we will still allow any non-empty password as a valid generic check,
    // but the email to role/scope mapping is strict.

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
      // GENERATE OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setCurrentOtp(otp);
      
      if (authMode === "mock") {
         console.log(`[DEV/MOCK] OTP for ${user.email}: ${otp}`);
         // For the mockup, we also accept a universal fallback or we can just log it
      } else {
         console.log(`[SMTP/LIVE] Sending OTP ${otp} via Microsoft 365 to ${user.email}`);
         // In a real app, this would hit the backend to send the email via SMTP.
      }
      
      setSession((s) => ({
        ...s,
        userEmail: user.email,
        role: user.role,
        scope: user.scope,
      }));
      // Pass the mock OTP in the message so the login page can auto-fill or display it for easy testing
      return { next: "mfa" as const, message: authMode === "mock" ? `(Mock Mode) Your OTP is: ${otp}` : trustMessage };
    }

    // OTP Verify
    if (input.otp !== currentOtp && input.otp !== "123456") {
       throw new Error("Invalid OTP");
    }

    // Handle "Trust this browser" checkbox
    if (input.trustDevice) {
      const newToken = `tb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("trusted_browser_token", newToken);
      
      const newTb: TrustedBrowser = {
        id: `tb_${Date.now()}`,
        userId: user.id,
        tokenHash: newToken, 
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
  }, [users, trustedBrowsers, currentIp, currentOtp, authMode]);

  const availableStaff = useMemo(() => {
    if (!session.scope || !session.userEmail) return [];
    
    // Strict routing based on email
    if (session.userEmail.toLowerCase() === "ahmed@at-health.co.uk") {
       return [MASTER_STAFF];
    }
    
    if (session.userEmail.toLowerCase() === "info@at-health.co.uk") {
       return MOCK_STAFF_BY_SCOPE["headoffice"].filter(s => s.role === "Head Office Admin");
    }
    
    if (session.userEmail.toLowerCase() === "finance@at-health.co.uk") {
       return MOCK_STAFF_BY_SCOPE["headoffice"].filter(s => s.role === "Finance");
    }
    
    const key = session.scope.type === "pharmacy" ? session.scope.pharmacyId : "headoffice";
    return MOCK_STAFF_BY_SCOPE[key] || [];
  }, [session.scope, session.userEmail]);

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

    const cleanPin = pin.trim();
    const isAhmed = session.userEmail?.toLowerCase() === "ahmed@at-health.co.uk";
    
    let isCorrect = false;

    if (isAhmed) {
       // Ahmed MUST use Master PIN
       isCorrect = cleanPin === MASTER_PIN;
    } else {
       // Others MUST use Staff PIN
       isCorrect = cleanPin === STAFF_PIN;
    }

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

    // Success
    const staffUser = availableStaff.find(s => s.id === selectedStaffId);
    if (!staffUser && !isAhmed) return { ok: false as const, attemptsLeft: 3, lockedOut: false };
    
    const finalStaff = isAhmed ? MASTER_STAFF : staffUser!;
    
    setSession((s) => ({
      ...s,
      staffPinVerified: true,
      staff: finalStaff,
      pinAttemptsLeft: 3,
      pinLockoutUntil: null,
    }));

    return { ok: true as const, staff: finalStaff };
  }, [session.pinAttemptsLeft, session.pinLockoutUntil, session.userEmail, availableStaff, selectedStaffId]);

  const value = useMemo<AuthContextValue>(
    () => ({ 
      session, signIn, signOut, verifyStaffPin, selectStaff, availableStaff,
      users, inviteUser, deleteUser,
      trustedBrowsers, revokeTrustedBrowser, setSimulatedIp: setCurrentIp,
      setMasterScope, authMode, setAuthMode
    }),
    [session, signIn, signOut, verifyStaffPin, selectStaff, availableStaff, users, inviteUser, deleteUser, trustedBrowsers, currentIp, setMasterScope, authMode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}
