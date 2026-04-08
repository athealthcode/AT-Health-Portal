import type { Express } from "express";
import { type Server } from "http";
import { sbGet, sbGetRaw, sbInsert, sbPatch, sbDelete, sbRpc } from "./supabase";

// ── Field mapping: frontend key → DB column ──────────────────────────────────
const TO_DB: Record<string, string> = {
  hypertension_case: "hypertension_case_finding",
};
const FROM_DB: Record<string, string> = Object.fromEntries(
  Object.entries(TO_DB).map(([k, v]) => [v, k])
);
function mapToDb(obj: Record<string, unknown>) {
  const r: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) r[TO_DB[k] ?? k] = v;
  return r;
}
function mapFromDb(obj: Record<string, unknown>) {
  const r: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) r[FROM_DB[k] ?? k] = v;
  return r;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ── Health ────────────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // ── Org settings ──────────────────────────────────────────────────────────
  app.get("/api/org", async (_req, res) => {
    try {
      const rows = await sbGet<any[]>("org_settings", { select: "*", limit: "1" });
      res.json(rows?.[0] ?? null);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Pharmacies ────────────────────────────────────────────────────────────
  app.get("/api/pharmacies", async (_req, res) => {
    try {
      const rows = await sbGet<any[]>("pharmacies", {
        select: "id,name,slug,colour,is_active",
        "is_active": "eq.true",
        order: "name.asc",
      });
      res.json(rows ?? []);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── Auth: login ───────────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req, res) => {
    const { email } = req.body ?? {};
    if (!email) return res.status(400).json({ error: "email required" });
    try {
      const users = await sbGet<any[]>("users", {
        select: "id,email,role,scope_type,pharmacy_id,is_active",
        email: `eq.${email.trim().toLowerCase()}`,
      });
      const user = users?.[0];
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      if (!user.is_active) return res.status(401).json({ error: "Account locked" });

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Clear old unused OTPs for this user first
      await sbDelete("otp_codes", `user_id=eq.${user.id}&used_at=is.null`).catch(() => {});

      await sbInsert("otp_codes", {
        user_id: user.id,
        code: otp,
        expires_at: expiresAt,
      }, "return=minimal");

      return res.json({
        next: "mfa",
        message: `(Mock Mode) Your OTP is: ${otp}`,
        userId: user.id,
      });
    } catch (e: any) {
      console.error("login error:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  // ── Auth: verify OTP ──────────────────────────────────────────────────────
  app.post("/api/auth/verify-otp", async (req, res) => {
    const { email, otp, trustDevice } = req.body ?? {};
    if (!email || !otp) return res.status(400).json({ error: "email and otp required" });
    try {
      const users = await sbGet<any[]>("users", {
        select: "id,email,role,scope_type,pharmacy_id",
        email: `eq.${email.trim().toLowerCase()}`,
      });
      const user = users?.[0];
      if (!user) return res.status(401).json({ error: "Invalid credentials" });

      // Allow universal dev OTP
      let valid = otp === "123456";
      if (!valid) {
        const codes = await sbGet<any[]>("otp_codes", {
          select: "id,expires_at",
          user_id: `eq.${user.id}`,
          code: `eq.${otp}`,
          used_at: "is.null",
          order: "created_at.desc",
          limit: "1",
        });
        const code = codes?.[0];
        if (code && new Date(code.expires_at) > new Date()) {
          await sbPatch("otp_codes", `id=eq.${code.id}`, {
            used_at: new Date().toISOString(),
          });
          valid = true;
        }
      }
      if (!valid) return res.status(401).json({ error: "Invalid or expired OTP" });

      // Get pharmacy details
      const pharmacy = user.pharmacy_id
        ? (await sbGet<any[]>("pharmacies", {
            id: `eq.${user.pharmacy_id}`,
            select: "id,slug,name,colour",
          }))?.[0]
        : null;

      if (trustDevice) {
        const token = `tb_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        await sbInsert("trusted_browsers", {
          user_id: user.id,
          token_hash: token,
          ip_address: req.ip ?? "",
          user_agent: req.headers["user-agent"] ?? "",
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }, "return=minimal");
        res.cookie("tb", token, { httpOnly: true, secure: true, maxAge: 7 * 24 * 60 * 60 * 1000, sameSite: "lax" });
      }

      return res.json({ ok: true, user: { ...user, pharmacy } });
    } catch (e: any) {
      console.error("verify-otp error:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  // ── Auth: list staff for a user ───────────────────────────────────────────
  app.get("/api/auth/staff", async (req, res) => {
    const { email } = req.query as Record<string, string>;
    if (!email) return res.status(400).json({ error: "email required" });
    try {
      const users = await sbGet<any[]>("users", {
        select: "id",
        email: `eq.${email.trim().toLowerCase()}`,
      });
      const user = users?.[0];
      if (!user) return res.status(404).json({ error: "User not found" });
      const staff = await sbGet<any[]>("staff_members", {
        select: "id,name,role",
        user_id: `eq.${user.id}`,
        "is_active": "eq.true",
      });
      return res.json(staff ?? []);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ── Auth: verify PIN ──────────────────────────────────────────────────────
  app.post("/api/auth/verify-pin", async (req, res) => {
    const { staffId, pin } = req.body ?? {};
    if (!staffId || !pin) return res.status(400).json({ error: "staffId and pin required" });
    try {
      const verified = await sbRpc<boolean>("verify_pin", {
        p_staff_id: staffId,
        p_pin: pin,
      });
      if (!verified) return res.status(401).json({ ok: false, error: "Incorrect PIN" });
      const staff = await sbGet<any[]>("staff_members", {
        select: "id,name,role",
        id: `eq.${staffId}`,
      });
      return res.json({ ok: true, staff: staff?.[0] });
    } catch (e: any) {
      console.error("verify-pin error:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  // ── Daily figures: GET one day ────────────────────────────────────────────
  app.get("/api/figures", async (req, res) => {
    const { pharmacy_slug, date } = req.query as Record<string, string>;
    if (!pharmacy_slug || !date) return res.status(400).json({ error: "pharmacy_slug and date required" });
    try {
      const pharm = (await sbGet<any[]>("pharmacies", { select: "id", slug: `eq.${pharmacy_slug}` }))?.[0];
      if (!pharm) return res.status(404).json({ error: "Pharmacy not found" });

      const rows = await sbGet<any[]>("daily_figures", {
        select: "*",
        pharmacy_id: `eq.${pharm.id}`,
        date: `eq.${date}`,
        limit: "1",
      });
      if (!rows?.length) return res.json(null);
      return res.json(mapFromDb(rows[0]));
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ── Daily figures: UPSERT ─────────────────────────────────────────────────
  app.post("/api/figures", async (req, res) => {
    const { pharmacy_slug, date, submitted_by_id, submitted_by_name, submission_type, gap_reason, values } = req.body ?? {};
    if (!pharmacy_slug || !date) return res.status(400).json({ error: "pharmacy_slug and date required" });
    try {
      const pharm = (await sbGet<any[]>("pharmacies", { select: "id", slug: `eq.${pharmacy_slug}` }))?.[0];
      if (!pharm) return res.status(404).json({ error: "Pharmacy not found" });

      const existing = (await sbGet<any[]>("daily_figures", {
        select: "id",
        pharmacy_id: `eq.${pharm.id}`,
        date: `eq.${date}`,
      }))?.[0];

      const mappedValues = values ? mapToDb(values) : {};
      const payload: Record<string, unknown> = {
        pharmacy_id: pharm.id,
        date,
        submission_type: submission_type ?? "actual",
        submitted_by_id: submitted_by_id ?? null,
        submitted_by_name: submitted_by_name ?? null,
        submitted_at: new Date().toISOString(),
        gap_reason: gap_reason ?? null,
        updated_at: new Date().toISOString(),
        ...mappedValues,
      };

      let record;
      if (existing) {
        record = await sbPatch("daily_figures", `pharmacy_id=eq.${pharm.id}&date=eq.${date}`, payload);
      } else {
        record = await sbInsert("daily_figures", payload);
      }
      return res.json({ ok: true, record });
    } catch (e: any) {
      console.error("figures POST error:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  // ── Daily figures: GET month calendar ─────────────────────────────────────
  app.get("/api/figures/month", async (req, res) => {
    const { pharmacy_slug, month } = req.query as Record<string, string>;
    if (!pharmacy_slug || !month) return res.status(400).json({ error: "pharmacy_slug and month required" });
    try {
      const pharm = (await sbGet<any[]>("pharmacies", { select: "id", slug: `eq.${pharmacy_slug}` }))?.[0];
      if (!pharm) return res.status(404).json({ error: "Pharmacy not found" });

      const [yr, mo] = month.split("-").map(Number);
      const nextMo = mo === 12 ? `${yr + 1}-01` : `${yr}-${String(mo + 1).padStart(2, "0")}`;

      const rows = await sbGetRaw<any[]>(
        `${process.env.SUPABASE_URL ?? "https://hvrbhtabilxmptetseod.supabase.co"}/rest/v1/daily_figures?pharmacy_id=eq.${pharm.id}&date=gte.${month}-01&date=lt.${nextMo}-01&select=date,submission_type,submitted_by_name,submitted_at&order=date.asc`
      );
      return res.json(rows ?? []);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  
  // ── INCIDENTS ──────────────────────────────────────────────
  app.get("/api/incidents", async (req, res) => {
    try {
      const { pharmacy_id, status, archived } = req.query as Record<string, string>;
      let qs = `select=*&order=created_at.desc`;
      if (pharmacy_id) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&order=created_at.desc`;
      let data: any[] = await sbGetRaw(`/incidents?${qs}`);
      if (status) data = data.filter((r: any) => r.status === status);
      if (archived !== "true") data = data.filter((r: any) => !r.is_archived);
      return res.json(data);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.post("/api/incidents", async (req, res) => {
    try {
      const row = await sbInsert("incidents", req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/incidents/:id", async (req, res) => {
    try {
      const row = await sbPatch("incidents", `id=eq.${req.params.id}`, req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ── CASHING UP ─────────────────────────────────────────────
  app.get("/api/cashing-up", async (req, res) => {
    try {
      const { pharmacy_id, date, month } = req.query as Record<string, string>;
      let qs = `select=*&order=date.desc`;
      if (pharmacy_id && month) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&date=gte.${month}-01&date=lte.${month}-31&order=date.desc`;
      else if (pharmacy_id && date) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&date=eq.${date}`;
      else if (pharmacy_id) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&order=date.desc`;
      const data: any[] = await sbGetRaw(`/cashing_up?${qs}`);
      return res.json(data);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.post("/api/cashing-up", async (req, res) => {
    try {
      const row = await sbInsert("cashing_up", req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/cashing-up/:id", async (req, res) => {
    try {
      const row = await sbPatch("cashing_up", `id=eq.${req.params.id}`, req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ── BOOKKEEPING ────────────────────────────────────────────
  app.get("/api/bookkeeping", async (req, res) => {
    try {
      const { pharmacy_id, month } = req.query as Record<string, string>;
      let qs = `select=*&order=month.desc`;
      if (pharmacy_id && month) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&month=eq.${month}`;
      else if (pharmacy_id) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&order=month.desc`;
      const data: any[] = await sbGetRaw(`/bookkeeping_submissions?${qs}`);
      return res.json(data);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.post("/api/bookkeeping", async (req, res) => {
    try {
      const row = await sbInsert("bookkeeping_submissions", req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/bookkeeping/:id", async (req, res) => {
    try {
      const row = await sbPatch("bookkeeping_submissions", `id=eq.${req.params.id}`, req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ── BANKING RECONCILIATION ─────────────────────────────────
  app.get("/api/banking-reconciliation", async (req, res) => {
    try {
      const { pharmacy_id, month } = req.query as Record<string, string>;
      let qs = `select=*&order=date.desc`;
      if (pharmacy_id && month) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&date=gte.${month}-01&date=lte.${month}-31&order=date.desc`;
      else if (pharmacy_id) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&order=date.desc`;
      const data: any[] = await sbGetRaw(`/banking_reconciliation?${qs}`);
      return res.json(data);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.post("/api/banking-reconciliation", async (req, res) => {
    try {
      const row = await sbInsert("banking_reconciliation", req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/banking-reconciliation/:id", async (req, res) => {
    try {
      const row = await sbPatch("banking_reconciliation", `id=eq.${req.params.id}`, req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ── PQS PROGRESS ───────────────────────────────────────────
  app.get("/api/pqs", async (req, res) => {
    try {
      const { pharmacy_id } = req.query as Record<string, string>;
      const qs = pharmacy_id ? `select=*&pharmacy_id=eq.${pharmacy_id}&order=criteria_id.asc` : `select=*&order=criteria_id.asc`;
      const data: any[] = await sbGetRaw(`/pqs_progress?${qs}`);
      return res.json(data);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.post("/api/pqs", async (req, res) => {
    try {
      const row = await sbInsert("pqs_progress", req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/pqs/:id", async (req, res) => {
    try {
      const row = await sbPatch("pqs_progress", `id=eq.${req.params.id}`, req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ── BONUS MONTHS ───────────────────────────────────────────
  app.get("/api/bonus-months", async (req, res) => {
    try {
      const { pharmacy_id, month } = req.query as Record<string, string>;
      let qs = `select=*&order=month.desc`;
      if (pharmacy_id && month) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&month=eq.${month}`;
      else if (pharmacy_id) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&order=month.desc`;
      const data: any[] = await sbGetRaw(`/bonus_months?${qs}`);
      return res.json(data);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.post("/api/bonus-months", async (req, res) => {
    try {
      const row = await sbInsert("bonus_months", req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/bonus-months/:id", async (req, res) => {
    try {
      const row = await sbPatch("bonus_months", `id=eq.${req.params.id}`, req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ── MONTHLY CLOSE ──────────────────────────────────────────
  app.get("/api/monthly-close", async (req, res) => {
    try {
      const { pharmacy_id, month } = req.query as Record<string, string>;
      let qs = `select=*&order=month.desc`;
      if (pharmacy_id && month) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&month=eq.${month}`;
      else if (pharmacy_id) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&order=month.desc`;
      const data: any[] = await sbGetRaw(`/monthly_close?${qs}`);
      return res.json(data);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.post("/api/monthly-close", async (req, res) => {
    try {
      const row = await sbInsert("monthly_close", req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/monthly-close/:id", async (req, res) => {
    try {
      const row = await sbPatch("monthly_close", `id=eq.${req.params.id}`, req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ── COMPLIANCE ─────────────────────────────────────────────
  app.get("/api/compliance", async (req, res) => {
    try {
      const { pharmacy_id, month } = req.query as Record<string, string>;
      let qs = `select=*&order=created_at.desc`;
      if (pharmacy_id && month) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&month=eq.${month}`;
      else if (pharmacy_id) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&order=created_at.desc`;
      const data: any[] = await sbGetRaw(`/compliance_items?${qs}`);
      return res.json(data);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.post("/api/compliance", async (req, res) => {
    try {
      const row = await sbInsert("compliance_items", req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/compliance/:id", async (req, res) => {
    try {
      const row = await sbPatch("compliance_items", `id=eq.${req.params.id}`, req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ── STOCK TRANSFER ────────────────────────────────────────
  app.get("/api/stock-transfer", async (req, res) => {
    try {
      const { pharmacy_id, from_pharmacy_id } = req.query as Record<string, string>;
      let qs = `select=*&order=created_at.desc`;
      if (pharmacy_id) qs = `select=*&or=(from_pharmacy_id.eq.${pharmacy_id},to_pharmacy_id.eq.${pharmacy_id})&order=created_at.desc`;
      else if (from_pharmacy_id) qs = `select=*&from_pharmacy_id=eq.${from_pharmacy_id}&order=created_at.desc`;
      const data: any[] = await sbGetRaw(`/stock_transfers?${qs}`);
      return res.json(data);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.post("/api/stock-transfer", async (req, res) => {
    try {
      const row = await sbInsert("stock_transfers", req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/stock-transfer/:id", async (req, res) => {
    try {
      const row = await sbPatch("stock_transfers", `id=eq.${req.params.id}`, req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ── STAFF (admin) ──────────────────────────────────────────
  app.get("/api/staff", async (req, res) => {
    try {
      const { pharmacy_id } = req.query as Record<string, string>;
      const qs = pharmacy_id ? `select=*&pharmacy_id=eq.${pharmacy_id}&order=name.asc` : `select=*,pharmacies(name)&order=name.asc`;
      const data: any[] = await sbGetRaw(`/staff_members?${qs}`);
      return res.json(data);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/staff/:id", async (req, res) => {
    try {
      const row = await sbPatch("staff_members", `id=eq.${req.params.id}`, req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ── DOCUMENTS ─────────────────────────────────────────────
  app.get("/api/documents", async (req, res) => {
    try {
      const { pharmacy_id, category } = req.query as Record<string, string>;
      let qs = `select=*&order=created_at.desc`;
      if (pharmacy_id && category) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&category=eq.${category}&order=created_at.desc`;
      else if (pharmacy_id) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&order=created_at.desc`;
      const data: any[] = await sbGetRaw(`/documents?${qs}`);
      return res.json(data);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const row = await sbInsert("documents", req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      await sbDelete("documents", `id=eq.${req.params.id}`);
      return res.json({ success: true });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ── REPORTS ───────────────────────────────────────────────
  app.get("/api/reports", async (req, res) => {
    try {
      const { pharmacy_id, type } = req.query as Record<string, string>;
      let qs = `select=*&order=created_at.desc`;
      if (pharmacy_id && type) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&type=eq.${type}&order=created_at.desc`;
      else if (pharmacy_id) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&order=created_at.desc`;
      const data: any[] = await sbGetRaw(`/reports?${qs}`);
      return res.json(data);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.post("/api/reports", async (req, res) => {
    try {
      const row = await sbInsert("reports", req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ── PRIVATE CLINIC ─────────────────────────────────────────
  app.get("/api/private-clinic", async (req, res) => {
    try {
      const { pharmacy_id, month } = req.query as Record<string, string>;
      let qs = `select=*&order=date.desc`;
      if (pharmacy_id && month) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&date=gte.${month}-01&date=lte.${month}-31&order=date.desc`;
      else if (pharmacy_id) qs = `select=*&pharmacy_id=eq.${pharmacy_id}&order=date.desc`;
      const data: any[] = await sbGetRaw(`/private_clinic_services?${qs}`);
      return res.json(data);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.post("/api/private-clinic", async (req, res) => {
    try {
      const row = await sbInsert("private_clinic_services", req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/private-clinic/:id", async (req, res) => {
    try {
      const row = await sbPatch("private_clinic_services", `id=eq.${req.params.id}`, req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  // ── EXCEPTIONS ────────────────────────────────────────────
  app.get("/api/exceptions", async (req, res) => {
    try {
      const { pharmacy_id } = req.query as Record<string, string>;
      const qs = pharmacy_id ? `select=*&pharmacy_id=eq.${pharmacy_id}&order=created_at.desc` : `select=*&order=created_at.desc`;
      const data: any[] = await sbGetRaw(`/exceptions?${qs}`);
      return res.json(data);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.post("/api/exceptions", async (req, res) => {
    try {
      const row = await sbInsert("exceptions", req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });

  app.patch("/api/exceptions/:id", async (req, res) => {
    try {
      const row = await sbPatch("exceptions", `id=eq.${req.params.id}`, req.body);
      return res.json(row);
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  });


  return httpServer;
}
