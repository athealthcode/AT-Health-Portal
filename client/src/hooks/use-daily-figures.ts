import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/state/auth";

export type FiguresRecord = {
  user: string;
  timestamp: number;
  status?: "not_completed";
  reason?: string;
  values: Record<string, string | number>;
};

/** Fetches & saves daily figures for the current pharmacy + date via the real API. */
export function useDailyFigures(formattedDate: string | null) {
  const { session } = useAuth();
  const pharmacySlug =
    session.scope.type === "pharmacy" ? session.scope.pharmacyId : null;

  const [record, setRecord] = useState<FiguresRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!formattedDate || !pharmacySlug) { setRecord(null); return; }
    setLoading(true);
    fetch(`/api/figures?pharmacy_slug=${pharmacySlug}&date=${formattedDate}`)
      .then(r => r.json())
      .then((data: any) => {
        if (!data) { setRecord(null); return; }
        // Map DB row → FiguresRecord shape expected by the page
        const { id, pharmacy_id, date, submission_type, submitted_by_name, submitted_at,
                is_locked, locked_at, locked_by_id, gap_reason, created_at, updated_at,
                ...valueFields } = data;
        setRecord({
          user: submitted_by_name ?? "Unknown",
          timestamp: submitted_at ? new Date(submitted_at).getTime() : Date.now(),
          status: submission_type === "authorised_gap" ? "not_completed" : undefined,
          reason: gap_reason ?? undefined,
          values: valueFields,
        });
      })
      .catch(() => setRecord(null))
      .finally(() => setLoading(false));
  }, [formattedDate, pharmacySlug]);

  const saveActual = useCallback(async (values: Record<string, string | number>) => {
    if (!formattedDate || !pharmacySlug) return;
    await fetch("/api/figures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pharmacy_slug: pharmacySlug,
        date: formattedDate,
        submitted_by_id: session.staff?.id ?? null,
        submitted_by_name: session.staff?.name ?? session.userEmail ?? "Unknown",
        submission_type: "actual",
        values,
      }),
    });
    setRecord({
      user: session.staff?.name ?? session.userEmail ?? "Unknown",
      timestamp: Date.now(),
      values,
    });
  }, [formattedDate, pharmacySlug, session]);

  const saveGap = useCallback(async (reason: string) => {
    if (!formattedDate || !pharmacySlug) return;
    await fetch("/api/figures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pharmacy_slug: pharmacySlug,
        date: formattedDate,
        submitted_by_id: session.staff?.id ?? null,
        submitted_by_name: session.staff?.name ?? session.userEmail ?? "Unknown",
        submission_type: "authorised_gap",
        gap_reason: reason,
        values: {},
      }),
    });
    setRecord({
      user: session.staff?.name ?? session.userEmail ?? "Unknown",
      timestamp: Date.now(),
      status: "not_completed",
      reason,
      values: {},
    });
  }, [formattedDate, pharmacySlug, session]);

  return { record, loading, saveActual, saveGap };
}
