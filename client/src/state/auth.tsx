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

type StaffIdentity = {
  id: string;
  name: string;
  role: Role;
};

export type SessionState = {
  isAuthenticated: boolean;
  staffPinVerified: boolean;
  userEmail?: string;
  role?: Role;
  scope: Scope;

  staff?: StaffIdentity;

  pinAttemptsLeft: number;
  pinLockoutUntil: number | null;

  trustedDevice: boolean;
};

type SignInInput = {
  email: string;
  password: string;
  totp?: string;
};

type AuthContextValue = {
  session: SessionState;
  signIn: (input: SignInInput) => Promise<{ next: "mfa" | "pin" }>; 
  signOut: () => void;
  verifyStaffPin: (
    pin: string,
  ) => Promise<
    | { ok: true; staff: StaffIdentity }
    | { ok: false; attemptsLeft: number; lockedOut: boolean }
  >;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>({
    isAuthenticated: false,
    staffPinVerified: false,
    scope: { type: "pharmacy", pharmacyId: "bowland", pharmacyName: "Bowland Pharmacy" },
    pinAttemptsLeft: 3,
    pinLockoutUntil: null,
    trustedDevice: true,
  });

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
      trustedDevice: false,
    });
  }, []);

  const signIn = useCallback(async (input: SignInInput) => {
    await new Promise((r) => setTimeout(r, 500));
    if (!isInvited(input.email)) throw new Error("Not invited");

    const { role, scope } = roleFor(input.email);

    if (!input.totp) {
      setSession((s) => ({
        ...s,
        isAuthenticated: true,
        staffPinVerified: false,
        userEmail: input.email,
        role,
        scope,
        pinAttemptsLeft: 3,
        pinLockoutUntil: null,
        trustedDevice: true,
      }));
      return { next: "mfa" as const };
    }

    setSession((s) => ({
      ...s,
      isAuthenticated: true,
      staffPinVerified: false,
      userEmail: input.email,
      role,
      scope,
      pinAttemptsLeft: 3,
      pinLockoutUntil: null,
      trustedDevice: true,
    }));
    return { next: "pin" as const };
  }, []);

  const verifyStaffPin = useCallback(async (pin: string) => {
    await new Promise((r) => setTimeout(r, 350));

    setSession((s) => {
      if (s.pinLockoutUntil && Date.now() < s.pinLockoutUntil) return s;
      return s;
    });

    const now = Date.now();

    if (session.pinLockoutUntil && now < session.pinLockoutUntil) {
      return { ok: false as const, attemptsLeft: session.pinAttemptsLeft, lockedOut: true };
    }

    if (pin !== STAFF_PIN) {
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

    const staff: StaffIdentity = {
      id: "staff_001",
      name: "Sarah Ahmed",
      role: session.role ?? "Pharmacy Login",
    };

    setSession((s) => ({
      ...s,
      staffPinVerified: true,
      staff,
      pinAttemptsLeft: 3,
      pinLockoutUntil: null,
    }));

    return { ok: true as const, staff };
  }, [session.pinAttemptsLeft, session.pinLockoutUntil, session.role]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, signIn, signOut, verifyStaffPin }),
    [session, signIn, signOut, verifyStaffPin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}
