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

  return httpServer;
}
