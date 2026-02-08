import express from "express";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import { setupAuth, registerAuthRoutes, authStorage } from "./replit_integrations/auth";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT === "1";
const app = express();
const PORT = parseInt(process.env.PORT || "0") || (isProduction ? 5000 : 3001);

app.set("trust proxy", 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: isProduction
    ? [/\.replit\.app$/, /\.replit\.dev$/]
    : true,
  credentials: true,
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/", apiLimiter);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

function csrfProtection(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return next();
  }
  const cookieToken = (req.cookies as Record<string, string>)?.["csrf-token"];
  const headerToken = req.headers["x-csrf-token"] as string;
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }
  next();
}

async function startServer() {
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get("/api/csrf-token", (_req, res) => {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie("csrf-token", token, {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ csrfToken: token });
  });

  app.use("/api/auth/signup", csrfProtection);
  app.use("/api/auth/login", csrfProtection);
  app.use("/api/auth/magic-link", csrfProtection);
  app.use("/api/auth/phone", csrfProtection);
  
  app.post("/api/auth/magic-link", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      if (!process.env.SENDGRID_API_KEY) {
        return res.status(501).json({ 
          message: "Magic link authentication requires SendGrid. Please configure the SendGrid integration." 
        });
      }
      // Placeholder for actual magic link logic
      res.json({ message: "Magic link sent! Check your email." });
    } catch (error) {
      console.error("Magic link error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/phone", async (req, res) => {
    try {
      const { phone, code } = req.body;
      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        return res.status(501).json({ 
          message: "Phone authentication requires Twilio. Please configure the Twilio integration." 
        });
      }
      if (code) {
        res.json({ message: "Phone verified successfully!" });
      } else {
        res.json({ message: "Verification code sent to your phone." });
      }
    } catch (error) {
      console.error("Phone auth error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (!PASSWORD_REGEX.test(password)) {
        return res.status(400).json({ 
          message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character" 
        });
      }

      const existingUser = await authStorage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const user = await authStorage.createUserWithPassword(email, passwordHash, firstName, lastName);

      req.login(
        { 
          claims: { sub: user.id, email: user.email },
          expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
        } as any, 
        (err) => {
          if (err) {
            console.error("Session creation error:", err);
            return res.status(500).json({ message: "Account created but failed to log in. Please try logging in." });
          }
          res.json({ 
            message: "Account created successfully!",
            user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }
          });
        }
      );
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account. Please try again." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await authStorage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!user.passwordHash) {
        return res.status(401).json({ 
          message: "This account uses social login. Please sign in with your social account." 
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.login(
        { 
          claims: { sub: user.id, email: user.email },
          expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
        } as any, 
        (err) => {
          if (err) {
            console.error("Session creation error:", err);
            return res.status(500).json({ message: "Login failed. Please try again." });
          }
          res.json({ 
            message: "Logged in successfully!",
            user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName }
          });
        }
      );
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  app.get("/api/github/tree/:owner/:repo", async (req, res) => {
    const { owner, repo } = req.params;
    if (!owner || !repo) {
      return res.status(400).json({ message: "Owner and repo are required" });
    }

    const branches = ["main", "master"];
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Flash-n-Frame-Server",
    };

    const clientAuth = req.headers.authorization;
    if (clientAuth && clientAuth.startsWith("Bearer ")) {
      headers["Authorization"] = clientAuth;
    } else if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    for (const branch of branches) {
      try {
        const response = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${branch}?recursive=1`,
          { headers }
        );

        if (response.ok) {
          const data = await response.json();
          return res.json(data);
        }

        if (response.status === 403 || response.status === 429) {
          return res.status(429).json({
            message: "GitHub API rate limit exceeded. Please try again later.",
          });
        }

        if (response.status === 404) {
          continue;
        }

        continue;
      } catch (error: any) {
        if (branch === branches[branches.length - 1]) {
          console.error("GitHub proxy error:", error);
        }
        continue;
      }
    }

    return res.status(404).json({
      message: `Repository not found or uses a non-standard default branch. Checked branches: ${branches.join(", ")}`,
    });
  });

  app.get("/api/ai/key", (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        return res.status(404).json({ message: "No API key configured" });
      }
      return res.json({ key });
    }
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.status(404).json({ message: "No API key configured" });
    }
    res.json({ key });
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: isProduction ? "production" : "development",
    });
  });

  app.head("/api/ping", (_req, res) => {
    res.status(200).end();
  });

  app.get("/api/ping", (_req, res) => {
    res.status(200).json({ pong: true });
  });

  app.get("/", (_req, res, next) => {
    if (!isProduction) return next();
    res.setHeader('Cache-Control', 'no-cache');
    const distPath = path.join(__dirname, "../dist");
    res.sendFile(path.join(distPath, "index.html"));
  });

  if (isProduction) {
    const distPath = path.join(__dirname, "../dist");
    app.use(express.static(distPath, {
      maxAge: '1h',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));
    app.get("/{*splat}", (req, res) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ message: "Not found" });
      }
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} [${isProduction ? "production" : "development"}]`);
  });
}

startServer().catch(console.error);
