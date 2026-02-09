import { useState, useEffect } from "react";
import { useAuth } from "@/state/auth";

// Simple hook to track submitted days per pharmacy
// Stored in localStorage for persistence across reloads in this mockup
export function useSubmittedDays(type: "figures" | "cashing-up") {
  const { session } = useAuth();
  const pharmacyId = session.scope.type === "pharmacy" ? session.scope.pharmacyId : "headoffice";
  
  const getKey = () => `submitted_${type}_${pharmacyId}`;

  const [submittedDates, setSubmittedDays] = useState<Record<string, { timestamp: number, user: string }>>({});

  useEffect(() => {
    const stored = localStorage.getItem(getKey());
    if (stored) {
      try {
        setSubmittedDays(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse submitted days", e);
      }
    }
  }, [pharmacyId, type]);

  const markSubmitted = (dateStr: string, user: string) => {
    const newItem = { [dateStr]: { timestamp: Date.now(), user } };
    setSubmittedDays(prev => {
      const next = { ...prev, ...newItem };
      localStorage.setItem(getKey(), JSON.stringify(next));
      return next;
    });
  };

  const isSubmitted = (dateStr: string) => {
    return submittedDates[dateStr];
  };

  return { isSubmitted, markSubmitted };
}
