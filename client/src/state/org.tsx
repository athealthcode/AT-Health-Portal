import React, { createContext, useContext, useState, useEffect } from "react";

export type ModuleToggles = {
  testMode: boolean;
  dailyFigures: boolean;
  cashingUp: boolean;
  banking: boolean;
  bookkeeping: boolean;
  bonusPerformance: boolean;
  pqs: boolean;
  sopAcknowledgements: boolean;
  exceptions: boolean;
  launchControl: boolean;
  monthlyClose: boolean;
  bankingReconciliation: boolean;
  targets: boolean;
  privateClinic: boolean;
  reports: boolean;
  documents: boolean;
};

export type OrgSettings = {
  name: string;
  primaryColor: string;
  accentColor: string;
  customDomain: string;
  emailSender: string;
  tier: string;
  logoUrl?: string;
};

type OrgContextValue = {
  settings: OrgSettings;
  setSettings: (s: Partial<OrgSettings>) => void;
  modules: ModuleToggles;
  setModules: (m: Partial<ModuleToggles>) => void;
};

const OrgContext = createContext<OrgContextValue | null>(null);

function hexToHslString(hex: string) {
  // Simple approximation or just return the hex if we can't easily convert.
  // Tailwind uses HSL components like "222.2 47.4% 11.2%"
  // Let's just do a very basic conversion or stick to the original if it's too complex.
  // Actually, we can just inject hex directly into a CSS variable and use it.
  return hex;
}

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<OrgSettings>({
    name: "AT Health",
    primaryColor: "#0f172a", // Default slate-900
    accentColor: "#3b82f6",  // Default blue-500
    customDomain: "portal.at-health.co.uk",
    emailSender: "AT Health Portal",
    tier: "Enterprise",
  });

  const [modules, setModulesState] = useState<ModuleToggles>({
    testMode: true,
    dailyFigures: true,
    cashingUp: true,
    banking: true,
    bookkeeping: true,
    bonusPerformance: true,
    pqs: true,
    sopAcknowledgements: true,
    exceptions: true,
    launchControl: true,
    monthlyClose: true,
    bankingReconciliation: true,
    targets: true,
    privateClinic: true,
    reports: true,
    documents: true,
  });

  const setSettings = (s: Partial<OrgSettings>) => setSettingsState(prev => ({ ...prev, ...s }));
  const setModules = (m: Partial<ModuleToggles>) => setModulesState(prev => ({ ...prev, ...m }));

  // Dynamic branding injection (simplified)
  useEffect(() => {
     // We can update document title
     document.title = `${settings.name} Portal`;
  }, [settings.name]);

  return (
    <OrgContext.Provider value={{ settings, setSettings, modules, setModules }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used within OrgProvider");
  return ctx;
}
