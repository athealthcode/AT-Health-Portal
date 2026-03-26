import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine);
    }
  });

  next();
});

const httpServer = createServer(app);

// Lazy initialization — no module-level async, safe for Vercel cold starts
let _initPromise: Promise<void> | null = null;

function ensureInitialized(): Promise<void> {
  if (!_initPromise) {
    _initPromise = (async () => {
      await registerRoutes(httpServer, app);
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        if (!res.headersSent) {
          res.status(status).json({ message });
        }
        console.error("[error]", err);
      });
      if (!process.env.VERCEL) {
        if (process.env.NODE_ENV === "production") {
          const { serveStatic } = await import("./static");
          serveStatic(app);
        } else {
          const { setupVite } = await import("./vite");
          await setupVite(httpServer, app);
        }
        const port = parseInt(process.env.PORT || "5000", 10);
        httpServer.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
          console.log(`serving on port ${port}`);
        });
      }
    })();
  }
  return _initPromise;
}

export default async function handler(req: any, res: any) {
  try {
    await ensureInitialized();
  } catch (err: any) {
    console.error("[handler] init failed:", err?.message, err?.stack);
    if (!res.headersSent) {
      res.status(500).json({ phase: "init", error: String(err), stack: err?.stack });
    }
    return;
  }
  return app(req, res);
}

if (!process.env.VERCEL) {
  ensureInitialized().catch((err) => {
    console.error("Fatal server error:", err);
    process.exit(1);
  });
}
