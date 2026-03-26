import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";

export type Role = | "Pharmacy Login" | "Pharmacy Manager" | "Head Office Admin" | "Finance" | "Super Admin";
export type Scope = | { type: "pharmacy"; pharmacyId: "bowland" | "denton" | "wilmslow"; pharmacyName: string } | { type: "headoffice" };
export type StaffIdentity = { id: string; name: string; role: Role; };
export type UserAccount = { id: string; email: string; role: Role; scope: Scope; status: "active" | "locked"; };
export type TrustedBrowser = { id: string; userId: string; tokenHash: string; ipAddress: string; userAgent: string; createdAt: number; expiresAt: number; lastUsedAt: number; revokedAt: number | null; };

export type SessionState = {
  isAuthenticated: boolean;
  staffPinVerified: boolean;
  userEmail?: string;
  role?: Role;
  scope: Scope;
  staff?: StaffIdentity;
  pinAttemptsLeft: number;
  pinLockoutUntil: number | null;
  currentIp: string;
  lastLoginIp?: string;
};

type SignInInput = { email: string; password: string; otp?: string; trustDevice?: boolean; };
type SignInResult = { next: "mfa" | "staff-picker" | "scope-picker"; message?: string; };

type AuthContextValue = {
  session: SessionState;
  signIn: (input: SignInInput) => Promise<SignInResult>;
  signOut: (type?: "user" | "branch" | "full") => void;
  selectStaff: (staffId: string) => void;
  verifyStaffPin: (pin: string) => Promise<| { ok: true; staff: StaffIdentity } | { ok: false; attemptsLeft: number; lockedOut: boolean }>;
  availableStaff: StaffIdentity[];
  users: UserAccount[];
  inviteUser: (email: string, role: Role, scopeType: "headoffice" | "pharmacy", pharmacyId?: string) => void;
  deleteUser: (id: string) => void;
  trustedBrowsers: TrustedBrowser[];
  revokeTrustedBrowser: (id: string) => void;
  setSimulatedIp: (ip: string) => void;
  setMasterScope: (scope: Scope) => void;
  authMode: "mock" | "smtp";
  setAuthMode: (mode: "mock" | "smtp") => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DEFAULT_IP = "81.100.10.15";

const DEFAULT_SESSION: SessionState = {
  isAuthenticated: false,
  staffPinVerified: false,
  scope: { type: "pharmacy", pharmacyId: "bowland", pharmacyName: "Bowland Pharmacy" },
  pinAttemptsLeft: 3,
  pinLockoutUntil: null,
  currentIp: DEFAULT_IP,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
async function apiPost(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  const json = await res.json().catch(() => ({ error: res.statusText }));
  if (!res.ok) throw new Error(json?.error ?? "Request failed");
  return json;
}
async function apiGet(url: string) {
  const res = await fetch(url, { credentials: "include" });
  const json = await res.json().catch(() => ({ error: res.statusText }));
  if (!res.ok) throw new Error(json?.error ?? "Request failed");
  return json;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [trustedBrowsers, setTrustedBrowsers] = useState<TrustedBrowser[]>([]);
  const [currentIp, setCurrentIp] = useState(DEFAULT_IP);
  const [authMode, setAuthMode] = useState<"mock" | "smtp">("mock");
  const [availableStaff, setAvailableStaff] = useState<StaffIdentity[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const [session, setSession] = useState<SessionState>(() => {
    const saved = localStorage.getItem("auth_session");
    if (saved) {
      try { return { ...JSON.parse(saved), currentIp: DEFAULT_IP }; } catch {}
    }
    return DEFAULT_SESSION;
  });

  useEffect(() => { localStorage.setItem("auth_session", JSON.stringify(session)); }, [session]);
  useEffect(() => { setSession(s => ({ ...s, currentIp })); }, [currentIp]);

  // Reload staff whenever email changes
  useEffect(() => {
    if (!session.userEmail) return;
    apiGet(`/api/auth/staff?email=${encodeURIComponent(session.userEmail)}`)
      .then(staff => setAvailableStaff(staff ?? []))
      .catch(() => setAvailableStaff([]));
  }, [session.userEmail]);

  const signOut = useCallback((type: "user" | "branch" | "full" = "branch") => {
    if (type === "user") {
      setSession(s => ({ ...s, staffPinVerified: false, staff: undefined, pinAttemptsLeft: 3, pinLockoutUntil: null }));
      setSelectedStaffId(null);
    } else {
      setSession({ isAuthenticated: false, staffPinVerified: false, scope: { type: "pharmacy", pharmacyId: "bowland", pharmacyName: "Bowland Pharmacy" }, pinAttemptsLeft: 3, pinLockoutUntil: null, currentIp } as SessionState);
      localStorage.removeItem("auth_session");
      setSelectedStaffId(null);
    }
  }, [currentIp]);

  const inviteUser = useCallback((email: string, role: Role, scopeType: "headoffice" | "pharmacy", pharmacyId?: string) => {
    const PHARMACY_NAMES: Record<string, string> = { bowland: "Bowland Pharmacy", denton: "Denton Pharmacy", wilmslow: "Wilmslow Pharmacy" };
    setUsers(prev => [...prev, { id: `u${Date.now()}`, email, role, scope: scopeType === "pharmacy" && pharmacyId ? { type: "pharmacy", pharmacyId: pharmacyId as any, pharmacyName: PHARMACY_NAMES[pharmacyId] } : { type: "headoffice" }, status: "active" }]);
  }, []);

  const deleteUser = useCallback((id: string) => { setUsers(prev => prev.filter(u => u.id !== id)); }, []);
  const revokeTrustedBrowser = useCallback((id: string) => { setTrustedBrowsers(prev => prev.map(tb => tb.id === id ? { ...tb, revokedAt: Date.now() } : tb)); }, []);
  const setMasterScope = useCallback((scope: Scope) => { setSession(s => ({ ...s, scope })); }, []);
  const selectStaff = useCallback((staffId: string) => { setSelectedStaffId(staffId); }, []);

  const signIn = useCallback(async (input: SignInInput): Promise<SignInResult> => {
    // Step 1: Request OTP (or skip if OTP already provided)
    if (!input.otp) {
      const data = await apiPost("/api/auth/login", { email: input.email });
      // Store the email/role/scope in session while waiting for OTP
      setSession(s => ({ ...s, userEmail: input.email }));
      return { next: "mfa", message: data.message };
    }

    // Step 2: Verify OTP
    const data = await apiPost("/api/auth/verify-otp", {
      email: input.email,
      otp: input.otp,
      trustDevice: input.trustDevice ?? false,
    });

    const user = data.user;
    const pharmacy = user.pharmacy;
    const scope: Scope = user.scope_type === "headoffice"
      ? { type: "headoffice" }
      : { type: "pharmacy", pharmacyId: pharmacy?.slug ?? "bowland", pharmacyName: pharmacy?.name ?? "" };

    setSession(s => ({
      ...s,
      isAuthenticated: true,
      staffPinVerified: false,
      userEmail: user.email,
      role: user.role,
      scope,
      pinAttemptsLeft: 3,
      pinLockoutUntil: null,
      lastLoginIp: currentIp,
    }));

    return { next: "staff-picker" };
  }, [currentIp]);

  const verifyStaffPin = useCallback(async (pin: string) => {
    const now = Date.now();
    if (session.pinLockoutUntil && now < session.pinLockoutUntil) {
      return { ok: false as const, attemptsLeft: session.pinAttemptsLeft, lockedOut: true };
    }

    const staffToVerify = availableStaff.find(s => s.id === selectedStaffId) ?? availableStaff[0];
    if (!staffToVerify) return { ok: false as const, attemptsLeft: 3, lockedOut: false };

    try {
      const data = await apiPost("/api/auth/verify-pin", { staffId: staffToVerify.id, pin });
      if (!data.ok) {
        const nextAttempts = Math.max(0, session.pinAttemptsLeft - 1);
        const lockedOut = nextAttempts === 0;
        setSession(s => ({ ...s, pinAttemptsLeft: nextAttempts, pinLockoutUntil: lockedOut ? now + 10 * 60 * 1000 : null }));
        return { ok: false as const, attemptsLeft: nextAttempts, lockedOut };
      }

      const staff: StaffIdentity = { id: data.staff.id, name: data.staff.name, role: data.staff.role };
      setSession(s => ({ ...s, staffPinVerified: true, staff, pinAttemptsLeft: 3, pinLockoutUntil: null }));
      return { ok: true as const, staff };
    } catch {
      const nextAttempts = Math.max(0, session.pinAttemptsLeft - 1);
      const lockedOut = nextAttempts === 0;
      setSession(s => ({ ...s, pinAttemptsLeft: nextAttempts, pinLockoutUntil: lockedOut ? now + 10 * 60 * 1000 : null }));
      return { ok: false as const, attemptsLeft: nextAttempts, lockedOut };
    }
  }, [session.pinAttemptsLeft, session.pinLockoutUntil, availableStaff, selectedStaffId]);

  const value = useMemo<AuthContextValue>(() => ({
    session, signIn, signOut, verifyStaffPin, selectStaff, availableStaff,
    users, inviteUser, deleteUser, trustedBrowsers, revokeTrustedBrowser,
    setSimulatedIp: setCurrentIp, setMasterScope, authMode, setAuthMode,
  }), [session, signIn, signOut, verifyStaffPin, selectStaff, availableStaff, users, inviteUser, deleteUser, trustedBrowsers, currentIp, setMasterScope, authMode]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}
